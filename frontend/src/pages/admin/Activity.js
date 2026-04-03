import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getSystemStats, getAllResults, getRecentActivity } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import './Admin.css';

// helper — "2 hours ago" style
const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
};

export default function Activity() {
  const [stats, setStats]           = useState(null);
  const [actFilter, setActFilter]   = useState('All');
  const [alerts, setAlerts]         = useState([]);
  const [selected, setSelected]     = useState(null);
  const [recentActs, setRecentActs] = useState([]);
  const [attemptLogs, setAttemptLogs] = useState([]);
  const [actSearch, setActSearch]   = useState('');
  const [logSearch, setLogSearch]   = useState('');
  const [loading, setLoading]       = useState(true);

  // Detect suspicious activity from results data
  const detectSuspiciousActivity = (results) => {
    const detectedAlerts = [];

    if (!results || results.length === 0) return detectedAlerts;

    // Group results by student to detect rapid submissions
    const studentSubmissions = {};
    results.forEach(result => {
      const studentId = result.student?._id || result.student;
      if (!studentSubmissions[studentId]) {
        studentSubmissions[studentId] = [];
      }
      studentSubmissions[studentId].push(result);
    });

    // Detect rapid quiz submissions
    Object.entries(studentSubmissions).forEach(([studentId, submissions]) => {
      // Check if student submitted multiple quizzes in a short time
      if (submissions.length >= 3) {
        const sortedByTime = submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        const timeDiff = new Date(sortedByTime[0].submittedAt) - new Date(sortedByTime[2].submittedAt);
        const minutesDiff = timeDiff / 60000;

        if (minutesDiff < 10) {
          const studentName = submissions[0].student?.name || 'Unknown Student';
          detectedAlerts.push({
            id: `rapid_${studentId}_${Date.now()}`,
            user: studentName,
            severity: 'Medium',
            desc: `Rapid quiz submissions (${submissions.length} quizzes in ${Math.round(minutesDiff)} minutes)`,
            time: timeAgo(sortedByTime[0].submittedAt),
            status: 'open',
            details: [
              `Student submitted ${submissions.length} quizzes within ${Math.round(minutesDiff)} minutes`,
              `Average time per quiz: ${Math.round(minutesDiff / submissions.length)} minutes`,
              'Unusually fast completion time',
              'Possible use of external resources',
            ],
            actions: ['Suspend User', 'Reset Scores', 'Dismiss']
          });
        }
      }
    });

    return detectedAlerts;
  };

  // Fetch data with real-time polling
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, aRes, rRes] = await Promise.all([
          getSystemStats(),
          getRecentActivity(),
          getAllResults()
        ]);
        setStats(sRes.data);
        setRecentActs(aRes.data);
        setAttemptLogs(rRes.data);

        // Detect suspicious activity from real data
        const detectedAlerts = detectSuspiciousActivity(rRes.data);
        setAlerts(detectedAlerts);
      } catch (err) {
        console.error('Error fetching activity data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up polling to refresh every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredActs = recentActs
    .filter(a => actFilter === 'All' || a.role === actFilter.toLowerCase())
    .filter(a => !actSearch || a.name.toLowerCase().includes(actSearch.toLowerCase()) || a.module.toLowerCase().includes(actSearch.toLowerCase()));

  const filteredLogs = attemptLogs.filter(l =>
    !logSearch ||
    l.student?.studentId?.includes(logSearch) ||
    l.student?.name?.toLowerCase().includes(logSearch.toLowerCase()) ||
    l.quiz?.title?.toLowerCase().includes(logSearch.toLowerCase())
  );

  const openAlerts = alerts.filter(a => a.status === 'open');

  const handleAction = (alertId, action) => {
    if (action === 'Dismiss') {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success('Alert dismissed');
      setSelected(null);
    } else if (action === 'Suspend User') {
      toast.warning('User suspension requires manual review by administrator');
      setSelected(null);
    } else if (action === 'Reset Scores') {
      toast.warning('Score reset requires manual review by administrator');
      setSelected(null);
    }
  };

  return (
    <AdminLayout pageTitle="Activity">

      {/* ── Investigate Modal ── */}
      {selected && (
        <div className="inv-overlay" onClick={() => setSelected(null)}>
          <div className="inv-modal" onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className={`inv-modal-header inv-header-${selected.severity.toLowerCase()}`}>
              <div>
                <span className={`act-sev-badge act-sev-${selected.severity.toLowerCase()}`}>
                  {selected.severity} Risk
                </span>
                <h2 className="inv-modal-title">{selected.desc}</h2>
                <p className="inv-modal-user">👤 {selected.user} &nbsp;·&nbsp; 🕒 {selected.time}</p>
              </div>
              <button className="inv-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            {/* Details */}
            <div className="inv-modal-body">
              <h3 className="inv-section-label">🔍 What was detected</h3>
              <ul className="inv-details-list">
                {selected.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>

              <h3 className="inv-section-label" style={{ marginTop: 20 }}>⚡ Take Action</h3>
              <p className="inv-action-hint">Choose an action to resolve this alert:</p>

              <div className="inv-actions">
                {selected.actions.map((action, i) => (
                  <button
                    key={i}
                    className={`inv-action-btn ${action === 'Dismiss' ? 'inv-btn-dismiss' : action.includes('Suspend') || action.includes('Block') ? 'inv-btn-danger' : 'inv-btn-warning'}`}
                    onClick={() => handleAction(selected.id, action)}
                  >
                    {action === 'Block IP'       && '🚫 '}
                    {action === 'Suspend User'   && '⛔ '}
                    {action === 'Reset Scores'   && '🔄 '}
                    {action === 'Dismiss'        && '✅ '}
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="ap-header">
        <div>
          <h1>Activity Monitoring</h1>
          <p>Track and monitor system activities</p>
          <span style={{ fontSize: 12, color: '#10b981', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }}/>
            Live • Auto-updating every 5 seconds
          </span>
        </div>
      </div>

      {/* Stats - Calculate active sessions from recent unique users */}
      {(() => {
        const activeUsers = new Set(recentActs.map(a => a.name)).size;
        return (
          <div className="ap-stats">
            {[
              { label: 'Active Sessions',   value: activeUsers,           icon: '🖥️', iconBg: '#312e81' },
              { label: 'Recent Activities', value: recentActs.length,     icon: '📋', iconBg: '#065f46' },
              { label: "Today's Attempts",  value: attemptLogs.length,    icon: '📝', iconBg: '#92400e' },
              { label: 'Open Alerts',       value: openAlerts.length,     icon: '⚠️', iconBg: '#991b1b' },
            ].map((s, i) => (
          <div key={i} className="ap-stat-card">
            <div className="ap-stat-label">{s.label}</div>
            <div className="ap-stat-num">{s.value}</div>
            <div className="ap-stat-icon" style={{ background: s.iconBg }}>
              <span style={{ fontSize: 14 }}>{s.icon}</span>
            </div>
          </div>
        ))}
          </div>
        );
      })()}

      {/* Suspicious Activity Alerts */}
      <div className="act-alert-card">
        <div className="act-alert-header">
          <span>Suspicious Activity Alerts</span>
          {openAlerts.length > 0 && <div className="act-alert-dot" />}
        </div>

        {openAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            ✅ No suspicious activity detected
          </div>
        ) : (
          openAlerts.map((a) => (
            <div key={a.id} className={`act-alert-item act-alert-${a.severity.toLowerCase()}`}>
              <div className="act-alert-info">
                <div className="act-alert-user">{a.user}</div>
                <div className="act-alert-sev">
                  <span className={`act-sev-badge act-sev-${a.severity.toLowerCase()}`}>{a.severity}</span>
                </div>
                <div className="act-alert-desc">{a.desc}</div>
                <div className="act-alert-time">{a.time}</div>
              </div>
              <button className="act-investigate" onClick={() => setSelected(a)}>
                Investigate
              </button>
            </div>
          ))
        )}
      </div>

      {/* Recent Activities Table */}
      <div className="ap-card" style={{ marginTop: 20 }}>
        <div className="act-table-header">
          <h3>Recent Activities</h3>
          <div className="act-filters">
            {['All', 'Lecturer', 'Student'].map(f => (
              <button
                key={f}
                className={`act-filter-btn ${actFilter === f ? 'act-filter-active' : ''}`}
                onClick={() => setActFilter(f)}
              >{f}</button>
            ))}
            <div className="act-search-box">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                placeholder="Search"
                value={actSearch}
                onChange={e => setActSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: 12, background: 'transparent', width: 100 }}
              />
            </div>
          </div>
        </div>
        <table className="um-table">
          <thead>
            <tr><th>Name</th><th>Role</th><th>Activity</th><th>Module</th><th>Time</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '28px 0', color: '#9ca3af' }}>Loading...</td></tr>
            ) : filteredActs.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '28px 0', color: '#9ca3af' }}>No activity yet</td></tr>
            ) : (
              filteredActs.map((a, i) => (
                <tr key={i}>
                  <td>
                    <div className="um-user-cell">
                      <div className="um-avatar" style={{ background: a.role === 'lecturer' ? '#059669' : '#4f46e5', fontSize: 12 }}>
                        {a.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="um-uname">{a.name}</span>
                    </div>
                  </td>
                  <td className="um-email" style={{ textTransform: 'capitalize' }}>{a.role}</td>
                  <td style={{ fontSize: 13, fontWeight: 500 }}>{a.activity}</td>
                  <td style={{ fontSize: 13, color: '#6b7280' }}>{a.module}</td>
                  <td style={{ fontSize: 12, color: '#9ca3af' }}>{timeAgo(a.time)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Quiz Attempt Logs */}
      <div className="ap-card" style={{ marginTop: 20 }}>
        <div className="act-table-header" style={{ marginBottom: 14 }}>
          <h3>Quiz Attempt Logs</h3>
          <div className="act-filters">
            <div className="act-search-box">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                placeholder="Search student or quiz..."
                value={logSearch}
                onChange={e => setLogSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: 12, background: 'transparent', width: 140 }}
              />
            </div>
          </div>
        </div>
        <table className="um-table">
          <thead>
            <tr><th>Student</th><th>Student ID</th><th>Quiz</th><th>Score</th><th>Time Taken</th><th>Date</th><th>Status</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '28px 0', color: '#9ca3af' }}>Loading...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '28px 0', color: '#9ca3af' }}>No quiz attempts yet</td></tr>
            ) : (
              filteredLogs.map((l, i) => (
                <tr key={i}>
                  <td>
                    <div className="um-user-cell">
                      <div className="um-avatar" style={{ background: '#4f46e5', fontSize: 12 }}>
                        {l.student?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="um-uname">{l.student?.name || '—'}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: '#6b7280' }}>{l.student?.studentId || '—'}</td>
                  <td style={{ fontSize: 13 }}>{l.quiz?.title || '—'}</td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>
                    {l.score}/{l.totalMarks} ({l.percentage}%)
                  </td>
                  <td style={{ fontSize: 13, color: '#6b7280' }}>
                    {Math.floor(l.timeTaken / 60)}m {l.timeTaken % 60}s
                  </td>
                  <td style={{ fontSize: 12, color: '#9ca3af' }}>
                    {new Date(l.submittedAt).toLocaleString()}
                  </td>
                  <td>
                    <span className={`um-status-badge ${l.passed ? 'um-active' : 'um-inactive'}`}>
                      {l.passed ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
