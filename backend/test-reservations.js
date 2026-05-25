require('dotenv').config();
const { User, Reservation, Seat, Area } = require('./src/models');

(async () => {
  try {
    const reservations = await Reservation.findAll({});
    console.log('Total reservations in DB:', reservations.length);
    reservations.forEach(r => {
      console.log(`ID: ${r.id}, UserID: ${r.user_id}, SeatID: ${r.seat_id}, Status: ${r.status}, Date: ${r.date}`);
    });
    
    console.log('\n--- Testing as admin ---');
    const admin = await User.findOne({ where: { username: 'admin' } });
    console.log('Admin user:', admin?.id, admin?.role);
    
    const adminReservations = await Reservation.findAll({ where: {} });
    console.log('All reservations (no filter):', adminReservations.length);
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();