import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('admin@cosec.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--primary)' }}>
      {/* Left Panel — hidden on mobile */}
      <div className="hide-mobile" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, color: 'white', position: 'relative', overflow: 'hidden' }}>

        {/* Hospital building */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/hospital-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 1,
        }} />

        {/* Light blue tint overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'var(--primary)',
          opacity: 0.15,
        }} />

      </div>

      {/* Right Panel */}
      <div className="login-panel" style={{ width: 440, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <img src="/pesimsr-logo.png" alt="PESUIMSR" style={{ width: 200, objectFit: 'contain', marginBottom: 16 }} />
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)', marginBottom: 6 }}>Sign In</div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Enter your credentials to access the system</div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@cosec.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-500)', cursor: 'pointer' }}>
                <input type="checkbox" /> Remember me
              </label>
              <a href="#!" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>Forgot password?</a>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: 16, background: 'var(--gray-50)', borderRadius: 10, fontSize: 12, color: 'var(--gray-500)' }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--gray-600)' }}>Demo Credentials:</div>
            <div>Email: admin@cosec.com</div>
            <div>Password: admin123</div>
          </div>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--gray-400)' }}>
            PESUIMSR AttendPro v1.0 — PES University
          </div>
        </div>
      </div>
    </div>
  );
}
