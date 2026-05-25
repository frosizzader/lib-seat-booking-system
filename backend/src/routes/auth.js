const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const jwtConfig = require('../config/jwt');
const auth = require('../middlewares/auth');
const response = require('../utils/response');

const router = express.Router();

router.post('/register',
  body('username').isLength({ min: 3, max: 20 }).withMessage('用户名长度需3-20字符'),
  body('password').isLength({ min: 6 }).withMessage('密码长度需至少6位'),
  body('real_name').notEmpty().withMessage('真实姓名不能为空'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(response.fail(errors.array()[0].msg));
    }
    try {
      const { username, password, real_name, phone, email } = req.body;
      const existing = await User.findOne({ where: { username } });
      if (existing) {
        return res.status(400).json(response.fail('用户名已被使用'));
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        username, password: hashedPassword, real_name, phone, email
      });
      res.status(201).json(response.success({ id: user.id, username: user.username }, '注册成功'));
    } catch (error) {
      next(error);
    }
  }
);

router.post('/login',
  body('username').notEmpty(),
  body('password').notEmpty(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(response.fail('请输入用户名和密码'));
    }
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ where: { username } });
      if (!user) {
        return res.status(401).json(response.fail('用户名或密码错误'));
      }
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json(response.fail('用户名或密码错误'));
      }
      if (user.status === 'banned') {
        return res.status(403).json(response.fail('账户已被禁用'));
      }

      // 单点登录校验
      const STALE_TIME = 15 * 60 * 1000;
      if (user.is_online && user.last_active && (new Date() - user.last_active < STALE_TIME)) {
        return res.status(403).json(response.fail('该账号已在其他地方登录，请先下线或等待15分钟'));
      }

      // 更新在线状态
      await user.update({ is_online: true, last_active: new Date() });

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
      );
      res.json(response.success({ token, user: { id: user.id, username: user.username, role: user.role, real_name: user.real_name } }, '登录成功'));
    } catch (error) {
      next(error);
    }
  }
);

router.get('/me', auth, async (req, res) => {
  const { password, ...userData } = req.user.toJSON();
  res.json(response.success(userData));
});

router.post('/logout', auth, async (req, res, next) => {
  try {
    await req.user.update({ is_online: false });
    res.json(response.success(null, '登出成功'));
  } catch (error) {
    next(error);
  }
});

module.exports = router;