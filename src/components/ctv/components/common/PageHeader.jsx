import React from 'react';

export default function PageHeader({ title, subtitle }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginBottom: '1rem', width: '100%' }}>
      <div style={{ textAlign: 'center', background: 'rgba(2, 6, 23, 0.65)', padding: '12px 28px', borderRadius: '16px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ color: '#ffffff', fontSize: '1.6rem', fontWeight: 800, margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.8)', letterSpacing: '0.05em' }}>{title}</h2>
        {subtitle ? <p style={{ color: '#e2e8f0', fontSize: '0.95rem', margin: '4px 0 0' }}>{subtitle}</p> : null}
      </div>
    </div>
  );
}
