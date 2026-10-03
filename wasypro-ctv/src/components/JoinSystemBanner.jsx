import React, { useState } from 'react';

const THRESHOLD = 5000;

/**
 * JoinSystemBanner
 * Hien thi khi currentUser.isSystemParticipant === false.
 * Sau khi bam "THAM GIA HE THONG", goi onJoin() va hien thi ket qua.
 */
export default function JoinSystemBanner({ onJoin, qualifyingPoints = 0 }) {
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await onJoin();
      if (res?.success) {
        setJoined(true);
      } else {
        setError(res?.message || 'Da xay ra loi. Vui long thu lai.');
      }
    } catch (_) {
      setError('Loi ket noi. Vui long thu lai.');
    } finally {
      setLoading(false);
    }
  };

  const pct = Math.min(100, Math.round((qualifyingPoints / THRESHOLD) * 100));

  if (joined) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
        borderRadius: '16px', padding: '24px', marginBottom: '20px',
        color: '#fff', textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>&#127881;</div>
        <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '4px' }}>
          Chao mung ban da tham gia he thong!
        </div>
        <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
          Cac diem tich luy tu don hang tiep theo se duoc tinh vao moc 5.000 CP de tro thanh Dai Su.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)',
      borderRadius: '16px', padding: '24px', marginBottom: '20px',
      color: '#fff', border: '1px solid rgba(255,255,255,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', flexShrink: 0,
        }}>&#11088;</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Tham Gia He Thong WasyPro</div>
          <div style={{ fontSize: '0.82rem', opacity: 0.75, marginTop: '2px' }}>
            Ban chua kich hoat quyen kinh doanh. Tich luy 5.000 diem de tro thanh Dai Su.
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.8, marginBottom: '6px' }}>
          <span>Qualifying Points</span>
          <span style={{ fontWeight: 700 }}>{qualifyingPoints.toLocaleString('vi-VN')} / {THRESHOLD.toLocaleString('vi-VN')} CP</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: 'linear-gradient(90deg, #f59e0b, #fcd34d)',
            borderRadius: '8px', transition: 'width 0.4s ease',
            minWidth: pct > 0 ? '8px' : '0',
          }} />
        </div>
        <div style={{ fontSize: '0.78rem', opacity: 0.65, marginTop: '4px', textAlign: 'right' }}>
          Con {Math.max(0, THRESHOLD - qualifyingPoints).toLocaleString('vi-VN')} CP nua de len Dai Su
        </div>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.07)', borderRadius: '10px',
        padding: '12px 16px', marginBottom: '16px', fontSize: '0.83rem', lineHeight: 1.7, opacity: 0.85,
      }}>
        <div style={{ fontWeight: 700, marginBottom: '6px', opacity: 1 }}>Sau khi tham gia he thong:</div>
        <div>&#10003; Diem tich luy tu moi don hang duoc tinh vao 5.000 CP</div>
        <div>&#10003; Du 5.000 CP &#8594; Cap Business ID + Rank Dai Su tu dong</div>
        <div>&#10003; Mo quyen gioi thieu &amp; nhan hoa hong network</div>
        <div>&#9888; Diem truoc thoi diem tham gia khong duoc tinh nguoc</div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem',
          marginBottom: '12px', color: '#fca5a5',
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handleJoin}
        disabled={loading}
        style={{
          width: '100%', padding: '14px',
          background: loading ? 'rgba(245,158,11,0.5)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
          border: 'none', borderRadius: '10px', color: '#fff',
          fontWeight: 800, fontSize: '1rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          letterSpacing: '0.02em',
        }}
      >
        {loading ? 'Dang xu ly...' : 'THAM GIA HE THONG'}
      </button>
    </div>
  );
}