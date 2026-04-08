import { useState, useEffect } from 'react';

const C = {
  bg: '#0d0d1a', card: '#13132a', cardBorder: '#2a2a4a',
  primary: '#4A90D9', purple: '#8B5CF6', accent: '#38bdf8',
  text: '#e2e8f0', muted: '#94a3b8', dimmed: '#475569',
  success: '#10b981', warning: '#f59e0b', danger: '#ef4444', white: '#ffffff',
};

const S = {
  card: { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: 24, marginBottom: 16 } as React.CSSProperties,
};

const API_BASE = 'https://api.paulkuo.tw';

const DIMS = [
  { id: 'command',   label: 'Command',   emoji: '\u26A1', color: '#4A90D9', desc: 'Directing AI to do the right things' },
  { id: 'delivery',  label: 'Delivery',  emoji: '\uD83D\uDCE6', color: '#8B5CF6', desc: 'Real output shipped with AI collaboration' },
  { id: 'leverage',  label: 'Leverage',  emoji: '\uD83D\uDD2D', color: '#38bdf8', desc: 'Cognitive amplification multiplier' },
  { id: 'quality',   label: 'Quality',   emoji: '\uD83D\uDEE1\uFE0F', color: '#10b981', desc: 'Verifiable production-grade output' },
  { id: 'influence', label: 'Influence', emoji: '\uD83C\uDF10', color: '#f59e0b', desc: 'Methods adopted by others' },
];

const GRADES: Record<string, { emoji: string; color: string; desc: string; oneLiner: string }> = {
  Orchestrator: { emoji: '\uD83D\uDE80', color: '#f59e0b', desc: 'Full AI-native production', oneLiner: 'You operate as an AI-native production system \u2014 shipping, scaling, and influencing at a level most teams aspire to.' },
  Architect:    { emoji: '\uD83C\uDFD7\uFE0F', color: '#4A90D9', desc: 'Operating at team-scale solo', oneLiner: 'You architect AI collaboration at team-scale \u2014 designing systems, shipping consistently, and multiplying your output.' },
  Builder:      { emoji: '\u26A1', color: '#8B5CF6', desc: 'Shipping AI-powered projects', oneLiner: 'You actively ship AI-powered projects and are building the muscle for sustained production-grade output.' },
  Practitioner: { emoji: '\uD83D\uDD27', color: '#10b981', desc: 'Building with AI consistently', oneLiner: "You're building with AI consistently \u2014 the foundation is solid, and leveling up means shipping more and measuring impact." },
  Explorer:     { emoji: '\uD83C\uDF31', color: '#94a3b8', desc: 'Just getting started', oneLiner: "You're exploring AI collaboration \u2014 start with one project, ship it end-to-end, and let evidence accumulate." },
};

const GRADE_ORDER = ['Explorer', 'Practitioner', 'Builder', 'Architect', 'Orchestrator'];

function RadarChart({ scores }: { scores: Record<string, number> }) {
  const size = 280, cx = size / 2, cy = size / 2, maxR = 100, n = DIMS.length;
  const pt = (i: number, r: number): [number, number] => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const dataPoints = DIMS.map((d, i) => pt(i, ((scores[d.id] || 0) / 100) * maxR));
  const pathD = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z';

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: 280, margin: '0 auto', display: 'block' }}>
      {[20, 40, 60, 80, 100].map(lv => {
        const pts = Array.from({ length: n }, (_, i) => pt(i, (lv / 100) * maxR));
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z';
        return <path key={lv} d={d} fill="none" stroke={lv === 100 ? 'rgba(74,144,217,0.25)' : 'rgba(74,144,217,0.1)'} strokeWidth={lv === 100 ? 1 : 0.5} />;
      })}
      {DIMS.map((d, i) => { const [lx, ly] = pt(i, maxR); return <line key={d.id} x1={cx} y1={cy} x2={lx} y2={ly} stroke="rgba(74,144,217,0.15)" strokeWidth={0.5} />; })}
      {DIMS.map((d, i) => { const [tx, ty] = pt(i, maxR + 26); return (
        <g key={d.id}>
          <text x={tx} y={ty - 8} textAnchor="middle" fontSize="16">{d.emoji}</text>
          <text x={tx} y={ty + 8} textAnchor="middle" fontSize="9" fontWeight="700" fill={d.color}>{d.label.toUpperCase()}</text>
        </g>
      ); })}
      <path d={pathD} fill="rgba(74,144,217,0.15)" stroke="rgba(74,144,217,0.8)" strokeWidth={2} strokeLinejoin="round" />
      {dataPoints.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={4} fill={DIMS[i].color} stroke={C.card} strokeWidth={2} />)}
    </svg>
  );
}

