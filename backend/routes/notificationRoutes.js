// backend/routes/notificationRoutes.js
import express from 'express';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification, 
  getUnreadCount 
} from '../controllers/notificationController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// All notification routes require authentication
router.use(auth());

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/mark-all-read', markAllAsRead);
router.delete('/:id', deleteNotification);

export default router;
