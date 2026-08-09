/**
 * Маршруты авторизации.
 */
const { Router } = require('express');
const { loginRules, validate } = require('../middleware/validation');
const { login } = require('../controllers/authController');

const router = Router();

// POST /api/login
router.post('/login', loginRules, validate, login);

module.exports = router;
