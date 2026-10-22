/**
 * OverFast API client (main process).
 *
 * Lives in the main process rather than the renderer so that caching and
 * rate-limit backoff happen in one place. Docs/DESIGN.md §8.4 lists
 * OverFast rate limiting as a scaling risk whose mitigation is client-side
 * caching — this is that cache.
 */

import { IpcErrorShape } from '../../shared/ipc';

const BASE_URL = 'https://overfast-api.tekrop.fr';
const TIMEOUT_MS = 30_000;

/** Career data changes slowly; heroes/maps/gamemodes barely at all. */
const TTL_MS: Record<string, number> = {
  '/players': 2 * 60_000,
  '/heroes': 6 * 60 * 60_000,
  '/maps': 24 * 60 * 60_000,
  '/gamemodes': 24 * 60 * 60_000,
};

function ttlFor(endpoint: string): number {
  for (const prefix of Object.keys(TTL_MS)) {
    if (endpoint.startsWith(prefix)) return TTL_MS[prefix];
  }
  return 5 * 60_000;
}

interface CacheEntry {
  at: number;
  ttl: number;
  value: unknown;
}

const cache = new Map<string, CacheEntry>();
/** De-dupes concurrent identical requests (React Query can fire several). */
const inFlight = new Map<string, Promise<unknown>>();

/** Set when OverFast returns 429; we refuse to hammer it until it passes. */
let backoffUntil = 0;

export class ApiError extends Error implements IpcErrorShape {
  code: string;
  status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }

  toIpc(): IpcErrorShape {
    return { code: this.code, message: this.message, status: this.status };
  }
}

async function request<T>(endpoint: string): Promise<T> {
  const now = Date.now();

  const hit = cache.get(endpoint);
  if (hit && now - hit.at < hit.ttl) return hit.value as T;

  const pending = inFlight.get(endpoint);
  if (pending) return pending as Promise<T>;

  if (now < backoffUntil) {
    // Serve stale rather than add load while rate limited.
    if (hit) return hit.value as T;
    const waitS = Math.ceil((backoffUntil - now) / 1000);
    throw new ApiError('rateLimited', `Rate limited. Try again in ${waitS}s.`, 429);
  }

  const p = (async () => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'User-Agent': 'StatsWatch-Desktop' },
    });

    if (!res.ok) {
      switch (res.status) {
        case 404:
          throw new ApiError('playerNotFound', 'Player not found', 404);
        case 422:
          throw new ApiError('profilePrivate', 'Player profile is private', 422);
        case 429:
          backoffUntil = Date.now() + 60_000;
          if (hit) return hit.value;
          throw new ApiError('rateLimited', 'Rate limited. Please try again later.', 429);
        default:
          throw new ApiError('serverError', `Server error (${res.status})`, res.status);
      }
    }

    const value = await res.json();
    cache.set(endpoint, { at: Date.now(), ttl: ttlFor(endpoint), value });
    return value;
  })().finally(() => inFlight.delete(endpoint));

  inFlight.set(endpoint, p);
  return p as Promise<T>;
}

const enc = encodeURIComponent;

export const overfast = {
  searchPlayers: (name: string) => request(`/players?name=${enc(name)}&limit=20`),
  playerSummary: (id: string) => request(`/players/${enc(id)}/summary`),
  playerStatsSummary: (id: string, gamemode = 'competitive') =>
    request(`/players/${enc(id)}/stats/summary?gamemode=${enc(gamemode)}`),
  playerCareerStats: (id: string, gamemode = 'competitive') =>
    request(`/players/${enc(id)}/stats/career?gamemode=${enc(gamemode)}`),
  heroes: () => request('/heroes'),
  heroDetail: (key: string) => request(`/heroes/${enc(key)}`),
  heroGlobalStats: (platform = 'pc', gamemode = 'competitive') =>
    request(`/heroes/stats?platform=${enc(platform)}&gamemode=${enc(gamemode)}`),
  maps: () => request('/maps'),
  gamemodes: () => request('/gamemodes'),
};
