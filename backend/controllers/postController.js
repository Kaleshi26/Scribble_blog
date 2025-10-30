// controllers/postController.js
import { validationResult } from 'express-validator';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Favorite from '../models/Favorite.js';
import Analytics from '../models/Analytics.js';
import Notification from '../models/Notification.js';
import { sendNotificationEmail } from '../services/emailService.js';
import readingTime from 'reading-time';

// Create a new post
export const createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      title, 
      content, 
      excerpt,
      tags, 
      categories, 
      isDraft = true,
      isPremium = false,
      seo
    } = req.body;

    // Calculate reading time
    const readingTimeResult = readingTime(content);
    
    // Process images
    const images = req.files ? req.files.map(file => ({
      url: file.path,
      alt: file.originalname,
      caption: ''
    })) : [];

    const newPost = new Post({
      title,
      content,
      excerpt: excerpt || content.substring(0, 300) + '...',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      categories: categories ? categories.split(',').map(cat => cat.trim()) : [],
      images,
      featuredImage: images[0] || null,
      author: req.user.id,
      isDraft,
      isPremium,
      readingTime: readingTimeResult.minutes,
      seo: seo ? JSON.parse(seo) : {},
      publishedAt: !isDraft ? new Date() : null
    });

    const savedPost = await newPost.save();
    
    // Populate author info
    await savedPost.populate('author', 'username firstName lastName avatar');
    
    // Update user's post count
    await User.findByIdAndUpdate(req.user.id, { $inc: { 'stats.postsCount': 1 } });

    // Create analytics record
    const analytics = new Analytics({
      postId: savedPost._id,
      views: 0,
      uniqueViews: 0,
      engagement: { likes: 0, comments: 0, shares: 0, bookmarks: 0 }
    });
    await analytics.save();

    res.status(201).json(savedPost);
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ message: 'Failed to create post' });
  }
};

// Get all posts with advanced filtering
export const getPosts = async (req, res) => {
  try {
    const { 
      tag, 
      category, 
      search, 
      author,
      sort = 'newest',
      page = 1,
      limit = 10,
      isPublished = true
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let filter = { isPublished: isPublished === 'true' };
    
    if (tag) filter.tags = { $in: [tag] };
    if (category) filter.categories = { $in: [category] };
    if (author) filter.author = author;
    if (search) {
      filter.$text = { $search: search };
    }

    let sortOption = {};
    switch (sort) {
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
        sortOption = { 'likes': -1 };
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
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalPosts: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
};

// Get a single post
export const getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id)
      .populate('author', 'username firstName lastName avatar bio socialLinks stats')
      .populate('likes', 'username firstName lastName avatar');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Increment view count
    post.views += 1;
    await post.save();

    // Update analytics
    await Analytics.findOneAndUpdate(
      { postId: post._id },
      { 
        $inc: { views: 1 },
        $set: { updatedAt: new Date() }
      },
      { upsert: true }
    );

    // Update author's total views
    await User.findByIdAndUpdate(post.author._id, { 
      $inc: { 'stats.totalViews': 1 } 
    });

    res.json(post);
  } catch (err) {
    console.error('Get post error:', err);
    res.status(500).json({ message: 'Failed to fetch post' });
  }
};

// Update a post
export const updatePost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { 
      title, 
      content, 
      excerpt,
      tags, 
      categories, 
      isDraft,
      isPremium,
      seo
    } = req.body;

    // Check if user owns the post
    const existingPost = await Post.findById(id);
    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (existingPost.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    // Calculate reading time
    const readingTimeResult = readingTime(content);

    // Process new images
    const newImages = req.files ? req.files.map(file => ({
      url: file.path,
      alt: file.originalname,
      caption: ''
    })) : [];

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      {
        title,
        content,
        excerpt: excerpt || content.substring(0, 300) + '...',
        tags: tags ? tags.split(',').map(tag => tag.trim()) : existingPost.tags,
        categories: categories ? categories.split(',').map(cat => cat.trim()) : existingPost.categories,
        isDraft: isDraft !== undefined ? isDraft : existingPost.isDraft,
        isPremium: isPremium !== undefined ? isPremium : existingPost.isPremium,
        readingTime: readingTimeResult.minutes,
        seo: seo ? JSON.parse(seo) : existingPost.seo,
        publishedAt: !isDraft && existingPost.isDraft ? new Date() : existingPost.publishedAt,
        updatedAt: new Date(),
        $push: { images: { $each: newImages } }
      },
      { new: true, runValidators: true }
    ).populate('author', 'username firstName lastName avatar');

    res.json(updatedPost);
  } catch (err) {
    console.error('Update post error:', err);
    res.status(500).json({ message: 'Failed to update post' });
  }
};

