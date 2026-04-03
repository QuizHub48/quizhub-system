import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getCourses, createCourse, deleteCourse, updateCourse, toggleCourseStatus, getAllUsers, enrollStudentInCourse, unenrollStudentFromCourse, getFaculties, createFaculty, addDepartment, deleteFaculty, removeDepartment } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import './Admin.css';

export default function ManageCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '', lecturer: '', department: '', faculty: '' });
  const [saving, setSaving] = useState(false);
  const [viewCourse, setViewCourse] = useState(null);
  const [editCourse, setEditCourse] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', code: '', description: '', lecturer: '', faculty: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [facultyDepts, setFacultyDepts] = useState([]); // [{ _id, faculty, depts: [{ _id, name, prefix}] }]
  const [showFacultyManagement, setShowFacultyManagement] = useState(false);
  const [deptForms, setDeptForms] = useState({});
  const [newFacultyName, setNewFacultyName] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptPrefix, setNewDeptPrefix] = useState('');
  const [addingFaculty, setAddingFaculty] = useState(false);

  // Flat dept list for dropdowns
  const DEPARTMENTS = facultyDepts.flatMap(f => f.depts.map(d => d.name));

  const getDeptPrefix = (deptName) =>
    facultyDepts.flatMap(f => f.depts).find(d => d.name === deptName)?.prefix || '';

  const getFacultyByDept = (deptName) =>
    facultyDepts.find(f => f.depts.some(d => d.name === deptName))?.faculty || '';

  const handleAddFacultyDept = async () => {
    if (!newFacultyName.trim() || !newDeptName.trim() || !newDeptPrefix.trim()) {
      toast.error('All fields are required');
      return;
    }
    setAddingFaculty(true);
    try {
      // First create the faculty
      const { data: faculty } = await createFaculty(newFacultyName.trim());
      // Then add the department
      const { data: updatedFaculty } = await addDepartment(faculty._id, {
        name: newDeptName.trim(),
        prefix: newDeptPrefix.trim().toUpperCase()
      });
      
      // Update local state
      const newFacultyData = {
        _id: updatedFaculty._id,
        faculty: updatedFaculty.name,
        depts: updatedFaculty.departments.map(d => ({ _id: d._id, name: d.name, prefix: d.prefix }))
      };
      setFacultyDepts(prev => [...prev, newFacultyData]);
      
      // Set the form department AND faculty to the new ones
      setForm({ ...form, department: newDeptName.trim(), faculty: updatedFaculty.name });
      
      // Reset form
      setNewFacultyName('');
      setNewDeptName('');
      setNewDeptPrefix('');
      setShowFacultyManagement(false);
      toast.success('Faculty and department created!') ;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create faculty/department');
    } finally {
      setAddingFaculty(false);
    }
  };

  const toggleDeptForm = (facultyId) => {
    setDeptForms(prev => ({
      ...prev,
      [facultyId]: {
        ...prev[facultyId],
        open: !prev[facultyId]?.open,
        name: '',
        prefix: ''
      }
    }));
  };

  const handleDeptChange = (facultyId, field, value) => {
    setDeptForms(prev => ({
      ...prev,
      [facultyId]: {
        ...prev[facultyId],
        [field]: value
      }
    }));
  };

  const handleDeleteFaculty = async (faculty) => {
    if (!window.confirm(`Delete faculty ${faculty.faculty}?`)) return;
    try {
      await deleteFaculty(faculty._id);
      setFacultyDepts(prev => prev.filter(f => f._id !== faculty._id));
      toast.success('Faculty deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete faculty');
    }
  };

  const handleAddDept = async (faculty) => {
    const formData = deptForms[faculty._id] || {};
    if (!formData.name?.trim() || !formData.prefix?.trim()) {
      toast.error('Department name and prefix are required');
      return;
    }

    try {
      const { data: updatedFaculty } = await addDepartment(faculty._id, {
        name: formData.name.trim(),
        prefix: formData.prefix.trim().toUpperCase()
      });

      setFacultyDepts(prev => prev.map(f =>
        f._id === faculty._id
          ? { ...f, depts: updatedFaculty.departments.map(d => ({ _id: d._id, name: d.name, prefix: d.prefix })) }
          : f
      ));

      setDeptForms(prev => ({ ...prev, [faculty._id]: { open: false, name: '', prefix: '' } }));
      toast.success('Department added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add department');
    }
  };

  const handleRemoveDept = async (faculty, dept) => {
    if (!window.confirm(`Remove department ${dept.name} from ${faculty.faculty}?`)) return;
    try {
      await removeDepartment(faculty._id, dept._id);
      setFacultyDepts(prev => prev.map(f =>
        f._id === faculty._id
          ? { ...f, depts: f.depts.filter(d => d._id !== dept._id) }
          : f
      ));
      toast.success('Department removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove department');
    }
  };


  useEffect(() => {
    Promise.all([
      getCourses().then(({ data }) => setCourses(data)),
      getAllUsers().then(({ data }) => {
        setLecturers(data.filter(u => u.role === 'lecturer'));
        setAllStudents(data.filter(u => u.role === 'student'));
      }),
      getFaculties().then(({ data }) => setFacultyDepts(
        data.map(f => ({ _id: f._id, faculty: f.name, depts: f.departments.map(d => ({ _id: d._id, name: d.name, prefix: d.prefix })) }))
      )),
    ]).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.department) { toast.error('Please select a department'); return; }
    setSaving(true);
    try {
      const { data } = await createCourse(form);
      setCourses([...courses, data]);
      setForm({ name: '', code: '', description: '', lecturer: '', department: '', faculty: '' });
      setShowForm(false);
      toast.success('Course created!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try {
      await deleteCourse(id);
      setCourses(courses.filter(c => c._id !== id));
      toast.success('Course deleted');
    } catch { toast.error('Failed'); }
  };

  const handleEditClick = (course) => {
    setEditCourse(course);
    setEditForm({ name: course.name, code: course.code, description: course.description, lecturer: course.lecturer?._id || '', faculty: course.faculty || '' });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const { data } = await updateCourse(editCourse._id, editForm);
      setCourses(courses.map(c => c._id === editCourse._id ? data : c));
      setEditCourse(null);
      setEditForm({ name: '', code: '', description: '', lecturer: '', faculty: '' });
      toast.success('Course updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setEditSaving(false); }
  };

  const handleToggleStatus = async (id, currentCourse) => {
    try {
      const { data } = await toggleCourseStatus(id);
      setCourses(courses.map(c => c._id === id ? data : c));
      toast.success(`Course ${data.isActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
      console.error('Toggle status error:', err);
      toast.error(err.response?.data?.message || 'Failed to update course status');
    }
  };

  const handleEnroll = async () => {
    if (!enrollStudentId) return;
    setEnrolling(true);
    try {
      const { data } = await enrollStudentInCourse(viewCourse._id, enrollStudentId);
      setCourses(cs => cs.map(c => c._id === data._id ? data : c));
      setViewCourse(data);
      setEnrollStudentId('');
      toast.success('Student enrolled successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async (studentId) => {
    if (!window.confirm('Remove this student from the course?')) return;
    try {
      const { data } = await unenrollStudentFromCourse(viewCourse._id, studentId);
      setCourses(cs => cs.map(c => c._id === data._id ? data : c));
      setViewCourse(data);
      toast.success('Student removed from course');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove student');
    }
  };

  const totalStudents = courses.reduce((sum, c) => sum + (c.students?.length || 0), 0);
  const activeCourses = courses.filter(c => c.isActive).length;
  const avgStudents = courses.length > 0 ? Math.round(totalStudents / courses.length) : 0;
  const facultyCount = facultyDepts.length;
  const departmentCount = facultyDepts.flatMap(f => f.depts).length;

  if (loading) return <AdminLayout pageTitle="Courses"><div className="al-loading">Loading...</div></AdminLayout>;

  return (
    <AdminLayout pageTitle="Courses">
      <div className="ap-header">
        <div>
          <h1>Course Management</h1>
          <p>Manage academic courses and enrollments</p>
        </div>
        <button className="ap-btn-purple" onClick={() => setShowForm(!showForm)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create course
        </button>
      </div>

      {/* Faculties/Departments summary */}
      <div className="ap-card" style={{ marginBottom: 20, padding: '15px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e1b4b' }}>Faculties & Departments</h3>
          <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 14 }}>{facultyCount} faculties, {departmentCount} departments</p>
        </div>
        <button
          className="ap-btn-purple"
          onClick={() => setShowFacultyManagement(prev => !prev)}
          style={{ height: 34, padding: '0 12px', fontSize: 13 }}
        >
          {showFacultyManagement ? 'Hide' : 'Manage'}
        </button>
      </div>

      {/* Stats */}
      <div className="ap-stats">
        {[
          { label: 'Total Courses',         value: courses.length, icon: '📚' },
          { label: 'Active Courses',         value: activeCourses,  icon: '✅' },
          { label: 'Total Students',         value: totalStudents,  icon: '🎓' },
          { label: 'Average students/course',value: avgStudents,    icon: '📊' },
        ].map((s, i) => (
          <div key={i} className="ap-stat-card">
            <div className="ap-stat-label">{s.label}</div>
            <div className="ap-stat-num">{s.value}</div>
            <div className="ap-stat-icon"><span style={{ fontSize: 16 }}>{s.icon}</span></div>
          </div>
        ))}
      </div>

      {/* Faculty/Department Management panel (moved from user module) */}
      {showFacultyManagement && (
        <div className="ap-card" style={{ marginBottom: 20 }}>
          <div className="um-toolbar" style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Faculties & Departments</h2>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>
              {facultyDepts.length} faculties, {departmentCount} departments
            </span>
            <button
              onClick={() => setShowFacultyManagement(false)}
              style={{ marginLeft: 'auto', padding: '7px 12px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>

          <div style={{ marginTop: 14, padding: '14px', background: '#f9fafb', borderRadius: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'center' }}>
              <input
                placeholder="Add new Faculty (e.g. Faculty of Computing)"
                value={newFacultyName}
                onChange={e => setNewFacultyName(e.target.value)}
                style={{ padding: '9px 12px', border: '1px solid #dbe2ff', borderRadius: 8 }}
              />
              <input
                placeholder="Department Name"
                value={newDeptName}
                onChange={e => setNewDeptName(e.target.value)}
                style={{ padding: '9px 12px', border: '1px solid #dbe2ff', borderRadius: 8 }}
              />
              <input
                placeholder="Prefix (e.g. CS)"
                value={newDeptPrefix}
                onChange={e => setNewDeptPrefix(e.target.value.toUpperCase())}
                style={{ padding: '9px 12px', border: '1px solid #dbe2ff', borderRadius: 8, textTransform: 'uppercase' }}
                maxLength={6}
              />
              <button
                className="ap-btn-purple"
                onClick={handleAddFacultyDept}
                disabled={addingFaculty || !newFacultyName.trim() || !newDeptName.trim() || !newDeptPrefix.trim()}
                style={{ height: 38 }}
              >
                {addingFaculty ? 'Creating…' : '+ Add Faculty + Department'}
              </button>
            </div>
          </div>

          {facultyDepts.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#9ca3af' }}>
              No faculty entries yet. Add using the fields above.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
              {facultyDepts.map(faculty => (
                <div key={faculty._id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f3f4ff' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{faculty.faculty}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{faculty.depts.length} department{faculty.depts.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => toggleDeptForm(faculty._id)}
                        style={{ border: '1px solid #e5e7eb', borderRadius: 6, color: '#4f46e5', padding: '6px 11px', background: 'white', cursor: 'pointer' }}
                      >
                        {deptForms[faculty._id]?.open ? 'Cancel' : '+ Add Dept'}
                      </button>
                      <button
                        onClick={() => handleDeleteFaculty(faculty)}
                        style={{ border: 'none', borderRadius: 6, color: '#ef4444', background: '#fee2e2', padding: '6px 10px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {deptForms[faculty._id]?.open && (
                    <div style={{ padding: '12px 16px', background: '#f8faff', borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10 }}>
                        <input
                          placeholder="Department Name"
                          value={deptForms[faculty._id]?.name || ''}
                          onChange={e => handleDeptChange(faculty._id, 'name', e.target.value)}
                          style={{ padding: '8px 11px', border: '1px solid #dbdef3', borderRadius: 7 }}
                        />
                        <input
                          placeholder="Prefix"
                          value={deptForms[faculty._id]?.prefix || ''}
                          onChange={e => handleDeptChange(faculty._id, 'prefix', e.target.value.toUpperCase())}
                          style={{ padding: '8px 11px', border: '1px solid #dbdef3', borderRadius: 7, textTransform: 'uppercase' }}
                        />
                        <button
                          className="ap-btn-purple"
                          onClick={() => handleAddDept(faculty)}
                          style={{ height: 36 }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '12px 16px' }}>
                    {faculty.depts.length ? faculty.depts.map(dept => (
                      <div key={dept._id} style={{ background: '#eef2ff', borderRadius: 7, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: '#4338ca', fontSize: 12 }}>{dept.prefix}</span>
                        <span style={{ fontSize: 12 }}>{dept.name}</span>
                        <button
                          onClick={() => handleRemoveDept(faculty, dept)}
                          style={{ border: 'none', background: 'transparent', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}
                          title="Remove department"
                        >x</button>
                      </div>
                    )) : <div style={{ color: '#9ca3af', fontSize: 12 }}>No departments yet</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="ap-card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1e1b4b' }}>Add New Course</h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Department *</label>
              <input required value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="e.g. Computer Science" style={{ color: form.department ? '#333' : '#999' }} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Faculty</label>
              <input value={form.faculty} onChange={e => setForm({ ...form, faculty: e.target.value })} placeholder="e.g. Faculty of Computing" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Course Name *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Web Development" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Course Code *</label>
              <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. CS301" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Lecturer <span style={{ color: '#9ca3af', fontSize: 11, fontWeight: 400 }}>(optional)</span></label>
              <select value={form.lecturer} onChange={e => setForm({ ...form, lecturer: e.target.value })} style={{ color: form.lecturer ? '#333' : '#999' }}>
                <option value="">— Assign later —</option>
                {lecturers.map(l => (
                  <option key={l._id} value={l._id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Description</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
            </div>
            <button type="submit" className="ap-btn-purple" disabled={saving} style={{ height: 40 }}>
              {saving ? 'Saving...' : 'Create'}
            </button>
          </form>

          {/* Add Faculty/Department Form — Hidden since fields now allow free text input */}
        </div>
      )}

      {/* Course cards grid */}
      {courses.length === 0 ? (
        <div className="ap-card" style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
          <p style={{ fontSize: 16 }}>No courses yet.</p>
          <button className="ap-btn-purple" style={{ margin: '12px auto 0' }} onClick={() => setShowForm(true)}>Create first course</button>
        </div>
      ) : (
        <div className="course-grid">
          {courses.map((c, i) => (
            <div key={c._id} className="course-card">
              <div className="course-card-top">
                <div>
                  <div className="course-code">{c.code}</div>
                  <h3 className="course-name">{c.name}</h3>
                </div>
                <button
                  className={`course-status-badge ${c.isActive ? 'course-active' : 'course-inactive'}`}
                  onClick={() => handleToggleStatus(c._id, c)}
                  title="Click to toggle course status"
                >
                  {c.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
              <div className="course-info-row">
                <span className="course-info-label">Department</span>
                <span className="course-info-val" style={{ color: '#7c3aed', fontWeight: 600 }}>{c.department || '—'}</span>
              </div>
              <div className="course-info-row">
                <span className="course-info-label">Faculty</span>
                <span className="course-info-val" style={{ color: '#0891b2' }}>{c.faculty || '—'}</span>
              </div>
              <div className="course-info-row">
                <span className="course-info-label">Lecturer</span>
                <span className="course-info-val">{c.lecturer ? `Mr/Mrs. ${c.lecturer.name}` : 'Unassigned'}</span>
              </div>
              <div className="course-info-row">
                <span className="course-info-label">Enrolled students</span>
                <span className="course-info-val">{c.students?.filter(s => typeof s === 'object' ? s.department === c.department : true).length || 0}</span>
              </div>
              {c.description && (
                <p className="course-desc">{c.description}</p>
              )}
              <div className="course-actions">
                <button className="course-btn course-btn-assign" onClick={() => navigate(`/admin/courses/${c._id}`)} title="View course details">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  View
                </button>
                <button className="course-btn course-btn-edit" onClick={() => handleEditClick(c)} title="Edit course details">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
                <button className="course-btn course-btn-del" onClick={() => handleDelete(c._id)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Course Modal */}
      {editCourse && (
        <div className="inv-overlay" onClick={() => setEditCourse(null)}>
          <div className="inv-modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="inv-modal-header" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
              <div>
                <h2 className="inv-modal-title">Edit Course</h2>
                <p className="inv-modal-user" style={{ opacity: 0.85 }}>
                  Update course information
                </p>
              </div>
              <button className="inv-close" onClick={() => setEditCourse(null)}>✕</button>
            </div>

            {/* Body */}
            <div className="inv-modal-body">
              <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label>Course Name *</label>
                  <input required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="e.g. Web Development" className="eu-input" />
                </div>
                <div className="form-group">
                  <label>Course Code *</label>
                  <input required value={editForm.code} onChange={e => setEditForm({ ...editForm, code: e.target.value })} placeholder="e.g. CS301" className="eu-input" />
                </div>
                <div className="form-group">
                  <label>Faculty</label>
                  <select value={editForm.faculty} onChange={e => setEditForm({ ...editForm, faculty: e.target.value })} className="eu-input">
                    <option value="">— None —</option>
                    {facultyDepts.map(f => (
                      <option key={f.faculty} value={f.faculty}>{f.faculty}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Lecturer <span style={{ color: '#9ca3af', fontSize: 11, fontWeight: 400 }}>(optional)</span></label>
                  <select value={editForm.lecturer} onChange={e => setEditForm({ ...editForm, lecturer: e.target.value })} style={{ color: editForm.lecturer ? '#333' : '#999' }} className="eu-input">
                    <option value="">— Unassigned —</option>
                    {lecturers.map(l => <option key={l._id} value={l._id}>{l.name} {editCourse?.department && l.department !== editCourse.department ? `(${l.department})` : ''}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder="Optional" className="eu-input" />
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button type="submit" className="ap-btn-purple" disabled={editSaving} style={{ flex: 1 }}>
                    {editSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" className="ap-btn-purple" onClick={() => setEditCourse(null)} style={{ flex: 1, background: '#6b7280' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Course Details Modal */}
      {viewCourse && (
        <div className="inv-overlay" onClick={() => setViewCourse(null)}>
          <div className="inv-modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="inv-modal-header" style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
              <div>
                <h2 className="inv-modal-title">{viewCourse.name}</h2>
                <p className="inv-modal-user" style={{ opacity: 0.85 }}>
                  {viewCourse.code} • {viewCourse.students?.length || 0} enrolled students
                </p>
              </div>
              <button className="inv-close" onClick={() => setViewCourse(null)}>✕</button>
            </div>

            {/* Body */}
            <div className="inv-modal-body">

              {/* Department & Faculty badges */}
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Department:</span>
                  <span style={{
                    background: '#ede9fe', color: '#7c3aed',
                    borderRadius: 20, padding: '3px 12px',
                    fontSize: 12, fontWeight: 700
                  }}>{viewCourse.department || '—'}</span>
                </div>
                {viewCourse.faculty && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Faculty:</span>
                    <span style={{
                      background: '#cffafe', color: '#0891b2',
                      borderRadius: 20, padding: '3px 12px',
                      fontSize: 12, fontWeight: 700
                    }}>{viewCourse.faculty}</span>
                  </div>
                )}
              </div>

              {/* Lecturer Details */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1e1b4b', marginBottom: 12 }}>Lecturer Information</h3>
                <div style={{ background: '#f9fafb', padding: 14, borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  {viewCourse.lecturer ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>Name</span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#1f2937' }}>{viewCourse.lecturer.name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>Email</span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#1f2937' }}>{viewCourse.lecturer.email}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>Department</span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#1f2937' }}>{viewCourse.lecturer.department || '—'}</span>
                      </div>
                    </>
                  ) : (
                    <span style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>No lecturer assigned</span>
                  )}
                </div>
              </div>

              {/* ── Enroll a Student ── */}
              {(() => {
                const enrolledIds = new Set((viewCourse.students || []).map(s => typeof s === 'object' ? s._id : s));
                const prefix = getDeptPrefix(viewCourse.department);
                // Eligible: same dept + matching prefix (if set) + not already enrolled
                const eligible = allStudents.filter(s =>
                  s.department === viewCourse.department &&
                  !enrolledIds.has(s._id) &&
                  (!prefix || !s.studentId || s.studentId.toUpperCase().startsWith(prefix))
                );
                return (
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1e1b4b', marginBottom: 10 }}>
                      Enroll Student
                      {prefix && (
                        <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af', marginLeft: 8 }}>
                          {viewCourse.department} · ID starts with <strong>{prefix}</strong>
                        </span>
                      )}
                    </h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select
                        value={enrollStudentId}
                        onChange={e => setEnrollStudentId(e.target.value)}
                        style={{
                          flex: 1, padding: '8px 12px', borderRadius: 8,
                          border: '1.5px solid #e5e7eb', fontSize: 13, color: '#374151'
                        }}
                      >
                        <option value="">— Select student to enroll —</option>
                        {eligible.map(s => (
                          <option key={s._id} value={s._id}>
                            {s.name}{s.studentId ? ` (${s.studentId})` : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleEnroll}
                        disabled={!enrollStudentId || enrolling}
                        style={{
                          padding: '8px 18px', borderRadius: 8, border: 'none',
                          background: enrollStudentId ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : '#e5e7eb',
                          color: enrollStudentId ? '#fff' : '#9ca3af',
                          fontWeight: 700, fontSize: 13,
                          cursor: enrollStudentId ? 'pointer' : 'default',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {enrolling ? 'Enrolling…' : '+ Enroll'}
                      </button>
                    </div>
                    {eligible.length === 0 && (
                      <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
                        No eligible students — all matching students are already enrolled or none exist for this department.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* ── Enrolled Students ── */}
              {(() => {
                const deptStudents = (viewCourse.students || []).filter(s =>
                  typeof s === 'object' ? s.department === viewCourse.department : true
                );
                return (
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1e1b4b', marginBottom: 10 }}>
                      Enrolled Students ({deptStudents.length})
                    </h3>
                    {deptStudents.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                        {deptStudents.map((student, idx) => (
                          <div key={idx} style={{
                            background: '#f9fafb', padding: '10px 12px',
                            borderRadius: 8, border: '1px solid #e5e7eb',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8
                          }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }}>{student.name}</div>
                              <div style={{ fontSize: 11, color: '#6b7280' }}>{student.email}</div>
                            </div>
                            {student.studentId && (
                              <span style={{
                                fontSize: 11, background: '#ede9fe', color: '#7c3aed',
                                padding: '3px 8px', borderRadius: 4, fontWeight: 600, flexShrink: 0
                              }}>{student.studentId}</span>
                            )}
                            <button
                              onClick={() => handleUnenroll(student._id)}
                              title="Remove from course"
                              style={{
                                border: 'none', background: '#fee2e2', color: '#dc2626',
                                borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
                                fontSize: 12, fontWeight: 700, flexShrink: 0
                              }}
                            >✕</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{
                        background: '#f9fafb', padding: 14, borderRadius: 8,
                        border: '1px solid #e5e7eb', textAlign: 'center',
                        color: '#9ca3af', fontSize: 13
                      }}>
                        No students enrolled yet
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Close Button */}
              <div style={{ marginTop: 24 }}>
                <button
                  onClick={() => setViewCourse(null)}
                  className="inv-action-btn"
                  style={{ background: '#f3f4f6', color: '#374151', border: 'none', width: '100%' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
