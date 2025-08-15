import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function AnalyticsDashboard() {
  const { user } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;
      try {
        const res = await axios.get('/api/posts', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          params: { author: user.id }
        });
        const posts = res.data;
        const analyticsData = await Promise.all(
          posts.map(async post => {
            try {
              const analyticsRes = await axios.get(`/api/analytics/${post._id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
              });
              return { ...analyticsRes.data, postId: { ...post, title: post.title } };
            } catch (err) {
              return { postId: { ...post, title: post.title }, views: 0, engagement: { likes: post.likes.length, comments: 0 }, monthlyViews: [] };
            }
          })
        );
        setAnalytics(analyticsData);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analytics');
      }
    };
    if (user) fetchAnalytics();
  }, [user]);

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Analytics Dashboard</h2>
      {error && <p className="text-red-500">{error}</p>}
      {!user && <p className="text-red-500">Please log in to view analytics.</p>}
      {analytics.length === 0 && !error && <p>No posts found.</p>}
      {analytics.map(a => (
        <div key={a.postId._id} className="mb-4 p-4 bg-gray-100 rounded">
          <h3 className="text-lg font-bold">Post: {a.postId.title}</h3>
          <p>Views: {a.views}</p>
          <p>Likes: {a.engagement.likes}</p>
          <p>Comments: {a.engagement.comments}</p>
          <Line
            data={{
              labels: a.monthlyViews?.map(v => v.month) || ['No Data'],
              datasets: [
                {
                  label: 'Post Views',
                  data: a.monthlyViews?.map(v => v.views) || [0],
                  borderColor: '#10B981',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  fill: true
                }
              ]
            }}
            options={{ responsive: true, scales: { y: { beginAtZero: true } } }}
          />
        </div>
      ))}
    </div>
  );
}