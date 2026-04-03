import React, { useEffect, useState } from 'react';
import { getSystemStats, getAllResults, getQuizzes, getAllUsers } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import './Admin.css';

// Simple SVG Line Chart
const LineChart = ({ data1, data2, labels }) => {
  const W = 380, H = 140, pad = 30;
  const max = 150;
  const toX = i => pad + (i / (labels.length - 1)) * (W - pad * 2);
  const toY = v => H - pad - (v / max) * (H - pad * 2);
  const pts = (arr) => arr.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 160 }}>
      {/* Grid lines */}
      {[0, 50, 100, 150].map(v => (
        <g key={v}>
          <line x1={pad} y1={toY(v)} x2={W - pad} y2={toY(v)} stroke="#e5e0f5" strokeWidth="1"/>
          <text x={pad - 6} y={toY(v) + 4} textAnchor="end" fontSize="10" fill="#aaa">{v}</text>
        </g>
      ))}
      {/* Lines */}
      <polyline points={pts(data1)} fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points={pts(data2)} fill="none" stroke="#a78bfa" strokeWidth="2" strokeDasharray="4,3" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Data points */}
      {data1.map((v, i) => <circle key={i} cx={toX(i)} cy={toY(v)} r="3.5" fill="white" stroke="#7c3aed" strokeWidth="2"/>)}
      {/* X labels */}
      {labels.map((l, i) => (
        <text key={i} x={toX(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#aaa">{l}</text>
      ))}
    </svg>
  );
};

