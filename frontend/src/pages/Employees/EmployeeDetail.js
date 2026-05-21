import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// ── WebAuthn helpers ──────────────────────────────────────────────────────────
const bufferToBase64 = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)));

const enrollFingerprint = async (emp) => {
  if (!window.PublicKeyCredential) throw new Error('WebAuthn not supported in this browser');

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId    = new TextEncoder().encode(emp._id);

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'PESUIMSR AttendPro', id: window.location.hostname },
      user: { id: userId, name: emp.email, displayName: `${emp.firstName} ${emp.lastName}` },
      pubKeyCredParams: [
        { alg: -7,   type: 'public-key' },   // ES256
        { alg: -257, type: 'public-key' },   // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',  // ← uses built-in sensor
        userVerification: 'required',
      },
      timeout: 60000,
    },
  });

  return bufferToBase64(credential.rawId); // store credential ID
};

const verifyFingerprint = async (credentialIdBase64) => {
  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const allowCredentials = credentialIdBase64
    ? [{ id: Uint8Array.from(atob(credentialIdBase64), c => c.charCodeAt(0)), type: 'public-key' }]
    : [];

  await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId: window.location.hostname,
      userVerification: 'required',
      allowCredentials,
      timeout: 60000,
    },
  });
};
// ─────────────────────────────────────────────────────────────────────────────

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [emp, setEmp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bioTab, setBioTab] = useState('fingerprint');
  const [fpState, setFpState] = useState('idle'); // idle | scanning | done | error
  const [fpCredId, setFpCredId] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedFace, setCapturedFace] = useState(null);
  const webcamRef = useRef(null);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get(`/employees/${id}`),
      api.get(`/attendance?employee=${id}`),
    ]).then(([e, a]) => {
      setEmp(e.data);
      setAttendance(a.data.slice(0, 10));
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, [id]);

  // ── Fingerprint enroll (WebAuthn) ─────────────────────────────────────────
  const handleFingerprintEnroll = async () => {
    if (fpState === 'scanning') return;
    setFpState('scanning');
    setFpCredId(null);
    try {
      const credId = await enrollFingerprint(emp);
      setFpCredId(credId);
      setFpState('done');
      toast.success('Fingerprint captured! Click "Enroll" to save.');
    } catch (err) {
      setFpState('error');
      if (err.name === 'NotAllowedError') toast.error('Fingerprint scan cancelled or timed out');
      else if (err.message === 'WebAuthn not supported in this browser') toast.error('Your browser does not support WebAuthn');
      else toast.error('Fingerprint capture failed: ' + err.message);
    }
  };

  // ── Face capture (Webcam) ─────────────────────────────────────────────────
  const captureFace = () => {
    const img = webcamRef.current?.getScreenshot();
    if (img) { setCapturedFace(img); setShowCamera(false); toast.success('Face captured!'); }
  };

  // ── Save biometric to DB ──────────────────────────────────────────────────
  const enrollBiometric = async () => {
    if (!fpCredId && !capturedFace) return toast.error('Capture biometric data first');
    try {
      await api.put(`/employees/${id}/biometric`, {
        fingerprint: fpCredId || emp.biometric?.fingerprint,
        faceData: capturedFace || emp.biometric?.faceData,
      });
      toast.success('Biometric enrolled successfully!');
      const res = await api.get(`/employees/${id}`);
      setEmp(res.data);
      setFpCredId(null); setFpState('idle'); setCapturedFace(null);
    } catch { toast.error('Enrollment failed'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>Loading...</div>;
  if (!emp) return <div style={{ textAlign: 'center', padding: 60 }}>Employee not found</div>;

  const webAuthnSupported = !!window.PublicKeyCredential;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/employees')}>← Back</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
        {/* Profile Card */}
        <div>
          <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ width: 90, height: 90, borderRadius: '50%', overflow: 'hidden', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              {emp.photo
                ? <img src={`http://localhost:5000${emp.photo}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: 'white', fontWeight: 700, fontSize: 32 }}>{emp.firstName?.charAt(0)}</span>}
            </div>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary)' }}>{emp.firstName} {emp.lastName}</div>
            <div style={{ color: 'var(--gray-500)', fontSize: 13, marginTop: 4 }}>{emp.designation || 'Employee'}</div>
            <div style={{ marginTop: 8 }}><span className={`badge ${emp.isActive ? 'badge-success' : 'badge-danger'}`}>{emp.isActive ? 'Active' : 'Inactive'}</span></div>
            <div style={{ marginTop: 16, padding: '12px 0', borderTop: '1px solid var(--gray-100)' }}>
              {[['ID', emp.employeeId], ['Dept', emp.department?.name], ['Shift', emp.shift?.name || '-'], ['Card', emp.cardNumber || '-']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                  <span style={{ color: 'var(--gray-400)' }}>{k}</span>
                  <span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Biometric Status */}
          <div className="card">
            <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 12 }}>Biometric Status</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--gray-50)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 20 }}>🖐️</span><span style={{ fontSize: 13 }}>Fingerprint</span></div>
                <span className={`badge ${emp.biometric?.fingerprint ? 'badge-success' : 'badge-gray'}`}>{emp.biometric?.fingerprint ? 'Enrolled' : 'Not Enrolled'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--gray-50)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 20 }}>👁️</span><span style={{ fontSize: 13 }}>Face Recognition</span></div>
                <span className={`badge ${emp.biometric?.faceData ? 'badge-success' : 'badge-gray'}`}>{emp.biometric?.faceData ? 'Enrolled' : 'Not Enrolled'}</span>
              </div>
              {emp.biometric?.enrolledAt && (
                <div style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center' }}>
                  Last enrolled: {new Date(emp.biometric.enrolledAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Biometric Enrollment */}
          <div className="card">
            <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 16, marginBottom: 16 }}>Biometric Enrollment</div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {['fingerprint', 'face'].map(tab => (
                <button key={tab} onClick={() => setBioTab(tab)} className="btn btn-sm"
                  style={{ background: bioTab === tab ? 'var(--primary)' : 'var(--gray-100)', color: bioTab === tab ? 'white' : 'var(--gray-600)', textTransform: 'capitalize' }}>
                  {tab === 'fingerprint' ? '🖐️ Fingerprint' : '👁️ Face Recognition'}
                </button>
              ))}
            </div>

            {/* ── Fingerprint Tab ── */}
            {bioTab === 'fingerprint' && (
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                {!webAuthnSupported ? (
                  <div style={{ padding: 20, background: '#fef3c7', borderRadius: 12, fontSize: 13, color: '#92400e' }}>
                    ⚠️ Your browser does not support WebAuthn. Please use Chrome / Edge on Windows with Windows Hello enabled.
                  </div>
                ) : (
                  <>
                    {/* Scanner button */}
                    <div
                      className={`biometric-scanner ${fpState === 'scanning' ? 'scanning' : ''}`}
                      onClick={handleFingerprintEnroll}
                      style={{ background: fpState === 'done' ? '#d1fae5' : fpState === 'error' ? '#fee2e2' : 'white', cursor: fpState === 'scanning' ? 'wait' : 'pointer' }}
                    >
                      {fpState === 'scanning' && <div className="scan-line" />}
                      <div style={{ fontSize: 48, marginBottom: 8 }}>🖐️</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-500)', textAlign: 'center', padding: '0 12px' }}>
                        {fpState === 'idle'    && 'Click → Windows Hello / Touch ID'}
                        {fpState === 'scanning'&& 'Waiting for fingerprint...'}
                        {fpState === 'done'    && '✅ Captured! Click to re-scan'}
                        {fpState === 'error'   && '❌ Failed. Click to retry'}
                      </div>
                      {fpState === 'scanning' && <div className="pulse" style={{ fontSize: 12, color: 'var(--accent)', marginTop: 8 }}>Place your finger on the sensor</div>}
                    </div>

                    {/* Result + enroll button */}
                    {fpState === 'done' && fpCredId && (
                      <div style={{ flex: 1 }}>
                        <div style={{ background: '#d1fae5', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#065f46', marginBottom: 6 }}>✅ Fingerprint Verified by System</div>
                          <div style={{ fontSize: 11, color: '#047857' }}>Credential ID stored securely</div>
                          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#6b7280', marginTop: 4, wordBreak: 'break-all' }}>{fpCredId.substring(0, 32)}…</div>
                        </div>
                        <button className="btn btn-primary" onClick={enrollBiometric}>💾 Enroll Fingerprint</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Face Tab ── */}
            {bioTab === 'face' && (
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {!showCamera && !capturedFace && (
                  <div className="biometric-scanner" onClick={() => setShowCamera(true)}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>👁️</div>
                    <div style={{ fontSize: 13, color: 'var(--gray-500)', textAlign: 'center', padding: '0 16px' }}>Click to open camera</div>
                  </div>
                )}
                {showCamera && (
                  <div>
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      width={240} height={240}
                      videoConstraints={{ facingMode: 'user' }}
                      style={{ borderRadius: 12, border: '3px solid var(--accent)', display: 'block' }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button className="btn btn-primary btn-sm" onClick={captureFace}>📷 Capture</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setShowCamera(false)}>Cancel</button>
                    </div>
                  </div>
                )}
                {capturedFace && (
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <img src={capturedFace} alt="face" style={{ width: 140, height: 140, borderRadius: 12, objectFit: 'cover', border: '3px solid var(--success)' }} />
                    <div>
                      <div style={{ background: '#d1fae5', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#065f46' }}>✅ Face Captured</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={enrollBiometric}>💾 Enroll Face</button>
                        <button className="btn btn-outline btn-sm" onClick={() => { setCapturedFace(null); setShowCamera(true); }}>Re-capture</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Attendance */}
          <div className="card">
            <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 16, marginBottom: 16 }}>Recent Attendance</div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
                <tbody>
                  {attendance.length === 0
                    ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--gray-400)' }}>No attendance records</td></tr>
                    : attendance.map(a => (
                      <tr key={a._id}>
                        <td>{new Date(a.date).toLocaleDateString('en-IN')}</td>
                        <td>{a.checkIn  ? new Date(a.checkIn).toLocaleTimeString('en-IN',  { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                        <td>{a.checkOut ? new Date(a.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                        <td>{a.workingHours ? `${a.workingHours}h` : '-'}</td>
                        <td><span className={`badge ${a.status === 'Present' ? 'badge-success' : a.status === 'Late' ? 'badge-warning' : a.status === 'Absent' ? 'badge-danger' : 'badge-info'}`}>{a.status}</span></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
