import { app } from 'electron';
import { dumper } from './dumper';
import { setGameState } from '../ipc/matchGate';
import type { GameState } from '../../shared/ipc';

/**
 * Overwolf Game Events Provider (GEP) subscription — M0.
 *
 * Subscribes to every feature Overwatch exposes and writes the raw stream
 * to disk. Nothing here interprets the data; see Docs/GEP-REFERENCE.md for
 * the field tables and Docs/DESIGN.md §7 for what gets derived from it
 * later.
 *
 * This does not use the `overlay` package, and the app never declares it
 * (package.json lists only "gep"). Docs/DESIGN.md §1: no in-game overlay,
 * so no injection into the game process at any point in the project.
 */

/** From @overwolf/ow-electron-packages-types: kGepSupportedGameIds.Overwatch */
export const OVERWATCH_GAME_ID = 10844;
/** Public Test Region build, same event contract. */
export const OVERWATCH_PTR_GAME_ID = 21438;

const WATCHED = new Set([OVERWATCH_GAME_ID, OVERWATCH_PTR_GAME_ID]);

/** The subset of game_state values we care about; anything else passes through. */
const GAME_STATES: readonly GameState[] = [
  'loading_screen_start',
  'game_loaded',
  'role_select_screen_start',
  'role_select_screen_end',
  'match_in_progress',
  'match_ended',
];

type Listener = (...args: unknown[]) => void;

interface GepApi {
  on(event: string, cb: Listener): void;
  removeAllListeners(): void;
  setRequiredFeatures(gameId: number, features: string[] | null): Promise<unknown>;
  getInfo(gameId: number): Promise<unknown>;
}

interface OverwolfPackages {
  on(event: 'ready', cb: (e: unknown, name: string, version: string) => void): void;
  gep?: GepApi;
}

function packages(): OverwolfPackages | undefined {
  return (app as unknown as { overwolf?: { packages?: OverwolfPackages } }).overwolf?.packages;
}

export interface GepStatus {
  packageReady: boolean;
  gameId: number | null;
  /** Set when the game runs elevated and we do not. */
  elevationRequired: boolean;
  lastError: string | null;
}

const status: GepStatus = {
  packageReady: false,
  gameId: null,
  elevationRequired: false,
  lastError: null,
};

export function getGepStatus(): Readonly<GepStatus> {
  return status;
}

let onChanged: (() => void) | null = null;
export function onGepStatusChanged(cb: () => void): void {
  onChanged = cb;
}
const changed = () => onChanged?.();

/**
 * `data` arrives as a JSON string for some features. We log it verbatim and
 * only peek at the few fields that drive the match gate and the relative
 * timestamps — parsing for analysis happens later, off the fixture.
 */
function peek(raw: unknown): Record<string, unknown> | null {
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      const v = JSON.parse(raw);
      return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return null;
}

function handleInfo(gameId: number, data: unknown): void {
  dumper.record('info', gameId, data);

  // game_info.game_state drives the red line: while match_in_progress the
  // main process refuses to hand match data to the renderer.
  const obj = peek(data);
  if (!obj) return;

  const info = peek(obj.info) ?? obj;
  const gameInfo = peek((info as Record<string, unknown>).game_info);
  const state = gameInfo?.game_state ?? (obj.key === 'game_state' ? obj.value : undefined);

  if (typeof state === 'string' && (GAME_STATES as readonly string[]).includes(state)) {
    setGameState(state as GameState);
  }
}

function handleEvent(gameId: number, data: unknown): void {
  dumper.record('event', gameId, data);

  const obj = peek(data);
  const events = Array.isArray(obj?.events) ? obj!.events : [obj];

  for (const e of events) {
    const name = peek(e)?.name;
    if (name === 'match_start') {
      dumper.markMatchStart(Date.now());
      setGameState('match_in_progress');
    } else if (name === 'match_end') {
      dumper.markMatchEnd();
      setGameState('match_ended');
    } else if (name === 'game_exit') {
      setGameState('not_running');
    }
  }
}

/**
 * Wire up GEP. Safe to call before the package exists: it waits for the
 * `ready` event, and if the gep package never arrives nothing happens and
 * the rest of the app is unaffected.
 */
export function initGameEvents(): void {
  const pkgs = packages();
  if (!pkgs) {
    status.lastError = 'ow-electron packages API unavailable (not running under ow-electron?)';
    changed();
    return;
  }

  pkgs.on('ready', (_e, name) => {
    if (name !== 'gep') return;

    const gep = pkgs.gep;
    if (!gep) return;

    status.packageReady = true;
    status.lastError = null;
    changed();

    gep.removeAllListeners();

    gep.on('game-detected', (...args: unknown[]) => {
      const [event, gameId] = args as [{ enable(): void }, number];
      if (!WATCHED.has(gameId)) return;

      event.enable();
      status.gameId = gameId;
      status.elevationRequired = false;
      changed();

      dumper.open(gameId, 'M0 raw capture');

      // null = every feature this game exposes. For Overwatch that is
      // game_info, match_info, kill, assist, death, roster, gep_internal.
      gep.setRequiredFeatures(gameId, null).catch((err: unknown) => {
        status.lastError = String(err);
        changed();
      });
    });

    gep.on('elevated-privileges-required', (...args: unknown[]) => {
      const [, gameId] = args as [unknown, number];
      if (!WATCHED.has(gameId)) return;
      // The game is running as administrator. Windows will not let a
      // non-elevated process observe it; this is ordinary OS behaviour,
      // not an indication that anything is injected.
      status.elevationRequired = true;
      changed();
    });

    gep.on('new-info-update', (...args: unknown[]) => {
      const [, gameId, data] = args as [unknown, number, unknown];
      if (WATCHED.has(gameId)) handleInfo(gameId, data);
    });

    gep.on('new-game-event', (...args: unknown[]) => {
      const [, gameId, data] = args as [unknown, number, unknown];
      if (WATCHED.has(gameId)) handleEvent(gameId, data);
    });

    gep.on('error', (...args: unknown[]) => {
      const [, gameId, error] = args as [unknown, number, unknown];
      if (!WATCHED.has(gameId)) return;
      status.lastError = String(error);
      changed();
    });

    gep.on('game-exit', (...args: unknown[]) => {
      const [, gameId] = args as [unknown, number];
      if (!WATCHED.has(gameId)) return;
      status.gameId = null;
      changed();
      setGameState('not_running');
      dumper.close();
    });
  });
}
