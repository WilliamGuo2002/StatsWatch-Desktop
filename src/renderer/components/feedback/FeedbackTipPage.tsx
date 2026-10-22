import { useTranslation } from 'react-i18next';

/**
 * Ported from the iOS FeedbackTipView.
 *
 * Same contact address, same PayPal link, same three mail templates. The
 * device-info block carries desktop details instead of iOS ones, and
 * "Rate on App Store" becomes the GitHub repo, which is this build's
 * equivalent.
 */

const CONTACT_EMAIL = 'wgstudiosupport@gmail.com';
const PAYPAL_URL = 'https://paypal.me/wg1018';
const REPO_URL = 'https://github.com/WilliamGuo2002/StatsWatch-Desktop';
const APP_VERSION = '0.1.0';

function environmentBlock(): string {
  const ua = navigator.userAgent;
  const electron = /Electron\/([\d.]+)/.exec(ua)?.[1] ?? 'unknown';
  const chrome = /Chrome\/([\d.]+)/.exec(ua)?.[1] ?? 'unknown';
  return [
    '--- Environment ---',
    `App: StatsWatch Desktop v${APP_VERSION}`,
    `Electron: ${electron}`,
    `Chromium: ${chrome}`,
    `Platform: ${navigator.platform}`,
    `Language: ${navigator.language}`,
  ].join('\n');
}

type MailType = 'general' | 'bug' | 'feature';

const SUBJECTS: Record<MailType, string> = {
  general: '[StatsWatch Desktop] General Feedback',
  bug: '[StatsWatch Desktop] Bug Report',
  feature: '[StatsWatch Desktop] Feature Request',
};

function bodyFor(type: MailType): string {
  const env = environmentBlock();
  switch (type) {
    case 'bug':
      return [
        '',
        '',
        '**What happened:**',
        '(Describe the bug)',
        '',
        '**Steps to reproduce:**',
        '1.',
        '2.',
        '3.',
        '',
        '**Expected behavior:**',
        '(What should have happened)',
        '',
        env,
      ].join('\n');
    case 'feature':
      return [
        '',
        '',
        '**Feature description:**',
        '(Describe your idea)',
        '',
        '**Why it would be useful:**',
        '(How it helps players)',
        '',
        env,
      ].join('\n');
    default:
      return ['', '', env].join('\n');
  }
}

function mailto(type: MailType): string {
  const subject = encodeURIComponent(SUBJECTS[type]);
  const body = encodeURIComponent(bodyFor(type));
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

interface RowProps {
  iconPath: string;
  iconColor: string;
  title: string;
  subtitle: string;
  href: string;
}

function Row({ iconPath, iconColor, title, subtitle, href }: RowProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-xl border border-ow-border bg-ow-card px-3.5 py-3 transition-colors hover:bg-ow-card-hover"
    >
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ow-darker ${iconColor}`}>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-ow-text">{title}</span>
        <span className="block truncate text-[11px] text-ow-text-secondary">{subtitle}</span>
      </span>
      <svg className="h-3.5 w-3.5 shrink-0 text-ow-text-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}

function SectionTitle({ iconPath, iconColor, children }: { iconPath: string; iconColor: string; children: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <svg className={`h-4 w-4 ${iconColor}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
      </svg>
      <h2 className="text-[15px] font-bold text-ow-text">{children}</h2>
    </div>
  );
}

export default function FeedbackTipPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-2xl space-y-7 py-2">
      <header className="flex flex-col items-center gap-1.5 pt-4 text-center">
        <svg className="h-11 w-11 text-ow-orange" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 6H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1zm-1 10H4V8h16v8zM6 10h2v2H6v-2zm3 0h2v2H9v-2zm3 0h6v2h-6v-2zm-6 3h2v2H6v-2zm3 0h6v2H9v-2zm7 0h2v2h-2v-2z" />
        </svg>
        <h1 className="text-[22px] font-bold text-ow-text">StatsWatch Desktop</h1>
        <p className="text-[13px] text-ow-text-secondary">{t('Overwatch Stats Tracker')}</p>
        <p className="font-mono text-[11px] text-ow-text-muted">v{APP_VERSION}</p>
      </header>

      <section>
        <SectionTitle
          iconColor="text-ow-blue"
          iconPath="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        >
          {t('Feedback')}
        </SectionTitle>

        <div className="space-y-2">
          <Row
            href={mailto('general')}
            iconColor="text-ow-blue"
            iconPath="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            title={t('Contact Developer')}
            subtitle={CONTACT_EMAIL}
          />
          <Row
            href={mailto('bug')}
            iconColor="text-ow-dps"
            iconPath="M12 8v8m-4-4h8M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83M12 21a7 7 0 100-14 7 7 0 000 14z"
            title={t('Report a Bug')}
            subtitle={t('Help us improve the app')}
          />
          <Row
            href={mailto('feature')}
            iconColor="text-ow-gold"
            iconPath="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            title={t('Suggest a Feature')}
            subtitle={t("We'd love to hear your ideas")}
          />
          <Row
            href={REPO_URL}
            iconColor="text-ow-text-secondary"
            iconPath="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            title={t('Star on GitHub')}
            subtitle={t('Your support helps a lot!')}
          />
        </div>
      </section>

      <section>
        <SectionTitle
          iconColor="text-pink-400"
          iconPath="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        >
          {t('Support the Developer')}
        </SectionTitle>

        <div className="space-y-3 rounded-xl border border-ow-border bg-ow-card p-4">
          <p className="text-[13px] leading-relaxed text-ow-text-secondary">
            {t('StatsWatch is a free, ad-free app made with love. If you enjoy it, consider buying me a coffee!')}
          </p>
          <a
            href={PAYPAL_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-ow-orange px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-ow-orange-light"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {t('Tip via PayPal')}
          </a>
        </div>
      </section>

      <p className="pb-4 text-center text-[10px] leading-relaxed text-ow-text-muted">
        {t('This app is not affiliated with or endorsed by Blizzard Entertainment. Overwatch and all related assets are trademarks of Blizzard Entertainment, Inc. Data provided by OverFast API.')}
      </p>
    </div>
  );
}
