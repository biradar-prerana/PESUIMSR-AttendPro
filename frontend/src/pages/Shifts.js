import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const EMPTY_SHIFT_FORM = {
  name: '', code: '', startTime: '09:00', endTime: '18:00',
  gracePeriod: 15, workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
};

const EMPTY_MANUAL_FORM = { employeeIds: [], shiftId: '', effectiveFrom: '', notes: '' };
const EMPTY_AUTO_FORM = { departmentId: '', shiftId: '', effectiveFrom: '', notes: '' };

export default function Shifts() {
  const [tab, setTab] = useState('manage');
  const { confirm, dialog } = useConfirm();

  // --- Shift management state ---
  const [shifts, setShifts] = useState([]);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editShift, setEditShift] = useState(null);
  const [shiftForm, setShiftForm] = useState(EMPTY_SHIFT_FORM);

  // --- Assignment state ---
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [manualForm, setManualForm] = useState(EMPTY_MANUAL_FORM);
  const [autoForm, setAutoForm] = useState(EMPTY_AUTO_FORM);
  const [assignLoading, setAssignLoading] = useState(false);
  const [filterDept, setFilterDept] = useState('');

  const fetchShifts = useCallback(() => api.get('/shifts').then(r => setShifts(r.data)), []);
  const fetchAssignments = useCallback(() =>
    api.get('/shift-assignments').then(r => setAssignments(r.data)), []);

  useEffect(() => { fetchShifts(); }, [fetchShifts]);
  useEffect(() => {
    if (tab === 'assign') {
      Promise.all([
        api.get('/employees').then(r => setEmployees(r.data)),
        api.get('/departments').then(r => setDepartments(r.data)),
        fetchAssignments()
      ]);
    }
  }, [tab, fetchAssignments]);

  // ── Shift CRUD ────────────────────────────────────────────────────────────────
  const openShiftModal = (s) => {
    setEditShift(s || null);
    setShiftForm(s ? { ...s } : EMPTY_SHIFT_FORM);
    setShowShiftModal(true);
  };

  const toggleDay = (day) =>
    setShiftForm(p => ({
      ...p,
      workingDays: p.workingDays.includes(day)
        ? p.workingDays.filter(d => d !== day)
        : [...p.workingDays, day]
    }));

  const handleShiftSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editShift) await api.put(`/shifts/${editShift._id}`, shiftForm);
      else await api.post('/shifts', shiftForm);
      toast.success(`Shift ${editShift ? 'updated' : 'created'}!`);
      setShowShiftModal(false);
      fetchShifts();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDeleteShift = async (s) => {
    const ok = await confirm('Delete this shift? This cannot be undone.', 'Delete Shift');
    if (ok) { await api.delete(`/shifts/${s._id}`); fetchShifts(); }
  };

  // ── Manual assign ─────────────────────────────────────────────────────────────
  const handleManualAssign = async (e) => {
    e.preventDefault();
    if (!manualForm.employeeIds.length) return toast.error('Select at least one employee');
    try {
      setAssignLoading(true);
      const res = await api.post('/shift-assignments/manual', manualForm);
      toast.success(res.data.message);
      setManualForm(EMPTY_MANUAL_FORM);
      fetchAssignments();
    } catch (err) { toast.error(err.response?.data?.message || 'Assignment failed'); }
    finally { setAssignLoading(false); }
  };

  const toggleEmployee = (id) =>
    setManualForm(p => ({
      ...p,
      employeeIds: p.employeeIds.includes(id)
        ? p.employeeIds.filter(e => e !== id)
        : [...p.employeeIds, id]
    }));

  // ── Auto assign ───────────────────────────────────────────────────────────────
  const handleAutoAssign = async (e) => {
    e.preventDefault();
    const ok = await confirm(
      autoForm.departmentId
        ? 'This will reassign the shift for all active employees in the selected department. Continue?'
        : 'This will reassign the shift for ALL active employees. Continue?',
      'Confirm Auto-Assign'
    );
    if (!ok) return;
    try {
      setAssignLoading(true);
      const res = await api.post('/shift-assignments/auto', autoForm);
      toast.success(res.data.message);
      setAutoForm(EMPTY_AUTO_FORM);
      fetchAssignments();
    } catch (err) { toast.error(err.response?.data?.message || 'Auto-assign failed'); }
    finally { setAssignLoading(false); }
  };

  // ── Remove assignment ─────────────────────────────────────────────────────────
  const handleRemoveAssignment = async (a) => {
    const ok = await confirm(
      `Remove shift assignment for ${a.employee?.firstName} ${a.employee?.lastName}? Their shift will be cleared.`,
      'Remove Assignment'
    );
    if (!ok) return;
    try {
      await api.delete(`/shift-assignments/${a._id}`);
      toast.success('Assignment removed');
      fetchAssignments();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  // ── Filtered assignments ──────────────────────────────────────────────────────
  const filteredAssignments = filterDept
    ? assignments.filter(a => a.employee?.department?._id === filterDept)
    : assignments;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Shift Management</div>
          <div className="page-subtitle">{shifts.length} shifts configured</div>
        </div>
        {tab === 'manage' && (
          <button className="btn btn-primary" onClick={() => openShiftModal(null)}>+ Add Shift</button>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid var(--gray-100)' }}>
        {[['manage', 'Shift Management'], ['assign', 'Assign Shifts']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '10px 24px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 14,
              color: tab === key ? 'var(--primary)' : 'var(--gray-400)',
              borderBottom: tab === key ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.2s'
            }}
          >{label}</button>
        ))}
      </div>

      {/* ── TAB 1: Shift Management ─────────────────────────────────────────────── */}
      {tab === 'manage' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {shifts.map(s => (
            <div key={s._id} className="card fade-in" style={{ borderLeft: '4px solid var(--accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>{s.name}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--accent)' }}>{s.code}</div>
                </div>
                <span className={`badge ${s.isActive ? 'badge-success' : 'badge-gray'}`}>
                  {s.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{s.startTime}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Start</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', color: 'var(--gray-300)', fontSize: 20 }}>→</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{s.endTime}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>End</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{s.gracePeriod}m</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Grace</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                {DAYS.map(d => (
                  <span key={d} className={`badge ${s.workingDays?.includes(d) ? 'badge-primary' : 'badge-gray'}`} style={{ fontSize: 11 }}>
                    {d.substring(0, 3)}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => openShiftModal(s)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteShift(s)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 2: Assign Shifts ────────────────────────────────────────────────── */}
      {tab === 'assign' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* Manual Assignment */}
          <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)', marginBottom: 4 }}>Manual Assignment</div>
            <div style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 16 }}>
              Assign a shift to specific employees. The shift continues daily until you change it.
            </div>
            <form onSubmit={handleManualAssign}>
              <div className="form-group">
                <label className="form-label">Select Shift *</label>
                <select className="form-input" value={manualForm.shiftId} onChange={e => setManualForm(p => ({ ...p, shiftId: e.target.value }))} required>
                  <option value="">-- Choose shift --</option>
                  {shifts.filter(s => s.isActive).map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.startTime} – {s.endTime})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Effective From *</label>
                <input type="date" className="form-input" min={today} value={manualForm.effectiveFrom}
                  onChange={e => setManualForm(p => ({ ...p, effectiveFrom: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Select Employees * ({manualForm.employeeIds.length} selected)</label>
                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 8 }}>
                  {employees.length === 0 && <div style={{ color: 'var(--gray-400)', fontSize: 13, padding: 8 }}>Loading employees...</div>}
                  {employees.map(emp => (
                    <label key={emp._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', cursor: 'pointer', borderRadius: 4, background: manualForm.employeeIds.includes(emp._id) ? 'var(--gray-50)' : 'transparent' }}>
                      <input type="checkbox" checked={manualForm.employeeIds.includes(emp._id)} onChange={() => toggleEmployee(emp._id)} />
                      <span style={{ fontSize: 13 }}>
                        <span style={{ fontWeight: 600 }}>{emp.firstName} {emp.lastName}</span>
                        <span style={{ color: 'var(--gray-400)', marginLeft: 6 }}>({emp.employeeId})</span>
                        <span style={{ color: 'var(--gray-400)', marginLeft: 6, fontSize: 11 }}>{emp.department?.name}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="form-input" placeholder="Optional notes..." value={manualForm.notes}
                  onChange={e => setManualForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={assignLoading}>
                {assignLoading ? 'Assigning...' : 'Assign Shift'}
              </button>
            </form>
          </div>

          {/* Auto Assignment */}
          <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent)', marginBottom: 4 }}>Auto Assignment</div>
            <div style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 16 }}>
              Automatically assign a shift to all employees in a department, or to every active employee at once.
            </div>
            <form onSubmit={handleAutoAssign}>
              <div className="form-group">
                <label className="form-label">Select Shift *</label>
                <select className="form-input" value={autoForm.shiftId} onChange={e => setAutoForm(p => ({ ...p, shiftId: e.target.value }))} required>
                  <option value="">-- Choose shift --</option>
                  {shifts.filter(s => s.isActive).map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.startTime} – {s.endTime})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Effective From *</label>
                <input type="date" className="form-input" min={today} value={autoForm.effectiveFrom}
                  onChange={e => setAutoForm(p => ({ ...p, effectiveFrom: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Department (leave blank for ALL employees)</label>
                <select className="form-input" value={autoForm.departmentId} onChange={e => setAutoForm(p => ({ ...p, departmentId: e.target.value }))}>
                  <option value="">-- All Departments --</option>
                  {departments.map(d => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="form-input" placeholder="Optional notes..." value={autoForm.notes}
                  onChange={e => setAutoForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--gray-600)' }}>
                This will close any existing shift assignments and set the new shift as the active assignment from the selected date — running continuously until changed.
              </div>
              <button type="submit" className="btn btn-accent" style={{ width: '100%', background: 'var(--accent)', color: 'white', border: 'none' }} disabled={assignLoading}>
                {assignLoading ? 'Assigning...' : 'Auto Assign Shift'}
              </button>
            </form>
          </div>

          {/* Current Assignments Table */}
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>Current Assignments</div>
                <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                  {filteredAssignments.length} active assignment{filteredAssignments.length !== 1 ? 's' : ''}
                  {' — '}shifts run continuously until admin changes them
                </div>
              </div>
              <select className="form-input" style={{ width: 200 }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                <option value="">All Departments</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            {filteredAssignments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>
                No active shift assignments. Use Manual or Auto Assignment above.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Shift</th>
                      <th>Timing</th>
                      <th>Effective From</th>
                      <th>Type</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.map(a => (
                      <tr key={a._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{a.employee?.firstName} {a.employee?.lastName}</div>
                          <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{a.employee?.employeeId}</div>
                        </td>
                        <td>{a.employee?.department?.name || '—'}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{a.shift?.name}</div>
                          <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--accent)' }}>{a.shift?.code}</div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                          {a.shift?.startTime} – {a.shift?.endTime}
                        </td>
                        <td>{a.effectiveFrom ? new Date(a.effectiveFrom).toLocaleDateString() : '—'}</td>
                        <td>
                          <span className={`badge ${a.assignmentType === 'automatic' ? 'badge-primary' : 'badge-success'}`} style={{ fontSize: 11 }}>
                            {a.assignmentType === 'automatic' ? 'Auto' : 'Manual'}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => handleRemoveAssignment(a)}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shift Modal */}
      {showShiftModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowShiftModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{editShift ? 'Edit Shift' : 'Add Shift'}</div>
              <button onClick={() => setShowShiftModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleShiftSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Shift Name *</label>
                    <input className="form-input" value={shiftForm.name} onChange={e => setShiftForm(p => ({ ...p, name: e.target.value }))} required placeholder="General Shift" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Code *</label>
                    <input className="form-input" value={shiftForm.code} onChange={e => setShiftForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} required placeholder="GEN" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Time *</label>
                    <input className="form-input" type="time" value={shiftForm.startTime} onChange={e => setShiftForm(p => ({ ...p, startTime: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time *</label>
                    <input className="form-input" type="time" value={shiftForm.endTime} onChange={e => setShiftForm(p => ({ ...p, endTime: e.target.value }))} required />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Grace Period (minutes)</label>
                    <input className="form-input" type="number" value={shiftForm.gracePeriod} onChange={e => setShiftForm(p => ({ ...p, gracePeriod: parseInt(e.target.value) }))} min={0} max={60} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Working Days</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {DAYS.map(d => (
                      <button key={d} type="button" onClick={() => toggleDay(d)} className="btn btn-sm"
                        style={{ background: shiftForm.workingDays.includes(d) ? 'var(--primary)' : 'var(--gray-100)', color: shiftForm.workingDays.includes(d) ? 'white' : 'var(--gray-600)' }}>
                        {d.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowShiftModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editShift ? 'Update' : 'Add Shift'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog dialog={dialog} />
    </div>
  );
}
