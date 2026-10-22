const express = require('express');
const router = express.Router();
const { getMenus } = require('../controllers/menuController');
const { checkoutOrder } = require('../controllers/orderController');

// GET /api/menus - Ambil daftar menu (opsional query ?kategori=...)
router.get('/menus', getMenus);

// POST /api/checkout - Checkout pesanan & generate WhatsApp URL
router.post('/checkout', checkoutOrder);

module.exports = router;
