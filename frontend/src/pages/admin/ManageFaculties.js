import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getFaculties, createFaculty, deleteFaculty, addDepartment, removeDepartment } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import './Admin.css';

export default function ManageFaculties() {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [newFaculty, setNewFaculty] = useState('');
  const [addingFaculty, setAddingFaculty] = useState(false);
  const [deptForms, setDeptForms] = useState({}); // { facultyId: { name, prefix, open } }

  const load = async () => {
    try {
      const { data } = await getFaculties();
      setFaculties(data);
    } catch { toast.error('Failed to load faculties'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAddFaculty = async () => {
    if (!newFaculty.trim()) return;
    setAddingFaculty(true);
    try {
      const { data } = await createFaculty(newFaculty.trim());
      setFaculties(prev => [...prev, data]);
      setNewFaculty('');
      toast.success('Faculty created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setAddingFaculty(false); }
  };

  const handleDeleteFaculty = async (id, name) => {
    if (!window.confirm(`Delete faculty "${name}" and all its departments?`)) return;
    try {
      await deleteFaculty(id);
      setFaculties(prev => prev.filter(f => f._id !== id));
      toast.success('Faculty deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const toggleDeptForm = (fId) => {
    setDeptForms(prev => ({
      ...prev,
      [fId]: { name: '', prefix: '', open: !prev[fId]?.open }
    }));
  };

  const handleDeptChange = (fId, field, val) => {
    setDeptForms(prev => ({ ...prev, [fId]: { ...prev[fId], [field]: val } }));
  };

  const handleAddDept = async (fId) => {
    const form = deptForms[fId] || {};
    if (!form.name?.trim() || !form.prefix?.trim()) {
      toast.error('Both name and prefix are required');
      return;
    }
    try {
      const { data } = await addDepartment(fId, { name: form.name.trim(), prefix: form.prefix.trim() });
      setFaculties(prev => prev.map(f => f._id === fId ? data : f));
      setDeptForms(prev => ({ ...prev, [fId]: { name: '', prefix: '', open: false } }));
      toast.success('Department added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleRemoveDept = async (fId, dId, dName) => {
    if (!window.confirm(`Remove department "${dName}"?`)) return;
    try {
      const { data } = await removeDepartment(fId, dId);
      setFaculties(prev => prev.map(f => f._id === fId ? data : f));
      toast.success('Department removed');
    } catch { toast.error('Failed'); }
  };

  if (loading) return <AdminLayout pageTitle="Faculties & Departments"><div className="al-loading">Loading…</div></AdminLayout>;

  return (
    <AdminLayout pageTitle="Faculties & Departments">

      {/* Header */}
      <div className="ap-header">
        <div>
          <h1>Faculties &amp; Departments</h1>
          <p>Manage faculties and their departments. These are used across the system.</p>
        </div>
      </div>

      {/* Add Faculty */}
      <div className="ap-card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1e1b4b', marginBottom: 14 }}>Add New Faculty</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={newFaculty}
            onChange={e => setNewFaculty(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddFaculty()}
            placeholder="e.g. Faculty of Computing"
            style={{
              flex: 1, padding: '9px 14px', border: '1.5px solid #e5e7eb',
              borderRadius: 8, fontSize: 14, outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <button
            className="ap-btn-purple"
            onClick={handleAddFaculty}
            disabled={addingFaculty || !newFaculty.trim()}
          >
            {addingFaculty ? 'Adding…' : '+ Add Faculty'}
          </button>
        </div>
      </div>

      {/* Faculty list */}
      {faculties.length === 0 ? (
        <div className="ap-card" style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
          No faculties yet. Add one above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {faculties.map(faculty => (
            <div key={faculty._id} className="ap-card" style={{ padding: 0, overflow: 'hidden' }}>

              {/* Faculty header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{faculty.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                    {faculty.departments.length} department{faculty.departments.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => toggleDeptForm(faculty._id)}
                    style={{
                      background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
                      color: '#fff', borderRadius: 7, padding: '6px 14px',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    {deptForms[faculty._id]?.open ? 'Cancel' : '+ Add Department'}
                  </button>
                  <button
                    onClick={() => handleDeleteFaculty(faculty._id, faculty.name)}
                    style={{
                      background: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.4)',
                      color: '#fecaca', borderRadius: 7, padding: '6px 10px',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer'
                    }}
                    title="Delete faculty"
                  >✕</button>
                </div>
              </div>

              {/* Add department form */}
              {deptForms[faculty._id]?.open && (
                <div style={{ padding: '14px 20px', background: '#f5f3ff', borderBottom: '1px solid #ede9fe' }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input
                      value={deptForms[faculty._id]?.name || ''}
                      onChange={e => handleDeptChange(faculty._id, 'name', e.target.value)}
                      placeholder="Department name (e.g. Computer Science)"
                      style={{
                        flex: 2, minWidth: 180, padding: '8px 12px',
                        border: '1.5px solid #ddd6fe', borderRadius: 8,
                        fontSize: 13, outline: 'none', fontFamily: 'inherit'
                      }}
                    />
                    <input
                      value={deptForms[faculty._id]?.prefix || ''}
                      onChange={e => handleDeptChange(faculty._id, 'prefix', e.target.value.toUpperCase())}
                      placeholder="Prefix (e.g. CS)"
                      maxLength={6}
                      style={{
                        flex: 1, minWidth: 100, padding: '8px 12px',
                        border: '1.5px solid #ddd6fe', borderRadius: 8,
                        fontSize: 13, outline: 'none', fontFamily: 'inherit',
                        textTransform: 'uppercase'
                      }}
                    />
                    <button
                      className="ap-btn-purple"
                      style={{ flexShrink: 0, height: 38 }}
                      onClick={() => handleAddDept(faculty._id)}
                    >
                      Add
                    </button>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#7c3aed', marginTop: 6 }}>
                    The prefix is used for student ID validation (e.g. CS → CS24001)
                  </div>
                </div>
              )}

              {/* Departments list */}
              <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {faculty.departments.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#9ca3af', padding: '8px 0', fontStyle: 'italic' }}>
                    No departments yet. Add one above.
                  </div>
                ) : (
                  faculty.departments.map(dept => (
                    <div key={dept._id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: '#faf9ff', border: '1px solid #ede9fe',
                      borderRadius: 8, padding: '10px 14px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                          background: '#ede9fe', color: '#7c3aed',
                          fontWeight: 700, fontSize: 11, padding: '3px 9px',
                          borderRadius: 6, letterSpacing: 0.5
                        }}>{dept.prefix}</span>
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#1e1b4b' }}>{dept.name}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveDept(faculty._id, dept._id, dept.name)}
                        style={{
                          background: '#fee2e2', color: '#dc2626', border: 'none',
                          borderRadius: 6, padding: '4px 10px',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer'
                        }}
                        title="Remove department"
                      >✕</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
