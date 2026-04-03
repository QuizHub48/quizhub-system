import React, { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { updateProfile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail, emailError, isValidPhone, phoneError } from '../../utils/validate';
import StudentLayout from '../../components/StudentLayout';

export default function StudentProfile() {
  const { user, login } = useAuth();
  const location = useLocation();
  const isResetMode = new URLSearchParams(location.search).get('reset') === 'true';

  // Auto-split name into first and last name
  const getFirstName = () => {
    if (user.firstName) return user.firstName;
    if (user.name) return user.name.split(' ')[0];
    return '';
  };

  const getLastName = () => {
    if (user.lastName) return user.lastName;
    if (user.name) {
      const parts = user.name.split(' ');
      return parts.length > 1 ? parts.slice(1).join(' ') : '';
    }
    return '';
  };

  const [form, setForm] = useState({
    firstName: getFirstName(),
    lastName: getLastName(),
    studentId: user.studentId || '',
    contactNo: user.contactNo || '',
    degreeProgram: user.degreeProgram || '',
    email: user.email,
    currentPassword: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [profilePicture, setProfilePicture] = useState(user.profilePicture || null);
  const fileInputRef = useRef(null);

  const handleBlurEmail = () => {
    if (form.email && !isValidEmail(form.email)) {
      setErrors(e => ({ ...e, email: emailError }));
    } else {
      setErrors(e => ({ ...e, email: '' }));
    }
  };

  const handleBlurPhone = () => {
    if (form.contactNo && !isValidPhone(form.contactNo)) {
      setErrors(e => ({ ...e, contactNo: phoneError }));
    } else {
      setErrors(e => ({ ...e, contactNo: '' }));
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};

    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!isValidEmail(form.email)) errs.email = emailError;
    if (form.contactNo && !isValidPhone(form.contactNo)) errs.contactNo = phoneError;

    // Password validation
    if (form.password) {
      if (!isResetMode && !form.currentPassword) errs.currentPassword = 'Current password is required to change password';
      if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
      if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    }

    if (Object.values(errs).some(Boolean)) { setErrors(errs); return; }

    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        studentId: form.studentId,
        contactNo: form.contactNo,
        degreeProgram: form.degreeProgram,
        email: form.email
      };
      if (form.password) {
        payload.password = form.password;
        if (isResetMode) {
          payload.skipCurrentPassword = true;
        } else {
          payload.currentPassword = form.currentPassword;
        }
      }
      if (profilePicture && profilePicture.startsWith('data:')) {
        payload.profilePicture = profilePicture;
      }
      await updateProfile(payload);
      login({ ...user, ...payload });
      toast.success('Profile updated!');
      setForm(f => ({ ...f, password: '', confirmPassword: '' }));
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  return (
    <StudentLayout pageTitle="Profile">
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '40px' }}>
          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 24, fontWeight: 600, color: '#1f2937' }}>Profile Information</h1>
            <p style={{ marginTop: 0, color: '#6b7280', fontSize: 14 }}>Update your personal details and public information</p>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfilePictureChange}
            style={{ display: 'none' }}
          />

          {/* User Info Card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40, paddingBottom: 40, borderBottom: '1px solid #e5e7eb' }}>
            <div style={{
              width: 80,
              height: 80,
              background: profilePicture ? 'transparent' : '#7c3aed',
              color: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 700,
              flexShrink: 0,
              overflow: 'hidden',
              objectFit: 'cover'
            }}>
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 style={{ marginTop: 0, marginBottom: 4, fontSize: 18, fontWeight: 600, color: '#1f2937' }}>
                {form.firstName} {form.lastName}
              </h2>
              <p style={{ marginTop: 0, marginBottom: 12, color: '#6b7280', fontSize: 14 }}>{user.role}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'none',
                  border: '1px solid #d1d5db',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: '#374151'
                }}
              >
                📷 Change Photo
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* First Name & Last Name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#1f2937', fontSize: 14 }}>First Name</label>
                <input
                  value={form.firstName}
                  onChange={e => { setForm({ ...form, firstName: e.target.value }); setErrors(er => ({ ...er, firstName: '' })); }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: errors.firstName ? '1px solid #dc2626' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    backgroundColor: '#f9fafb'
                  }}
                />
                {errors.firstName && <span style={{ color: '#dc2626', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.firstName}</span>}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#1f2937', fontSize: 14 }}>Last Name</label>
                <input
                  value={form.lastName}
                  onChange={e => { setForm({ ...form, lastName: e.target.value }); setErrors(er => ({ ...er, lastName: '' })); }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: errors.lastName ? '1px solid #dc2626' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    backgroundColor: '#f9fafb'
                  }}
                />
                {errors.lastName && <span style={{ color: '#dc2626', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.lastName}</span>}
              </div>
            </div>

            {/* Email & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#1f2937', fontSize: 14 }}>Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => { setForm({ ...form, email: e.target.value }); setErrors(er => ({ ...er, email: '' })); }}
                  onBlur={handleBlurEmail}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: errors.email ? '1px solid #dc2626' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    backgroundColor: '#f9fafb'
                  }}
                />
                {errors.email && <span style={{ color: '#dc2626', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.email}</span>}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#1f2937', fontSize: 14 }}>Phone Number <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                <input
                  value={form.contactNo}
                  placeholder="+94 77 000 0000"
                  onChange={e => { setForm({ ...form, contactNo: e.target.value }); setErrors(er => ({ ...er, contactNo: '' })); }}
                  onBlur={handleBlurPhone}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: errors.contactNo ? '1px solid #dc2626' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    backgroundColor: '#f9fafb'
                  }}
                />
                {errors.contactNo && <span style={{ color: '#dc2626', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.contactNo}</span>}
              </div>
            </div>

            {/* Account Status */}
            <div style={{ marginBottom: 40, paddingBottom: 40, borderBottom: '1px solid #e5e7eb' }}>
              <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, color: '#1f2937', fontSize: 14 }}>Account Status</label>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#d1fae5',
                color: '#047857',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: 13,
                fontWeight: 500
              }}>
                <span style={{ width: 8, height: 8, backgroundColor: '#10b981', borderRadius: '50%' }} />
                Active
              </span>
            </div>

            {/* Change Password Section */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 13, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isResetMode ? 'Set New Password' : 'Change Password'}
              </h3>

              {isResetMode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#ede9fe', border: '1px solid #ddd6fe', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                  <span style={{ fontSize: 16 }}>🔓</span>
                  <span style={{ fontSize: 13, color: '#4c1d95', fontWeight: 500 }}>
                    You verified your identity via OTP. Set a new password below — no current password needed.
                  </span>
                </div>
              )}

              {!isResetMode && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#1f2937', fontSize: 14 }}>Current Password</label>
                    <input
                      type="password"
                      value={form.currentPassword}
                      placeholder="••••••••"
                      onChange={e => { setForm({ ...form, currentPassword: e.target.value }); setErrors(er => ({ ...er, currentPassword: '' })); }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: errors.currentPassword ? '1px solid #dc2626' : '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: 14,
                        boxSizing: 'border-box',
                        backgroundColor: '#f9fafb'
                      }}
                    />
                    {errors.currentPassword && <span style={{ color: '#dc2626', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.currentPassword}</span>}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#1f2937', fontSize: 14 }}>New Password</label>
                  <input
                    type="password"
                    value={form.password}
                    placeholder="••••••••"
                    onChange={e => { setForm({ ...form, password: e.target.value }); setErrors(er => ({ ...er, password: '' })); }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: errors.password ? '1px solid #dc2626' : '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: 14,
                      boxSizing: 'border-box',
                      backgroundColor: '#f9fafb'
                    }}
                  />
                  {errors.password && <span style={{ color: '#dc2626', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.password}</span>}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#1f2937', fontSize: 14 }}>Confirm Password</label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    placeholder="••••••••"
                    onChange={e => { setForm({ ...form, confirmPassword: e.target.value }); setErrors(er => ({ ...er, confirmPassword: '' })); }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: errors.confirmPassword ? '1px solid #dc2626' : '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: 14,
                      boxSizing: 'border-box',
                      backgroundColor: '#f9fafb'
                    }}
                  />
                  {errors.confirmPassword && <span style={{ color: '#dc2626', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.confirmPassword}</span>}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '12px 28px',
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </StudentLayout>
  );
}
