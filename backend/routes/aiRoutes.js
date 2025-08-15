import express from 'express';
import { getAISuggestions } from '../controllers/aiController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/suggest', auth(), getAISuggestions);

export default router;