import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getQuizzes, getMyResults } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StudentLayout from '../../components/StudentLayout';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import dashboardImg from '../../assets/st_dashboard_img.jpg';
import './Student.css';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getQuizzes(), getMyResults()])
      .then(([qRes, rRes]) => {
        setQuizzes(qRes.data);
        setResults(rRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const attemptedIds = new Set(results.map(r => r.quiz?._id));

  // Build monthly performance data from results
  const buildChartData = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const map = {};
    results.forEach(r => {
      const d = new Date(r.submittedAt || r.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map[key]) map[key] = { month: monthNames[d.getMonth()], total: 0, count: 0, year: d.getFullYear(), monthIdx: d.getMonth() };
      map[key].total += r.percentage;
      map[key].count += 1;
    });
    return Object.values(map)
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.monthIdx - b.monthIdx)
      .slice(-7)
      .map(m => ({ month: m.month, score: Math.round(m.total / m.count) }));
  };

  const chartData = buildChartData();

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <StudentLayout pageTitle="Dashboard">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ marginTop: 0, marginBottom: 4, fontSize: 28, fontWeight: 600 }}>Welcome Back, {user?.name}!</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Here are your available quizzes</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { value: quizzes.length, label: 'Available Quizzes' },
            { value: results.length, label: 'Quizzes Taken' },
            { value: (results.length > 0 ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0) + '%', label: 'Average Score' },
            { value: results.filter(r => r.passed).length, label: 'Passed' },
          ].map(({ value, label }) => (
            <div key={label} style={{
              background: 'white', border: '1px solid #e5e7eb',
              borderRadius: '12px', padding: '24px 20px',
              textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#7c3aed', marginBottom: 6, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 13.5, color: '#6b7280', fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Quizzes Section */}
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#1f2937' }}>Available Quizzes</h2>
        {quizzes.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
            No quizzes available right now. Check back later!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {quizzes.map(quiz => {
              const attempted = attemptedIds.has(quiz._id);
              return (
                <div key={quiz._id} style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'box-shadow 0.2s',
                }}>
                  {/* Content */}
                  <div style={{ padding: '20px 20px 16px', flex: 1 }}>
                    {/* Pills row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span style={{
                        background: '#ede9fe', color: '#6d28d9',
                        padding: '4px 12px', borderRadius: '20px',
                        fontSize: 12, fontWeight: 600
                      }}>
                        {quiz.subject}
                      </span>
                      {attempted && (
                        <span style={{
                          background: '#d1fae5', color: '#059669',
                          padding: '4px 12px', borderRadius: '20px',
                          fontSize: 12, fontWeight: 600
                        }}>
                          ✓ Completed
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: '#111827' }}>
                      {quiz.title}
                    </h3>

                    {/* Description */}
                    <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 12px', lineHeight: 1.55,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {quiz.description || 'No description provided'}
                    </p>

                    {/* Lecturer & Course */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                      {quiz.createdBy?.name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#4b5563' }}>
                          <span style={{ fontSize: 13 }}>👤</span>
                          <span><strong>Lecturer:</strong> {quiz.createdBy.name}</span>
                        </div>
                      )}
                      {quiz.assignedCourses?.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#4b5563' }}>
                          <span style={{ fontSize: 13 }}>📚</span>
                          <span><strong>Course:</strong> {quiz.assignedCourses.map(c => c.name || c.code).join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Meta row */}
                    <div style={{ display: 'flex', gap: 14, fontSize: 12.5, color: '#6b7280', flexWrap: 'wrap' }}>
                      <span>⏱ {quiz.timeLimit} min</span>
                      <span>❓ {quiz.questions?.length} Q</span>
                      <span>🎯 {quiz.totalMarks} marks</span>
                      {quiz.endDate && (
                        <span>📅 Due {new Date(quiz.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      )}
                    </div>
                  </div>

                  {/* Action button */}
                  <div style={{ padding: '0 20px 20px' }}>
                    <div style={{ borderTop: '1px solid #f3f4f6', marginBottom: 14 }} />
                    {attempted ? (
                      <Link to={`/leaderboard/${quiz._id}`} style={{
                        display: 'block', textAlign: 'center',
                        padding: '10px', borderRadius: '8px',
                        background: '#f3f4f6', color: '#374151',
                        textDecoration: 'none', fontWeight: 600, fontSize: 14,
                        border: '1px solid #e5e7eb'
                      }}>
                        View Leaderboard
                      </Link>
                    ) : (
                      <Link to={`/quiz/${quiz._id}/take`} style={{
                        display: 'block', textAlign: 'center',
                        padding: '10px', borderRadius: '8px',
                        background: '#7c3aed', color: 'white',
                        textDecoration: 'none', fontWeight: 600, fontSize: 14,
                        boxShadow: '0 2px 8px rgba(124,58,237,0.25)'
                      }}>
                        Start Quiz
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent Quizzes */}
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Recent Quizzes</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {quizzes.slice(0, 5).map(quiz => {
              const attempted = attemptedIds.has(quiz._id);
              const result = results.find(r => r.quiz?._id === quiz._id);
              return (
                <div key={quiz._id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'white', border: '1.5px solid #ede9fe', borderRadius: '10px',
                  padding: '14px 20px', gap: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                    {/* Styled icon box */}
                    <div style={{
                      width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                      background: attempted ? '#d1fae5' : '#ede9fe',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18
                    }}>
                      {attempted ? '📊' : '📋'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {quiz.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                        {quiz.subject} · ⏱ {quiz.timeLimit} min · ❓ {quiz.questions?.length} Q
                      </div>
                      {quiz.createdBy?.name && (
                        <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>
                          👤 {quiz.createdBy.name}
                        </div>
                      )}
                    </div>
                  </div>
                  {attempted ? (
                    <Link to={result ? `/result/${result._id}` : `/leaderboard/${quiz._id}`} style={{
                      background: '#1e1b4b', color: 'white', padding: '8px 20px',
                      borderRadius: '8px', textDecoration: 'none', fontSize: 13,
                      fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0
                    }}>View</Link>
                  ) : (
                    <Link to={`/quiz/${quiz._id}/take`} style={{
                      background: '#7c3aed', color: 'white', padding: '8px 20px',
                      borderRadius: '8px', textDecoration: 'none', fontSize: 13,
                      fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0
                    }}>Start</Link>
                  )}
                </div>
              );
            })}
            {quizzes.length === 0 && (
              <div style={{ color: '#9ca3af', fontSize: 14, padding: '20px 0' }}>No recent quizzes available.</div>
            )}
          </div>
        </div>

        {/* Overview Performance Chart */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginTop: 32, display: 'flex', alignItems: 'center', gap: 24 }}>

          {/* Illustration */}
          <div style={{ flexShrink: 0 }}>
            <img
              src={dashboardImg}
              alt="Performance"
              style={{ width: 160, height: 130, objectFit: 'contain', display: 'block' }}
            />
          </div>

          {/* Chart */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1f2937' }}>Overview Performance</h2>
              <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', marginTop: 2 }}>Your average score per month</p>
            </div>
            {chartData.length === 0 ? (
              <div style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
                No results yet — take a quiz to see your performance chart!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={chartData} margin={{ top: 5, right: 16, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    formatter={v => [`${v}%`, 'Avg Score']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                    cursor={{ stroke: '#7c3aed', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#7c3aed"
                    strokeWidth={2.5}
                    strokeDasharray="5 3"
                    fill="url(#scoreGrad)"
                    dot={{ r: 3, fill: '#7c3aed', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#7c3aed' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

        </div>

      </div>
    </StudentLayout>
  );
}
