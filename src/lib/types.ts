export type VoteRecord = {
  mood: number;
  country: string;
  city: string | null;
  age_range: string;
  date: string;
};

export type GlobalStats = {
  date: string;
  average: number;
  total_checkins: number;
  happiest: { country: string; average: number; checkins: number }[];
  toughest: { country: string; average: number; checkins: number }[];
};

export type AgeStats = {
  date: string;
  ranges: { age_range: string; average: number }[];
  highest: string;
  lowest: string;
};

export type DistributionStats = {
  date: string;
  mode: number;
  levels: { mood: number; pct: number }[];
};

export type TrendPoint = { date: string; average: number | null };

export type TrendStats = {
  scope: string;
  range: number;
  series: TrendPoint[];
  global: TrendPoint[];
  delta: number;
};

export type GiveSummary = {
  raised_this_month: number;
  monthly_goal: number;
  donated_pct: number;
  ops_pct: number;
  you: { lifetime_ads: number; funded: number; today_ads: number };
};
