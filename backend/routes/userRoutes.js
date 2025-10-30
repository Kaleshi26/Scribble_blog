// backend/routes/userRoutes.js
import express from 'express';
import { body } from 'express-validator';
import { 
  register, 
  login, 
  googleAuth,
  getProfile, 
  updateProfile,
  getUserByUsername,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  forgotPassword,
  resetPassword
} from '../controllers/userController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('username').isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
  body('firstName').optional().isLength({ max: 50 }),
  body('lastName').optional().isLength({ max: 50 })
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/google-auth', googleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/:username', getUserByUsername);

// Protected routes
router.use(auth());

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/:userId/follow', followUser);
router.delete('/:userId/follow', unfollowUser);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

export default router;
