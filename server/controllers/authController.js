/**
 * Авторизация администратора (JWT).
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../database/index');

/**
 * POST /api/login
 * Тело: { login, password }
 * Ответ: { token, admin: { id, login } }
 */
async function login(req, res, next) {
  try {
    const { login, password } = req.body;

    const admin = await prisma.admin.findUnique({ where: { login } });
    if (!admin) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const token = jwt.sign(
      { sub: admin.id, login: admin.login },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({ token, admin: { id: admin.id, login: admin.login } });
  } catch (err) {
    return next(err);
  }
}

module.exports = { login };
