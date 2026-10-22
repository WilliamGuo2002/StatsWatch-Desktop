import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-ow-border py-6 text-center">
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-ow-text-muted text-xs mb-1">
          {t('Data provided by OverFast API')}
        </p>
        <p className="text-ow-text-muted text-xs">
          {t('Made with love for the Overwatch community')}
        </p>
        <p className="text-ow-text-muted text-[10px] mt-2">
          StatsWatch is not affiliated with Blizzard Entertainment.
        </p>
      </div>
    </footer>
  );
}
