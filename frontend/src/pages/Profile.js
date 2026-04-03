import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { updateProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { isValidEmail, emailError } from '../utils/validate';

export default function Profile() {
  const { user, login } = useAuth();
  const [form, setForm]     = useState({ name: user.name, email: user.email, password: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleBlurEmail = () => {
    if (form.email && !isValidEmail(form.email)) {
      setErrors(e => ({ ...e, email: emailError }));
    } else {
      setErrors(e => ({ ...e, email: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!isValidEmail(form.email)) errs.email = emailError;
    if (Object.values(errs).some(Boolean)) { setErrors(errs); return; }

    setSaving(true);
    try {
      const payload = { name: form.name, email: form.email };
      if (form.password) payload.password = form.password;
      await updateProfile(payload);
      login({ ...user, name: form.name, email: form.email });
      toast.success('Profile updated!');
      setForm(f => ({ ...f, password: '' }));
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 500 }}>
        <div className="page-header"><h1>My Profile</h1></div>
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 72, height: 72, background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, margin: '0 auto 12px' }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <span className={`badge role-${user.role}`} style={{ padding: '4px 12px', borderRadius: 20, fontWeight: 600, textTransform: 'uppercase', fontSize: 12 }}>
              {user.role}
            </span>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className={errors.email ? 'input-error' : ''}
                value={form.email}
                onChange={e => { setForm({ ...form, email: e.target.value }); setErrors(er => ({ ...er, email: '' })); }}
                onBlur={handleBlurEmail}
              />
              {errors.email && <span className="field-error-msg">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label>New Password <span style={{ color: 'var(--gray)', fontSize: 12 }}>(leave blank to keep current)</span></label>
              <input type="password" value={form.password} placeholder="New password" onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
