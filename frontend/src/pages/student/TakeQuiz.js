import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getQuizById, submitQuiz, getMyResults } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StudentLayout from '../../components/StudentLayout';
import './Student.css';

export default function TakeQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [current, setCurrent] = useState(0);
  const [myResults, setMyResults] = useState([]);

  const handleSubmit = useCallback(async (auto = false) => {
    if (submitting) return;

    // Verify user is still authenticated before submitting
    const storedUser = localStorage.getItem('quizhub_user');
    const hasValidToken = storedUser && JSON.parse(storedUser).token;

    if (!user || !hasValidToken) {
      toast.error('Session expired. Please log in again.');
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const { data } = await submitQuiz(id, { answers, timeTaken });
      if (auto) toast.info('Time up! Quiz auto-submitted.');
      else toast.success('Quiz submitted!');
      navigate(`/result/${data._id}`);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Submission failed');
      }
      setSubmitting(false);
    }
  }, [answers, id, navigate, startTime, submitting, user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading) {
      // Check for valid token
      const storedUser = localStorage.getItem('quizhub_user');
      const hasValidToken = storedUser && JSON.parse(storedUser).token;

      if (!user || !hasValidToken) {
        console.log('No valid authentication found');
        toast.error('Please log in to take a quiz');
        localStorage.removeItem('quizhub_user');
        navigate('/login');
      }
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return; // Don't fetch quiz if user not logged in

    Promise.all([
      getQuizById(id),
      getMyResults()
    ]).then(([{ data: quizData }, { data: results }]) => {
      setQuiz(quizData);
      setMyResults(results);
      setTimeLeft(quizData.timeLimit * 60);
    }).catch((err) => {
      const errorMsg = err.response?.data?.message || 'Failed to load quiz';
      toast.error(errorMsg);
      if (err.response?.status === 403 || err.response?.status === 401) {
        setTimeout(() => navigate('/login'), 2000);
      }
    });
  }, [id, navigate, user]);

  useEffect(() => {
    if (!timeLeft) return;
    if (timeLeft <= 0) { handleSubmit(true); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, handleSubmit]);

  // Show loading while auth is being checked
  if (loading) return <div className="loading">Verifying login...</div>;

  // Redirect if not authenticated
  if (!user) return <div className="loading">Redirecting to login...</div>;

  // Show loading while quiz is being fetched
  if (!quiz) return <div className="loading">Loading quiz...</div>;

  // Check attempts
  const quizResults = myResults.filter(r => r.quiz === id);
  const lastResult = quizResults.sort((a, b) => b.attempt - a.attempt)[0];
  const attemptNumber = lastResult ? lastResult.attempt + 1 : 1;

  if (!quiz.allowReattempt && quizResults.length > 0) {
    return (
      <StudentLayout pageTitle="Quiz">
        <div className="ap-card" style={{ textAlign: 'center', padding: 48 }}>
          <h2>You have already taken this quiz</h2>
          <p>Reattempts are not allowed for this quiz.</p>
          <button className="ap-btn-purple" onClick={() => navigate('/student')}>
            Back to Dashboard
          </button>
        </div>
      </StudentLayout>
    );
  }

  if (quiz.allowReattempt && attemptNumber > quiz.reattemptCount) {
    return (
      <StudentLayout pageTitle="Quiz">
        <div className="ap-card" style={{ textAlign: 'center', padding: 48 }}>
          <h2>Maximum attempts reached</h2>
          <p>You have used all {quiz.reattemptCount} attempts for this quiz.</p>
          <button className="ap-btn-purple" onClick={() => navigate('/student')}>
            Back to Dashboard
          </button>
        </div>
      </StudentLayout>
    );
  }

  const q = quiz.questions[current];
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const isLowTime = timeLeft < 60;

  return (
    <StudentLayout pageTitle={quiz.title}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="quiz-take-header card">
          <div>
            <h2>{quiz.title}</h2>
            <span className="badge badge-primary">{quiz.subject}</span>
          </div>
          <div className={`timer ${isLowTime ? 'timer-low' : ''}`}>
            ⏱ {mins}:{secs}
          </div>
        </div>

        <div className="quiz-progress">
          {quiz.questions.map((_, i) => (
            <button
              key={i}
              className={`progress-dot ${i === current ? 'active' : ''} ${answers[quiz.questions[i]._id] ? 'answered' : ''}`}
              onClick={() => setCurrent(i)}
            >{i + 1}</button>
          ))}
        </div>

        <div className="question-card card">
          <div className="question-num">Question {current + 1} of {quiz.questions.length} • {q.marks} mark{q.marks > 1 ? 's' : ''}</div>
          <h3 className="question-text">{q.questionText}</h3>

          <div className="options-list">
            {q.type === 'fill_blank' ? (
              <input
                type="text"
                className="fill-blank-input"
                placeholder="Type your answer here..."
                value={answers[q._id] || ''}
                onChange={e => setAnswers({ ...answers, [q._id]: e.target.value })}
              />
            ) : (
              q.options.map((opt, i) => (
                <label key={i} className={`option-item ${answers[q._id] === opt ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={q._id}
                    value={opt}
                    checked={answers[q._id] === opt}
                    onChange={() => setAnswers({ ...answers, [q._id]: opt })}
                  />
                  <span className="option-label">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </label>
              ))
            )}
          </div>

          <div className="question-nav">
            <button className="btn btn-outline" onClick={() => setCurrent(p => p - 1)} disabled={current === 0}>
              Previous
            </button>
            {current < quiz.questions.length - 1 ? (
              <button className="btn btn-primary" onClick={() => setCurrent(p => p + 1)}>
                Next
              </button>
            ) : (
              <button className="btn btn-success" onClick={() => handleSubmit(false)} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
