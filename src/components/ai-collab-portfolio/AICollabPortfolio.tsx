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
  warning: '#f59e0b',
  danger: '#ef4444',
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

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'https://api.paulkuo.tw'
  : 'https://api.paulkuo.tw';

/* ── Dimensions config ── */
const DIMS = [
  { id: 'command',   label: 'Command',   emoji: '⚡', color: '#4A90D9', weight: 25, desc: 'Directing AI to do the right things' },
  { id: 'delivery',  label: 'Delivery',  emoji: '📦', color: '#8B5CF6', weight: 25, desc: 'Real output shipped with AI collaboration' },
  { id: 'leverage',  label: 'Leverage',  emoji: '🔭', color: '#38bdf8', weight: 20, desc: 'How much more do you get done with AI?' },
  { id: 'quality',   label: 'Quality',   emoji: '🛡️', color: '#10b981', weight: 15, desc: 'Verifiable production-grade output' },
  { id: 'influence', label: 'Influence', emoji: '🌐', color: '#f59e0b', weight: 15, desc: 'Methods adopted by others' },
];

/* ── Questions ── */
type QType = 'number' | 'select';
interface Question {
  id: string;
  text: string;
  type: QType;
  tooltip: string;
  options?: { label: string; score: number }[];
  scorer?: (v: number) => number;
}

const mapNum = (v: number, tiers: [number, number][]) => {
  for (const [threshold, score] of [...tiers].reverse()) {
    if (v >= threshold) return score;
  }
  return 0;
};

/* ── aria-label + placeholder map for number inputs ── */
const INPUT_META: Record<string, { ariaLabel: string; placeholder: string }> = {
  c1: { ariaLabel: 'Number of reusable AI workflows', placeholder: 'e.g., 5' },
  c2: { ariaLabel: 'Number of automation pipelines', placeholder: 'e.g., 3' },
  c3: { ariaLabel: 'Number of AI models used simultaneously', placeholder: 'e.g., 4' },
  d1: { ariaLabel: 'Number of code commits in the past 6 months', placeholder: 'e.g., 120' },
  d2: { ariaLabel: 'Number of services or tools currently deployed', placeholder: 'e.g., 2' },
  d3: { ariaLabel: 'Number of pieces of content published', placeholder: 'e.g., 10' },
  d4: { ariaLabel: 'Number of complete projects shipped to production', placeholder: 'e.g., 3' },
  l1: { ariaLabel: 'Number of active projects maintained simultaneously', placeholder: 'e.g., 4' },
  q1: { ariaLabel: 'Number of active users across services or tools', placeholder: 'e.g., 50' },
  q2: { ariaLabel: 'Number of quality control mechanisms', placeholder: 'e.g., 3' },
  i1: { ariaLabel: 'Total GitHub stars across open-source projects', placeholder: 'e.g., 25' },
  i2: { ariaLabel: 'Number of people reached by teaching or sharing content', placeholder: 'e.g., 500' },
  i3: { ariaLabel: 'Number of people who adopted your skills or workflows', placeholder: 'e.g., 10' },
};

