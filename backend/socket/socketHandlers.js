// backend/socket/socketHandlers.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const connectedUsers = new Map();

export const handleConnection = (io, socket) => {
  console.log('New client connected:', socket.id);

  // Authenticate socket connection
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('username firstName lastName avatar');
      
      if (user) {
        socket.userId = user._id.toString();
        socket.user = user;
        connectedUsers.set(user._id.toString(), socket.id);
        
        socket.emit('authenticated', { user });
        console.log(`User ${user.username} authenticated via socket`);
      }
    } catch (error) {
      socket.emit('auth_error', { message: 'Invalid token' });
    }
  });

  // Join user to their personal room for notifications
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
  });

  // Join post room for live comments
  socket.on('join_post_room', (postId) => {
    socket.join(`post_${postId}`);
  });

  // Handle new comment
  socket.on('new_comment', (data) => {
    const { postId, comment } = data;
    socket.to(`post_${postId}`).emit('comment_added', comment);
  });

  // Handle comment update
  socket.on('comment_updated', (data) => {
    const { postId, comment } = data;
    socket.to(`post_${postId}`).emit('comment_updated', comment);
  });

  // Handle comment deletion
  socket.on('comment_deleted', (data) => {
    const { postId, commentId } = data;
    socket.to(`post_${postId}`).emit('comment_deleted', { commentId });
  });

  // Handle post like
  socket.on('post_liked', (data) => {
    const { postId, isLiked, likesCount } = data;
    socket.to(`post_${postId}`).emit('post_like_updated', { isLiked, likesCount });
  });

  // Handle typing indicator
  socket.on('typing_start', (data) => {
    const { postId, user } = data;
    socket.to(`post_${postId}`).emit('user_typing', { user, isTyping: true });
  });

  socket.on('typing_stop', (data) => {
    const { postId, user } = data;
    socket.to(`post_${postId}`).emit('user_typing', { user, isTyping: false });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`User ${socket.user?.username} disconnected`);
    }
  });
};

// Helper function to send notification to specific user
export const sendNotificationToUser = (io, userId, notification) => {
  const socketId = connectedUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit('new_notification', notification);
  }
};

// Helper function to broadcast to post room
export const broadcastToPost = (io, postId, event, data) => {
  io.to(`post_${postId}`).emit(event, data);
};
