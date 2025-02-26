import express from 'express';
import { getAllProducts, getFeaturedProducts, createProduct, deleteProduct, getRecommendedProducts, getProductsByCategory, toggleFeatured } from '../controllers/product.controller.js';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protectRoute, adminRoute, getAllProducts);

router.get('/featured', getFeaturedProducts);

router.get('/category/:name', getProductsByCategory);

router.post('/', protectRoute, adminRoute, createProduct);

router.delete('/:id', protectRoute, adminRoute, deleteProduct);

router.get('/recommendations', getRecommendedProducts);

router.patch("/:id", protectRoute, adminRoute, toggleFeatured);


export default router;