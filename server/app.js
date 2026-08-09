/**
 * AKB Бишкек — сервер.
 *
 * Запуск:  npm install && npm run dev
 * Админка: http://localhost:3000/admin.html
 *
 * Выполняет:
 *  - раздаёт клиент (client/) и загруженные фото (/uploads)
 *  - REST API (/api/...)
 *  - безопасность: helmet, CORS, rate limit, JWT, валидация
 *  - gzip-сжатие (compression)
 *  - авто-заполнение БД тестовыми данными при первом старте
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const apiRoutes = require('./routes/index');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { seedIfEmpty } = require('./database/seed');

const app = express();

/* --- безопасность и базовые middleware --- */
app.set('trust proxy', 1); // для корректного rate limit за прокси
app.use(helmet({ contentSecurityPolicy: false })); // CSP отключён для простоты встраивания карты/фото
app.use(cors());
app.use(compression()); // gzip
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

/* --- rate limit --- */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 минут
  max: 10,                     // до 10 попыток входа
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток входа. Попробуйте позже.' }
});

const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 час
  max: 30,                     // до 30 заявок
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много заявок. Попробуйте позже.' }
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 час
  max: 60,                     // до 60 сессий оплаты
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток оплаты. Попробуйте позже.' }
});

/* --- API --- */
app.use('/api/orders', orderLimiter);
app.use('/api/payments', paymentLimiter);
app.use('/api/login', loginLimiter);
app.use('/api', apiRoutes);

/* --- статика --- */
const CLIENT_DIR = path.join(__dirname, '..', 'client');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

// Если выполнена сборка (npm run build) — отдаём минифицированную версию
const DIST_DIR = path.join(CLIENT_DIR, 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, { maxAge: '7d' }));
}
app.use(express.static(CLIENT_DIR, { maxAge: '1h', index: 'index.html' }));

/* --- ошибки --- */
app.use(notFound);
app.use(errorHandler);

/* --- запуск --- */
const PORT = process.env.PORT || 3000;

(async () => {
  try {
    // Заполняем БД тестовыми данными при первом запуске
    await seedIfEmpty();
  } catch (e) {
    console.error('Не удалось выполнить seed:', e.message);
    console.error('Проверьте, что БД создана: npm run db:push');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`\n  AKB Бишкек запущен:`);
    console.log(`  → Сайт:     http://localhost:${PORT}`);
    console.log(`  → Админка:  http://localhost:${PORT}/admin.html`);
    console.log(`  → API:      http://localhost:${PORT}/api`);
    console.log(`  → Загрузки: server/uploads/\n`);
  });
})();
