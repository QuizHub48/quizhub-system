import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getQuizAnalytics, getQuizResults } from '../../services/api';
import './Lecturer.css';

export default function QuizAnalytics() {
  const { id } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getQuizAnalytics(id), getQuizResults(id)])
      .then(([aRes, rRes]) => { setAnalytics(aRes.data); setResults(rRes.data); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading">Loading analytics...</div>;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header"><h1>Quiz Analytics</h1></div>

        {analytics?.message ? (
          <div className="card empty-state"><p>{analytics.message}</p></div>
        ) : (
          <>
            <div className="stats-row" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
              {[
                { label: 'Total Attempts', val: analytics?.totalAttempts },
                { label: 'Average Score', val: `${analytics?.averageScore}%` },
                { label: 'Pass Rate', val: `${analytics?.passRate}%` },
                { label: 'Highest Score', val: `${analytics?.highestScore}%` },
                { label: 'Lowest Score', val: `${analytics?.lowestScore}%` },
              ].map((s, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-num">{s.val}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <h2 style={{ marginBottom: 16 }}>Student Results</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Student', 'Student ID', 'Score', '%', 'Status', 'Time', 'Date'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 13, color: 'var(--gray)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r._id}>
                      <td style={{ padding: '12px 14px' }}>{r.student?.name}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--gray)', fontSize: 13 }}>{r.student?.studentId || '-'}</td>
                      <td style={{ padding: '12px 14px' }}>{r.score}/{r.totalMarks}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.percentage}%</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className={`badge ${r.passed ? 'badge-success' : 'badge-danger'}`}>{r.passed ? 'Pass' : 'Fail'}</span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--gray)' }}>{Math.floor(r.timeTaken / 60)}m {r.timeTaken % 60}s</td>
                      <td style={{ padding: '12px 14px', color: 'var(--gray)' }}>{new Date(r.submittedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
