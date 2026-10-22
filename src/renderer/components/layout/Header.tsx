import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'zh-Hans', label: '简体中文', flag: '🇨🇳' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

export default function Header() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const isHome = location.pathname === '/';

  return (
    <header className="bg-ow-darker/80 backdrop-blur-sm border-b border-ow-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-ow-orange font-bold text-lg hover:text-ow-orange-light transition-colors">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 6H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1zm-1 10H4V8h16v8zM6 10h2v2H6v-2zm3 0h2v2H9v-2zm3 0h6v2h-6v-2zm-6 3h2v2H6v-2zm3 0h6v2H9v-2zm7 0h2v2h-2v-2z" />
          </svg>
          {t('StatsWatch')}
        </Link>

        <nav className="flex items-center gap-4">
          {!isHome && (
            <Link to="/" className="text-ow-text-secondary hover:text-ow-text text-sm transition-colors">
              {t('Search')}
            </Link>
          )}
          <Link to="/heroes" className="text-ow-text-secondary hover:text-ow-text text-sm transition-colors hidden sm:block">
            {t('Encyclopedia')}
          </Link>
          <Link to="/meta" className="text-ow-text-secondary hover:text-ow-text text-sm transition-colors hidden sm:block">
            {t('Hero Meta')}
          </Link>
          <Link to="/compare" className="text-ow-text-secondary hover:text-ow-text text-sm transition-colors hidden sm:block">
            {t('PvP Compare')}
          </Link>

          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="text-ow-text-secondary hover:text-ow-text p-1.5 rounded-lg hover:bg-ow-card transition-colors"
              aria-label="Language"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </button>

            {showLangMenu && (
              <>
                <div className="fixed inset-0" onClick={() => setShowLangMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-ow-card border border-ow-border rounded-lg shadow-xl py-1 min-w-[160px] z-50">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        i18n.changeLanguage(lang.code);
                        localStorage.setItem('sw_language', lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-ow-card-hover transition-colors ${
                        i18n.language === lang.code || i18n.language.startsWith(lang.code.split('-')[0])
                          ? 'text-ow-orange'
                          : 'text-ow-text-secondary'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
