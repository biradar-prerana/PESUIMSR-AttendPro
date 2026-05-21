import { useState, useCallback } from 'react';

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useConfirm() {
  const [dialog, setDialog] = useState(null); // { message, title, onConfirm }

  const confirm = useCallback((message, title = 'Confirm Action') => {
    return new Promise((resolve) => {
      setDialog({
        message,
        title,
        onConfirm: () => { setDialog(null); resolve(true); },
        onCancel:  () => { setDialog(null); resolve(false); },
      });
    });
  }, []);

  return { confirm, dialog };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ConfirmDialog({ dialog }) {
  if (!dialog) return null;

  const isDanger = /delete|remove|deactivate/i.test(dialog.message + dialog.title);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(3px)',
        animation: 'fadeIn .15s ease',
      }}
      onClick={dialog.onCancel}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          width: 420,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          animation: 'slideUp .2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--gray-100)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: isDanger ? '#fee2e2' : '#dbeafe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>
            {isDanger ? '🗑️' : '❓'}
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>
            {dialog.title}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 24px 24px' }}>
          <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6, margin: 0 }}>
            {dialog.message}
          </p>
        </div>

        {/* Footer */}
        <div style={{
          padding: '0 24px 20px',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button
            onClick={dialog.onCancel}
            className="btn btn-outline"
            style={{ minWidth: 90 }}
          >
            Cancel
          </button>
          <button
            onClick={dialog.onConfirm}
            className="btn"
            style={{
              minWidth: 90,
              background: isDanger ? 'var(--danger)' : 'var(--primary)',
              color: 'white',
            }}
          >
            {isDanger ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
