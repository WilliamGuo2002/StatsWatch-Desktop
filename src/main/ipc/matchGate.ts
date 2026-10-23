/**
 * The red line (Docs/DESIGN.md §1).
 *
 *   While a match is in progress, the app shows the player nothing.
 *   Recording happens during the match; presentation happens after.
 *
 * This is enforced HERE, in the main process, and not in the UI. The
 * renderer must never receive match data while a match is running, so that
 * there is no "panel hidden but the data is already in the frontend" case.
 *
 * Any IPC handler that returns per-match data MUST be registered through
 * `handleMatchData`. Registering such a handler directly with
 * ipcMain.handle bypasses the gate and is a bug.
 *
 * Blizzard warned Visor AND Pursuit users in 2018. Pursuit only did
 * post-game stats and was swept in anyway, so the line here is drawn at
 * *when* data is shown, not at whether it looks sensitive.
 */

import { IpcMainInvokeEvent, WebContents } from 'electron';
import { CaptureState, GameState, IPC } from '../../shared/ipc';
import { handle } from './envelope';
import { shell } from 'electron';
import { dumper } from '../gep/dumper';
import { getGepStatus, onGepStatusChanged } from '../gep/gameEvents';

export class MatchInProgressError extends Error {
  code = 'matchInProgress';
  constructor() {
    super('Match data is not available while a match is in progress.');
    this.name = 'MatchInProgressError';
  }
}

let state: CaptureState = {
  gameRunning: false,
  gameState: 'not_running',
  matchInProgress: false,
  recordedThisSession: 0,
};

const subscribers = new Set<WebContents>();

export function getCaptureState(): Readonly<CaptureState> {
  return state;
}

export function isMatchInProgress(): boolean {
  return state.matchInProgress;
}

/**
 * Called by the GEP collector (M0+) when game_info.game_state changes.
 * `match_in_progress` is the only state that closes the gate.
 */
export function setGameState(next: GameState): void {
  const wasInMatch = state.matchInProgress;
  const matchInProgress = next === 'match_in_progress';

  state = {
    ...state,
    gameState: next,
    gameRunning: next !== 'not_running',
    matchInProgress,
    recordedThisSession:
      wasInMatch && !matchInProgress
        ? state.recordedThisSession + 1
        : state.recordedThisSession,
  };

  broadcast();
}

function broadcast(): void {
  for (const wc of subscribers) {
    if (wc.isDestroyed()) subscribers.delete(wc);
    else wc.send(IPC.capture.onStateChanged, state);
  }
}

/**
 * Register a handler that returns per-match data. The gate is checked on
 * every invoke, so a renderer that asks mid-match gets an error, not data.
 */
export function handleMatchData<T>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<T> | T
): void {
  handle(channel, async (event, ...args) => {
    if (isMatchInProgress()) throw new MatchInProgressError();
    return handler(event, ...(args as unknown[]));
  });
}

export function registerCaptureIpc(): void {
  // Capture state itself is NOT match data — it carries no numbers from the
  // match, only whether we are recording — so the UI can show an indicator.
  handle(IPC.capture.getState, (event) => {
    subscribers.add(event.sender);
    return state;
  });

  // GEP plumbing status: whether the package loaded, whether the game was
  // detected, whether elevation blocks us. No match data here either.
  handle(IPC.capture.getGepStatus, () => getGepStatus());

  // File metadata only — never contents. A dump holds the BattleTags of
  // everyone in the match.
  handle(IPC.capture.listDumps, () => {
    const active = dumper.current;
    const files = dumper.list().map((f) => ({
      name: f.name,
      bytes: active && active.name === f.name ? active.bytes : f.bytes,
      lines: active && active.name === f.name ? active.lines : -1,
      startedAt: f.startedAt,
      active: Boolean(active && active.name === f.name),
    }));
    return files;
  });

  handle(IPC.capture.revealDumps, async () => {
    await shell.openPath(dumper.directory);
    return true;
  });

  // Status changes ride the same broadcast as the capture state.
  onGepStatusChanged(() => broadcast());
}

/** Test seam: reset module state between cases. */
export function __resetForTests(): void {
  state = {
    gameRunning: false,
    gameState: 'not_running',
    matchInProgress: false,
    recordedThisSession: 0,
  };
  subscribers.clear();
}
