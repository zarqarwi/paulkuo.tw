import { useState } from 'react';
import { C } from './constants';

export function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative' as const, display: 'inline-flex', alignItems: 'center' }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        style={{ width: 16, height: 16, borderRadius: '50%', background: C.cardBorder, color: C.muted, fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'help', flexShrink: 0 }}
      >?</span>
      {show && (
        <span style={{
          position: 'absolute' as const, bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          padding: '8px 12px', background: '#1a1a35', border: `1px solid ${C.cardBorder}`, borderRadius: 8,
          fontSize: 12, color: C.text, lineHeight: 1.5, width: 240, zIndex: 10,
          marginBottom: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.4)', pointerEvents: 'none' as const,
        }}>{text}</span>
      )}
    </span>
  );
}
