/**
 * Оплата заказов.
 *
 * POST /api/payments          (публично) — создать платёжную сессию { orderId }
 * GET  /api/payments/pay/:id  (тест)     — имитационная страница оплаты
 * POST /api/payments/webhook  (провайдер) — уведомление об оплате
 */
const prisma = require('../database/index');
const {
  PROVIDER, BASE_URL, PAYMENT_STATUSES, createPayment, verifyWebhook
} = require('../services/payments');

/**
 * POST /api/payments  (публично)
 * Тело: { orderId }
 * Создаёт платёж и возвращает ссылку на оплату.
 */
async function createPaymentSession(req, res, next) {
  try {
    const orderId = Number(req.body.orderId);
    if (!orderId) {
      return res.status(400).json({ error: 'Не указан ID заказа' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }
    if (!PAYMENT_STATUSES.includes(order.paymentStatus)) {
      return res.status(500).json({ error: 'Недопустимый статус оплаты' });
    }
    if (order.paymentStatus === 'paid') {
      return res.json({ payUrl: null, paymentId: null, alreadyPaid: true });
    }
    if (!order.total || order.total <= 0) {
      return res.status(400).json({ error: 'У заказа нет суммы для оплаты' });
    }

    const { paymentId, payUrl } = await createPayment(order);

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentId, payUrl, paymentStatus: 'pending' }
    });

    return res.json({ payUrl, paymentId, provider: PROVIDER });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/payments/pay/:id  (только тестовый режим)
 * Имитационная страница оплаты. У реального провайдера оплата
 * проходит на его сайте, эта страница не используется.
 */
async function paymentPage(req, res, next) {
  try {
    if (PROVIDER !== 'test') {
      return res.status(404).json({ error: 'Страница недоступна' });
    }

    const id = Number(req.params.id);
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).send('Заказ не найден');
    }
    if (order.paymentStatus === 'paid') {
      return res.redirect(`${BASE_URL}/?paid=1`);
    }

    const phone = process.env.SHOP_PHONE || '+996 700 123 456';
    const fmt = new Intl.NumberFormat('ru-RU').format(order.total);
    const token = encodeURIComponent(req.query.token || '');

    res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Оплата — ${process.env.SHOP_NAME || 'AKB Бишкек'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      font-family: Manrope, Arial, sans-serif; background: #0b0f17; color: #e8ecf4; padding: 16px; }
    .box { width: 100%; max-width: 400px; background: #141a26; border: 1px solid rgba(255,255,255,.08);
      border-radius: 16px; padding: 28px 24px; text-align: center; }
    .box h1 { font-size: 20px; margin: 0 0 4px; }
    .box p { color: #8a93a6; margin: 0 0 20px; font-size: 14px; }
    .amount { font-size: 34px; font-weight: 800; color: #ffcf3f; margin: 0 0 24px; }
    .amount small { font-size: 16px; color: #8a93a6; font-weight: 600; }
    .btn { display: block; width: 100%; padding: 14px; border: 0; border-radius: 10px;
      font: 700 15px/1 Manrope, sans-serif; cursor: pointer; margin-top: 10px; }
    .btn--pay { background: #ffcf3f; color: #0b0f17; }
    .btn--pay:hover { background: #ffdb5e; }
    .btn--cancel { background: transparent; color: #8a93a6; border: 1px solid rgba(255,255,255,.15); }
    .hint { margin-top: 16px; font-size: 12px; color: #5b6478; }
    .hint b { color: #ffcf3f; }
  </style>
</head>
<body>
  <div class="box">
    <h1>${process.env.SHOP_NAME || 'AKB Бишкек'}</h1>
    <p>Заказ #${order.id}${order.productName ? ' · ' + order.productName : ''}</p>
    <div class="amount">${fmt} <small>сом</small></div>
    <form method="POST" action="/api/payments/webhook?token=${token}">
      <input type="hidden" name="orderId" value="${order.id}">
      <button class="btn btn--pay" type="submit">Оплатить (тест)</button>
    </form>
    <a class="btn btn--cancel" href="${BASE_URL}/?cancel=1">Отменить</a>
    <div class="hint">Тестовый режим. Настоящая оплата заработает после
      подключения провайдера — детали у менеджера: <b>${phone}</b></div>
  </div>
</body>
</html>`);
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/payments/webhook  (вызывается платёжным провайдером)
 * Тело: { orderId } (у провайдера — своя схема)
 * Помечает заказ оплаченным. В тестовом режиме проверяет token.
 */
async function handleWebhook(req, res, next) {
  try {
    if (!verifyWebhook(req)) {
      return res.status(403).json({ error: 'Неверная подпись' });
    }

    const orderId = Number(req.body.orderId);
    if (!orderId) {
      return res.status(400).json({ error: 'Не указан ID заказа' });
    }

    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'paid' }
    });

    // TODO(уведомления владельцу): Telegram/email при успешной оплате.

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = { createPaymentSession, paymentPage, handleWebhook };
