import React, { useEffect, useState } from 'react';

export default function EmailPreviewBanner() {
  const [url, setUrl] = useState(() => {
    try { return localStorage.getItem('emailPreviewUrl'); } catch { return null; }
  });

  useEffect(() => {
    const t = setInterval(() => {
      try {
        const v = localStorage.getItem('emailPreviewUrl');
        if (v !== url) setUrl(v);
      } catch (e) {}
    }, 1000);
    return () => clearInterval(t);
  }, [url]);

  if (process.env.NODE_ENV !== 'development') return null;
  if (!url) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, background: '#f7f7f7', borderBottom: '1px solid #ddd', padding: '8px 12px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: 1000, width: '100%', textAlign: 'center' }}>
        <strong style={{ marginRight: 8 }}>Email Preview:</strong>
        <a href={url} target="_blank" rel="noopener noreferrer">Open preview in Ethereal</a>
      </div>
    </div>
  );
}
