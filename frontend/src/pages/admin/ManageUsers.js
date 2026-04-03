import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getAllUsers, deleteUser, updateUserRole, toggleUserStatus, editUserDetails, registerUser, syncEnrollments, fixEnrollments, getFaculties, createFaculty, deleteFaculty, addDepartment, removeDepartment, getCourses } from '../../services/api';
import { isValidEmail, emailError } from '../../utils/validate';
import AdminLayout from '../../components/AdminLayout';
import './Admin.css';

const EMPTY_FORM = { name: '', email: '', department: '', studentId: '' };
const EMPTY_ADD_FORM = { name: '', email: '', password: '', confirmPassword: '', role: 'student', department: '', studentId: '' };


export default function ManageUsers() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'student', 'lecturer', 'admin'
  const [showFilters, setShowFilters] = useState(false);
  const [showAdd, setShowAdd]   = useState(false);
  const [addForm, setAddForm]   = useState(EMPTY_ADD_FORM); // form for adding new user
  const [addErrors, setAddErrors] = useState({});
  const [addSaving, setAddSaving] = useState(false);
  const [editUser, setEditUser] = useState(null);   // user being edited
  const [form, setForm]         = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]     = useState(false);
  const [syncingEnrollments, setSyncingEnrollments] = useState(false);
  const [fixingEnrollments, setFixingEnrollments] = useState(false);
  const [facultyDepts, setFacultyDepts] = useState([]); // [{ faculty, depts: [{name, prefix}] }]
  const [courses, setCourses] = useState([]);
  // Get departments that have courses from course section
  const courseDepartments = [...new Set(courses.map(c => c.department?.trim()).filter(Boolean))];

  // Build faculty -> course departments from faculty registry
  const facultyDeptsFromCourses = facultyDepts.map(f => ({
    ...f,
    depts: f.depts.filter(d => courseDepartments.includes(d.name))
  })).filter(f => f.depts.length > 0);

  // Use course-based faculty/dept list when available; otherwise fallback to all faculties
  const departmentSelectionSource = facultyDeptsFromCourses.length > 0 ? facultyDeptsFromCourses : facultyDepts;
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await getAllUsers();
        setUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    Promise.all([
      getFaculties().then(r => {
        setFacultyDepts(r.data.map(f => ({
          faculty: f.name,
          depts: f.departments.map(d => ({ name: d.name, prefix: d.prefix, _id: d._id })),
          _id: f._id
        })));
      }),
      getCourses().then(r => setCourses(r.data))
    ]).catch(() => {});

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  /* ── add new user ── */
  const handleAddUser = async () => {
    const errs = {};
    if (!addForm.name.trim()) errs.name = 'Name is required';
    if (!isValidEmail(addForm.email)) errs.email = emailError;
    if (addForm.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (addForm.password !== addForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if ((addForm.role === 'student' || addForm.role === 'lecturer') && !addForm.department) {
      errs.department = 'Department is required';
    }
    if (Object.values(errs).some(Boolean)) { setAddErrors(errs); return; }

    setAddSaving(true);
    try {
      const { data } = await registerUser(addForm);
      setUsers([...users, data]);
      toast.success(`${addForm.role.charAt(0).toUpperCase() + addForm.role.slice(1)} account created!`);
      setShowAdd(false);
      setAddForm(EMPTY_ADD_FORM);
      setAddErrors({});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setAddSaving(false);
    }
  };

  /* ── open edit modal ── */
  const openEdit = (u) => {
    setEditUser(u);
    // Find first course for this user
    let courseId = '';
    if (u.role === 'student') {
      const userCourse = courses.find(c => c.students?.some(s => (typeof s === 'object' ? s._id : s) === u._id));
      courseId = userCourse?._id || '';
    } else if (u.role === 'lecturer') {
      const userCourse = courses.find(c => c.lecturer?._id === u._id || c.lecturers?.some(l => (typeof l === 'object' ? l._id : l) === u._id));
      courseId = userCourse?._id || '';
    }
    setForm({
      name:       u.name       || '',
      email:      u.email      || '',
      department: u.department || '',
      studentId:  u.studentId  || '',
      courseId:   courseId      || ''
    });
  };

  const closeEdit = () => { setEditUser(null); setForm(EMPTY_FORM); setFormErrors({}); };

  /* ── save edit ── */
  const handleSave = async () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!isValidEmail(form.email)) errs.email = emailError;
    if (Object.values(errs).some(Boolean)) { setFormErrors(errs); return; }

    setSaving(true);
    try {
      const { data } = await editUserDetails(editUser._id, form);
      setUsers(users.map(u => u._id === editUser._id ? data : u));
      toast.success('User details updated');
      closeEdit();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ── */
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;
    try {
      await deleteUser(id);
      setUsers(users.filter(u => u._id !== id));
      toast.success('User deleted');
    } catch { toast.error('Failed to delete user'); }
  };

  /* ── role change ── */
  const handleRoleChange = async (id, role) => {
    try {
      const { data } = await updateUserRole(id, role);
      setUsers(users.map(u => u._id === id ? data : u));
      toast.success('Role updated');
    } catch { toast.error('Failed to update role'); }
  };

  /* ── toggle active ── */
  const handleToggleStatus = async (id) => {
    try {
      const { data } = await toggleUserStatus(id);
      setUsers(users.map(u => u._id === id ? data : u));
      toast.success(`User ${data.isActive ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed to update status'); }
  };

  /* ── sync existing students to courses ── */
  const handleSyncEnrollments = async () => {
    if (!window.confirm('Enroll all existing students to their department courses? This is a one-time operation.')) return;
    setSyncingEnrollments(true);
    try {
      const { data } = await syncEnrollments();
      toast.success(`✅ Synced! ${data.enrollmentsCreated} enrollments created for ${data.studentsProcessed} students`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sync failed');
    } finally {
      setSyncingEnrollments(false);
    }
  };

  /* ── fix misplaced enrollments ── */
  const handleFixEnrollments = async () => {
    if (!window.confirm('Fix student enrollments? This will remove students from wrong department courses and add them to correct ones.')) return;
    setFixingEnrollments(true);
    try {
      const { data } = await fixEnrollments();
      toast.success(`✅ Fixed! Removed ${data.removedFromWrongDept}, Added ${data.addedToCorrectDept}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Fix failed');
    } finally {
      setFixingEnrollments(false);
    }
  };

  const filtered = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                         u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const students  = users.filter(u => u.role === 'student').length;
  const lecturers = users.filter(u => u.role === 'lecturer').length;
  const active    = users.filter(u => u.isActive !== false).length;

  if (loading) return <AdminLayout pageTitle="User Management"><div className="al-loading">Loading...</div></AdminLayout>;

  return (
    <AdminLayout pageTitle="User Management">

      {/* ── Add User Modal ── */}
      {showAdd && (
        <div className="inv-overlay" onClick={() => setShowAdd(false)}>
          <div className="inv-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="inv-modal-header" style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
              <div>
                <h2 className="inv-modal-title" style={{ marginBottom: 4 }}>Add New User</h2>
                <p className="inv-modal-user" style={{ opacity: 0.85 }}>
                  👤 Create a new account in the system
                </p>
              </div>
              <button className="inv-close" onClick={() => setShowAdd(false)}>✕</button>
            </div>

            {/* Body */}
            <div className="inv-modal-body">
              <div className="eu-field-grid">

                {/* Name */}
                <div className="eu-field">
                  <label className="eu-label">Full Name</label>
                  <input
                    className={`eu-input${addErrors.name ? ' eu-input-error' : ''}`}
                    value={addForm.name}
                    onChange={e => { setAddForm({ ...addForm, name: e.target.value }); setAddErrors(er => ({ ...er, name: '' })); }}
                    placeholder="Full name"
                  />
                  {addErrors.name && <span className="eu-error-msg">{addErrors.name}</span>}
                </div>

                {/* Email */}
                <div className="eu-field">
                  <label className="eu-label">Email Address</label>
                  <input
                    className={`eu-input${addErrors.email ? ' eu-input-error' : ''}`}
                    type="email"
                    value={addForm.email}
                    onChange={e => { setAddForm({ ...addForm, email: e.target.value }); setAddErrors(er => ({ ...er, email: '' })); }}
                    onBlur={() => {
                      if (addForm.email && !isValidEmail(addForm.email)) setAddErrors(er => ({ ...er, email: emailError }));
                      else setAddErrors(er => ({ ...er, email: '' }));
                    }}
                    placeholder="Email"
                  />
                  {addErrors.email && <span className="eu-error-msg">{addErrors.email}</span>}
                </div>

                {/* Password */}
                <div className="eu-field">
                  <label className="eu-label">Password</label>
                  <input
                    className={`eu-input${addErrors.password ? ' eu-input-error' : ''}`}
                    type="password"
                    value={addForm.password}
                    onChange={e => { setAddForm({ ...addForm, password: e.target.value }); setAddErrors(er => ({ ...er, password: '' })); }}
                    placeholder="Min 6 characters"
                  />
                  {addErrors.password && <span className="eu-error-msg">{addErrors.password}</span>}
                </div>

                {/* Confirm Password */}
                <div className="eu-field">
                  <label className="eu-label">Confirm Password</label>
                  <input
                    className={`eu-input${addErrors.confirmPassword ? ' eu-input-error' : ''}`}
                    type="password"
                    value={addForm.confirmPassword}
                    onChange={e => { setAddForm({ ...addForm, confirmPassword: e.target.value }); setAddErrors(er => ({ ...er, confirmPassword: '' })); }}
                    placeholder="Confirm password"
                  />
                  {addErrors.confirmPassword && <span className="eu-error-msg">{addErrors.confirmPassword}</span>}
                </div>

                {/* Role */}
                <div className="eu-field">
                  <label className="eu-label">Role</label>
                  <select
                    className={`eu-input${addErrors.role ? ' eu-input-error' : ''}`}
                    value={addForm.role}
                    onChange={e => { setAddForm({ ...addForm, role: e.target.value }); setAddErrors(er => ({ ...er, role: '' })); }}
                  >
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                  </select>
                  {addErrors.role && <span className="eu-error-msg">{addErrors.role}</span>}
                </div>

                {/* Department (from course list) */}
                <div className="eu-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="eu-label">Department</label>
                  <select
                    className={`eu-input${addErrors.department ? ' eu-input-error' : ''}`}
                    value={addForm.department || ''}
                    onChange={e => {
                      const department = e.target.value;
                      setAddForm({ ...addForm, department });
                      setAddErrors(er => ({ ...er, department: '' }));
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">— Select a department from courses —</option>
                    {courseDepartments.map(dep => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>
                  {addErrors.department && <span className="eu-error-msg">{addErrors.department}</span>}
                </div>

                {/* Optional free-text department entry */}
                <div className="eu-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="eu-label">Department (type if missing)</label>
                  <input
                    className="eu-input"
                    value={addForm.department || ''}
                    onChange={e => setAddForm({ ...addForm, department: e.target.value })}
                    placeholder="Other department (e.g. Business Management)"
                  />
                </div>

                {/* Student ID — students only */}
                {addForm.role === 'student' && (() => {
                  const prefix = departmentSelectionSource.flatMap(f => f.depts).find(d => d.name === addForm.department)?.prefix;
                  return (
                  <div className="eu-field">
                    <label className="eu-label">
                      Student ID
                      {prefix && (
                        <span style={{ marginLeft: 6, fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>
                          (must start with <strong>{prefix}</strong>)
                        </span>
                      )}
                    </label>
                    <input
                      className="eu-input"
                      value={addForm.studentId}
                      onChange={e => setAddForm({ ...addForm, studentId: e.target.value })}
                      placeholder={prefix ? `e.g. ${prefix}24001` : 'e.g. IT24001'}
                    />
                  </div>
                  );
                })()}
              </div>

              {/* Actions */}
              <div className="inv-actions" style={{ marginTop: 24 }}>
                <button className="inv-action-btn inv-btn-dismiss" onClick={() => setShowAdd(false)}>
                  Cancel
                </button>
                <button
                  className="inv-action-btn"
                  style={{ background: '#4f46e5', color: '#fff', border: 'none' }}
                  onClick={handleAddUser}
                  disabled={addSaving}
                >
                  {addSaving ? 'Creating…' : '✨ Create User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editUser && (
        <div className="inv-overlay" onClick={closeEdit}>
          <div className="inv-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="inv-modal-header" style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
              <div>
                <h2 className="inv-modal-title" style={{ marginBottom: 4 }}>Edit User</h2>
                <p className="inv-modal-user" style={{ opacity: 0.85 }}>
                  👤 {editUser.name} &nbsp;·&nbsp; {capitalize(editUser.role)}
                </p>
              </div>
              <button className="inv-close" onClick={closeEdit}>✕</button>
            </div>

            {/* Body */}
            <div className="inv-modal-body">
              <div className="eu-field-grid">

                {/* Name */}
                <div className="eu-field">
                  <label className="eu-label">Full Name</label>
                  <input
                    className={`eu-input${formErrors.name ? ' eu-input-error' : ''}`}
                    value={form.name}
                    onChange={e => { setForm({ ...form, name: e.target.value }); setFormErrors(er => ({ ...er, name: '' })); }}
                    placeholder="Full name"
                  />
                  {formErrors.name && <span className="eu-error-msg">{formErrors.name}</span>}
                </div>

                {/* Email */}
                <div className="eu-field">
                  <label className="eu-label">Email Address</label>
                  <input
                    className={`eu-input${formErrors.email ? ' eu-input-error' : ''}`}
                    type="email"
                    value={form.email}
                    onChange={e => { setForm({ ...form, email: e.target.value }); setFormErrors(er => ({ ...er, email: '' })); }}
                    onBlur={() => {
                      if (form.email && !isValidEmail(form.email)) setFormErrors(er => ({ ...er, email: emailError }));
                      else setFormErrors(er => ({ ...er, email: '' }));
                    }}
                    placeholder="Email"
                  />
                  {formErrors.email && <span className="eu-error-msg">{formErrors.email}</span>}
                </div>

                {/* Student ID — students only */}
                {editUser.role === 'student' && (() => {
                  const prefix = departmentSelectionSource.flatMap(f => f.depts).find(d => d.name === form.department)?.prefix;
                  return (
                  <div className="eu-field">
                    <label className="eu-label">
                      Student ID
                      {prefix && (
                        <span style={{ marginLeft: 6, fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>
                          (must start with <strong>{prefix}</strong>)
                        </span>
                      )}
                    </label>
                    <input
                      className="eu-input"
                      value={form.studentId}
                      onChange={e => setForm({ ...form, studentId: e.target.value })}
                      placeholder={prefix ? `e.g. ${prefix}24001` : 'e.g. IT24001'}
                    />
                  </div>
                  );
                })()}

                {/* Department Selection for students/lecturers */}
                {(editUser.role === 'student' || editUser.role === 'lecturer') && (
                  <>
                    <div className="eu-field" style={{ gridColumn: '1 / -1' }}>
                      <label className="eu-label">Department</label>
                      <select
                        className={`eu-input${formErrors.department ? ' eu-input-error' : ''}`}
                        value={form.department || ''}
                        onChange={e => {
                          setForm({ ...form, department: e.target.value });
                          setFormErrors(er => ({ ...er, department: '' }));
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <option value="">— Select a department from courses —</option>
                        {courseDepartments.map(dep => (
                          <option key={dep} value={dep}>{dep}</option>
                        ))}
                      </select>
                    </div>

                    <div className="eu-field" style={{ gridColumn: '1 / -1' }}>
                      <label className="eu-label">Department (type if missing)</label>
                      <input
                        className="eu-input"
                        value={form.department || ''}
                        onChange={e => setForm({ ...form, department: e.target.value })}
                        placeholder="Other department"
                      />
                    </div>
                  </>
                )}

              </div>

              {/* Actions */}
              <div className="inv-actions" style={{ marginTop: 24 }}>
                <button className="inv-action-btn inv-btn-dismiss" onClick={closeEdit}>
                  Cancel
                </button>
                <button
                  className="inv-action-btn"
                  style={{ background: '#4f46e5', color: '#fff', border: 'none' }}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : '💾 Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="ap-header">
        <div>
          <h1>User Management</h1>
          <p>Manage all system users</p>
        </div>
      </div>

      {/* Stats */}
      <div className="ap-stats">
        {[
          { label: 'Total Users',  value: users.length, icon: '👥' },
          { label: 'Lecturers',    value: lecturers,    icon: '👨‍🏫' },
          { label: 'Students',     value: students,     icon: '🎓' },
          { label: 'Active Users', value: active,       icon: '✅' },
        ].map((s, i) => (
          <div key={i} className="ap-stat-card">
            <div className="ap-stat-label">{s.label}</div>
            <div className="ap-stat-num">{s.value}</div>
            <div className="ap-stat-icon"><span style={{ fontSize: 16 }}>{s.icon}</span></div>
          </div>
        ))}
      </div>


      <div className="ap-card">
        <div className="um-toolbar">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
            <div className="um-search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                placeholder="Search users by email or name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {/* Filter toggle button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              title="Toggle filters"
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #e5e0f5',
                background: showFilters ? '#f0fdf4' : 'white',
                color: showFilters ? '#16a34a' : '#9ca3af',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              {showFilters ? 'Hide Filters' : 'Filters'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ap-btn-purple" onClick={() => setShowAdd(!showAdd)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add user
            </button>
            <button
              className="ap-btn-purple"
              onClick={handleSyncEnrollments}
              disabled={syncingEnrollments}
              title="Enroll existing students to their department courses"
              style={{ background: '#10b981', cursor: syncingEnrollments ? 'wait' : 'pointer' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
              </svg>
              {syncingEnrollments ? 'Syncing…' : 'Sync Enrollments'}
            </button>
            <button
              className="ap-btn-purple"
              onClick={handleFixEnrollments}
              disabled={fixingEnrollments}
              title="Remove students from wrong dept, add to correct dept"
              style={{ background: '#f59e0b', cursor: fixingEnrollments ? 'wait' : 'pointer' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="3" x2="12" y2="10"/>
              </svg>
              {fixingEnrollments ? 'Fixing…' : 'Fix Enrollments'}
            </button>
          </div>
        </div>

        {/* Expandable filters */}
        {showFilters && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, padding: '12px', background: '#f9fafb', borderRadius: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginRight: 4 }}>Filter by:</span>
            {['all', 'student', 'lecturer', 'admin'].map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e0f5',
                  background: roleFilter === role ? '#7c3aed' : 'white',
                  color: roleFilter === role ? 'white' : '#6b7280',
                  fontSize: '12px',
                  fontWeight: roleFilter === role ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {role === 'all' ? 'All' : role === 'student' ? 'Student' : role === 'lecturer' ? 'Lecturer' : 'Admin'}
              </button>
            ))}
          </div>
        )}

        <div className="um-table-header">
          <span>Users</span>
          <div className="um-month-filter" style={{ fontSize: 12, color: '#9ca3af' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        </div>

        <table className="um-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: '#9ca3af', padding: '32px 0' }}>No users found</td></tr>
            ) : (
              filtered.map(u => {
                // Get courses for this user (enrolled for students, assigned/teaching for lecturers)
                const userCourses = courses.filter(c => {
                  if (u.role === 'student') {
                    return c.students?.some(s => (typeof s === 'object' ? s._id : s) === u._id);
                  } else if (u.role === 'lecturer') {
                    return c.lecturer?._id === u._id || c.lecturers?.some(l => (typeof l === 'object' ? l._id : l) === u._id);
                  }
                  return false;
                });

                return (
                <tr key={u._id}>
                  <td>
                    <div className="um-user-cell">
                      <div className="um-avatar" style={{ background: roleColor(u.role) }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="um-uname">{u.name}</div>
                        <div className="um-urole">{capitalize(u.role)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="um-email">{u.email}</td>
                  <td>
                    {u.department ? (() => {
                      // Get faculty from first course
                      const faculty = userCourses.length > 0 ? userCourses[0].faculty : '';
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {faculty && (
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>
                              {faculty}
                            </div>
                          )}
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>
                            {u.department}
                          </div>
                        </div>
                      );
                    })() : <span style={{ color: '#d1d5db', fontSize: 13 }}>—</span>}
                  </td>
                  <td>
                    <div className="um-actions">
                      {u.role === 'admin' ? (
                        <span className="um-admin-lock" title="Admin role cannot be changed">
                          🔒 Admin
                        </span>
                      ) : (
                        <select
                          className="um-role-select"
                          value={u.role}
                          onChange={e => handleRoleChange(u._id, e.target.value)}
                        >
                          <option value="student">Student</option>
                          <option value="lecturer">Lecturer</option>
                        </select>
                      )}
                      <button className="um-edit-btn" onClick={() => openEdit(u)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit
                      </button>
                      <button className="um-del-btn" onClick={() => handleDelete(u._id, u.name)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

const roleColor = (role) => ({ student: '#4f46e5', lecturer: '#059669', admin: '#dc2626' }[role] || '#6b7280');
const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);
