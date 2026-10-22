import { useTranslation } from 'react-i18next';

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-lg mx-auto py-8 space-y-6">
      {/* App Info */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-ow-text">{t('StatsWatch')}</h1>
        <p className="text-sm text-ow-text-muted">v1.0.0</p>
        <p className="text-sm text-ow-text-secondary">
          {t('Track your Overwatch 2 stats and compare with others')}
        </p>
      </div>

      {/* Feedback */}
      <div className="bg-ow-card border border-ow-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-ow-text">{t('Feedback')}</h2>

        <a
          href="mailto:statswatchapp@gmail.com?subject=StatsWatch%20Feedback"
          className="flex items-center gap-3 p-3 bg-ow-darker rounded-lg hover:bg-ow-card-hover transition-colors"
        >
          <svg className="w-5 h-5 text-ow-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <div>
            <div className="text-sm text-ow-text">{t('Contact Developer')}</div>
            <div className="text-xs text-ow-text-muted">{t('General feedback or questions')}</div>
          </div>
        </a>

        <a
          href="mailto:statswatchapp@gmail.com?subject=StatsWatch%20Bug%20Report"
          className="flex items-center gap-3 p-3 bg-ow-darker rounded-lg hover:bg-ow-card-hover transition-colors"
        >
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <div className="text-sm text-ow-text">{t('Report a Bug')}</div>
            <div className="text-xs text-ow-text-muted">{t('Help us fix issues')}</div>
          </div>
        </a>

        <a
          href="mailto:statswatchapp@gmail.com?subject=StatsWatch%20Feature%20Request"
          className="flex items-center gap-3 p-3 bg-ow-darker rounded-lg hover:bg-ow-card-hover transition-colors"
        >
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div>
            <div className="text-sm text-ow-text">{t('Suggest a Feature')}</div>
            <div className="text-xs text-ow-text-muted">{t('Tell us what you\'d like to see')}</div>
          </div>
        </a>
      </div>

      {/* Support the Developer */}
      <div className="bg-ow-card border border-ow-border rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-ow-text">{t('Support the Developer')}</h2>
        <p className="text-xs text-ow-text-muted">
          {t('If you enjoy StatsWatch, consider supporting the development!')}
        </p>
        <a
          href="https://www.paypal.com/paypalme/statswatchapp"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-ow-orange hover:bg-ow-orange/80 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.94s4.18 1.36 4.18 3.85c0 1.89-1.44 2.98-3.12 3.19z" />
          </svg>
          {t('Buy Me a Coffee')}
        </a>
      </div>

      {/* Legal & Credits */}
      <div className="bg-ow-card border border-ow-border rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-ow-text">{t('Legal & Credits')}</h2>
        <p className="text-xs text-ow-text-muted leading-relaxed">
          {t('StatsWatch is not affiliated with, endorsed by, or connected to Blizzard Entertainment. All game-related assets and data belong to their respective owners.')}
        </p>
        <p className="text-xs text-ow-text-muted">
          {t('Data provided by')}{' '}
          <a
            href="https://overfast-api.tekrop.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ow-blue hover:underline"
          >
            OverFast API
          </a>
        </p>
      </div>
    </div>
  );
}
