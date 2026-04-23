import type { CSSProperties } from 'react';

export const C = {
  bg: '#0d0d1a',
  card: '#13132a',
  cardBorder: '#2a2a4a',
  primary: '#4A90D9',
  purple: '#8B5CF6',
  accent: '#38bdf8',
  text: '#e2e8f0',
  muted: '#94a3b8',
  dimmed: '#475569',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  white: '#ffffff',
};

export const S = {
  card: { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: 24, marginBottom: 16 } as CSSProperties,
  label: { fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.05em' } as CSSProperties,
  input: { width: '100%', padding: '10px 14px', background: '#1a1a35', border: `1px solid ${C.cardBorder}`, borderRadius: 8, color: C.text, fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const } as CSSProperties,
  btnPrimary: { padding: '13px 32px', background: `linear-gradient(135deg, ${C.primary}, ${C.purple})`, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%' } as CSSProperties,
  btnSecondary: { padding: '10px 20px', background: 'transparent', border: `1px solid ${C.cardBorder}`, color: C.muted, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' } as CSSProperties,
  sectionTitle: { fontSize: 18, fontWeight: 700, color: C.white, margin: 0 } as CSSProperties,
  questionLabel: { fontSize: 14, color: C.text, marginBottom: 10, lineHeight: 1.5 } as CSSProperties,
};

export interface Dim {
  id: string;
  label: string;
  emoji: string;
  color: string;
  weight: number;
  desc: string;
}
