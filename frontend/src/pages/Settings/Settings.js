import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import ConfirmDialog, { useConfirm } from '../../components/ConfirmDialog';

const GMAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY || '';

// ─── Geofence Tab ────────────────────────────────────────────────────────────
function GeofenceSettings() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GMAPS_KEY,
    libraries: ['places'],
  });

  const [zones, setZones] = useState([]);
  const [form, setForm] = useState({ name: '', lat: null, lng: null, radius: 200, address: '' });
  const [editId, setEditId] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 }); // India default
  const mapRef = useRef(null);
  const { confirm, dialog } = useConfirm();

  const fetchZones = useCallback(async () => {
    try { const r = await api.get('/geofence'); setZones(r.data); } catch {}
  }, []);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  // Try to centre on user's current location
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(p => {
      setMapCenter({ lat: p.coords.latitude, lng: p.coords.longitude });
    });
  }, []);

  const onMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setForm(f => ({ ...f, lat, lng }));
  }, []);

  const onMapLoad = useCallback((map) => { mapRef.current = map; }, []);

  const saveZone = async (e) => {
    e.preventDefault();
    if (!form.lat || !form.lng) return toast.error('Click on the map to set the zone centre');
    if (!form.name.trim()) return toast.error('Zone name is required');
    try {
      if (editId) {
        await api.put(`/geofence/${editId}`, form);
        toast.success('Zone updated');
      } else {
        await api.post('/geofence', form);
        toast.success('Zone created');
      }
      setForm({ name: '', lat: null, lng: null, radius: 200, address: '' });
      setEditId(null);
      fetchZones();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const toggleActive = async (zone) => {
    try {
      await api.put(`/geofence/${zone._id}`, { isActive: !zone.isActive });
      fetchZones();
    } catch { toast.error('Failed'); }
  };

  const deleteZone = async (id) => {
    const ok = await confirm('Delete this geofence zone? This cannot be undone.', 'Delete Zone');
    if (!ok) return;
    try { await api.delete(`/geofence/${id}`); toast.success('Deleted'); fetchZones(); }
    catch { toast.error('Failed'); }
  };

  const startEdit = (zone) => {
    setForm({ name: zone.name, lat: zone.lat, lng: zone.lng, radius: zone.radius, address: zone.address || '' });
    setEditId(zone._id);
    setMapCenter({ lat: zone.lat, lng: zone.lng });
    mapRef.current?.panTo({ lat: zone.lat, lng: zone.lng });
  };

  const cancelEdit = () => {
    setForm({ name: '', lat: null, lng: null, radius: 200, address: '' });
    setEditId(null);
  };

  if (!GMAPS_KEY) {
    return (
      <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>📍 Geofence Zones</div>
        <div style={{ background: '#fef2f2', borderRadius: 10, padding: '14px 16px', color: '#991b1b', fontSize: 13 }}>
          <strong>Google Maps API key not configured.</strong><br />
          Create a file <code>frontend/.env</code> and add:<br />
          <code style={{ display: 'block', marginTop: 6, background: '#fff', padding: '6px 10px', borderRadius: 6 }}>
            REACT_APP_GOOGLE_MAPS_KEY=your_api_key_here
          </code>
          Get a free key at <strong>console.cloud.google.com</strong> → Enable "Maps JavaScript API".
        </div>
      </div>
    );
  }

  if (loadError) return <div className="card" style={{ color: 'var(--danger)' }}>Failed to load Google Maps: {loadError.message}</div>;
  if (!isLoaded) return <div className="card" style={{ color: 'var(--gray-400)' }}>Loading Google Maps…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Map + Form */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>📍 {editId ? 'Edit Zone' : 'Add Attendance Zone'}</div>
        <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 14 }}>
          Click anywhere on the map to place the zone centre, then set the radius and name.
        </div>

        <GoogleMap
          mapContainerStyle={{ width: '100%', height: 380, borderRadius: 12, marginBottom: 16, border: '1.5px solid var(--gray-200)' }}
          center={mapCenter}
          zoom={15}
          onClick={onMapClick}
          onLoad={onMapLoad}
          options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
        >
          {form.lat && form.lng && (
            <>
              <Marker
                position={{ lat: form.lat, lng: form.lng }}
                draggable
                onDragEnd={(e) => setForm(f => ({ ...f, lat: e.latLng.lat(), lng: e.latLng.lng() }))}
              />
              <Circle
                center={{ lat: form.lat, lng: form.lng }}
                radius={Number(form.radius)}
                options={{ strokeColor: '#f58220', strokeOpacity: 0.9, strokeWeight: 2, fillColor: '#f58220', fillOpacity: 0.18 }}
              />
            </>
          )}
          {/* Existing zones */}
          {zones.filter(z => !editId || z._id !== editId).map(z => (
            <React.Fragment key={z._id}>
              <Marker
                position={{ lat: z.lat, lng: z.lng }}
                icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' }}
              />
              <Circle
                center={{ lat: z.lat, lng: z.lng }}
                radius={z.radius}
                options={{ strokeColor: z.isActive ? '#1d4ed8' : '#9ca3af', strokeOpacity: 0.7, strokeWeight: 1.5, fillColor: z.isActive ? '#3b82f6' : '#9ca3af', fillOpacity: 0.12 }}
              />
            </React.Fragment>
          ))}
        </GoogleMap>

        <form onSubmit={saveZone} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 10, alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Zone Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Head Office" required />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Radius: <strong>{form.radius} m</strong></label>
            <input type="range" min={50} max={5000} step={50} value={form.radius}
              onChange={e => setForm(f => ({ ...f, radius: Number(e.target.value) }))}
              style={{ width: '100%', accentColor: 'var(--accent)', marginTop: 6 }} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
            {editId ? '💾 Update' : '➕ Add Zone'}
          </button>
          {editId && (
            <button type="button" className="btn btn-outline" onClick={cancelEdit}>Cancel</button>
          )}
        </form>

        {form.lat && form.lng && (
          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 8 }}>
            📌 Centre: {form.lat.toFixed(6)}, {form.lng.toFixed(6)}
          </div>
        )}
      </div>

      {/* Zone list */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Configured Zones ({zones.length})</div>
        {zones.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--gray-300)', padding: 24 }}>No zones yet — add one above.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {zones.map(z => (
              <div key={z._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--gray-50)', borderRadius: 10, border: `1.5px solid ${z.isActive ? 'var(--success)' : 'var(--gray-200)'}` }}>
                <div style={{ fontSize: 22 }}>📍</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{z.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    Radius: {z.radius} m &nbsp;·&nbsp; {z.lat.toFixed(5)}, {z.lng.toFixed(5)}
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: z.isActive ? 'var(--success)' : 'var(--gray-400)' }}>
                  {z.isActive ? '🟢 Active' : '⚫ Inactive'}
                </div>
                <button className="btn btn-sm btn-outline" onClick={() => startEdit(z)}>✏️ Edit</button>
                <button className="btn btn-sm" onClick={() => toggleActive(z)}
                  style={{ background: z.isActive ? '#fef3c7' : '#d1fae5', color: z.isActive ? '#92400e' : '#065f46' }}>
                  {z.isActive ? 'Disable' : 'Enable'}
                </button>
                <button className="btn btn-sm" onClick={() => deleteZone(z._id)}
                  style={{ background: '#fee2e2', color: '#991b1b' }}>🗑️</button>
              </div>
            ))}
          </div>
        )}
        {zones.some(z => z.isActive) && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: '#eff6ff', borderRadius: 10, fontSize: 12, color: '#1e40af' }}>
            ℹ️ Employees <strong>must be within an active zone</strong> to mark attendance. If no zones are active, attendance is unrestricted.
          </div>
        )}
      </div>
      <ConfirmDialog dialog={dialog} />
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function Settings() {
  const [tab, setTab] = useState('account');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'operator' });
  const [empLogin, setEmpLogin] = useState({ employeeId: '', password: '' });

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Passwords do not match');
    try {
      await api.put('/auth/change-password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const createEmpLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/create-employee-login', empLogin);
      toast.success(`Login created! Email: ${res.data.email}`);
      setEmpLogin({ employeeId: '', password: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', newUser);
      toast.success('User created successfully!');
      setNewUser({ name: '', email: '', password: '', role: 'operator' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };


  return (
    <div className="fade-in">
      <div className="page-header"><div className="page-title">Settings</div></div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['account', '👤 Account'], ['users', '👥 Users'], ['emp-login', '🔑 Employee Login'], ['geofence', '📍 Geofence'], ['system', '⚙️ System'], ['about', 'ℹ️ About']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} className="btn btn-sm" style={{ background: tab === t ? 'var(--primary)' : 'var(--gray-100)', color: tab === t ? 'white' : 'var(--gray-600)' }}>{l}</button>
        ))}
      </div>

      {tab === 'account' && (
        <div className="card" style={{ maxWidth: 480 }}>
          <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 20, fontSize: 16 }}>Change Password</div>
          <form onSubmit={changePassword}>
            <div className="form-group"><label className="form-label">Current Password</label><input className="form-input" type="password" value={passwords.currentPassword} onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} required /></div>
            <div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} required /></div>
            <div className="form-group"><label className="form-label">Confirm Password</label><input className="form-input" type="password" value={passwords.confirmPassword} onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} required /></div>
            <button type="submit" className="btn btn-primary">Update Password</button>
          </form>
        </div>
      )}

      {tab === 'users' && (
        <div className="card" style={{ maxWidth: 500 }}>
          <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 20, fontSize: 16 }}>Create System User</div>
          <form onSubmit={createUser}>
            <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} required /></div>
            <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} required /></div>
            <div className="form-group"><label className="form-label">Password *</label><input className="form-input" type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} required /></div>
            <div className="form-group"><label className="form-label">Role</label>
              <select className="form-select" value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}>
                <option value="operator">Operator</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Create User</button>
          </form>
        </div>
      )}

      {tab === 'emp-login' && (
        <div className="card" style={{ maxWidth: 480 }}>
          <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 6, fontSize: 16 }}>🔑 Create Employee Login</div>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 20 }}>
            Creates a self-service portal login for an employee using their registered email. They can then mark attendance, apply for leave, and view their details.
          </div>
          <form onSubmit={createEmpLogin}>
            <div className="form-group">
              <label className="form-label">Employee ID *</label>
              <input className="form-input" value={empLogin.employeeId} onChange={e => setEmpLogin(p => ({ ...p, employeeId: e.target.value }))} required placeholder="EMP001" />
            </div>
            <div className="form-group">
              <label className="form-label">Set Password *</label>
              <input className="form-input" type="password" value={empLogin.password} onChange={e => setEmpLogin(p => ({ ...p, password: e.target.value }))} required placeholder="Min 6 characters" />
            </div>
            <div style={{ background: '#dbeafe', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#1e40af', marginBottom: 16 }}>
              ℹ️ The employee will log in using their registered email address and this password at <strong>localhost:3000</strong>
            </div>
            <button type="submit" className="btn btn-primary">🔑 Create Employee Login</button>
          </form>
        </div>
      )}

      {tab === 'geofence' && <GeofenceSettings />}

      {tab === 'system' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>🔌 API Configuration</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['Backend API', 'http://localhost:5000/api'], ['WebSocket', 'ws://localhost:5000'], ['Database', 'MongoDB (localhost:27017/cosec_web)']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--gray-50)', borderRadius: 8, fontSize: 13 }}>
                  <span style={{ fontWeight: 500 }}>{k}</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--gray-500)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'about' && (
        <div className="card" style={{ maxWidth: 500 }}>
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 32 }}>🔐</div>
            <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--primary)' }}>PESUIMSR AttendPro</div>
            <div style={{ fontSize: 14, color: 'var(--gray-500)', marginTop: 4 }}>PES University — Institute of Medical Sciences & Research</div>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
              {[['Version', 'v1.0.0'], ['Institution', 'PESUIMSR, Bangalore'], ['Tech Stack', 'MERN (MongoDB, Express, React, Node.js)'], ['Real-time', 'Socket.io'], ['Auth', 'JWT + bcryptjs'], ['Charts', 'Recharts'], ['Biometric', 'Face Recognition (face-api.js)'], ['Geofence', 'Google Maps + Haversine']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--gray-50)', borderRadius: 8, fontSize: 13 }}>
                  <span style={{ fontWeight: 500, color: 'var(--gray-600)' }}>{k}</span>
                  <span style={{ color: 'var(--gray-500)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
