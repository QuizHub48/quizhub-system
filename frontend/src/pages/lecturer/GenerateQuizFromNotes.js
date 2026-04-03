import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { generateMCQsFromNotes, saveGeneratedQuiz } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LecturerLayout from '../../components/LecturerLayout';
import './Lecturer.css';

export default function GenerateQuizFromNotes() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Step 1: Upload & Generate
  const [file, setFile] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [numQuestions, setNumQuestions] = useState(10);

  // Step 2: Review & Edit
  const [step, setStep] = useState(1); // 1 = upload, 2 = review
  const [questions, setQuestions] = useState([]);
  const [extractedTextPreview, setExtractedTextPreview] = useState('');
  const [saving, setSaving] = useState(false);

  // Quiz metadata
  const [quizData, setQuizData] = useState({
    title: '',
    subject: '',
    description: '',
    timeLimit: 60,
    randomizeQuestions: true,
    endDate: '',
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    setGenerating(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('numQuestions', numQuestions);

      const response = await generateMCQsFromNotes(formData);
      setQuestions(response.data.questions || []);
      setExtractedTextPreview(response.data.extractedTextPreview);

      if (response.data.questions.length === 0) {
        toast.warn('No questions were generated. Try a different PDF.');
        return;
      }

      toast.success(`Generated ${response.data.questions.length} questions!`);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  const handleEditQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleDeleteQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleAddManualQuestion = () => {
    setQuestions([
      ...questions,
      {
        type: 'mcq',
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        marks: 1,
      },
    ]);
  };

  const handleSaveQuiz = async () => {
    if (!quizData.title || !quizData.subject) {
      toast.error('Please fill in title and subject');
      return;
    }

    if (questions.length === 0) {
      toast.error('Please select at least one question');
      return;
    }

    // Validate all questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || !q.correctAnswer || q.options.some(o => !o)) {
        toast.error(`Question ${i + 1} is incomplete`);
        return;
      }
    }

    setSaving(true);
    try {
      const response = await saveGeneratedQuiz({
        ...quizData,
        questions,
      });

      toast.success('Quiz saved successfully!');
      navigate('/lecturer/quizzes');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LecturerLayout pageTitle="Generate Quiz from Notes">
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        {step === 1 ? (
          // Step 1: Upload & Generate
          <div className="ld-card">
            <div className="ld-card-header">
              <h2>Upload Lecture Notes (PDF)</h2>
              <p style={{ marginTop: 4, color: '#6b7280', fontSize: 14 }}>
                Upload your lecture notes and we'll automatically generate MCQ questions using AI
              </p>
            </div>

            <div
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: '#f8fafc',
                marginBottom: 20,
              }}
              onClick={() => document.getElementById('file-input').click()}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: '#1e293b' }}>
                Click to upload PDF or drag and drop
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#64748b' }}>
                PDF files up to 50MB
              </p>
              {file && (
                <p style={{ marginTop: 12, color: '#10b981', fontWeight: 500 }}>
                  ✓ {file.name}
                </p>
              )}
              <input
                id="file-input"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Number of Questions: {numQuestions}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
              <p style={{ fontSize: 12, color: '#64748b', margin: '8px 0 0 0' }}>
                More questions = longer processing time
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleGenerate}
                disabled={!file || generating}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {generating ? 'Generating...' : `Generate ${numQuestions} MCQs`}
              </button>
              <button onClick={() => navigate('/lecturer')} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          // Step 2: Review & Edit
          <div>
            <div className="ld-card">
              <div className="ld-card-header">
                <h2>Quiz Details</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
                    Quiz Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Chapter 5 Quiz"
                    value={quizData.title}
                    onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Biology"
                    value={quizData.subject}
                    onChange={(e) => setQuizData({ ...quizData, subject: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: 14,
                    }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
                    Description
                  </label>
                  <textarea
                    placeholder="Optional description"
                    value={quizData.description}
                    onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: 14,
                      minHeight: '80px',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="240"
                    value={quizData.timeLimit}
                    onChange={(e) => setQuizData({ ...quizData, timeLimit: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
                    Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={quizData.endDate}
                    onChange={(e) => setQuizData({ ...quizData, endDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', marginTop: 30, gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={quizData.randomizeQuestions}
                      onChange={(e) => setQuizData({ ...quizData, randomizeQuestions: e.target.checked })}
                    />
                    <span style={{ fontWeight: 500 }}>Randomize Questions</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="ld-card">
              <div className="ld-card-header">
                <h2>Generated Questions ({questions.length})</h2>
                <button onClick={handleAddManualQuestion} className="btn btn-secondary" style={{ fontSize: 12 }}>
                  + Add Manual Question
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {questions.map((q, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 16,
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      backgroundColor: '#f8fafc',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                      <label style={{ fontWeight: 500, fontSize: 12, color: '#64748b' }}>
                        Question {idx + 1}
                      </label>
                      <button
                        onClick={() => handleDeleteQuestion(idx)}
                        style={{
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: 12,
                        }}
                      >
                        Delete
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Question text"
                      value={q.questionText}
                      onChange={(e) => handleEditQuestion(idx, 'questionText', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '4px',
                        marginBottom: 12,
                        fontSize: 14,
                      }}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                      {q.options.map((opt, optIdx) => (
                        <input
                          key={optIdx}
                          type="text"
                          placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...q.options];
                            newOpts[optIdx] = e.target.value;
                            handleEditQuestion(idx, 'options', newOpts);
                          }}
                          style={{
                            padding: '8px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            fontSize: 13,
                          }}
                        />
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <label style={{ fontSize: 13, fontWeight: 500, minWidth: 100 }}>
                        Correct Answer:
                      </label>
                      <select
                        value={q.correctAnswer}
                        onChange={(e) => handleEditQuestion(idx, 'correctAnswer', e.target.value)}
                        style={{
                          padding: '6px 8px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '4px',
                          fontSize: 13,
                          flex: 1,
                        }}
                      >
                        <option value="">Select correct answer</option>
                        {q.options.map((opt, optIdx) => (
                          <option key={optIdx} value={opt}>
                            {opt || `Option ${String.fromCharCode(65 + optIdx)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {questions.length === 0 && (
                <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>
                  No questions available. Add one manually or go back to generate from PDF.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button
                onClick={() => setStep(1)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                ← Back to Upload
              </button>
              <button
                onClick={handleSaveQuiz}
                disabled={saving || questions.length === 0}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {saving ? 'Saving...' : '💾 Save Quiz'}
              </button>
            </div>
          </div>
        )}
      </div>
    </LecturerLayout>
  );
}
