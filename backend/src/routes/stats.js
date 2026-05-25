const express = require('express');
const { Op } = require('sequelize');
const { Reservation, Seat, Area, Violation, User } = require('../models');
const auth = require('../middlewares/auth');
const response = require('../utils/response');

const router = express.Router();

router.get('/overview', auth, async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [todayRes, totalSeats, availableSeats, violations] = await Promise.all([
      Reservation.count({ where: { date: today, status: { [Op.ne]: 'cancelled' } } }),
      Seat.count(),
      Seat.count({ where: { status: 'available' } }),
      Violation.count({ where: { createdAt: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) } } })
    ]);

    const occupancyRate = totalSeats > 0 ? ((totalSeats - availableSeats) / totalSeats * 100).toFixed(1) : 0;
    res.json(response.success({
      today_reservations: todayRes,
      today_checkins: todayRes,
      today_violations: violations,
      total_seats: totalSeats,
      available_seats: availableSeats,
      occupancy_rate: parseFloat(occupancyRate)
    }));
  } catch (error) {
    next(error);
  }
});

router.get('/usage', auth, async (req, res, next) => {
  try {
    const { start_date, end_date, area_id } = req.query;
    const where = {};
    if (area_id) where.area_id = area_id;
    
    const seats = await Seat.findAll({
      where: where.area_id ? { area_id } : {}
    });

    const totalSeats = seats.length;
    const bookedSeats = seats.filter(s => s.status !== 'available').length;
    const occupancyRate = totalSeats > 0 ? (bookedSeats / totalSeats * 100).toFixed(1) : 0;

    const areas = await Area.findAll(area_id ? { where: { id: area_id } } : {});
    const areasData = await Promise.all(areas.map(async area => {
      const reservationWhere = { status: { [Op.ne]: 'cancelled' } };
      if (start_date || end_date) {
        reservationWhere.date = {};
        if (start_date) reservationWhere.date[Op.gte] = start_date;
        if (end_date) reservationWhere.date[Op.lte] = end_date;
      }
      
      const seatsInArea = await Seat.findAll({ 
        where: { area_id: area.id },
        attributes: ['id'] 
      });
      const seatIds = seatsInArea.map(s => s.id);
      
      const count = await Reservation.count({
        where: {
          ...reservationWhere,
          seat_id: seatIds
        }
      });
      return {
        area_name: area.name,
        total_bookings: count
      };
    }));

    res.json(response.success({
      areas: areasData,
      occupancy_rate: parseFloat(occupancyRate),
      total_seats: totalSeats
    }));
  } catch (error) {
    next(error);
  }
});

router.get('/trend', auth, async (req, res, next) => {
  try {
    const { type = 'daily', days = 7 } = req.query;
    const labels = [];
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = await Reservation.count({
        where: { date: dateStr, status: { [Op.ne]: 'cancelled' } }
      });
      
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      labels.push(type === 'daily' ? dayNames[date.getDay()] : dateStr.substring(5));
      data.push(count);
    }

    res.json(response.success({ labels, data }));
  } catch (error) {
    next(error);
  }
});

router.get('/all-reservations', auth, async (req, res, next) => {
  try {
    const reservations = await Reservation.findAll({
      order: [['createdAt', 'DESC']]
    });
    const list = await Promise.all(reservations.map(async r => {
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
        status: r.status
      };
    }));
    res.json(response.success(list));
  } catch (error) {
    next(error);
  }
});

router.get('/violations', auth, async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json(response.forbidden('需要管理员权限'));
    }
    const reservations = await Reservation.findAll({ order: [['createdAt', 'DESC']] });
    const list = await Promise.all(reservations.map(async r => {
      const seat = await Seat.findByPk(r.seat_id, { include: [{ model: Area, as: 'area' }] });
      const user = await User.findByPk(r.user_id, { attributes: ['id', 'username'] });
      return {
        id: r.id, user_id: r.user_id, username: user?.username,
        seat_no: seat?.seat_no, area_name: seat?.area?.name,
        date: r.date, start_time: r.start_time, end_time: r.end_time, status: r.status
      };
    }));
    res.json(response.success(list));
  } catch (error) {
    next(error);
  }
});

module.exports = router;