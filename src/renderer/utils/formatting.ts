export function formatBattleTag(playerId: string): string {
  const lastDash = playerId.lastIndexOf('-');
  if (lastDash === -1) return playerId;
  const suffix = playerId.substring(lastDash + 1);
  if (/^\d+$/.test(suffix)) {
    return playerId.substring(0, lastDash) + '#' + suffix;
  }
  return playerId;
}

export function battleTagToPlayerId(battleTag: string): string {
  return battleTag.replace('#', '-');
}

export function formatTimePlayed(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export function formatTimePlayedShort(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  if (hours > 0) return `${hours}h`;
  return `${Math.floor(seconds / 60)}m`;
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatStat(value: number, decimals: number = 1): string {
  return value.toFixed(decimals);
}

export function getDisplaySeason(apiSeason?: number): number | null {
  if (!apiSeason) return null;
  return apiSeason - 20;
}

export function getRankDisplay(division: string, tier: number): string {
  const name = division.charAt(0).toUpperCase() + division.slice(1);
  return `${name} ${tier}`;
}

export function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function formatStatValue(value: number | string): string {
  if (typeof value === 'string') return value;
  if (Number.isInteger(value)) return value.toLocaleString();
  return value.toFixed(2);
}
