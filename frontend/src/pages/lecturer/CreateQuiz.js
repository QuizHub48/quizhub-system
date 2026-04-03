import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createQuiz } from '../../services/api';
import './Lecturer.css';

const blankQuestion = () => ({ type: 'mcq', questionText: '', options: ['', '', '', ''], correctAnswer: '', marks: 1 });

export default function CreateQuiz() {
  const navigate = useNavigate();
  const [info, setInfo] = useState({ title: '', subject: '', description: '', timeLimit: 10, randomizeQuestions: true, endDate: '' });
  const [questions, setQuestions] = useState([blankQuestion()]);
  const [saving, setSaving] = useState(false);

  const updateQuestion = (i, field, val) => {
    const qs = [...questions];
    qs[i] = { ...qs[i], [field]: val };
    if (field === 'type') {
      qs[i].options = val === 'true_false' ? ['True', 'False'] : val === 'fill_blank' ? [] : ['', '', '', ''];
      qs[i].correctAnswer = '';
    }
    setQuestions(qs);
  };

  const updateOption = (qi, oi, val) => {
    const qs = [...questions];
    qs[qi].options[oi] = val;
    setQuestions(qs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (const q of questions) {
      if (!q.questionText || !q.correctAnswer) {
        toast.error('Fill all question fields and correct answers');
        return;
      }
    }
    setSaving(true);
    try {
      await createQuiz({ ...info, questions });
      toast.success('Quiz created! You can publish it from the dashboard.');
      navigate('/lecturer');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create quiz');
    } finally { setSaving(false); }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 800 }}>
        <div className="page-header">
          <h1>Create New Quiz</h1>
          <p>Fill in quiz details and add questions</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Quiz Info */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h2 style={{ marginBottom: 20 }}>Quiz Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Quiz Title *</label>
                <input required value={info.title} onChange={e => setInfo({ ...info, title: e.target.value })} placeholder="e.g. Chapter 5 - Data Structures" />
              </div>
              <div className="form-group">
                <label>Subject *</label>
                <input required value={info.subject} onChange={e => setInfo({ ...info, subject: e.target.value })} placeholder="e.g. IT3052" />
              </div>
              <div className="form-group">
                <label>Time Limit (minutes) *</label>
                <input type="number" min={1} max={180} required value={info.timeLimit} onChange={e => setInfo({ ...info, timeLimit: +e.target.value })} />
              </div>
              <div className="form-group">
                <label>Randomize Questions</label>
                <select value={info.randomizeQuestions} onChange={e => setInfo({ ...info, randomizeQuestions: e.target.value === 'true' })}>
                  <option value="true">Yes (recommended)</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Deadline</label>
              <input type="datetime-local" value={info.endDate} onChange={e => setInfo({ ...info, endDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea rows={3} value={info.description} onChange={e => setInfo({ ...info, description: e.target.value })} placeholder="Optional description for students" />
            </div>
          </div>

          {/* Questions */}
          {questions.map((q, qi) => (
            <div key={qi} className="card question-builder">
              <div className="qb-header">
                <h3>Question {qi + 1}</h3>
                {questions.length > 1 && (
                  <button type="button" className="btn btn-danger" style={{ padding: '6px 12px' }}
                    onClick={() => setQuestions(questions.filter((_, i) => i !== qi))}>Remove</button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
                <div className="form-group">
                  <label>Question Type</label>
                  <select value={q.type} onChange={e => updateQuestion(qi, 'type', e.target.value)}>
                    <option value="mcq">Multiple Choice (MCQ)</option>
                    <option value="true_false">True / False</option>
                    <option value="fill_blank">Fill in the Blank</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Marks</label>
                  <input type="number" min={1} value={q.marks} onChange={e => updateQuestion(qi, 'marks', +e.target.value)} style={{ width: 80 }} />
                </div>
              </div>

              <div className="form-group">
                <label>Question Text *</label>
                <textarea rows={2} required value={q.questionText}
                  onChange={e => updateQuestion(qi, 'questionText', e.target.value)}
                  placeholder="Enter your question here..." />
              </div>

              {q.type === 'mcq' && (
                <div className="options-builder">
                  <label>Options *</label>
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="option-row">
                      <span className="option-letter">{String.fromCharCode(65 + oi)}</span>
                      <input value={opt} onChange={e => updateOption(qi, oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oi)}`} />
                    </div>
                  ))}
                </div>
              )}

              {q.type === 'true_false' && (
                <div className="form-group">
                  <label>Correct Answer *</label>
                  <select value={q.correctAnswer} onChange={e => updateQuestion(qi, 'correctAnswer', e.target.value)}>
                    <option value="">Select correct answer</option>
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </select>
                </div>
              )}

              {q.type === 'mcq' && (
                <div className="form-group">
                  <label>Correct Answer *</label>
                  <select value={q.correctAnswer} onChange={e => updateQuestion(qi, 'correctAnswer', e.target.value)}>
                    <option value="">Select correct answer</option>
                    {q.options.filter(o => o).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                  </select>
                </div>
              )}

              {q.type === 'fill_blank' && (
                <div className="form-group">
                  <label>Correct Answer *</label>
                  <input value={q.correctAnswer} onChange={e => updateQuestion(qi, 'correctAnswer', e.target.value)} placeholder="The exact correct answer" />
                </div>
              )}
            </div>
          ))}

          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <button type="button" className="btn btn-outline" onClick={() => setQuestions([...questions, blankQuestion()])}>
              + Add Question
            </button>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center', padding: 14 }}>
            {saving ? 'Creating Quiz...' : 'Create Quiz'}
          </button>
        </form>
      </div>
    </div>
  );
}
