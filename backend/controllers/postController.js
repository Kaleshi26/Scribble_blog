// controllers/postController.js
import Post from '../models/Post.js';

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { title, content, tags, category } = req.body;
    const images = req.files ? req.files.map(file => file.path) : [];

    const newPost = new Post({
      title,
      content,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      category,
      images,
      author: req.user.id,
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create post' });
  }
};

// Get all posts
export const getPosts = async (req, res) => {
  try {
    const { tag, category, search } = req.query;

    let filter = {};
    if (tag) filter.tags = { $in: [tag] };
    if (category) filter.category = category;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const posts = await Post.find(filter)
      .populate('author', 'username')
      .sort({ createdAt: -1 });

    // ✅ Return array directly, not { posts: [...] }
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
};

// Get a single post
export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch post' });
  }
};

// Update a post
export const updatePost = async (req, res) => {
  try {
    const { title, content, tags, category } = req.body;
    const images = req.files ? req.files.map(file => file.path) : [];

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        category,
        $push: { images: { $each: images } },
      },
      { new: true }
    );

    if (!updatedPost) return res.status(404).json({ message: 'Post not found' });
    res.json(updatedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update post' });
  }
};

// Like a post
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userId = req.user.id;
    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to like post' });
  }
};