// Delete a post
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(id);
    
    // Update user's post count
    await User.findByIdAndUpdate(post.author, { $inc: { 'stats.postsCount': -1 } });

    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ message: 'Failed to delete post' });
  }
};

// Like a post
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.likes.includes(userId);
    
    if (isLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
      
      // Create notification for post author
      if (post.author.toString() !== userId) {
        const notification = new Notification({
          user: post.author,
          type: 'like',
          title: 'New Like',
          message: `${req.user.username} liked your post "${post.title}"`,
          data: { postId: post._id, userId: userId }
        });
        await notification.save();

        // Send email notification
        const author = await User.findById(post.author);
        if (author?.preferences?.emailNotifications) {
          await sendNotificationEmail(author, notification);
        }
      }
    }

    await post.save();

    // Update analytics
    await Analytics.findOneAndUpdate(
      { postId: post._id },
      { 
        $inc: { 'engagement.likes': isLiked ? -1 : 1 },
        $set: { updatedAt: new Date() }
      },
      { upsert: true }
    );

    res.json({ 
      isLiked: !isLiked, 
      likesCount: post.likes.length 
    });
  } catch (err) {
    console.error('Like post error:', err);
    res.status(500).json({ message: 'Failed to like post' });
  }
};

// Bookmark a post
export const bookmarkPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existingBookmark = await Favorite.findOne({ user: userId, post: id });
    
    if (existingBookmark) {
      await Favorite.findByIdAndDelete(existingBookmark._id);
      await Post.findByIdAndUpdate(id, { $pull: { bookmarks: userId } });
      return res.json({ isBookmarked: false });
    } else {
      const bookmark = new Favorite({ user: userId, post: id });
      await bookmark.save();
      await Post.findByIdAndUpdate(id, { $addToSet: { bookmarks: userId } });
      return res.json({ isBookmarked: true });
    }
  } catch (err) {
    console.error('Bookmark post error:', err);
    res.status(500).json({ message: 'Failed to bookmark post' });
  }
};

// Get user's bookmarks
export const getBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const bookmarks = await Favorite.find({ user: userId })
      .populate({
        path: 'post',
        populate: {
          path: 'author',
          select: 'username firstName lastName avatar'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Favorite.countDocuments({ user: userId });

    res.json({
      bookmarks: bookmarks.map(b => b.post),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalBookmarks: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('Get bookmarks error:', err);
    res.status(500).json({ message: 'Failed to fetch bookmarks' });
  }
};

// Get trending posts
export const getTrendingPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 7;
    
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const posts = await Post.find({
      isPublished: true,
      publishedAt: { $gte: dateThreshold }
    })
      .populate('author', 'username firstName lastName avatar')
      .sort({ views: -1, likes: -1 })
      .limit(limit);

    res.json(posts);
  } catch (err) {
    console.error('Get trending posts error:', err);
    res.status(500).json({ message: 'Failed to fetch trending posts' });
  }
};

// Get featured posts
export const getFeaturedPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const posts = await Post.find({
      isPublished: true,
      isFeatured: true
    })
      .populate('author', 'username firstName lastName avatar')
      .sort({ publishedAt: -1 })
      .limit(limit);

    res.json(posts);
  } catch (err) {
    console.error('Get featured posts error:', err);
    res.status(500).json({ message: 'Failed to fetch featured posts' });
  }
};
