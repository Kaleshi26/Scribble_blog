import Comment from '../models/Comment.js';
import Analytics from '../models/Analytics.js';

export const addComment = async (req, res) => {
  const { postId, content, parentId } = req.body;
  try {
    const comment = new Comment({
      postId,
      userId: req.user.id,
      content
    });
    await comment.save();

    if (parentId) {
      await Comment.findByIdAndUpdate(parentId, { $push: { replies: comment._id } });
    }

    await Analytics.findOneAndUpdate(
      { postId },
      { $inc: { 'engagement.comments': 1 } }
    );

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId })
      .populate('userId', 'username')
      .populate('replies');
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};