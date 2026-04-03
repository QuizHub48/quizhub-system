import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Admin, Lecturer, and Student have their own sidebar layouts — hide the top navbar for them
  if (!user || user.role === 'admin' || user.role === 'lecturer' || user.role === 'student') return null;

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">
          <img src={logo} alt="QuizHub Logo" className="nav-logo-img" />
        </Link>
      </div>

      <div className="nav-links">
        {user.role === 'student' && (
          <>
            <Link to="/student">Dashboard</Link>
            <Link to="/results">My Results</Link>
          </>
        )}
        {user.role === 'lecturer' && (
          <>
            <Link to="/lecturer">Dashboard</Link>
            <Link to="/lecturer/create-quiz">Create Quiz</Link>
          </>
        )}
        {user.role === 'admin' && (
          <>
            <Link to="/admin">Dashboard</Link>
            <Link to="/admin/users">Users</Link>
            <Link to="/admin/courses">Courses</Link>
          </>
        )}
      </div>

      <div className="nav-user">
        <span className={`role-badge role-${user.role}`}>{user.role}</span>
        <div className="user-menu" onClick={() => setMenuOpen(!menuOpen)}>
          <div className="avatar">{user.name?.charAt(0).toUpperCase()}</div>
          <span className="user-name">{user.name}</span>
          {menuOpen && (
            <div className="dropdown">
              <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
