/**
 * Валидация входящих данных (express-validator).
 * Правила проверяются в маршрутах, результат разбирается в middleware validate().
 */
const { body, validationResult } = require('express-validator');

// Публичная заявка с сайта
const orderRules = [
  body('customerName')
    .trim()
    .isLength({ min: 2, max: 60 }).withMessage('Имя должно содержать от 2 до 60 символов'),
  body('phone')
    .trim()
    .matches(/^[+\d][\d\s()-]{6,19}$/).withMessage('Введите корректный номер телефона'),
  body('car').optional({ values: 'falsy' }).trim().isLength({ max: 60 }).withMessage('Марка авто — не более 60 символов'),
  body('comment').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }).withMessage('Комментарий — не более 1000 символов'),
  body('productName').optional({ values: 'falsy' }).trim().isLength({ max: 100 }).withMessage('Товар — не более 100 символов'),
  body('total').optional({ values: 'falsy' }).isInt({ min: 1, max: 1000000 }).withMessage('Сумма — число от 1 до 1000000 сом')
];

// Товар (аккумулятор)
const productRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Название — от 2 до 100 символов'),
  body('brand').trim().isLength({ min: 1, max: 50 }).withMessage('Укажите бренд'),
  body('capacity').isInt({ min: 10, max: 300 }).withMessage('Ёмкость — число от 10 до 300 Ач'),
  body('current').isInt({ min: 100, max: 1500 }).withMessage('Пусковой ток — число от 100 до 1500 А'),
  body('price').isInt({ min: 1, max: 1000000 }).withMessage('Укажите цену в сомах'),
  body('polarity').optional({ values: 'falsy' }).trim().isIn(['прямая', 'обратная']).withMessage('Полярность: прямая или обратная'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }).withMessage('Описание — не более 1000 символов')
];

// Логин администратора
const loginRules = [
  body('login').trim().isLength({ min: 1, max: 50 }).withMessage('Укажите логин'),
  body('password').isLength({ min: 4, max: 100 }).withMessage('Пароль — не менее 4 символов')
];

// Изменение статуса заявки
const statusRules = [
  body('status').trim().isIn(['Новая', 'В работе', 'Выполнена']).withMessage('Недопустимый статус')
];

/**
 * Запускает проверку правил и возвращает 400 с первой ошибкой, если есть.
 */
function validate(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({ error: result.array()[0].msg });
  }
  return next();
}

module.exports = { orderRules, productRules, loginRules, statusRules, validate };
