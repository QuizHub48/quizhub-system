import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo_trans_tight.png';
import heroImg from '../assets/homeimg.png';
import './Home.css';

export default function Home() {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div className="home-wrapper">

      {/* About Modal */}
      {showAbout && (
        <div className="home-modal-overlay" onClick={() => setShowAbout(false)}>
          <div className="home-modal" onClick={e => e.stopPropagation()}>
            <button className="home-modal-close" onClick={() => setShowAbout(false)}>✕</button>
            <div className="home-modal-logo">
              <img src={logo} alt="Quiz Hub" />
            </div>
            <h2 className="home-modal-title">About Quiz Hub</h2>
            <p className="home-modal-desc">
              Quiz Hub is an interactive online learning platform designed for
              universities and educational institutions. It enables lecturers to
              create and publish quizzes, while students can attempt them, view
              instant results, and track their performance over time.
            </p>
            <div className="home-modal-features">
              <div className="home-modal-feature">
                <span className="home-modal-feature-icon">📝</span>
                <div>
                  <strong>Smart Quizzes</strong>
                  <p>AI-powered quiz generation from lecture notes</p>
                </div>
              </div>
              <div className="home-modal-feature">
                <span className="home-modal-feature-icon">📊</span>
                <div>
                  <strong>Instant Analytics</strong>
                  <p>Real-time results and performance tracking</p>
                </div>
              </div>
              <div className="home-modal-feature">
                <span className="home-modal-feature-icon">🏆</span>
                <div>
                  <strong>Leaderboards</strong>
                  <p>Compete and see where you rank among peers</p>
                </div>
              </div>
              <div className="home-modal-feature">
                <span className="home-modal-feature-icon">📚</span>
                <div>
                  <strong>Course Management</strong>
                  <p>Organised by department, course and module</p>
                </div>
              </div>
            </div>
            <Link to="/login" className="home-hero-btn" style={{ alignSelf: 'center', marginTop: 8 }}
              onClick={() => setShowAbout(false)}>
              Get Started
            </Link>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="home-nav">
        <div className="home-nav-logo">
          <img src={logo} alt="Quiz Hub" />
        </div>
        <ul className="home-nav-links">
          <li><a href="#home">HOME</a></li>
          <li>
            <button className="home-nav-about-btn" onClick={() => setShowAbout(true)}>
              ABOUT
            </button>
          </li>
          <li><Link to="/login">LOGIN</Link></li>
        </ul>
      </nav>

      {/* Hero Section */}
      <section className="home-hero" id="home">
        <div className="home-hero-inner">

          {/* Left */}
          <div className="home-hero-left">
            <div className="home-hero-eyebrow">
              <span>✦</span> Online Learning Platform
            </div>
            <h1 className="home-hero-title">TEST YOUR KNOWLEDGE,</h1>
            <h1 className="home-hero-highlight">ANYTIME, ANYWHERE</h1>
            <p className="home-hero-sub">
              Join QUIZ HUB and challenge yourself with interactive quizzes,
              instant results, and detailed performance analytics.
            </p>
            <div className="home-hero-btns">
              <Link to="/login" className="home-hero-btn">Get Started</Link>
            </div>
            {/* Inline stats */}
            <div className="home-hero-pills">
              <div className="home-hero-pill">
                <span className="home-hero-pill-num">1200+</span>
                <span className="home-hero-pill-label">Active Users</span>
              </div>
              <div className="home-hero-pill-divider" />
              <div className="home-hero-pill">
                <span className="home-hero-pill-num">500+</span>
                <span className="home-hero-pill-label">Quizzes Available</span>
              </div>
              <div className="home-hero-pill-divider" />
              <div className="home-hero-pill">
                <span className="home-hero-pill-num">98%</span>
                <span className="home-hero-pill-label">Satisfaction Rate</span>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="home-hero-right">
            <div className="home-hero-circle" />
            <img src={heroImg} alt="Student studying" className="home-hero-img" />
          </div>

        </div>
      </section>

      {/* Footer — fixed at bottom, matches admin/lecturer style */}
      <footer className="home-footer">
        <div className="home-footer-brand-row">
          <img src={logo} alt="Quiz Hub" className="home-footer-logo" />
        </div>
        <div className="home-footer-bar">
          <span>Contact: quizhub@gmail.com</span>
          <span>© 2026 Quiz Hub. All rights reserved.</span>
        </div>
      </footer>

    </div>
  );
}
