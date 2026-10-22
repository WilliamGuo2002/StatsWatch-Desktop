import { useNavigate, useLocation } from 'react-router-dom';

/**
 * The window's own title bar. The region is draggable; Windows renders its
 * native minimise/maximise/close over the right end (titleBarOverlay in
 * the main process), so we leave that space free.
 */
export default function TitleBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const canGoBack = location.key !== 'default';

  return (
    <header
      className="h-[38px] shrink-0 bg-ow-darker border-b border-ow-border flex items-center select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-1 pl-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={() => navigate(-1)}
          disabled={!canGoBack}
          title="Back"
          className="w-7 h-7 grid place-items-center rounded text-ow-text-muted hover:text-ow-text hover:bg-ow-card disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => navigate(1)}
          title="Forward"
          className="w-7 h-7 grid place-items-center rounded text-ow-text-muted hover:text-ow-text hover:bg-ow-card transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="flex-1 text-center text-[11px] tracking-wide text-ow-text-muted font-medium">
        StatsWatch Desktop
      </div>

      {/* Reserved for the native window controls. */}
      <div className="w-[138px] shrink-0" />
    </header>
  );
}
