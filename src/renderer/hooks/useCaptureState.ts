import { useEffect, useState } from 'react';
import type { CaptureState } from '../../shared/ipc';

const INITIAL: CaptureState = {
  gameRunning: false,
  gameState: 'not_running',
  matchInProgress: false,
  recordedThisSession: 0,
};

/**
 * Live capture state from the main process.
 *
 * Carries no match data — only whether we are recording. See
 * Docs/DESIGN.md §1: match data never reaches the renderer while a match
 * is in progress, so the status bar shows an indicator, never numbers.
 */
export function useCaptureState(): CaptureState {
  const [state, setState] = useState<CaptureState>(INITIAL);

  useEffect(() => {
    const api = window.statswatch?.capture;
    if (!api) return;

    let alive = true;
    api.getState().then((s) => {
      if (alive) setState(s);
    });
    const off = api.onStateChanged(setState);

    return () => {
      alive = false;
      off();
    };
  }, []);

  return state;
}
