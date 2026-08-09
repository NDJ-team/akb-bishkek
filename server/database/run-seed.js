/**
 * Ручной запуск seed: npm run db:seed
 */
require('dotenv').config();
const { seedIfEmpty } = require('./seed');

seedIfEmpty()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[seed] Ошибка:', err);
    process.exit(1);
  });
