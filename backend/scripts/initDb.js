require('dotenv').config();
const { sequelize, User, Area, Seat, Rule, SystemLog } = require('../src/models');

async function initDb() {
  try {
    await sequelize.sync({ force: true });
    console.log('Tables created successfully');

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
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

initDb();