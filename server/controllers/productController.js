/**
 * CRUD товаров (аккумуляторов).
 */
const fs = require('fs');
const path = require('path');
const prisma = require('../database/index');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

/**
 * GET /api/products
 * Query-параметры: brand, minPrice, maxPrice, capacity, polarity, search, sort
 */
async function listProducts(req, res, next) {
  try {
    const {
      brand, minPrice, maxPrice, capacity, polarity, search, sort
    } = req.query;

    const where = {};

    if (brand) where.brand = brand;
    if (polarity) where.polarity = polarity;
    if (capacity) where.capacity = Number(capacity);

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { brand: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const orderBy = sort === 'price' ? { price: 'asc' } : { createdAt: 'desc' };

    const products = await prisma.product.findMany({ where, orderBy });
    return res.json(products);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/products/:id
 */
async function getProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ error: 'Аккумулятор не найден' });
    }
    return res.json(product);
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/products  (admin)
 * multipart/form-data: name, brand, capacity, current, price, polarity, description, image
 */
async function createProduct(req, res, next) {
  try {
    const data = {
      name: req.body.name.trim(),
      brand: req.body.brand.trim(),
      capacity: Number(req.body.capacity),
      current: Number(req.body.current),
      price: Number(req.body.price),
      polarity: req.body.polarity || 'прямая',
      description: req.body.description ? req.body.description.trim() : null,
      image: req.file ? `/uploads/${req.file.filename}` : req.body.image || null
    };

    const product = await prisma.product.create({ data });
    return res.status(201).json(product);
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/products/:id  (admin)
 * multipart/form-data — image опционален (если не передан, старое фото сохраняется)
 */
async function updateProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Аккумулятор не найден' });
    }

    const data = {
      name: req.body.name.trim(),
      brand: req.body.brand.trim(),
      capacity: Number(req.body.capacity),
      current: Number(req.body.current),
      price: Number(req.body.price),
      polarity: req.body.polarity || 'прямая',
      description: req.body.description ? req.body.description.trim() : null
    };

    // Новый файл загружен — удаляем старый и ставим новый
    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
      removeUploadFile(existing.image);
    }

    const product = await prisma.product.update({ where: { id }, data });
    return res.json(product);
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/products/:id  (admin)
 */
async function deleteProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Аккумулятор не найден' });
    }

    await prisma.product.delete({ where: { id } });
    removeUploadFile(existing.image);

    return res.json({ message: 'Аккумулятор удалён' });
  } catch (err) {
    return next(err);
  }
}

/**
 * Удаляет файл из uploads, если путь указывает туда и файл существует.
 */
function removeUploadFile(imagePath) {
  if (!imagePath || !imagePath.startsWith('/uploads/')) return;
  const file = path.join(UPLOAD_DIR, path.basename(imagePath));
  fs.unlink(file, () => {});
}

module.exports = {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct
};
