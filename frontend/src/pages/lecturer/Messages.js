import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getDirectMessages, replyToDirectMessage, markDirectMessageRead, getDirectUnreadCount } from '../../services/api';
import LecturerLayout from '../../components/LecturerLayout';
import './Lecturer.css';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data } = await getDirectMessages();
      setMessages(data);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setReplying(true);
    try {
      await replyToDirectMessage(selectedMessage._id, replyContent);
      toast.success('Reply sent!');
      setReplyContent('');
      setSelectedMessage(null);
      fetchMessages();
    } catch (err) {
      toast.error('Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await markDirectMessageRead(id);
      setMessages(msgs => msgs.map(m => m._id === id ? { ...m, readByRecipient: true } : m));
    } catch (err) {
      console.error('Failed to mark as read');
    }
  };

  if (loading) return <LecturerLayout pageTitle="Messages"><div className="al-loading">Loading...</div></LecturerLayout>;

  return (
    <LecturerLayout pageTitle="Messages">
      <div className="ap-header">
        <div>
          <h1>Student Messages</h1>
          <p>Communicate with your students</p>
        </div>
      </div>

      {/* Reply Modal */}
      {selectedMessage && (
        <div className="inv-overlay" onClick={() => setSelectedMessage(null)}>
          <div className="inv-modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h2 className="inv-modal-title">Reply to {selectedMessage.senderName}</h2>
              <button className="inv-close" onClick={() => setSelectedMessage(null)}>✕</button>
            </div>
            <div className="inv-modal-body">
              <div style={{ marginBottom: 16, padding: 12, background: '#f9fafb', borderRadius: 8 }}>
                <strong>From {selectedMessage.senderName}:</strong> {selectedMessage.content}
              </div>
              <form onSubmit={handleReply}>
                <div className="form-group">
                  <label>Your Reply</label>
                  <textarea
                    className="eu-input"
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="submit" className="ap-btn-purple" disabled={replying}>
                    {replying ? 'Sending…' : 'Send Reply'}
                  </button>
                  <button type="button" className="ap-btn-purple" onClick={() => setSelectedMessage(null)} style={{ background: '#6b7280' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="ap-card">
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
            No messages from students yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map(msg => (
              <div key={msg._id} style={{
                padding: 16, border: '1px solid #e5e7eb', borderRadius: 8,
                background: msg.readByRecipient ? '#fff' : '#f0f9ff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <strong>{msg.senderName}</strong> {msg.subject && <span style={{ color: '#6b7280' }}>— {msg.subject}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <p style={{ margin: '8px 0', color: '#374151' }}>{msg.content}</p>
                {msg.replies.length > 0 && (
                  <div style={{ marginTop: 12, padding: 12, background: '#f9fafb', borderRadius: 6 }}>
                    <strong>Your replies:</strong>
                    {msg.replies.map((reply, i) => (
                      <div key={i} style={{ marginTop: 8, padding: 8, background: '#fff', borderRadius: 4 }}>
                        <p style={{ margin: 4, color: '#374151' }}>{reply.content}</p>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(reply.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button
                    className="ap-btn-purple"
                    style={{ fontSize: 12, padding: '6px 12px' }}
                    onClick={() => {
                      setSelectedMessage(msg);
                      if (!msg.readByRecipient) markAsRead(msg._id);
                    }}
                  >
                    Reply
                  </button>
                  {!msg.readByRecipient && (
                    <button
                      className="ap-btn-purple"
                      style={{ fontSize: 12, padding: '6px 12px', background: '#10b981' }}
                      onClick={() => markAsRead(msg._id)}
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </LecturerLayout>
  );
}