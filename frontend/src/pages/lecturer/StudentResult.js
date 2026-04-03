import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResultById } from '../../services/api';
import LecturerLayout from '../../components/LecturerLayout';
import '../student/Student.css';

export default function StudentResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getResultById(id)
      .then(({ data }) => setResult(data))
      .catch(err => {
        console.error('Error fetching result:', err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading">Loading student result...</div>;
  if (!result) return <div className="loading">Result not found</div>;

  return (
    <LecturerLayout pageTitle="Student Result">
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Result Header */}
        <div className={`result-hero card ${result.passed ? 'result-pass' : 'result-fail'}`}>
          <div className="result-icon">{result.passed ? '✅' : '❌'}</div>
          <h1>{result.student?.name || 'Student'}</h1>
          <p className="quiz-title-result">{result.quiz?.title}</p>
          <div className="score-circle">
            <span className="score-num">{result.percentage}%</span>
            <span className="score-sub">{result.score}/{result.totalMarks}</span>
          </div>
          <div className="result-stats">
            <span>{result.passed ? '✅ Passed' : '❌ Failed'}</span>
            <span>⏱ {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</span>
            <span>📅 {new Date(result.submittedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Answer Review */}
        <div className="card" style={{ marginTop: 20 }}>
          <h2 style={{ marginBottom: 16 }}>Answer Review</h2>
          {result.answers && result.answers.length > 0 ? (
            result.answers.map((ans, i) => (
              <div key={i} className={`answer-item ${ans.isCorrect ? 'correct' : 'wrong'}`}>
                <div className="answer-q">
                  <span className="answer-num">Q{i + 1}</span>
                  <span>{ans.questionText}</span>
                </div>
                <div className="answer-detail">
                  <span>Student's answer: <strong>{ans.selectedAnswer || '(not answered)'}</strong></span>
                  {!ans.isCorrect && (
                    <span>Correct: <strong className="correct-ans">{ans.correctAnswer}</strong></span>
                  )}
                  <span className={ans.isCorrect ? 'marks-earned' : 'marks-zero'}>
                    {ans.marks}/{ans.isCorrect ? ans.marks : '1'} mark
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
              No answers found
            </div>
          )}
        </div>

        {/* Back Button */}
        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
        </div>
      </div>
    </LecturerLayout>
  );
}
