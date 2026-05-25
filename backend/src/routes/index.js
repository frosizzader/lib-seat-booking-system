const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/users', require('./user'));
router.use('/seats', require('./seat'));
router.use('/reservations', require('./reservation'));
router.use('/rules', require('./rule'));
router.use('/stats', require('./stats'));
router.use('/violations', require('./violation'));

module.exports = router;