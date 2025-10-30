// backend/routes/commentRoutes.js
import express from 'express';
import { body } from 'express-validator';
import { 
  addComment, 
  getComments, 
  updateComment, 
  deleteComment, 
  likeComment 
} from '../controllers/commentController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const commentValidation = [
  body('content').isLength({ min: 1, max: 1000 }),
  body('postId').isMongoId(),
  body('parentId').optional().isMongoId()
];

// Public routes
router.get('/:postId', getComments);

// Protected routes
router.use(auth());

router.post('/', commentValidation, addComment);
router.put('/:id', [body('content').isLength({ min: 1, max: 1000 })], updateComment);
router.delete('/:id', deleteComment);
router.post('/:id/like', likeComment);

export default router;