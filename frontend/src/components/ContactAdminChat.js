import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { sendMessage, getMyMessages, getMyUnreadCount } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ContactAdminChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const panelRef = useRef();

  const loadMessages = async () => {
    try {
      const { data } = await getMyMessages();
      setMessages(data || []);
    } catch (err) {
      console.error('Failed to fetch admin messages', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUnread = async () => {
    try {
      const { data } = await getMyUnreadCount();
      setUnreadCount(data?.count || 0);
    } catch (err) {
      console.error('Failed to get admin unread count', err);
    }
  };

  useEffect(() => {
    loadMessages();
    loadUnread();

    const openChat = () => setOpen(true);
    window.addEventListener('open-chat', openChat);
    return () => window.removeEventListener('open-chat', openChat);
  }, []);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [open, messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Please enter a message before sending.');
      return;
    }

    // Check if user is logged in
    if (!user || !user.token) {
      toast.error('You are not logged in. Please login again.');
      return;
    }

    setSending(true);
    try {
      await sendMessage({ subject: subject.trim(), content: content.trim() });
      toast.success('Message sent to admin successfully.');
      setContent('');
      setSubject('');
      await loadMessages();
      await loadUnread();
    } catch (err) {
      console.error('Send message error:', err);
      toast.error(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const grouped = messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="contact-admin-widget">
      <button
        aria-label="Contact admin"
        className="contact-admin-fab"
        onClick={() => setOpen(prev => !prev)}
      >
        💬
        {unreadCount > 0 && <span className="contact-admin-unread">{unreadCount}</span>}
      </button>

      {open && (
        <div className="contact-admin-panel">
          <div className="contact-admin-header">
            <div>
              <strong>Contact Admin</strong>
              <div className="contact-admin-subtitle">{user?.name || 'You'}</div>
            </div>
            <button onClick={() => setOpen(false)} className="contact-admin-close">✕</button>
          </div>

          <div className="contact-admin-history">
            {loading ? (
              <div className="contact-admin-loading">Loading...</div>
            ) : grouped.length === 0 ? (
              <div className="contact-admin-empty">No admin messages yet. Send the first one!</div>
            ) : (
              grouped.map((msg) => (
                <div key={msg._id} className="contact-admin-thread-item">
                  <div className="contact-admin-message user-message">
                    <div><strong>You</strong> <span className="small-gray">{new Date(msg.createdAt).toLocaleString()}</span></div>
                    <div>{msg.content}</div>
                    {msg.subject && <div className="small-gray">Subject: {msg.subject}</div>}
                  </div>

                  {msg.replies?.map((reply, index) => (
                    <div key={`${msg._id}-${index}`} className="contact-admin-message admin-reply">
                      <div><strong>Admin</strong> <span className="small-gray">{new Date(reply.createdAt).toLocaleString()}</span></div>
                      <div>{reply.content}</div>
                    </div>
                  ))}
                </div>
              ))
            )}
            <div ref={panelRef} />
          </div>

          <form className="contact-admin-form" onSubmit={handleSend}>
            <input
              type="text"
              className="contact-admin-input"
              placeholder="Subject (optional)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <textarea
              className="contact-admin-textarea"
              placeholder="Type your message to admin..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              required
            />
            <button type="submit" className="contact-admin-submit" disabled={sending}>
              {sending ? 'Sending…' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
