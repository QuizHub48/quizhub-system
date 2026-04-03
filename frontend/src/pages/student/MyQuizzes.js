import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getQuizzes, getMyResults } from '../../services/api';
import StudentLayout from '../../components/StudentLayout';
import './Student.css';

export default function StudentMyQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getQuizzes(), getMyResults()])
      .then(([qRes, rRes]) => {
        setQuizzes(qRes.data);
        setResults(rRes.data);
      })
      .catch(err => console.error('Error fetching quizzes:', err))
      .finally(() => setLoading(false));
  }, []);

  const resultMap = useMemo(() => {
    const map = {};
    results.forEach(r => {
      map[r.quiz?._id] = r;
    });
    return map;
  }, [results]);

  if (loading) return <div className="loading">Loading quizzes...</div>;

  return (
    <StudentLayout pageTitle="My Quizzes">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ marginTop: 0, marginBottom: 4, fontSize: 28, fontWeight: 600 }}>Available Quizzes</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Quizzes available for your department</p>
        </div>

        {quizzes.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
            <p>No quizzes available right now. Check back later!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {quizzes.map(quiz => {
              const result = resultMap[quiz._id];
              const isAttempted = !!result;
              const isPassed = result?.passed;

              return (
                <div
                  key={quiz._id}
                  style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '20px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Subject pill */}
                    <div style={{ marginBottom: 6 }}>
                      <span style={{
                        background: '#ede9fe', color: '#6d28d9',
                        padding: '3px 10px', borderRadius: '20px',
                        fontSize: 11, fontWeight: 600
                      }}>{quiz.subject}</span>
                      {isAttempted && (
                        <span style={{
                          background: isPassed ? '#d1fae5' : '#fee2e2',
                          color: isPassed ? '#059669' : '#dc2626',
                          padding: '3px 10px', borderRadius: '20px',
                          fontSize: 11, fontWeight: 600, marginLeft: 6
                        }}>{isPassed ? '✓ Passed' : '✗ Failed'}</span>
                      )}
                    </div>

                    <h3 style={{ marginTop: 0, marginBottom: 6, fontSize: 15, fontWeight: 700, color: '#111827' }}>
                      {quiz.title}
                    </h3>

                    {quiz.description && (
                      <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 6px', lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {quiz.description}
                      </p>
                    )}

                    {/* Lecturer & Course */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginBottom: 6 }}>
                      {quiz.createdBy?.name && (
                        <span style={{ fontSize: 12, color: '#4b5563' }}>
                          👤 <strong>{quiz.createdBy.name}</strong>
                        </span>
                      )}
                      {quiz.assignedCourses?.length > 0 && (
                        <span style={{ fontSize: 12, color: '#4b5563' }}>
                          📚 {quiz.assignedCourses.map(c => c.name || c.code).join(', ')}
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 14px', fontSize: 12, color: '#9ca3af' }}>
                      <span>⏱ {quiz.timeLimit} min</span>
                      <span>❓ {quiz.questions?.length} Q</span>
                      <span>🎯 {quiz.totalMarks} marks</span>
                      {quiz.endDate && (
                        <span>📅 Due {new Date(quiz.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      )}
                    </div>

                    {isAttempted && !isPassed && (
                      <p style={{ color: '#dc2626', fontSize: 12, margin: '6px 0 0' }}>
                        ⚠️ Score below passing mark. Consider re-attempting.
                      </p>
                    )}
                  </div>

                  <div>
                    {!isAttempted ? (
                      <Link
                        to={`/quiz/${quiz._id}/take`}
                        style={{
                          display: 'inline-block',
                          padding: '10px 24px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontWeight: 500,
                          fontSize: 14,
                          border: 'none',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Start Quiz
                      </Link>
                    ) : isPassed ? (
                      <Link
                        to={`/result/${result._id}`}
                        style={{
                          display: 'inline-block',
                          padding: '10px 24px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontWeight: 500,
                          fontSize: 14,
                          border: 'none',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Continue
                      </Link>
                    ) : (
                      <Link
                        to={`/quiz/${quiz._id}/take`}
                        style={{
                          display: 'inline-block',
                          padding: '10px 24px',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontWeight: 500,
                          fontSize: 14,
                          border: 'none',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Re-attempt
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
