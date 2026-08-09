/**
 * Логирование ошибок: пишем в консоль и в файл logs/error.log.
 */
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'error.log');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function logError(err, req = null) {
  const ts = new Date().toISOString();
  const route = req ? ` [${req.method} ${req.originalUrl}]` : '';
  const line = `${ts}${route} ${err.stack || err.message || err}\n`;

  console.error(line.trim());
  try {
    fs.appendFileSync(LOG_FILE, line);
  } catch (e) {
    /* файл недоступен — не критично */
  }
}

module.exports = { logError, LOG_FILE };
