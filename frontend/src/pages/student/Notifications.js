import React, { useEffect, useState } from 'react';
import StudentLayout from '../../components/StudentLayout';
import { getStudentNotifications, markNotificationAsRead } from '../../services/api';
import './Student.css';

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await getStudentNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await markNotificationAsRead(notifId);
      setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const notifIcons = {
    quiz_submitted: '📝',
    quiz_published: '✅',
    user_registered: '👤',
    course_created: '📚',
    suspicious_activity: '⚠️',
  };

  const getNotificationIcon = (type) => {
    return notifIcons[type] || '📢';
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'quiz_published': return '#059669';
      case 'quiz_submitted': return '#0891b2';
      case 'user_registered': return '#7c3aed';
      case 'course_created': return '#f59e0b';
      case 'suspicious_activity': return '#dc2626';
      default: return '#6b7280';
    }
  };

  if (loading) return <div className="loading">Loading notifications...</div>;

  return (
    <StudentLayout pageTitle="Notifications">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ marginTop: 0, marginBottom: 4, fontSize: 28, fontWeight: 600 }}>Notifications</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Stay updated with quiz announcements and results</p>
        </div>

        {notifications.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
            <p>No notifications yet. Check back later for updates!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notifications.map(notification => (
              <div
                key={notification._id}
                onClick={() => !notification.read && handleMarkAsRead(notification._id)}
                style={{
                  background: 'white',
                  border: `1px solid ${notification.read ? '#e5e7eb' : '#e0f2fe'}`,
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                  opacity: notification.read ? 0.8 : 1,
                  backgroundColor: notification.read ? '#ffffff' : '#f0f9ff',
                  cursor: !notification.read ? 'pointer' : 'default',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => !notification.read && (e.currentTarget.style.backgroundColor = '#e0f2fe')}
                onMouseLeave={(e) => !notification.read && (e.currentTarget.style.backgroundColor = '#f0f9ff')}
              >
                <div style={{
                  fontSize: 24,
                  minWidth: '32px',
                  textAlign: 'center',
                  opacity: 0.7
                }}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <h3 style={{
                      margin: '0',
                      fontSize: 16,
                      fontWeight: 600,
                      color: getNotificationColor(notification.type)
                    }}>
                      {notification.title}
                    </h3>
                    <span style={{
                      fontSize: 12,
                      color: '#9ca3af',
                      whiteSpace: 'nowrap',
                      marginLeft: '16px'
                    }}>
                      {timeAgo(notification.createdAt)}
                    </span>
                  </div>
                  <p style={{
                    margin: '0',
                    fontSize: 14,
                    color: '#6b7280',
                    lineHeight: '1.5'
                  }}>
                    {notification.description}
                  </p>
                </div>
                {!notification.read && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#0284c7',
                    marginTop: '6px',
                    flexShrink: 0
                  }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
