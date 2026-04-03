import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getQuizzes, deleteQuiz, publishQuiz } from '../../services/api';
import LecturerLayout from '../../components/LecturerLayout';
import QRCodeModal from '../../components/QRCodeModal';
import './Lecturer.css';

export default function ManageQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [publishedQuiz, setPublishedQuiz] = useState(null);

  // Fetch data with real-time polling
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getQuizzes();
        setQuizzes(res.data);
      } catch (err) {
        console.error('Error fetching quizzes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up polling to refresh every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = quizzes;

    // Filter by status
    if (filter === 'Published') {
      filtered = filtered.filter(q => q.isPublished);
    } else if (filter === 'Draft') {
      filtered = filtered.filter(q => !q.isPublished);
    }

    // Search
    if (search) {
      filtered = filtered.filter(q =>
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.subject.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredQuizzes(filtered);
  }, [quizzes, filter, search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this quiz?')) return;
    try {
      await deleteQuiz(id);
      setQuizzes(quizzes.filter(q => q._id !== id));
      toast.success('Quiz deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handlePublish = async (id) => {
    try {
      await publishQuiz(id);
      const publishedQuizData = quizzes.find(q => q._id === id);
      setQuizzes(quizzes.map(q => q._id === id ? { ...q, isPublished: true } : q));
      setPublishedQuiz({ id, title: publishedQuizData.title });
      setShowQRModal(true);
      toast.success('Quiz published! Students can now take it.');
    } catch { toast.error('Failed to publish'); }
  };

  return (
    <LecturerLayout pageTitle="Manage Quizzes">
      <div className="lmq-header">
        <div>
          <h1>My Quizzes</h1>
          <p>Create, edit, and manage your quizzes</p>
          <span style={{ fontSize: 12, color: '#10b981', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }}/>
            Live • Auto-updating every 5 seconds
          </span>
        </div>
        <Link to="/lecturer/create-quiz" className="lmq-btn lmq-btn-primary">+ Create Quiz</Link>
      </div>

      {/* Stats Summary */}
      <div className="lmq-stats">
        <div className="lmq-stat">
          <div className="lmq-stat-num">{quizzes.length}</div>
          <div className="lmq-stat-label">Total</div>
        </div>
        <div className="lmq-stat">
          <div className="lmq-stat-num">{quizzes.filter(q => q.isPublished).length}</div>
          <div className="lmq-stat-label">Published</div>
        </div>
        <div className="lmq-stat">
          <div className="lmq-stat-num">{quizzes.filter(q => !q.isPublished).length}</div>
          <div className="lmq-stat-label">Drafts</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="lmq-controls">
        <div className="lmq-filters">
          {['All', 'Published', 'Draft'].map(f => (
            <button
              key={f}
              className={`lmq-filter-btn ${filter === f ? 'lmq-filter-active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="lmq-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            placeholder="Search quizzes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Quizzes List */}
      <div className="lmq-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Loading...</div>
        ) : filteredQuizzes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
            <p>No quizzes found</p>
          </div>
        ) : (
          <div className="lmq-list">
            {filteredQuizzes.map(quiz => (
              <div key={quiz._id} className="lmq-item">
                <div className="lmq-item-info">
                  <div className="lmq-item-header">
                    <h3>{quiz.title}</h3>
                    <span className={`lmq-status ${quiz.isPublished ? 'lmq-published' : 'lmq-draft'}`}>
                      {quiz.isPublished ? '✓ Published' : '◯ Draft'}
                    </span>
                  </div>
                  <p className="lmq-subject">{quiz.subject}</p>
                  <div className="lmq-meta">
                    <span>⏱ {quiz.timeLimit} min</span>
                    <span>❓ {quiz.questions?.length || 0} Q</span>
                    <span>🎯 {quiz.totalMarks} marks</span>
                    <span>📅 {new Date(quiz.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="lmq-actions">
                  {!quiz.isPublished && (
                    <button className="lmq-btn lmq-btn-success" onClick={() => handlePublish(quiz._id)}>
                      Publish
                    </button>
                  )}
                  <Link to={`/lecturer/quiz/${quiz._id}/analytics`} className="lmq-btn lmq-btn-outline">
                    Analytics
                  </Link>
                  <Link to={`/lecturer/quiz/${quiz._id}/manage`} className="lmq-btn lmq-btn-outline">
                    Edit
                  </Link>
                  <button className="lmq-btn lmq-btn-danger" onClick={() => handleDelete(quiz._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && publishedQuiz && (
        <QRCodeModal
          quizId={publishedQuiz.id}
          quizTitle={publishedQuiz.title}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </LecturerLayout>
  );
}
