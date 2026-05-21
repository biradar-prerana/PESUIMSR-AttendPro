import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function EmployeeModal({ emp, departments, onClose, onSaved }) {
  const [shifts, setShifts] = useState([]);
  const [doors, setDoors] = useState([]);
  const [form, setForm] = useState({
    employeeId: '', firstName: '', lastName: '', email: '', phone: '',
    department: '', shift: '', designation: '', joinDate: '', cardNumber: '',
    pin: '', address: '', gender: '', bloodGroup: '', isActive: true
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoId, setAutoId] = useState(!emp); // auto mode only for new employees
  const [idLoading, setIdLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/shifts'), api.get('/doors')]).then(([s, d]) => { setShifts(s.data); setDoors(d.data); });
    if (emp) {
      setForm({ ...emp, department: emp.department?._id || '', shift: emp.shift?._id || '', joinDate: emp.joinDate?.split('T')[0] || '' });
    }
  }, [emp]);

  const fetchNextId = async (departmentId) => {
    if (!departmentId) return;
    setIdLoading(true);
    try {
      const res = await api.get(`/employees/next-id/${departmentId}`);
      setForm(p => ({ ...p, employeeId: res.data.employeeId }));
    } catch {
      toast.error('Could not generate Employee ID');
    } finally {
      setIdLoading(false);
    }
  };

  const handleDepartmentChange = (val) => {
    setForm(p => ({ ...p, department: val }));
    if (autoId && val) fetchNextId(val);
  };

  const handleAutoToggle = () => {
    const next = !autoId;
    setAutoId(next);
    if (next && form.department) fetchNextId(form.department);
    else if (!next) setForm(p => ({ ...p, employeeId: '' }));
  };

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v); });
      if (photo) fd.append('photo', photo);
      if (emp) await api.put(`/employees/${emp._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await api.post('/employees', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Employee ${emp ? 'updated' : 'created'} successfully!`);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 700 }}>
        <div className="modal-header">
          <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--primary)' }}>{emp ? 'Edit Employee' : 'Add New Employee'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--gray-400)' }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="emp-form-grid">

              {/* Employee ID with Auto/Manual toggle */}
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>Employee ID *</label>
                  <button
                    type="button"
                    onClick={handleAutoToggle}
                    style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 12, cursor: 'pointer', border: 'none',
                      background: autoId ? 'var(--primary)' : 'var(--gray-200)',
                      color: autoId ? '#fff' : 'var(--gray-600)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {autoId ? 'AUTO' : 'MANUAL'}
                  </button>
                </div>
                <input
                  className="form-input"
                  value={idLoading ? 'Generating...' : form.employeeId}
                  onChange={e => !autoId && set('employeeId', e.target.value)}
                  readOnly={autoId}
                  required
                  placeholder={autoId ? 'Select a department to generate' : 'e.g. HR001'}
                  style={{ background: autoId ? 'var(--gray-100)' : '', color: autoId ? 'var(--gray-500)' : '', cursor: autoId ? 'not-allowed' : '' }}
                />
              </div>

              <div className="form-group"><label className="form-label">First Name *</label><input className="form-input" value={form.firstName} onChange={e => set('firstName', e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Last Name *</label><input className="form-input" value={form.lastName} onChange={e => set('lastName', e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Designation</label><input className="form-input" value={form.designation} onChange={e => set('designation', e.target.value)} /></div>

              {/* Department — triggers auto ID fetch */}
              <div className="form-group"><label className="form-label">Department *</label>
                <select className="form-select" value={form.department} onChange={e => handleDepartmentChange(e.target.value)} required>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
                </select>
              </div>

              <div className="form-group"><label className="form-label">Shift</label>
                <select className="form-select" value={form.shift} onChange={e => set('shift', e.target.value)}>
                  <option value="">Select Shift</option>
                  {shifts.map(s => <option key={s._id} value={s._id}>{s.name} ({s.startTime}-{s.endTime})</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Join Date *</label><input className="form-input" type="date" value={form.joinDate} onChange={e => set('joinDate', e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Card Number</label><input className="form-input" value={form.cardNumber} onChange={e => set('cardNumber', e.target.value)} placeholder="CARD001" /></div>
              <div className="form-group"><label className="form-label">PIN (4-6 digits)</label><input className="form-input" value={form.pin} onChange={e => set('pin', e.target.value)} maxLength={6} /></div>
              <div className="form-group"><label className="form-label">Gender</label>
                <select className="form-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="">Select</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Blood Group</label>
                <select className="form-select" value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}>
                  <option value="">Select</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg}>{bg}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Status</label>
                <select className="form-select" value={form.isActive} onChange={e => set('isActive', e.target.value === 'true')}>
                  <option value="true">Active</option><option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Address</label><textarea className="form-input" value={form.address} onChange={e => set('address', e.target.value)} rows={2} /></div>
            <div className="form-group">
              <label className="form-label">Photo</label>
              <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} style={{ fontSize: 13, color: 'var(--gray-600)' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : emp ? 'Update Employee' : 'Add Employee'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
