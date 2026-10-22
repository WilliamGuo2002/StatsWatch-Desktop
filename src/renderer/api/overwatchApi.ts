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

/**
 * Resolved lazily, not at module scope.
 *
 * Reading window.statswatch while the module is being evaluated means a
 * missing preload takes the whole app down before React mounts, and the
 * user gets a blank window with nothing to go on. Lazy access turns that
 * into an error the UI can actually show.
 */
function bridgeOrThrow() {
  const api = window.statswatch;
  if (!api?.overfast) {
    throw new ApiError(
      'bridgeUnavailable',
      'The app could not reach its own main process. The preload script did not load.'
    );
  }
  return api.overfast;
}

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
  return wrap(bridgeOrThrow().searchPlayers<PlayerSearchResponse>(name));
}

export function getPlayerSummary(playerId: string): Promise<PlayerSummary> {
  return wrap(bridgeOrThrow().playerSummary<PlayerSummary>(playerId));
}

export function getPlayerStatsSummary(
  playerId: string,
  gamemode: GameMode = 'competitive'
): Promise<PlayerStatsSummary> {
  return wrap(bridgeOrThrow().playerStatsSummary<PlayerStatsSummary>(playerId, gamemode));
}

export function getPlayerCareerStats(
  playerId: string,
  gamemode: GameMode = 'competitive'
): Promise<Record<string, CareerStatCategory[]>> {
  return wrap(bridgeOrThrow().playerCareerStats<Record<string, CareerStatCategory[]>>(playerId, gamemode));
}

export function getHeroes(): Promise<HeroInfo[]> {
  return wrap(bridgeOrThrow().heroes<HeroInfo[]>());
}

export function getHeroDetail(heroKey: string): Promise<HeroDetail> {
  return wrap(bridgeOrThrow().heroDetail<HeroDetail>(heroKey));
}

export function getHeroGlobalStats(
  platform: string = 'pc',
  gamemode: GameMode = 'competitive'
): Promise<HeroGlobalStat[]> {
  return wrap(bridgeOrThrow().heroGlobalStats<HeroGlobalStat[]>(platform, gamemode));
}

export function getMaps(): Promise<MapInfo[]> {
  return wrap(bridgeOrThrow().maps<MapInfo[]>());
}

export function getGamemodes(): Promise<GamemodeInfo[]> {
  return wrap(bridgeOrThrow().gamemodes<GamemodeInfo[]>());
}
