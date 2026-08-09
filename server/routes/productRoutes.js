/**
 * Маршруты товаров. Публичные GET, изменение — только для админа (JWT).
 */
const fs = require('fs');
const { Router } = require('express');
const { validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { productRules } = require('../middleware/validation');
const {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct
} = require('../controllers/productController');

const router = Router();

/**
 * Валидация после загрузки файла.
 * Если данные не прошли проверку — удаляем загруженный файл, чтобы не оставлять мусор.
 */
function validateProduct(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: result.array()[0].msg });
  }
  return next();
}

// Публичные
router.get('/', listProducts);
router.get('/:id', getProduct);

// Админ: защищены JWT + multipart для загрузки фото
router.post('/', auth, upload.single('image'), productRules, validateProduct, createProduct);
router.put('/:id', auth, upload.single('image'), productRules, validateProduct, updateProduct);
router.delete('/:id', auth, deleteProduct);

module.exports = router;
