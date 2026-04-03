import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyResults } from '../../services/api';
import StudentLayout from '../../components/StudentLayout';
import './Student.css';

const PAGE_SIZE = 5;

export default function ResultHistory() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getMyResults().then(({ data }) => setResults(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading results...</div>;

  // Overall performance stats
  const totalAttempts = results.length;
  const avgScore = totalAttempts > 0
    ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / totalAttempts)
    : 0;
  const highestScore = totalAttempts > 0 ? Math.max(...results.map(r => r.percentage)) : 0;
  const lowestScore = totalAttempts > 0 ? Math.min(...results.map(r => r.percentage)) : 0;
  const passRate = totalAttempts > 0
    ? Math.round((results.filter(r => r.passed).length / totalAttempts) * 100)
    : 0;

  // Pagination
  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const paginated = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Donut chart via SVG
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (avgScore / 100) * circumference;
  const donutColor = avgScore >= 70 ? '#f59e0b' : avgScore >= 50 ? '#7c3aed' : '#ef4444';

  return (
    <StudentLayout pageTitle="Results">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Overall Performance Card */}
        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px 28px',
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          flexWrap: 'wrap'
        }}>
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#1f2937' }}>Overall Performance</h2>
            <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
              Total Attempts: <strong style={{ color: '#1f2937' }}>{totalAttempts}</strong>
              &nbsp;&nbsp;|&nbsp;&nbsp;
              Average Score: <strong style={{ color: '#1f2937' }}>{avgScore}%</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 2 }}>
              <div>Highest Score: <strong style={{ color: '#1f2937' }}>{highestScore}</strong></div>
              <div>Lowest Score: <strong style={{ color: '#1f2937' }}>{lowestScore}</strong></div>
              <div>Pass Rate: <strong style={{ color: '#1f2937' }}>{passRate}</strong></div>
            </div>

            {/* SVG Donut */}
            <div style={{ position: 'relative', width: 80, height: 80 }}>
              <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="40" cy="40" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="40" cy="40" r={radius}
                  fill="none"
                  stroke={donutColor}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 700, color: '#1f2937'
              }}>
                {avgScore}%
              </div>
            </div>
          </div>
        </div>

        {/* Result History */}
        <div style={{ marginBottom: 8 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#1f2937' }}>Result History</h2>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#9ca3af' }}>Review Your Previous Attempts</p>
        </div>

        {results.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
            <p>You haven't taken any quizzes yet.</p>
            <Link to="/student" className="btn btn-primary" style={{ marginTop: 12 }}>Browse Quizzes</Link>
          </div>
        ) : (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#4c1d95' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', color: 'white', fontWeight: 600, fontSize: 13 }}>Quiz Name</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', color: 'white', fontWeight: 600, fontSize: 13 }}>Attempt Date</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', color: 'white', fontWeight: 600, fontSize: 13 }}>Score</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', color: 'white', fontWeight: 600, fontSize: 13 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r, i) => (
                  <tr key={r._id} style={{ background: i % 2 === 0 ? '#f5f3ff' : 'white', borderBottom: '1px solid #ede9fe' }}>
                    <td style={{ padding: '14px 20px', fontSize: 14, color: '#1f2937', fontWeight: 500 }}>
                      <Link to={`/result/${r._id}`} style={{ color: '#1f2937', textDecoration: 'none' }}>
                        {r.quiz?.title}
                      </Link>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
                      {new Date(r.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                      {r.percentage}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: r.passed ? '#059669' : '#ef4444'
                      }}>
                        {r.passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: '14px 20px', textAlign: 'center', borderTop: '1px solid #ede9fe', fontSize: 13, color: '#6b7280' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ background: 'none', border: 'none', cursor: page === 1 ? 'default' : 'pointer', color: page === 1 ? '#d1d5db' : '#7c3aed', fontWeight: 600, fontSize: 13 }}
                >
                  &lt;
                </button>
                &nbsp; Page {page} of {totalPages} &nbsp;
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ background: 'none', border: 'none', cursor: page === totalPages ? 'default' : 'pointer', color: page === totalPages ? '#d1d5db' : '#7c3aed', fontWeight: 600, fontSize: 13 }}
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
