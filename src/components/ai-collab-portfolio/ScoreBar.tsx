import { C } from './constants';

export function ScoreBar({ label, emoji, score, color, verifiedScore }: {
  label: string;
  emoji: string;
  score: number;
  color: string;
  verifiedScore?: number;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{emoji} {label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{score}</span>
          {verifiedScore !== undefined && (
            <span style={{ fontSize: 12, color: C.success, fontFamily: "'JetBrains Mono', monospace" }} title="AI-verified score">
              ({verifiedScore})
            </span>
          )}
        </div>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', position: 'relative' as const }}>
        <div style={{ height: '100%', width: `${score}%`, background: `linear-gradient(90deg, ${color}99, ${color})`, borderRadius: 3, transition: 'width 0.6s ease' }} />
        {verifiedScore !== undefined && (
          <div style={{
            position: 'absolute' as const, top: 0, left: `${verifiedScore}%`,
            width: 2, height: '100%', background: C.success, borderRadius: 1,
            transition: 'left 0.6s ease',
          }} />
        )}
      </div>
    </div>
  );
}
