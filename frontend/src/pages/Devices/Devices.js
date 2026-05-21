import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import ConfirmDialog, { useConfirm } from '../../components/ConfirmDialog';

const STATUS_COLOR = { online: 'badge-success', offline: 'badge-danger', maintenance: 'badge-warning' };

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [doors, setDoors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const { confirm, dialog } = useConfirm();
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ deviceId: '', name: '', type: 'APTA', ipAddress: '', port: 4370, location: '', door: '', firmware: '1.0.0', serialNumber: '', capabilities: { fingerprint: true, face: true, card: true, pin: true } });

  const fetch = () => Promise.all([api.get('/devices'), api.get('/doors')]).then(([d, dr]) => { setDevices(d.data); setDoors(dr.data); });
  useEffect(() => { fetch(); }, []);

  const open = (d) => {
    setEdit(d || null);
    setForm(d ? { ...d, door: d.door?._id || '' } : { deviceId: '', name: '', type: 'APTA', ipAddress: '', port: 4370, location: '', door: '', firmware: '1.0.0', serialNumber: '', capabilities: { fingerprint: true, face: true, card: true, pin: true } });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (edit) await api.put(`/devices/${edit._id}`, form);
      else await api.post('/devices', form);
      toast.success(`Device ${edit ? 'updated' : 'registered'}!`);
      setShowModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const pingDevice = async (id) => {
    try { await api.post(`/devices/${id}/ping`); toast.success('Device is online'); fetch(); }
    catch { toast.error('Device not responding'); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><div className="page-title">Device Management</div><div className="page-subtitle">{devices.length} devices registered</div></div>
        <button className="btn btn-primary" onClick={() => open(null)}>+ Register Device</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {devices.map(d => (
          <div key={d._id} className="card fade-in" style={{ borderTop: `4px solid ${d.status === 'online' ? 'var(--success)' : d.status === 'offline' ? 'var(--danger)' : 'var(--warning)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: 32 }}>📡</div>
              <span className={`badge ${STATUS_COLOR[d.status]}`}>{d.status}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--primary)', marginBottom: 4 }}>{d.name}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)', fontFamily: 'monospace', marginBottom: 8 }}>{d.deviceId}</div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>📍 {d.location}</div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 8 }}>🌐 {d.ipAddress}:{d.port}</div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
              {d.capabilities?.fingerprint && <span className="badge badge-primary" style={{ fontSize: 11 }}>🖐️</span>}
              {d.capabilities?.face && <span className="badge badge-primary" style={{ fontSize: 11 }}>👁️</span>}
              {d.capabilities?.card && <span className="badge badge-primary" style={{ fontSize: 11 }}>💳</span>}
              {d.capabilities?.pin && <span className="badge badge-primary" style={{ fontSize: 11 }}>🔢 PIN</span>}
            </div>
            {d.lastHeartbeat && <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 8 }}>Last seen: {new Date(d.lastHeartbeat).toLocaleTimeString()}</div>}
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-sm" style={{ background: 'var(--success)', color: 'white' }} onClick={() => pingDevice(d._id)}>Ping</button>
              <button className="btn btn-outline btn-sm" onClick={() => open(d)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={async () => { const ok = await confirm('Delete this device? This cannot be undone.', 'Delete Device'); if (ok) { await api.delete(`/devices/${d._id}`); fetch(); } }}>Remove</button>
            </div>
          </div>
        ))}
        {devices.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>No devices registered yet.</div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{edit ? 'Edit Device' : 'Register Device'}</div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group"><label className="form-label">Device ID *</label><input className="form-input" value={form.deviceId} onChange={e => setForm(p => ({ ...p, deviceId: e.target.value }))} required placeholder="DEV001" /></div>
                  <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Main Entrance Reader" /></div>
                  <div className="form-group"><label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                      {['APTA', 'COSEC_DOOR', 'BIOMETRIC', 'CARD_READER', 'FACE_READER'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">IP Address *</label><input className="form-input" value={form.ipAddress} onChange={e => setForm(p => ({ ...p, ipAddress: e.target.value }))} required placeholder="192.168.1.100" /></div>
                  <div className="form-group"><label className="form-label">Port</label><input className="form-input" type="number" value={form.port} onChange={e => setForm(p => ({ ...p, port: parseInt(e.target.value) }))} /></div>
                  <div className="form-group"><label className="form-label">Location *</label><input className="form-input" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} required placeholder="Main Gate" /></div>
                  <div className="form-group"><label className="form-label">Linked Door</label>
                    <select className="form-select" value={form.door} onChange={e => setForm(p => ({ ...p, door: e.target.value }))}>
                      <option value="">None</option>
                      {doors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Serial Number</label><input className="form-input" value={form.serialNumber} onChange={e => setForm(p => ({ ...p, serialNumber: e.target.value }))} /></div>
                </div>
                <div className="form-group">
                  <label className="form-label">Capabilities</label>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                    {[['fingerprint', '🖐️ Fingerprint'], ['face', '👁️ Face'], ['card', '💳 Card'], ['pin', '🔢 PIN']].map(([k, l]) => (
                      <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.capabilities[k]} onChange={e => setForm(p => ({ ...p, capabilities: { ...p.capabilities, [k]: e.target.checked } }))} />
                        {l}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{edit ? 'Update' : 'Register'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog dialog={dialog} />
    </div>
  );
}
