const express = require('express');
const { User } = require('../models');
const auth = require('../middlewares/auth');
const response = require('../utils/response');

const router = express.Router();

router.get('/', auth, async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json(response.forbidden('需要管理员权限'));
    }
    const users = await User.findAll({
      attributes: ['id', 'username', 'real_name', 'role', 'status', 'violation_count', 'createdAt'],
      order: [['id', 'ASC']]
    });
    res.json(response.success(users));
  } catch (error) {
    next(error);
  }
});

module.exports = router;