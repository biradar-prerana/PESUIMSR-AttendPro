import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function EmpProfile() {
  const [emp, setEmp] = useState(null);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    api.get('/auth/me').then(res => {
      if (res.data.employee) api.get(`/employees/${res.data.employee}`).then(r => setEmp(r.data));
    });
  }, []);

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Passwords do not match');
    try {
      await api.put('/auth/change-password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Password changed!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (!emp) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>Loading...</div>;

  return (
    <div className="fade-in">
      <div className="page-header"><div className="page-title">My Profile</div></div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        {/* Photo + basic */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            {emp.photo
              ? <img src={`http://localhost:5000${emp.photo}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: 'white', fontWeight: 700, fontSize: 36 }}>{emp.firstName?.charAt(0)}</span>}
          </div>
          <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--primary)' }}>{emp.firstName} {emp.lastName}</div>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>{emp.designation}</div>
          <div style={{ marginTop: 8 }}><span className="badge badge-primary">{emp.department?.name}</span></div>

          <div style={{ marginTop: 20, textAlign: 'left' }}>
            {[
              ['👤 Employee ID', emp.employeeId],
              ['📧 Email', emp.email],
              ['📱 Phone', emp.phone || '-'],
              ['🩸 Blood Group', emp.bloodGroup || '-'],
              ['⚧ Gender', emp.gender || '-'],
              ['📅 Join Date', emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('en-IN') : '-'],
              ['💳 Card No.', emp.cardNumber || '-'],
              ['⏰ Shift', emp.shift ? `${emp.shift.name} (${emp.shift.startTime}–${emp.shift.endTime})` : '-'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 13 }}>
                <span style={{ color: 'var(--gray-500)' }}>{k}</span>
                <span style={{ fontWeight: 500, color: 'var(--gray-700)', textAlign: 'right', maxWidth: 160, wordBreak: 'break-word' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Biometric status */}
          <div style={{ marginTop: 16, textAlign: 'left' }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-600)', marginBottom: 8 }}>Biometric Enrollment</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className={`badge ${emp.biometric?.fingerprint ? 'badge-success' : 'badge-gray'}`}>🖐️ {emp.biometric?.fingerprint ? 'Enrolled' : 'Not Enrolled'}</span>
              <span className={`badge ${emp.biometric?.faceData ? 'badge-success' : 'badge-gray'}`}>👁️ {emp.biometric?.faceData ? 'Enrolled' : 'Not Enrolled'}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Address */}
          <div className="card">
            <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 12 }}>Address</div>
            <div style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 }}>{emp.address || 'No address on record'}</div>
          </div>

          {/* Change Password */}
          <div className="card">
            <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 16 }}>Change Password</div>
            <form onSubmit={changePassword}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Current Password</label>
                  <input className="form-input" type="password" value={passwords.currentPassword} onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">New Password</label>
                  <input className="form-input" type="password" value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Confirm Password</label>
                  <input className="form-input" type="password" value={passwords.confirmPassword} onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 14 }}>Update Password</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
