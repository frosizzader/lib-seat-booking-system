const express = require('express');
const { body, validationResult } = require('express-validator');
const { Seat, Area } = require('../models');
const auth = require('../middlewares/auth');
const response = require('../utils/response');

const router = express.Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const { area_id, floor, status, page = 1, page_size = 20 } = req.query;
    const where = {};
    if (area_id) where.area_id = area_id;
    if (floor) where.floor = floor;
    if (status) where.status = status;

    const { count, rows } = await Seat.findAndCountAll({
      where,
      include: [{ model: Area, as: 'area', attributes: ['name'] }],
      limit: parseInt(page_size),
      offset: (parseInt(page) - 1) * parseInt(page_size),
      order: [['id', 'ASC']]
    });

    const list = rows.map(seat => ({
      id: seat.id,
      seat_no: seat.seat_no,
      area_id: seat.area_id,
      area_name: seat.area?.name,
      floor: seat.floor,
      status: seat.status,
      has_power: seat.has_power,
      has_window: seat.has_window
    }));

    res.json(response.success({ list, total: count, page: parseInt(page), page_size: parseInt(page_size) }));
  } catch (error) {
    next(error);
  }
});

router.get('/areas', auth, async (req, res, next) => {
  try {
    const areas = await Area.findAll({
      attributes: ['id', 'name', 'floor', 'open_time', 'close_time', 'status'],
      order: [['floor', 'ASC'], ['name', 'ASC']]
    });
    res.json(response.success(areas));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    const seat = await Seat.findByPk(req.params.id, {
      include: [{ model: Area, as: 'area', attributes: ['name'] }]
    });
    if (!seat) {
      return res.status(404).json(response.notFound('座位不存在'));
    }
    res.json(response.success({
      id: seat.id,
      seat_no: seat.seat_no,
      area_id: seat.area_id,
      area_name: seat.area?.name,
      floor: seat.floor,
      status: seat.status,
      has_power: seat.has_power,
      has_window: seat.has_window,
      description: seat.description
    }));
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json(response.forbidden('需要管理员权限'));
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(response.fail(errors.array()[0].msg));
    }
    const { seat_no, area_id, floor, has_power, has_window, description } = req.body;
    const seat = await Seat.create({ seat_no, area_id, floor, has_power, has_window, description });
    res.status(201).json(response.success(seat, '添加成功'));
  } catch (error) {
    next(error);
  }
}, [
  body('seat_no').notEmpty().withMessage('座位号不能为空'),
  body('area_id').isInt().withMessage('区域ID无效'),
  body('floor').isInt().withMessage('楼层无效')
]);

router.put('/:id', auth, async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json(response.forbidden('需要管理员权限'));
    }
    const seat = await Seat.findByPk(req.params.id);
    if (!seat) {
      return res.status(404).json(response.notFound('座位不存在'));
    }
    const { seat_no, area_id, floor, status, has_power, has_window, description } = req.body;
    await seat.update({ seat_no, area_id, floor, status, has_power, has_window, description });
    res.json(response.success(seat, '更新成功'));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json(response.forbidden('需要管理员权限'));
    }
    const seat = await Seat.findByPk(req.params.id);
    if (!seat) {
      return res.status(404).json(response.notFound('座位不存在'));
    }
    await seat.destroy();
    res.json(response.success(null, '删除成功'));
  } catch (error) {
    next(error);
  }
});

module.exports = router;