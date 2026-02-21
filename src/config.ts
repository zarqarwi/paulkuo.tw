export const PILLAR_MAP = {
  ai: { label: '智能與秩序', labelEn: 'Intelligence & Order', color: 'var(--accent-ai)', bg: 'rgba(37,99,235,0.1)' },
  circular: { label: '循環再利用', labelEn: 'Recycle & Reuse', color: 'var(--accent-circular)', bg: 'rgba(5,150,105,0.1)' },
  faith: { label: '文明與人性', labelEn: 'Civilization & Human Nature', color: 'var(--accent-faith)', bg: 'rgba(180,83,9,0.1)' },
  startup: { label: '創造與建構', labelEn: 'Creation & Enterprise', color: 'var(--accent-startup)', bg: 'rgba(220,38,38,0.1)' },
  life: { label: '沉思與記憶', labelEn: 'Reflections & Memory', color: 'var(--accent-life)', bg: 'rgba(124,58,237,0.1)' },
} as const;

export type PillarKey = keyof typeof PILLAR_MAP;

export const SITE = {
  title: 'Paul Kuo — Rebuilding Order in an Age of Intelligence',
  description: '在技術與文明的交匯處，重建秩序、循環再利用、守護人性尊嚴。',
  url: 'https://paulkuo.tw',
  author: 'Paul Kuo',
  authorAlt: '郭曜郎',
} as const;
