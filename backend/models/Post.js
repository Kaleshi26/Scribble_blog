// backend/models/Post.js
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 200 },
  slug: { type: String, unique: true },
  content: { type: String, required: true },
  excerpt: { type: String, maxlength: 300 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [{ type: String, maxlength: 30 }],
  categories: [{ type: String, maxlength: 50 }],
  images: [{ 
    url: String,
    alt: String,
    caption: String
  }],
  featuredImage: {
    url: String,
    alt: String
  },
  isDraft: { type: Boolean, default: true },
  isPublished: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isPremium: { type: Boolean, default: false },
  publishedAt: Date,
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  shares: { type: Number, default: 0 },
  readingTime: { type: Number }, // in minutes
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived', 'reported'], 
    default: 'draft' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for better performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ categories: 1 });
postSchema.index({ isPublished: 1, publishedAt: -1 });
postSchema.index({ slug: 1 });
postSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Pre-save middleware to generate slug
postSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

export default mongoose.model('Post', postSchema);