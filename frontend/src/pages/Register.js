import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { registerUser, getFaculties } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { isValidEmail, emailError } from '../utils/validate';
import logo from '../assets/logo.png';
import './Auth.css';


const ProtectedRegisterPage = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="auth-page"><div className="auth-card"><p>Loading...</p></div></div>;

  const canRegister = user?.role === 'admin' || !user;
  if (!canRegister) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ maxWidth: 480 }}>
          <div className="auth-header">
            <img src={logo} alt="QuizHub Logo" className="auth-logo-img" />
            <h1>Access Denied</h1>
            <p>Only admins can create new user accounts</p>
          </div>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', marginBottom: 16 }}>
              If you need an account, please contact your administrator.
            </p>
            <Link to="/login" className="btn btn-primary auth-btn" style={{ display: 'inline-flex', marginBottom: 12 }}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return children;
};

const roles = [
  { value: 'student',  icon: '🎓', title: 'Student',  desc: 'Take quizzes and view results' },
  { value: 'lecturer', icon: '👨‍🏫', title: 'Lecturer', desc: 'Create and manage quizzes' },
  { value: 'admin',    icon: '👑', title: 'Admin',    desc: 'Manage users and system' },
];

function RegisterForm() {
  const [form, setForm]         = useState({ name: '', email: '', password: '', role: 'student', studentId: '', department: '' });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [facultyDepts, setFacultyDepts] = useState([]); // [{ faculty, depts:[{name,prefix}] }]
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Load faculties + departments dynamically
  useEffect(() => {
    getFaculties()
      .then(res => setFacultyDepts(
        res.data.map(f => ({
          faculty: f.name,
          depts: f.departments.map(d => ({ name: d.name, prefix: d.prefix })),
        }))
      ))
      .catch(() => {});
  }, []);

  const getPrefix = (dept) =>
    facultyDepts.flatMap(f => f.depts).find(d => d.name === dept)?.prefix || null;

  const validate = () => {
    const errs = {};
    if (!isValidEmail(form.email)) errs.email = emailError;
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if ((form.role === 'student' || form.role === 'lecturer') && !form.department) {
      errs.department = 'Department is required';
    }
    if (form.role === 'student' && form.studentId && form.department) {
      const prefix = getPrefix(form.department);
      if (prefix && !form.studentId.toUpperCase().startsWith(prefix)) {
        errs.studentId = `Student ID must start with "${prefix}" for ${form.department}`;
      }
    }
    return errs;
  };

  const handleBlurEmail = () => {
    if (form.email && !isValidEmail(form.email)) {
      setErrors(e => ({ ...e, email: emailError }));
    } else {
      setErrors(e => ({ ...e, email: '' }));
    }
  };

  // When student ID changes, auto-detect department from prefix
  const handleStudentIdChange = (val) => {
    const upper = val.toUpperCase();
    setForm(f => {
      let dept = f.department;
      if (!dept) {
        // Try to infer department from ID prefix
        const allDepts = facultyDepts.flatMap(fd => fd.depts);
        const match = allDepts.find(d => upper.startsWith(d.prefix));
        if (match) dept = match.name;
      }
      return { ...f, studentId: val, department: dept };
    });
    setErrors(e => ({ ...e, studentId: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.values(errs).some(Boolean)) { setErrors(errs); return; }

    setLoading(true);
    try {
      const { data } = await registerUser(form);
      login(data);
      toast.success(`Welcome, ${data.name}! Account created.`);
      if (data.role === 'admin') navigate('/admin');
      else if (data.role === 'lecturer') navigate('/lecturer');
      else navigate('/student');
    } catch (err) {
      if (!err.response) {
        toast.error('Cannot connect to server. Is the backend running on port 5000?');
      } else {
        toast.error(err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const prefix = form.role === 'student' && form.department ? getPrefix(form.department) : null;

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-header">
          <img src={logo} alt="QuizHub Logo" className="auth-logo-img" />
          <h1>{user ? 'Create User Account' : 'Admin Setup'}</h1>
          <p>{user ? 'Add a new user to the system' : 'Create your admin account'}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Role Selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 10, fontSize: 14, fontWeight: 500, color: 'var(--dark)' }}>
              Select Role
            </label>
            <div className="role-selector">
              {roles.map(r => (
                <button
                  type="button"
                  key={r.value}
                  className={`role-option ${form.role === r.value ? 'role-active' : ''}`}
                  onClick={() => setForm({ ...form, role: r.value, studentId: '', department: '' })}
                >
                  <span className="role-icon">{r.icon}</span>
                  <span className="role-title">{r.title}</span>
                  <span className="role-desc">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Your full name"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              required
              className={errors.email ? 'input-error' : ''}
              value={form.email}
              onChange={e => { setForm({ ...form, email: e.target.value }); setErrors(er => ({ ...er, email: '' })); }}
              onBlur={handleBlurEmail}
            />
            {errors.email && <span className="field-error-msg">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Min 6 characters"
              required
              className={errors.password ? 'input-error' : ''}
              value={form.password}
              onChange={e => { setForm({ ...form, password: e.target.value }); setErrors(er => ({ ...er, password: '' })); }}
            />
            {errors.password && <span className="field-error-msg">{errors.password}</span>}
          </div>

          {/* Student ID — shown first so prefix can auto-detect department */}
          {form.role === 'student' && (
            <div className="form-group">
              <label>
                Student ID
                {prefix && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>
                    (must start with <strong>{prefix}</strong>)
                  </span>
                )}
              </label>
              <input
                type="text"
                placeholder={prefix ? `e.g. ${prefix}24001` : 'e.g. IT24001'}
                className={errors.studentId ? 'input-error' : ''}
                value={form.studentId}
                onChange={e => handleStudentIdChange(e.target.value)}
              />
              {errors.studentId && <span className="field-error-msg">{errors.studentId}</span>}
            </div>
          )}

          {/* Department — faculty-grouped dropdown */}
          {(form.role === 'student' || form.role === 'lecturer') && (
            <div className="form-group">
              <label>
                Faculty &amp; Department <span style={{ color: '#ef4444', fontSize: 11 }}>*</span>
              </label>
              <select
                style={{
                  width: '100%',
                  borderRadius: 8,
                  border: errors.department ? '1.5px solid #ef4444' : '1.5px solid #e5e7eb',
                  padding: '8px 10px',
                  fontSize: 14,
                  color: form.department ? '#374151' : '#9ca3af',
                  background: 'white',
                  cursor: 'pointer',
                  outline: 'none',
                }}
                className={errors.department ? 'input-error' : ''}
                value={form.department}
                onChange={e => {
                  setForm(f => ({ ...f, department: e.target.value }));
                  setErrors(er => ({ ...er, department: '', studentId: '' }));
                }}
              >
                <option value="">— Select faculty / department —</option>
                {facultyDepts.map(({ faculty, depts }) => (
                  <optgroup key={faculty} label={faculty}>
                    {depts.map(d => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {form.department && (
                <span style={{ fontSize: 11.5, color: '#7c3aed', fontWeight: 600, marginTop: 4, display: 'block' }}>
                  🏛️ {facultyDepts.find(f => f.depts.some(d => d.name === form.department))?.faculty}
                </span>
              )}
              {errors.department && <span className="field-error-msg">{errors.department}</span>}
              {form.role === 'student' && form.department && prefix && (
                <span style={{ fontSize: 11, color: '#6b7280', marginTop: 4, display: 'block' }}>
                  Students in this department must have IDs starting with <strong>{prefix}</strong>
                </span>
              )}
            </div>
          )}

          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? 'Creating account...' : `Register as ${roles.find(r => r.value === form.role)?.title}`}
          </button>
        </form>

        {!user && (
          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <ProtectedRegisterPage>
      <RegisterForm />
    </ProtectedRegisterPage>
  );
}
