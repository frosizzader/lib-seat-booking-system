require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./middlewares/logger');

const app = express();
const PORT = process.env.PORT || 300;

app.use(helmet());
app.use(cors({
  origin: ['https://lib-seat-booking-system-production-6d43.up.railway.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.use('/api/v1', routes);

app.get('/health', (req, res) => {
  res.json({ code: 200, message: 'OK', data: { status: 'running' } });
});

app.get('/admin-test-reservations', async (req, res) => {
  const { Reservation, User, Seat, Area } = require('./models');
  const all = await Reservation.findAll();
  res.json({ count: all.length, data: all.map(r => ({id:r.id, user_id:r.user_id, status:r.status})) });
});

// 初始化数据库表
const { sequelize, Area, Seat, User, Rule } = require('./models');
let dbSyncStatus = 'pending';
let dbSyncError = null;
sequelize.sync({ alter: true }).then(async () => {
  dbSyncStatus = 'synced';
  console.log('Database tables synced');

  // 检查是否需要初始化数据
  const areaCount = await Area.count();
  if (areaCount === 0) {
    console.log('Initializing test data...');
    const areas = await Area.bulkCreate([
      { name: '一楼阅览室', floor: 1, open_time: '08:00:00', close_time: '22:00:00', status: 'open' },
      { name: '二楼阅览室', floor: 2, open_time: '08:00:00', close_time: '22:00:00', status: 'open' },
      { name: '三楼阅览室', floor: 3, open_time: '08:00:00', close_time: '22:00:00', status: 'open' }
    ]);

    const seats = [];
    for (const area of areas) {
      for (let i = 1; i <= 10; i++) {
        seats.push({
          seat_no: `${area.floor}0${i}`,
          area_id: area.id,
          floor: area.floor,
          status: 'available',
          has_power: i % 3 === 0,
          has_window: i % 2 === 0
        });
      }
    }
    await Seat.bulkCreate(seats);

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('123456', 10);
    await User.create({
      username: 'admin',
      password: hashedPassword,
      real_name: '系统管理员',
      role: 'super_admin',
      status: 'active'
    });

    await Rule.bulkCreate([
      { rule_key: 'max_reservation_duration', rule_value: '4', description: '最长预约时长（小时）' },
      { rule_key: 'checkin_time_limit', rule_value: '15', description: '签到时限（分钟）' },
      { rule_key: 'early_checkin_limit', rule_value: '15', description: '允许提前签到时间（分钟）' },
      { rule_key: 'advance_booking_days', rule_value: '3', description: '提前预约天数' }
    ]);

    console.log('Test data initialized');
  }
}).catch(err => {
  dbSyncStatus = 'error';
  dbSyncError = err.message;
  console.error('Database sync error:', err);
});

app.get('/db-status', (req, res) => {
  res.json({ code: 200, status: dbSyncStatus, error: dbSyncError, env: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER
  }});
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;