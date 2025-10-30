// backend/models/Analytics.js
import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  views: { type: Number, default: 0 },
  uniqueViews: { type: Number, default: 0 },
  monthlyViews: [{ 
    month: String, 
    views: Number,
    uniqueViews: Number
  }],
  dailyViews: [{ 
    date: Date, 
    views: Number,
    uniqueViews: Number
  }],
  engagement: { 
    likes: Number, 
    comments: Number,
    shares: Number,
    bookmarks: Number
  },
  traffic: {
    organic: Number,
    direct: Number,
    social: Number,
    referral: Number
  },
  demographics: {
    ageGroups: [{ age: String, count: Number }],
    countries: [{ country: String, count: Number }],
    devices: [{ device: String, count: Number }]
  },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for better performance
analyticsSchema.index({ postId: 1 });
analyticsSchema.index({ updatedAt: -1 });

export default mongoose.model('Analytics', analyticsSchema);