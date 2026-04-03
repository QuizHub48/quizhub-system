import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSystemStats } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import './Admin.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await getSystemStats();
        setStats(data);
      } catch (err) {
        console.error('Error fetching system stats:', err);
      }
    };

    fetchStats();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const statCards = stats ? [
    { label: 'Total Users',    value: stats.totalUsers,   icon: '👥', color: '#4f46e5' },
    { label: 'Students',       value: stats.students,     icon: '🎓', color: '#7c3aed' },
    { label: 'Lecturers',      value: stats.lecturers,    icon: '👨‍🏫', color: '#0891b2' },
    { label: 'Total Quizzes',  value: stats.totalQuizzes, icon: '📝', color: '#059669' },
    { label: 'Total Attempts', value: stats.totalResults, icon: '✅', color: '#d97706' },
    { label: 'Total Courses',  value: stats.totalCourses, icon: '📚', color: '#db2777' },
  ] : [];

  return (
    <AdminLayout pageTitle="Dashboard">
      <div className="ap-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome back! Here's your system overview.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="ap-stats" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {statCards.map((s, i) => (
          <div key={i} className="ap-stat-card">
            <div className="ap-stat-label">{s.label}</div>
            <div className="ap-stat-num">{s.value ?? '—'}</div>
            <div className="ap-stat-icon" style={{ background: s.color + '33' }}>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="adash-shortcuts">
        <Link to="/admin/users" className="adash-card ap-card">
          <div className="adash-card-icon" style={{ background: '#ede9fe' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3>User Management</h3>
          <p>View, edit roles, and manage users</p>
          <span className="adash-arrow">→</span>
        </Link>

        <Link to="/admin/courses" className="adash-card ap-card">
          <div className="adash-card-icon" style={{ background: '#d1fae5' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <h3>Course Management</h3>
          <p>Create and manage academic courses</p>
          <span className="adash-arrow">→</span>
        </Link>

        <Link to="/admin/reports" className="adash-card ap-card">
          <div className="adash-card-icon" style={{ background: '#fef3c7' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
            </svg>
          </div>
          <h3>Reports & Analytics</h3>
          <p>View system performance reports</p>
          <span className="adash-arrow">→</span>
        </Link>

        <Link to="/admin/activity" className="adash-card ap-card">
          <div className="adash-card-icon" style={{ background: '#fee2e2' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <h3>Activity Monitor</h3>
          <p>Track and monitor system activities</p>
          <span className="adash-arrow">→</span>
        </Link>
      </div>
    </AdminLayout>
  );
}
