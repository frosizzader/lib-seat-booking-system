const express = require('express');
const { body, validationResult } = require('express-validator');
const { Rule } = require('../models');
const auth = require('../middlewares/auth');
const response = require('../utils/response');

const router = express.Router();

const ruleKeys = [
  'max_daily_reservations',
  'max_weekly_reservations', 
  'checkin_time_limit',
  'early_checkin_limit',
  'violation_threshold',
  'violation_penalty_days',
  'advance_booking_days',
  'min_booking_duration',
  'max_booking_duration'
];

router.get('/', auth, async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json(response.forbidden('需要管理员权限'));
    }
    const rules = await Rule.findAll({ where: { rule_key: ruleKeys } });
    const data = {};
    rules.forEach(r => { data[r.rule_key] = r.rule_value; });
    res.json(response.success(data));
  } catch (error) {
    next(error);
  }
});

router.put('/', auth, async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json(response.forbidden('需要管理员权限'));
    }
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await Rule.upsert({ rule_key: key, rule_value: String(value) });
    }
    res.json(response.success(null, '更新成功'));
  } catch (error) {
    next(error);
  }
});

module.exports = router;