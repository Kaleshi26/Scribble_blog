import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function CreatePost() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [categories, setCategories] = useState('');
  const [images, setImages] = useState([]);
  const [isDraft, setIsDraft] = useState(false);
  const [error, setError] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('tags', tags);
    formData.append('categories', categories);
    formData.append('isDraft', isDraft);
    images.forEach((image) => formData.append('images', image));

    try {
      await axios.post('/api/posts', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    }
  };

  const handleAiSuggest = async () => {
    try {
      const res = await axios.post(
        '/api/ai/suggest',
        { prompt: content || title },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setAiSuggestions(res.data.suggestions);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch AI suggestions');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Create New Post</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block font-semibold">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded h-48"
            placeholder="Write your post content here..."
          />
        </div>
        <div>
          <label className="block font-semibold">Tags (comma-separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block font-semibold">Categories (comma-separated)</label>
          <input
            type="text"
            value={categories}
            onChange={(e) => setCategories(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block font-semibold">Images</label>
          <input
            type="file"
            multiple
            onChange={(e) => setImages([...e.target.files])}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isDraft}
              onChange={(e) => setIsDraft(e.target.checked)}
              className="mr-2"
            />
            Save as Draft
          </label>
        </div>
        <button
          type="button"
          onClick={handleAiSuggest}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Get AI Suggestions
        </button>
        {aiSuggestions && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold">AI Suggestions</h3>
            <p>{aiSuggestions}</p>
          </div>
        )}
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Create Post
        </button>
      </form>
    </div>
  );
}