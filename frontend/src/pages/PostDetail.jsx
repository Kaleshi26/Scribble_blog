import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`/api/posts/${id}`);
        setPost(res.data);
        const commentRes = await axios.get(`/api/comments/${id}`);
        setComments(commentRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load post');
      }
    };
    fetchPost();
  }, [id]);

  const handleLike = async () => {
    try {
      const res = await axios.post(`/api/posts/${id}/like`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPost(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to like post');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/comments', { postId: id, content: comment }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setComments([...comments, res.data]);
      setComment('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    }
  };

  return (
    <div className="container mx-auto p-4">
      {error && <p className="text-red-500">{error}</p>}
      {post && (
        <>
          <h2 className="text-2xl font-bold mb-4">{post.title}</h2>
          <p className="text-gray-600 mb-2">By {post.author.username}</p>
          <div className="prose mb-4" dangerouslySetInnerHTML={{ __html: post.content }} />
          {post.images.map((img, index) => (
            <img key={index} src={`/uploads/${img}`} alt="Post" className="mb-4 max-w-full" />
          ))}
          <p>Tags: {post.tags.join(', ')}</p>
          <p>Categories: {post.categories.join(', ')}</p>
          <button onClick={handleLike} className="bg-blue-500 text-white px-4 py-2 rounded mt-4">
            {post.likes.includes(user?.id) ? 'Unlike' : 'Like'} ({post.likes.length})
          </button>
          <div className="mt-4">
            <h3 className="text-xl font-bold mb-2">Comments</h3>
            {user && (
              <form onSubmit={handleComment} className="mb-4">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Add a comment"
                />
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Comment</button>
              </form>
            )}
            {comments.map(c => (
              <div key={c._id} className="p-2 border-b">
                <p>{c.content}</p>
                <p className="text-gray-600">By {c.userId.username}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}