/**
 * Маршруты статистики для админ-панели.
 */
const { Router } = require('express');
const auth = require('../middleware/auth');
const { getStats } = require('../controllers/adminController');

const router = Router();

// GET /api/stats — только для админа
router.get('/stats', auth, getStats);

module.exports = router;
