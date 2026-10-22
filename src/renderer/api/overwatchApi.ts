/**
 * OverFast access for the renderer.
 *
 * The exported surface is identical to the web version's, so every
 * component importing from here is unchanged. The difference is underneath:
 * requests go over IPC to the main process, which owns the HTTP client, the
 * cache and the 429 backoff (see src/main/overfast/client.ts).
 */
import type {
  PlayerSearchResponse,
  PlayerSummary,
  PlayerStatsSummary,
  CareerStatCategory,
  HeroInfo,
  HeroDetail,
  HeroGlobalStat,
  MapInfo,
  GamemodeInfo,
  GameMode,
} from '../types/models';

export class ApiError extends Error {
  code: string;
  status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

const bridge = window.statswatch.overfast;

/** Rethrow the main process's error shape as a real ApiError. */
function rethrow(err: unknown): never {
  const e = err as { code?: string; message?: string; status?: number };
  throw new ApiError(
    e?.code ?? 'unknown',
    e?.message ?? 'Unexpected error',
    e?.status
  );
}

function wrap<T>(p: Promise<T>): Promise<T> {
  return p.catch(rethrow);
}

export function searchPlayers(name: string): Promise<PlayerSearchResponse> {
  return wrap(bridge.searchPlayers<PlayerSearchResponse>(name));
}

export function getPlayerSummary(playerId: string): Promise<PlayerSummary> {
  return wrap(bridge.playerSummary<PlayerSummary>(playerId));
}

export function getPlayerStatsSummary(
  playerId: string,
  gamemode: GameMode = 'competitive'
): Promise<PlayerStatsSummary> {
  return wrap(bridge.playerStatsSummary<PlayerStatsSummary>(playerId, gamemode));
}

export function getPlayerCareerStats(
  playerId: string,
  gamemode: GameMode = 'competitive'
): Promise<Record<string, CareerStatCategory[]>> {
  return wrap(bridge.playerCareerStats<Record<string, CareerStatCategory[]>>(playerId, gamemode));
}

export function getHeroes(): Promise<HeroInfo[]> {
  return wrap(bridge.heroes<HeroInfo[]>());
}

export function getHeroDetail(heroKey: string): Promise<HeroDetail> {
  return wrap(bridge.heroDetail<HeroDetail>(heroKey));
}

export function getHeroGlobalStats(
  platform: string = 'pc',
  gamemode: GameMode = 'competitive'
): Promise<HeroGlobalStat[]> {
  return wrap(bridge.heroGlobalStats<HeroGlobalStat[]>(platform, gamemode));
}

export function getMaps(): Promise<MapInfo[]> {
  return wrap(bridge.maps<MapInfo[]>());
}

export function getGamemodes(): Promise<GamemodeInfo[]> {
  return wrap(bridge.gamemodes<GamemodeInfo[]>());
}
