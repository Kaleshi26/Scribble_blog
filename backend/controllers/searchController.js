// backend/controllers/searchController.js
import Post from '../models/Post.js';
import User from '../models/User.js';

export const searchPosts = async (req, res) => {
  try {
    const { 
      q: query, 
      tag, 
      category, 
      author,
      sort = 'relevance',
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let filter = { isPublished: true };
    
    // Text search
    if (query) {
      filter.$text = { $search: query };
    }
    
    // Additional filters
    if (tag) filter.tags = { $in: [tag] };
    if (category) filter.categories = { $in: [category] };
    if (author) filter.author = author;

    let sortOption = {};
    switch (sort) {
      case 'relevance':
        if (query) {
          sortOption = { score: { $meta: 'textScore' } };
        } else {
          sortOption = { publishedAt: -1 };
        }
        break;
      case 'newest':
        sortOption = { publishedAt: -1 };
        break;
      case 'oldest':
        sortOption = { publishedAt: 1 };
        break;
      case 'popular':
        sortOption = { views: -1 };
        break;
      case 'trending':
        sortOption = { likes: -1 };
        break;
      default:
        sortOption = { publishedAt: -1 };
    }

    const posts = await Post.find(filter)
      .populate('author', 'username firstName lastName avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const total = await Post.countDocuments(filter);

    res.json({
      posts,
      query,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalPosts: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (err) {
    console.error('Search posts error:', err);
    res.status(500).json({ message: 'Failed to search posts' });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q: query, page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let filter = { isActive: true };
    
    if (query) {
      filter.$or = [
        { username: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('username firstName lastName avatar bio stats')
      .sort({ 'stats.followersCount': -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      query,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalUsers: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ message: 'Failed to search users' });
  }
};

export const getSuggestions = async (req, res) => {
  try {
    const { q: query, type = 'all' } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }

    const suggestions = [];

    if (type === 'all' || type === 'posts') {
      const postSuggestions = await Post.find({
        isPublished: true,
        $text: { $search: query }
      })
        .select('title slug')
        .limit(5)
        .sort({ score: { $meta: 'textScore' } });

      suggestions.push(...postSuggestions.map(post => ({
        type: 'post',
        title: post.title,
        slug: post.slug,
        id: post._id
      })));
    }

    if (type === 'all' || type === 'users') {
      const userSuggestions = await User.find({
        isActive: true,
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } }
        ]
      })
        .select('username firstName lastName avatar')
        .limit(5);

      suggestions.push(...userSuggestions.map(user => ({
        type: 'user',
        username: user.username,
        name: `${user.firstName} ${user.lastName}`.trim(),
        avatar: user.avatar,
        id: user._id
      })));
    }

    if (type === 'all' || type === 'tags') {
      const tagSuggestions = await Post.aggregate([
        { $match: { isPublished: true } },
        { $unwind: '$tags' },
        { $match: { tags: { $regex: query, $options: 'i' } } },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      suggestions.push(...tagSuggestions.map(tag => ({
        type: 'tag',
        name: tag._id,
        count: tag.count
      })));
    }

    res.json({ suggestions });
  } catch (err) {
    console.error('Get suggestions error:', err);
    res.status(500).json({ message: 'Failed to get suggestions' });
  }
};

export const getPopularTags = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const popularTags = await Post.aggregate([
      { $match: { isPublished: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);

    res.json(popularTags);
  } catch (err) {
    console.error('Get popular tags error:', err);
    res.status(500).json({ message: 'Failed to get popular tags' });
  }
};

export const getPopularCategories = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const popularCategories = await Post.aggregate([
      { $match: { isPublished: true } },
      { $unwind: '$categories' },
      { $group: { _id: '$categories', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);

    res.json(popularCategories);
  } catch (err) {
    console.error('Get popular categories error:', err);
    res.status(500).json({ message: 'Failed to get popular categories' });
  }
};
