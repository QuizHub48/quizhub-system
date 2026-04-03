import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getResultById } from '../../services/api';
import StudentLayout from '../../components/StudentLayout';
import './Student.css';

export default function QuizResult() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getResultById(id).then(({ data }) => setResult(data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading">Loading result...</div>;
  if (!result) return <div className="loading">Result not found</div>;

  return (
    <StudentLayout pageTitle="Quiz Result">
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className={`result-hero card ${result.passed ? 'result-pass' : 'result-fail'}`}>
          <div className="result-icon">{result.passed ? '🎉' : '😔'}</div>
          <h1>{result.passed ? 'Congratulations!' : 'Better luck next time!'}</h1>
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

        <div className="card" style={{ marginTop: 20 }}>
          <h2 style={{ marginBottom: 16 }}>Answer Review</h2>
          {result.answers.map((ans, i) => (
            <div key={i} className={`answer-item ${ans.isCorrect ? 'correct' : 'wrong'}`}>
              <div className="answer-q">
                <span className="answer-num">Q{i + 1}</span>
                <span>{ans.questionText}</span>
              </div>
              <div className="answer-detail">
                <span>Your answer: <strong>{ans.selectedAnswer || '(not answered)'}</strong></span>
                {!ans.isCorrect && (
                  <span>Correct: <strong className="correct-ans">{ans.correctAnswer}</strong></span>
                )}
                <span className={ans.isCorrect ? 'marks-earned' : 'marks-zero'}>
                  {ans.marks}/{ans.isCorrect ? ans.marks : '1'} mark
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <Link to="/student" className="btn btn-primary">Back to Dashboard</Link>
          <Link to={`/leaderboard/${result.quiz?._id}`} className="btn btn-outline">View Leaderboard</Link>
          <Link to="/results" className="btn btn-outline">My Results</Link>
        </div>
      </div>
    </StudentLayout>
  );
}