export default function PortfolioView() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = window.location.pathname.split('/').filter(Boolean).pop();
    if (!id || !/^[a-z0-9]{8}$/.test(id)) { setError('Invalid portfolio ID'); setLoading(false); return; }
    fetch(`${API_BASE}/api/acp/${id}`)
      .then(r => { if (!r.ok) throw new Error('Portfolio not found'); return r.json(); })
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '80px 16px', textAlign: 'center' as const, color: C.muted }}>
      Loading portfolio...
    </div>
  );

  if (error || !data) return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '80px 16px', textAlign: 'center' as const }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{'\uD83D\uDD0D'}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.white, marginBottom: 8 }}>Portfolio Not Found</div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>{error || 'This portfolio may have been removed or the link is incorrect.'}</div>
      <a href="/tools/ai-collab-portfolio/" style={{ color: C.primary, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Create your own portfolio &rarr;</a>
    </div>
  );

  const g = GRADES[data.grade] || GRADES.Explorer;
  const level = GRADE_ORDER.indexOf(data.grade) + 1;
  const dimScores = data.dim_scores || {};
  const autoFilled = data.auto_filled || [];
  const evidenceUrls = data.evidence_urls || {};

  // Evidence counts
  const allQIds = DIMS.flatMap(d => [`${d.id[0]}1`, `${d.id[0]}2`, `${d.id[0]}3`, `${d.id[0]}4`]);
  const answeredIds = allQIds.filter(id => data.answers?.[id] !== undefined && data.answers[id] !== '');
  const autoCount = answeredIds.filter(id => autoFilled.includes(id)).length;
  const evidencedCount = answeredIds.filter(id => !autoFilled.includes(id) && evidenceUrls[id]).length;
  const selfCount = answeredIds.length - autoCount - evidencedCount;
  const total = answeredIds.length || 1;

  const portfolioUrl = `https://paulkuo.tw${window.location.pathname}`;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px', background: C.bg, minHeight: '100vh', color: C.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' as const, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 8 }}>AI Collaboration Portfolio</div>
      </div>

      {/* Grade badge */}
      <div style={{ ...S.card, textAlign: 'center' as const, padding: 32 }}>
        <div style={{ display: 'inline-block', padding: '6px 16px', background: g.color + '22', border: `1px solid ${g.color}44`, borderRadius: 20, fontSize: 11, fontWeight: 700, color: g.color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 16 }}>
          Level {level} of {GRADE_ORDER.length}
        </div>
        <div style={{ fontSize: 52, marginBottom: 8 }}>{g.emoji}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: g.color, marginBottom: 4 }}>{data.grade}</div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 16 }}>{g.desc}</div>
        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 28px', marginBottom: 20 }}>
          <div style={{ fontSize: 44, fontWeight: 900, color: C.white, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{data.total_score}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>/ 100</div>
        </div>
        <div style={{ fontSize: 15, color: C.text, fontStyle: 'italic', lineHeight: 1.7, padding: '14px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, borderLeft: `3px solid ${g.color}`, textAlign: 'left' as const, maxWidth: 520, margin: '0 auto' }}>
          "{g.oneLiner}"
        </div>
        {data.github_username && (
          <div style={{ marginTop: 16, fontSize: 13, color: C.muted }}>
            <a href={`https://github.com/${data.github_username}`} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, textDecoration: 'none' }}>
              github.com/{data.github_username}
            </a>
          </div>
        )}
      </div>

      {/* Radar chart */}
      <div style={{ ...S.card, padding: 24 }}>
        <RadarChart scores={dimScores} />
      </div>

      {/* Dimension bars */}
      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 16, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Dimension Breakdown</div>
        {DIMS.map(d => (
          <div key={d.id} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{d.emoji} {d.label}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: d.color, fontFamily: "'JetBrains Mono', monospace" }}>{dimScores[d.id] || 0}</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${dimScores[d.id] || 0}%`, background: `linear-gradient(90deg, ${d.color}99, ${d.color})`, borderRadius: 3, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Evidence transparency */}
      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 14, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Evidence Transparency</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          {[
            { label: 'Auto-fetched', count: autoCount, color: C.success, icon: '\uD83D\uDCCA' },
            { label: 'Evidenced', count: evidencedCount, color: C.accent, icon: '\uD83D\uDD17' },
            { label: 'Self-reported', count: selfCount, color: C.muted, icon: '\u270D\uFE0F' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, textAlign: 'center' as const, padding: '10px 8px', background: s.color + '0a', borderRadius: 10, border: `1px solid ${s.color}22` }}>
              <div style={{ fontSize: 14, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.count}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.05)' }}>
          {autoCount > 0 && <div style={{ width: `${(autoCount / total) * 100}%`, background: C.success }} />}
          {evidencedCount > 0 && <div style={{ width: `${(evidencedCount / total) * 100}%`, background: C.accent }} />}
          {selfCount > 0 && <div style={{ width: `${(selfCount / total) * 100}%`, background: C.dimmed }} />}
        </div>
      </div>

      {/* AI Verification summary */}
      {data.verification && !data.verification.parse_error && (
        <div style={{ ...S.card, border: `1px solid ${C.success}33` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>{'\uD83E\uDDE0'}</span>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.white }}>AI Verification</div>
            <span style={{ marginLeft: 'auto', fontSize: 12, padding: '3px 8px', background: (data.verification.overall_confidence === 'high' ? C.success : data.verification.overall_confidence === 'medium' ? C.warning : C.danger) + '22', color: data.verification.overall_confidence === 'high' ? C.success : data.verification.overall_confidence === 'medium' ? C.warning : C.danger, borderRadius: 4, fontWeight: 600, textTransform: 'uppercase' as const }}>{data.verification.overall_confidence}</span>
          </div>
          {data.verification.one_liner && (
            <div style={{ fontSize: 14, color: C.text, fontStyle: 'italic', marginBottom: 12, lineHeight: 1.6, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: `3px solid ${C.accent}` }}>
              "{data.verification.one_liner}"
            </div>
          )}
          {data.verification.verified_score !== undefined && (
            <div style={{ fontSize: 13, color: C.muted }}>
              AI-Verified Score: <span style={{ color: C.success, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{data.verification.verified_score}</span>/100
              {data.verification.delta !== 0 && (
                <span style={{ color: data.verification.delta > 0 ? C.danger : C.success, marginLeft: 8 }}>
                  ({data.verification.delta > 0 ? '+' : ''}{data.verification.delta})
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      <div style={{ textAlign: 'center' as const, marginTop: 24, marginBottom: 40 }}>
        <div style={{ fontSize: 13, color: C.dimmed, marginBottom: 12 }}>
          Created {data.created_at ? new Date(data.created_at + 'Z').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
        </div>
        <a href="/tools/ai-collab-portfolio/" style={{ display: 'inline-block', padding: '13px 32px', background: `linear-gradient(135deg, ${C.primary}, ${C.purple})`, color: '#fff', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
          Create Your Own Portfolio
        </a>
      </div>
    </div>
  );
}
