import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

export default function Departments() {
  const [depts, setDepts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', isActive: true });
  const { confirm, dialog } = useConfirm();

  const fetch = () => api.get('/departments').then(r => setDepts(r.data));
  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setEdit(null); setForm({ name: '', code: '', description: '', isActive: true }); setShowModal(true); };
  const openEdit = (d) => { setEdit(d); setForm({ name: d.name, code: d.code, description: d.description || '', isActive: d.isActive }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (edit) await api.put(`/departments/${edit._id}`, form);
      else await api.post('/departments', form);
      toast.success(`Department ${edit ? 'updated' : 'created'}!`);
      setShowModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    const ok = await confirm('Delete this department? This cannot be undone.', 'Delete Department');
    if (!ok) return;
    try { await api.delete(`/departments/${id}`); toast.success('Deleted'); fetch(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><div className="page-title">Departments</div><div className="page-subtitle">{depts.length} departments</div></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Department</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {depts.map(d => (
          <div key={d._id} className="card fade-in" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>{d.name}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginTop: 2 }}>{d.code}</div>
              </div>
              <span className={`badge ${d.isActive ? 'badge-success' : 'badge-danger'}`}>{d.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            {d.description && <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 12 }}>{d.description}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-outline btn-sm" onClick={() => openEdit(d)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d._id)}>Delete</button>
            </div>
          </div>
        ))}
        {depts.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>No departments yet. Add your first department.</div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{edit ? 'Edit Department' : 'Add Department'}</div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Department Name *</label><input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
                <div className="form-group"><label className="form-label">Code *</label><input className="form-input" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} required placeholder="IT, HR, FIN..." /></div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{edit ? 'Update' : 'Add Department'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog dialog={dialog} />
    </div>
  );
}
