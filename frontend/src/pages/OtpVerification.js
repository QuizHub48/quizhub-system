import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { verifyOtp, forgotPassword } from '../services/api';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo_trans_tight.png';
import otpImg from '../assets/forgot_pp_img01.jpg';
import './ForgotPassword.css';

export default function OtpVerification() {
  const [otp, setOtp]             = useState(['', '', '', '']);
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const inputs    = useRef([]);
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();

  const email  = new URLSearchParams(location.search).get('email') || '';
  const devOtp = location.state?.devOtp || null;

  // Auto-fill OTP boxes when devOtp is available (dev/internal mode)
  useEffect(() => {
    if (devOtp && devOtp.length === 4) {
      setOtp(devOtp.split(''));
    }
  }, [devOtp]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < 3) inputs.current[index + 1].focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 4) { toast.warning('Enter the 4-digit OTP'); return; }
    setLoading(true);
    try {
      const { data } = await verifyOtp(email, code);
      login(data);
      toast.success(`Welcome back, ${data.name}!`);
      // Redirect to profile with reset flag so they can set a new password
      if (data.role === 'admin') navigate('/admin');
      else if (data.role === 'lecturer') navigate('/lecturer/profile?reset=true');
      else navigate('/student/profile?reset=true');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const { data } = await forgotPassword(email);
      if (data.devOtp) setOtp(data.devOtp.split(''));
      toast.success('OTP resent!');
      if (!data.devOtp) {
        setOtp(['', '', '', '']);
        inputs.current[0].focus();
      }
    } catch (err) {
      toast.error('Failed to resend OTP');
    } finally {
      setResending(false);
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

        {/* Left: image panel — matches forgot password style */}
        <div className="fp-left fp-left-bg" style={{ backgroundImage: `url(${otpImg})` }} />

        {/* Right: OTP form */}
        <div className="fp-right">
          <div className="fp-card">
            <img src={logo} alt="Quiz Hub" className="fp-card-logo" />
            <div className="fp-icon">🔐</div>
            <h2 className="fp-title">OTP Verification</h2>
            <p className="fp-desc">
              Enter the OTP sent to<br />
              <strong style={{ color: '#2d2b6b' }}>{email}</strong>
            </p>
            <form onSubmit={handleSubmit} className="fp-form">
              <div className="otp-boxes">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => inputs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="otp-box"
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                  />
                ))}
              </div>
              <p className="otp-resend-text">
                Don't receive code?{' '}
                <span
                  className="otp-resend-link"
                  onClick={!resending ? handleResend : undefined}
                >
                  {resending ? 'Sending...' : 'Re-send'}
                </span>
              </p>
              <button type="submit" className="fp-btn" disabled={loading}>
                {loading ? 'Verifying…' : 'Verify OTP'}
              </button>
            </form>
            <p className="fp-back">
              Wrong email? <Link to="/forgot-password">Go back</Link>
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
