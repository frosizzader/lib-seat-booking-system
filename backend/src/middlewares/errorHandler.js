const response = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json(response.fail(err.errors.map(e => e.message).join(', ')));
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json(response.fail('数据已存在'));
  }
  res.status(500).json(response.fail('服务器内部错误'));
};

module.exports = errorHandler;