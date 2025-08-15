import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  views: { type: Number, default: 0 },
  monthlyViews: [{ month: String, views: Number }],
  engagement: { likes: Number, comments: Number },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Analytics', analyticsSchema);