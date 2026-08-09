/**
 * Статистика для админ-панели.
 */
const prisma = require('../database/index');

/**
 * GET /api/stats  (admin)
 * Ответ: количество товаров, заявок по статусам, последние заявки.
 */
async function getStats(req, res, next) {
  try {
    const [productCount, orderCount, newCount, inProgressCount, doneCount, lastOrders] =
      await Promise.all([
        prisma.product.count(),
        prisma.order.count(),
        prisma.order.count({ where: { status: 'Новая' } }),
        prisma.order.count({ where: { status: 'В работе' } }),
        prisma.order.count({ where: { status: 'Выполнена' } }),
        prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
      ]);

    return res.json({
      productCount,
      orderCount,
      newCount,
      inProgressCount,
      doneCount,
      lastOrders
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getStats };
