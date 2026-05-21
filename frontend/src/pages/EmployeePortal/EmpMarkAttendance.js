import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const MODEL_URL = '/models';
const MATCH_THRESHOLD = 0.55;

let modelsLoaded = false;

async function loadModels() {
  if (modelsLoaded) return;
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
}

async function getDescriptor(source) {
  const imgEl = typeof source === 'string' ? await faceapi.fetchImage(source) : source;
  const detection = await faceapi
    .detectSingleFace(imgEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
  return detection ? detection.descriptor : null;
}

const verifyWithWebAuthn = async (credId) => {
  if (!window.PublicKeyCredential) throw new Error('WebAuthn not supported');
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const allowCredentials = credId
    ? [{ id: Uint8Array.from(atob(credId), c => c.charCodeAt(0)), type: 'public-key' }]
    : [];
  await navigator.credentials.get({
    publicKey: { challenge, rpId: window.location.hostname, userVerification: 'required', allowCredentials, timeout: 60000 },
  });
};

// ── Geolocation hook ──────────────────────────────────────────────────────────
function useGeolocation() {
  const [location, setLocation] = useState(null);   // { lat, lng, accuracy }
  const [geoError, setGeoError] = useState(null);   // string
  const [geoLoading, setGeoLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setGeoLoading(false);
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) });
        setGeoError(null);
        setGeoLoading(false);
      },
      (err) => {
        const messages = {
          1: 'Location permission denied. Please allow location access in browser settings.',
          2: 'Location unavailable. Check your GPS or network.',
          3: 'Location request timed out. Please try again.',
        };
        setGeoError(messages[err.code] || 'Unable to get location.');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { location, geoError, geoLoading };
}

