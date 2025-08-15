import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function Profile() {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({ bio: user?.bio || '', socialLinks: user?.socialLinks || [] });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/api/users/profile', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      {user && (
        <>
          <p>Username: {user.username}</p>
          <p>Email: {user.email}</p>
          <p>Role: {user.role}</p>
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <textarea
              placeholder="Bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full p-2 mb-4 border rounded"
            />
            <input
              type="text"
              placeholder="Social Links (comma-separated)"
              value={formData.socialLinks.join(',')}
              onChange={(e) => setFormData({ ...formData, socialLinks: e.target.value.split(',') })}
              className="w-full p-2 mb-4 border rounded"
            />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Update Profile</button>
          </form>
          {error && <p className="text-red-500">{error}</p>}
        </>
      )}
    </div>
  );
}