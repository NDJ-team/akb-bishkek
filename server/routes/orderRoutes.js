/**
 * Маршруты заявок.
 */
const { Router } = require('express');
const auth = require('../middleware/auth');
const { orderRules, statusRules, validate } = require('../middleware/validation');
const {
  createOrder, listOrders, updateOrderStatus, deleteOrder
} = require('../controllers/orderController');

const router = Router();

// Публичное: создание заявки
router.post('/', orderRules, validate, createOrder);

// Админ
router.get('/', auth, listOrders);
router.patch('/:id/status', auth, statusRules, validate, updateOrderStatus);
router.delete('/:id', auth, deleteOrder);

module.exports = router;
