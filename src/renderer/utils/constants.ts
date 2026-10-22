export const HERO_ROLES: Record<string, string> = {
  'dva': 'tank', 'doomfist': 'tank', 'hazard': 'tank', 'junker-queen': 'tank',
  'mauga': 'tank', 'orisa': 'tank', 'ramattra': 'tank', 'reinhardt': 'tank',
  'roadhog': 'tank', 'sigma': 'tank', 'winston': 'tank', 'wrecking-ball': 'tank',
  'zarya': 'tank',
  'ashe': 'damage', 'bastion': 'damage', 'cassidy': 'damage', 'echo': 'damage',
  'genji': 'damage', 'hanzo': 'damage', 'junkrat': 'damage', 'mei': 'damage',
  'pharah': 'damage', 'reaper': 'damage', 'sojourn': 'damage', 'soldier-76': 'damage',
  'sombra': 'damage', 'symmetra': 'damage', 'torbjorn': 'damage', 'tracer': 'damage',
  'venture': 'damage', 'widowmaker': 'damage', 'freja': 'damage', 'vendetta': 'damage',
  'emre': 'damage',
  'ana': 'support', 'baptiste': 'support', 'brigitte': 'support', 'illari': 'support',
  'juno': 'support', 'kiriko': 'support', 'lifeweaver': 'support', 'lucio': 'support',
  'mercy': 'support', 'moira': 'support', 'zenyatta': 'support',
};

export function getHeroRole(heroKey: string): string {
  return HERO_ROLES[heroKey] || 'damage';
}

export const ROLE_COLORS: Record<string, string> = {
  tank: '#3b82f6',
  damage: '#ef4444',
  support: '#22c55e',
  open: '#a855f7',
};

export const ROLE_ORDER = ['tank', 'damage', 'support', 'open'];

export const RANK_ORDER = [
  'bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'gm',
];

// Rank estimation benchmarks per role (per-10 values) — aligned with iOS
export const RANK_BENCHMARKS: Record<string, Record<string, { elims: number; deaths: number; damage: number; healing: number }>> = {
  tank: {
    bronze:  { elims: 10, deaths: 8,   damage: 5000,  healing: 300 },
    silver:  { elims: 13, deaths: 7,   damage: 6500,  healing: 400 },
    gold:    { elims: 16, deaths: 6.5, damage: 8000,  healing: 500 },
    platinum:{ elims: 19, deaths: 6,   damage: 9500,  healing: 600 },
    diamond: { elims: 22, deaths: 5.5, damage: 11000, healing: 700 },
    master:  { elims: 25, deaths: 5,   damage: 12500, healing: 800 },
    gm:      { elims: 28, deaths: 4.5, damage: 14000, healing: 1000 },
  },
  damage: {
    bronze:  { elims: 9,  deaths: 9,   damage: 4000,  healing: 100 },
    silver:  { elims: 13, deaths: 8,   damage: 5500,  healing: 150 },
    gold:    { elims: 17, deaths: 7,   damage: 7000,  healing: 200 },
    platinum:{ elims: 20, deaths: 6.5, damage: 8500,  healing: 200 },
    diamond: { elims: 23, deaths: 6,   damage: 10000, healing: 250 },
    master:  { elims: 26, deaths: 5.5, damage: 11500, healing: 300 },
    gm:      { elims: 29, deaths: 5,   damage: 13000, healing: 350 },
  },
  support: {
    bronze:  { elims: 5,  deaths: 8,   damage: 2000,  healing: 4000 },
    silver:  { elims: 7,  deaths: 7,   damage: 2800,  healing: 5000 },
    gold:    { elims: 9,  deaths: 6.5, damage: 3500,  healing: 6000 },
    platinum:{ elims: 11, deaths: 6,   damage: 4200,  healing: 7000 },
    diamond: { elims: 13, deaths: 5.5, damage: 5000,  healing: 8000 },
    master:  { elims: 15, deaths: 5,   damage: 5800,  healing: 9000 },
    gm:      { elims: 17, deaths: 4.5, damage: 6500,  healing: 10000 },
  },
};

// Radar chart medians per role (community Gold-Platinum averages) — aligned with iOS
// Order: [elims, assists, deaths, damage, healing]
export const RADAR_MEDIANS: Record<string, number[]> = {
  all:     [14.0, 4.0,  6.5, 6000,  2500],
  tank:    [16.0, 3.0,  5.5, 8000,  500],
  damage:  [18.0, 1.0,  7.0, 8500,  200],
  support: [10.0, 7.0,  6.0, 3500,  6000],
};

// Radar chart max values for normalization per role — aligned with iOS
// Order: [elims, assists, deaths, damage, healing]
export const RADAR_MAX: Record<string, number[]> = {
  all:     [28.0, 15.0, 15.0, 12000, 8000],
  tank:    [28.0, 10.0, 15.0, 14000, 3000],
  damage:  [30.0, 6.0,  15.0, 14000, 2000],
  support: [18.0, 15.0, 15.0, 6000,  10000],
};
