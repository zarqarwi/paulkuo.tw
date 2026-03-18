import { useState, useEffect } from 'react';
import { DIMENSIONS, getVerdict } from './data';

const S = {
  card: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'border-color .2s' } as React.CSSProperties,
};

interface FeedItem {
  id: string;
  project_name: string;
  total_score: number;
  verdict: string;
  dim_scores: string;
  github_meta: string;
  stage: string;
  created_at: string;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr + 'Z').getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return dateStr.slice(0, 10);
}

function MiniRadar({ dimScores }: { dimScores: Record<string, number> }) {
  const size = 80;
  const cx = size / 2, cy = size / 2, maxR = 30;
  const n = DIMENSIONS.length;
  const pt = (i: number, r: number): [number, number] => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const dataPoints = DIMENSIONS.map((d, i) => pt(i, ((dimScores[d.id] || 0) / 10) * maxR));
  const pathD = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z';

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: 80, height: 80, flexShrink: 0 }}>
      <path d={Array.from({ length: n }, (_, i) => pt(i, maxR)).map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z'} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth={0.5} />
      <path d={pathD} fill="rgba(37,99,235,0.15)" stroke="#2563eb" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

const STAGE_LABELS: Record<string, string> = { concept: '概念', launched: '已上線', users: '有用戶', revenue: '有營收' };

export default function ScorecardFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.paulkuo.tw/api/scorecard/feed?limit=10')
      .then(r => r.json())
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 24, color: '#9ca3af', fontSize: 13 }}>載入中⋯</div>;
  if (items.length === 0) return null; // hide if no public evaluations

  return (
    <div style={{ marginTop: 40 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>📋 最近公開評估</h3>
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map(item => {
          const dimScores = typeof item.dim_scores === 'string' ? JSON.parse(item.dim_scores) : item.dim_scores || {};
          const score = Number(item.total_score) || 0;
          const verdict = getVerdict(score, false);
          return (
            <a key={item.id} href={`/tools/builders-scorecard/eval/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={S.card} onMouseEnter={e => (e.currentTarget.style.borderColor = '#2563eb')} onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <MiniRadar dimScores={dimScores} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.project_name || 'Unnamed'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: verdict.color }}>
                        {score.toFixed(1)}
                      </span>
                      <span style={{ fontSize: 16 }}>{verdict.emoji}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 11, color: '#9ca3af' }}>
                      <span style={{ padding: '1px 6px', background: '#f3f4f6', borderRadius: 4 }}>{STAGE_LABELS[item.stage] || item.stage}</span>
                      <span>{relativeTime(item.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