const QUESTIONS: Record<string, Question[]> = {
  command: [
    { id: 'c1', text: 'How many reusable AI workflows / skills / system prompts have you built?', tooltip: 'Count distinct reusable prompts, system prompts, or multi-step workflows you\'ve created and continue to use.', type: 'number', scorer: v => mapNum(v, [[0,0],[1,20],[2,40],[4,65],[10,100]]) },
    { id: 'c2', text: 'How many automation pipelines do you maintain? (CI/CD, cron, Actions, etc.)', tooltip: 'Include CI/CD pipelines, GitHub Actions, cron jobs, or any automated workflows you maintain.', type: 'number', scorer: v => mapNum(v, [[0,0],[1,30],[2,55],[4,80],[10,100]]) },
    { id: 'c3', text: 'How many AI models / tools do you use simultaneously?', tooltip: 'Count distinct AI models or tools (ChatGPT, Claude, Copilot, Midjourney, etc.) you use in your regular workflow.', type: 'number', scorer: v => mapNum(v, [[0,0],[1,20],[2,40],[3,65],[5,100]]) },
    { id: 'c4', text: 'What is your task decomposition complexity?', tooltip: 'How complex are the tasks you delegate to AI? Simple = single prompts; Full SOP = orchestrated multi-agent systems with documented procedures.', type: 'select', options: [
      { label: 'Simple prompts', score: 20 },
      { label: 'Multi-step chains', score: 45 },
      { label: 'Multi-session orchestration', score: 70 },
      { label: 'Full architecture with SOPs', score: 100 },
    ]},
  ],
  delivery: [
    { id: 'd1', text: 'How many code commits in the past 6 months?', tooltip: 'Total git commits across all repositories in the past 6 months. Auto-filled from GitHub public push events.', type: 'number', scorer: v => mapNum(v, [[0,0],[1,20],[11,40],[51,60],[201,80],[501,100]]) },
    { id: 'd2', text: 'How many services / tools are you currently deploying and operating?', tooltip: 'Count services, APIs, bots, or tools you currently deploy and operate in production.', type: 'number', scorer: v => mapNum(v, [[0,0],[1,25],[2,50],[4,75],[8,100]]) },
    { id: 'd3', text: 'How many pieces of content have you published? (articles / videos / docs)', tooltip: 'Published articles, blog posts, videos, documentation pages, or other content. Auto-filled from GitHub Pages repos.', type: 'number', scorer: v => mapNum(v, [[0,0],[1,20],[3,40],[6,65],[16,100]]) },
    { id: 'd4', text: 'How many complete projects have you shipped from zero to production?', tooltip: 'Complete projects shipped from idea to production \u2014 not just started, but actually deployed and usable.', type: 'number', scorer: v => mapNum(v, [[0,0],[1,25],[2,50],[4,75],[8,100]]) },
  ],
  leverage: [
    { id: 'l1', text: 'How many active projects are you maintaining simultaneously?', tooltip: 'Distinct projects you\'re actively maintaining and shipping updates for. Auto-filled from GitHub active repos.', type: 'number', scorer: v => mapNum(v, [[0,0],[1,20],[2,45],[4,70],[8,100]]) },
    { id: 'l2', text: 'Your output is equivalent to how many people in a traditional team?', tooltip: 'If a traditional team were to produce the same output, how many people would it take?', type: 'select', options: [
      { label: '1\u20132 people', score: 25 },
      { label: '3\u20135 people', score: 55 },
      { label: '5\u20138 people', score: 80 },
      { label: '8+ people', score: 100 },
    ]},
    { id: 'l3', text: 'What is your automation coverage?', tooltip: 'What percentage of your workflow is automated vs. manual? Fully pipelined = almost no manual steps.', type: 'select', options: [
      { label: 'Manual mostly', score: 15 },
      { label: 'Some automation', score: 40 },
      { label: 'Heavily automated', score: 70 },
      { label: 'Fully pipelined', score: 100 },
    ]},
    { id: 'l4', text: 'How did you arrive at your team-equivalent estimate?', tooltip: 'How did you estimate your team-equivalent number? Third-party quotes are the strongest evidence.', type: 'select', options: [
      { label: 'Industry benchmark', score: 80 },
      { label: 'Past experience', score: 70 },
      { label: 'Third-party quote', score: 90 },
      { label: 'Self-estimate', score: 50 },
    ]},
  ],
  quality: [
    { id: 'q1', text: 'How many active users do your services / tools have?', tooltip: 'Real users actively using your services or tools. Not page views \u2014 actual users.', type: 'number', scorer: v => mapNum(v, [[0,0],[1,20],[10,40],[50,65],[200,100]]) },
    { id: 'q2', text: 'How many quality-control mechanisms do you have? (tests / CI / CD / review SOPs)', tooltip: 'Count: automated tests, CI checks, code review processes, deployment pipelines, monitoring alerts.', type: 'number', scorer: v => mapNum(v, [[0,0],[1,25],[2,50],[4,75],[7,100]]) },
    { id: 'q3', text: 'What is your system uptime level?', tooltip: 'Best uptime level across your production services. 99.9%+ means less than 9 hours downtime per year.', type: 'select', options: [
      { label: 'No monitoring', score: 10 },
      { label: 'Basic monitoring', score: 40 },
      { label: '99%+ uptime', score: 75 },
      { label: '99.9%+ uptime', score: 100 },
    ]},
    { id: 'q4', text: 'Is your output externally referenced or shared?', tooltip: 'Is your work referenced, linked to, or shared by others outside your organization?', type: 'select', options: [
      { label: 'None', score: 0 },
      { label: 'Occasional', score: 35 },
      { label: 'Regular', score: 70 },
      { label: 'Widely cited', score: 100 },
    ]},
  ],
  influence: [
    { id: 'i1', text: 'Total GitHub stars across your open-source projects?', tooltip: 'Total GitHub stars across all your public repositories. Auto-filled from GitHub.', type: 'number', scorer: v => mapNum(v, [[0,0],[1,20],[10,40],[50,65],[200,100]]) },
    { id: 'i2', text: 'How many people have your teaching / sharing content reached?', tooltip: 'Total reach of your teaching/sharing: article readers, video viewers, talk attendees, followers, etc.', type: 'number', scorer: v => mapNum(v, [[0,0],[1,15],[50,35],[200,60],[1000,100]]) },
    { id: 'i3', text: 'How many people have adopted your skills / templates / workflows?', tooltip: 'How many people have adopted your templates, workflows, prompts, or methodologies in their own work?', type: 'number', scorer: v => mapNum(v, [[0,0],[1,25],[5,50],[20,75],[100,100]]) },
    { id: 'i4', text: 'How often is your methodology externally cited?', tooltip: 'How often do others cite your methods, tools, or frameworks in their own work or publications?', type: 'select', options: [
      { label: 'Never', score: 0 },
      { label: 'Rarely', score: 30 },
      { label: 'Sometimes', score: 65 },
      { label: 'Frequently', score: 100 },
    ]},
  ],
};

/* ── Grade table ── */
const GRADES = [
  { min: 81, label: 'Orchestrator', desc: 'Full AI-native production', emoji: '🚀', color: '#f59e0b', oneLiner: 'You operate as an AI-native production system — shipping, scaling, and influencing at a level most teams aspire to.' },
  { min: 61, label: 'Architect',    desc: 'Operating at team-scale solo', emoji: '🏗️', color: '#4A90D9', oneLiner: 'You architect AI collaboration at team-scale — designing systems, shipping consistently, and multiplying your output.' },
  { min: 41, label: 'Builder',      desc: 'Shipping AI-powered projects', emoji: '⚡', color: '#8B5CF6', oneLiner: 'You actively ship AI-powered projects and are building the muscle for sustained production-grade output.' },
  { min: 21, label: 'Practitioner', desc: 'Building with AI consistently', emoji: '🔧', color: '#10b981', oneLiner: 'You\'re building with AI consistently — the foundation is solid, and leveling up means shipping more and measuring impact.' },
  { min: 0,  label: 'Explorer',     desc: 'Just getting started', emoji: '🌱', color: '#94a3b8', oneLiner: 'You\'re exploring AI collaboration — start with one project, ship it end-to-end, and let evidence accumulate.' },
];

function getGrade(score: number) {
  return GRADES.find(g => score >= g.min)!;
}

