import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [filters, setFilters] = useState({ tag: '', category: '', search: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get('/api/posts', { params: filters });

        // ✅ Handle both array and object response
        if (Array.isArray(res.data)) {
          setPosts(res.data);
        } else if (res.data.posts && Array.isArray(res.data.posts)) {
          setPosts(res.data.posts);
        } else {
          setPosts([]);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load posts');
        setPosts([]);
      }
    };
    fetchPosts();
  }, [filters]);

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Blog Posts</h2>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search posts"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="p-2 border rounded mr-2"
        />
        <input
          type="text"
          placeholder="Filter by tag"
          value={filters.tag}
          onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
          className="p-2 border rounded mr-2"
        />
        <input
          type="text"
          placeholder="Filter by category"
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="p-2 border rounded"
        />
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((post) => (
          <div key={post._id} className="p-4 bg-gray-100 rounded">
            <Link to={`/post/${post._id}`}>
              <h3 className="text-lg font-bold">{post.title}</h3>
            </Link>
            <p className="text-gray-600">By {post.author?.username || 'Unknown'}</p>
            <p>{post.content?.substring(0, 100) || ''}...</p>
            <p>Tags: {Array.isArray(post.tags) ? post.tags.join(', ') : ''}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
