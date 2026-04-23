import { C, type Dim } from './constants';

export function RadarChart({ scores, verifiedScores, dims }: {
  scores: Record<string, number>;
  verifiedScores?: Record<string, number>;
  dims: Dim[];
}) {
  const size = 280;
  const cx = size / 2, cy = size / 2, maxR = 100;
  const n = dims.length;

  const pt = (i: number, r: number): [number, number] => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  const dataPoints = dims.map((d, i) => pt(i, (scores[d.id] / 100) * maxR));
  const pathD = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z';

  let verifiedPathD = '';
  let verifiedPoints: [number, number][] = [];
  if (verifiedScores) {
    verifiedPoints = dims.map((d, i) => pt(i, ((verifiedScores[d.id] || 0) / 100) * maxR));
    verifiedPathD = verifiedPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z';
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: 280, margin: '0 auto', display: 'block' }}>
      {[20, 40, 60, 80, 100].map(lv => {
        const pts = Array.from({ length: n }, (_, i) => pt(i, (lv / 100) * maxR));
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z';
        return <path key={lv} d={d} fill="none" stroke={lv === 100 ? 'rgba(74,144,217,0.25)' : 'rgba(74,144,217,0.1)'} strokeWidth={lv === 100 ? 1 : 0.5} />;
      })}
      {dims.map((d, i) => {
        const [lx, ly] = pt(i, maxR);
        return <line key={d.id} x1={cx} y1={cy} x2={lx} y2={ly} stroke="rgba(74,144,217,0.15)" strokeWidth={0.5} />;
      })}
      {dims.map((d, i) => {
        const [tx, ty] = pt(i, maxR + 26);
        return (
          <g key={d.id}>
            <text x={tx} y={ty - 8} textAnchor="middle" fontSize="16">{d.emoji}</text>
            <text x={tx} y={ty + 8} textAnchor="middle" fontSize="9" fontWeight="700" fill={d.color}>{d.label.toUpperCase()}</text>
          </g>
        );
      })}
      {verifiedPathD && (
        <>
          <path d={verifiedPathD} fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.5)" strokeWidth={1.5} strokeLinejoin="round" strokeDasharray="4 3" />
          {verifiedPoints.map((p, i) => (
            <circle key={`v${i}`} cx={p[0]} cy={p[1]} r={3} fill={C.success} stroke={C.card} strokeWidth={1.5} opacity={0.6} />
          ))}
        </>
      )}
      <path d={pathD} fill="rgba(74,144,217,0.15)" stroke="rgba(74,144,217,0.8)" strokeWidth={2} strokeLinejoin="round" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={4} fill={dims[i].color} stroke={C.card} strokeWidth={2} />
      ))}
    </svg>
  );
}
