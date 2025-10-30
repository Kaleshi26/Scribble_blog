// backend/models/Favorite.js
import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Compound index to prevent duplicate favorites
favoriteSchema.index({ user: 1, post: 1 }, { unique: true });
favoriteSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Favorite', favoriteSchema);
