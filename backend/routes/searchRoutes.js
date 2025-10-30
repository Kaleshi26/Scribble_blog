// backend/routes/searchRoutes.js
import express from 'express';
import { 
  searchPosts, 
  searchUsers, 
  getSuggestions, 
  getPopularTags, 
  getPopularCategories 
} from '../controllers/searchController.js';

const router = express.Router();

// Search routes (no auth required for public search)
router.get('/posts', searchPosts);
router.get('/users', searchUsers);
router.get('/suggestions', getSuggestions);
router.get('/tags/popular', getPopularTags);
router.get('/categories/popular', getPopularCategories);

export default router;
