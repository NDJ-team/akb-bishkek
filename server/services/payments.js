/**
 * Сервис онлайн-оплаты.
 *
 * Сейчас работает в тестовом режиме (PAYMENT_PROVIDER=test):
 * создаёт имитационную страницу оплаты и помечает заказ оплаченным.
 * Реальный провайдер подключается в createPayment() — см. TODO.
 */
const crypto = require('crypto');

const PROVIDER = (process.env.PAYMENT_PROVIDER || 'test').toLowerCase();
const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const PAYMENT_WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'change-me';

/** Допустимые статусы оплаты заказа */
const PAYMENT_STATUSES = ['none', 'pending', 'paid', 'failed'];

/**
 * Создаёт платёжную сессию для заказа.
 * Возвращает { paymentId, payUrl }.
 */
async function createPayment(order) {
  if (!order || !order.total || order.total <= 0) {
    const err = new Error('Сумма заказа не указана');
    err.status = 400;
    throw err;
  }

  // TODO(реальный провайдер):
  // Здесь вызывается API провайдера (ecom.kg / OptiPay / Redpay):
  //   POST https://api.<provider>/payment/create
  //   body: { shop_id, amount: order.total, order_id: order.id,
  //           currency: 'KGS', callback, return_url }
  // Нужны shop_id и секретный ключ из мерчант-аккаунта.
  // Подпись: HMAC-SHA256 по параметрам запроса, см. документацию провайдера.
  // Пока провайдер не подключён — используем тестовую страницу,
  // чтобы механика оплаты работала end-to-end.
  const paymentId = `test-${order.id}-${Date.now()}`;
  const payUrl = `${BASE_URL}/api/payments/pay/${order.id}?token=${encodeURIComponent(PAYMENT_WEBHOOK_SECRET)}`;

  return { paymentId, payUrl };
}

/**
 * Проверка подписи webhook-уведомления об оплате.
 * В тестовом режиме — сравнение токена. У реального провайдера —
 * проверка HMAC-подписи из его документации.
 */
function verifyWebhook(req) {
  const token = req.get('x-payment-token') || req.query.token;
  return token === PAYMENT_WEBHOOK_SECRET;
}

module.exports = { PROVIDER, BASE_URL, PAYMENT_STATUSES, createPayment, verifyWebhook };
