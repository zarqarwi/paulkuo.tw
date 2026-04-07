import { useState } from 'react';

/* ── Color palette ── */
const C = {
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
  white: '#ffffff',
};

/* ── Styles ── */
const S = {
  card: { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: 24, marginBottom: 16 } as React.CSSProperties,
  label: { fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.05em' } as React.CSSProperties,
  input: { width: '100%', padding: '10px 14px', background: '#1a1a35', border: `1px solid ${C.cardBorder}`, borderRadius: 8, color: C.text, fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const } as React.CSSProperties,
  btnPrimary: { padding: '13px 32px', background: `linear-gradient(135deg, ${C.primary}, ${C.purple})`, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%' } as React.CSSProperties,
  btnSecondary: { padding: '10px 20px', background: 'transparent', border: `1px solid ${C.cardBorder}`, color: C.muted, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' } as React.CSSProperties,
  sectionTitle: { fontSize: 18, fontWeight: 700, color: C.white, margin: 0 } as React.CSSProperties,
  questionLabel: { fontSize: 14, color: C.text, marginBottom: 10, lineHeight: 1.5 } as React.CSSProperties,
};

/* ── Dimensions config ── */
const DIMS = [
  { id: 'command',   label: 'Command',   emoji: '⚡', color: '#4A90D9', weight: 25, desc: 'Directing AI to do the right things' },
  { id: 'delivery',  label: 'Delivery',  emoji: '📦', color: '#8B5CF6', weight: 25, desc: 'Real output shipped with AI collaboration' },
  { id: 'leverage',  label: 'Leverage',  emoji: '🔭', color: '#38bdf8', weight: 20, desc: 'Cognitive amplification multiplier' },
  { id: 'quality',   label: 'Quality',   emoji: '🛡️', color: '#10b981', weight: 15, desc: 'Verifiable production-grade output' },
  { id: 'influence', label: 'Influence', emoji: '🌐', color: '#f59e0b', weight: 15, desc: 'Methods adopted by others' },
];

/* ── Questions ── */
type QType = 'number' | 'select';
interface Question {
  id: string;
  text: string;
  type: QType;
  options?: { label: string; score: number }[];
  scorer?: (v: number) => number;
}

const mapNum = (v: number, tiers: [number, number][]) => {
  for (const [threshold, score] of [...tiers].reverse()) {
    if (v >= threshold) return score;
  }
  return 0;
};

const QUESTIONS: Record<string, Question[]> = {
  command: [
    { id: 'c1', text: 'How many reusable AI workflows / skills / system prompts have you built?', type: 'number', scorer: v => mapNum(v, [[0,0],[1,20],[2,40],[4,65],[10,100]]) },
    { id: 'c2', text: 'How many automation pipelines do you maintain? (CI/CD, cron, Actions, etc.)', type: 'number', scorer: v => mapNum(v, [[0,0],[1,30],[2,55],[4,80],[10,100]]) },
    { id: 'c3', text: 'How many AI models / tools do you use simultaneously?', type: 'number', scorer: v => mapNum(v, [[0,0],[1,20],[2,40],[3,65],[5,100]]) },
    { id: 'c4', text: 'What is your task decomposition complexity?', type: 'select', options: [
      { label: 'Simple prompts', score: 20 },
      { label: 'Multi-step chains', score: 45 },
      { label: 'Multi-session orchestration', score: 70 },
      { label: 'Full architecture with SOPs', score: 100 },
    ]},
  ],
  delivery: [
    { id: 'd1', text: 'How many code commits in the past 6 months?', type: 'number', scorer: v => mapNum(v, [[0,0],[1,20],[11,40],[51,60],[201,80],[501,100]]) },
    { id: 'd2', text: 'How many services / tools are you currently deploying and operating?', type: 'number', scorer: v => mapNum(v, [[0,0],[1,25],[2,50],[4,75],[8,100]]) },
    { id: 'd3', text: 'How many pieces of content have you published? (articles / videos / docs)', type: 'number', scorer: v => mapNum(v, [[0,0],[1,20],[3,40],[6,65],[16,100]]) },
    { id: 'd4', text: 'How many complete projects have you shipped from zero to production?', type: 'number', scorer: v => mapNum(v, [[0,0],[1,25],[2,50],[4,75],[8,100]]) },
  ],
  leverage: [
    { id: 'l1', text: 'How many active projects are you maintaining simultaneously?', type: 'number', scorer: v => mapNum(v, [[0,0],[1,20],[2,45],[4,70],[8,100]]) },
    { id: 'l2', text: 'Your output is equivalent to how many people in a traditional team?', type: 'select', options: [
      { label: '1–2 people', score: 25 },
      { label: '3–5 people', score: 55 },
      { label: '5–8 people', score: 80 },
      { label: '8+ people', score: 100 },
    ]},
    { id: 'l3', text: 'What is your automation coverage?', type: 'select', options: [
      { label: 'Manual mostly', score: 15 },
      { label: 'Some automation', score: 40 },
      { label: 'Heavily automated', score: 70 },
      { label: 'Fully pipelined', score: 100 },
    ]},
    { id: 'l4', text: 'How did you arrive at your team-equivalent estimate?', type: 'select', options: [
      { label: 'Industry benchmark', score: 80 },
      { label: 'Past experience', score: 70 },
      { label: 'Third-party quote', score: 90 },
      { label: 'Self-estimate', score: 50 },
    ]},
  ],
  quality: [
    { id: 'q1', text: 'How many active users do your services / tools have?', type: 'number', scorer: v => mapNum(v, [[0,0],[1,20],[10,40],[50,65],[200,100]]) },
    { id: 'q2', text: 'How many quality-control mechanisms do you have? (tests / CI / CD / review SOPs)', type: 'number', scorer: v => mapNum(v, [[0,0],[1,25],[2,50],[4,75],[7,100]]) },
    { id: 'q3', text: 'What is your system uptime level?', type: 'select', options: [
      { label: 'No monitoring', score: 10 },
      { label: 'Basic monitoring', score: 40 },
      { label: '99%+ uptime', score: 75 },
      { label: '99.9%+ uptime', score: 100 },
    ]},
    { id: 'q4', text: 'Is your output externally referenced or shared?', type: 'select', options: [
      { label: 'None', score: 0 },
      { label: 'Occasional', score: 35 },
      { label: 'Regular', score: 70 },
      { label: 'Widely cited', score: 100 },
    ]},
  ],
  influence: [
    { id: 'i1', text: 'Total GitHub stars across your open-source projects?', type: 'number', scorer: v => mapNum(v, [[0,0],[1,20],[10,40],[50,65],[200,100]]) },
    { id: 'i2', text: 'How many people have your teaching / sharing content reached?', type: 'number', scorer: v => mapNum(v, [[0,0],[1,15],[50,35],[200,60],[1000,100]]) },
    { id: 'i3', text: 'How many people have adopted your skills / templates / workflows?', type: 'number', scorer: v => mapNum(v, [[0,0],[1,25],[5,50],[20,75],[100,100]]) },
    { id: 'i4', text: 'How often is your methodology externally cited?', type: 'select', options: [
      { label: 'Never', score: 0 },
      { label: 'Rarely', score: 30 },
      { label: 'Sometimes', score: 65 },
      { label: 'Frequently', score: 100 },
    ]},
  ],
};

/* ── Grade table ── */
const GRADES = [
  { min: 81, label: 'Orchestrator', desc: 'Full AI-native production', emoji: '🚀', color: '#f59e0b' },
  { min: 61, label: 'Architect',    desc: 'Operating at team-scale solo', emoji: '🏗️', color: '#4A90D9' },
  { min: 41, label: 'Builder',      desc: 'Shipping AI-powered projects', emoji: '⚡', color: '#8B5CF6' },
  { min: 21, label: 'Practitioner', desc: 'Building with AI consistently', emoji: '🔧', color: '#10b981' },
  { min: 0,  label: 'Explorer',     desc: 'Just getting started', emoji: '🌱', color: '#94a3b8' },
];

function getGrade(score: number) {
  return GRADES.find(g => score >= g.min)!;
}

/* ── Score question ── */
function scoreQuestion(q: Question, val: string | number | undefined): number {
  if (val === undefined || val === '' || val === null) return 0;
  if (q.type === 'number') {
    const n = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(n)) return 0;
    return q.scorer!(n);
  } else {
    const opt = q.options!.find(o => o.label === val);
    return opt ? opt.score : 0;
  }
}

/* ── Radar Chart (SVG, 5-axis) ── */
function RadarChart({ scores }: { scores: Record<string, number> }) {
  const size = 280;
  const cx = size / 2, cy = size / 2, maxR = 100;
  const n = DIMS.length;

  const pt = (i: number, r: number): [number, number] => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  const dataPoints = DIMS.map((d, i) => pt(i, (scores[d.id] / 100) * maxR));
  const pathD = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z';

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: 280, margin: '0 auto', display: 'block' }}>
      {/* Grid rings */}
      {[20, 40, 60, 80, 100].map(lv => {
        const pts = Array.from({ length: n }, (_, i) => pt(i, (lv / 100) * maxR));
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z';
        return <path key={lv} d={d} fill="none" stroke={lv === 100 ? 'rgba(74,144,217,0.25)' : 'rgba(74,144,217,0.1)'} strokeWidth={lv === 100 ? 1 : 0.5} />;
      })}
      {/* Axes */}
      {DIMS.map((d, i) => {
        const [lx, ly] = pt(i, maxR);
        return <line key={d.id} x1={cx} y1={cy} x2={lx} y2={ly} stroke="rgba(74,144,217,0.15)" strokeWidth={0.5} />;
      })}
      {/* Labels */}
      {DIMS.map((d, i) => {
        const [tx, ty] = pt(i, maxR + 26);
        return (
          <g key={d.id}>
            <text x={tx} y={ty - 8} textAnchor="middle" fontSize="16">{d.emoji}</text>
            <text x={tx} y={ty + 8} textAnchor="middle" fontSize="9" fontWeight="700" fill={d.color}>{d.label.toUpperCase()}</text>
          </g>
        );
      })}
      {/* Data polygon */}
      <path d={pathD} fill="rgba(74,144,217,0.15)" stroke="rgba(74,144,217,0.8)" strokeWidth={2} strokeLinejoin="round" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={4} fill={DIMS[i].color} stroke={C.card} strokeWidth={2} />
      ))}
    </svg>
  );
}

