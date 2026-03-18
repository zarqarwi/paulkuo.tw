import { useState, useRef, useEffect } from 'react';
import type { Lang, Stage } from './types';
import { DIMENSIONS, STAGES, BUILDER_SIGNALS, GATE_QUESTIONS, VETOES, getVerdict, getSignalsForDim, calcDimScore, calcWeightedTotal, t } from './data';
import RadarChart from './RadarChart';

/* ── Light theme styles ── */
const S = {
  card: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 24, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' } as React.CSSProperties,
  input: { width: '100%', padding: '11px 14px', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: 8, color: '#1a1a1a', fontSize: 15, outline: 'none', fontFamily: 'inherit' } as React.CSSProperties,
  btnP: { padding: '12px 28px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
  btnG: { padding: '12px 20px', background: 'transparent', border: '1px solid #d1d5db', color: '#6b7280', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' } as React.CSSProperties,
  label: { fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 } as React.CSSProperties,
};

/* ── Score Slider ── */
function ScoreSlider({ value, onChange, color }: { value?: number; onChange: (v: number) => void; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <input
        type="range" min="0" max="10" step="1"
        value={value ?? 5}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: color }}
      />
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color, minWidth: 28, textAlign: 'right' }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

/* ── Main App ── */
export default function ScorecardApp() {
  const [lang, setLang] = useState<Lang>('zh-TW');
  const [mode, setMode] = useState<'quick' | 'full'>('quick');
  const [step, setStep] = useState(0);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [stage, setStage] = useState<Stage | ''>('');
  const [builderProfile, setBuilderProfile] = useState<Record<string, string>>({});
  const [gates, setGates] = useState<Record<string, boolean>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [dimEvidence, setDimEvidence] = useState<Record<string, string>>({});
  const [vetoes, setVetoes] = useState<Record<string, boolean>>({});
  const [activeDim, setActiveDim] = useState('A');
  const [quickInput, setQuickInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [isQuickResult, setIsQuickResult] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<{ level: string; note: string } | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [advice, setAdvice] = useState('');
  const [githubMeta, setGithubMeta] = useState<Record<string, any> | null>(null);
  const [detectedType, setDetectedType] = useState<'text' | 'github_url' | 'website_url'>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => { topRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [step, mode]);

  const i = (obj: { 'zh-TW': string; en: string }) => obj[lang];

  // Compute dimension scores
  const dimScores: Record<string, number> = {};
  DIMENSIONS.forEach(d => { dimScores[d.id] = calcDimScore(d, stage, scores); });
  const weightedTotal = calcWeightedTotal(dimScores);
  const stageVetoes = VETOES.filter(v => v.stages.includes(stage as Stage));
  const anyVeto = stageVetoes.some(v => vetoes[v.id]);
  const verdict = getVerdict(weightedTotal, anyVeto);

  // Dimension gap warning
  const dimVals = Object.values(dimScores).filter(v => v > 0);
  const hasGapWarning = dimVals.length >= 2 && (Math.max(...dimVals) - Math.min(...dimVals)) > 4;

  const navSteps = [t('step0', lang), t('step1', lang), t('step2', lang), t('step3', lang), t('step4', lang)];

  /* ── Export Markdown ── */
  const exportMd = () => {
    const stageLabel = STAGES.find(s => s.id === stage);
    let md = `# ${projectName || 'Product'} — Builder's Scorecard\n\n`;
    md += `> ${lang === 'zh-TW' ? '評估日期' : 'Date'}: ${new Date().toISOString().slice(0, 10)} | ${lang === 'zh-TW' ? '產品階段' : 'Stage'}: ${stageLabel ? i(stageLabel.label) : '—'}\n\n`;
    md += `## ${verdict.emoji} ${lang === 'zh-TW' ? '加權總分' : 'Weighted Total'}: ${weightedTotal.toFixed(2)} / 10 — ${i(verdict.label)}\n\n`;
    md += `${i(verdict.desc)}\n\n`;
    md += `| ${lang === 'zh-TW' ? '維度' : 'Dimension'} | ${lang === 'zh-TW' ? '權重' : 'Weight'} | ${lang === 'zh-TW' ? '分數' : 'Score'} | ${lang === 'zh-TW' ? '加權' : 'Weighted'} |\n|------|------|------|------|\n`;
    DIMENSIONS.forEach(d => {
      md += `| ${d.icon} ${d.id}. ${i(d.name)} | ${d.weight}% | ${dimScores[d.id].toFixed(1)} | ${(dimScores[d.id] * d.weight / 100).toFixed(2)} |\n`;
    });
    md += `| **Total** | 100% | — | **${weightedTotal.toFixed(2)}** |\n\n`;
    if (anyVeto) {
      md += `### ⚠️ ${t('vetoTriggered', lang)}\n`;
      stageVetoes.filter(v => vetoes[v.id]).forEach(v => { md += `- **${i(v.label)}**: ${i(v.desc)}\n`; });
      md += '\n';
    }
    if (hasGapWarning) {
      md += `### ⚠️ ${t('gapWarning', lang)}\n\n`;
    }
    DIMENSIONS.forEach(d => {
      md += `### ${d.icon} ${d.id}. ${i(d.name)}\n`;
      const sigs = getSignalsForDim(d, stage);
      sigs.forEach(s => {
        md += `- **${i(s.label)}**: ${scores[s.id] !== undefined ? scores[s.id] + '/10' : '—'}`;
        if (notes[s.id]) md += ` — ${notes[s.id]}`;
        md += '\n';
      });
      if (dimEvidence[d.id + '_ev']) md += `\n> ${t('evidence', lang)}: ${dimEvidence[d.id + '_ev']}\n`;
      if (dimEvidence[d.id + '_risk']) md += `> ${t('risk', lang)}: ${dimEvidence[d.id + '_risk']}\n`;
      md += '\n';
    });
    md += `---\n\n*[Builder's Scorecard](https://paulkuo.tw/tools/builders-scorecard) by Paul Kuo · ${t('credit', lang)} [OSS Investment Scorecard](https://github.com/el09xccxy-stack/oss-investment-scorecard)*\n`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(projectName || 'product').replace(/\s+/g, '-')}-scorecard-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /* ── Export JSON ── */
  const exportJson = () => {
    const data = {
      projectName, projectDesc, stage, mode, lang,
      builderProfile, gates, scores, notes, dimEvidence, vetoes,
      dimScores, weightedTotal: +weightedTotal.toFixed(2),
      verdict: { emoji: verdict.emoji, label: i(verdict.label), desc: i(verdict.desc) },
      anyVeto, hasGapWarning,
      createdAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(projectName || 'product').replace(/\s+/g, '-')}-scorecard-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /* ── Input type detection ── */
  const detectType = (val: string): 'text' | 'github_url' | 'website_url' => {
    const trimmed = val.trim();
    if (/^https?:\/\/github\.com\//i.test(trimmed)) return 'github_url';
    if (/^https?:\/\//i.test(trimmed)) return 'website_url';
    return 'text';
  };

  const onQuickInputChange = (val: string) => {
    setQuickInput(val);
    setDetectedType(detectType(val));
  };

  const onReadmeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(md|txt|markdown)$/i)) {
      setAiError(lang === 'zh-TW' ? '請上傳 .md 或 .txt 檔案' : 'Please upload a .md or .txt file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setQuickInput(content);
      setDetectedType('text');
      // Auto-trigger
      onQuickStartWith(content, 'readme_upload');
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  /* ── Quick Mode handler — AI evaluate ── */
  const onQuickStartWith = async (inputOverride?: string, typeOverride?: string) => {
    const input = (inputOverride || quickInput).trim();
    if (!input) return;
    setAiLoading(true); setAiError('');
    const inputType = typeOverride || detectType(input);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);
      const resp = await fetch('https://api.paulkuo.tw/api/scorecard/evaluate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectName: projectName || '', projectDesc: projectDesc || '', stage: stage || undefined, inputContent: input, inputType, lang }), signal: controller.signal });
      clearTimeout(timeout);
      if (!resp.ok) { const err = await resp.json().catch(() => ({ message: 'AI 評估暫時無法完成' })); throw new Error(err.message || `API error ${resp.status}`); }
      const result = await resp.json();
      if (result.githubMeta) setGithubMeta(result.githubMeta);
      const detectedStage = result.stage_detected || stage || 'concept';
      if (!stage) setStage(detectedStage as Stage);
      const newScores: Record<string, number> = {}; const newNotes: Record<string, string> = {};
      if (result.signals) { for (const [id, sig] of Object.entries(result.signals) as [string, { score: number; reason: string }][]) { newScores[id] = sig.score; newNotes[id] = sig.reason || ''; } }
      setScores(newScores); setNotes(newNotes);
      if (result.gates) { const newGates: Record<string, boolean> = {}; for (const [id, g] of Object.entries(result.gates) as [string, { pass: boolean; reason: string }][]) { newGates[id] = g.pass; } setGates(newGates); }
      if (result.vetoes) { const newVetoes: Record<string, boolean> = {}; for (const [id, val] of Object.entries(result.vetoes)) { newVetoes[id] = val as boolean; } setVetoes(newVetoes); }
      if (result.confidence) { setAiConfidence({ level: result.confidence, note: result.confidence_note || '' }); }
      setIsQuickResult(true); setAdvice(''); setMode('full'); setStep(4);
    } catch (e: any) {
      setAiError(e.name === 'AbortError' ? (lang === 'zh-TW' ? 'AI 評估超時，請切換到完整模式手動評估' : 'AI evaluation timed out.') : (e.message || 'Unknown error'));
    } finally { setAiLoading(false); }
  };

  const onQuickStart = () => onQuickStartWith();

  /* ── AI Advisor ── */
  const onRequestAdvice = async () => {
    setAdviceLoading(true); setAdvice('');
    try {
      const vetoList = VETOES.filter(v => v.stages.includes(stage as Stage) && vetoes[v.id]).map(v => i(v.label));
      const gateList = GATE_QUESTIONS.map(g => `${g.id}: ${gates[g.id] ? '✓' : '✗'}`).join(', ');
      const resp = await fetch('https://api.paulkuo.tw/api/scorecard/advise', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectName, projectDesc, stage, lang, builderProfile, totalScore: +weightedTotal.toFixed(2), verdict: i(verdict.label), dimScores, vetoesTriggered: vetoList.length > 0 ? vetoList.join('、') : '無', gatesSummary: gateList }) });
      if (!resp.ok) throw new Error('fail');
      const data = await resp.json();
      setAdvice(data.advice || '');
    } catch { setAdvice(lang === 'zh-TW' ? '⚠️ AI 顧問暫時無法回應，請稍後再試。' : '⚠️ AI advisor temporarily unavailable.'); }
    finally { setAdviceLoading(false); }
  };

  return (
    <>
      <style>{`
        .sc-root { --text-dim: #6b7280; max-width: 700px; margin: 0 auto; padding: 20px 16px; min-height: 60vh; color: #1a1a1a; font-family: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, sans-serif; }
        .sc-root *, .sc-root *::before, .sc-root *::after { box-sizing: border-box; }
        .sc-root input, .sc-root textarea, .sc-root select { font-family: inherit; }
        .sc-root ::selection { background: #2563eb; color: #fff; }
        .sc-root input[type="range"] { -webkit-appearance: none; width: 100%; height: 6px; background: #e5e7eb; border-radius: 3px; outline: none; cursor: pointer; }
        .sc-root input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%; background: var(--thumb-color, #2563eb); border: 2.5px solid #fff; box-shadow: 0 0 0 2px var(--thumb-color, #2563eb); }
        .sc-fi { animation: sc-fi .35s ease both; }
        @keyframes sc-fi { from { opacity: 0; transform: translateY(10px); } }
      `}</style>

      <div ref={topRef} className="sc-root">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28, paddingTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button
              onClick={() => setLang(lang === 'zh-TW' ? 'en' : 'zh-TW')}
              style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, color: '#6b7280', cursor: 'pointer' }}
            >
              {lang === 'zh-TW' ? 'EN' : '中文'}
            </button>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, color: '#2563eb', textTransform: 'uppercase', marginBottom: 6 }}>paulkuo.tw</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.3, marginBottom: 6, color: '#1a1a1a' }}>
            {t('title', lang)}
          </h1>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#6b7280', margin: 0 }}>{t('subtitle', lang)}</p>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 6, fontStyle: 'italic' }}>{t('tagline', lang)}</p>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
            {t('credit', lang)}{' '}
            <a href="https://github.com/el09xccxy-stack/oss-investment-scorecard" target="_blank" rel="noopener" style={{ color: '#2563eb', textDecoration: 'none' }}>OSS Investment Scorecard</a>
            {' '}· v2.1
          </p>
        </div>

        {/* ═══════ Quick Mode ═══════ */}
        {mode === 'quick' && (
          <div className="sc-fi">
            <div style={S.card}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14, color: '#1a1a1a' }}>{t('quickTitle', lang)}</h2>
              <textarea
                value={quickInput}
                onChange={e => onQuickInputChange(e.target.value)}
                placeholder={t('quickPlaceholder', lang)}
                rows={4}
                style={{ ...S.input, resize: 'vertical', fontSize: 14, marginBottom: 8 }}
              />
              {/* Input type indicator */}
              {quickInput.trim() && detectedType !== 'text' && (
                <div style={{ fontSize: 12, color: detectedType === 'github_url' ? '#059669' : '#2563eb', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {detectedType === 'github_url' ? '🔗 GitHub URL — 將自動抓取結構化數據 + README' : '🌐 Website URL — 將自動擷取網頁內容'}
                </div>
              )}
              {aiError && <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{aiError}</p>}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button style={{ ...S.btnP, opacity: (!quickInput.trim() || aiLoading) ? 0.5 : 1 }} disabled={!quickInput.trim() || aiLoading} onClick={onQuickStart}>
                  {aiLoading
                    ? (detectedType === 'github_url'
                      ? (lang === 'zh-TW' ? '正在抓取 GitHub 數據並分析⋯' : 'Fetching GitHub data & analyzing...')
                      : (lang === 'zh-TW' ? 'AI 正在分析你的產品⋯' : 'AI is analyzing...'))
                    : t('quickBtn', lang)}
                </button>
                <button
                  style={{ ...S.btnG, fontSize: 13 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={aiLoading}
                >
                  {lang === 'zh-TW' ? '📄 上傳 README' : '📄 Upload README'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.txt,.markdown"
                  style={{ display: 'none' }}
                  onChange={onReadmeUpload}
                />
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button
                onClick={() => { setMode('full'); setStep(0); }}
                style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
              >
                {t('orFull', lang)}
              </button>
            </div>
          </div>
        )}

        {/* ═══════ Full Mode ═══════ */}
        {mode === 'full' && (
          <>
            {/* Step Nav */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 24, flexWrap: 'wrap' }}>
              {navSteps.map((s, idx) => (
                <button key={idx} onClick={() => { if (idx <= step) setStep(idx); }} style={{
                  padding: '5px 14px', fontSize: 12, fontWeight: idx === step ? 700 : 400,
                  color: idx === step ? '#fff' : idx < step ? '#2563eb' : '#555',
                  background: idx === step ? '#2563eb' : 'transparent',
                  border: 'none', borderRadius: 16, cursor: idx <= step ? 'pointer' : 'default',
                }}>
                  {s}
                </button>
              ))}
            </div>

            {/* Back to quick mode link */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <button onClick={() => setMode('quick')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 12 }}>
                {t('backToQuick', lang)}
              </button>
            </div>

            {/* ── Step 0: Basic Info ── */}
            {step === 0 && (
              <div className="sc-fi">
                <div style={S.card}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 18, color: '#1a1a1a' }}>🛠️ {t('step0', lang)}</h2>
                  <div style={{ marginBottom: 14 }}>
                    <label style={S.label}>{t('projectName', lang)}</label>
                    <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder={t('projectNamePh', lang)} style={S.input} />
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={S.label}>{t('projectDesc', lang)}</label>
                    <input value={projectDesc} onChange={e => setProjectDesc(e.target.value)} placeholder={t('projectDescPh', lang)} style={S.input} />
                  </div>
                  <label style={{ ...S.label, marginBottom: 10 }}>{t('stageLabel', lang)}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                    {STAGES.map(s => (
                      <button key={s.id} onClick={() => setStage(s.id)} style={{
                        padding: '12px 14px', textAlign: 'left',
                        background: stage === s.id ? 'rgba(37,99,235,0.12)' : '#f9fafb',
                        border: `1px solid ${stage === s.id ? '#2563eb' : '#e5e7eb'}`,
                        borderRadius: 10, cursor: 'pointer',
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: stage === s.id ? '#2563eb' : '#1a1a1a' }}>{i(s.label)}</div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{i(s.desc)}</div>
                      </button>
                    ))}
                  </div>
                  <label style={{ ...S.label, marginBottom: 10 }}>{t('builderProfile', lang)}</label>
                  {BUILDER_SIGNALS.map(s => (
                    <div key={s.id} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#1a1a1a' }}>{i(s.label)}</div>
                      <input
                        value={builderProfile[s.id] || ''}
                        onChange={e => setBuilderProfile(p => ({ ...p, [s.id]: e.target.value }))}
                        placeholder={i(s.desc)}
                        style={{ ...S.input, fontSize: 13, padding: '8px 12px' }}
                      />
                    </div>
                  ))}
                </div>
                <button
                  style={{ ...S.btnP, opacity: (!projectName || !stage) ? 0.4 : 1 }}
                  disabled={!projectName || !stage}
                  onClick={() => setStep(1)}
                >
                  {t('next', lang)}
                </button>
              </div>
            )}

            {/* ── Step 1: Gate Check ── */}
            {step === 1 && (
              <div className="sc-fi">
                <div style={S.card}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4, color: '#1a1a1a' }}>🚦 {t('gateTitle', lang)}</h2>
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 18 }}>{t('gateDesc', lang)}</p>
                  {GATE_QUESTIONS.map(g => (
                    <div key={g.id} style={{ marginBottom: 16, padding: 16, background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', marginBottom: 3 }}>{i(g.label)}</div>
                      <div style={{ fontSize: 14, marginBottom: 10, lineHeight: 1.6, color: '#1a1a1a' }}>{i(g.question)}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[true, false].map(val => (
                          <button key={String(val)} onClick={() => setGates(p => ({ ...p, [g.id]: val }))} style={{
                            padding: '5px 20px', fontSize: 13, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
                            border: `1px solid ${gates[g.id] === val ? (val ? '#059669' : '#dc2626') : '#d1d5db'}`,
                            background: gates[g.id] === val ? (val ? 'rgba(5,150,105,0.12)' : 'rgba(220,38,38,0.12)') : 'transparent',
                            color: gates[g.id] === val ? (val ? '#34d399' : '#f87171') : '#6b6b78',
                          }}>
                            {val ? t('yes', lang) : t('no', lang)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={S.btnG} onClick={() => setStep(0)}>←</button>
                  <button style={S.btnP} onClick={() => setStep(2)}>{t('next', lang)}</button>
                </div>
              </div>
            )}

            {/* ── Step 2: Five Dimensions Scoring ── */}
            {step === 2 && (
              <div className="sc-fi">
                {/* Dimension tabs */}
                <div style={{ display: 'flex', gap: 5, marginBottom: 14, flexWrap: 'wrap' }}>
                  {DIMENSIONS.map(d => {
                    const sigs = getSignalsForDim(d, stage);
                    const filled = sigs.filter(s => scores[s.id] !== undefined).length;
                    return (
                      <button key={d.id} onClick={() => setActiveDim(d.id)} style={{
                        padding: '7px 14px', fontSize: 12, fontWeight: activeDim === d.id ? 700 : 500,
                        background: activeDim === d.id ? d.color : '#f3f4f6',
                        color: activeDim === d.id ? '#fff' : '#6b6b78',
                        border: `1px solid ${activeDim === d.id ? d.color : '#e5e7eb'}`,
                        borderRadius: 8, cursor: 'pointer',
                      }}>
                        {d.icon} {d.id} <span style={{ opacity: 0.6, marginLeft: 4 }}>{filled}/{sigs.length}</span>
                      </button>
                    );
                  })}
                </div>

                {(() => {
                  const dim = DIMENSIONS.find(d => d.id === activeDim)!;
                  const sigs = getSignalsForDim(dim, stage);
                  const filled = sigs.filter(s => scores[s.id] !== undefined);
                  const avg = filled.length > 0 ? filled.reduce((sum, s) => sum + scores[s.id], 0) / filled.length : 0;

                  return (
                    <div style={S.card}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                        <span style={{ fontSize: 22 }}>{dim.icon}</span>
                        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{dim.id}. {i(dim.name)}</h2>
                      </div>
                      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>{dim.nameEn} · {t('weight', lang)} {dim.weight}%</p>
                      <p style={{ fontSize: 13, color: dim.color, marginBottom: 18, fontWeight: 500 }}>{i(dim.principle)}</p>

                      {dim.id === 'D' && !stage && (
                        <p style={{ color: '#f87171', fontSize: 13 }}>{t('selectStageFirst', lang)}</p>
                      )}

                      {sigs.map(sig => (
                        <div key={sig.id} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid #e5e7eb' }}>
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, color: '#1a1a1a' }}>{i(sig.label)}</div>
                          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{i(sig.desc)}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>
                            <span>{i(sig.weak)}</span><span>{i(sig.strong)}</span>
                          </div>
                          <div style={{ ['--thumb-color' as string]: dim.color }}>
                            <ScoreSlider value={scores[sig.id]} onChange={v => setScores(p => ({ ...p, [sig.id]: v }))} color={dim.color} />
                          </div>
                          <input
                            value={notes[sig.id] || ''}
                            onChange={e => setNotes(p => ({ ...p, [sig.id]: e.target.value }))}
                            placeholder={t('notePh', lang)}
                            style={{ ...S.input, marginTop: 6, fontSize: 12, padding: '6px 10px', background: '#f9fafb' }}
                          />
                        </div>
                      ))}

                      <div style={{ marginTop: 4 }}>
                        <label style={S.label}>{t('evidence', lang)}</label>
                        <textarea
                          value={dimEvidence[dim.id + '_ev'] || ''}
                          onChange={e => setDimEvidence(p => ({ ...p, [dim.id + '_ev']: e.target.value }))}
                          placeholder={t('evidencePh', lang)}
                          rows={2}
                          style={{ ...S.input, resize: 'vertical', fontSize: 13 }}
                        />
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <label style={S.label}>{t('risk', lang)}</label>
                        <textarea
                          value={dimEvidence[dim.id + '_risk'] || ''}
                          onChange={e => setDimEvidence(p => ({ ...p, [dim.id + '_risk']: e.target.value }))}
                          placeholder={t('riskPh', lang)}
                          rows={2}
                          style={{ ...S.input, resize: 'vertical', fontSize: 13 }}
                        />
                      </div>

                      <div style={{ marginTop: 14, padding: 12, background: '#f9fafb', borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{t('dimAvg', lang)} {dim.id}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                          <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${(avg / 10) * 100}%`, height: '100%', background: dim.color, borderRadius: 3, transition: 'width .3s' }} />
                          </div>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: dim.color }}>{avg.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={S.btnG} onClick={() => setStep(1)}>←</button>
                  <button style={S.btnP} onClick={() => setStep(3)}>{t('next', lang)}</button>
                </div>
              </div>
            )}

            {/* ── Step 3: Vetoes ── */}
            {step === 3 && (
              <div className="sc-fi">
                <div style={S.card}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4, color: '#1a1a1a' }}>⛔ {t('vetoTitle', lang)}</h2>
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 18 }}>
                    {t('vetoDesc', lang)} ({STAGES.find(s => s.id === stage) ? i(STAGES.find(s => s.id === stage)!.label) : ''})
                  </p>
                  {stageVetoes.map(v => (
                    <label key={v.id} style={{
                      display: 'flex', gap: 12, padding: 14, marginBottom: 8, borderRadius: 10, cursor: 'pointer',
                      background: vetoes[v.id] ? 'rgba(220,38,38,0.06)' : '#f9fafb',
                      border: `1px solid ${vetoes[v.id] ? 'rgba(220,38,38,0.25)' : '#e5e7eb'}`,
                    }}>
                      <input type="checkbox" checked={vetoes[v.id] || false} onChange={e => setVetoes(p => ({ ...p, [v.id]: e.target.checked }))} style={{ marginTop: 2, accentColor: '#dc2626' }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: vetoes[v.id] ? '#f87171' : '#1a1a1a' }}>{i(v.label)}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{i(v.desc)}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={S.btnG} onClick={() => setStep(2)}>←</button>
                  <button style={S.btnP} onClick={() => setStep(4)}>{t('viewResult', lang)}</button>
                </div>
              </div>
            )}

            {/* ── Step 4: Results ── */}
            {step === 4 && (
              <div className="sc-fi">
                {/* Score Hero */}
                <div style={{ ...S.card, textAlign: 'center', padding: 32, borderColor: verdict.color + '33' }}>
                  <div style={{ fontSize: 52 }}>{verdict.emoji}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 44, fontWeight: 700, marginTop: 4, color: '#1a1a1a' }}>
                    {weightedTotal.toFixed(2)}
                    <span style={{ fontSize: 18, color: '#6b7280' }}> / 10</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: verdict.color, marginTop: 2 }}>{i(verdict.label)}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{i(verdict.desc)}</div>
                  {anyVeto && (
                    <div style={{ marginTop: 14, padding: 10, background: 'rgba(220,38,38,0.08)', borderRadius: 8, fontSize: 13, color: '#f87171' }}>
                      ⚠️ {t('vetoTriggered', lang)}: {stageVetoes.filter(v => vetoes[v.id]).map(v => i(v.label)).join('、')}
                    </div>
                  )}
                  {projectName && <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 10 }}>{projectName}{projectDesc ? ` — ${projectDesc}` : ''}</div>}
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                    {STAGES.find(s => s.id === stage) ? i(STAGES.find(s => s.id === stage)!.label) : ''} · {new Date().toISOString().slice(0, 10)}
                    {isQuickResult && <span style={{ marginLeft: 8, padding: '2px 8px', background: 'rgba(37,99,235,0.1)', color: '#2563eb', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{lang === 'zh-TW' ? '快速模式' : 'Quick Mode'}</span>}
                  </div>
                  {isQuickResult && aiConfidence && (
                    <div style={{ marginTop: 10, padding: '6px 12px', background: aiConfidence.level === 'low' ? 'rgba(234,179,8,0.1)' : 'rgba(5,150,105,0.06)', borderRadius: 6, fontSize: 12, color: aiConfidence.level === 'low' ? '#ca8a04' : '#6b7280' }}>
                      {aiConfidence.level === 'low' ? (lang === 'zh-TW' ? '⚠️ 資訊有限，建議提供更多細節以獲得更精確的評估' : '⚠️ Limited info — provide more details for accuracy') : aiConfidence.note}
                    </div>
                  )}
                </div>

                {/* GitHub Metadata */}
                {githubMeta && (
                  <div style={{ ...S.card, borderColor: 'rgba(5,150,105,0.2)', background: 'rgba(5,150,105,0.03)' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: '#1a1a1a' }}>
                      {lang === 'zh-TW' ? '📊 GitHub 數據' : '📊 GitHub Data'}
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 14, color: '#374151' }}>
                      <span>⭐ {githubMeta.stars?.toLocaleString()} Stars</span>
                      <span>👥 {githubMeta.contributors?.toLocaleString()} Contributors</span>
                      <span>🔀 {githubMeta.forks?.toLocaleString()} Forks</span>
                      <span>📋 {githubMeta.openIssues?.toLocaleString()} Issues</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: '#6b7280', marginTop: 8 }}>
                      {githubMeta.language && <span>🔤 {githubMeta.language}</span>}
                      <span>📜 {githubMeta.license}</span>
                      {githubMeta.lastPush && <span>📅 {lang === 'zh-TW' ? '最後更新' : 'Last push'}: {new Date(githubMeta.lastPush).toLocaleDateString()}</span>}
                    </div>
                    {githubMeta.topics?.length > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {githubMeta.topics.map((topic: string) => (
                          <span key={topic} style={{ padding: '2px 8px', background: 'rgba(37,99,235,0.08)', color: '#2563eb', borderRadius: 4, fontSize: 11 }}>{topic}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Score Interpretation */}
                <div style={{ ...S.card, borderColor: 'rgba(234,179,8,0.2)', background: 'rgba(234,179,8,0.03)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: '#1a1a1a' }}>{t('scoreInterpretTitle', lang)}</h3>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#eab308', marginBottom: 8 }}>{t('scoreInterpret1', lang)}</p>
                  <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.7, marginBottom: 8 }}>{t('scoreInterpret2', lang)}</p>
                  <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.7 }}>{t('scoreInterpret3', lang)}</p>
                </div>

                {/* Dimension Gap Warning */}
                {hasGapWarning && (
                  <div style={{ ...S.card, borderColor: 'rgba(234,88,12,0.3)', background: 'rgba(234,88,12,0.06)' }}>
                    <p style={{ fontSize: 14, color: '#fb923c', fontWeight: 600, lineHeight: 1.7, margin: 0 }}>
                      ⚠️ {t('gapWarning', lang)}
                    </p>
                  </div>
                )}

                {/* Radar + Breakdown */}
                <div style={S.card}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#1a1a1a' }}>{t('dimAnalysis', lang)}</h3>
                  <RadarChart dimScores={dimScores} />
                  <div style={{ marginTop: 20 }}>
                    {DIMENSIONS.map(d => (
                      <div key={d.id} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{d.icon} {d.id}. {i(d.name)}</span>
                          <span style={{ color: '#6b7280' }}>×{d.weight}%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${(dimScores[d.id] / 10) * 100}%`, height: '100%', background: d.color, borderRadius: 4, transition: 'width .4s' }} />
                          </div>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: d.color, minWidth: 32, textAlign: 'right' }}>
                            {dimScores[d.id].toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick mode: switch to full */}
                {isQuickResult && (
                  <div style={{ ...S.card, textAlign: 'center', borderColor: 'rgba(37,99,235,0.2)', background: 'rgba(37,99,235,0.03)' }}>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{lang === 'zh-TW' ? '想要更精確？' : 'Want more precision?'}</p>
                    <button onClick={() => { setIsQuickResult(false); setStep(0); }} style={{ ...S.btnP, marginTop: 8, fontSize: 13, padding: '8px 20px' }}>{t('switchToFull', lang)}</button>
                  </div>
                )}

                {/* AI Advisor */}
                <div style={S.card}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: '#1a1a1a' }}>{lang === 'zh-TW' ? '🤖 AI 策略顧問' : '🤖 AI Strategy Advisor'}</h3>
                  {!advice && !adviceLoading && <button style={{ ...S.btnP, background: '#7c3aed', fontSize: 13 }} onClick={onRequestAdvice}>{lang === 'zh-TW' ? '生成改善建議' : 'Generate Advice'}</button>}
                  {adviceLoading && <p style={{ fontSize: 13, color: '#6b7280' }}>{lang === 'zh-TW' ? 'AI 顧問正在分析⋯' : 'AI advisor analyzing...'}</p>}
                  {advice && <div style={{ fontSize: 14, lineHeight: 1.8, color: '#374151', whiteSpace: 'pre-wrap' }}>{advice}</div>}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
                  <button style={S.btnG} onClick={() => { setStep(2); setIsQuickResult(false); }}>{t('modify', lang)}</button>
                  <button style={S.btnP} onClick={exportMd}>{t('exportMd', lang)}</button>
                  <button style={{ ...S.btnP, background: '#059669' }} onClick={exportJson}>{t('exportJson', lang)}</button>
                </div>

                {/* Footer */}
                <div style={{ marginTop: 36, paddingTop: 20, borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.7 }}>
                    <strong style={{ color: '#6b7280' }}>Builder's Scorecard</strong> by{' '}
                    <a href="https://paulkuo.tw" target="_blank" rel="noopener" style={{ color: '#2563eb', textDecoration: 'none' }}>Paul Kuo</a>
                    <br />{t('credit', lang)}{' '}
                    <a href="https://github.com/el09xccxy-stack/oss-investment-scorecard" target="_blank" rel="noopener" style={{ color: '#2563eb', textDecoration: 'none' }}>
                      OSS Investment Scorecard
                    </a>{' '}(Lucy Chen / Zoo Capital)
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
