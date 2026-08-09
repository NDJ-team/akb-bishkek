/**
 * Заявки клиентов: создание (публично) и управление (админ).
 */
const prisma = require('../database/index');

const ORDER_STATUSES = ['Новая', 'В работе', 'Выполнена'];

/**
 * POST /api/orders  (публично)
 * Тело: { customerName, phone, car, comment, productName, total }
 */
async function createOrder(req, res, next) {
  try {
    const { customerName, phone, car, comment, productName, total } = req.body;

    const order = await prisma.order.create({
      data: {
        customerName: customerName.trim(),
        phone: phone.trim(),
        car: car ? car.trim() : null,
        comment: comment ? comment.trim() : null,
        productName: productName ? productName.trim() : null,
        total: Number.isFinite(Number(total)) && Number(total) > 0 ? Number(total) : 0,
        status: 'Новая'
      }
    });

    return res.status(201).json({ message: 'Заявка принята', order });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/orders  (admin)
 * Query: status — фильтр по статусу
 */
async function listOrders(req, res, next) {
  try {
    const where = req.query.status ? { status: req.query.status } : {};
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    return res.json(orders);
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/orders/:id/status  (admin)
 * Тело: { status }
 */
async function updateOrderStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Недопустимый статус' });
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    const order = await prisma.order.update({ where: { id }, data: { status } });
    return res.json(order);
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/orders/:id  (admin)
 */
async function deleteOrder(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    await prisma.order.delete({ where: { id } });
    return res.json({ message: 'Заявка удалена' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { createOrder, listOrders, updateOrderStatus, deleteOrder };