/* ── Dimension insight helpers ── */
const DIM_INSIGHTS: Record<string, { low: string; mid: string; high: string; improve: string }> = {
  command: {
    low: 'Your AI command surface is narrow — explore more models and build reusable workflows.',
    mid: 'Solid command of AI tools. Next: systematize your workflows into documented SOPs.',
    high: 'Advanced AI orchestration — you\'re directing complex multi-agent systems effectively.',
    improve: 'Build more reusable system prompts and automation pipelines. Document your task decomposition patterns.',
  },
  delivery: {
    low: 'Limited shipping evidence. Focus on completing and deploying one project end-to-end.',
    mid: 'Consistent delivery. Increase velocity by deploying more services and publishing content.',
    high: 'Prolific shipper — multiple services, content, and projects in production.',
    improve: 'Ship more complete projects from zero to production. Publish content about what you build.',
  },
  leverage: {
    low: 'Operating mostly at 1x capacity. Automate repetitive tasks and take on parallel projects.',
    mid: 'Good cognitive leverage. Push further by automating more and quantifying your multiplier.',
    high: 'Exceptional leverage — you\'re operating at multi-person team scale.',
    improve: 'Automate more of your workflow. Get third-party quotes to validate your team-equivalent estimate.',
  },
  quality: {
    low: 'Quality signals are weak — add monitoring, tests, and track real users.',
    mid: 'Decent quality controls. Aim for higher uptime and external validation.',
    high: 'Production-grade output with real users, monitoring, and external references.',
    improve: 'Add more QC mechanisms (tests, CI, monitoring). Track active users and aim for 99.9%+ uptime.',
  },
  influence: {
    low: 'Minimal external influence yet. Share your methods, open-source your tools, teach others.',
    mid: 'Growing influence. Increase reach through more teaching and open-source contributions.',
    high: 'Strong influence — your methods are being adopted and cited by others.',
    improve: 'Open-source more projects. Write about your methodology. Present at meetups or conferences.',
  },
};

function getDimInsight(dimId: string, score: number) {
  const insights = DIM_INSIGHTS[dimId];
  if (score >= 70) return { summary: insights.high, level: 'Strong' as const };
  if (score >= 35) return { summary: insights.mid, level: 'Developing' as const };
  return { summary: insights.low, level: 'Emerging' as const };
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
function RadarChart({ scores, verifiedScores }: { scores: Record<string, number>; verifiedScores?: Record<string, number> }) {
  const size = 280;
  const cx = size / 2, cy = size / 2, maxR = 100;
  const n = DIMS.length;

  const pt = (i: number, r: number): [number, number] => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  const dataPoints = DIMS.map((d, i) => pt(i, (scores[d.id] / 100) * maxR));
  const pathD = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z';

  let verifiedPathD = '';
  let verifiedPoints: [number, number][] = [];
  if (verifiedScores) {
    verifiedPoints = DIMS.map((d, i) => pt(i, ((verifiedScores[d.id] || 0) / 100) * maxR));
    verifiedPathD = verifiedPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z';
  }

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
      {/* AI-verified polygon (behind) */}
      {verifiedPathD && (
        <>
          <path d={verifiedPathD} fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.5)" strokeWidth={1.5} strokeLinejoin="round" strokeDasharray="4 3" />
          {verifiedPoints.map((p, i) => (
            <circle key={`v${i}`} cx={p[0]} cy={p[1]} r={3} fill={C.success} stroke={C.card} strokeWidth={1.5} opacity={0.6} />
          ))}
        </>
      )}
      {/* Self-reported polygon */}
      <path d={pathD} fill="rgba(74,144,217,0.15)" stroke="rgba(74,144,217,0.8)" strokeWidth={2} strokeLinejoin="round" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={4} fill={DIMS[i].color} stroke={C.card} strokeWidth={2} />
      ))}
    </svg>
  );
}

