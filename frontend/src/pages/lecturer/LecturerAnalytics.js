import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuizzes, getQuizResults } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LecturerLayout from '../../components/LecturerLayout';
import './Lecturer.css';
import './LecturerAnalytics.css';

export default function LecturerAnalytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuiz, setExpandedQuiz] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const qRes = await getQuizzes();
        setQuizzes(qRes.data);

        // Fetch results for each quiz
        const allResults = [];
        for (const quiz of qRes.data) {
          try {
            const rRes = await getQuizResults(quiz._id);
            allResults.push(...rRes.data);
          } catch (err) {
            console.error(`Error fetching results for quiz ${quiz._id}:`, err);
          }
        }
        setResults(allResults);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Use results fetched for lecturer's quizzes
  const lecturerResults = results;

  // Calculate statistics
  const totalStudents = new Set(lecturerResults.map(r => r.student?._id)).size;
  const totalAttempts = lecturerResults.length;
  const avgScore = lecturerResults.length > 0
    ? Math.round(lecturerResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / lecturerResults.length)
    : 0;
  const completionRate = quizzes.length > 0 && totalAttempts > 0
    ? Math.round((totalAttempts / (quizzes.length * totalStudents)) * 100)
    : 0;

  // Group results by quiz for detailed view
  const resultsByQuiz = quizzes.map(quiz => {
    const quizResults = lecturerResults.filter(r => r.quiz?._id === quiz._id);
    return {
      quiz,
      results: quizResults,
      attempts: quizResults.length,
      avgScore: quizResults.length > 0
        ? Math.round(quizResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / quizResults.length)
        : 0,
      passRate: quizResults.length > 0
        ? Math.round((quizResults.filter(r => r.passed).length / quizResults.length) * 100)
        : 0
    };
  }).filter(q => q.attempts > 0);

  return (
    <LecturerLayout pageTitle="Analytics">
      <div className="la-header">
        <div>
          <h1>Analytics</h1>
          <p>View overall performance metrics across your quizzes</p>
          <span style={{ fontSize: 12, color: '#10b981', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }}/>
            Live • Auto-updating every 5 seconds
          </span>
        </div>
      </div>

      {/* Main Stats */}
      <div className="la-stats">
        <div className="la-stat-card">
          <div className="la-stat-label">Total Students</div>
          <div className="la-stat-num">{totalStudents}</div>
          <div className="la-stat-icon" style={{ background: '#312e81' }}>👥</div>
        </div>
        <div className="la-stat-card">
          <div className="la-stat-label">Total Attempts</div>
          <div className="la-stat-num">{totalAttempts}</div>
          <div className="la-stat-icon" style={{ background: '#065f46' }}>📝</div>
        </div>
        <div className="la-stat-card">
          <div className="la-stat-label">Average Score</div>
          <div className="la-stat-num">{avgScore}%</div>
          <div className="la-stat-icon" style={{ background: '#7c2d12' }}>🎯</div>
        </div>
        <div className="la-stat-card">
          <div className="la-stat-label">Completion Rate</div>
          <div className="la-stat-num">{completionRate}%</div>
          <div className="la-stat-icon" style={{ background: '#6b21a8' }}>✅</div>
        </div>
      </div>

      {/* Quiz Performance Table */}
      <div className="la-card">
        <div className="la-card-header">
          <h3>Quiz Performance</h3>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>Click a quiz row to see student results</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Loading...</div>
        ) : resultsByQuiz.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
            <p>No student attempts yet</p>
          </div>
        ) : (
          <div className="la-quiz-accordion">
            {resultsByQuiz.map((item, i) => {
              const isOpen = expandedQuiz === item.quiz._id;
              return (
                <div key={i} className="la-accordion-item">
                  {/* Quiz summary row */}
                  <div
                    className={`la-accordion-header${isOpen ? ' la-accordion-open' : ''}`}
                    onClick={() => setExpandedQuiz(isOpen ? null : item.quiz._id)}
                  >
                    <div className="la-quiz-name" style={{ flex: 2 }}>
                      <span className="la-badge">{item.quiz.subject}</span>
                      <span style={{ fontWeight: 600, color: '#111827' }}>{item.quiz.title}</span>
                    </div>
                    <div className="la-accordion-stats">
                      <div className="la-acc-stat">
                        <span className="la-acc-label">Attempts</span>
                        <span className="la-acc-value">{item.attempts}</span>
                      </div>
                      <div className="la-acc-stat">
                        <span className="la-acc-label">Avg Score</span>
                        <span className="la-acc-value la-score">{item.avgScore}%</span>
                      </div>
                      <div className="la-acc-stat">
                        <span className="la-acc-label">Pass Rate</span>
                        <span className={`la-acc-value la-pass-badge ${item.passRate >= 60 ? 'la-pass-high' : 'la-pass-low'}`}>
                          {item.passRate}%
                        </span>
                      </div>
                      <span className="la-chevron">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Expandable student results */}
                  {isOpen && (
                    <div className="la-accordion-body">
                      <table className="la-student-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Student</th>
                            <th>Student ID</th>
                            <th>Score</th>
                            <th>Percentage</th>
                            <th>Status</th>
                            <th>Submitted</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.results
                            .slice()
                            .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
                            .map((r, idx) => (
                            <tr
                              key={r._id}
                              className="la-student-row"
                              onClick={() => navigate(`/lecturer/student-result/${r._id}`)}
                            >
                              <td className="la-center" style={{ color: '#9ca3af', fontSize: 12 }}>{idx + 1}</td>
                              <td>
                                <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                                  {r.student?.name || 'Unknown'}
                                </div>
                              </td>
                              <td style={{ fontSize: 12.5, color: '#6b7280' }}>
                                {r.student?.studentId || r.student?.email || '—'}
                              </td>
                              <td className="la-center" style={{ fontWeight: 600, color: '#374151' }}>
                                {r.score}/{r.totalMarks}
                              </td>
                              <td className="la-center">
                                <div className="la-percent-bar-wrap">
                                  <div
                                    className="la-percent-bar"
                                    style={{ width: `${r.percentage || 0}%`, background: r.passed ? '#10b981' : '#ef4444' }}
                                  />
                                  <span className="la-percent-label">{r.percentage || 0}%</span>
                                </div>
                              </td>
                              <td className="la-center">
                                <span className={`la-status-pill ${r.passed ? 'la-pill-pass' : 'la-pill-fail'}`}>
                                  {r.passed ? '✓ Passed' : '✗ Failed'}
                                </span>
                              </td>
                              <td style={{ fontSize: 12, color: '#9ca3af' }}>
                                {new Date(r.submittedAt || r.createdAt).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric', year: 'numeric'
                                })}
                              </td>
                              <td>
                                <span className="la-view-link">View →</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Submissions */}
      <div className="la-card">
        <div className="la-card-header">
          <h3>Recent Submissions</h3>
        </div>

        {lecturerResults.slice(0, 10).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
            <p>No submissions yet</p>
          </div>
        ) : (
          <div className="la-submissions-list">
            {lecturerResults.slice(0, 10).map((result, i) => (
              <div
                key={i}
                className="la-submission-item"
                onClick={() => navigate(`/lecturer/student-result/${result._id}`)}
                style={{ cursor: 'pointer', transition: 'background 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                <div className="la-submission-info">
                  <div className="la-student-name">
                    {result.student?.name || 'Unknown Student'}
                  </div>
                  <div className="la-submission-meta">
                    <span>{result.quiz?.title}</span>
                    <span>•</span>
                    <span>{new Date(result.submittedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="la-submission-score">
                  <span className={`la-score-badge ${result.passed ? 'la-passed' : 'la-failed'}`}>
                    {result.score}/{result.totalMarks}
                  </span>
                  <span className="la-percentage">{result.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </LecturerLayout>
  );
}