/* ── Dimension Score Bar ── */
function ScoreBar({ label, emoji, score, color }: { label: string; emoji: string; score: number; color: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{emoji} {label}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{score}</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: `linear-gradient(90deg, ${color}99, ${color})`, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

/* ── Weight Slider ── */
function WeightSlider({ dim, value, onChange }: { dim: typeof DIMS[0]; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: C.text }}>{dim.emoji} {dim.label}</span>
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

/* ── Accordion Section ── */
function AccordionSection({ dim, answers, onAnswer, isOpen, onToggle, dimScore }: {
  dim: typeof DIMS[0];
  answers: Record<string, string | number>;
  onAnswer: (qid: string, val: string | number) => void;
  isOpen: boolean;
  onToggle: () => void;
  dimScore: number;
}) {
  const qs = QUESTIONS[dim.id];
  const filled = qs.filter(q => answers[q.id] !== undefined && answers[q.id] !== '').length;

  return (
    <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <button
        onClick={onToggle}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>{dim.emoji}</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: dim.color }}>{dim.label}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{dim.desc}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {filled > 0 && (
            <span style={{ fontSize: 12, color: C.muted }}>{filled}/{qs.length}</span>
          )}
          {dimScore > 0 && (
            <span style={{ fontSize: 14, fontWeight: 700, color: dim.color, fontFamily: "'JetBrains Mono', monospace", minWidth: 32, textAlign: 'right' as const }}>{dimScore}</span>
          )}
          <span style={{ color: C.muted, fontSize: 18, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
        </div>
      </button>

      {/* Questions */}
      {isOpen && (
        <div style={{ padding: '0 20px 20px' }}>
          {qs.map((q, idx) => (
            <div key={q.id} style={{ marginBottom: idx < qs.length - 1 ? 20 : 0, paddingTop: 16, borderTop: `1px solid ${C.cardBorder}` }}>
              <div style={S.questionLabel}>{idx + 1}. {q.text}</div>
              {q.type === 'number' ? (
                <input
                  type="number" min={0}
                  value={answers[q.id] ?? ''}
                  onChange={e => onAnswer(q.id, e.target.value)}
                  placeholder="Enter a number"
                  style={S.input}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                  {q.options!.map(opt => (
                    <label key={opt.label} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.label}
                        checked={answers[q.id] === opt.label}
                        onChange={() => onAnswer(q.id, opt.label)}
                        style={{ accentColor: dim.color }}
                      />
                      <span style={{ fontSize: 14, color: C.text }}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ── */
export default function AICollabPortfolio() {
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [weights, setWeights] = useState<Record<string, number>>({ command: 25, delivery: 25, leverage: 20, quality: 15, influence: 15 });
  const [openDim, setOpenDim] = useState<string>('command');
  const [showResults, setShowResults] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showWeights, setShowWeights] = useState(false);

  const handleAnswer = (qid: string, val: string | number) => {
    setAnswers(prev => ({ ...prev, [qid]: val }));
  };

  const handleWeight = (dimId: string, val: number) => {
    setWeights(prev => ({ ...prev, [dimId]: val }));
  };

  /* Compute dim scores */
  const dimScores: Record<string, number> = {};
  DIMS.forEach(dim => {
    const qs = QUESTIONS[dim.id];
    const scores = qs.map(q => scoreQuestion(q, answers[q.id]));
    const answered = scores.filter((_, i) => answers[qs[i].id] !== undefined && answers[qs[i].id] !== '');
    if (answered.length === 0) { dimScores[dim.id] = 0; return; }
    dimScores[dim.id] = Math.round(scores.reduce((a, b) => a + b, 0) / qs.length);
  });

  /* Normalize weights to sum to 100 */
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const normWeights: Record<string, number> = {};
  DIMS.forEach(d => { normWeights[d.id] = weights[d.id] / totalWeight; });

  const totalScore = Math.round(DIMS.reduce((sum, d) => sum + dimScores[d.id] * normWeights[d.id], 0));
  const grade = getGrade(totalScore);

  const answeredCount = Object.keys(answers).filter(k => answers[k] !== '').length;
  const totalQuestions = DIMS.reduce((s, d) => s + QUESTIONS[d.id].length, 0);

  const handleCalculate = () => {
    setShowResults(true);
    setTimeout(() => {
      document.getElementById('acp-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleShare = () => {
    const text = [
      `🤖 AI Collaboration Portfolio`,
      ``,
      `Total Score: ${totalScore}/100 — ${grade.emoji} ${grade.label}`,
      `"${grade.desc}"`,
      ``,
      ...DIMS.map(d => `${d.emoji} ${d.label}: ${dimScores[d.id]}/100`),
      ``,
      `paulkuo.tw/tools/ai-collab-portfolio/`,
    ].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px', background: C.bg, minHeight: '100vh', color: C.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Hero */}
      <div style={{ marginBottom: 32, textAlign: 'center' as const }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Assessment Tool</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: C.white, margin: '0 0 12px', lineHeight: 1.2 }}>
          AI Collaboration Portfolio
        </h1>
        <p style={{ fontSize: 15, color: C.muted, margin: 0, lineHeight: 1.6 }}>
          Measure what you build, not what you know.<br />
          20 questions across 5 dimensions → your AI collaboration profile.
        </p>
        {answeredCount > 0 && (
          <div style={{ marginTop: 12, fontSize: 12, color: C.dimmed }}>{answeredCount} / {totalQuestions} answered</div>
        )}
      </div>

      {/* Form sections */}
      {DIMS.map(dim => (
        <AccordionSection
          key={dim.id}
          dim={dim}
          answers={answers}
          onAnswer={handleAnswer}
          isOpen={openDim === dim.id}
          onToggle={() => setOpenDim(openDim === dim.id ? '' : dim.id)}
          dimScore={dimScores[dim.id]}
        />
      ))}

      {/* Weight adjustment */}
      <div style={{ ...S.card, marginBottom: 16 }}>
        <button
          onClick={() => setShowWeights(!showWeights)}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.white }}>⚙️ Weight Adjustment</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Default: Command 25% · Delivery 25% · Leverage 20% · Quality 15% · Influence 15%</div>
          </div>
          <span style={{ color: C.muted, fontSize: 18, transform: showWeights ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
        </button>
        {showWeights && (
          <div style={{ marginTop: 20 }}>
            {DIMS.map(dim => (
              <WeightSlider key={dim.id} dim={dim} value={weights[dim.id]} onChange={v => handleWeight(dim.id, v)} />
            ))}
            <div style={{ textAlign: 'center' as const, fontSize: 12, color: C.muted, marginTop: 8 }}>
              Total: {Object.values(weights).reduce((a, b) => a + b, 0)}% (auto-normalized to 100%)
            </div>
          </div>
        )}
      </div>

      {/* Calculate button */}
      <button onClick={handleCalculate} style={S.btnPrimary}>
        Calculate My Portfolio Score →
      </button>

      {/* Results */}
      {showResults && (
        <div id="acp-results" style={{ marginTop: 32 }}>
          <div style={{ textAlign: 'center' as const, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Results</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.white, margin: 0 }}>Your AI Collaboration Profile</h2>
          </div>

          {/* Grade badge + total score */}
          <div style={{ ...S.card, textAlign: 'center' as const, padding: 32 }}>
            <div style={{ fontSize: 52, marginBottom: 8 }}>{grade.emoji}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: grade.color, marginBottom: 4 }}>{grade.label}</div>
            <div style={{ fontSize: 14, color: C.muted, marginBottom: 20 }}>{grade.desc}</div>
            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 28px' }}>
              <div style={{ fontSize: 44, fontWeight: 900, color: C.white, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{totalScore}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>/ 100</div>
            </div>
          </div>

          {/* Radar chart */}
          <div style={{ ...S.card, padding: 24 }}>
            <RadarChart scores={dimScores} />
          </div>

          {/* Dimension bars */}
          <div style={S.card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 16, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Dimension Breakdown</div>
            {DIMS.map(d => (
              <ScoreBar key={d.id} label={d.label} emoji={d.emoji} score={dimScores[d.id]} color={d.color} />
            ))}
          </div>

          {/* Grade scale legend */}
          <div style={{ ...S.card, padding: 16 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Grade Scale</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
              {GRADES.map(g => (
                <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: grade.label === g.label ? 1 : 0.45 }}>
                  <span style={{ fontSize: 16 }}>{g.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: grade.label === g.label ? 700 : 400, color: grade.label === g.label ? g.color : C.muted, minWidth: 100 }}>{g.label}</span>
                  <span style={{ fontSize: 12, color: C.dimmed }}>{g.desc}</span>
                  <span style={{ fontSize: 11, color: C.dimmed, marginLeft: 'auto' }}>{g.min}–{g.min === 0 ? 20 : g.min === 21 ? 40 : g.min === 41 ? 60 : g.min === 61 ? 80 : 100}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button onClick={handleShare} style={{ flex: 1, ...S.btnPrimary, padding: '12px 20px' }}>
              {copySuccess ? '✓ Copied!' : '📋 Copy Results'}
            </button>
            <button onClick={() => { setShowResults(false); setAnswers({}); setOpenDim('command'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ ...S.btnSecondary, flex: 1 }}>
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
