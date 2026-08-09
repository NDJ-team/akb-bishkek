/**
 * Сборка всех маршрутов API под префиксом /api.
 */
const { Router } = require('express');
const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const orderRoutes = require('./orderRoutes');
const paymentRoutes = require('./paymentRoutes');
const adminRoutes = require('./adminRoutes');

const router = Router();

router.use('/', authRoutes);        // /api/login
router.use('/products', productRoutes); // /api/products
router.use('/orders', orderRoutes);     // /api/orders
router.use('/payments', paymentRoutes); // /api/payments
router.use('/', adminRoutes);       // /api/stats

module.exports = router;
