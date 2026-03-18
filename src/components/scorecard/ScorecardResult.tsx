import { useState, useEffect } from 'react';
import { DIMENSIONS, STAGES, VETOES, getVerdict, calcDimScore, calcWeightedTotal, t } from './data';
import type { Stage, Lang } from './types';
import RadarChart from './RadarChart';

const S = {
  card: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 24, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' } as React.CSSProperties,
};

interface Props {
  evalId?: string;
}

export default function ScorecardResult({ evalId: propId }: Props) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [badgeCopied, setBadgeCopied] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [compareId, setCompareId] = useState('');
  const [compareData, setCompareData] = useState<any>(null);
  const [showCompare, setShowCompare] = useState(false);

  // Extract ID from URL path if not passed as prop
  const evalId = propId || (typeof window !== 'undefined' ? window.location.pathname.split('/eval/')[1]?.replace(/\/$/, '') : '');

  useEffect(() => {
    if (!evalId || evalId === 'index') { setError('未提供評估 ID'); setLoading(false); return; }
    fetch(`https://api.paulkuo.tw/api/scorecard/eval/${evalId}`)
      .then(r => { if (!r.ok) throw new Error('not_found'); return r.json(); })
      .then(setData)
      .catch(() => setError('找不到此評估結果，可能尚未公開或已刪除。'))
      .finally(() => setLoading(false));
  }, [evalId]);

  // Fetch history when data is loaded and has project_name
  useEffect(() => {
    if (!data?.project_name) return;
    fetch(`https://api.paulkuo.tw/api/scorecard/history/${encodeURIComponent(data.project_name)}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(h => { if (Array.isArray(h) && h.length > 1) setHistory(h); })
      .catch(() => {});
  }, [data?.project_name]);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>載入中⋯</div>;
  if (error) return <div style={{ textAlign: 'center', padding: 60, color: '#f87171' }}>{error}</div>;
  if (!data) return null;

  const lang: Lang = (data.lang as Lang) || 'zh-TW';
  const i = (obj: { 'zh-TW': string; en: string }) => obj[lang];
  const stage = (data.stage || 'concept') as Stage;

  // Parse JSON fields
  const dimScoresRaw = typeof data.dim_scores === 'string' ? JSON.parse(data.dim_scores) : data.dim_scores || {};
  const signalScores = typeof data.signal_scores === 'string' ? JSON.parse(data.signal_scores) : data.signal_scores || {};
  const githubMeta = typeof data.github_meta === 'string' ? JSON.parse(data.github_meta) : data.github_meta;
  const vetoTriggered = typeof data.veto_triggered === 'string' ? JSON.parse(data.veto_triggered) : data.veto_triggered || {};

  // Reconstruct dim scores from signal scores if available
  const scores: Record<string, number> = {};
  for (const [id, sig] of Object.entries(signalScores) as [string, any][]) {
    scores[id] = typeof sig === 'object' ? sig.score : sig;
  }

  const dimScores: Record<string, number> = {};
  if (Object.keys(dimScoresRaw).length > 0) {
    Object.assign(dimScores, dimScoresRaw);
  } else {
    DIMENSIONS.forEach(d => { dimScores[d.id] = calcDimScore(d, stage, scores); });
  }

  const weightedTotal = data.total_score ?? calcWeightedTotal(dimScores);
  const stageVetoes = VETOES.filter(v => v.stages.includes(stage));
  const anyVeto = stageVetoes.some(v => vetoTriggered[v.id]);
  const verdict = getVerdict(weightedTotal, anyVeto);

  // Badge embed code
  const badgeUrl = `https://api.paulkuo.tw/api/scorecard/badge/${evalId}`;
  const evalUrl = `https://paulkuo.tw/tools/builders-scorecard/eval/${evalId}`;
  const badgeMarkdown = `[![Builder's Score](${badgeUrl})](${evalUrl})`;

  const handleCopyBadge = () => {
    navigator.clipboard.writeText(badgeMarkdown).then(() => {
      setBadgeCopied(true);
      setTimeout(() => setBadgeCopied(false), 2000);
    });
  };

  // Compare logic
  const handleCompareSelect = (selectedId: string) => {
    setCompareId(selectedId);
    if (!selectedId) { setCompareData(null); return; }
    const found = history.find(h => h.id === selectedId);
    if (found) {
      const parsed = typeof found.dim_scores === 'string' ? JSON.parse(found.dim_scores) : found.dim_scores || {};
      setCompareData({ ...found, parsedDimScores: parsed });
    }
  };

  // Build compare dim scores
  const compareDimScores = compareData?.parsedDimScores || null;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px' }}>
      {/* Score Hero */}
      <div style={{ ...S.card, textAlign: 'center', padding: 32, borderColor: verdict.color + '33' }}>
        <div style={{ fontSize: 52 }}>{verdict.emoji}</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 44, fontWeight: 700, marginTop: 4, color: '#1a1a1a' }}>
          {Number(weightedTotal).toFixed(2)}
          <span style={{ fontSize: 18, color: '#6b7280' }}> / 10</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: verdict.color, marginTop: 2 }}>{i(verdict.label)}</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{i(verdict.desc)}</div>
        {anyVeto && (
          <div style={{ marginTop: 14, padding: 10, background: 'rgba(220,38,38,0.08)', borderRadius: 8, fontSize: 13, color: '#f87171' }}>
            ⚠️ {lang === 'zh-TW' ? '一票否決觸發' : 'Veto triggered'}
          </div>
        )}
        {data.project_name && (
          <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 10 }}>
            {data.project_name}{data.project_desc ? ` — ${data.project_desc}` : ''}
          </div>
        )}
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
          {STAGES.find(s => s.id === stage) ? i(STAGES.find(s => s.id === stage)!.label) : ''} · {data.created_at?.slice(0, 10) || ''}
          {data.version && <span> · v{data.version}</span>}
          <span style={{ marginLeft: 8, padding: '2px 8px', background: 'rgba(37,99,235,0.1)', color: '#2563eb', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
            {data.mode === 'full' ? (lang === 'zh-TW' ? '完整模式' : 'Full Mode') : (lang === 'zh-TW' ? '快速模式' : 'Quick Mode')}
          </span>
        </div>
      </div>

      {/* Badge Embed */}
      <div style={{ ...S.card, borderColor: 'rgba(37,99,235,0.15)', background: 'rgba(37,99,235,0.02)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#1a1a1a' }}>🏷️ {lang === 'zh-TW' ? 'Badge 嵌入碼' : 'Badge Embed Code'}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <img src={badgeUrl} alt="Builder's Score Badge" style={{ height: 20 }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <code style={{ flex: 1, fontSize: 11, padding: '8px 10px', background: '#f3f4f6', borderRadius: 6, overflowX: 'auto', whiteSpace: 'nowrap', color: '#374151', border: '1px solid #e5e7eb' }}>
            {badgeMarkdown}
          </code>
          <button
            onClick={handleCopyBadge}
            style={{ padding: '6px 14px', background: badgeCopied ? '#22c55e' : '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {badgeCopied ? '✓' : (lang === 'zh-TW' ? '複製' : 'Copy')}
          </button>
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
          {lang === 'zh-TW' ? '貼到 GitHub README 或個人網站即可顯示分數徽章' : 'Paste in your GitHub README or website to show score badge'}
        </div>
      </div>

      {/* GitHub Metadata */}
      {githubMeta && (
        <div style={{ ...S.card, borderColor: 'rgba(5,150,105,0.2)', background: 'rgba(5,150,105,0.03)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: '#1a1a1a' }}>📊 GitHub</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 14, color: '#374151' }}>
            <span>⭐ {githubMeta.stars?.toLocaleString()} Stars</span>
            <span>👥 {githubMeta.contributors?.toLocaleString()} Contributors</span>
            <span>🔀 {githubMeta.forks?.toLocaleString()} Forks</span>
          </div>
        </div>
      )}

      {/* Version Comparison Toggle */}
      {history.length > 1 && (
        <div style={{ ...S.card, borderColor: 'rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showCompare ? 12 : 0 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
              📈 {lang === 'zh-TW' ? '與歷史版本比較' : 'Compare with History'}
            </h3>
            <button
              onClick={() => { setShowCompare(!showCompare); if (!showCompare && !compareId) setCompareData(null); }}
              style={{ padding: '4px 12px', background: showCompare ? '#8b5cf6' : 'rgba(139,92,246,0.1)', color: showCompare ? '#fff' : '#8b5cf6', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              {showCompare ? (lang === 'zh-TW' ? '收起' : 'Hide') : (lang === 'zh-TW' ? '展開' : 'Show')}
            </button>
          </div>
          {showCompare && (
            <div>
              <select
                value={compareId}
                onChange={e => handleCompareSelect(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 12, background: '#fff' }}
              >
                <option value="">{lang === 'zh-TW' ? '選擇歷史版本' : 'Select a version'}</option>
                {history.filter(h => h.id !== evalId).map(h => (
                  <option key={h.id} value={h.id}>
                    v{h.version || '?'} — {Number(h.total_score).toFixed(1)}/10 — {h.created_at?.slice(0, 10) || ''}
                  </option>
                ))}
              </select>

              {compareData && compareDimScores && (
                <div>
                  {/* Diff Table */}
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', marginBottom: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ textAlign: 'left', padding: '6px 4px', color: '#6b7280', fontWeight: 600 }}>{lang === 'zh-TW' ? '維度' : 'Dimension'}</th>
                        <th style={{ textAlign: 'center', padding: '6px 4px', color: '#9ca3af', fontWeight: 600 }}>v{compareData.version || '?'}</th>
                        <th style={{ textAlign: 'center', padding: '6px 4px', color: '#2563eb', fontWeight: 600 }}>v{data.version || '?'}</th>
                        <th style={{ textAlign: 'right', padding: '6px 4px', color: '#6b7280', fontWeight: 600 }}>{lang === 'zh-TW' ? '變化' : 'Change'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DIMENSIONS.map(d => {
                        const prev = compareDimScores[d.id] || 0;
                        const curr = dimScores[d.id] || 0;
                        const diff = curr - prev;
                        return (
                          <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '6px 4px', fontWeight: 500 }}>{d.icon} {d.id}</td>
                            <td style={{ textAlign: 'center', padding: '6px 4px', color: '#9ca3af', fontFamily: "'JetBrains Mono', monospace" }}>{prev.toFixed(1)}</td>
                            <td style={{ textAlign: 'center', padding: '6px 4px', color: '#1a1a1a', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{curr.toFixed(1)}</td>
                            <td style={{ textAlign: 'right', padding: '6px 4px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: diff > 0 ? '#22c55e' : diff < 0 ? '#ef4444' : '#9ca3af' }}>
                              {diff > 0 ? '↑' : diff < 0 ? '↓' : '—'} {diff !== 0 ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}` : ''}
                            </td>
                          </tr>
                        );
                      })}
                      <tr style={{ borderTop: '2px solid #e5e7eb' }}>
                        <td style={{ padding: '8px 4px', fontWeight: 700 }}>{lang === 'zh-TW' ? '總分' : 'Total'}</td>
                        <td style={{ textAlign: 'center', padding: '8px 4px', color: '#9ca3af', fontFamily: "'JetBrains Mono', monospace" }}>{Number(compareData.total_score).toFixed(1)}</td>
                        <td style={{ textAlign: 'center', padding: '8px 4px', color: '#1a1a1a', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{Number(weightedTotal).toFixed(1)}</td>
                        {(() => {
                          const totalDiff = Number(weightedTotal) - Number(compareData.total_score);
                          return (
                            <td style={{ textAlign: 'right', padding: '8px 4px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: totalDiff > 0 ? '#22c55e' : totalDiff < 0 ? '#ef4444' : '#9ca3af' }}>
                              {totalDiff > 0 ? '↑' : totalDiff < 0 ? '↓' : '—'} {totalDiff !== 0 ? `${totalDiff > 0 ? '+' : ''}${totalDiff.toFixed(1)}` : ''}
                            </td>
                          );
                        })()}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Radar + Breakdown */}
      <div style={S.card}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#1a1a1a' }}>{t('dimAnalysis', lang)}</h3>
        <RadarChart
          dimScores={dimScores}
          compareScores={compareDimScores || undefined}
          compareLabel={compareData ? `v${compareData.version || '?'} (${compareData.created_at?.slice(0, 10) || ''})` : undefined}
        />
        <div style={{ marginTop: 20 }}>
          {DIMENSIONS.map(d => (
            <div key={d.id} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{d.icon} {d.id}. {i(d.name)}</span>
                <span style={{ color: '#6b7280' }}>×{d.weight}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${((dimScores[d.id] || 0) / 10) * 100}%`, height: '100%', background: d.color, borderRadius: 4 }} />
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: d.color, minWidth: 32, textAlign: 'right' }}>
                  {(dimScores[d.id] || 0).toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Advice */}
      {data.ai_advice && (
        <div style={S.card}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: '#1a1a1a' }}>{lang === 'zh-TW' ? '🤖 AI 策略顧問' : '🤖 AI Strategy Advisor'}</h3>
          <div style={{ fontSize: 14, lineHeight: 1.8, color: '#374151', whiteSpace: 'pre-wrap' }}>{data.ai_advice}</div>
        </div>
      )}

      {/* CTA */}
      <div style={{ ...S.card, textAlign: 'center', borderColor: 'rgba(37,99,235,0.2)', background: 'rgba(37,99,235,0.03)' }}>
        <p style={{ fontSize: 14, color: '#374151', margin: '0 0 10px' }}>{lang === 'zh-TW' ? '想評估你自己的產品？' : 'Want to evaluate your own product?'}</p>
        <a href="/tools/builders-scorecard" style={{ display: 'inline-block', padding: '10px 24px', background: '#2563eb', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
          {lang === 'zh-TW' ? '開始評估' : 'Start Evaluation'}
        </a>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 36, paddingTop: 20, borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.7 }}>
          <strong style={{ color: '#6b7280' }}>Builder's Scorecard</strong> by{' '}
          <a href="https://paulkuo.tw" target="_blank" rel="noopener" style={{ color: '#2563eb', textDecoration: 'none' }}>Paul Kuo</a>
        </p>
      </div>
    </div>
  );
}
