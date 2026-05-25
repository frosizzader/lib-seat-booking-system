const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config.development);

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  real_name: { type: DataTypes.STRING(50), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  email: { type: DataTypes.STRING(100) },
  role: { type: DataTypes.ENUM('student', 'admin', 'super_admin'), defaultValue: 'student' },
  status: { type: DataTypes.ENUM('active', 'banned'), defaultValue: 'active' },
  violation_count: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'users', timestamps: true });

const Area = sequelize.define('Area', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), allowNull: false },
  floor: { type: DataTypes.INTEGER, allowNull: false },
  open_time: { type: DataTypes.TIME, allowNull: false },
  close_time: { type: DataTypes.TIME, allowNull: false },
  status: { type: DataTypes.ENUM('open', 'closed'), defaultValue: 'open' }
}, { tableName: 'areas', timestamps: true, underscored: true });

const Seat = sequelize.define('Seat', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  seat_no: { type: DataTypes.STRING(20), allowNull: false },
  area_id: { type: DataTypes.INTEGER, allowNull: false },
  floor: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('available', 'reserved', 'in_use', 'maintenance'), defaultValue: 'available' },
  has_power: { type: DataTypes.BOOLEAN, defaultValue: false },
  has_window: { type: DataTypes.BOOLEAN, defaultValue: false },
  description: { type: DataTypes.TEXT }
}, { tableName: 'seats', timestamps: true });

const Reservation = sequelize.define('Reservation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  seat_id: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  start_time: { type: DataTypes.TIME, allowNull: false },
  end_time: { type: DataTypes.TIME, allowNull: false },
  status: { type: DataTypes.ENUM('reserved', 'checked_in', 'completed', 'cancelled', 'violated'), defaultValue: 'reserved' },
  checkin_time: { type: DataTypes.DATE },
  code: { type: DataTypes.STRING(6) }
}, { tableName: 'reservations', timestamps: true });

const Violation = sequelize.define('Violation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  reservation_id: { type: DataTypes.INTEGER },
  type: { type: DataTypes.ENUM('no_checkin', 'early_leave', 'no_release'), allowNull: false },
  description: { type: DataTypes.TEXT }
}, { tableName: 'violations', timestamps: true });

const Rule = sequelize.define('Rule', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  rule_key: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  rule_value: { type: DataTypes.TEXT, allowNull: false },
  description: { type: DataTypes.TEXT }
}, { tableName: 'rules', timestamps: true });

const SystemLog = sequelize.define('SystemLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER },
  action: { type: DataTypes.STRING(50), allowNull: false },
  detail: { type: DataTypes.TEXT },
  ip: { type: DataTypes.STRING(50) }
}, { tableName: 'system_logs', timestamps: true });

User.hasMany(Reservation, { foreignKey: 'user_id' });
Reservation.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Violation, { foreignKey: 'user_id' });
Violation.belongsTo(User, { foreignKey: 'user_id' });
Seat.hasMany(Reservation, { foreignKey: 'seat_id' });
Reservation.belongsTo(Seat, { foreignKey: 'seat_id' });
Area.hasMany(Seat, { foreignKey: 'area_id' });
Seat.belongsTo(Area, { as: 'area', foreignKey: 'area_id' });
Reservation.hasMany(Violation, { foreignKey: 'reservation_id' });
Violation.belongsTo(Reservation, { foreignKey: 'reservation_id' });
User.hasMany(SystemLog, { foreignKey: 'user_id' });
SystemLog.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { sequelize, User, Area, Seat, Reservation, Violation, Rule, SystemLog };