import React, { useRef, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { updateProfile, getSettings, updateSettings } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail, isValidPhone, emailError, phoneError } from '../../utils/validate';
import AdminLayout from '../../components/AdminLayout';
import './Admin.css';

const Toggle = ({ checked, onChange }) => (
  <label className="ap-toggle">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="ap-toggle-slider" />
  </label>
);

const TABS = [
  { id: 'profile',       label: 'Profile',       icon: '👤' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'general',       label: 'General',       icon: '⚙️' },
];

export default function AdminProfile() {
  const { user, login }       = useAuth();
  const [activeTab, setTab]   = useState('profile');
  const [saving, setSaving]   = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.profilePicture || '');
  const fileInputRef = useRef();

  /* ── Profile state ── */
  const [form, setForm] = useState({
    firstName:       user?.name?.split(' ')[0] || '',
    lastName:        user?.name?.split(' ').slice(1).join(' ') || '',
    email:           user?.email || '',
    phone:           '',
    password:        '',
    confirmPassword: '',
  });

  /* ── Notification state ── */
  const [notif, setNotif] = useState({
    appQuizComplete: true,   appEventReminders: true,  appNewStudents: true, appMarketing: false,
    frequency: 'immediately',
  });

  /* ── General state ── */
  const [siteName, setSiteName] = useState('Quiz Hub');
  const [timezone, setTimezone] = useState('Asia/Colombo');
  const [language, setLanguage] = useState('English');
  const [defaultTimeLimit, setDefaultTimeLimit] = useState(30);
  const [defaultPassingScore, setDefaultPassingScore] = useState(60);
  const [siteLogo, setSiteLogo] = useState(() => localStorage.getItem('siteLogo') || '');
  const [logoSaving, setLogoSaving] = useState(false);
  const logoInputRef = useRef();
  const [generalSaving, setGeneralSaving] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  /* Load settings on mount */
  useEffect(() => {
    getSettings()
      .then(({ data }) => {
        setSiteName(data.siteName || 'Quiz Hub');
        setTimezone(data.timezone || 'Asia/Colombo');
        setLanguage(data.language || 'English');
        setDefaultTimeLimit(data.defaultQuizTimeLimit || 30);
        setDefaultPassingScore(data.defaultPassingScore || 60);

        // Load notification preferences
        if (data.notifications) {
          setNotif(data.notifications);
        }
      })
      .catch(() => {}) // use defaults on error
      .finally(() => setSettingsLoading(false));
  }, []);

  /* Auto-save notification settings */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (settingsLoading) return;
      updateSettings({ notifications: notif }).catch(() => {});
    }, 1000); // Save 1 second after last change
    return () => clearTimeout(timer);
  }, [notif, settingsLoading]);

  /* Auto-save general settings */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (settingsLoading) return;
      updateSettings({
        siteName,
        timezone,
        language,
        defaultQuizTimeLimit: defaultTimeLimit,
        defaultPassingScore: defaultPassingScore,
      }).catch(() => {});
    }, 1000); // Save 1 second after last change
    return () => clearTimeout(timer);
  }, [siteName, timezone, language, defaultTimeLimit, defaultPassingScore, settingsLoading]);

  /* ── Handlers ── */
  const validateProfileFields = () => {
    const errs = {};
    if (!isValidEmail(form.email)) errs.email = emailError;
    if (!isValidPhone(form.phone)) errs.phone = phoneError;
    if (form.password && form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password && form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const errs = validateProfileFields();
    if (Object.values(errs).some(Boolean)) { setFieldErrors(errs); return; }

    setSaving(true);
    try {
      const payload = { name: `${form.firstName} ${form.lastName}`.trim(), email: form.email };
      if (form.password) payload.password = form.password;
      await updateProfile(payload);
      login({ ...user, name: payload.name, email: payload.email });
      toast.success('Profile updated!');
      setForm(f => ({ ...f, password: '', confirmPassword: '' }));
      setFieldErrors({});
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  /* ── Avatar upload ── */
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2 MB'); return; }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setAvatarPreview(base64);
      setAvatarSaving(true);
      try {
        await updateProfile({ profilePicture: base64 });
        login({ ...user, profilePicture: base64 });
        toast.success('Profile picture updated!');
      } catch { toast.error('Failed to upload photo'); setAvatarPreview(user?.profilePicture || ''); }
      finally { setAvatarSaving(false); }
    };
    reader.readAsDataURL(file);
  };

  /* ── General settings save ── */
  const handleSaveGeneral = async () => {
    setGeneralSaving(true);
    try {
      await updateSettings({
        siteName,
        timezone,
        language,
        defaultQuizTimeLimit: defaultTimeLimit,
        defaultPassingScore: defaultPassingScore,
      });
      toast.success('Settings saved!');
    } catch { toast.error('Failed to save settings'); }
    finally { setGeneralSaving(false); }
  };

  /* ── Logo handlers ── */
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 1 * 1024 * 1024) { toast.error('Logo must be under 1 MB'); return; }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setSiteLogo(base64);
      localStorage.setItem('siteLogo', base64);
      toast.success('Logo updated!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    if (!window.confirm('Remove the site logo?')) return;
    setSiteLogo('');
    localStorage.removeItem('siteLogo');
    toast.success('Logo removed');
  };

  /* ── Render helpers ── */
  const SectionHeader = ({ title, subtitle }) => (
    <div className="prof-sep-header">
      <h2 className="prof-sep-title">{title}</h2>
      {subtitle && <p className="prof-sep-sub">{subtitle}</p>}
    </div>
  );

  const ToggleRow = ({ label, desc, checked, onChange }) => (
    <div className="prof-toggle-row">
      <div>
        <div className="prof-toggle-label">{label}</div>
        {desc && <div className="prof-toggle-desc">{desc}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );

  /* ══════════════════════════════════════
     TAB: PROFILE
  ══════════════════════════════════════ */
  const renderProfile = () => (
    <div className="prof-sep-card ap-card">
      <SectionHeader
        title="Profile Information"
        subtitle="Update your personal details and public information"
      />

      <form onSubmit={handleSaveProfile} className="prof-sep-form">

        {/* Avatar */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
        />
        <div className="prof-sep-avatar-row">
          <div className="prof-avatar-wrap-new" onClick={() => fileInputRef.current.click()}>
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" className="prof-avatar-img" />
              : <div className="prof-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            }
            <div className="prof-avatar-overlay">
              {avatarSaving
                ? <span style={{ fontSize: 12, color: '#fff' }}>Saving…</span>
                : <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <span style={{ fontSize: 11, color: '#fff', marginTop: 2 }}>Change</span>
                  </>
              }
            </div>
          </div>
          <div>
            <div className="prof-toggle-label" style={{ marginBottom: 4 }}>{user?.name}</div>
            <div className="prof-toggle-desc">{user?.role && user.role.charAt(0).toUpperCase() + user.role.slice(1)}</div>
            <button type="button" className="prof-change-photo" style={{ marginTop: 8 }}
              onClick={() => fileInputRef.current.click()}>
              {avatarSaving ? 'Uploading…' : '📷 Change Photo'}
            </button>
          </div>
        </div>

        <div className="prof-sep-divider" />

        {/* Name row */}
        <div className="prof-sep-grid-2">
          <div className="form-group" style={{ margin: 0 }}>
            <label>First Name</label>
            <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="First name" />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Last Name</label>
            <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" />
          </div>
        </div>

        {/* Email + Phone */}
        <div className="prof-sep-grid-2">
          <div className="form-group" style={{ margin: 0 }}>
            <label>Email Address</label>
            <input
              type="email"
              className={fieldErrors.email ? 'input-error' : ''}
              value={form.email}
              onChange={e => { setForm({ ...form, email: e.target.value }); setFieldErrors(er => ({ ...er, email: '' })); }}
              onBlur={() => {
                if (form.email && !isValidEmail(form.email)) setFieldErrors(er => ({ ...er, email: emailError }));
                else setFieldErrors(er => ({ ...er, email: '' }));
              }}
            />
            {fieldErrors.email && <span className="field-error-msg">{fieldErrors.email}</span>}
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Phone Number <span className="prof-optional">(optional)</span></label>
            <input
              type="tel"
              className={fieldErrors.phone ? 'input-error' : ''}
              value={form.phone}
              onChange={e => { setForm({ ...form, phone: e.target.value }); setFieldErrors(er => ({ ...er, phone: '' })); }}
              onBlur={() => {
                if (!isValidPhone(form.phone)) setFieldErrors(er => ({ ...er, phone: phoneError }));
                else setFieldErrors(er => ({ ...er, phone: '' }));
              }}
              placeholder="+94 77 000 0000"
            />
            {fieldErrors.phone && <span className="field-error-msg">{fieldErrors.phone}</span>}
          </div>
        </div>

        {/* Status (read-only) */}
        <div className="form-group" style={{ margin: 0, maxWidth: 260 }}>
          <label>Account Status</label>
          <div className="prof-status-pill">
            <span className="prof-status-dot" />
            Active
          </div>
        </div>

        <div className="prof-sep-divider" />

        {/* Password */}
        <div className="prof-sep-section-label">Change Password</div>
        <div className="prof-sep-grid-2">
          <div className="form-group" style={{ margin: 0 }}>
            <label>New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className={fieldErrors.password ? 'input-error' : ''}
              value={form.password}
              onChange={e => { setForm({ ...form, password: e.target.value }); setFieldErrors(er => ({ ...er, password: '' })); }}
            />
            {fieldErrors.password && <span className="field-error-msg">{fieldErrors.password}</span>}
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className={fieldErrors.confirmPassword ? 'input-error' : ''}
              value={form.confirmPassword}
              onChange={e => { setForm({ ...form, confirmPassword: e.target.value }); setFieldErrors(er => ({ ...er, confirmPassword: '' })); }}
            />
            {fieldErrors.confirmPassword && <span className="field-error-msg">{fieldErrors.confirmPassword}</span>}
          </div>
        </div>

        <div className="prof-sep-actions">
          <button type="submit" className="ap-btn-purple" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );

  /* ══════════════════════════════════════
     TAB: NOTIFICATIONS
  ══════════════════════════════════════ */
  const renderNotifications = () => (
    <div className="prof-sep-card ap-card">
      <SectionHeader
        title="Notification Preferences"
        subtitle="Choose how and when you want to be notified"
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="prof-sep-section-label" style={{ margin: 0 }}>In-App Notifications</div>
        <button
          onClick={() => {
            const allEnabled = notif.appQuizComplete && notif.appEventReminders && notif.appNewStudents && notif.appMarketing;
            setNotif({
              ...notif,
              appQuizComplete: !allEnabled,
              appEventReminders: !allEnabled,
              appNewStudents: !allEnabled,
              appMarketing: !allEnabled,
            });
          }}
          style={{ fontSize: 12, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
        >
          {notif.appQuizComplete && notif.appEventReminders && notif.appNewStudents && notif.appMarketing ? 'Disable All' : 'Enable All'}
        </button>
      </div>
      {[
        { key: 'appQuizComplete',   label: 'Quiz Completions',   desc: 'Receive notifications when students complete your quizzes' },
        { key: 'appEventReminders', label: 'Event Reminders',    desc: 'Get reminders before your scheduled quiz events' },
        { key: 'appNewStudents',    label: 'New Student Joins',  desc: 'Be notified when new students join your classes' },
        { key: 'appMarketing',      label: 'Marketing & Updates',desc: 'Receive news, updates, and promotional notifications' },
      ].map(item => (
        <ToggleRow key={item.key} label={item.label} desc={item.desc}
          checked={notif[item.key]}
          onChange={() => setNotif({ ...notif, [item.key]: !notif[item.key] })} />
      ))}

      <div className="prof-sep-divider" />
      <div className="prof-sep-section-label">Notification Frequency</div>
      <div className="prof-radio-group">
        {[
          { val: 'immediately', label: 'Immediately',    desc: 'Get notified as soon as something happens' },
          { val: 'daily',       label: 'Daily Digest',   desc: 'One summary notification per day' },
          { val: 'weekly',      label: 'Weekly Digest',  desc: 'One summary notification per week' },
        ].map(opt => (
          <label key={opt.val} className={`prof-radio-card ${notif.frequency === opt.val ? 'prof-radio-card-active' : ''}`}>
            <input type="radio" name="freq" value={opt.val}
              checked={notif.frequency === opt.val}
              onChange={() => setNotif({ ...notif, frequency: opt.val })} />
            <div>
              <div className="prof-toggle-label">{opt.label}</div>
              <div className="prof-toggle-desc">{opt.desc}</div>
            </div>
          </label>
        ))}
      </div>

      <div className="prof-sep-actions">
        <div style={{ fontSize: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }}/>
          Auto-saving in real-time
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════
     TAB: GENERAL
  ══════════════════════════════════════ */
  const renderGeneral = () => (
    <div className="prof-sep-card ap-card">
      <SectionHeader
        title="General Settings"
        subtitle="Configure platform-wide defaults and appearance"
      />

      {settingsLoading ? (
        <div style={{ color: '#9ca3af', fontSize: 13 }}>Loading settings…</div>
      ) : (
        <>
          <div className="prof-sep-section-label">Platform</div>
          <div className="prof-sep-grid-2">
            <div className="form-group" style={{ margin: 0 }}>
              <label>Site Name</label>
              <input value={siteName} onChange={e => setSiteName(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Language</label>
              <select className="prof-select" value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="English">English</option>
                <option value="Sinhala">Sinhala</option>
                <option value="Tamil">Tamil</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Timezone</label>
            <select className="prof-select" value={timezone} onChange={e => setTimezone(e.target.value)}>
              <option value="Asia/Colombo">Asia/Colombo (GMT+5:30)</option>
              <option value="UTC">UTC (GMT+0)</option>
              <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
              <option value="Europe/London">Europe/London (GMT+0)</option>
            </select>
          </div>
        </>
      )}

      <div className="prof-sep-divider" />
      <div className="prof-sep-section-label">Site Logo</div>
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleLogoChange}
      />
      <div className="prof-logo-preview">
        {siteLogo ? (
          <img src={siteLogo} alt="Site Logo" style={{ height: 60, objectFit: 'contain' }} />
        ) : (
          <div className="prof-logo-box">
            <span style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>QUIZ</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>HUB</span>
          </div>
        )}
        <div className="prof-logo-actions">
          <button type="button" className="prof-outline-btn" onClick={() => logoInputRef.current.click()}>
            ✏️ Change Logo
          </button>
          {siteLogo && (
            <button type="button" className="prof-danger-btn" onClick={handleRemoveLogo}>
              🗑 Remove
            </button>
          )}
        </div>
      </div>

      <div className="prof-sep-divider" />
      <div className="prof-sep-section-label">Quiz Defaults</div>
      <div className="prof-sep-grid-2">
        <div className="form-group" style={{ margin: 0 }}>
          <label>Default Time Limit (minutes)</label>
          <input type="number" value={defaultTimeLimit} onChange={e => setDefaultTimeLimit(parseInt(e.target.value) || 30)} min={1} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Default Passing Score (%)</label>
          <input type="number" value={defaultPassingScore} onChange={e => setDefaultPassingScore(parseInt(e.target.value) || 60)} min={0} max={100} />
        </div>
      </div>

      <div className="prof-sep-actions">
        <div style={{ fontSize: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }}/>
          Auto-saving in real-time
        </div>
      </div>
    </div>
  );

  const panels = {
    profile:       renderProfile(),
    notifications: renderNotifications(),
    general:       renderGeneral(),
  };

  return (
    <AdminLayout pageTitle="Profile">
      <div className="ap-header">
        <div>
          <h1>Profile & Settings</h1>
          <p>Manage your account settings and preferences</p>
        </div>
      </div>

      {/* ── Sidebar tabs + content ── */}
      <div className="prof-sep-layout">

        {/* Left nav */}
        <div className="prof-sep-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`prof-sep-nav-btn ${activeTab === t.id ? 'prof-sep-nav-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="prof-sep-nav-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Right content */}
        <div className="prof-sep-content">
          {panels[activeTab]}
        </div>
      </div>
    </AdminLayout>
  );
}
