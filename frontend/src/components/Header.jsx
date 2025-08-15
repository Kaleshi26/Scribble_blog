// frontend/src/components/Header.jsx
import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <header className="bg-gray-800 text-white p-4">
      <nav className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">BlogPlatform</Link>
        <div>
          {user ? (
            <>
              <Link to="/profile" className="mr-4">Profile</Link>
              <Link to="/create-post" className="mr-4">Create Post</Link>
              <Link to="/analytics" className="mr-4">Analytics</Link>
              <button onClick={() => { logout(); navigate('/'); }} className="bg-red-500 px-3 py-1 rounded">Logout</button>
            </>
          ) : (
            <>
              <Link to="/signin" className="mr-4">Sign In</Link>
              <Link to="/signup" className="bg-blue-500 px-3 py-1 rounded">Sign Up</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}