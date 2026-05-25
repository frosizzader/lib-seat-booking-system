const express = require('express');
const { Violation, User, Reservation } = require('../models');
const auth = require('../middlewares/auth');
const response = require('../utils/response');

const router = express.Router();

// 管理员获取所有违规记录
router.get('/', auth, async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json(response.forbidden('无权限'));
    }
    const violations = await Violation.findAll({
      include: [
        { model: User, attributes: ['username', 'real_name'] },
        { model: Reservation, attributes: ['date', 'start_time', 'end_time'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(response.success(violations));
  } catch (error) {
    next(error);
  }
});

// 用户获取自己的违规记录
router.get('/me', auth, async (req, res, next) => {
  try {
    const violations = await Violation.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: Reservation, attributes: ['date', 'start_time', 'end_time'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(response.success(violations));
  } catch (error) {
    next(error);
  }
});

// 管理员删除违规记录
router.delete('/:id', auth, async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json(response.forbidden('无权限'));
    }
    const violation = await Violation.findByPk(req.params.id);
    if (!violation) {
      return res.status(404).json(response.notFound('违规记录不存在'));
    }
    
    // 同时也减少用户的违约计数
    const user = await User.findByPk(violation.user_id);
    if (user && user.violation_count > 0) {
      await user.decrement('violation_count');
    }
    
    await violation.destroy();
    res.json(response.success(null, '违规记录已删除'));
  } catch (error) {
    next(error);
  }
});

module.exports = router;