// backend/controllers/userController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import Follow from '../models/Follow.js';
import Post from '../models/Post.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService.js';

// Register a new user
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, username, firstName, lastName, role } = req.body;
    
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ 
        message: user.email === email ? 'Email already exists' : 'Username already exists' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    user = new User({
      email,
      username,
      firstName,
      lastName,
      password: hashedPassword,
      role: role && ['reader', 'author', 'admin', 'moderator'].includes(role) ? role : 'reader'
    });

    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user);

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      refreshToken,
      user: { 
        id: user._id, 
        email: user.email, 
        username: user.username, 
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, rememberMe } = req.body;
    
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : '7d' }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      refreshToken,
      user: { 
        id: user._id, 
        email: user.email, 
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
        subscription: user.subscription
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Google OAuth
export const googleAuth = async (req, res) => {
  try {
    const { email, name, picture, googleId } = req.body;
    
    let user = await User.findOne({ email });
    
    if (user) {
      // Update existing user with Google info
      user.avatar = picture;
      user.isVerified = true;
      await user.save();
    } else {
      // Create new user
      user = new User({
        email,
        username: email.split('@')[0] + '_' + googleId.slice(-4),
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' '),
        avatar: picture,
        isVerified: true,
        password: await bcrypt.hash(googleId, 12)
      });
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { 
        id: user._id, 
        email: user.email, 
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ message: 'Server error during Google authentication' });
  }
};

// Get profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('stats');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update profile
export const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      firstName, 
      lastName, 
      bio, 
      socialLinks, 
      preferences 
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        firstName, 
        lastName, 
        bio, 
        socialLinks, 
        preferences,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user by username
export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username })
      .select('-password -email')
      .populate('stats');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's posts
    const posts = await Post.find({ author: user._id, isPublished: true })
      .select('title slug excerpt featuredImage createdAt views likes')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ user, posts });
  } catch (err) {
    console.error('Get user by username error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Follow user
export const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;

    if (followerId === userId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const existingFollow = await Follow.findOne({ follower: followerId, following: userId });
    if (existingFollow) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    const follow = new Follow({ follower: followerId, following: userId });
    await follow.save();

    // Update follower counts
    await User.findByIdAndUpdate(followerId, { $inc: { 'stats.followingCount': 1 } });
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.followersCount': 1 } });

    res.json({ message: 'Successfully followed user' });
  } catch (err) {
    console.error('Follow user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Unfollow user
export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;

    const follow = await Follow.findOneAndDelete({ follower: followerId, following: userId });
    if (!follow) {
      return res.status(400).json({ message: 'Not following this user' });
    }

    // Update follower counts
    await User.findByIdAndUpdate(followerId, { $inc: { 'stats.followingCount': -1 } });
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.followersCount': -1 } });

    res.json({ message: 'Successfully unfollowed user' });
  } catch (err) {
    console.error('Unfollow user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get followers
export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const followers = await Follow.find({ following: userId })
      .populate('follower', 'username firstName lastName avatar bio')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json(followers);
  } catch (err) {
    console.error('Get followers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get following
export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const following = await Follow.find({ follower: userId })
      .populate('following', 'username firstName lastName avatar bio')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json(following);
  } catch (err) {
    console.error('Get following error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await sendPasswordResetEmail(user, resetToken);
    
    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    user.password = await bcrypt.hash(password, 12);
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
