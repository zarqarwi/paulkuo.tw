import { useState, useEffect } from 'react';
import ScorecardApp from './ScorecardApp';
import ScorecardFeed from './ScorecardFeed';

const WORKER = 'https://api.paulkuo.tw';

export default function ScorecardAuthGate() {
  const [status, setStatus] = useState<'checking' | 'authed' | 'guest'>('checking');

  useEffect(() => {
    fetch(`${WORKER}/auth/me`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setStatus(d.authenticated ? 'authed' : 'guest'))
      .catch(() => setStatus('guest'));
  }, []);

  if (status === 'checking') return <Loading />;
  if (status === 'guest') return <Landing />;

  return (
    <>
      <ScorecardApp />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px' }}>
        <ScorecardFeed />
      </div>
    </>
  );
}

function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', color: '#6b7280' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );
}

function Landing() {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
      {/* Header */}
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', color: '#9ca3af', textTransform: 'uppercase' as const, marginBottom: 32 }}>
        PAULKUO.TW
      </div>

      {/* Icon */}
      <div style={{ fontSize: 48, marginBottom: 24 }}>🎯</div>

      {/* Title */}
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8, color: '#111827', lineHeight: 1.3 }}>
        Builder's Scorecard
      </h1>
      <p style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: 32, fontWeight: 500 }}>
        產品長線自評計分卡
      </p>

      {/* Tagline */}
      <p style={{ fontSize: '1.35rem', fontWeight: 700, color: '#374151', marginBottom: 16 }}>
        五個維度，一張體檢報告。
      </p>

      {/* Description */}
      <p style={{ fontSize: '0.95rem', color: '#6b7280', lineHeight: 1.8, marginBottom: 40, maxWidth: 440, margin: '0 auto 40px' }}>
        從概念到成長，每個階段都適用的產品自評框架。<br />
        貼上 GitHub URL 或產品描述，AI 自動完成五維度評估。
      </p>

      {/* Social Login Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12, maxWidth: 320, margin: '0 auto 48px' }}>
        <a
          href={`${WORKER}/auth/google/login`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px 24px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 15, fontWeight: 600, color: '#374151', textDecoration: 'none', transition: 'all 0.2s', cursor: 'pointer' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Google 登入
        </a>
        <a
          href={`${WORKER}/auth/line/login`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px 24px', background: '#06C755', border: '1px solid #06C755', borderRadius: 10, fontSize: 15, fontWeight: 600, color: '#fff', textDecoration: 'none', transition: 'all 0.2s', cursor: 'pointer' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 5.82 2 10.5c0 4.21 3.74 7.74 8.78 8.4.34.07.81.23.93.52.1.27.07.68.03.95l-.15.91c-.05.27-.21 1.06.93.58s6.18-3.64 8.43-6.23C22.83 13.47 22 11.42 22 10.5 22 5.82 17.52 2 12 2z" fill="#fff"/></svg>
          LINE 登入
        </a>
        <a
          href={`${WORKER}/auth/facebook/login`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px 24px', background: '#1877F2', border: '1px solid #1877F2', borderRadius: 10, fontSize: 15, fontWeight: 600, color: '#fff', textDecoration: 'none', transition: 'all 0.2s', cursor: 'pointer' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.47h-2.796v8.385C19.612 22.954 24 17.99 24 12z" fill="#fff"/></svg>
          Facebook 登入
        </a>
      </div>

      {/* Footer */}
      <p style={{ fontSize: '0.78rem', color: '#9ca3af', letterSpacing: '0.02em' }}>
        改編自 OSS Investment Scorecard · v2.1
      </p>
    </div>
  );
}