// ── Location status badge ─────────────────────────────────────────────────────
function LocationBadge({ location, geoError, geoLoading }) {
  if (geoLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#fef9c3', borderRadius: 10, fontSize: 13, color: '#92400e' }}>
      <span>⏳</span> Getting your location…
    </div>
  );
  if (geoError) return (
    <div style={{ padding: '10px 14px', background: '#fee2e2', borderRadius: 10, fontSize: 13, color: '#991b1b' }}>
      📵 {geoError}
    </div>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#d1fae5', borderRadius: 10, fontSize: 13, color: '#065f46' }}>
      <span>📍</span>
      <div>
        <span style={{ fontWeight: 600 }}>Location acquired</span>
        <span style={{ opacity: 0.7, marginLeft: 6 }}>±{location.accuracy} m accuracy</span>
        <div style={{ fontSize: 11, opacity: 0.6 }}>{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EmpMarkAttendance() {
  const [emp, setEmp] = useState(null);
  const [method, setMethod] = useState('Face');
  const [type, setType] = useState('checkin');
  const [showCamera, setShowCamera] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [faceStatus, setFaceStatus] = useState('');
  const [result, setResult] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [modelsReady, setModelsReady] = useState(false);
  const webcamRef = useRef(null);

  const { location, geoError, geoLoading } = useGeolocation();

  useEffect(() => {
    loadModels().then(() => setModelsReady(true)).catch(() => toast.error('Failed to load face recognition models'));
  }, []);

  useEffect(() => {
    const load = async () => {
      const me = await api.get('/auth/me');
      if (!me.data.employee) return;
      const empRes = await api.get(`/employees/${me.data.employee}`);
      setEmp(empRes.data);
      const today = new Date().toISOString().split('T')[0];
      const attRes = await api.get(`/attendance?employee=${me.data.employee}&startDate=${today}&endDate=${today}`);
      setTodayLog(attRes.data[0] || null);
    };
    load().catch(() => {});
  }, [result]);

  const markAttendance = useCallback(async () => {
    if (!emp) return toast.error('Employee profile not found');
    if (geoLoading) return toast.error('Still acquiring your location… please wait a moment and try again.');
    if (!location) return toast.error('Location access is required. Please allow location in your browser settings and try again.');
    setScanning(true); setResult(null);
    try {
      const payload = {
        employeeId: emp.employeeId,
        type,
        method,
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
      };
      const res = await api.post('/attendance/mark', payload);
      setResult({ status: 'success', message: res.data.message, log: res.data.log });
      toast.success(res.data.message);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed';
      setResult({ status: 'error', message: msg });
      toast.error(msg);
    } finally { setScanning(false); }
  }, [emp, type, method, location, geoLoading]);

  const handleFace = () => { setFaceStatus(''); setShowCamera(true); };

  const captureFace = useCallback(async () => {
    if (!webcamRef.current) return;
    if (!modelsReady) { toast.error('Face recognition models still loading, please wait…'); return; }
    if (!emp?.photo) { toast.error('No reference photo on file. Please contact HR.'); setFaceStatus('no_ref'); return; }

    setFaceStatus('verifying'); setScanning(true);
    try {
      const screenshot = webcamRef.current.getScreenshot();
      if (!screenshot) { toast.error('Could not capture image from camera'); setFaceStatus(''); setScanning(false); return; }

      const capturedImg = await faceapi.fetchImage(screenshot);
      const capturedDescriptor = await getDescriptor(capturedImg);
      if (!capturedDescriptor) { toast.error('No face detected. Look directly at the camera.'); setFaceStatus('no_face'); setScanning(false); return; }

      const refDescriptor = await getDescriptor(`http://localhost:5000${emp.photo}`);
      if (!refDescriptor) { toast.error('Cannot read profile photo face. Contact HR.'); setFaceStatus('no_ref'); setScanning(false); return; }

      const distance = faceapi.euclideanDistance(capturedDescriptor, refDescriptor);
      if (distance > MATCH_THRESHOLD) { toast.error(`Face does not match (score: ${distance.toFixed(2)})`); setFaceStatus('mismatch'); setScanning(false); return; }

      setFaceStatus('matched');
      toast.success('Face verified!');
      setShowCamera(false);
      await markAttendance();
    } catch (err) {
      toast.error('Face verification failed: ' + err.message);
      setFaceStatus(''); setScanning(false);
    }
  }, [webcamRef, modelsReady, emp, markAttendance]);

  const handleFingerprint = async () => {
    if (!window.PublicKeyCredential) return toast.error('WebAuthn not supported. Use Chrome/Edge.');
    setScanning(true);
    try {
      await verifyWithWebAuthn(emp?.biometric?.fingerprint || null);
      toast.success('Fingerprint verified!');
      await markAttendance();
    } catch (err) {
      setScanning(false);
      if (err.name === 'NotAllowedError') toast.error('Fingerprint cancelled');
      else toast.error(err.message);
    }
  };

  const handleScan = () => {
    if (method === 'Face')        { handleFace(); return; }
    if (method === 'Fingerprint') { handleFingerprint(); return; }
    markAttendance();
  };

  const alreadyIn  = !!todayLog?.checkIn;
  const alreadyOut = !!todayLog?.checkOut;
  const cannotMark = alreadyIn && alreadyOut;
  const locationNotReady = geoLoading || !location;

  const faceStatusLabel = {
    verifying: '🔍 Verifying face…',
    matched:   '✅ Face matched!',
    no_face:   '⚠️ No face detected — look at camera',
    mismatch:  '❌ Face does not match',
    no_ref:    '⚠️ No reference photo on file',
  }[faceStatus] || '';

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Mark Attendance</div>
          <div className="page-subtitle">Biometric + location verification required</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 20 }}>
        {/* Left panel */}
        <div className="card">
          {/* Employee info */}
          {emp && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'linear-gradient(135deg,var(--primary),var(--primary-light))', borderRadius: 12, marginBottom: 16, color: 'white' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22, fontWeight: 800 }}>
                {emp.photo ? <img src={`http://localhost:5000${emp.photo}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : emp.firstName?.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{emp.firstName} {emp.lastName}</div>
                <div style={{ fontSize: 12, opacity: .75 }}>{emp.employeeId} · {emp.department?.name}</div>
                <div style={{ fontSize: 12, opacity: .7, marginTop: 2 }}>Shift: {emp.shift?.name || 'N/A'} ({emp.shift?.startTime}–{emp.shift?.endTime})</div>
              </div>
            </div>
          )}

          {/* Location badge */}
          <div style={{ marginBottom: 16 }}>
            <LocationBadge location={location} geoError={geoError} geoLoading={geoLoading} />
          </div>

          {/* Today status */}
          {todayLog && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ padding: '10px 14px', background: '#d1fae5', borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: '#065f46', fontWeight: 600 }}>CHECK IN</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#047857' }}>{todayLog.checkIn ? new Date(todayLog.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
              </div>
              <div style={{ padding: '10px 14px', background: alreadyOut ? '#dbeafe' : 'var(--gray-100)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: alreadyOut ? '#1e40af' : 'var(--gray-400)', fontWeight: 600 }}>CHECK OUT</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: alreadyOut ? '#1d4ed8' : 'var(--gray-300)' }}>{todayLog.checkOut ? new Date(todayLog.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
              </div>
            </div>
          )}

          {/* Action type */}
          <div className="form-group">
            <label className="form-label">Action</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['checkin','➡️ Check In'], ['checkout','⬅️ Check Out']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setType(v)} className="btn btn-sm"
                  disabled={v === 'checkin' && alreadyIn || v === 'checkout' && (!alreadyIn || alreadyOut)}
                  style={{ flex: 1, background: type === v ? 'var(--primary)' : 'var(--gray-100)', color: type === v ? 'white' : 'var(--gray-600)', opacity: (v === 'checkin' && alreadyIn || v === 'checkout' && (!alreadyIn || alreadyOut)) ? .4 : 1 }}>
                  {l}
                </button>
              ))}
            </div>
            {alreadyIn && !alreadyOut && <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>✅ Checked in — tap Check Out when leaving</div>}
            {alreadyOut && <div style={{ fontSize: 12, color: 'var(--info)', marginTop: 4 }}>✅ Attendance complete for today</div>}
          </div>

          {/* Method */}
          <div className="form-group">
            <label className="form-label">Authentication Method</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[['Face','👁️ Face Camera'],['Fingerprint','🖐️ Fingerprint'],['Card','💳 Card'],['PIN','🔢 PIN']].map(([m, l]) => (
                <button key={m} type="button" onClick={() => setMethod(m)} className="btn btn-sm"
                  style={{ background: method === m ? 'var(--accent)' : 'var(--gray-100)', color: method === m ? 'white' : 'var(--gray-600)' }}>
                  {l}
                </button>
              ))}
            </div>
            {method === 'Face' && !modelsReady && <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>⏳ Loading face models…</div>}
            {method === 'Face' && modelsReady && !emp?.photo && <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>⚠️ No profile photo — face auth unavailable.</div>}
          </div>

          {/* Biometric scanner UI */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
            {method === 'Face' && (
              showCamera ? (
                <div>
                  <div style={{ position: 'relative', width: 240, height: 240 }}>
                    <Webcam ref={webcamRef} screenshotFormat="image/jpeg" width={240} height={240}
                      videoConstraints={{ facingMode: 'user' }}
                      style={{ borderRadius: 12, border: `3px solid ${faceStatus === 'mismatch' || faceStatus === 'no_face' ? 'var(--danger)' : faceStatus === 'matched' ? 'var(--success)' : 'var(--accent)'}`, display: 'block' }} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                      <div style={{ width: 140, height: 170, border: `2px dashed ${faceStatus === 'mismatch' ? 'rgba(220,38,38,.8)' : faceStatus === 'matched' ? 'rgba(16,185,129,.8)' : 'rgba(245,130,32,.7)'}`, borderRadius: '50%' }} />
                    </div>
                  </div>
                  {faceStatusLabel && (
                    <div style={{ textAlign: 'center', fontSize: 12, marginTop: 6, color: faceStatus === 'mismatch' || faceStatus === 'no_face' ? 'var(--danger)' : faceStatus === 'matched' ? 'var(--success)' : 'var(--gray-500)' }}>
                      {faceStatusLabel}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={captureFace} disabled={scanning || !modelsReady}>
                      {scanning ? 'Verifying…' : !modelsReady ? 'Loading…' : '📷 Authenticate'}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => { setShowCamera(false); setFaceStatus(''); }} disabled={scanning}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className={`biometric-scanner ${scanning ? 'scanning' : ''}`}
                  onClick={!scanning && !cannotMark && !locationNotReady ? handleScan : undefined}
                  style={{ width: 190, height: 150, cursor: scanning || cannotMark || locationNotReady ? 'not-allowed' : 'pointer' }}>
                  {scanning && <div className="scan-line" />}
                  <div style={{ fontSize: 42 }}>👁️</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center', marginTop: 6 }}>
                    {scanning ? 'Verifying...' : locationNotReady ? (geoLoading ? '⏳ Waiting for location…' : '📵 Location required') : 'Click to open camera'}
                  </div>
                </div>
              )
            )}
            {method === 'Fingerprint' && (
              <div className={`biometric-scanner ${scanning ? 'scanning' : ''}`}
                onClick={!scanning && !cannotMark && !locationNotReady ? handleScan : undefined}
                style={{ width: 190, height: 150, cursor: scanning || cannotMark || locationNotReady ? 'not-allowed' : 'pointer' }}>
                {scanning && <div className="scan-line" />}
                <div style={{ fontSize: 42 }}>🖐️</div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center', marginTop: 6 }}>
                  {scanning ? 'Verifying...' : locationNotReady ? (geoLoading ? '⏳ Waiting for location…' : '📵 Location required') : 'Click → Windows Hello'}
                </div>
              </div>
            )}
            {method === 'Card' && (
              <div className="biometric-scanner"
                onClick={!scanning && !cannotMark ? handleScan : undefined}
                style={{ width: 190, height: 150 }}>
                <div style={{ fontSize: 42 }}>💳</div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center', marginTop: 6 }}>Click to tap card</div>
              </div>
            )}
            {method === 'PIN' && (
              <div style={{ textAlign: 'center' }}>
                <input className="form-input" placeholder="Enter PIN" maxLength={6}
                  style={{ textAlign: 'center', letterSpacing: 6, fontSize: 22, width: 160, marginBottom: 8 }} />
                <button className="btn btn-primary btn-sm" style={{ width: 160 }} onClick={handleScan} disabled={scanning || cannotMark}>
                  {scanning ? 'Verifying...' : '✓ Verify PIN'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right panel — result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {result ? (
            <div className="card fade-in" style={{ borderLeft: `4px solid ${result.status === 'error' ? 'var(--danger)' : 'var(--success)'}`, textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>{result.status === 'error' ? '❌' : '✅'}</div>
              <div style={{ fontWeight: 800, fontSize: 22, color: result.status === 'error' ? 'var(--danger)' : 'var(--success)' }}>
                {result.status === 'error' ? 'Failed' : 'Success!'}
              </div>
              <div style={{ fontSize: 15, color: 'var(--gray-500)', marginTop: 8 }}>{result.message}</div>
              {result.log && (
                <div style={{ marginTop: 20, padding: '14px 20px', background: 'var(--gray-50)', borderRadius: 12, display: 'inline-block', textAlign: 'left' }}>
                  <div style={{ fontSize: 13 }}>Time: <strong>{new Date(result.log.checkIn || result.log.updatedAt).toLocaleTimeString('en-IN')}</strong></div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Status: <strong>{result.log.status}</strong></div>
                  {result.log.workingHours > 0 && <div style={{ fontSize: 13, marginTop: 4 }}>Hours worked: <strong>{result.log.workingHours}h</strong></div>}
                  {location && <div style={{ fontSize: 13, marginTop: 4 }}>Location: <strong>{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</strong></div>}
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--gray-300)' }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🖐️</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>Select a method and authenticate</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Your location will be verified automatically</div>
            </div>
          )}

          {/* Location info card */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📍 Location Status</div>
            {geoLoading && <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>⏳ Acquiring GPS signal…</div>}
            {geoError && (
              <div style={{ fontSize: 13, color: 'var(--danger)' }}>
                ❌ {geoError}
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--danger)' }}>
                  Location is required to mark attendance. Please allow location access in your browser settings and reload.
                </div>
              </div>
            )}
            {location && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--gray-500)' }}>Latitude</span>
                  <strong>{location.lat.toFixed(6)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--gray-500)' }}>Longitude</span>
                  <strong>{location.lng.toFixed(6)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--gray-500)' }}>Accuracy</span>
                  <strong>±{location.accuracy} m</strong>
                </div>
                <div style={{ marginTop: 6, padding: '8px 12px', background: '#d1fae5', borderRadius: 8, fontSize: 12, color: '#065f46' }}>
                  ✅ Location will be sent with attendance request. Admin geofence zones will be validated server-side.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
