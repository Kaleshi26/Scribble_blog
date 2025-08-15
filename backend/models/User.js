// backend/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  bio: { type: String, default: '' },
  socialLinks: [{ type: String }],
  role: { type: String, enum: ['reader', 'author', 'admin'], default: 'reader' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
