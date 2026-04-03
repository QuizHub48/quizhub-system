import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import logo from '../assets/logo_trans_tight.png';
import forgotImg from '../assets/forgot_pp_img02.webp';
import './ForgotPassword.css';

export default function ForgotPassword() {
  const [email, setEmail]           = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading]       = useState(false);
  const navigate = useNavigate();

  const validateEmail = (val) => {
    if (!val.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address';
    return '';
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError(validateEmail(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }
    setLoading(true);
    try {
      const { data } = await forgotPassword(email);
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`, {
        state: { devOtp: data.devOtp || null }
      });
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to send OTP';
      if (error.response?.status === 404) {
        setEmailError('This email is not registered in the system');
      } else {
        setEmailError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fp-wrapper">

      {/* Navbar */}
      <nav className="fp-nav">
        <Link to="/"><img src={logo} alt="Quiz Hub" className="fp-nav-logo" /></Link>
        <ul className="fp-nav-links">
          <li><Link to="/">HOME</Link></li>
          <li><Link to="/login">LOGIN</Link></li>
        </ul>
      </nav>

      {/* Main — split layout */}
      <main className="fp-main">

        {/* Left: clean image background, no text */}
        <div className="fp-left fp-left-bg" style={{ backgroundImage: `url(${forgotImg})` }} />

        {/* Right: form */}
        <div className="fp-right">
          <div className="fp-card">
            <img src={logo} alt="Quiz Hub" className="fp-card-logo" />
            <div className="fp-icon">🔑</div>
            <h2 className="fp-title">Forgot Password?</h2>
            <p className="fp-desc">
              Enter your registered email and we will send an OTP to verify your identity.
            </p>
            <form onSubmit={handleSubmit} className="fp-form">
              <div className="fp-field">
                <label className="fp-label">Email Address</label>
                <input
                  type="text"
                  className={`fp-input${emailError ? ' fp-input-error' : ''}`}
                  placeholder="username@quizhub.com"
                  value={email}
                  onChange={handleChange}
                  onBlur={() => setEmailError(validateEmail(email))}
                  autoComplete="email"
                />
                {emailError && <span className="fp-error-msg">{emailError}</span>}
              </div>
              <button type="submit" className="fp-btn" disabled={loading}>
                {loading ? 'Sending…' : 'Send OTP'}
              </button>
            </form>
            <p className="fp-back">
              Remember it? <Link to="/login">Back to Login</Link>
            </p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="fp-footer">
        <span>Contact: quizhub@gmail.com</span>
        <span>© 2026 Quiz Hub. All rights reserved.</span>
      </footer>

    </div>
  );
}
