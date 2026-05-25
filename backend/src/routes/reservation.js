const express = require('express');
const { body, validationResult } = require('express-validator');
const { Reservation, Seat, Area, User, Rule } = require('../models');
const auth = require('../middlewares/auth');
const response = require('../utils/response');

const router = express.Router();

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const getRule = async (key) => {
  const rule = await Rule.findOne({ where: { rule_key: key } });
  return rule ? rule.rule_value : null;
};

// 自动处理超时未签到
const checkTimeouts = async () => {
  try {
    const checkinLimit = await getRule('checkin_time_limit') || 15;
    const now = new Date();
    
    // 查找所有已过签到时限且仍为待签到状态的预约
    const { Violation } = require('../models');
    
    // 逻辑：当前时间 > 预约开始时间 + checkinLimit
    const reservations = await Reservation.findAll({
      where: { status: 'reserved' }
    });

    for (const res of reservations) {
      const startTime = new Date(`${res.date}T${res.start_time}`);
      const deadline = new Date(startTime.getTime() + checkinLimit * 60000);
      
      if (now > deadline) {
        // 标记违约
        await res.update({ status: 'violated' });
        // 释放座位
        await Seat.update({ status: 'available' }, { where: { id: res.seat_id } });
        
        // 增加用户违约计数并创建记录
        const user = await User.findByPk(res.user_id);
        if (user) {
          // 如果是管理员或超级管理员，虽然标记违约但不计入信用惩罚（可选逻辑）
          // 但根据用户反馈，他们可能希望看到记录
          await user.increment('violation_count');
          await Violation.create({
            user_id: user.id,
            reservation_id: res.id,
            type: 'no_checkin',
            description: `预约（${res.date} ${res.start_time.substring(0, 5)}）未按时签到`
          });
          console.log(`Violation recorded for user ${user.username}`);
        }
      }
    }
  } catch (err) {
    console.error('CheckTimeouts error:', err);
  }
};

router.post('/',
  auth,
  [
    body('seat_id').isInt().withMessage('座位ID无效'),
    body('date').isDate().withMessage('日期无效'),
    body('start_time').notEmpty().withMessage('开始时间不能为空'),
    body('end_time').notEmpty().withMessage('结束时间不能为空')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(response.fail(errors.array()[0].msg));
    }
    try {
      const { seat_id, date, start_time, end_time } = req.body;
      const userId = req.user.id;

      // 0. 时间校验：不能预约过去的时间
      const now = new Date();
      const bookingStart = new Date(`${date}T${start_time}`);
      if (bookingStart < now) {
        return res.status(400).json(response.fail('不能预约过去的时间段'));
      }

      const seat = await Seat.findByPk(seat_id);
      if (!seat) {
        return res.status(404).json(response.notFound('座位不存在'));
      }
      if (seat.status !== 'available') {
        return res.status(400).json(response.fail('座位不可预约'));
      }

      const maxDuration = await getRule('max_reservation_duration') || 4;
      const startParts = start_time.split(':');
      const endParts = end_time.split(':');
      const duration = (parseInt(endParts[0]) - parseInt(startParts[0])) + (parseInt(endParts[1]) - parseInt(startParts[1])) / 60;
      
      if (duration <= 0) {
        return res.status(400).json(response.fail('结束时间必须晚于开始时间'));
      }
      if (duration > parseInt(maxDuration)) {
        return res.status(400).json(response.fail(`预约时长不能超过${maxDuration}小时`));
      }

      const existing = await Reservation.findOne({
        where: {
          seat_id,
          date,
          status: ['reserved', 'checked_in']
        }
      });
      if (existing) {
        return res.status(400).json(response.fail('该时段已被预约'));
      }

      const reservation = await Reservation.create({
        user_id: userId,
        seat_id,
        date,
        start_time,
        end_time,
        status: 'reserved',
        code: generateCode()
      });

      res.status(201).json(response.success({
        id: reservation.id,
        seat_no: seat.seat_no,
        date,
        start_time,
        end_time,
        status: reservation.status
      }, '预约成功'));
    } catch (error) {
      next(error);
    }
  }
);

// 获取当前用户的预约列表
router.get('/me', auth, async (req, res, next) => {
  try {
    await checkTimeouts();
    const { status, date, page = 1, page_size = 10 } = req.query;
    const where = { user_id: req.user.id };
    if (status) where.status = status;
    if (date) where.date = date;

    const { count, rows } = await Reservation.findAndCountAll({
      where,
      limit: parseInt(page_size),
      offset: (parseInt(page) - 1) * parseInt(page_size),
      order: [['createdAt', 'DESC']]
    });

    const checkinLimit = await getRule('checkin_time_limit') || 15;
    const list = await Promise.all(rows.map(async r => {
      const seat = await Seat.findByPk(r.seat_id, { include: [{ model: Area, as: 'area' }] });
      return {
        id: r.id,
        seat_no: seat?.seat_no,
        area_name: seat?.area?.name,
        date: r.date,
        start_time: r.start_time,
        end_time: r.end_time,
        status: r.status,
        checkin_deadline: r.status === 'reserved' ? checkinLimit : null
      };
    }));

    res.json(response.success({ list, total: count, page: parseInt(page), page_size: parseInt(page_size) }));
  } catch (error) {
    next(error);
  }
});

