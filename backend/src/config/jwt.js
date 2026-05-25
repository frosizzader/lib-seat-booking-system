require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'your_jwt_secret_key_at_least_256_bits_long',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
};