/* ── Dimension Score Bar ── */
function ScoreBar({ label, emoji, score, color, verifiedScore }: { label: string; emoji: string; score: number; color: string; verifiedScore?: number }) {
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

/* ── GitHub Connect (Layer 2) ── */
function GitHubConnect({ onDataLoaded, autoFilledFields }: {
  onDataLoaded: (data: any) => void;
  autoFilledFields: string[];
}) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<any>(null);

  const handleFetch = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setError('');
    try {
      const resp = await fetch(`${API_BASE}/api/acp/github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to fetch');
      setProfile(data);
      onDataLoaded(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch GitHub data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...S.card, background: 'linear-gradient(135deg, #13132a 0%, #1a1a35 100%)', border: `1px solid ${C.primary}33` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>&#x1F4E1;</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.white }}>Connect GitHub — skip 8+ questions</div>
          <div style={{ fontSize: 12, color: C.muted }}>We'll pull your commits, repos, and CI/CD data to pre-fill your portfolio. Read-only access only.</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: error ? 8 : 0 }}>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleFetch()}
          placeholder="GitHub username"
          style={{ ...S.input, flex: 1 }}
          disabled={loading}
        />
        <button
          onClick={handleFetch}
          disabled={loading || !username.trim()}
          style={{
            padding: '10px 20px',
            background: loading ? C.cardBorder : C.primary,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
            whiteSpace: 'nowrap' as const,
          }}
        >
          {loading ? 'Fetching...' : 'Connect'}
        </button>
      </div>

      <div aria-live="polite" aria-atomic="true">
        {error && (
          <div style={{ fontSize: 13, color: C.danger, marginTop: 8 }}>
            GitHub connection failed. Please check your username.
          </div>
        )}

        {profile && (
          <div style={{ marginTop: 14, padding: 14, background: 'rgba(16,185,129,0.06)', borderRadius: 10, border: `1px solid ${C.success}22` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <img src={profile.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>{profile.name || profile.username}</div>
                {profile.bio && <div style={{ fontSize: 12, color: C.muted }}>{profile.bio.slice(0, 80)}</div>}
              </div>
              <span style={{ fontSize: 12, color: C.success, marginLeft: 'auto', fontWeight: 600 }}>Connected</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { label: 'Repos', value: profile.public_repos },
                { label: 'Stars', value: profile.stars_total },
                { label: 'Commits (6m)', value: profile.commits_6m },
                { label: 'Active repos', value: profile.active_repos },
                { label: 'CI pipelines', value: profile.ci_pipelines },
                { label: 'Followers', value: profile.followers_count },
              ].map(m => (
                <div key={m.label} style={{ textAlign: 'center' as const }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.accent, fontFamily: "'JetBrains Mono', monospace" }}>{m.value}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{m.label}</div>
                </div>
              ))}
            </div>
            {autoFilledFields.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 12, color: C.success }}>
                GitHub connected successfully. {autoFilledFields.length} fields auto-filled.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── AI Verification Result (Layer 3) ── */
function VerificationPanel({ verification }: { verification: any }) {
  if (!verification) return null;
  if (verification.parse_error) {
    return (
      <div style={{ ...S.card, borderColor: C.warning + '44' }}>
        <div style={{ fontSize: 14, color: C.warning }}>AI verification returned non-standard output. Raw response available.</div>
      </div>
    );
  }

  const confColor = verification.overall_confidence === 'high' ? C.success
    : verification.overall_confidence === 'medium' ? C.warning : C.danger;

  return (
    <div style={{ ...S.card, background: 'linear-gradient(135deg, #0d1a0d 0%, #13132a 100%)', border: `1px solid ${C.success}33` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>&#x1F9E0;</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.white }}>Layer 3: AI Verification</div>
          <div style={{ fontSize: 12, color: C.muted }}>Cross-referenced with GitHub evidence by Claude</div>
        </div>
        <div style={{
          marginLeft: 'auto', padding: '4px 10px',
          background: confColor + '22', border: `1px solid ${confColor}44`,
          borderRadius: 6, fontSize: 12, fontWeight: 600, color: confColor,
          textTransform: 'uppercase' as const,
        }}>
          {verification.overall_confidence} confidence
        </div>
      </div>

      {/* One-liner */}
      {verification.one_liner && (
        <div style={{ fontSize: 15, color: C.text, fontStyle: 'italic', marginBottom: 16, lineHeight: 1.6, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: `3px solid ${C.accent}` }}>
          "{verification.one_liner}"
        </div>
      )}

      {/* Verified vs Self-reported score */}
      {verification.verified_score !== undefined && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1, textAlign: 'center' as const, padding: 12, background: 'rgba(74,144,217,0.08)', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>SELF-REPORTED</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.primary, fontFamily: "'JetBrains Mono', monospace" }}>
              {verification.verified_score + (verification.delta || 0)}
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' as const, padding: 12, background: 'rgba(16,185,129,0.08)', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>AI-VERIFIED</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.success, fontFamily: "'JetBrains Mono', monospace" }}>
              {verification.verified_score}
            </div>
          </div>
          {verification.delta !== 0 && (
            <div style={{ flex: 1, textAlign: 'center' as const, padding: 12, background: `rgba(${verification.delta > 0 ? '239,68,68' : '16,185,129'},0.08)`, borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>DELTA</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: verification.delta > 0 ? C.danger : C.success, fontFamily: "'JetBrains Mono', monospace" }}>
                {verification.delta > 0 ? '+' : ''}{verification.delta}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dimension confidence */}
      {verification.dimension_notes && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Per-Dimension Verification</div>
          {DIMS.map(d => {
            const note = verification.dimension_notes[d.id];
            if (!note) return null;
            const nc = note.confidence === 'high' ? C.success : note.confidence === 'medium' ? C.warning : C.danger;
            return (
              <div key={d.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                <span style={{ fontSize: 14 }}>{d.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: d.color }}>{d.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {note.adjusted_score !== undefined && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.success, fontFamily: "'JetBrains Mono', monospace" }}>{note.adjusted_score}</span>
                      )}
                      <span style={{ fontSize: 10, padding: '2px 6px', background: nc + '22', color: nc, borderRadius: 4, fontWeight: 600 }}>{note.confidence}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{note.note}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Highlights & Flags */}
      <div style={{ display: 'flex', gap: 12 }}>
        {verification.highlights?.length > 0 && (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.success, marginBottom: 6, textTransform: 'uppercase' as const }}>Highlights</div>
            {verification.highlights.map((h: string, i: number) => (
              <div key={i} style={{ fontSize: 12, color: C.text, marginBottom: 4, paddingLeft: 12, position: 'relative' as const }}>
                <span style={{ position: 'absolute' as const, left: 0, color: C.success }}>+</span>{h}
              </div>
            ))}
          </div>
        )}
        {verification.flags?.length > 0 && (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.warning, marginBottom: 6, textTransform: 'uppercase' as const }}>Flags</div>
            {verification.flags.map((f: string, i: number) => (
              <div key={i} style={{ fontSize: 12, color: C.text, marginBottom: 4, paddingLeft: 12, position: 'relative' as const }}>
                <span style={{ position: 'absolute' as const, left: 0, color: C.warning }}>!</span>{f}
              </div>
            ))}
          </div>
        )}
      </div>

      {verification.confidence_note && (
        <div style={{ marginTop: 12, fontSize: 11, color: C.dimmed, fontStyle: 'italic' }}>{verification.confidence_note}</div>
      )}
    </div>
  );
}

/* ── Tooltip ── */
function Tooltip({ text }: { text: string }) {
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

/* ── Evidence Source Badge ── */
function EvidenceBadge({ type }: { type: 'auto' | 'evidenced' | 'self' }) {
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

/* ── Accordion Section ── */
function AccordionSection({ dim, answers, onAnswer, isOpen, onToggle, dimScore, autoFilledFields, evidenceUrls, onEvidenceUrl }: {
  dim: typeof DIMS[0];
  answers: Record<string, string | number>;
  onAnswer: (qid: string, val: string | number) => void;
  isOpen: boolean;
  onToggle: () => void;
  dimScore: number;
  autoFilledFields: string[];
  evidenceUrls: Record<string, string>;
  onEvidenceUrl: (qid: string, url: string) => void;
}) {
  const qs = QUESTIONS[dim.id];
  const filled = qs.filter(q => answers[q.id] !== undefined && answers[q.id] !== '').length;
  const contentId = `acp-dim-${dim.id}`;

  return (
    <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onKeyDown={e => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const idx = DIMS.findIndex(d => d.id === dim.id);
            const next = e.key === 'ArrowDown'
              ? DIMS[(idx + 1) % DIMS.length]
              : DIMS[(idx - 1 + DIMS.length) % DIMS.length];
            document.getElementById(`acp-accordion-${next.id}`)?.focus();
          }
        }}
        id={`acp-accordion-${dim.id}`}
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
          <span style={{ color: C.muted, fontSize: 18, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>{'\u25BE'}</span>
        </div>
      </button>

      {/* Questions */}
      {isOpen && (
        <div id={contentId} style={{ padding: '0 20px 20px' }}>
          {qs.map((q, idx) => {
            const isAutoFilled = autoFilledFields.includes(q.id);
            const hasEvidence = !!evidenceUrls[q.id];
            const badgeType = isAutoFilled ? 'auto' : hasEvidence ? 'evidenced' : 'self';
            const meta = INPUT_META[q.id];
            const numVal = q.type === 'number' ? Number(answers[q.id]) : NaN;
            const isInvalid = q.type === 'number' && answers[q.id] !== undefined && answers[q.id] !== '' && (numVal < 0 || numVal > 100);
            return (
              <div key={q.id} style={{ marginBottom: idx < qs.length - 1 ? 20 : 0, paddingTop: 16, borderTop: `1px solid ${C.cardBorder}` }}>
                <div style={{ ...S.questionLabel, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <span style={{ flex: 1 }}>{idx + 1}. {q.text}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {(answers[q.id] !== undefined && answers[q.id] !== '') && <EvidenceBadge type={badgeType} />}
                    <Tooltip text={q.tooltip} />
                  </div>
                </div>
                {q.type === 'number' ? (
                  <>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      aria-label={meta?.ariaLabel}
                      value={answers[q.id] ?? ''}
                      onChange={e => onAnswer(q.id, e.target.value)}
                      placeholder={meta?.placeholder ?? 'e.g., 5'}
                      aria-describedby={isInvalid ? `${q.id}-error` : undefined}
                      style={{
                        ...S.input,
                        ...(isAutoFilled ? { borderColor: C.success + '44', background: 'rgba(16,185,129,0.04)' } : {}),
                        ...(isInvalid ? { borderColor: C.danger + '88' } : {}),
                      }}
                    />
                    {isInvalid && (
                      <div id={`${q.id}-error`} role="alert" style={{ fontSize: 12, color: C.danger, marginTop: 4 }}>
                        Please enter a number between 0 and 100
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    role="radiogroup"
                    aria-label={q.text}
                    style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}
                  >
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
                {/* Evidence URL for non-auto-filled fields */}
                {!isAutoFilled && (
                  <div style={{ marginTop: 8 }}>
                    <input
                      type="url"
                      value={evidenceUrls[q.id] || ''}
                      onChange={e => onEvidenceUrl(q.id, e.target.value)}
                      placeholder="Evidence URL (optional)"
                      style={{ ...S.input, fontSize: 12, padding: '6px 10px', borderColor: hasEvidence ? C.accent + '44' : C.cardBorder, background: hasEvidence ? 'rgba(56,189,248,0.04)' : '#1a1a35' }}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Influence reach override — optional blog/social inputs */}
          {dim.id === 'influence' && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.cardBorder}` }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, padding: '10px 14px', background: 'rgba(245,158,11,0.06)', borderRadius: 8, borderLeft: `2px solid ${C.warning}44`, lineHeight: 1.6 }}>
                <strong style={{ color: C.warning }}>Expand your reach score (optional):</strong> If you have a blog or social media presence, add those numbers here. GitHub followers alone may undercount your actual reach.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={S.label}>Blog monthly page views</label>
                  <input
                    type="number"
                    min={0}
                    aria-label="Monthly blog page views (optional)"
                    value={answers['blog_monthly_traffic'] ?? ''}
                    onChange={e => onAnswer('blog_monthly_traffic', e.target.value)}
                    placeholder="e.g., 5000 (optional)"
                    style={S.input}
                  />
                </div>
                <div>
                  <label style={S.label}>Social followers</label>
                  <input
                    type="number"
                    min={0}
                    aria-label="Total social media followers (X, Threads, LinkedIn, etc.) — optional"
                    value={answers['social_followers'] ?? ''}
                    onChange={e => onAnswer('social_followers', e.target.value)}
                    placeholder="e.g., 1200 (optional)"
                    style={S.input}
                  />
                  <div style={{ fontSize: 10, color: C.dimmed, marginTop: 4 }}>X + Threads + LinkedIn + total</div>
                </div>
              </div>
              {(answers['blog_monthly_traffic'] || answers['social_followers']) && (
                <div style={{ marginTop: 8, fontSize: 11, color: C.success }}>
                  Combined reach: {(Number(answers['blog_monthly_traffic'] || 0) + Number(answers['social_followers'] || 0) + Number(answers['i2'] || 0)).toLocaleString()} — applied to reach score
                </div>
              )}
            </div>
          )}
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

  // Layer 2 state
  const [githubData, setGithubData] = useState<any>(null);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  const [evidenceUrls, setEvidenceUrls] = useState<Record<string, string>>({});

  // Layer 3 state
  const [verification, setVerification] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  // Phase 3: persistence state
  const [savedId, setSavedId] = useState<string | null>(null);
  const [ownerToken, setOwnerToken] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleAnswer = (qid: string, val: string | number) => {
    setAnswers(prev => ({ ...prev, [qid]: val }));
  };

  const handleEvidenceUrl = (qid: string, url: string) => {
    setEvidenceUrls(prev => ({ ...prev, [qid]: url }));
  };

  const handleWeight = (dimId: string, val: number) => {
    setWeights(prev => ({ ...prev, [dimId]: val }));
  };

  // Layer 2: auto-fill from GitHub data
  const handleGitHubData = (data: any) => {
    setGithubData(data);
    if (!data?.suggested) return;
    const s = data.suggested;
    const filled: string[] = [];
    const newAnswers: Record<string, string | number> = { ...answers };

    // Only auto-fill fields that haven't been manually entered
    const autoFillMap: Record<string, number> = {
      d1: s.d1, d2: s.d2, d3: s.d3, d4: s.d4,
      c2: s.c2,
      i1: s.i1, i2: s.i2,
      l1: s.l1,
    };

    for (const [qid, val] of Object.entries(autoFillMap)) {
      if (val !== undefined && val !== null) {
        if (newAnswers[qid] === undefined || newAnswers[qid] === '') {
          newAnswers[qid] = val;
          filled.push(qid);
        }
      }
    }

    setAnswers(newAnswers);
    setAutoFilledFields(filled);
  };

  /* Compute dim scores */
  const dimScores: Record<string, number> = {};
  const blogTraffic = Number(answers['blog_monthly_traffic'] || 0);
  const socialFollowers = Number(answers['social_followers'] || 0);
  const hasReachOverride = blogTraffic > 0 || socialFollowers > 0;
  DIMS.forEach(dim => {
    const qs = QUESTIONS[dim.id];
    const scores = qs.map(q => {
      if (q.id === 'i2' && hasReachOverride && q.scorer) {
        const githubFollowers = Number(answers['i2'] || 0);
        return q.scorer(blogTraffic + socialFollowers + githubFollowers);
      }
      return scoreQuestion(q, answers[q.id]);
    });
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

  // Layer 3: trigger AI verification
  const handleVerify = async () => {
    setVerifying(true);
    setVerification(null);
    try {
      const resp = await fetch(`${API_BASE}/api/acp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          github_data: githubData,
          evidence_urls: evidenceUrls,
          auto_filled: autoFilledFields,
          dim_scores: dimScores,
          total_score: totalScore,
          grade: grade.label,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Verification failed');
      setVerification(data);
    } catch (e: any) {
      setVerification({ parse_error: true, raw: e.message });
    } finally {
      setVerifying(false);
    }
  };

  const handleCalculate = () => {
    setShowResults(true);
    setVerification(null);
    setTimeout(() => {
      document.getElementById('acp-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleShare = () => {
    const lines = [
      `AI Collaboration Portfolio`,
      ``,
      `${grade.emoji} ${grade.label} \u2014 ${totalScore}/100`,
      `"${grade.oneLiner}"`,
      ``,
      ...DIMS.map(d => {
        const insight = getDimInsight(d.id, dimScores[d.id]);
        return `${d.emoji} ${d.label}: ${dimScores[d.id]}/100 (${insight.level})`;
      }),
    ];
    if (verification?.verified_score !== undefined) {
      lines.push('', `AI-Verified Score: ${verification.verified_score}/100`);
    }
    if (githubData?.username) {
      lines.push(`GitHub: github.com/${githubData.username}`);
    }
    lines.push('', `paulkuo.tw/tools/ai-collab-portfolio/`);

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const resp = await fetch(`${API_BASE}/api/acp/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers, dim_scores: dimScores, weights,
          github_data: githubData, github_username: githubData?.username || null,
          verification, evidence_urls: evidenceUrls, auto_filled: autoFilledFields,
          total_score: totalScore, grade: grade.label,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Save failed');
      setSavedId(data.id);
      setOwnerToken(data.owner_token);
      try { localStorage.setItem(`acp_token_${data.id}`, data.owner_token); } catch {}
    } catch (e: any) {
      setSaveError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const portfolioUrl = savedId ? `https://paulkuo.tw/portfolio/${savedId}` : null;

  const verifiedDimScores = verification?.dimension_notes
    ? Object.fromEntries(DIMS.map(d => [d.id, verification.dimension_notes[d.id]?.adjusted_score ?? dimScores[d.id]]))
    : undefined;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px', background: C.bg, minHeight: '100vh', color: C.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Hero */}
      <div style={{ marginBottom: 32, textAlign: 'center' as const }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Portfolio Builder</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: C.white, margin: '0 0 12px', lineHeight: 1.2 }}>
          AI Collaboration Portfolio
        </h1>
        <p style={{ fontSize: 15, color: C.muted, margin: 0, lineHeight: 1.6 }}>
          Measure what you build, not what you know.<br />
          5 dimensions. Auto-verified. Takes ~5 min with GitHub.
        </p>

        {/* Layer badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' as const }}>
          <span style={{ fontSize: 11, padding: '3px 10px', background: C.primary + '22', color: C.primary, borderRadius: 12, fontWeight: 600 }}>
            Layer 1: Self-Assessment
          </span>
          <span style={{ fontSize: 11, padding: '3px 10px', background: C.accent + '22', color: C.accent, borderRadius: 12, fontWeight: 600 }}>
            Layer 2: GitHub Auto-Fetch
          </span>
          <span style={{ fontSize: 11, padding: '3px 10px', background: C.success + '22', color: C.success, borderRadius: 12, fontWeight: 600 }}>
            Layer 3: AI Verification
          </span>
        </div>

        {answeredCount > 0 && (
          <div style={{ marginTop: 12, fontSize: 12, color: C.dimmed }}>{answeredCount} / {totalQuestions} answered</div>
        )}
      </div>

      {/* Layer 2: GitHub Connect */}
      <GitHubConnect onDataLoaded={handleGitHubData} autoFilledFields={autoFilledFields} />

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
          autoFilledFields={autoFilledFields}
          evidenceUrls={evidenceUrls}
          onEvidenceUrl={handleEvidenceUrl}
        />
      ))}

      {/* Weight adjustment */}
      <div style={{ ...S.card, marginBottom: 16 }}>
        <button
          onClick={() => setShowWeights(!showWeights)}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.white }}>Weight Adjustment</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Default: Command 25% / Delivery 25% / Leverage 20% / Quality 15% / Influence 15%</div>
          </div>
          <span style={{ color: C.muted, fontSize: 18, transform: showWeights ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>{'\u25BE'}</span>
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
        Build My Portfolio
      </button>

      {/* Results */}
      {showResults && (
        <div id="acp-results" style={{ marginTop: 32 }}>
          <div style={{ textAlign: 'center' as const, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Results</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.white, margin: 0 }}>Your AI Collaboration Profile</h2>
          </div>

          {/* Grade badge + total score + one-liner */}
          <div style={{ ...S.card, textAlign: 'center' as const, padding: 32 }}>
            <div style={{ display: 'inline-block', padding: '6px 16px', background: grade.color + '22', border: `1px solid ${grade.color}44`, borderRadius: 20, fontSize: 11, fontWeight: 700, color: grade.color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 16 }}>
              Level {GRADES.length - GRADES.indexOf(grade)} of {GRADES.length}
            </div>
            <div style={{ fontSize: 52, marginBottom: 8 }}>{grade.emoji}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: grade.color, marginBottom: 4 }}>{grade.label}</div>
            <div style={{ fontSize: 14, color: C.muted, marginBottom: 16 }}>{grade.desc}</div>
            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 28px', marginBottom: 20 }}>
              <div style={{ fontSize: 44, fontWeight: 900, color: C.white, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{totalScore}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>/ 100</div>
            </div>
            {/* One-liner positioning statement */}
            <div style={{ fontSize: 15, color: C.text, fontStyle: 'italic', lineHeight: 1.7, padding: '14px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, borderLeft: `3px solid ${grade.color}`, textAlign: 'left' as const, maxWidth: 520, margin: '0 auto' }}>
              "{grade.oneLiner}"
            </div>
          </div>

          {/* Radar chart */}
          <div style={{ ...S.card, padding: 24 }}>
            <RadarChart scores={dimScores} verifiedScores={verifiedDimScores} />
            {verifiedDimScores && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.muted }}>
                  <div style={{ width: 12, height: 2, background: 'rgba(74,144,217,0.8)' }} /> Self-reported
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.muted }}>
                  <div style={{ width: 12, height: 2, background: C.success, opacity: 0.5 }} /> AI-verified
                </div>
              </div>
            )}
          </div>

          {/* Dimension bars */}
          <div style={S.card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 16, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Dimension Breakdown</div>
            {DIMS.map(d => (
              <ScoreBar
                key={d.id}
                label={d.label}
                emoji={d.emoji}
                score={dimScores[d.id]}
                color={d.color}
                verifiedScore={verifiedDimScores?.[d.id]}
              />
            ))}
          </div>

          {/* Dimension Insight Cards */}
          <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 12, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Dimension Deep Dive</div>
          {DIMS.map(d => {
            const score = dimScores[d.id];
            const insight = getDimInsight(d.id, score);
            const verifiedScore = verifiedDimScores?.[d.id];
            const verNote = verification?.dimension_notes?.[d.id];
            const sortedDims = [...DIMS].sort((a, b) => dimScores[b.id] - dimScores[a.id]);
            const rank = sortedDims.findIndex(sd => sd.id === d.id) + 1;
            const isStrongest = rank === 1;
            const isWeakest = rank === DIMS.length;
            return (
              <div key={d.id} style={{ ...S.card, borderLeft: `3px solid ${d.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{d.emoji}</span>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: d.color }}>{d.label}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{d.desc}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' as const }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: d.color, fontFamily: "'JetBrains Mono', monospace" }}>{score}</div>
                    {verifiedScore !== undefined && verifiedScore !== score && (
                      <div style={{ fontSize: 11, color: C.success }}>Verified: {verifiedScore}</div>
                    )}
                  </div>
                </div>

                {/* Relative position badges */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' as const }}>
                  <span style={{ fontSize: 10, padding: '2px 8px', background: (insight.level === 'Strong' ? C.success : insight.level === 'Developing' ? C.warning : C.danger) + '22', color: insight.level === 'Strong' ? C.success : insight.level === 'Developing' ? C.warning : C.danger, borderRadius: 4, fontWeight: 600 }}>
                    {insight.level}
                  </span>
                  <span style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(255,255,255,0.06)', color: C.muted, borderRadius: 4, fontWeight: 600 }}>
                    #{rank} of {DIMS.length}
                  </span>
                  {isStrongest && <span style={{ fontSize: 10, padding: '2px 8px', background: C.success + '22', color: C.success, borderRadius: 4, fontWeight: 600 }}>Strongest</span>}
                  {isWeakest && <span style={{ fontSize: 10, padding: '2px 8px', background: C.warning + '22', color: C.warning, borderRadius: 4, fontWeight: 600 }}>Needs Focus</span>}
                  <span style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(255,255,255,0.06)', color: C.muted, borderRadius: 4, fontWeight: 600 }}>
                    Weight: {weights[d.id]}%
                  </span>
                </div>

                {/* Insight text */}
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, marginBottom: 10 }}>
                  {insight.summary}
                </div>

                {/* AI verification note if available */}
                {verNote && (
                  <div style={{ fontSize: 12, color: C.muted, padding: '8px 12px', background: 'rgba(16,185,129,0.04)', borderRadius: 6, borderLeft: `2px solid ${C.success}33`, marginBottom: 10 }}>
                    <span style={{ color: C.success, fontWeight: 600 }}>AI Note:</span> {verNote.note}
                  </div>
                )}

                {/* Improvement suggestion */}
                {score < 70 && (
                  <div style={{ fontSize: 12, color: C.accent, padding: '8px 12px', background: C.accent + '08', borderRadius: 6, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ flexShrink: 0 }}>&#x2794;</span>
                    <span>{DIM_INSIGHTS[d.id].improve}</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Evidence Transparency */}
          {(() => {
            const allQs = DIMS.flatMap(d => QUESTIONS[d.id]);
            const answered = allQs.filter(q => answers[q.id] !== undefined && answers[q.id] !== '');
            const autoCount = answered.filter(q => autoFilledFields.includes(q.id)).length;
            const evidencedCount = answered.filter(q => !autoFilledFields.includes(q.id) && evidenceUrls[q.id]).length;
            const selfCount = answered.length - autoCount - evidencedCount;
            const total = answered.length || 1;
            return (
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
                {/* Stacked bar */}
                <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.05)' }}>
                  {autoCount > 0 && <div style={{ width: `${(autoCount / total) * 100}%`, background: C.success, transition: 'width 0.4s' }} />}
                  {evidencedCount > 0 && <div style={{ width: `${(evidencedCount / total) * 100}%`, background: C.accent, transition: 'width 0.4s' }} />}
                  {selfCount > 0 && <div style={{ width: `${(selfCount / total) * 100}%`, background: C.dimmed, transition: 'width 0.4s' }} />}
                </div>
              </div>
            );
          })()}

          {/* Layer 3: AI Verification */}
          {verification && <VerificationPanel verification={verification} />}

          {/* Verify button */}
          {!verification && (
            <button
              onClick={handleVerify}
              disabled={verifying}
              style={{
                ...S.btnPrimary,
                background: verifying
                  ? C.cardBorder
                  : `linear-gradient(135deg, ${C.success}, ${C.accent})`,
                marginBottom: 16,
              }}
            >
              {verifying ? 'Running AI Verification...' : 'Run AI Verification (Layer 3)'}
            </button>
          )}

          {/* Grade scale legend */}
          <div style={{ ...S.card, padding: 16 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Grade Scale</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
              {GRADES.map(g => (
                <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: grade.label === g.label ? 1 : 0.45 }}>
                  <span style={{ fontSize: 16 }}>{g.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: grade.label === g.label ? 700 : 400, color: grade.label === g.label ? g.color : C.muted, minWidth: 100 }}>{g.label}</span>
                  <span style={{ fontSize: 12, color: C.dimmed }}>{g.desc}</span>
                  <span style={{ fontSize: 11, color: C.dimmed, marginLeft: 'auto' }}>{g.min}\u2013{g.min === 0 ? 20 : g.min === 21 ? 40 : g.min === 41 ? 60 : g.min === 61 ? 80 : 100}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Save & Share */}
          {!savedId ? (
            <div style={{ marginTop: 8 }}>
              <button onClick={handleSave} disabled={saving} style={{ ...S.btnPrimary, background: saving ? C.cardBorder : `linear-gradient(135deg, ${C.primary}, ${C.purple})`, marginBottom: 8 }}>
                {saving ? 'Saving...' : 'Save & Get Shareable Link'}
              </button>
              {saveError && <div style={{ fontSize: 13, color: C.danger, marginBottom: 8 }}>{saveError}</div>}
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={handleShare} style={{ flex: 1, ...S.btnSecondary }}>
                  {copySuccess ? 'Copied!' : 'Copy Results'}
                </button>
                <button onClick={() => {
                  setShowResults(false); setAnswers({}); setAutoFilledFields([]); setEvidenceUrls({});
                  setGithubData(null); setVerification(null); setSavedId(null); setOwnerToken(null);
                  setOpenDim('command'); window.scrollTo({ top: 0, behavior: 'smooth' });
                }} style={{ flex: 1, ...S.btnSecondary }}>
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div style={{ ...S.card, border: `1px solid ${C.success}33`, marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>&#x1F517;</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.white }}>Portfolio Saved</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Share your AI Collaboration Portfolio with anyone</div>
                </div>
              </div>
              {/* Shareable URL */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input type="text" readOnly value={portfolioUrl || ''} style={{ ...S.input, flex: 1, fontSize: 13, background: '#0d0d1a' }} onClick={e => (e.target as HTMLInputElement).select()} />
                <button onClick={() => { navigator.clipboard.writeText(portfolioUrl || ''); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }} style={{ padding: '10px 16px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              </div>
              {/* Social share buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${grade.emoji} ${grade.label} — ${totalScore}/100 on the AI Collaboration Portfolio\n\n"${grade.oneLiner}"\n\n${portfolioUrl}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', background: '#000', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', minWidth: 100 }}
                >
                  <span style={{ fontFamily: 'serif', fontSize: 15, fontWeight: 900 }}>{'\uD835\uDD4F'}</span> Post
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(portfolioUrl || '')}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', background: '#0A66C2', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', minWidth: 100 }}
                >
                  <span style={{ fontWeight: 900 }}>in</span> Share
                </a>
                <a
                  href={`https://www.threads.net/intent/post?text=${encodeURIComponent(`${grade.emoji} ${grade.label} — ${totalScore}/100\n\n"${grade.oneLiner}"\n\n${portfolioUrl}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', background: '#1a1a1a', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', border: '1px solid #333', minWidth: 100 }}
                >
                  <span style={{ fontSize: 15 }}>{'\u25C9'}</span> Threads
                </a>
              </div>
              {/* Secondary actions */}
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button onClick={handleShare} style={{ flex: 1, ...S.btnSecondary, fontSize: 12 }}>
                  {copySuccess ? 'Copied!' : 'Copy as Text'}
                </button>
                <button onClick={() => {
                  setShowResults(false); setAnswers({}); setAutoFilledFields([]); setEvidenceUrls({});
                  setGithubData(null); setVerification(null); setSavedId(null); setOwnerToken(null);
                  setOpenDim('command'); window.scrollTo({ top: 0, behavior: 'smooth' });
                }} style={{ flex: 1, ...S.btnSecondary, fontSize: 12 }}>
                  Start Over
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
