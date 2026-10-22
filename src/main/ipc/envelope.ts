/**
 * IPC result envelope.
 *
 * Electron rewrites thrown errors as it ferries them across the bridge
 * ("Error invoking remote method '...': ..."), which loses the error class
 * and any fields on it. The renderer needs `code` and `status` intact —
 * components branch on `err instanceof ApiError && err.status === 404` —
 * so handlers return a tagged result and the renderer shim rethrows a real
 * ApiError on the other side.
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { IpcErrorShape } from '../../shared/ipc';

export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: IpcErrorShape };

interface CodedError {
  code?: unknown;
  status?: unknown;
  message?: unknown;
}

export function toErrorShape(err: unknown): IpcErrorShape {
  const e = (err ?? {}) as CodedError;
  return {
    code: typeof e.code === 'string' ? e.code : 'unknown',
    message: typeof e.message === 'string' ? e.message : String(err),
    status: typeof e.status === 'number' ? e.status : undefined,
  };
}

/** Register a handler whose result is wrapped in an envelope. */
export function handle<T>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: never[]) => Promise<T> | T
): void {
  ipcMain.handle(channel, async (event, ...args): Promise<IpcResult<T>> => {
    try {
      return { ok: true, data: await handler(event, ...(args as never[])) };
    } catch (err) {
      return { ok: false, error: toErrorShape(err) };
    }
  });
}
