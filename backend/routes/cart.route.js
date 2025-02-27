import express from 'express';
import { protectRoute } from '../middleware/auth.middleware';
import { getCart, addToCart, removeFromCart, updateQuantity } from '../controllers/cart.controller';

const router = express.Router();

router.get('/', protectRoute, getCart);
router.post('/', protectRoute, addToCart);
router.delete('/', protectRoute, removeFromCart); // the reason why didnt use req.params is can del multiple products
router.put('/:id', protectRoute, updateQuantity);


export default router;