// 获取所有预约列表 (管理员)
router.get('/all', auth, async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json(response.forbidden('无权限'));
    }
    await checkTimeouts();
    const { status, date, page = 1, page_size = 10, username } = req.query;
    const where = {};
    if (status) where.status = status;
    if (date) where.date = date;
    
    // 如果提供了用户名，进行过滤
    if (username) {
      const user = await User.findOne({ where: { username } });
      if (user) where.user_id = user.id;
      else where.user_id = 0; // 找不到用户则返回空
    }

    const { count, rows } = await Reservation.findAndCountAll({
      where,
      limit: parseInt(page_size),
      offset: (parseInt(page) - 1) * parseInt(page_size),
      order: [['createdAt', 'DESC']]
    });

    const checkinLimit = await getRule('checkin_time_limit') || 15;
    const list = await Promise.all(rows.map(async r => {
      const seat = await Seat.findByPk(r.seat_id, { include: [{ model: Area, as: 'area' }] });
      const user = await User.findByPk(r.user_id, { attributes: ['id', 'username'] });
      return {
        id: r.id,
        user_id: r.user_id,
        username: user?.username,
        seat_no: seat?.seat_no,
        area_name: seat?.area?.name,
        date: r.date,
        start_time: r.start_time,
        end_time: r.end_time,
        status: r.status,
        checkin_deadline: r.status === 'reserved' ? checkinLimit : null
      };
    }));

    res.json(response.success({ list, total: count, page: parseInt(page), page_size: parseInt(page_size) }));
  } catch (error) {
    next(error);
  }
});

router.get('/', auth, async (req, res, next) => {
  try {
    await checkTimeouts(); // 触发检查
    const isStudent = req.user.role === 'student';
    const { status, date, page = 1, page_size = 10 } = req.query;
    
    //Admin gets all reservations, student gets only their own
    let where = {};
    if (isStudent) {
      where = { user_id: req.user.id };
    }
    if (status) where.status = status;
    if (date) where.date = date;

    //Direct DB query for debugging
    const { sequelize } = require('../models');
    const rawResults = await sequelize.query("SELECT id, user_id, status FROM reservations");
    console.log('Raw DB results:', rawResults[0]);

    const { count, rows } = await Reservation.findAndCountAll({
      where,
      limit: parseInt(page_size),
      offset: (parseInt(page) - 1) * parseInt(page_size),
      order: [['createdAt', 'DESC']]
    });

    const checkinLimit = await getRule('checkin_time_limit') || 15;
    const list = await Promise.all(rows.map(async r => {
      const seat = await Seat.findByPk(r.seat_id, { include: [{ model: Area, as: 'area' }] });
      const user = await User.findByPk(r.user_id, { attributes: ['id', 'username'] });
      return {
        id: r.id,
        user_id: r.user_id,
        username: user?.username,
        seat_no: seat?.seat_no,
        area_name: seat?.area?.name,
        date: r.date,
        start_time: r.start_time,
        end_time: r.end_time,
        status: r.status,
        checkin_deadline: r.status === 'reserved' ? checkinLimit : null
      };
    }));

    res.json(response.success({ list, total: count, page: parseInt(page), page_size: parseInt(page_size) }));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id, {
      include: [
        { model: Seat, include: [{ model: Area, as: 'area', attributes: ['name'] }] }
      ]
    });
    if (!reservation) {
      return res.status(404).json(response.notFound('预约不存在'));
    }
    if (reservation.user_id !== req.user.id && req.user.role === 'student') {
      return res.status(403).json(response.forbidden('无权限'));
    }
    res.json(response.success(reservation));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/checkin', auth, async (req, res, next) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    if (!reservation) {
      return res.status(404).json(response.notFound('预约不存在'));
    }
    if (reservation.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json(response.forbidden('无权限'));
    }
    if (reservation.status !== 'reserved') {
      return res.status(400).json(response.fail('预约状态不可签到'));
    }

    // 校验签到时间：不能提前签到（允许提前缓冲）
    const now = new Date();
    const startTime = new Date(`${reservation.date}T${reservation.start_time}`);
    const earlyLimitMinutes = await getRule('early_checkin_limit') || 15;
    const EARLY_LIMIT = parseInt(earlyLimitMinutes) * 60 * 1000;
    if (now < new Date(startTime.getTime() - EARLY_LIMIT)) {
      const minutesLeft = Math.ceil((startTime.getTime() - EARLY_LIMIT - now.getTime()) / 60000);
      return res.status(400).json(response.fail(`签到未开始，请在预约开始前${earlyLimitMinutes}分钟内再试（还需等待约${minutesLeft}分钟）`));
    }

    await reservation.update({ status: 'checked_in', checkin_time: new Date() });
    await Seat.update({ status: 'in_use' }, { where: { id: reservation.seat_id } });

    res.json(response.success(null, '签到成功'));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/cancel', auth, async (req, res, next) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    if (!reservation) {
      return res.status(404).json(response.notFound('预约不存在'));
    }
    if (reservation.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json(response.forbidden('无权限'));
    }
    if (reservation.status !== 'reserved') {
      return res.status(400).json(response.fail('只能取消待签到的预约'));
    }

    await reservation.update({ status: 'cancelled' });
    await Seat.update({ status: 'available' }, { where: { id: reservation.seat_id } });

    res.json(response.success(null, '取消成功'));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/release', auth, async (req, res, next) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    if (!reservation) {
      return res.status(404).json(response.notFound('预约不存在'));
    }
    if (reservation.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json(response.forbidden('无权限'));
    }
    if (reservation.status !== 'checked_in') {
      return res.status(400).json(response.fail('只能释放使用中的预约'));
    }

    await reservation.update({ status: 'completed' });
    await Seat.update({ status: 'available' }, { where: { id: reservation.seat_id } });

    res.json(response.success(null, '释放成功'));
  } catch (error) {
    next(error);
  }
});

module.exports = router;