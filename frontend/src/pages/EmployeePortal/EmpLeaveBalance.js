import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function EmpLeaveBalance() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me').then(async res => {
      if (!res.data.employee) return;
      const empRes = await api.get(`/employees/${res.data.employee}`);
      const bal = await api.get(`/leaves/balance/${empRes.data.employeeId}`);
      setBalance(bal.data);
    }).finally(() => setLoading(false));
  }, []);

  const ICONS = { 'Casual Leave': '🌴', 'Earned Leave': '⭐', 'Maternity Leave': '👶', 'Emergency Leave': '🚨' };
  const EXCLUDED = ['Sick Leave', 'Work From Home'];

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>Loading...</div>;

  return (
    <div className="fade-in">
      <div className="page-header"><div className="page-title">Leave Balance</div><div className="page-subtitle">Year {new Date().getFullYear()}</div></div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {balance && Object.entries(balance).filter(([type]) => !EXCLUDED.includes(type)).map(([type, b]) => {
          const pct = Math.max(0, (b.remaining / b.entitled) * 100);
          const color = pct > 50 ? 'var(--success)' : pct > 20 ? 'var(--warning)' : 'var(--danger)';
          return (
            <div key={type} className="card fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 28 }}>{ICONS[type] || '📅'}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--primary)' }}>{type}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color }}>{b.remaining}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Remaining</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>{b.taken}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Used</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gray-600)' }}>{b.entitled}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Total</div>
                </div>
              </div>
              <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 8 }}>
                <div style={{ height: '100%', borderRadius: 8, background: color, width: `${pct}%`, transition: 'width .5s' }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 6, textAlign: 'right' }}>{pct.toFixed(0)}% remaining</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
