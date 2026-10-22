import type { HeroStatEntry, PlayerStatsSummary, RoleStatEntry } from '../types/models';
import { RANK_BENCHMARKS, RADAR_MEDIANS, RADAR_MAX, getHeroRole } from './constants';

// ---- Radar Chart ----
export function getRadarData(
  stats: PlayerStatsSummary,
  role: string | null
): number[] {
  let elims = 0, assists = 0, deaths = 0, damage = 0, healing = 0;

  if (role && stats.roles?.[role]) {
    const r = stats.roles[role];
    elims = r.average.eliminations;
    assists = r.average.assists;
    deaths = r.average.deaths;
    damage = r.average.damage;
    healing = r.average.healing;
  } else if (stats.general) {
    elims = stats.general.average.eliminations;
    assists = stats.general.average.assists;
    deaths = stats.general.average.deaths;
    damage = stats.general.average.damage;
    healing = stats.general.average.healing;
  }

  const key = role || 'all';
  const max = RADAR_MAX[key] || RADAR_MAX.all;
  // Survival = 1 - (deaths / maxDeaths), aligned with iOS
  const survival = Math.max(0, 1.0 - (deaths / max[2]));

  return [
    Math.min(1, elims / max[0]),
    Math.min(1, assists / max[1]),
    Math.min(1, survival),
    Math.min(1, damage / max[3]),
    Math.min(1, healing / max[4]),
  ];
}

export function getRadarMedianData(role: string | null): number[] {
  const key = role || 'all';
  const median = RADAR_MEDIANS[key] || RADAR_MEDIANS.all;
  const max = RADAR_MAX[key] || RADAR_MAX.all;

  // median[2] is deaths, convert to survival like iOS: 1 - (deaths / maxDeaths)
  const survival = Math.max(0, 1.0 - (median[2] / max[2]));

  return [
    Math.min(1, median[0] / max[0]),
    Math.min(1, median[1] / max[1]),
    Math.min(1, survival),
    Math.min(1, median[3] / max[3]),
    Math.min(1, median[4] / max[4]),
  ];
}

export const RADAR_LABELS = ['Elims', 'Assists', 'Survival', 'Damage', 'Healing'];

// ---- Hero Tier List ----
export interface TierEntry {
  heroKey: string;
  score: number;
  winrate: number;
  kda: number;
  games: number;
}

export function calculateHeroTiers(
  heroes: Record<string, HeroStatEntry>
): Record<string, TierEntry[]> {
  const entries: TierEntry[] = [];

  for (const [key, hero] of Object.entries(heroes)) {
    if (hero.games_played < 3) continue;
    const gameWeight = Math.min(1, hero.games_played / 30);
    const score = (hero.winrate * 0.5 + hero.kda * 8.0 + hero.games_played * 0.1) * (0.5 + 0.5 * gameWeight);
    entries.push({
      heroKey: key,
      score,
      winrate: hero.winrate,
      kda: hero.kda,
      games: hero.games_played,
    });
  }

  entries.sort((a, b) => b.score - a.score);
  if (entries.length === 0) return {};

  const maxScore = entries[0].score;
  const tiers: Record<string, TierEntry[]> = { S: [], A: [], B: [], C: [], D: [] };

  for (const entry of entries) {
    const ratio = maxScore > 0 ? entry.score / maxScore : 0;
    if (ratio >= 0.85) tiers.S.push(entry);
    else if (ratio >= 0.65) tiers.A.push(entry);
    else if (ratio >= 0.45) tiers.B.push(entry);
    else if (ratio >= 0.25) tiers.C.push(entry);
    else tiers.D.push(entry);
  }

  return tiers;
}

// ---- Play Style Classification ----
export interface PlayStyle {
  type: string;
  subtitle: string;
  traits: string[];
  insights: string[];
  signatureHero?: { key: string; winrate: number };
}

