import React, { useEffect, useState } from 'react';
import { getQuizzes, getQuizResults } from '../../services/api';
import LecturerLayout from '../../components/LecturerLayout';
import './Lecturer.css';

export default function LecturerStudents() {
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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

  // Filter results for lecturer's quizzes
  useEffect(() => {
    const lecturerResults = results;

    // Group by student and calculate stats
    const studentMap = {};
    lecturerResults.forEach(result => {
      const studentId = result.student?._id;
      if (!studentId) return;

      if (!studentMap[studentId]) {
        studentMap[studentId] = {
          id: studentId,
          name: result.student?.name || 'Unknown',
          studentId: result.student?.studentId || 'N/A',
          attempts: 0,
          totalScore: 0,
          averageScore: 0,
          passed: 0,
          failed: 0,
          lastAttempt: result.submittedAt
        };
      }

      studentMap[studentId].attempts++;
      studentMap[studentId].totalScore += result.percentage || 0;
      studentMap[studentId].averageScore = Math.round(studentMap[studentId].totalScore / studentMap[studentId].attempts);
      if (result.passed) {
        studentMap[studentId].passed++;
      } else {
        studentMap[studentId].failed++;
      }
      studentMap[studentId].lastAttempt = new Date(result.submittedAt) > new Date(studentMap[studentId].lastAttempt)
        ? result.submittedAt
        : studentMap[studentId].lastAttempt;
    });

    let students = Object.values(studentMap);

    // Apply search filter
    if (search) {
      students = students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.studentId.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredStudents(students.sort((a, b) => new Date(b.lastAttempt) - new Date(a.lastAttempt)));
  }, [results, quizzes, search]);

  return (
    <LecturerLayout pageTitle="Students">
      <div className="ls-header">
        <div>
          <h1>Students</h1>
          <p>View student performance and quiz attempts</p>
          <span style={{ fontSize: 12, color: '#10b981', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }}/>
            Live • Auto-updating every 5 seconds
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="ls-stats">
        <div className="ls-stat">
          <div className="ls-stat-num">{filteredStudents.length}</div>
          <div className="ls-stat-label">Total Students</div>
        </div>
        <div className="ls-stat">
          <div className="ls-stat-num">
            {filteredStudents.reduce((sum, s) => sum + s.attempts, 0)}
          </div>
          <div className="ls-stat-label">Total Attempts</div>
        </div>
        <div className="ls-stat">
          <div className="ls-stat-num">
            {filteredStudents.length > 0
              ? Math.round(filteredStudents.reduce((sum, s) => sum + s.averageScore, 0) / filteredStudents.length)
              : 0}%
          </div>
          <div className="ls-stat-label">Class Average</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="ls-search-container">
        <div className="ls-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            placeholder="Search by name or student ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="ls-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Loading...</div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
            <p>No students found</p>
          </div>
        ) : (
          <table className="ls-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Student ID</th>
                <th>Attempts</th>
                <th>Avg Score</th>
                <th>Passed</th>
                <th>Failed</th>
                <th>Last Attempt</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, i) => (
                <tr key={i}>
                  <td>
                    <div className="ls-student-cell">
                      <div className="ls-avatar">{student.name?.charAt(0).toUpperCase()}</div>
                      <span>{student.name}</span>
                    </div>
                  </td>
                  <td className="ls-student-id">{student.studentId}</td>
                  <td className="ls-center">{student.attempts}</td>
                  <td className="ls-center">
                    <span className="ls-score">{student.averageScore}%</span>
                  </td>
                  <td className="ls-center">
                    <span className="ls-badge-success">{student.passed}</span>
                  </td>
                  <td className="ls-center">
                    <span className="ls-badge-danger">{student.failed}</span>
                  </td>
                  <td className="ls-date">
                    {new Date(student.lastAttempt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </LecturerLayout>
  );
}
