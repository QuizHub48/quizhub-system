import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getQuizById, updateQuiz, enableQuizReattempt } from '../../services/api';
import './Lecturer.css';

export default function ManageQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reattemptSettings, setReattemptSettings] = useState({ allowReattempt: false, reattemptCount: 1, urgent: false });
  const [updatingReattempt, setUpdatingReattempt] = useState(false);

  useEffect(() => {
    getQuizById(id).then(({ data }) => {
      setQuiz(data);
      setReattemptSettings({
        allowReattempt: data.allowReattempt || false,
        reattemptCount: data.reattemptCount || 1,
        urgent: data.urgent || false
      });
    });
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateQuiz(id, quiz);
      toast.success('Quiz updated!');
      navigate('/lecturer');
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const handleReattemptUpdate = async () => {
    setUpdatingReattempt(true);
    try {
      await enableQuizReattempt(id, reattemptSettings);
      toast.success('Reattempt settings updated!');
    } catch (err) {
      toast.error('Failed to update reattempt settings');
    } finally {
      setUpdatingReattempt(false);
    }
  };

  const updateQ = (qi, field, val) => {
    const qs = [...quiz.questions];
    qs[qi] = { ...qs[qi], [field]: val };
    setQuiz({ ...quiz, questions: qs });
  };

  if (!quiz) return <div className="loading">Loading quiz...</div>;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 800 }}>
        <div className="page-header">
          <h1>Edit Quiz</h1>
          <p>Update quiz details and questions</p>
        </div>
        <form onSubmit={handleSave}>
          <div className="card" style={{ marginBottom: 24 }}>
            <h2 style={{ marginBottom: 20 }}>Quiz Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Title</label>
                <input value={quiz.title} onChange={e => setQuiz({ ...quiz, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input value={quiz.subject} onChange={e => setQuiz({ ...quiz, subject: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Time Limit (min)</label>
                <input type="number" value={quiz.timeLimit} onChange={e => setQuiz({ ...quiz, timeLimit: +e.target.value })} />
              </div>
              <div className="form-group">
                <label>Deadline</label>
                <input
                  type="datetime-local"
                  value={quiz.endDate ? new Date(quiz.endDate).toISOString().slice(0, 16) : ''}
                  onChange={e => setQuiz({ ...quiz, endDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea rows={2} value={quiz.description || ''} onChange={e => setQuiz({ ...quiz, description: e.target.value })} />
            </div>
          </div>

          {/* Reattempt Settings */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h2 style={{ marginBottom: 20 }}>Reattempt Settings</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'center' }}>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={reattemptSettings.allowReattempt}
                    onChange={e => setReattemptSettings({ ...reattemptSettings, allowReattempt: e.target.checked })}
                  />
                  Allow Reattempts
                </label>
              </div>
              <div className="form-group">
                <label>Max Attempts</label>
                <input
                  type="number"
                  min="1"
                  value={reattemptSettings.reattemptCount}
                  onChange={e => setReattemptSettings({ ...reattemptSettings, reattemptCount: +e.target.value })}
                  disabled={!reattemptSettings.allowReattempt}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={reattemptSettings.urgent}
                    onChange={e => setReattemptSettings({ ...reattemptSettings, urgent: e.target.checked })}
                  />
                  Mark as Urgent
                </label>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleReattemptUpdate}
                disabled={updatingReattempt}
                style={{ height: 40 }}
              >
                {updatingReattempt ? 'Updating…' : 'Update Settings'}
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 12 }}>
              Enable reattempts to allow failed students to retake this quiz. Urgent quizzes notify students immediately.
            </p>
          </div>

          {quiz.questions.map((q, qi) => (
            <div key={qi} className="card question-builder">
              <h3 style={{ marginBottom: 16 }}>Question {qi + 1} <span className="badge badge-primary">{q.type}</span></h3>
              <div className="form-group">
                <label>Question Text</label>
                <textarea rows={2} value={q.questionText} onChange={e => updateQ(qi, 'questionText', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Correct Answer</label>
                <input value={q.correctAnswer} onChange={e => updateQ(qi, 'correctAnswer', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Marks</label>
                <input type="number" value={q.marks} onChange={e => updateQ(qi, 'marks', +e.target.value)} style={{ width: 80 }} />
              </div>
            </div>
          ))}

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center', padding: 14 }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
