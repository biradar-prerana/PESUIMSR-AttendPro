import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function EmpHolidays() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    api.get(`/holidays?year=${year}`)
      .then(r => setHolidays(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year]);

  const today = new Date(); today.setHours(0,0,0,0);

  const grouped = MONTHS.map((month, idx) => ({
    month,
    items: holidays.filter(h => new Date(h.date).getMonth() === idx)
  })).filter(g => g.items.length > 0);

  const upcoming = holidays.filter(h => new Date(h.date) >= today);
  const passed   = holidays.filter(h => new Date(h.date) < today);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Holiday Calendar</div>
          <div className="page-subtitle">{holidays.length} holidays · {upcoming.length} upcoming · {passed.length} passed</div>
        </div>
        <select
          className="form-select"
          style={{ width: 110, padding: '8px 12px' }}
          value={year}
          onChange={e => setYear(parseInt(e.target.value))}
        >
          {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>Loading...</div>
      ) : holidays.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🗓️</div>
          <div style={{ fontWeight: 600, color: 'var(--gray-500)' }}>No holidays published for {year}</div>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginTop: 6 }}>The admin hasn't added the holiday calendar yet.</div>
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Total Holidays', value: holidays.length, color: 'var(--primary)', bg: '#dbeafe' },
              { label: 'Upcoming', value: upcoming.length, color: '#16a34a', bg: '#d1fae5' },
              { label: 'Passed', value: passed.length, color: 'var(--gray-400)', bg: 'var(--gray-100)' }
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: 'center', padding: '14px 12px', background: s.bg, border: 'none' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: s.color, fontWeight: 600, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Month-wise cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {grouped.map(({ month, items }) => (
              <div key={month} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ background: 'var(--primary)', color: 'white', padding: '10px 16px', fontWeight: 700, fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{month} {year}</span>
                  <span style={{ background: 'rgba(255,255,255,.2)', borderRadius: 10, padding: '1px 9px', fontSize: 12 }}>{items.length}</span>
                </div>
                {items.map(h => {
                  const d = new Date(h.date);
                  const isPast = d < today;
                  const isToday = d.toDateString() === today.toDateString();
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div key={h._id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
                      borderBottom: '1px solid var(--gray-100)',
                      background: isToday ? '#fef9c3' : 'transparent',
                      opacity: isPast ? 0.55 : 1
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                        background: isToday ? '#fde047' : isWeekend ? '#fef3c7' : '#dbeafe',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1, color: isToday ? '#713f12' : isWeekend ? '#92400e' : '#1e40af' }}>{d.getDate()}</div>
                        <div style={{ fontSize: 9, fontWeight: 600, color: isToday ? '#854d0e' : isWeekend ? '#b45309' : '#3b82f6' }}>
                          {DAYS[d.getDay()].slice(0, 3)}
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-800)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {h.name}
                          {isToday && <span style={{ fontSize: 10, background: '#fde047', color: '#713f12', borderRadius: 6, padding: '1px 6px', fontWeight: 700 }}>TODAY</span>}
                          {isPast && !isToday && <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>passed</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{DAYS[d.getDay()]}</div>
                        {h.description && <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 1 }}>{h.description}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
