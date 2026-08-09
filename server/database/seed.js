/**
 * Seed: создаёт админа по умолчанию и тестовые аккумуляторы.
 * Функция идемпотентна — повторные запуски не дублируют данные.
 * Автоматически вызывается при старте сервера, если БД пустая.
 */
const bcrypt = require('bcryptjs');
const prisma = require('./index');

// Тестовые аккумуляторы. image — путь к SVG-заглушке, в админке можно заменить фото.
const SEED_PRODUCTS = [
  { name: 'Bosch S4 Silver',      brand: 'Bosch',  capacity: 60, current: 540, price: 11500, polarity: 'прямая', image: '/images/battery-bosch.svg',  description: 'Надёжный европейский АКБ, отличный холодный пуск.' },
  { name: 'Bosch S5 Silver',      brand: 'Bosch',  capacity: 70, current: 680, price: 13500, polarity: 'прямая', image: '/images/battery-bosch.svg',  description: 'Повышенная ёмкость и пусковой ток для современных авто.' },
  { name: 'Varta Blue Dynamic',   brand: 'Varta',  capacity: 60, current: 540, price: 10800, polarity: 'прямая', image: '/images/battery-varta.svg',  description: 'Классика для легковых авто, стабильна в мороз.' },
  { name: 'Varta Blue Dynamic',   brand: 'Varta',  capacity: 74, current: 680, price: 12600, polarity: 'прямая', image: '/images/battery-varta.svg',  description: 'Мощный вариант для кроссоверов и седанов D-класса.' },
  { name: 'Mutlu Calcium Silver', brand: 'Mutlu',  capacity: 60, current: 540, price: 9400,  polarity: 'прямая', image: '/images/battery-mutlu.svg',  description: 'Отличный баланс цены и качества.' },
  { name: 'Mutlu Calcium Silver', brand: 'Mutlu',  capacity: 72, current: 640, price: 10600, polarity: 'обратная', image: '/images/battery-mutlu.svg', description: 'Для авто с обратной полярностью (многие японские модели).' },
  { name: 'Topla Stop&Go',        brand: 'Topla',  capacity: 60, current: 620, price: 9900,  polarity: 'прямая', image: '/images/battery-topla.svg',  description: 'Технология AGM-старт, подходит для Stop-Start.' },
  { name: 'Topla Energy',         brand: 'Topla',  capacity: 72, current: 640, price: 11000, polarity: 'прямая', image: '/images/battery-topla.svg',  description: 'Высокий пусковой ток для дизельных двигателей.' },
  { name: 'Exide Premium',        brand: 'Exide',  capacity: 60, current: 640, price: 11800, polarity: 'прямая', image: '/images/battery-generic.svg', description: 'Премиальная линейка с усиленной пластиной.' },
  { name: 'Banner Power Bull',    brand: 'Banner', capacity: 60, current: 540, price: 12300, polarity: 'прямая', image: '/images/battery-generic.svg', description: 'Австрийское качество, гарантия 3 года.' },
  { name: 'Akom Standard',        brand: 'Akom',   capacity: 55, current: 460, price: 7900,  polarity: 'прямая', image: '/images/battery-akom.svg',   description: 'Доступный вариант для бюджетных авто.' },
  { name: 'Akom Standard',        brand: 'Akom',   capacity: 62, current: 540, price: 8700,  polarity: 'прямая', image: '/images/battery-akom.svg',   description: 'Хорошая ёмкость за свои деньги.' }
];

/**
 * Заполняет БД тестовыми данными, если таблицы пустые.
 * @returns {Promise<boolean>} true если данные были добавлены
 */
async function seedIfEmpty() {
  // Админ по умолчанию
  const adminCount = await prisma.admin.count();
  if (adminCount === 0) {
    const login = process.env.ADMIN_LOGIN || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.admin.create({ data: { login, passwordHash } });
    console.log(`[seed] Админ создан: ${login} / ${password}`);
  }

  // Тестовые товары
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    for (const p of SEED_PRODUCTS) {
      await prisma.product.create({ data: p });
    }
    console.log(`[seed] Добавлено аккумуляторов: ${SEED_PRODUCTS.length}`);
    return true;
  }
  return false;
}

module.exports = { seedIfEmpty, SEED_PRODUCTS };
