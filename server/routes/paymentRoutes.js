/**
 * Маршруты оплаты.
 */
const { Router } = require('express');
const {
  createPaymentSession, paymentPage, handleWebhook
} = require('../controllers/paymentController');

const router = Router();

// Создание платёжной сессии (публично, после оформления заказа)
router.post('/', createPaymentSession);

// Имитационная страница оплаты (тестовый режим)
router.get('/pay/:id', paymentPage);

// Уведомление от платёжного провайдера об оплате
router.post('/webhook', handleWebhook);

module.exports = router;
