import { DIMENSIONS } from './data';

interface Props {
  dimScores: Record<string, number>;
  compareScores?: Record<string, number>;
  compareLabel?: string;
}

export default function RadarChart({ dimScores, compareScores, compareLabel }: Props) {
  const size = 300;
  const cx = size / 2, cy = size / 2, maxR = 115;
  const n = DIMENSIONS.length;

  const pt = (i: number, r: number): [number, number] => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  const dataPoints = DIMENSIONS.map((d, i) => pt(i, ((dimScores[d.id] || 0) / 10) * maxR));
  const pathD = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z';

  const comparePoints = compareScores
    ? DIMENSIONS.map((d, i) => pt(i, ((compareScores[d.id] || 0) / 10) * maxR))
    : null;
  const comparePathD = comparePoints
    ? comparePoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z'
    : null;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: 300, margin: '0 auto', display: 'block' }}>
      {[2, 4, 6, 8, 10].map(lv => {
        const pts = Array.from({ length: n }, (_, i) => pt(i, (lv / 10) * maxR));
        return (
          <path
            key={lv}
            d={pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z'}
            fill="none"
            stroke={lv === 10 ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.06)'}
            strokeWidth={lv === 10 ? 1.2 : 0.5}
          />
        );
      })}
      {DIMENSIONS.map((d, i) => {
        const [lx, ly] = pt(i, maxR);
        const [tx, ty] = pt(i, maxR + 28);
        return (
          <g key={d.id}>
            <line x1={cx} y1={cy} x2={lx} y2={ly} stroke="rgba(0,0,0,0.06)" strokeWidth={0.5} />
            <text x={tx} y={ty - 8} textAnchor="middle" fontSize="18">{d.icon}</text>
            <text x={tx} y={ty + 8} textAnchor="middle" fontSize="9.5" fontWeight="600" fill={d.color}>{d.id}</text>
          </g>
        );
      })}
      {/* Compare layer (behind current) */}
      {comparePathD && (
        <path
          d={comparePathD}
          fill="rgba(156, 163, 175, 0.15)"
          stroke="rgba(156, 163, 175, 0.6)"
          strokeWidth={1.5}
          strokeDasharray="6,3"
          strokeLinejoin="round"
        />
      )}
      {/* Current layer */}
      <path d={pathD} fill="rgba(37,99,235,0.12)" stroke="#2563eb" strokeWidth={2} strokeLinejoin="round" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={4.5} fill={DIMENSIONS[i].color} stroke="#fff" strokeWidth={2} />
      ))}
      {/* Legend if comparing */}
      {compareScores && (
        <g>
          <line x1={10} y1={size - 20} x2={24} y2={size - 20} stroke="#2563eb" strokeWidth={2} />
          <text x={28} y={size - 16} fontSize="9" fill="#374151">Current</text>
          <line x1={80} y1={size - 20} x2={94} y2={size - 20} stroke="rgba(156,163,175,0.6)" strokeWidth={1.5} strokeDasharray="4,2" />
          <text x={98} y={size - 16} fontSize="9" fill="#9ca3af">{compareLabel || 'Previous'}</text>
        </g>
      )}
    </svg>
  );
}
