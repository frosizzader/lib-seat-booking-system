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
const { sequelize } = require('./models');
let dbSyncStatus = 'pending';
let dbSyncError = null;
sequelize.sync({ alter: true }).then(() => {
  dbSyncStatus = 'synced';
  console.log('Database tables synced');
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