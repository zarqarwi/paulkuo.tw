export type Stage = 'concept' | 'launched' | 'users' | 'revenue';
export type Mode = 'quick' | 'full';
export type Lang = 'zh-TW' | 'en';

export interface I18n {
  'zh-TW': string;
  en: string;
}

export interface Signal {
  id: string;
  label: I18n;
  desc: I18n;
  strong: I18n;
  weak: I18n;
}

export interface Dimension {
  id: string;
  name: I18n;
  nameEn: string;
  weight: number;
  color: string;
  icon: string;
  principle: I18n;
  signals?: Signal[];
  stageSignals?: Record<Stage, Signal[]>;
}

export interface GateQuestion {
  id: string;
  label: I18n;
  question: I18n;
}

export interface VetoCondition {
  id: string;
  label: I18n;
  desc: I18n;
  stages: Stage[];
}

export interface VerdictInfo {
  emoji: string;
  label: I18n;
  color: string;
  desc: I18n;
}

export interface BuilderSignal {
  id: string;
  label: I18n;
  desc: I18n;
}

export interface StageInfo {
  id: Stage;
  label: I18n;
  desc: I18n;
}
