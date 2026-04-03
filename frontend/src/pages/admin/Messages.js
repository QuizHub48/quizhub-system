import React, { useEffect, useState, useRef } from 'react';
import { getAllMessages, getMessageThread, replyToMessage, markMessageRead } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import './Admin.css';

const timeStr = (date) => {
  const d = new Date(date);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const timeAgo = (date) => {
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const roleColor = { student: '#4f46e5', lecturer: '#059669' };
const roleLabel = { student: 'Student', lecturer: 'Lecturer' };

export default function AdminMessages() {
  const [messages, setMessages]       = useState([]);
  const [threads, setThreads]         = useState([]); // unique senders
  const [selected, setSelected]       = useState(null); // selected userId
  const [thread, setThread]           = useState([]);
  const [reply, setReply]             = useState('');
  const [sending, setSending]         = useState(false);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const bottomRef = useRef(null);

  const loadMessages = async () => {
    try {
      const { data } = await getAllMessages();
      setMessages(data);
      // Build unique sender list (latest message first per sender)
      const map = {};
      data.forEach(msg => {
        const uid = msg.sender?._id;
        if (!uid) return;
        if (!map[uid] || new Date(msg.createdAt) > new Date(map[uid].lastAt)) {
          map[uid] = {
            userId: uid,
            name: msg.sender.name,
            email: msg.sender.email,
            role: msg.sender.role,
            department: msg.sender.department,
            lastMessage: msg.content,
            lastAt: msg.createdAt,
            unread: data.filter(m => m.sender?._id === uid && !m.readByAdmin).length,
          };
        }
      });
      setThreads(Object.values(map).sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMessages(); }, []);

  useEffect(() => {
    if (selected) loadThread(selected);
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const loadThread = async (userId) => {
    try {
      const { data } = await getMessageThread(userId);
      setThread(data);
      // refresh unread counts
      setThreads(prev => prev.map(t => t.userId === userId ? { ...t, unread: 0 } : t));
    } catch {}
  };

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      // Find the latest message from this user to reply to
      const latest = thread[thread.length - 1];
      if (!latest) return;
      await replyToMessage(latest._id, reply.trim());
      setReply('');
      await loadThread(selected);
    } catch {}
    finally { setSending(false); }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); }
  };

  const selectedThread = threads.find(t => t.userId === selected);
  const filteredThreads = threads.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );
  const totalUnread = threads.reduce((s, t) => s + t.unread, 0);

  return (
    <AdminLayout pageTitle="Messages">
      <div style={{ display: 'flex', height: 'calc(100vh - 130px)', gap: 20 }}>

        {/* ── Left: Sender List ── */}
        <div style={{
          width: 320, flexShrink: 0,
          background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          {/* Header */}
          <div style={{ padding: '18px 18px 12px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1e1b4b' }}>
                Messages
                {totalUnread > 0 && (
                  <span style={{ marginLeft: 8, background: '#7c3aed', color: '#fff', borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>
                    {totalUnread}
                  </span>
                )}
              </h2>
            </div>
            <div style={{ position: 'relative' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search users…"
                style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 10px 7px 30px', fontSize: 12.5, outline: 'none', boxSizing: 'border-box', color: '#374151' }}
              />
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Loading…</div>
            ) : filteredThreads.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                No messages yet
              </div>
            ) : filteredThreads.map(t => (
              <div
                key={t.userId}
                onClick={() => setSelected(t.userId)}
                style={{
                  padding: '13px 16px', cursor: 'pointer', borderBottom: '1px solid #f9fafb',
                  background: selected === t.userId ? '#f5f3ff' : t.unread > 0 ? '#fdfcff' : '#fff',
                  borderLeft: selected === t.userId ? '3px solid #7c3aed' : '3px solid transparent',
                  transition: 'background 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: `hsl(${(t.name?.charCodeAt(0) || 65) * 47 % 360}, 52%, 52%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 14, fontWeight: 700
                  }}>{t.name?.charAt(0)?.toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: t.unread > 0 ? 700 : 600, fontSize: 13.5, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{t.name}</span>
                      <span style={{ fontSize: 10.5, color: '#9ca3af', flexShrink: 0 }}>{timeAgo(t.lastAt)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ background: (roleColor[t.role] || '#6b7280') + '18', color: roleColor[t.role] || '#6b7280', padding: '1px 7px', borderRadius: 20, fontSize: 10.5, fontWeight: 600 }}>
                        {roleLabel[t.role] || t.role}
                      </span>
                      <span style={{ fontSize: 11.5, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.lastMessage?.slice(0, 30)}{t.lastMessage?.length > 30 ? '…' : ''}</span>
                    </div>
                  </div>
                  {t.unread > 0 && (
                    <span style={{ background: '#7c3aed', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {t.unread}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Thread / Compose ── */}
        <div style={{
          flex: 1, background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', gap: 12 }}>
              <div style={{ fontSize: 52 }}>💬</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#6b7280' }}>Select a conversation</div>
              <div style={{ fontSize: 13 }}>Click on a user to view their messages</div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div style={{ padding: '16px 22px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: `hsl(${(selectedThread?.name?.charCodeAt(0) || 65) * 47 % 360}, 52%, 52%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 16, fontWeight: 700, flexShrink: 0
                }}>{selectedThread?.name?.charAt(0)?.toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#1e1b4b' }}>{selectedThread?.name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    {selectedThread?.email}
                    {selectedThread?.department && <span> · {selectedThread.department}</span>}
                    <span style={{ marginLeft: 6, background: (roleColor[selectedThread?.role] || '#6b7280') + '18', color: roleColor[selectedThread?.role] || '#6b7280', padding: '1px 8px', borderRadius: 20, fontWeight: 600, fontSize: 11 }}>
                      {roleLabel[selectedThread?.role]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14, background: '#faf9ff' }}>
                {thread.map((msg) => (
                  <div key={msg._id}>
                    {/* User message */}
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 4 }}>
                      <div style={{ maxWidth: '72%' }}>
                        {msg.subject && (
                          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>Subject: <strong>{msg.subject}</strong></div>
                        )}
                        <div style={{
                          background: '#fff', border: '1.5px solid #ede9fe',
                          color: '#1e1b4b', borderRadius: '14px 14px 14px 4px',
                          padding: '10px 14px', fontSize: 13.5, lineHeight: 1.55,
                          boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                        }}>{msg.content}</div>
                        <div style={{ fontSize: 10.5, color: '#9ca3af', marginTop: 3 }}>
                          {msg.sender?.name} · {timeStr(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                    {/* Admin replies */}
                    {msg.replies?.map((r, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                        <div style={{ maxWidth: '72%' }}>
                          <div style={{
                            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                            color: '#fff', borderRadius: '14px 14px 4px 14px',
                            padding: '10px 14px', fontSize: 13.5, lineHeight: 1.55
                          }}>{r.content}</div>
                          <div style={{ fontSize: 10.5, color: '#9ca3af', textAlign: 'right', marginTop: 3 }}>
                            You (Admin) · {timeStr(r.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Reply box */}
              <div style={{ padding: '12px 18px', background: '#fff', borderTop: '1px solid #f3f0ff', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={`Reply to ${selectedThread?.name}…`}
                  rows={2}
                  style={{
                    flex: 1, border: '1.5px solid #ddd6fe', borderRadius: 10,
                    padding: '10px 13px', fontSize: 13.5, outline: 'none',
                    resize: 'none', fontFamily: 'inherit', lineHeight: 1.4,
                    maxHeight: 120, overflowY: 'auto', color: '#374151'
                  }}
                />
                <button
                  onClick={handleReply}
                  disabled={sending || !reply.trim()}
                  style={{
                    height: 42, paddingLeft: 20, paddingRight: 20,
                    borderRadius: 10, border: 'none',
                    background: reply.trim() ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : '#e5e7eb',
                    color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: reply.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0, transition: 'background 0.2s'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
