import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

// ── WebAuthn verify (uses built-in fingerprint / Windows Hello) ───────────────
const verifyWithSystem = async (credentialIdBase64) => {
  if (!window.PublicKeyCredential) throw new Error('WebAuthn not supported');
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const allowCredentials = credentialIdBase64
    ? [{ id: Uint8Array.from(atob(credentialIdBase64), c => c.charCodeAt(0)), type: 'public-key' }]
    : [];
  await navigator.credentials.get({
    publicKey: { challenge, rpId: window.location.hostname, userVerification: 'required', allowCredentials, timeout: 60000 },
  });
};
// ─────────────────────────────────────────────────────────────────────────────

export default function AttendanceSimulator() {
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState({ employeeId: '', method: 'Face', type: 'checkin' });
  const [scanning, setScanning] = useState(false);
  const [fpScanning, setFpScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [events, setEvents] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [location, setLocation] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const webcamRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    api.get('/employees').then(r => setEmployees(r.data));
    socketRef.current = io('http://localhost:5000');
    socketRef.current.on('attendance_event', ev =>
      setEvents(p => [{ ...ev, time: new Date().toLocaleTimeString() }, ...p.slice(0, 9)])
    );

    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by browser.');
      setGeoLoading(false);
    } else {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGeoError(null);
          setGeoLoading(false);
        },
        (err) => {
          const msgs = { 1: 'Location permission denied. Please allow location in browser settings.', 2: 'Location unavailable.', 3: 'Location timed out.' };
          setGeoError(msgs[err.code] || 'Unable to get location.');
          setGeoLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
      return () => { navigator.geolocation.clearWatch(watchId); socketRef.current?.disconnect(); };
    }

    return () => socketRef.current?.disconnect();
  }, []);

  const selectedEmp = employees.find(e => e._id === selected.employeeId);

  // ── Fingerprint via WebAuthn ──────────────────────────────────────────────
  const handleFingerprint = async () => {
    if (!selected.employeeId) return toast.error('Select an employee first');
    if (!window.PublicKeyCredential) return toast.error('WebAuthn not supported in this browser');
    setFpScanning(true);
    setResult(null);
    try {
      await verifyWithSystem(selectedEmp?.biometric?.fingerprint || null);
      toast.success('Fingerprint verified!');
      await processEntry();
    } catch (err) {
      setFpScanning(false);
      if (err.name === 'NotAllowedError') toast.error('Fingerprint scan cancelled');
      else toast.error('Fingerprint failed: ' + err.message);
    }
  };

  // ── Face via Webcam ───────────────────────────────────────────────────────
  const handleFaceCapture = async () => {
    if (!webcamRef.current) return;
    setShowCamera(false);
    setScanning(true);
    await processEntry();
  };

  // ── Card / PIN / other ────────────────────────────────────────────────────
  const handleScan = () => {
    if (!selected.employeeId) return toast.error('Select an employee first');
    if (selected.method === 'Face') { setShowCamera(true); return; }
    if (selected.method === 'Fingerprint') { handleFingerprint(); return; }
    processEntry();
  };

  // ── Mark attendance on backend ────────────────────────────────────────────
  const processEntry = async () => {
    if (geoLoading) { toast.error('Still acquiring location, please wait…'); return; }
    if (!location) { toast.error('Location access is required. Please allow location in browser settings.'); return; }
    setScanning(true);
    setResult(null);
    try {
      const emp = employees.find(e => e._id === selected.employeeId);
      const res = await api.post('/attendance/mark', {
        employeeId: emp.employeeId,
        type: selected.type,
        method: selected.method,
        lat: location.lat,
        lng: location.lng,
      });
      setResult({ status: 'success', message: res.data.message, log: res.data.log });
    } catch (err) {
      setResult({ status: 'error', message: err.response?.data?.message || 'Failed' });
    } finally {
      setScanning(false);
      setFpScanning(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Attendance Simulator</div>
          <div className="page-subtitle">Uses your device camera & built-in fingerprint sensor</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 20 }}>
        {/* ── Terminal Panel ── */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 16, fontSize: 16 }}>🖐️ Biometric Terminal</div>

            {/* Employee */}
            <div className="form-group">
              <label className="form-label">Select Employee</label>
              <select className="form-select" value={selected.employeeId}
                onChange={e => { setSelected(p => ({ ...p, employeeId: e.target.value })); setResult(null); }}>
                <option value="">-- Select Employee --</option>
                {employees.map(e => (
                  <option key={e._id} value={e._id}>{e.firstName} {e.lastName} ({e.employeeId})</option>
                ))}
              </select>
            </div>

            {/* Action */}
            <div className="form-group">
              <label className="form-label">Action</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['checkin', '➡️ Check In'], ['checkout', '⬅️ Check Out']].map(([val, lbl]) => (
                  <button key={val} type="button" onClick={() => setSelected(p => ({ ...p, type: val }))} className="btn btn-sm"
                    style={{ background: selected.type === val ? 'var(--primary)' : 'var(--gray-100)', color: selected.type === val ? 'white' : 'var(--gray-600)', flex: 1 }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Method */}
            <div className="form-group">
              <label className="form-label">Authentication Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[['Face', '👁️ Face Camera'], ['Fingerprint', '🖐️ Fingerprint'], ['Card', '💳 Card'], ['PIN', '🔢 PIN']].map(([m, lbl]) => (
                  <button key={m} type="button" onClick={() => { setSelected(p => ({ ...p, method: m })); setResult(null); setShowCamera(false); }}
                    className="btn btn-sm"
                    style={{ background: selected.method === m ? 'var(--accent)' : 'var(--gray-100)', color: selected.method === m ? 'white' : 'var(--gray-600)' }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Location Status ── */}
            <div style={{ marginBottom: 12 }}>
              {geoLoading && (
                <div style={{ padding: '8px 12px', background: '#fef9c3', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
                  ⏳ Acquiring location…
                </div>
              )}
              {!geoLoading && geoError && (
                <div style={{ padding: '8px 12px', background: '#fee2e2', borderRadius: 8, fontSize: 12, color: '#991b1b' }}>
                  📵 {geoError}
                </div>
              )}
              {!geoLoading && location && (
                <div style={{ padding: '8px 12px', background: '#d1fae5', borderRadius: 8, fontSize: 12, color: '#065f46' }}>
                  📍 Location ready: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </div>
              )}
            </div>

            {/* ── Biometric UI ── */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>

              {/* Face → Webcam */}
              {selected.method === 'Face' && (
                showCamera ? (
                  <div>
                    <div style={{ position: 'relative', width: 240, height: 240 }}>
                      <Webcam
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        width={240} height={240}
                        videoConstraints={{ facingMode: 'user' }}
                        style={{ borderRadius: 12, border: '3px solid var(--accent)', display: 'block' }}
                      />
                      {/* face guide overlay */}
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <div style={{ width: 140, height: 170, border: '2px dashed rgba(245,130,32,.7)', borderRadius: '50%' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={handleFaceCapture}>
                        📷 Authenticate
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => setShowCamera(false)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className={`biometric-scanner ${scanning ? 'scanning' : ''}`} onClick={handleScan} style={{ width: 190, height: 150 }}>
                    {scanning && <div className="scan-line" />}
                    <div style={{ fontSize: 42 }}>👁️</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center', marginTop: 6 }}>
                      {scanning ? 'Verifying...' : 'Click to open camera'}
                    </div>
                  </div>
                )
              )}

              {/* Fingerprint → WebAuthn (Windows Hello / Touch ID) */}
              {selected.method === 'Fingerprint' && (
                <div style={{ textAlign: 'center' }}>
                  <div
                    className={`biometric-scanner ${fpScanning ? 'scanning' : ''}`}
                    onClick={!fpScanning ? handleScan : undefined}
                    style={{ width: 190, height: 150, margin: '0 auto', cursor: fpScanning ? 'wait' : 'pointer' }}
                  >
                    {fpScanning && <div className="scan-line" />}
                    <div style={{ fontSize: 42 }}>🖐️</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center', marginTop: 6 }}>
                      {fpScanning ? 'Waiting for sensor...' : 'Click → Windows Hello / Touch ID'}
                    </div>
                  </div>
                  {!window.PublicKeyCredential && (
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--danger)' }}>
                      ⚠️ WebAuthn not supported. Use Chrome/Edge.
                    </div>
                  )}
                </div>
              )}

              {/* Card */}
              {selected.method === 'Card' && (
                <div className="biometric-scanner" onClick={handleScan} style={{ width: 190, height: 150 }}>
                  <div style={{ fontSize: 42 }}>💳</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center', marginTop: 6 }}>Click to tap card</div>
                </div>
              )}

              {/* PIN */}
              {selected.method === 'PIN' && (
                <div style={{ textAlign: 'center' }}>
                  <input className="form-input" placeholder="Enter PIN" maxLength={6}
                    style={{ textAlign: 'center', letterSpacing: 6, fontSize: 22, width: 160, marginBottom: 8 }} />
                  <button className="btn btn-primary btn-sm" style={{ width: 160 }} onClick={handleScan}>✓ Verify PIN</button>
                </div>
              )}
            </div>

            {scanning && !showCamera && (
              <div className="pulse" style={{ textAlign: 'center', fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
                Processing...
              </div>
            )}
          </div>

          {/* Result card */}
          {result && (
            <div className="card fade-in" style={{ borderLeft: `4px solid ${result.status === 'error' ? 'var(--danger)' : 'var(--success)'}` }}>
              <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>
                {result.status === 'error' ? '❌' : '✅'}
              </div>
              <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 16, color: result.status === 'error' ? 'var(--danger)' : 'var(--success)' }}>
                {result.status === 'error' ? 'FAILED' : 'SUCCESS'}
              </div>
              {result.message && <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>{result.message}</div>}
              {result.log && (
                <div style={{ marginTop: 10, padding: '8px 14px', background: 'var(--gray-50)', borderRadius: 8, fontSize: 13 }}>
                  <div>Time: <strong>{result.log.checkIn ? new Date(result.log.checkIn).toLocaleTimeString() : new Date(result.log.checkOut).toLocaleTimeString()}</strong></div>
                  <div>Status: <strong>{result.log.status}</strong></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Events Panel ── */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span>Live Events</span>
            <span style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 400 }}>Real-time via WebSocket</span>
          </div>

          {/* Selected employee card */}
          {selectedEmp && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'var(--gray-50)', borderRadius: 12, marginBottom: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {selectedEmp.photo
                  ? <img src={`http://localhost:5000${selectedEmp.photo}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: 'white', fontWeight: 700, fontSize: 20 }}>{selectedEmp.firstName?.charAt(0)}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedEmp.firstName} {selectedEmp.lastName}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{selectedEmp.employeeId} | {selectedEmp.department?.name}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <span className={`badge ${selectedEmp.biometric?.fingerprint ? 'badge-success' : 'badge-gray'}`} style={{ fontSize: 11 }}>
                    🖐️ {selectedEmp.biometric?.fingerprint ? 'FP Enrolled' : 'FP Not Enrolled'}
                  </span>
                  <span className={`badge ${selectedEmp.biometric?.faceData ? 'badge-success' : 'badge-gray'}`} style={{ fontSize: 11 }}>
                    👁️ {selectedEmp.biometric?.faceData ? 'Face Enrolled' : 'Face Not Enrolled'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--gray-300)', fontSize: 14 }}>
                No events yet.<br />Use the terminal on the left to mark attendance.
              </div>
            ) : events.map((ev, i) => (
              <div key={i} className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 10 }}>
                <div style={{ fontSize: 22 }}>{ev.type === 'late' ? '⏰' : ev.type === 'checkout' ? '⬅️' : '✅'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.employee || 'Event'}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{ev.type} at {ev.time}</div>
                </div>
                <span className={`badge ${ev.type === 'late' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: 11, textTransform: 'capitalize' }}>{ev.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
