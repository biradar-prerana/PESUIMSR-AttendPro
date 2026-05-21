import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Doors() {
  const [doors, setDoors] = useState([]);
  const [devices, setDevices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ doorId: '', name: '', location: '', building: '', floor: '', type: 'Both', accessMode: 'Card', device: '', schedule: { alwaysOpen: false, openTime: '08:00', closeTime: '20:00' } });

  const fetch = () => Promise.all([api.get('/doors'), api.get('/devices')]).then(([d, dv]) => { setDoors(d.data); setDevices(dv.data); });
  useEffect(() => { fetch(); }, []);

  const open = (d) => {
    setEdit(d || null);
    setForm(d ? { ...d, device: d.device?._id || '' } : { doorId: '', name: '', location: '', building: '', floor: '', type: 'Both', accessMode: 'Card', device: '', schedule: { alwaysOpen: false, openTime: '08:00', closeTime: '20:00' } });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (edit) await api.put(`/doors/${edit._id}`, form);
      else await api.post('/doors', form);
      toast.success(`Door ${edit ? 'updated' : 'created'}!`);
      setShowModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const MODE_ICONS = { Card: '💳', PIN: '🔢', Fingerprint: '🖐️', Face: '👁️', 'Card+PIN': '💳🔢', 'Card+Fingerprint': '💳🖐️', 'Face+Card': '👁️💳' };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><div className="page-title">Door Management</div><div className="page-subtitle">{doors.length} doors configured</div></div>
        <button className="btn btn-primary" onClick={() => open(null)}>+ Add Door</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Door</th><th>Location</th><th>Type</th><th>Access Mode</th><th>Device</th><th>Schedule</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {doors.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>No doors configured</td></tr>
              ) : doors.map(d => (
                <tr key={d._id}>
                  <td><div style={{ fontWeight: 600 }}>{d.name}</div><div style={{ fontSize: 12, color: 'var(--gray-400)', fontFamily: 'monospace' }}>{d.doorId}</div></td>
                  <td style={{ fontSize: 13 }}>📍 {d.location}{d.building ? `, ${d.building}` : ''}{d.floor ? ` F${d.floor}` : ''}</td>
                  <td><span className="badge badge-info">{d.type}</span></td>
                  <td><span style={{ fontSize: 13 }}>{MODE_ICONS[d.accessMode] || ''} {d.accessMode}</span></td>
                  <td style={{ fontSize: 13 }}>{d.device ? <span className="badge badge-success">{d.device.name}</span> : <span className="badge badge-gray">No Device</span>}</td>
                  <td style={{ fontSize: 13 }}>{d.schedule?.alwaysOpen ? <span className="badge badge-warning">24/7 Open</span> : `${d.schedule?.openTime} - ${d.schedule?.closeTime}`}</td>
                  <td><span className={`badge ${d.isActive ? 'badge-success' : 'badge-danger'}`}>{d.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => open(d)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={async () => { if (window.confirm('Delete?')) { await api.delete(`/doors/${d._id}`); fetch(); } }}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{edit ? 'Edit Door' : 'Add Door'}</div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group"><label className="form-label">Door ID *</label><input className="form-input" value={form.doorId} onChange={e => setForm(p => ({ ...p, doorId: e.target.value }))} required placeholder="DOOR001" /></div>
                  <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
                  <div className="form-group"><label className="form-label">Location *</label><input className="form-input" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} required /></div>
                  <div className="form-group"><label className="form-label">Building</label><input className="form-input" value={form.building} onChange={e => setForm(p => ({ ...p, building: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Floor</label><input className="form-input" value={form.floor} onChange={e => setForm(p => ({ ...p, floor: e.target.value }))} placeholder="1, G, B1..." /></div>
                  <div className="form-group"><label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                      <option>Entry</option><option>Exit</option><option>Both</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Access Mode</label>
                    <select className="form-select" value={form.accessMode} onChange={e => setForm(p => ({ ...p, accessMode: e.target.value }))}>
                      {['Card','PIN','Fingerprint','Face','Card+PIN','Card+Fingerprint','Face+Card'].map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Linked Device</label>
                    <select className="form-select" value={form.device} onChange={e => setForm(p => ({ ...p, device: e.target.value }))}>
                      <option value="">None</option>
                      {devices.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Open Time</label><input className="form-input" type="time" value={form.schedule.openTime} onChange={e => setForm(p => ({ ...p, schedule: { ...p.schedule, openTime: e.target.value } }))} /></div>
                  <div className="form-group"><label className="form-label">Close Time</label><input className="form-input" type="time" value={form.schedule.closeTime} onChange={e => setForm(p => ({ ...p, schedule: { ...p.schedule, closeTime: e.target.value } }))} /></div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginTop: 4 }}>
                  <input type="checkbox" checked={form.schedule.alwaysOpen} onChange={e => setForm(p => ({ ...p, schedule: { ...p.schedule, alwaysOpen: e.target.checked } }))} />
                  Always Open (24/7)
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{edit ? 'Update' : 'Add Door'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
