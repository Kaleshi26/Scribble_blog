// backend/routes/paymentRoutes.js
import express from 'express';
import { 
  createPaymentIntent, 
  createSubscription, 
  getSubscription, 
  cancelSubscription, 
  webhook 
} from '../controllers/paymentController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Payment routes
router.post('/create-payment-intent', auth(), createPaymentIntent);
router.post('/create-subscription', auth(), createSubscription);
router.get('/subscription', auth(), getSubscription);
router.post('/cancel-subscription', auth(), cancelSubscription);
router.post('/webhook', webhook); // No auth needed for webhook

export default router;
