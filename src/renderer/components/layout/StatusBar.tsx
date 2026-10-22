import { useTranslation } from 'react-i18next';
import { useCaptureState } from '../../hooks/useCaptureState';

/**
 * The bottom status strip.
 *
 * While a match is running this is the ONLY thing the app shows about it:
 * that it is recording, and nothing else. No kills, no score, no hero.
 * See Docs/DESIGN.md §1 — the main process will not send match data to the
 * renderer until the match ends, so there is nothing here to leak.
 */
export default function StatusBar() {
  const { t } = useTranslation();
  const capture = useCaptureState();

  const { gameRunning, matchInProgress, recordedThisSession } = capture;

  let dot = 'bg-ow-text-muted';
  let label = t('Overwatch not running');

  if (matchInProgress) {
    dot = 'bg-red-500 animate-pulse';
    label = t('Recording this match');
  } else if (gameRunning) {
    dot = 'bg-ow-support';
    label = t('Overwatch running');
  }

  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-ow-border bg-ow-darker px-3 text-[11px] text-ow-text-muted select-none">
      <div className="flex items-center gap-1.5" title={label}>
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <span className={matchInProgress ? 'text-ow-text-secondary' : undefined}>{label}</span>
      </div>

      {matchInProgress && (
        <span className="text-ow-text-muted">
          {t('Stats unlock when the match ends')}
        </span>
      )}

      {recordedThisSession > 0 && (
        <span>{t('{{count}} recorded this session', { count: recordedThisSession })}</span>
      )}

      <div className="ml-auto flex items-center gap-3">
        <span>{t('Career data: OverFast API')}</span>
        <span className="opacity-60">{t('Unofficial — not affiliated with Blizzard')}</span>
      </div>
    </footer>
  );
}
