/**
 * Обработка ошибок: 404 для несуществующих маршрутов
 * и центральный обработчик ошибок (включая MulterError).
 */
const { logError } = require('./logger');

// 404 — маршрут не найден
function notFound(req, res) {
  res.status(404).json({ error: 'Маршрут не найден' });
}

// Центральный обработчик ошибок
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  logError(err, req);

  // Ошибки загрузки файлов (multer)
  if (err.name === 'MulterError') {
    const msg = err.code === 'LIMIT_FILE_SIZE'
      ? 'Файл слишком большой (максимум 5 МБ)'
      : `Ошибка загрузки файла: ${err.message}`;
    return res.status(400).json({ error: msg });
  }

  // Ошибки валидации типов в body (например, capacity="abc")
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некорректный JSON в запросе' });
  }

  return res.status(err.status || 500).json({
    error: err.status ? err.message : 'Внутренняя ошибка сервера'
  });
}

module.exports = { notFound, errorHandler };
