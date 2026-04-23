import { C } from './constants';

export function EvidenceBadge({ type }: { type: 'auto' | 'evidenced' | 'self' }) {
  if (type === 'auto') return (
    <span style={{ fontSize: 10, padding: '2px 8px', background: C.success + '22', color: C.success, borderRadius: 4, fontWeight: 600, whiteSpace: 'nowrap' as const }}>
      Auto-filled from GitHub
    </span>
  );
  if (type === 'evidenced') return (
    <span style={{ fontSize: 10, padding: '2px 8px', background: C.accent + '22', color: C.accent, borderRadius: 4, fontWeight: 600, whiteSpace: 'nowrap' as const }}>
      Evidenced
    </span>
  );
  return null;
}
