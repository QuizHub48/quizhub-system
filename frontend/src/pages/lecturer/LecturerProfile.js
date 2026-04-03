import React, { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { updateProfile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LecturerLayout from '../../components/LecturerLayout';
import './Lecturer.css';

export default function LecturerProfile() {
  const { user, login } = useAuth();
  const fileInputRef = useRef();
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.profilePicture || '');

  // Profile state
  const nameParts = user?.name?.split(' ') || ['', ''];
  const [profileData, setProfileData] = useState({
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    email: user?.email || '',
    bio: user?.bio || ''
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSaveProfile = async () => {
    if (!profileData.firstName || !profileData.lastName) {
      toast.error('First name and last name are required');
      return;
    }

    setSaving(true);
    try {
      const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
      await updateProfile({
        name: fullName,
        email: profileData.email,
        bio: profileData.bio,
        profilePicture: avatarPreview
      });
      login({
        ...user,
        name: fullName,
        email: profileData.email,
        bio: profileData.bio,
        profilePicture: avatarPreview
      });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        currentPassword: passwordData.currentPassword,
        password: passwordData.newPassword
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const maxSize = 1.5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Image must be under 1.5 MB (yours is ${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      console.log('Base64 converted, length:', base64.length);
      setAvatarPreview(base64);
      setAvatarSaving(true);
      try {
        console.log('Uploading profile picture...');
        await updateProfile({ profilePicture: base64 });
        console.log('Profile picture uploaded successfully');
        login({ ...user, profilePicture: base64 });
        toast.success('Profile picture updated!');
      } catch (err) {
        console.error('Avatar upload error:', err);
        const errorMsg = err.response?.data?.message || err.message || 'Failed to upload photo';
        console.error('Error message:', errorMsg);
        toast.error(errorMsg);
        setAvatarPreview(user?.profilePicture || '');
      } finally {
        setAvatarSaving(false);
      }
    };
    reader.onerror = (err) => {
      console.error('FileReader error:', err);
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  return (
    <LecturerLayout pageTitle="Profile">
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ marginTop: 0, marginBottom: 4, fontSize: 28, fontWeight: 600 }}>Profile & Settings</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Manage your account information</p>
        </div>

        {/* Profile Card */}
        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: 20
        }}>
          <h2 style={{ marginTop: 0, marginBottom: 24, fontSize: 18, fontWeight: 600 }}>Profile Information</h2>

          {/* Avatar Section */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />

            <div style={{ textAlign: 'center', flex: '0 0 auto' }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                overflow: 'hidden',
                marginBottom: 12,
                position: 'relative',
                cursor: 'pointer'
              }}
              onClick={() => fileInputRef.current.click()}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user?.name?.charAt(0).toUpperCase()
                )}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  fontSize: 20
                }}
                onMouseEnter={(e) => e.target.style.opacity = '1'}
                onMouseLeave={(e) => e.target.style.opacity = '0'}>
                  📷
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                style={{
                  backgroundColor: 'white',
                  color: '#1f2937',
                  border: '1px solid #e5e7eb',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500
                }}
              >
                {avatarSaving ? 'Uploading…' : '📷 Change Photo'}
              </button>
            </div>

            <div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{user?.name}</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{user?.role && user.role.charAt(0).toUpperCase() + user.role.slice(1)}</div>
            </div>
          </div>

          {/* Form Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>First Name</label>
              <input
                type="text"
                value={profileData.firstName}
                onChange={e => setProfileData({ ...profileData, firstName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: 14
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>Last Name</label>
              <input
                type="text"
                value={profileData.lastName}
                onChange={e => setProfileData({ ...profileData, lastName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: 14
                }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>Email Address</label>
              <input
                type="email"
                value={profileData.email}
                onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: 14
                }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>Bio</label>
              <textarea
                value={profileData.bio}
                onChange={e => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            style={{
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        {/* Password Card */}
        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, fontWeight: 600 }}>Change Password</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: 14
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: 14
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>Confirm Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: 14
                }}
              />
            </div>
          </div>

          <button
            onClick={handleUpdatePassword}
            disabled={saving}
            style={{
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            {saving ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </div>
    </LecturerLayout>
  );
}
