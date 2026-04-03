import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { isValidEmail, emailError } from '../utils/validate';
import logo from '../assets/logo_trans_tight.png';
import loginImg from '../assets/login_img.jpg';
import './Login.css';

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('reason') === 'session_expired') {
      toast.warning('Your session expired or your role changed. Please log in again.');
    }
  }, [location]);

  const validate = () => {
    const errs = {};
    if (!isValidEmail(form.email)) errs.email = emailError;
    return errs;
  };

  const handleBlurEmail = () => {
    if (form.email && !isValidEmail(form.email)) {
      setErrors(e => ({ ...e, email: emailError }));
    } else {
      setErrors(e => ({ ...e, email: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.values(errs).some(Boolean)) { setErrors(errs); return; }

    setLoading(true);
    try {
      const { data } = await loginUser(form);
      login(data);
      toast.success(`Welcome back, ${data.name}!`);
      if (data.role === 'admin') navigate('/admin');
      else if (data.role === 'lecturer') navigate('/lecturer');
      else navigate('/student');
    } catch (err) {
      if (!err.response) {
        toast.error('Cannot connect to server. Is the backend running on port 5000?');
      } else {
        toast.error(err.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">

      {/* Navbar */}
      <nav className="login-nav">
        <Link to="/"><img src={logo} alt="Quiz Hub" className="login-nav-logo" /></Link>
        <ul className="login-nav-links">
          <li><Link to="/">HOME</Link></li>
          <li><a href="#about">ABOUT</a></li>
        </ul>
      </nav>

      {/* Main — split layout */}
      <main className="login-main">

        {/* Left: clean image background */}
        <div className="login-left" style={{ backgroundImage: `url(${loginImg})` }} />

        {/* Right: white form panel */}
        <div className="login-right">
          <div className="login-card">
            <img src={logo} alt="Quiz Hub" className="login-card-logo" />
            <h2 className="login-title">Welcome Back</h2>
            <p className="login-desc">Sign in to your account to continue</p>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-field">
                <label className="login-label">Email Address</label>
                <input
                  type="text"
                  className={`login-input${errors.email ? ' login-input-error' : ''}`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => { setForm({ ...form, email: e.target.value }); setErrors(er => ({ ...er, email: '' })); }}
                  onBlur={handleBlurEmail}
                  autoComplete="email"
                />
                {errors.email && <span className="login-error-msg">{errors.email}</span>}
              </div>

              <div className="login-field">
                <div className="login-label-row">
                  <label className="login-label">Password</label>
                  <Link to="/forgot-password" className="login-forgot-link">Forgot Password?</Link>
                </div>
                <input
                  type="password"
                  className="login-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            {user?.role === 'admin' ? (
              <p className="login-note">Add new user? <Link to="/register">Create Account</Link></p>
            ) : (
              <p className="login-note">Don't have an account? <span className="login-note-accent">Contact your administrator.</span></p>
            )}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="login-footer">
        <span>Contact: quizhub@gmail.com</span>
        <span>© 2026 Quiz Hub. All rights reserved.</span>
      </footer>

    </div>
  );
}
