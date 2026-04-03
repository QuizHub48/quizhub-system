import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getQuizzes, getQuizResults, getLecturerInfo, getFaculties } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LecturerLayout from '../../components/LecturerLayout';

export default function LecturerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes]         = useState([]);
  const [quizStats, setQuizStats]     = useState({}); // { quizId: { attempts, students } }
  const [loading, setLoading]         = useState(true);
  const [lecturerInfo, setLecturerInfo] = useState(null);
  const [modal, setModal] = useState(null); // 'modules' | 'students'
  const [facultyMap, setFacultyMap] = useState({}); // { deptName: facultyName }

  const fetchData = useCallback(async () => {
    try {
      const [{ data: qs }, infoRes, facultyRes] = await Promise.all([
        getQuizzes(),
        getLecturerInfo().catch(() => ({ data: null })),
        getFaculties().catch(() => ({ data: [] })),
      ]);
      // Build dept → faculty map
      const map = {};
      (facultyRes.data || []).forEach(f => {
        (f.departments || []).forEach(d => { map[d.name] = f.name; });
      });
      setFacultyMap(map);
      setQuizzes(qs);
      if (infoRes.data) setLecturerInfo(infoRes.data);

      // Fetch results for each quiz in parallel
      const resultsArr = await Promise.all(
        qs.map(q => getQuizResults(q._id).then(r => ({ id: q._id, results: r.data })).catch(() => ({ id: q._id, results: [] })))
      );
      const statsMap = {};
      resultsArr.forEach(({ id, results }) => {
        const uniqueStudents = new Set(results.map(r => r.student?._id || r.student)).size;
        const avgPct = results.length
          ? results.reduce((sum, r) => sum + (r.score / (r.totalMarks || 1)) * 100, 0) / results.length
          : 0;
        statsMap[id] = { attempts: results.length, students: uniqueStudents, avgPct };
      });
      setQuizStats(statsMap);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Aggregate stats
  const totalQuizzes    = quizzes.length;
  const totalAttempts   = Object.values(quizStats).reduce((s, v) => s + v.attempts, 0);
  const totalStudents   = Object.values(quizStats).reduce((s, v) => s + v.students, 0);
  const allAvgs         = Object.values(quizStats).filter(v => v.attempts > 0).map(v => v.avgPct);
  const avgMarks        = allAvgs.length ? Math.round(allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) : 0;

  const statCards = [
    { label: 'Total Quizzes',       value: String(totalQuizzes).padStart(2, '0'),   icon: BookIcon,    color: '#4f46e5' },
    { label: 'Total Attempts',      value: String(totalAttempts).padStart(2, '0'),  icon: CalIcon,     color: '#0891b2' },
    { label: 'Student Participation', value: String(totalStudents).padStart(2, '0'), icon: StudIcon,    color: '#059669' },
    { label: 'Average Marks',       value: avgMarks + '%',                          icon: ChartIcon,   color: '#d97706' },
  ];

  const firstName = user?.name?.split(' ')[0] || 'Lecturer';

  const dept = lecturerInfo?.department || user?.department || '';
  const faculty = facultyMap[dept] || '';

  return (
    <LecturerLayout pageTitle="Dashboard">

      {/* ── Modules Modal ── */}
      {modal === 'modules' && (
        <div onClick={() => setModal(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(17,7,40,0.55)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 600,
            boxShadow: '0 24px 60px rgba(124,58,237,0.22)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', maxHeight: '85vh'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #3b1d8a 0%, #6d28d9 60%, #7c3aed 100%)',
              padding: '22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📘</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#fff' }}>Assigned Modules</h2>
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                    {lecturerInfo?.modules?.length ?? 0} module{lecturerInfo?.modules?.length !== 1 ? 's' : ''} · {lecturerInfo?.department || user?.department}
                  </p>
                </div>
              </div>
              <button onClick={() => setModal(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {lecturerInfo?.modules?.length > 0 ? lecturerInfo.modules.map((m, i) => (
                <div key={m._id} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  background: 'linear-gradient(90deg, #f5f3ff, #faf9ff)',
                  border: '1.5px solid #ede9fe', borderRadius: 14, padding: '16px 20px'
                }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 12,
                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 12, fontWeight: 800, flexShrink: 0, textAlign: 'center', lineHeight: 1.2
                  }}>{String(i + 1).padStart(2, '0')}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1e1b4b' }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600, marginTop: 3 }}>
                      {m.courseName && <span>Course: <strong>{m.courseName}</strong>{m.courseCode && ` (${m.courseCode})`}</span>}
                      {m.courseName && <>&nbsp;·&nbsp;</>}
                      <span style={{ color: '#6b7280', fontWeight: 500 }}>{m.students?.length ?? 0} student{m.students?.length !== 1 ? 's' : ''} enrolled</span>
                    </div>
                  </div>
                  <span style={{
                    background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe',
                    padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, flexShrink: 0
                  }}>{m.courseCode || 'Module'}</span>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                  <div style={{ fontSize: 14 }}>No modules assigned yet</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Students Modal ── */}
      {modal === 'students' && (
        <div onClick={() => setModal(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(17,7,40,0.55)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 680,
            boxShadow: '0 24px 60px rgba(124,58,237,0.22)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', maxHeight: '85vh'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #3b1d8a 0%, #6d28d9 60%, #7c3aed 100%)',
              padding: '22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🧑‍🎓</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#fff' }}>Enrolled Students</h2>
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                    {lecturerInfo?.students?.length ?? 0} student{lecturerInfo?.students?.length !== 1 ? 's' : ''} across {lecturerInfo?.modules?.length ?? 0} module{lecturerInfo?.modules?.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button onClick={() => setModal(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* Per-module sections */}
            <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {lecturerInfo?.modules?.length > 0 ? lecturerInfo.modules.map((m, mi) => (
                <div key={m._id}>
                  {/* Module label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9,
                      background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 11, fontWeight: 800, flexShrink: 0
                    }}>{String(mi + 1).padStart(2, '0')}</div>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#1e1b4b' }}>{m.name}</span>
                      {m.courseName && <span style={{ fontSize: 12, color: '#7c3aed', marginLeft: 6, fontWeight: 600 }}>{m.courseName}</span>}
                      <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 6 }}>({m.students?.length ?? 0} students)</span>
                    </div>
                    <div style={{ flex: 1, height: 1, background: '#ede9fe', marginLeft: 4 }} />
                  </div>

                  {/* Students table */}
                  {m.students?.length > 0 ? (
                    <div style={{ border: '1px solid #ede9fe', borderRadius: 12, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                        <thead>
                          <tr style={{ background: '#f5f3ff' }}>
                            <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>#</th>
                            <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student</th>
                            <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student ID</th>
                            <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {m.students.map((s, si) => (
                            <tr key={s._id} style={{ borderTop: '1px solid #f3f0ff', background: si % 2 === 0 ? '#fff' : '#faf9ff' }}>
                              <td style={{ padding: '11px 14px', color: '#c4b5fd', fontSize: 12, fontWeight: 600 }}>{si + 1}</td>
                              <td style={{ padding: '11px 14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{
                                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                    background: `hsl(${((s.name?.charCodeAt(0) || 65) * 47 + si * 30) % 360}, 52%, 52%)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontSize: 12, fontWeight: 700
                                  }}>{s.name?.charAt(0)?.toUpperCase() || '?'}</div>
                                  <span style={{ fontWeight: 600, color: '#1e1b4b' }}>{s.name}</span>
                                </div>
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                <span style={{ background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                                  {s.studentId || '—'}
                                </span>
                              </td>
                              <td style={{ padding: '11px 14px', color: '#6b7280', fontSize: 12.5 }}>{s.email}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '14px 16px', background: '#faf9ff', border: '1px solid #ede9fe', borderRadius: 10, fontSize: 13, color: '#c4b5fd', fontStyle: 'italic' }}>
                      No students enrolled in this module yet
                    </div>
                  )}
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
                  <div style={{ fontSize: 14 }}>No students enrolled yet</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Welcome Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #3b1d8a 0%, #6d28d9 55%, #7c3aed 100%)',
        borderRadius: 20, padding: '32px 36px', marginBottom: 28,
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(109,40,217,0.30)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        {/* Background bubbles */}
        <div style={{ position: 'absolute', top: -30, right: 160, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: 40, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>
            Welcome back, {firstName}!
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.72)', fontWeight: 500 }}>
            Lecturer Dashboard
          </p>
        </div>
        {/* Cap illustration */}
        <div style={{ position: 'relative', zIndex: 1, fontSize: 72, lineHeight: 1, userSelect: 'none', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}>
          🎓
        </div>
      </div>

      {/* ── Lecturer Profile Info ── */}
      <div style={{
        background: '#fff', borderRadius: 20, border: '1px solid #e5e7eb',
        marginBottom: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        overflow: 'hidden'
      }}>
        {/* Info tiles row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '0' }}>

          {/* Department */}
          <div style={{
            padding: '22px 28px', borderRight: '1px solid #f3f4f6',
            display: 'flex', flexDirection: 'column', gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg, #7c3aed22, #a78bfa33)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
              }}>🏛️</div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Department & Faculty</span>
            </div>
            <div style={{ paddingLeft: 2 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#1e1b4b', marginBottom: 3 }}>
                {lecturerInfo?.department || user?.department || '—'}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 20, padding: '3px 10px' }}>
                <span style={{ fontSize: 11 }}>🎓</span>
                <span style={{ fontSize: 12, color: '#6d28d9', fontWeight: 600 }}>{faculty}</span>
              </div>
            </div>
          </div>

          {/* Assigned Modules — clickable */}
          <div
            onClick={() => setModal('modules')}
            style={{
              padding: '22px 28px', borderRight: '1px solid #f3f4f6',
              display: 'flex', flexDirection: 'column', gap: 10,
              cursor: 'pointer', transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8faff'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: 'linear-gradient(135deg, #3b82f622, #60a5fa33)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                }}>📘</div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Assigned Modules</span>
              </div>
              <span style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600 }}>View all →</span>
            </div>
            {lecturerInfo?.modules?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {lecturerInfo.modules.map(m => (
                  <span key={m._id} style={{
                    background: '#ede9fe', color: '#6d28d9',
                    border: '1px solid #ddd6fe',
                    padding: '5px 14px', borderRadius: 20,
                    fontSize: 12.5, fontWeight: 700
                  }}>{m.name}</span>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: 13, color: '#d1d5db', fontStyle: 'italic' }}>No modules assigned yet</span>
            )}
          </div>

          {/* Students — clickable */}
          <div
            onClick={() => setModal('students')}
            style={{
              padding: '22px 28px',
              display: 'flex', flexDirection: 'column', gap: 10,
              cursor: 'pointer', transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f5f3ff'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: 'linear-gradient(135deg, #7c3aed22, #a78bfa33)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                }}>🧑‍🎓</div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Students Enrolled</span>
              </div>
              <span style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>View all →</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: '#1e1b4b', lineHeight: 1 }}>
                {lecturerInfo?.students?.length ?? '—'}
              </span>
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>students</div>
                <div style={{ fontSize: 11.5, color: '#9ca3af' }}>
                  across {lecturerInfo?.modules?.length ?? 0} module{lecturerInfo?.modules?.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {statCards.map((s, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 16, padding: '20px 22px',
            border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#1e1b4b', lineHeight: 1 }}>{s.value}</div>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: s.color + '22',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <s.icon color={s.color} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Recent Quizzes ── */}
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e5e7eb', padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1e1b4b' }}>Recent Quizzes</h2>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: '#9ca3af' }}>Your recently created quizzes</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {quizzes.slice(0, 6).map(quiz => {
              const st       = quizStats[quiz._id] || { attempts: 0, students: 0 };
              const maxStudents = Math.max(st.students, 1);
              const completionPct = Math.min(100, Math.round((st.attempts / maxStudents) * 100));
              return (
                <div key={quiz._id}
                  onClick={() => navigate(`/lecturer/quiz/${quiz._id}/manage`)}
                  style={{
                    background: '#f9fafb', borderRadius: 14, padding: '16px 18px',
                    border: '1.5px solid #e5e7eb', cursor: 'pointer',
                    transition: 'box-shadow 0.15s, border-color 0.15s',
                    display: 'flex', flexDirection: 'column', gap: 10
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 18px rgba(124,58,237,0.13)'; e.currentTarget.style.borderColor = '#a78bfa'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1f2937', flex: 1, lineHeight: 1.4 }}>{quiz.title}</span>
                    <span style={{ fontSize: 16, color: '#9ca3af', marginLeft: 8, flexShrink: 0 }}>›</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#6b7280' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <QuizSmIcon /> {quiz.questions?.length || 0} questions
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <PeopleSmIcon /> {st.attempts} completions
                    </span>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginBottom: 4, fontWeight: 600 }}>
                      <span>Completion Rate</span>
                      <span>{completionPct}%</span>
                    </div>
                    <div style={{ height: 5, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99,
                        width: completionPct + '%',
                        background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Create New Quiz tile */}
            <Link to="/lecturer/create-quiz" style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#f9fafb', borderRadius: 14, padding: '16px 18px',
                border: '1.5px dashed #ddd6fe', cursor: 'pointer', height: '100%', minHeight: 120,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'border-color 0.15s, background 0.15s'
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ede9fe'; e.currentTarget.style.borderColor = '#7c3aed'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#ddd6fe'; }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: '#7c3aed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{ color: '#fff', fontSize: 22, lineHeight: 1, marginTop: -2 }}>+</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>Create New Quiz</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Add questions, set time limits and more</div>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </LecturerLayout>
  );
}

/* ── Inline SVG icons ── */
function BookIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
}
function CalIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function StudIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function ChartIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  );
}
function QuizSmIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
}
function PeopleSmIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
    </svg>
  );
}
