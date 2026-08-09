/**
 * Проверка JWT для защищённых маршрутов.
 * Ожидает заголовок: Authorization: Bearer <token>
 */
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = payload.sub;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Недействительный или истёкший токен' });
  }
}

module.exports = auth;
