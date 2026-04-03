import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  getCourseById, getAllUsers,
  assignCourseLecturer, removeCourseLecturer,
  enrollStudentInCourse, unenrollStudentFromCourse,
  getModulesByCourse, createModule, updateModule, deleteModule,
  assignModuleLecturer, removeModuleLecturer,
  enrollStudentInModule, unenrollStudentFromModule,
  getModuleQuizzes
} from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import './Admin.css';

/* ── small avatar initials ── */
function Av({ name, size = 32 }) {
  const colors = ['#7c3aed','#db2777','#0891b2','#059669','#d97706','#dc2626'];
  const bg = name ? colors[name.charCodeAt(0) % colors.length] : '#7c3aed';
  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0
    }}>{initials}</div>
  );
}

/* ── Module detail side-panel ── */
function ModulePanel({ mod, allLecturers, allStudents, courseDept, onUpdate, onClose }) {
  const [tab, setTab]         = useState('lecturers'); // lecturers | students | quizzes
  const [quizzes, setQuizzes] = useState([]);
  const [quizLoading, setQL]  = useState(false);
  const [selLec, setSelLec]   = useState('');
  const [selStu, setSelStu]   = useState('');

  useEffect(() => {
    if (tab === 'quizzes') {
      setQL(true);
      getModuleQuizzes(mod._id)
        .then(r => setQuizzes(r.data))
        .catch(() => setQuizzes([]))
        .finally(() => setQL(false));
    }
  }, [tab, mod._id]);

  const assignedLecIds = new Set(mod.lecturers.map(l => l._id));
  const assignedStuIds = new Set(mod.students.map(s => s._id));
  const eligibleLecs   = allLecturers.filter(l => !assignedLecIds.has(l._id));
  const eligibleStus   = allStudents.filter(s =>
    s.department === courseDept && !assignedStuIds.has(s._id)
  );

  const handleAssignLec = async () => {
    if (!selLec) return;
    try {
      const { data } = await assignModuleLecturer(mod._id, selLec);
      onUpdate(data); setSelLec('');
      toast.success('Lecturer assigned');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleRemoveLec = async (lecId) => {
    try { const { data } = await removeModuleLecturer(mod._id, lecId); onUpdate(data); }
    catch (err) { toast.error('Failed'); }
  };

  const handleEnrollStu = async () => {
    if (!selStu) return;
    try {
      const { data } = await enrollStudentInModule(mod._id, selStu);
      onUpdate(data); setSelStu('');
      toast.success('Student enrolled');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleRemoveStu = async (stuId) => {
    try { const { data } = await unenrollStudentFromModule(mod._id, stuId); onUpdate(data); }
    catch (err) { toast.error('Failed'); }
  };

  const tabStyle = (t) => ({
    padding: '8px 18px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
    background: tab === t ? '#7c3aed' : '#f3f4f6',
    color: tab === t ? '#fff' : '#374151',
    borderRadius: 8
  });

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 480,
      background: '#fff', boxShadow: '-4px 0 32px rgba(0,0,0,0.15)',
      display: 'flex', flexDirection: 'column', zIndex: 300, overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>MODULE</div>
            <h2 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 800, color: '#fff' }}>{mod.name}</h2>
            {mod.description && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{mod.description}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
          {[
            { label: 'Lecturers', value: mod.lecturers.length },
            { label: 'Students',  value: mod.students.length },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '16px 24px 0' }}>
        <button style={tabStyle('lecturers')} onClick={() => setTab('lecturers')}>Lecturers</button>
        <button style={tabStyle('students')}  onClick={() => setTab('students')}>Students</button>
        <button style={tabStyle('quizzes')}   onClick={() => setTab('quizzes')}>Quizzes</button>
      </div>

      <div style={{ padding: '16px 24px', flex: 1 }}>

        {/* ── Lecturers tab ── */}
        {tab === 'lecturers' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <select value={selLec} onChange={e => setSelLec(e.target.value)}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13 }}>
                <option value="">— Select lecturer —</option>
                {eligibleLecs.map(l => <option key={l._id} value={l._id}>{l.name} ({l.department})</option>)}
              </select>
              <button onClick={handleAssignLec} disabled={!selLec}
                style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: selLec ? '#7c3aed' : '#e5e7eb', color: selLec ? '#fff' : '#9ca3af', fontWeight: 700, cursor: selLec ? 'pointer' : 'default', fontSize: 13 }}>
                + Assign
              </button>
            </div>
            {mod.lecturers.length === 0
              ? <p style={{ color: '#9ca3af', fontSize: 13 }}>No lecturers assigned yet.</p>
              : mod.lecturers.map(l => (
                <div key={l._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f9fafb', borderRadius: 10, marginBottom: 8, border: '1px solid #e5e7eb' }}>
                  <Av name={l.name} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }}>{l.name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{l.email}</div>
                  </div>
                  <span style={{ fontSize: 11, background: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{l.department}</span>
                  <button onClick={() => handleRemoveLec(l._id)}
                    style={{ border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>✕</button>
                </div>
              ))
            }
          </>
        )}

        {/* ── Students tab ── */}
        {tab === 'students' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <select value={selStu} onChange={e => setSelStu(e.target.value)}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13 }}>
                <option value="">— Select student —</option>
                {eligibleStus.map(s => <option key={s._id} value={s._id}>{s.name}{s.studentId ? ` (${s.studentId})` : ''}</option>)}
              </select>
              <button onClick={handleEnrollStu} disabled={!selStu}
                style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: selStu ? '#7c3aed' : '#e5e7eb', color: selStu ? '#fff' : '#9ca3af', fontWeight: 700, cursor: selStu ? 'pointer' : 'default', fontSize: 13 }}>
                + Enroll
              </button>
            </div>
            {mod.students.length === 0
              ? <p style={{ color: '#9ca3af', fontSize: 13 }}>No students enrolled yet.</p>
              : mod.students.map(s => (
                <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f9fafb', borderRadius: 10, marginBottom: 8, border: '1px solid #e5e7eb' }}>
                  <Av name={s.name} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{s.email}</div>
                  </div>
                  {s.studentId && <span style={{ fontSize: 11, background: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{s.studentId}</span>}
                  <button onClick={() => handleRemoveStu(s._id)}
                    style={{ border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>✕</button>
                </div>
              ))
            }
          </>
        )}

        {/* ── Quizzes tab ── */}
        {tab === 'quizzes' && (
          quizLoading
            ? <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading quizzes…</p>
            : quizzes.length === 0
              ? <p style={{ color: '#9ca3af', fontSize: 13 }}>No quizzes found matching this module name.</p>
              : quizzes.map(q => (
                <div key={q._id} style={{ padding: '12px 14px', background: '#f9fafb', borderRadius: 10, marginBottom: 8, border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }}>{q.title}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{q.subject} · {q.totalMarks} marks</div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                      background: q.isPublished ? '#d1fae5' : '#fef3c7',
                      color: q.isPublished ? '#059669' : '#d97706'
                    }}>{q.isPublished ? 'Published' : 'Draft'}</span>
                  </div>
                </div>
              ))
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN CourseDetail page
══════════════════════════════════════════════════════════ */
export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse]     = useState(null);
  const [modules, setModules]   = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading]   = useState(true);

  // Module form
  const [showModForm, setShowModForm] = useState(false);
  const [modForm, setModForm]         = useState({ name: '', description: '' });
  const [modSaving, setModSaving]     = useState(false);
  const [editMod, setEditMod]         = useState(null);
  const [editModForm, setEditModForm] = useState({ name: '', description: '' });

  // Lecturer assign for course
  const [selCourseLec, setSelCourseLec] = useState('');

  // Student enroll for course
  const [selCourseStu, setSelCourseStu] = useState('');

  // Module panel
  const [activePanel, setActivePanel] = useState(null);

  useEffect(() => {
    Promise.all([
      getCourseById(id).then(r => setCourse(r.data)),
      getModulesByCourse(id).then(r => setModules(r.data)),
      getAllUsers().then(r => setAllUsers(r.data)),
    ]).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <AdminLayout pageTitle="Course Detail"><div className="al-loading">Loading…</div></AdminLayout>;
  if (!course) return <AdminLayout pageTitle="Course Detail"><p style={{ padding: 32, color: '#9ca3af' }}>Course not found.</p></AdminLayout>;

  const allLecturers = allUsers.filter(u => u.role === 'lecturer');
  const allStudents  = allUsers.filter(u => u.role === 'student');

  const assignedLecIds  = new Set([
    ...(course.lecturers || []).map(l => l._id),
    course.lecturer ? course.lecturer._id : null
  ].filter(Boolean));
  const eligibleLecs = allLecturers.filter(l => !assignedLecIds.has(l._id));

  const enrolledStuIds = new Set((course.students || []).map(s => s._id));
  const eligibleStus   = allStudents.filter(s => s.department === course.department && !enrolledStuIds.has(s._id));

  // All assigned lecturers (merge legacy + new array, dedupe)
  const courseLecturers = [
    ...(course.lecturers || []),
    ...(course.lecturer && !(course.lecturers || []).find(l => l._id === course.lecturer._id) ? [course.lecturer] : [])
  ];

  /* ── Module CRUD ── */
  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!modForm.name.trim()) return;
    setModSaving(true);
    try {
      const { data } = await createModule({ ...modForm, courseId: id });
      setModules(m => [...m, data]);
      setModForm({ name: '', description: '' });
      setShowModForm(false);
      toast.success('Module created');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setModSaving(false); }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await updateModule(editMod._id, editModForm);
      setModules(m => m.map(x => x._id === data._id ? data : x));
      if (activePanel?._id === data._id) setActivePanel(data);
      setEditMod(null);
      toast.success('Module updated');
    } catch (err) { toast.error('Failed'); }
  };

  const handleDeleteModule = async (modId) => {
    if (!window.confirm('Delete this module?')) return;
    try {
      await deleteModule(modId);
      setModules(m => m.filter(x => x._id !== modId));
      if (activePanel?._id === modId) setActivePanel(null);
      toast.success('Module deleted');
    } catch (err) { toast.error('Failed'); }
  };

  /* ── Course lecturer assign/remove ── */
  const handleAssignCourseLec = async () => {
    if (!selCourseLec) return;
    try {
      const { data } = await assignCourseLecturer(id, selCourseLec);
      setCourse(data); setSelCourseLec('');
      toast.success('Lecturer assigned to course');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleRemoveCourseLec = async (lecId) => {
    try { const { data } = await removeCourseLecturer(id, lecId); setCourse(data); }
    catch (err) { toast.error('Failed'); }
  };

  /* ── Course student enroll/unenroll ── */
  const handleEnrollStu = async () => {
    if (!selCourseStu) return;
    try {
      const { data } = await enrollStudentInCourse(id, selCourseStu);
      setCourse(data); setSelCourseStu('');
      toast.success('Student enrolled');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleUnenrollStu = async (stuId) => {
    if (!window.confirm('Remove student from course?')) return;
    try { const { data } = await unenrollStudentFromCourse(id, stuId); setCourse(data); }
    catch (err) { toast.error('Failed'); }
  };

  const deptStudents = (course.students || []).filter(s =>
    typeof s === 'object' ? s.department === course.department : true
  );

  return (
    <AdminLayout pageTitle={course.name}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Breadcrumb ── */}
        <div style={{ marginBottom: 20, fontSize: 13, color: '#6b7280' }}>
          <Link to="/admin/courses" style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>← Courses</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#1f2937', fontWeight: 600 }}>{course.name}</span>
        </div>

        {/* ── Course header ── */}
        <div style={{
          background: 'linear-gradient(135deg,#3b1d8a 0%,#6d28d9 50%,#7c3aed 100%)',
          borderRadius: 20, padding: '28px 32px', marginBottom: 28,
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(109,40,217,0.30)'
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
          <div style={{ position: 'absolute', bottom: -10, left: 60, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{course.code}</span>
                  <span style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{course.department}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: course.isActive ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)', color: course.isActive ? '#6ee7b7' : '#fca5a5' }}>
                    {course.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#fff' }}>{course.name}</h1>
                {course.description && <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{course.description}</p>}
              </div>
              {/* Stats */}
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { label: 'Modules',   value: modules.length },
                  { label: 'Lecturers', value: courseLecturers.length },
                  { label: 'Students',  value: deptStudents.length },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 18px', textAlign: 'center', minWidth: 70 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Modules section ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1e1b4b' }}>Modules</h2>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>Subjects included in this course</p>
            </div>
            <button onClick={() => setShowModForm(f => !f)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 3px 10px rgba(124,58,237,0.35)' }}>
              <span style={{ fontSize: 16 }}>+</span> Add Module
            </button>
          </div>

          {/* Add module form */}
          {showModForm && (
            <form onSubmit={handleCreateModule}
              style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ margin: 0, flex: '1 1 180px' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#4c1d95' }}>Module Name *</label>
                <input required value={modForm.name} onChange={e => setModForm({ ...modForm, name: e.target.value })} placeholder="e.g. Programming Frameworks" style={{ borderColor: '#ddd6fe' }} />
              </div>
              <div className="form-group" style={{ margin: 0, flex: '2 1 260px' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#4c1d95' }}>Description</label>
                <input value={modForm.description} onChange={e => setModForm({ ...modForm, description: e.target.value })} placeholder="Optional" style={{ borderColor: '#ddd6fe' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={modSaving}
                  style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  {modSaving ? 'Saving…' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowModForm(false)}
                  style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#e5e7eb', color: '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Module cards grid */}
          {modules.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px dashed #ddd6fe', padding: 40, textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
              <p style={{ fontSize: 14, margin: 0 }}>No modules yet. Add the first module above.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {modules.map((mod, idx) => {
                const colors = ['#7c3aed','#db2777','#0891b2','#059669','#d97706','#dc2626'];
                const accent = colors[idx % colors.length];
                const isEditing = editMod?._id === mod._id;
                return (
                  <div key={mod._id} style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ height: 5, background: accent }} />
                    <div style={{ padding: '16px 16px 12px' }}>
                      {isEditing ? (
                        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <input required value={editModForm.name} onChange={e => setEditModForm({ ...editModForm, name: e.target.value })}
                            style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #ddd6fe', fontSize: 13, fontWeight: 600 }} />
                          <input value={editModForm.description} onChange={e => setEditModForm({ ...editModForm, description: e.target.value })}
                            placeholder="Description" style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12 }} />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button type="submit" style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', background: accent, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Save</button>
                            <button type="button" onClick={() => setEditMod(null)} style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', background: '#e5e7eb', color: '#374151', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1f2937' }}>{mod.name}</h3>
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                              <button onClick={() => { setEditMod(mod); setEditModForm({ name: mod.name, description: mod.description }); }}
                                title="Edit"
                                style={{ border: 'none', background: '#f3f4f6', color: '#374151', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>✏️</button>
                              <button onClick={() => handleDeleteModule(mod._id)}
                                title="Delete"
                                style={{ border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>🗑</button>
                            </div>
                          </div>
                          {mod.description && <p style={{ margin: '0 0 10px', fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{mod.description}</p>}
                          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                            <span style={{ fontSize: 11, background: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                              👨‍🏫 {mod.lecturers.length} lecturer{mod.lecturers.length !== 1 ? 's' : ''}
                            </span>
                            <span style={{ fontSize: 11, background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                              🎓 {mod.students.length} student{mod.students.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {mod.lecturers.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                              {mod.lecturers.slice(0,4).map(l => (
                                <div key={l._id} title={l.name}><Av name={l.name} size={26} /></div>
                              ))}
                              {mod.lecturers.length > 4 && <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#6b7280' }}>+{mod.lecturers.length - 4}</div>}
                            </div>
                          )}
                          <button onClick={() => setActivePanel(activePanel?._id === mod._id ? null : mod)}
                            style={{ width: '100%', padding: '8px', borderRadius: 8, border: `1.5px solid ${accent}`, background: 'transparent', color: accent, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                            {activePanel?._id === mod._id ? 'Close Panel' : 'Manage Module →'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Two-column: Lecturers + Students ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>

          {/* Lecturers card */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#1e1b4b' }}>Lecturers</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <select value={selCourseLec} onChange={e => setSelCourseLec(e.target.value)}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13 }}>
                <option value="">— Assign lecturer —</option>
                {eligibleLecs.map(l => <option key={l._id} value={l._id}>{l.name} ({l.department})</option>)}
              </select>
              <button onClick={handleAssignCourseLec} disabled={!selCourseLec}
                style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: selCourseLec ? '#7c3aed' : '#e5e7eb', color: selCourseLec ? '#fff' : '#9ca3af', fontWeight: 700, cursor: selCourseLec ? 'pointer' : 'default', fontSize: 13 }}>
                + Add
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
              {courseLecturers.length === 0
                ? <p style={{ color: '#9ca3af', fontSize: 13 }}>No lecturers assigned.</p>
                : courseLecturers.map(l => (
                  <div key={l._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                    <Av name={l.name} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{l.department}</div>
                    </div>
                    <button onClick={() => handleRemoveCourseLec(l._id)}
                      style={{ border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✕</button>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Students card */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#1e1b4b' }}>
              Students
              <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af', marginLeft: 8 }}>{course.department} only</span>
            </h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <select value={selCourseStu} onChange={e => setSelCourseStu(e.target.value)}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13 }}>
                <option value="">— Enroll student —</option>
                {eligibleStus.map(s => <option key={s._id} value={s._id}>{s.name}{s.studentId ? ` (${s.studentId})` : ''}</option>)}
              </select>
              <button onClick={handleEnrollStu} disabled={!selCourseStu}
                style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: selCourseStu ? '#7c3aed' : '#e5e7eb', color: selCourseStu ? '#fff' : '#9ca3af', fontWeight: 700, cursor: selCourseStu ? 'pointer' : 'default', fontSize: 13 }}>
                + Add
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
              {deptStudents.length === 0
                ? <p style={{ color: '#9ca3af', fontSize: 13 }}>No students enrolled.</p>
                : deptStudents.map(s => (
                  <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                    <Av name={s.name} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{s.email}</div>
                    </div>
                    {s.studentId && <span style={{ fontSize: 11, background: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: 4, fontWeight: 600, flexShrink: 0 }}>{s.studentId}</span>}
                    <button onClick={() => handleUnenrollStu(s._id)}
                      style={{ border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✕</button>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>

      {/* ── Module side panel ── */}
      {activePanel && (
        <>
          <div onClick={() => setActivePanel(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 299 }} />
          <ModulePanel
            mod={modules.find(m => m._id === activePanel._id) || activePanel}
            allLecturers={allLecturers}
            allStudents={allStudents}
            courseDept={course.department}
            onUpdate={updated => {
              setModules(m => m.map(x => x._id === updated._id ? updated : x));
              setActivePanel(updated);
            }}
            onClose={() => setActivePanel(null)}
          />
        </>
      )}
    </AdminLayout>
  );
}
