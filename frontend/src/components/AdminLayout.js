import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markNotificationRead, markAllNotificationsRead, getAdminUnreadCount } from '../services/api';
import logo from '../assets/logo_trans_tight.png';
import './AdminLayout.css';

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const CoursesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const ReportsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);
const ActivityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const ProfileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const MessagesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const navItems = [
  { path: '/admin',           label: 'Dashboard',       icon: <DashboardIcon />, exact: true },
  { path: '/admin/users',     label: 'User Management', icon: <UsersIcon /> },
  { path: '/admin/courses',   label: 'Courses',         icon: <CoursesIcon /> },
  { path: '/admin/reports',   label: 'Reports',         icon: <ReportsIcon /> },
  { path: '/admin/activity',  label: 'Activity',        icon: <ActivityIcon /> },
  { path: '/admin/messages',  label: 'Messages',        icon: <MessagesIcon /> },
  { path: '/admin/profile',   label: 'Profile',         icon: <ProfileIcon /> },
];

// Helper to format time ago
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const notifIcons = {
  user_registered: '👤',
  quiz_submitted: '📝',
  suspicious_activity: '⚠️',
  course_created: '📚',
  quiz_published: '✅',
};

export default function AdminLayout({ children, pageTitle }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [bellOpen, setBellOpen]   = useState(false);
  const [notifs, setNotifs]       = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(true);
  const [msgUnread, setMsgUnread] = useState(0);
  const siteLogo = useMemo(() => localStorage.getItem('siteLogo') || null, []);

  /* Load notifications on mount */
  useEffect(() => {
    loadNotifications();
    const loadMsgCount = () => getAdminUnreadCount().then(r => setMsgUnread(r.data.count)).catch(() => {});
    loadMsgCount();
    const interval = setInterval(() => { loadNotifications(); loadMsgCount(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = () => {
    getNotifications()
      .then(({ data }) => {
        setNotifs(data.map(n => ({
          ...n,
          id: n._id,
          icon: notifIcons[n.type] || '📢',
          desc: n.description,
          time: timeAgo(n.createdAt),
        })));
      })
      .catch(() => {})
      .finally(() => setNotifsLoading(false));
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (path, exact) =>
    exact ? location.pathname === path : location.pathname === path;

  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = () => {
    markAllNotificationsRead().then(() => loadNotifications()).catch(() => {});
  };

  const markRead = (id) => {
    markNotificationRead(id).then(() => loadNotifications()).catch(() => {});
  };

  return (
    <div className="al-wrapper" onClick={() => bellOpen && setBellOpen(false)}>
      {/* ── Sidebar ── */}
      <aside className="al-sidebar">
        <div className="al-logo">
          <Link to="/admin">
            {siteLogo ? (
              <img src={siteLogo} alt="Site Logo" className="al-logo-img" style={{ objectFit: 'contain' }} />
            ) : (
              <img src={logo} alt="QuizHub Logo" className="al-logo-img" />
            )}
          </Link>
        </div>

        <nav className="al-nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`al-nav-item ${isActive(item.path, item.exact) ? 'al-active' : ''}`}
            >
              <span className="al-nav-icon">{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.path === '/admin/messages' && msgUnread > 0 && (
                <span style={{
                  background: '#ef4444', color: '#fff', borderRadius: 20,
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 16,
                  textAlign: 'center', lineHeight: '16px'
                }}>{msgUnread}</span>
              )}
            </Link>
          ))}
        </nav>

        <button className="al-logout" onClick={handleLogout}>
          <LogoutIcon />
          <span>Log Out</span>
        </button>
      </aside>

      {/* ── Main ── */}
      <div className="al-body">
        <header className="al-header">
          <div className="al-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input placeholder="Search" />
          </div>

          <div className="al-header-right">
            {/* Admin name → click goes to profile */}
            <Link to="/admin/profile" className="al-huser">
              <div className="al-havatar">
                {user?.profilePicture
                  ? <img src={user.profilePicture} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  : user?.name?.charAt(0).toUpperCase()
                }
              </div>
              <span className="al-hname">{user?.name}</span>
            </Link>

            {/* Bell with notification dropdown */}
            <div className="al-bell-wrap" onClick={e => { e.stopPropagation(); setBellOpen(!bellOpen); }}>
              <button className="al-bell">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="al-bell-badge">{unreadCount}</span>
                )}
              </button>

              {bellOpen && (
                <div className="al-notif-dropdown" onClick={e => e.stopPropagation()}>
                  <div className="al-notif-header">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <button className="al-notif-mark-all" onClick={markAllRead}>
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="al-notif-list">
                    {notifsLoading ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                        Loading notifications…
                      </div>
                    ) : notifs.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                        No notifications
                      </div>
                    ) : (
                      notifs.map(n => (
                        <div
                          key={n.id}
                          className={`al-notif-item ${!n.read ? 'al-notif-unread' : ''}`}
                          onClick={() => markRead(n.id)}
                        >
                          <div className="al-notif-icon">{n.icon}</div>
                          <div className="al-notif-body">
                            <div className="al-notif-title">{n.title}</div>
                            <div className="al-notif-desc">{n.desc}</div>
                            <div className="al-notif-time">{n.time}</div>
                          </div>
                          {!n.read && <div className="al-notif-dot" />}
                        </div>
                      ))
                    )}
                  </div>

                  <Link to="/admin/activity" className="al-notif-footer" onClick={() => setBellOpen(false)}>
                    View all activity →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {pageTitle && <div className="al-breadcrumb">{pageTitle}</div>}

        <main className="al-main">{children}</main>

        <footer className="al-footer">
          <a
            href="https://mail.google.com/mail/?view=cm&to=hubquiz48@gmail.com"
            target="_blank"
            rel="noreferrer"
            className="al-footer-email"
          >Contact: hubquiz48@gmail.com</a>
          <span>© 2026 Quiz Hub. All rights reserved.</span>
        </footer>
      </div>
    </div>
  );
}
