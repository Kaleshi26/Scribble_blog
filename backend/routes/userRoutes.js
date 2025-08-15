import express from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/userController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// POST /api/users/register
router.post('/register', register);

// POST /api/users/login
router.post('/login', login);

// GET /api/users/profile
router.get('/profile', auth(), getProfile);

// PUT /api/users/profile
router.put('/profile', auth(), updateProfile);

export default router;
