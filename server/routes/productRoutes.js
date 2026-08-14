const express = require('express');
const { getProducts, getProduct, createProduct, getMyListings, deleteProduct, updateProductStatus, updateProduct } = require('../controllers/productController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/my-listings', protect, getMyListings);

router.route('/')
    .get(getProducts)
    .post(protect, createProduct);

router.route('/:id')
    .get(getProduct)
    .put(protect, updateProduct)
    .delete(protect, deleteProduct);

router.put('/:id/status', protect, updateProductStatus);

module.exports = router;
