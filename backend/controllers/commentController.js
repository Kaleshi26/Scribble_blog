// backend/controllers/commentController.js
import { validationResult } from 'express-validator';
import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import Analytics from '../models/Analytics.js';
import Notification from '../models/Notification.js';
import { sendNotificationEmail } from '../services/emailService.js';

export const addComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { postId, content, parentId } = req.body;
    
    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = new Comment({
      postId,
      userId: req.user.id,
      content,
      parentId: parentId || null
    });
    
    await comment.save();

    // If it's a reply, add to parent comment
    if (parentId) {
      await Comment.findByIdAndUpdate(parentId, { 
        $push: { replies: comment._id } 
      });
    }

    // Update analytics
    await Analytics.findOneAndUpdate(
      { postId },
      { 
        $inc: { 'engagement.comments': 1 },
        $set: { updatedAt: new Date() }
      },
      { upsert: true }
    );

    // Create notification for post author
    if (post.author.toString() !== req.user.id) {
      const notification = new Notification({
        user: post.author,
        type: 'comment',
        title: 'New Comment',
        message: `${req.user.username} commented on your post "${post.title}"`,
        data: { postId: post._id, commentId: comment._id, userId: req.user.id }
      });
      await notification.save();

      // Send email notification
      const author = await Post.findById(postId).populate('author');
      if (author?.author?.preferences?.emailNotifications) {
        await sendNotificationEmail(author.author, notification);
      }
    }

    // Populate user info for response
    await comment.populate('userId', 'username firstName lastName avatar');

    res.status(201).json(comment);
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ message: 'Failed to add comment' });
  }
};

export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get top-level comments (no parent)
    const comments = await Comment.find({ 
      postId, 
      parentId: null,
      isDeleted: false 
    })
      .populate('userId', 'username firstName lastName avatar')
      .populate({
        path: 'replies',
        populate: {
          path: 'userId',
          select: 'username firstName lastName avatar'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({ 
      postId, 
      parentId: null,
      isDeleted: false 
    });

    res.json({
      comments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalComments: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
};

export const updateComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { content } = req.body;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this comment' });
    }

    comment.content = content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    await comment.populate('userId', 'username firstName lastName avatar');

    res.json(comment);
  } catch (err) {
    console.error('Update comment error:', err);
    res.status(500).json({ message: 'Failed to update comment' });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment or is admin
    if (comment.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Soft delete
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await comment.save();

    // Update analytics
    await Analytics.findOneAndUpdate(
      { postId: comment.postId },
      { 
        $inc: { 'engagement.comments': -1 },
        $set: { updatedAt: new Date() }
      }
    );

    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
};

export const likeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const isLiked = comment.likes.includes(userId);
    
    if (isLiked) {
      comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());
    } else {
      comment.likes.push(userId);
    }

    await comment.save();

    res.json({ 
      isLiked: !isLiked, 
      likesCount: comment.likes.length 
    });
  } catch (err) {
    console.error('Like comment error:', err);
    res.status(500).json({ message: 'Failed to like comment' });
  }
};