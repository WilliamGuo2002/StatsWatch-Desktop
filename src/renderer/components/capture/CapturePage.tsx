import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCaptureState } from '../../hooks/useCaptureState';
import type { DumpFileView, GepStatusView } from '../../../shared/ipc';

/**
 * M0 — raw event capture.
 *
 * Shows whether the GEP pipe is connected and what has been written to
 * disk. It deliberately shows no match data: while a match is running the
 * main process sends none (Docs/DESIGN.md §1), and dump contents are never
 * read into the renderer because they hold other players' BattleTags.
 */

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ow-border py-2 last:border-0">
      <span className="text-[12px] text-ow-text-secondary">{label}</span>
      <span className={`text-[12px] font-medium ${tone ?? 'text-ow-text'}`}>{value}</span>
    </div>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function CapturePage() {
  const { t } = useTranslation();
  const capture = useCaptureState();
  const [gep, setGep] = useState<GepStatusView | null>(null);
  const [dumps, setDumps] = useState<DumpFileView[]>([]);

  const refresh = useCallback(async () => {
    const api = window.statswatch?.capture;
    if (!api) return;
    try {
      const [s, d] = await Promise.all([api.getGepStatus(), api.listDumps()]);
      setGep(s);
      setDumps(d);
    } catch {
      // The bridge reports its own failure through the startup guard.
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, [refresh]);

  const pipeOk = gep?.packageReady && !gep.lastError;

  return (
    <div className="mx-auto max-w-3xl space-y-5 py-2">
      <header>
        <h1 className="text-[20px] font-bold text-ow-text">{t('Event Capture')}</h1>
        <p className="mt-1 text-[12px] leading-relaxed text-ow-text-secondary">
          {t('Leave this app running and play a match. Every game event is written to a file so match analysis can be built against it later.')}
        </p>
      </header>

      <section className="rounded-xl border border-ow-border bg-ow-card p-4">
        <h2 className="mb-2 text-[13px] font-bold text-ow-text">{t('Pipeline')}</h2>
        <Row
          label={t('Game events package')}
          value={gep?.packageReady ? t('Ready') : t('Waiting')}
          tone={gep?.packageReady ? 'text-ow-support' : 'text-ow-text-muted'}
        />
        <Row
          label={t('Overwatch')}
          value={capture.gameRunning ? t('Detected') : t('Not running')}
          tone={capture.gameRunning ? 'text-ow-support' : 'text-ow-text-muted'}
        />
        <Row label={t('Game state')} value={capture.gameState} />
        <Row
          label={t('Recording')}
          value={capture.matchInProgress ? t('Recording this match') : t('Idle')}
          tone={capture.matchInProgress ? 'text-red-400' : 'text-ow-text-muted'}
        />
        <Row label={t('Matches this session')} value={String(capture.recordedThisSession)} />

        {gep?.elevationRequired && (
          <p className="mt-3 rounded-lg bg-ow-orange/10 p-2.5 text-[11px] leading-relaxed text-ow-orange">
            {t('Overwatch is running as administrator. Windows will not let a normal process observe it, so this app must also be run as administrator to receive events.')}
          </p>
        )}

        {gep?.lastError && (
          <p className="mt-3 rounded-lg bg-red-500/10 p-2.5 text-[11px] leading-relaxed text-red-400">
            {gep.lastError}
          </p>
        )}

        {!pipeOk && !gep?.lastError && (
          <div className="mt-3 space-y-1.5 rounded-lg bg-ow-darker p-2.5">
            <p className="text-[11px] font-semibold text-ow-text-secondary">
              {t('Game packages need an Overwolf developer key')}
            </p>
            <p className="text-[11px] leading-relaxed text-ow-text-muted">
              {t('Without OW_DEV_KEY the package manager refuses to load the game events package, and the app runs without capture. Set it before launching:')}
            </p>
            <code className="block rounded bg-ow-dark px-2 py-1 font-mono text-[10px] text-ow-text-secondary">
              $env:OW_DEV_KEY = &apos;...&apos;
            </code>
            <p className="text-[11px] leading-relaxed text-ow-text-muted">
              {t('The key comes from your dev.overwolf.com profile once Developer status is Approved.')}
            </p>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-ow-border bg-ow-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[13px] font-bold text-ow-text">{t('Captured files')}</h2>
          <button
            onClick={() => window.statswatch?.capture.revealDumps()}
            className="rounded-lg border border-ow-border px-2.5 py-1 text-[11px] text-ow-text-secondary transition-colors hover:bg-ow-card-hover hover:text-ow-text"
          >
            {t('Open folder')}
          </button>
        </div>

        {dumps.length === 0 ? (
          <p className="py-3 text-[12px] text-ow-text-muted">{t('Nothing captured yet')}</p>
        ) : (
          <div className="space-y-1">
            {dumps.map((f) => (
              <div
                key={f.name}
                className="flex items-center gap-2 rounded-lg bg-ow-darker px-3 py-2"
              >
                {f.active && <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-red-500" />}
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-ow-text">
                  {f.name}
                </span>
                {f.lines >= 0 && (
                  <span className="shrink-0 text-[11px] tabular-nums text-ow-text-secondary">
                    {t('{{count}} lines', { count: f.lines })}
                  </span>
                )}
                <span className="shrink-0 text-[11px] tabular-nums text-ow-text-muted">
                  {formatBytes(f.bytes)}
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="mt-3 text-[11px] leading-relaxed text-ow-text-muted">
          {t('These files contain the BattleTags of everyone in your matches. They stay on this computer and are never uploaded.')}
        </p>
      </section>
    </div>
  );
}