// Simple SVG Bar Chart
const BarChart = ({ data }) => {
  const W = 340, H = 140, pad = 20;
  const max = Math.max(...data.map(d => d.val));
  const barW = (W - pad * 2) / data.length - 8;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 160 }}>
      {data.map((d, i) => {
        const x = pad + i * ((W - pad * 2) / data.length) + 4;
        const barH = (d.val / max) * (H - pad * 2 - 20);
        const y = H - pad - barH - 16;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx="4"
              fill={i % 2 === 0 ? '#7c3aed' : '#a78bfa'} />
            <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize="9" fill="#aaa">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [results, setResults] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [users, setUsers] = useState([]);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  // Function to calculate monthly trends from results data
  const calculateMonthlyTrends = (resultsData) => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const attempts = Array(8).fill(0);
    const created = Array(8).fill(0);

    if (resultsData && Array.isArray(resultsData)) {
      resultsData.forEach(result => {
        const date = new Date(result.submittedAt);
        const month = date.getMonth();
        if (month < 8) attempts[month]++;
      });
    }

    return { attempts, created };
  };

  // Function to calculate quiz performance from results
  const calculateQuizPerformance = (resultsData) => {
    const perfMap = {};

    if (resultsData && Array.isArray(resultsData)) {
      resultsData.forEach(result => {
        const title = result.quiz?.title?.substring(0, 3).toUpperCase() || 'QZ';
        perfMap[title] = (perfMap[title] || 0) + (result.score || 0);
      });
    }

    return Object.entries(perfMap).slice(0, 7).map(([label, val]) => ({
      label,
      val: Math.min(val, 100)
    }));
  };

  // Function to calculate performance metrics
  const calculateMetrics = (resultsData) => {
    if (!resultsData || resultsData.length === 0) {
      return { completionRate: 85, avgScore: 100, passRate: 78 };
    }

    const avgScore = Math.round(resultsData.reduce((sum, r) => sum + (r.score || 0), 0) / resultsData.length);
    const passed = resultsData.filter(r => r.score >= 50).length;
    const passRate = Math.round((passed / resultsData.length) * 100);

    return {
      completionRate: 85,
      avgScore,
      passRate
    };
  };

  // Calculate Quiz Reports metrics
  const getQuizMetrics = () => {
    if (!quizzes || quizzes.length === 0) {
      return { totalQuizzes: 0, avgScore: 0, completionRate: 0 };
    }

    const totalQuizzes = quizzes.length;
    const quizResults = results.filter(r => r.quiz);
    const avgScore = quizResults.length > 0
      ? Math.round(quizResults.reduce((sum, r) => sum + (r.score || 0), 0) / quizResults.length)
      : 0;
    const completionRate = quizzes.length > 0
      ? Math.round((quizResults.length / (quizzes.length * Math.max(1, users.filter(u => u.role === 'student').length))) * 100)
      : 0;

    return { totalQuizzes, avgScore, completionRate };
  };

  // Calculate User Reports metrics
  const getUserMetrics = () => {
    const activeUsers = users.filter(u => u.role === 'student').length;
    const totalAttempts = results.length;
    const engagementRate = activeUsers > 0
      ? Math.round((results.filter(r => r.student).length / (activeUsers * Math.max(1, quizzes.length))) * 100)
      : 0;

    return { activeUsers, totalAttempts, engagementRate };
  };

  // Export to CSV
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Fetch data initially and set up polling
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, resultsRes, quizzesRes, usersRes] = await Promise.all([
          getSystemStats(),
          getAllResults(),
          getQuizzes(),
          getAllUsers()
        ]);
        setStats(statsRes.data);
        setResults(resultsRes.data || []);
        setQuizzes(quizzesRes.data || []);
        setUsers(usersRes.data || []);
      } catch (err) {
        console.error('Error fetching reports data:', err);
      }
    };

    fetchData();

    // Set up polling to refresh every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate data from results
  const { attempts: monthlyAttempts, created: monthlyCreated } = calculateMonthlyTrends(results);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'];
  const perfData = calculateQuizPerformance(results);
  const metrics = calculateMetrics(results);

  return (
    <AdminLayout pageTitle="Reports">
      <div className="ap-header">
        <div>
          <h1>System Reports</h1>
          <p>Generate and view comprehensive reports</p>
          <span style={{ fontSize: 12, color: '#10b981', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }}/>
            Live • Auto-updating every 5 seconds
          </span>
        </div>
      </div>

      {/* Quiz Reports & User Reports */}
      <div className="rpt-types">
        {/* Quiz Reports */}
        <div className="rpt-type-card ap-card">
          <div className="rpt-type-title">Quiz Reports</div>
          <div className="rpt-type-sub">Performance Data</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ background: '#f9fafb', padding: 12, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Total Quizzes</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1e1b4b' }}>{getQuizMetrics().totalQuizzes}</div>
            </div>
            <div style={{ background: '#f9fafb', padding: 12, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Avg Score</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1e1b4b' }}>{getQuizMetrics().avgScore}%</div>
            </div>
            <div style={{ background: '#f9fafb', padding: 12, borderRadius: 8, textAlign: 'center', gridColumn: '1/-1' }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Completion Rate</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1e1b4b' }}>{getQuizMetrics().completionRate}%</div>
            </div>
          </div>
          <button className="rpt-gen-btn" onClick={() => setShowQuizModal(true)}>Generate Report</button>
        </div>

        {/* User Reports */}
        <div className="rpt-type-card ap-card">
          <div className="rpt-type-title">User Reports</div>
          <div className="rpt-type-sub">Activity Analysis</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ background: '#f9fafb', padding: 12, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Active Users</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1e1b4b' }}>{getUserMetrics().activeUsers}</div>
            </div>
            <div style={{ background: '#f9fafb', padding: 12, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Total Attempts</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1e1b4b' }}>{getUserMetrics().totalAttempts}</div>
            </div>
            <div style={{ background: '#f9fafb', padding: 12, borderRadius: 8, textAlign: 'center', gridColumn: '1/-1' }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Engagement Rate</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1e1b4b' }}>{getUserMetrics().engagementRate}%</div>
            </div>
          </div>
          <button className="rpt-gen-btn" onClick={() => setShowUserModal(true)}>Generate Report</button>
        </div>
      </div>

      {/* Charts row */}
      <div className="rpt-charts">
        <div className="ap-card">
          <div className="rpt-chart-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Monthly Trends
          </div>
          <LineChart data1={monthlyAttempts} data2={monthlyCreated} labels={months} />
          <div className="rpt-legend">
            <span><span className="rpt-dot" style={{ background: '#7c3aed' }}/>Total Attempts</span>
            <span><span className="rpt-dot" style={{ background: '#a78bfa' }}/>Quiz Created</span>
          </div>
        </div>

        <div className="ap-card">
          <div className="rpt-chart-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
            </svg>
            Quiz Performance
          </div>
          <BarChart data={perfData} />
        </div>
      </div>

      {/* Quick Summary */}
      <div className="ap-card rpt-summary">
        <h3>Quick Summary</h3>
        <div className="rpt-summary-grid">
          <div>
            <div className="rpt-summary-title">Quiz Statistics</div>
            <table className="rpt-sum-table">
              <tbody>
                <tr><td>Total Quizzes</td><td><strong>{stats?.totalQuizzes ?? '—'}</strong></td></tr>
                <tr><td>Published Quizzes</td><td><strong>{stats?.totalQuizzes ?? '—'}</strong></td></tr>
                <tr><td>Total Attempts</td><td><strong>{stats?.totalResults ?? '—'}</strong></td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <div className="rpt-summary-title">Performance Metrics</div>
            <table className="rpt-sum-table">
              <tbody>
                <tr><td>Avg Completion Rate</td><td><strong>{metrics.completionRate}%</strong></td></tr>
                <tr><td>Avg Score</td><td><strong>{metrics.avgScore}%</strong></td></tr>
                <tr><td>Pass Rate</td><td><strong>{metrics.passRate}%</strong></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quiz Reports Modal */}
      {showQuizModal && (
        <div className="inv-overlay" onClick={() => setShowQuizModal(false)}>
          <div className="inv-modal" style={{ maxWidth: 800 }} onClick={e => e.stopPropagation()}>
            <div className="inv-modal-header" style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
              <div>
                <h2 className="inv-modal-title">Quiz Reports</h2>
                <p className="inv-modal-user" style={{ opacity: 0.85 }}>Detailed performance data for all quizzes</p>
              </div>
              <button className="inv-close" onClick={() => setShowQuizModal(false)}>✕</button>
            </div>

            <div className="inv-modal-body">
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1e1b4b' }}>All Quizzes</h3>
                  <button
                    onClick={() => exportToCSV(quizzes.map(q => ({
                      title: q.title,
                      subject: q.subject,
                      questions: q.questions?.length || 0,
                      attempts: results.filter(r => r.quiz?._id === q._id).length
                    })), 'quiz-reports')}
                    style={{ fontSize: 12, padding: '6px 12px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                  >
                    Export CSV
                  </button>
                </div>
                {quizzes && quizzes.length > 0 ? (
                  <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {quizzes.map((quiz, idx) => {
                      const quizAttempts = results.filter(r => r.quiz?._id === quiz._id);
                      const avgScore = quizAttempts.length > 0
                        ? Math.round(quizAttempts.reduce((sum, r) => sum + (r.score || 0), 0) / quizAttempts.length)
                        : 0;
                      return (
                        <div key={idx} style={{ background: '#f9fafb', padding: 12, borderRadius: 8, marginBottom: 8, border: '1px solid #e5e7eb' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 500, color: '#1f2937', marginBottom: 4 }}>{quiz.title}</div>
                              <div style={{ fontSize: 12, color: '#6b7280' }}>Subject: {quiz.subject || 'N/A'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Avg Score: <strong>{avgScore}%</strong></div>
                              <div style={{ fontSize: 12, color: '#6b7280' }}>Attempts: <strong>{quizAttempts.length}</strong></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>No quizzes found</div>
                )}
              </div>
              <button onClick={() => setShowQuizModal(false)} style={{ width: '100%', padding: 10, background: '#f3f4f6', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* User Reports Modal */}
      {showUserModal && (
        <div className="inv-overlay" onClick={() => setShowUserModal(false)}>
          <div className="inv-modal" style={{ maxWidth: 800 }} onClick={e => e.stopPropagation()}>
            <div className="inv-modal-header" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
              <div>
                <h2 className="inv-modal-title">User Reports</h2>
                <p className="inv-modal-user" style={{ opacity: 0.85 }}>Activity summary and engagement metrics</p>
              </div>
              <button className="inv-close" onClick={() => setShowUserModal(false)}>✕</button>
            </div>

            <div className="inv-modal-body">
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1e1b4b' }}>Active Users</h3>
                  <button
                    onClick={() => exportToCSV(users.filter(u => u.role === 'student').map(u => ({
                      name: u.name,
                      email: u.email,
                      department: u.department,
                      attempts: results.filter(r => r.student?._id === u._id).length
                    })), 'user-reports')}
                    style={{ fontSize: 12, padding: '6px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                  >
                    Export CSV
                  </button>
                </div>
                {users && users.length > 0 ? (
                  <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {users.filter(u => u.role === 'student').map((user, idx) => {
                      const userAttempts = results.filter(r => r.student?._id === user._id);
                      return (
                        <div key={idx} style={{ background: '#f9fafb', padding: 12, borderRadius: 8, marginBottom: 8, border: '1px solid #e5e7eb' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 500, color: '#1f2937', marginBottom: 4 }}>{user.name}</div>
                              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>{user.email}</div>
                              <div style={{ fontSize: 12, color: '#6b7280' }}>Department: {user.department || 'N/A'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 12, color: '#6b7280' }}>Quiz Attempts: <strong>{userAttempts.length}</strong></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>No students found</div>
                )}
              </div>
              <button onClick={() => setShowUserModal(false)} style={{ width: '100%', padding: 10, background: '#f3f4f6', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
