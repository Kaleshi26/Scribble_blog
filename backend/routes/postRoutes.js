import express from 'express';
import multer from 'multer';
import { createPost, getPosts, getPost, updatePost, likePost } from '../controllers/postController.js';
import auth from '../middleware/auth.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

const router = express.Router();

router.post('/', auth(['author', 'admin']), upload.array('images'), createPost);
router.get('/', getPosts);
router.get('/:id', getPost);
router.put('/:id', auth(['author', 'admin']), upload.array('images'), updatePost);
router.post('/:id/like', auth(), likePost);

export default router;