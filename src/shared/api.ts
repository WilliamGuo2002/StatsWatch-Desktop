/**
 * The shape of `window.statswatch`.
 *
 * Declared here, with no electron import, so the renderer can type against
 * it without pulling the preload (and therefore electron) into its
 * TypeScript project. The preload implements this interface.
 */
import type { CaptureState } from './ipc';

export interface OverfastBridge {
  searchPlayers<T>(name: string): Promise<T>;
  playerSummary<T>(id: string): Promise<T>;
  playerStatsSummary<T>(id: string, gamemode?: string): Promise<T>;
  playerCareerStats<T>(id: string, gamemode?: string): Promise<T>;
  heroes<T>(): Promise<T>;
  heroDetail<T>(key: string): Promise<T>;
  heroGlobalStats<T>(platform?: string, gamemode?: string): Promise<T>;
  maps<T>(): Promise<T>;
  gamemodes<T>(): Promise<T>;
}

export interface CaptureBridge {
  getState(): Promise<CaptureState>;
  /** Returns an unsubscribe function. */
  onStateChanged(cb: (s: CaptureState) => void): () => void;
}

export interface StatsWatchApi {
  overfast: OverfastBridge;
  capture: CaptureBridge;
}
