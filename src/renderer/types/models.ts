// Player Search
export interface PlayerSearchResponse {
  total: number;
  results: PlayerSearchResult[];
}

export interface PlayerSearchResult {
  player_id: string;
  name: string;
  avatar?: string | null;
  namecard?: string | null;
  title?: string | null;
  career_url: string;
  blizzard_id?: string | null;
  last_updated_at?: string | null;
  is_public: boolean;
}

// Player Summary
export interface PlayerSummary {
  username: string;
  avatar?: string | null;
  namecard?: string | null;
  title?: string | null;
  endorsement?: {
    level: number;
    frame: string;
  } | null;
  competitive?: {
    pc?: PlatformRanks | null;
    console?: PlatformRanks | null;
  } | null;
  last_updated_at?: string | null;
}

export interface PlatformRanks {
  season?: number;
  tank?: RankInfo | null;
  damage?: RankInfo | null;
  support?: RankInfo | null;
  open?: RankInfo | null;
}

export interface RankInfo {
  division: string;
  tier: number;
  role_icon: string;
  rank_icon: string;
  tier_icon: string;
}

// Player Stats Summary
export interface PlayerStatsSummary {
  general?: GeneralStats;
  heroes?: Record<string, HeroStatEntry>;
  roles?: Record<string, RoleStatEntry>;
}

export interface GeneralStats {
  games_played: number;
  games_won: number;
  games_lost: number;
  time_played: number;
  winrate: number;
  kda: number;
  total: StatTotals;
  average: StatAverages;
}

export interface HeroStatEntry {
  games_played: number;
  games_won: number;
  games_lost: number;
  time_played: number;
  winrate: number;
  kda: number;
  total: StatTotals;
  average: StatAverages;
}

export interface RoleStatEntry {
  games_played: number;
  games_won: number;
  games_lost: number;
  time_played: number;
  winrate: number;
  kda: number;
  total: StatTotals;
  average: StatAverages;
}

export interface StatTotals {
  eliminations: number;
  assists: number;
  deaths: number;
  damage: number;
  healing: number;
}

export interface StatAverages {
  eliminations: number;
  assists: number;
  deaths: number;
  damage: number;
  healing: number;
}

// Career Stats
export interface CareerStatCategory {
  category: string;
  label: string;
  stats: CareerStat[];
}

export interface CareerStat {
  key: string;
  label: string;
  value: number | string;
}

// Heroes
export interface HeroInfo {
  key: string;
  name: string;
  portrait: string;
  role: string;
}

export interface HeroDetail {
  name: string;
  description: string;
  role: string;
  location: string;
  birthday?: string | null;
  age?: number | null;
  hitpoints?: {
    armor: number;
    shields: number;
    health: number;
    total: number;
  } | null;
  abilities: HeroAbility[];
  story?: {
    summary: string;
    media?: {
      type: string;
      link: string;
    } | null;
  } | null;
}

export interface HeroAbility {
  name: string;
  description: string;
  icon: string;
  video?: {
    thumbnail: string;
    link: {
      mp4: string;
      webm: string;
    };
  } | null;
}

export interface HeroGlobalStat {
  hero: string;
  pickrate: number;
  winrate: number;
}

// Maps & Gamemodes
export interface MapInfo {
  key: string;
  name: string;
  screenshot: string;
  gamemodes: string[];
  location: string;
  country_code?: string | null;
}

export interface GamemodeInfo {
  key: string;
  name: string;
  icon: string;
  description: string;
  screenshot: string;
}

// Game Mode
export type GameMode = 'quickplay' | 'competitive';

// Local Storage Models
export interface FavoritePlayer {
  playerId: string;
  name: string;
  avatar?: string | null;
  addedAt: string;
}

export interface SearchHistoryItem {
  playerId: string;
  name: string;
  avatar?: string | null;
  searchedAt: string;
}

export interface StatSnapshot {
  id: string;
  playerId: string;
  date: string;
  gamemode: GameMode;
  winrate: number;
  kda: number;
  gamesPlayed: number;
  elimsPer10: number;
  deathsPer10: number;
  damagePer10: number;
  healingPer10: number;
  assistsPer10: number;
}

export interface ActiveSession {
  playerId: string;
  startedAt: string;
  gamemode: GameMode;
  startSnapshot: {
    winrate: number;
    kda: number;
    gamesPlayed: number;
    elimsPer10: number;
    deathsPer10: number;
    damagePer10: number;
    healingPer10: number;
  };
}
