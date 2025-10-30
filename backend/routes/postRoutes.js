// backend/routes/postRoutes.js
import express from 'express';
import multer from 'multer';
import { body } from 'express-validator';
import { 
  createPost, 
  getPosts, 
  getPost, 
  updatePost, 
  deletePost,
  likePost,
  bookmarkPost,
  getBookmarks,
  getTrendingPosts,
  getFeaturedPosts
} from '../controllers/postController.js';
import auth from '../middleware/auth.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const router = express.Router();

// Validation rules
const postValidation = [
  body('title').isLength({ min: 1, max: 200 }),
  body('content').isLength({ min: 1 }),
  body('tags').optional().isString(),
  body('categories').optional().isString(),
  body('excerpt').optional().isLength({ max: 300 }),
  body('isDraft').optional().isBoolean(),
  body('isPremium').optional().isBoolean()
];

// Public routes
router.get('/', getPosts);
router.get('/trending', getTrendingPosts);
router.get('/featured', getFeaturedPosts);
router.get('/:id', getPost);

// Protected routes
router.use(auth());

router.post('/', postValidation, upload.array('images', 5), createPost);
router.put('/:id', postValidation, upload.array('images', 5), updatePost);
router.delete('/:id', deletePost);
router.post('/:id/like', likePost);
router.post('/:id/bookmark', bookmarkPost);
router.get('/user/bookmarks', getBookmarks);

export default router;