export function classifyPlayStyle(
  stats: PlayerStatsSummary,
  heroes: Record<string, HeroStatEntry>,
  selectedRole?: string | null
): PlayStyle {
  const general = stats.general;
  if (!general) {
    return { type: 'Unknown', subtitle: 'Not enough data', traits: [], insights: [] };
  }

  const roles = stats.roles || {};
  let dominantRole = 'damage';
  let maxTime = 0;
  for (const [role, data] of Object.entries(roles)) {
    if (data.time_played > maxTime) {
      maxTime = data.time_played;
      dominantRole = role;
    }
  }

  // Use selectedRole data if available, otherwise general
  const roleData = selectedRole && roles[selectedRole] ? roles[selectedRole] : general;
  const effectiveRole = selectedRole || dominantRole;

  const elims = roleData.average.eliminations;
  const deaths = roleData.average.deaths;
  const damage = roleData.average.damage;
  const healing = roleData.average.healing;
  const assists = roleData.average.assists;
  const kda = roleData.kda;
  const winrate = roleData.winrate;
  const gamesPlayed = roleData.games_played;

  // Hero pool size
  const heroPoolSize = Object.values(heroes).filter(h => h.games_played >= 3).length;

  // Aggression score (aligned with iOS)
  const elimScore = Math.min(1, elims / 25.0);
  const damageScore = Math.min(1, damage / 10000.0);
  const deathPenalty = Math.min(1, deaths / 12.0);
  const aggression = elimScore * 0.4 + damageScore * 0.4 + deathPenalty * 0.2;

  let type = 'Versatile Player';
  let subtitle = '';
  const traits: string[] = [];
  const insights: string[] = [];

  // Classification by role (aligned with iOS)
  if (effectiveRole === 'damage') {
    if (aggression > 0.7) { type = 'Aggressive Slayer'; }
    else if (elims > 18) { type = 'Precision Striker'; }
    else if (damage > 8000) { type = 'Damage Machine'; }
    else { type = 'Steady Damage Dealer'; }
  } else if (effectiveRole === 'tank') {
    if (aggression > 0.6) { type = 'Frontline Brawler'; }
    else if (deaths < 4) { type = 'Unbreakable Wall'; }
    else if (damage > 9000) { type = 'Battle Tank'; }
    else { type = 'Protective Guardian'; }
  } else if (effectiveRole === 'support') {
    if (elims > 10) { type = 'Battle Medic'; }
    else if (healing > 7000) { type = 'Healing Engine'; }
    else if (healing > 5000) { type = 'Dedicated Healer'; }
    else if (assists > 8) { type = 'Enabler'; }
    else { type = 'Utility Support'; }
  } else {
    if (heroPoolSize > 10) { type = 'Flex Master'; }
    else { type = 'Versatile Player'; }
  }

  // Subtitle based on performance (aligned with iOS)
  if (selectedRole) {
    const roleLabel = selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1);
    if (winrate >= 55 && gamesPlayed >= 20) {
      subtitle = `Dominating as ${roleLabel} — a proven winner`;
    } else if (winrate >= 50) {
      subtitle = `Solid ${roleLabel} performance — holding your own`;
    } else if (gamesPlayed < 10) {
      subtitle = `Still building your ${roleLabel} experience`;
    } else {
      subtitle = `Room to grow as ${roleLabel}`;
    }
  } else {
    if (winrate >= 55 && gamesPlayed >= 50) {
      subtitle = 'A proven winner with a dominant track record';
    } else if (winrate >= 50) {
      subtitle = 'Consistent performer who holds their own';
    } else if (gamesPlayed < 20) {
      subtitle = 'Still finding your stride — keep going!';
    } else {
      subtitle = 'Room to grow with dedication';
    }
  }

  // Traits (aligned with iOS, role-aware)
  if (aggression > 0.65) traits.push('High Aggression');
  if (aggression < 0.35) traits.push('Passive Playstyle');

  // Role-adjusted survival thresholds
  const lowDeathThreshold = effectiveRole === 'tank' ? 4 : effectiveRole === 'support' ? 4 : 5;
  const highDeathThreshold = effectiveRole === 'tank' ? 7 : effectiveRole === 'support' ? 7 : 8;
  if (deaths < lowDeathThreshold) traits.push('Hard to Kill');
  if (deaths > highDeathThreshold) traits.push('Risk Taker');

  if (elims > 20) traits.push('Frag Hunter');
  if (damage > 9000) traits.push('DPS Monster');
  if (heroPoolSize <= 3) traits.push('One-Trick Specialist');
  if (kda > 3.0) traits.push('High Impact');

  // Insights
  if (deaths > highDeathThreshold) insights.push('Consider positioning more carefully to reduce deaths');
  if (winrate < 45) insights.push('Focus on teamwork and coordination to improve win rate');
  if (kda < 2) insights.push('Try to get more value before dying — trade kills at minimum');
  if (damage > 12000 && healing < 1000 && effectiveRole !== 'support')
    insights.push('Strong damage output — keep up the pressure');
  if (healing > 10000) insights.push('Excellent healing output — your team benefits greatly');

  // Signature hero
  let signatureHero: PlayStyle['signatureHero'] | undefined;
  let bestHeroScore = 0;
  for (const [key, hero] of Object.entries(heroes)) {
    if (hero.games_played < 3) continue;
    const score = hero.winrate * 0.6 + (hero.games_played / 100) * 0.4;
    if (score > bestHeroScore) {
      bestHeroScore = score;
      signatureHero = { key, winrate: hero.winrate };
    }
  }

  return { type, subtitle, traits, insights, signatureHero };
}

