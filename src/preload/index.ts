import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc';
import type { CaptureState, IpcErrorShape } from '../shared/ipc';
import type { StatsWatchApi } from '../shared/api';

type IpcResult<T> = { ok: true; data: T } | { ok: false; error: IpcErrorShape };

/**
 * Unwrap the main process's result envelope. On failure we throw a plain
 * object carrying `code`/`status`; the renderer's api layer turns that back
 * into an ApiError so components keep working unchanged.
 */
async function call<T>(channel: string, ...args: unknown[]): Promise<T> {
  const res: IpcResult<T> = await ipcRenderer.invoke(channel, ...args);
  if (res.ok) return res.data;
  throw res.error;
}

/**
 * The entire surface the renderer can reach. Nothing else is exposed —
 * no node, no fs, no arbitrary ipcRenderer.
 */
const api: StatsWatchApi = {
  overfast: {
    searchPlayers: <T>(name: string) => call<T>(IPC.overfast.searchPlayers, name),
    playerSummary: <T>(id: string) => call<T>(IPC.overfast.playerSummary, id),
    playerStatsSummary: <T>(id: string, gamemode?: string) =>
      call<T>(IPC.overfast.playerStatsSummary, id, gamemode),
    playerCareerStats: <T>(id: string, gamemode?: string) =>
      call<T>(IPC.overfast.playerCareerStats, id, gamemode),
    heroes: <T>() => call<T>(IPC.overfast.heroes),
    heroDetail: <T>(key: string) => call<T>(IPC.overfast.heroDetail, key),
    heroGlobalStats: <T>(platform?: string, gamemode?: string) =>
      call<T>(IPC.overfast.heroGlobalStats, platform, gamemode),
    maps: <T>() => call<T>(IPC.overfast.maps),
    gamemodes: <T>() => call<T>(IPC.overfast.gamemodes),
  },

  capture: {
    getState: () => call<CaptureState>(IPC.capture.getState),
    onStateChanged: (cb: (s: CaptureState) => void) => {
      const listener = (_e: unknown, s: CaptureState) => cb(s);
      ipcRenderer.on(IPC.capture.onStateChanged, listener);
      return () => ipcRenderer.off(IPC.capture.onStateChanged, listener);
    },
  },
};

contextBridge.exposeInMainWorld('statswatch', api);
