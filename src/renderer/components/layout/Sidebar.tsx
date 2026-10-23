import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, type ReactNode } from 'react';
import { usePersistedState } from '../../hooks/useLocalStorage';

const LANGUAGES = [
  // iOS offers "follow the system" as the default; without it the app is
  // pinned to whatever was picked once and never tracks the OS again.
  { code: '', label: 'System Default', flag: '🌐' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'zh-Hans', label: '简体中文', flag: '🇨🇳' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

const PATHS = {
  search: 'M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z',
  matches: 'M9 17V7m4 10V11m4 6v-4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z',
  heroes: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  meta: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  maps: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  modes: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  compare: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  about: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  feedback: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  capture: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  collapse: 'M11 19l-7-7 7-7m8 14l-7-7 7-7',
  globe: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
};

function Icon({ d }: { d: string }) {
  return (
    <svg
      className="w-[18px] h-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
  collapsed: boolean;
  end?: boolean;
}

function NavItem({ to, icon, label, collapsed, end }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        [
          'relative mx-2 flex h-9 items-center gap-3 rounded-md text-[13px] transition-colors',
          collapsed ? 'justify-center px-0' : 'px-3',
          isActive
            ? 'bg-ow-card text-ow-text font-medium'
            : 'text-ow-text-secondary hover:text-ow-text hover:bg-ow-card/60',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-ow-orange" />
          )}
          <Icon d={icon} />
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );
}

function SectionLabel({ children, collapsed }: { children: ReactNode; collapsed: boolean }) {
  if (collapsed) return <div className="h-3" />;
  return (
    <div className="px-5 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ow-text-muted">
      {children}
    </div>
  );
}

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  const [collapsed, setCollapsed] = usePersistedState('sw_sidebar_collapsed', false);
  const [showLang, setShowLang] = useState(false);
  const [stored, setStored] = useState<string>(() => localStorage.getItem('sw_language') ?? '');

  const railButton = [
    'mx-2 flex h-9 w-[calc(100%-1rem)] items-center gap-3 rounded-md text-[13px]',
    'text-ow-text-secondary hover:text-ow-text hover:bg-ow-card/60 transition-colors',
    collapsed ? 'justify-center' : 'px-3',
  ].join(' ');

  return (
    <nav
      className={[
        collapsed ? 'w-[56px]' : 'w-[212px]',
        'shrink-0 bg-ow-darker border-r border-ow-border',
        'flex flex-col transition-[width] duration-150',
      ].join(' ')}
    >
      <div className={`flex h-12 shrink-0 items-center ${collapsed ? 'justify-center' : 'px-4'}`}>
        <svg className="w-5 h-5 shrink-0 text-ow-orange" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 6H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1zm-1 10H4V8h16v8zM6 10h2v2H6v-2zm3 0h2v2H9v-2zm3 0h6v2h-6v-2zm-6 3h2v2H6v-2zm3 0h6v2H9v-2zm7 0h2v2h-2v-2z" />
        </svg>
        {!collapsed && <span className="ml-2 text-[15px] font-bold text-ow-text">StatsWatch</span>}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-2">
        <SectionLabel collapsed={collapsed}>{t('Players')}</SectionLabel>
        <NavItem to="/" end icon={PATHS.search} label={t('Search')} collapsed={collapsed} />
        <NavItem to="/compare" icon={PATHS.compare} label={t('PvP Compare')} collapsed={collapsed} />

        <SectionLabel collapsed={collapsed}>{t('Heroes')}</SectionLabel>
        <NavItem to="/heroes" icon={PATHS.heroes} label={t('Encyclopedia')} collapsed={collapsed} />
        <NavItem to="/meta" icon={PATHS.meta} label={t('Hero Meta')} collapsed={collapsed} />

        <SectionLabel collapsed={collapsed}>{t('Explore')}</SectionLabel>
        <NavItem to="/maps" icon={PATHS.maps} label={t('Maps')} collapsed={collapsed} />
        <NavItem to="/gamemodes" icon={PATHS.modes} label={t('Game Modes')} collapsed={collapsed} />

        {/* M1 lands here: recorded matches, scoreboards, session reports. */}
        <SectionLabel collapsed={collapsed}>{t('Matches')}</SectionLabel>
        <NavItem to="/capture" icon={PATHS.capture} label={t('Event Capture')} collapsed={collapsed} />
        <div
          title={collapsed ? t('Match History') : undefined}
          className={`mx-2 flex h-9 cursor-default items-center gap-3 rounded-md text-[13px] text-ow-text-muted ${
            collapsed ? 'justify-center' : 'px-3'
          }`}
        >
          <Icon d={PATHS.matches} />
          {!collapsed && (
            <span className="truncate">
              {t('Match History')}
              <span className="ml-1.5 rounded bg-ow-card px-1 py-px text-[9px] uppercase tracking-wide">
                {t('Soon')}
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-ow-border py-1.5">
        <NavItem to="/feedback" icon={PATHS.feedback} label={t('Feedback & Tip')} collapsed={collapsed} />
        <NavItem to="/about" icon={PATHS.about} label={t('About')} collapsed={collapsed} />

        <div className="relative">
          <button
            onClick={() => setShowLang((v) => !v)}
            title={collapsed ? t('Language') : undefined}
            className={railButton}
          >
            <Icon d={PATHS.globe} />
            {!collapsed && <span className="truncate">{t('Language')}</span>}
          </button>

          {showLang && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowLang(false)} />
              <div className="absolute bottom-full left-2 z-50 mb-1 min-w-[160px] rounded-lg border border-ow-border bg-ow-card py-1 shadow-xl">
                {LANGUAGES.map((lang) => {
                  const active = lang.code
                    ? stored === lang.code
                    : !stored;
                  return (
                    <button
                      key={lang.code || 'system'}
                      onClick={() => {
                        if (lang.code) {
                          localStorage.setItem('sw_language', lang.code);
                          i18n.changeLanguage(lang.code);
                        } else {
                          // Hand control back to the OS locale.
                          localStorage.removeItem('sw_language');
                          i18n.changeLanguage(navigator.language);
                        }
                        setStored(lang.code);
                        setShowLang(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-ow-card-hover ${
                        active ? 'text-ow-orange' : 'text-ow-text-secondary'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? t('Expand') : t('Collapse')}
          className={railButton}
        >
          <span className={collapsed ? 'rotate-180' : ''}>
            <Icon d={PATHS.collapse} />
          </span>
          {!collapsed && <span className="truncate">{t('Collapse')}</span>}
        </button>
      </div>
    </nav>
  );
}
