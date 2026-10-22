import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Catch-all route.
 *
 * Without this, a path with no matching route rendered an empty content
 * area with no explanation — which is how a dead link on the profile page
 * went unnoticed.
 */
export default function NotFound() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <svg className="h-10 w-10 text-ow-text-muted" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-[15px] font-semibold text-ow-text">{t('Page not found')}</p>
      <code className="rounded bg-ow-card px-2 py-1 text-[11px] text-ow-text-muted">
        {location.pathname}
      </code>
      <Link
        to="/"
        className="mt-1 rounded-lg border border-ow-border bg-ow-card px-4 py-1.5 text-[13px] text-ow-text transition-colors hover:bg-ow-card-hover"
      >
        {t('Back to Search')}
      </Link>
    </div>
  );
}
