import { type Dim } from './constants';

export function WeightSlider({ dim, value, onChange }: {
  dim: Dim;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: '#e2e8f0' }}>{dim.emoji} {dim.label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: dim.color, fontFamily: "'JetBrains Mono', monospace" }}>{value}%</span>
      </div>
      <input
        type="range" min={5} max={50} step={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: dim.color, cursor: 'pointer' }}
      />
    </div>
  );
}