// ---- Queue Recommendation (aligned with iOS) ----
export function getQueueRecommendation(
  roles: Record<string, RoleStatEntry>
): { role: string; score: number }[] {
  const results: { role: string; score: number }[] = [];

  for (const [role, data] of Object.entries(roles)) {
    // iOS requires minimum 3 games per role
    if (data.games_played < 3) continue;
    const wr = data.winrate;
    const kda = data.kda;
    const games = data.games_played;
    // iOS formula: wr * 0.6 + min(kda * 10, 30) * 0.25 + min(games, 50) * 0.15
    const score = wr * 0.6 + Math.min(kda * 10, 30) * 0.25 + Math.min(games, 50) * 0.15;
    results.push({ role, score });
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

// ---- Rank Estimation ----
export function estimateRank(
  stats: PlayerStatsSummary,
  role: string
): { rank: string; confidence: number } {
  const roleData = stats.roles?.[role] || stats.general;
  if (!roleData) return { rank: 'Unknown', confidence: 0 };

  const benchmarks = RANK_BENCHMARKS[role] || RANK_BENCHMARKS.damage;
  const elims = roleData.average.eliminations;
  const deaths = roleData.average.deaths;
  const damage = roleData.average.damage;
  const healing = roleData.average.healing;

  let bestRank = 'bronze';
  let bestDistance = Infinity;

  for (const [rank, bench] of Object.entries(benchmarks)) {
    const elimDiff = (elims - bench.elims) / Math.max(bench.elims, 1);
    const deathDiff = (bench.deaths - deaths) / Math.max(bench.deaths, 1);
    const damageDiff = (damage - bench.damage) / Math.max(bench.damage, 1);
    const healDiff = (healing - bench.healing) / Math.max(bench.healing, 1);

    const distance = Math.abs(elimDiff) * 0.3 + Math.abs(deathDiff) * 0.25 +
      Math.abs(damageDiff) * 0.25 + Math.abs(healDiff) * 0.2;

    if (distance < bestDistance) {
      bestDistance = distance;
      bestRank = rank;
    }
  }

  // Confidence floor 0.3, aligned with iOS
  const confidence = Math.max(0.3, Math.min(1, 1 - bestDistance));
  return {
    rank: bestRank.charAt(0).toUpperCase() + bestRank.slice(1),
    confidence,
  };
}

// ---- Hero Pool Analysis (aligned with iOS) ----

// Subrole definitions
const TANK_SUBROLES: Record<string, string[]> = {
  'Shield Tank': ['reinhardt', 'sigma', 'ramattra', 'orisa'],
  'Dive Tank': ['winston', 'dva', 'wrecking-ball', 'doomfist'],
};

const DAMAGE_SUBROLES: Record<string, string[]> = {
  'Hitscan': ['soldier-76', 'cassidy', 'ashe', 'widowmaker', 'sojourn'],
  'Projectile': ['pharah', 'junkrat', 'hanzo', 'genji', 'echo'],
  'Flanker': ['tracer', 'genji', 'sombra', 'reaper'],
};

const SUPPORT_SUBROLES: Record<string, string[]> = {
  'Main Healer': ['ana', 'baptiste', 'moira', 'kiriko'],
  'Flex Support': ['lucio', 'mercy', 'zenyatta', 'brigitte'],
};

export interface HeroPoolAnalysis {
  diversityScore: number;
  diversityLabel: string;
  heroCount: number;
  tankCount: number;
  damageCount: number;
  supportCount: number;
  warnings: string[];
  subroles: Record<string, string[]>;
  oneTrick?: string;
}

export function analyzeHeroPool(
  heroes: Record<string, HeroStatEntry>,
  selectedRole?: string | null
): HeroPoolAnalysis {
  // iOS uses 2-game minimum
  const played = Object.entries(heroes).filter(([, h]) => h.games_played >= 2);
  const heroCount = played.length;

  let tankCount = 0, damageCount = 0, supportCount = 0;
  const tankHeroes: string[] = [], damageHeroes: string[] = [], supportHeroes: string[] = [];
  for (const [key] of played) {
    const role = getHeroRole(key);
    if (role === 'tank') { tankCount++; tankHeroes.push(key); }
    else if (role === 'damage') { damageCount++; damageHeroes.push(key); }
    else if (role === 'support') { supportCount++; supportHeroes.push(key); }
  }

  // Diversity score — iOS formula
  let diversityScore: number;
  if (selectedRole) {
    const maxExpected = selectedRole === 'damage' ? 5 : selectedRole === 'support' ? 4 : 3;
    const roleHeroes = played.filter(([key]) => getHeroRole(key) === selectedRole);
    diversityScore = Math.min(roleHeroes.length, maxExpected) / maxExpected * 100;
  } else {
    const roleBalance =
      Math.min(tankCount, 3) / 3 * 0.33 +
      Math.min(damageCount, 5) / 5 * 0.33 +
      Math.min(supportCount, 4) / 4 * 0.34;
    diversityScore = (Math.min(heroCount, 12) / 12 * 0.5 + roleBalance * 0.5) * 100;
  }

  // Diversity label
  let diversityLabel: string;
  if (diversityScore >= 70) diversityLabel = 'Versatile';
  else if (diversityScore >= 40) diversityLabel = 'Moderate';
  else diversityLabel = 'Narrow';

  const warnings: string[] = [];
  if (heroCount <= 2) warnings.push('Very small hero pool — consider expanding');
  if (!selectedRole) {
    if (tankCount === 0) warnings.push('No tank heroes played');
    if (damageCount === 0) warnings.push('No damage heroes played');
    if (supportCount === 0) warnings.push('No support heroes played');
  }

  // One-trick detection: >60% playtime (iOS uses time, not games)
  let oneTrick: string | undefined;
  const totalTime = played.reduce((s, [, h]) => s + h.time_played, 0);
  if (totalTime > 0) {
    const sorted = [...played].sort((a, b) => b[1].time_played - a[1].time_played);
    if (sorted.length > 0 && sorted[0][1].time_played / totalTime > 0.6) {
      oneTrick = sorted[0][0];
      warnings.push(`One-trick alert: ${oneTrick} has ${Math.round(sorted[0][1].time_played / totalTime * 100)}% of your playtime`);
    }
  }

  // Subrole analysis
  const subroles: Record<string, string[]> = {};
  const subroleMap = selectedRole === 'tank' ? TANK_SUBROLES
    : selectedRole === 'damage' ? DAMAGE_SUBROLES
    : selectedRole === 'support' ? SUPPORT_SUBROLES
    : { ...TANK_SUBROLES, ...DAMAGE_SUBROLES, ...SUPPORT_SUBROLES };

  for (const [subroleName, heroKeys] of Object.entries(subroleMap)) {
    const matching = played
      .filter(([key]) => heroKeys.includes(key))
      .map(([key]) => key);
    if (matching.length > 0) {
      subroles[subroleName] = matching;
    }
  }

  return {
    diversityScore, diversityLabel, heroCount,
    tankCount, damageCount, supportCount,
    warnings, subroles, oneTrick,
  };
}

// ---- Personalized Tips (role-specific, aligned with iOS) ----
export function getPersonalizedTips(
  stats: PlayerStatsSummary,
  selectedRole?: string | null,
  heroes?: Record<string, HeroStatEntry>
): string[] {
  const tips: string[] = [];
  const roleData = selectedRole && stats.roles?.[selectedRole]
    ? stats.roles[selectedRole]
    : stats.general;
  if (!roleData) return tips;

  const roleName = selectedRole
    ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)
    : 'Overall';

  const deaths = roleData.average.deaths;
  const elims = roleData.average.eliminations;
  const damage = roleData.average.damage;
  const healing = roleData.average.healing;
  const assists = roleData.average.assists;
  const wr = roleData.winrate;
  const kda = roleData.kda;

  // Role-specific death thresholds
  let highDeathThreshold: number;
  let lowDeathThreshold: number;
  switch (selectedRole) {
    case 'tank':    highDeathThreshold = 7; lowDeathThreshold = 3.5; break;
    case 'damage':  highDeathThreshold = 9; lowDeathThreshold = 4;   break;
    case 'support': highDeathThreshold = 7; lowDeathThreshold = 3;   break;
    default:        highDeathThreshold = 8; lowDeathThreshold = 4;   break;
  }

  // Death analysis
  if (deaths > highDeathThreshold) {
    tips.push(`[${roleName}] Deaths (${deaths.toFixed(1)}/10min) are high. Focus on positioning and using cover more effectively.`);
  } else if (deaths < lowDeathThreshold) {
    tips.push(`[${roleName}] Excellent survival rate (${deaths.toFixed(1)}/10min). Your positioning is strong.`);
  }

  // Win rate analysis
  if (wr < 45) {
    tips.push(`[${roleName}] Win rate is below average (${wr.toFixed(1)}%). Consider focusing on your best heroes in this role.`);
  } else if (wr >= 55) {
    tips.push(`[${roleName}] Strong win rate of ${wr.toFixed(1)}%! You're performing well.`);
  }

  // KDA analysis
  if (kda < 2.0) {
    tips.push(`[${roleName}] KDA of ${kda.toFixed(2)} could improve. Try to trade more efficiently.`);
  } else if (kda >= 4.0) {
    tips.push(`[${roleName}] Outstanding KDA of ${kda.toFixed(2)}. Your fight impact is excellent.`);
  }

  // Role-specific tips
  if (selectedRole === 'tank') {
    if (damage < 6000) {
      tips.push(`[Tank] Your damage output (${damage.toFixed(0)}/10min) is low. Tanks need to create space through damage pressure.`);
    }
    if (deaths > 6 && elims < 15) {
      tips.push('[Tank] High deaths with low elims — you may be overextending. Play with your team and time engagements better.');
    }
  } else if (selectedRole === 'damage') {
    if (damage < 5000) {
      tips.push(`[DPS] Damage output (${damage.toFixed(0)}/10min) is below average. Focus on consistent damage and target priority.`);
    }
    if (elims < 12) {
      tips.push(`[DPS] Eliminations (${elims.toFixed(1)}/10min) could be higher. Look for picks on out-of-position enemies.`);
    }
  } else if (selectedRole === 'support') {
    if (healing < 5000) {
      tips.push(`[Support] Healing output (${healing.toFixed(0)}/10min) is low. Prioritize keeping your team alive.`);
    }
    if (damage > 4000 && healing < 5000) {
      tips.push('[Support] High damage but low healing — balance your playstyle. Heal first, damage in safe windows.');
    }
    if (assists > 8) {
      tips.push(`[Support] Great assist count (${assists.toFixed(1)}/10min)! You're enabling your team well.`);
    }
  }

  // General tips
  if (damage > 5000 && healing < 1000) {
    tips.push('Very aggressive style (high damage, low healing). If you\'re Support, try to balance healing and damage output.');
  }
  if (healing > 5000 && damage < 2000) {
    tips.push('You\'re heal-focused. Consider adding some damage during safe moments to help finish low-HP targets.');
  }
  if (assists < 2 && elims > 10) {
    tips.push(`Low assists (${assists.toFixed(1)}/10min) despite good elims. Try to play more with your team.`);
  }

  // Hero pool advice
  if (heroes && selectedRole) {
    const roleHeroes = Object.entries(heroes).filter(
      ([key, h]) => getHeroRole(key) === selectedRole && h.games_played >= 5
    );
    if (roleHeroes.length < 2) {
      const roleText = selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1);
      tips.push(`You have ${roleHeroes.length} ${roleText} hero(es) with 5+ games. Expanding your pool gives you more flexibility.`);
    }
  }

  if (tips.length === 0) {
    tips.push('Keep up the good work! Focus on consistency and communication.');
  }

  return tips;
}

// ---- Top Heroes ----
export function getTopHeroes(
  heroes: Record<string, HeroStatEntry>,
  count: number = 3
): { key: string; stats: HeroStatEntry }[] {
  return Object.entries(heroes)
    .sort((a, b) => b[1].time_played - a[1].time_played)
    .slice(0, count)
    .map(([key, stats]) => ({ key, stats }));
}

export function getAllHeroesSorted(
  heroes: Record<string, HeroStatEntry>
): { key: string; stats: HeroStatEntry }[] {
  return Object.entries(heroes)
    .sort((a, b) => b[1].time_played - a[1].time_played)
    .map(([key, stats]) => ({ key, stats }));
}
