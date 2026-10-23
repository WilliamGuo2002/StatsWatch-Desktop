/**
 * IPC contract between the main process and the renderer.
 *
 * Every channel is listed here so the full surface the renderer can reach
 * is auditable in one file. See Docs/DESIGN.md §1 (红线) — match data
 * channels are gated in the main process while a match is in progress.
 */

export const IPC = {
  // OverFast (career data). Not match data — never gated.
  overfast: {
    searchPlayers: 'overfast:searchPlayers',
    playerSummary: 'overfast:playerSummary',
    playerStatsSummary: 'overfast:playerStatsSummary',
    playerCareerStats: 'overfast:playerCareerStats',
    heroes: 'overfast:heroes',
    heroDetail: 'overfast:heroDetail',
    heroGlobalStats: 'overfast:heroGlobalStats',
    maps: 'overfast:maps',
    gamemodes: 'overfast:gamemodes',
  },

  // Live capture state. Carries NO match data — only whether we are
  // recording, so the UI can show an indicator.
  capture: {
    getState: 'capture:getState',
    onStateChanged: 'capture:stateChanged',
    // M0: the raw event dump. Returns file metadata only — never contents,
    // which hold other players' BattleTags.
    getGepStatus: 'capture:getGepStatus',
    listDumps: 'capture:listDumps',
    revealDumps: 'capture:revealDumps',
  },
} as const;

/** Mirrors GEP `game_info.game_state`. */
export type GameState =
  | 'not_running'
  | 'loading_screen_start'
  | 'game_loaded'
  | 'role_select_screen_start'
  | 'role_select_screen_end'
  | 'match_in_progress'
  | 'match_ended';

export interface CaptureState {
  gameRunning: boolean;
  gameState: GameState;
  /**
   * True while a match is in progress. The main process refuses to send any
   * match data to the renderer while this is true, and the UI shows only a
   * recording indicator.
   */
  matchInProgress: boolean;
  /** Matches recorded this session. A count, not match data. */
  recordedThisSession: number;
}

export interface GepStatusView {
  packageReady: boolean;
  gameId: number | null;
  elevationRequired: boolean;
  lastError: string | null;
}

export interface DumpFileView {
  name: string;
  bytes: number;
  lines: number;
  startedAt: number;
  active: boolean;
}

/** Shape of the error an IPC handler rejects with. */
export interface IpcErrorShape {
  code: string;
  message: string;
  status?: number;
}
