import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { HeroStatEntry, HeroInfo } from '../../types/models';
import { formatPercent, formatTimePlayedShort } from '../../utils/formatting';
import { getHeroRole } from '../../utils/constants';

interface Props {
  heroes: { key: string; stats: HeroStatEntry }[];
  allHeroes: { key: string; stats: HeroStatEntry }[];
  heroInfoList: HeroInfo[];
  playerId: string;
}

const RANK_BADGES = ['1ST', '2ND', '3RD'];
const RANK_COLORS = [
  'bg-ow-gold text-ow-dark',
  'bg-gray-400 text-ow-dark',
  'bg-amber-700 text-white',
];

const ROLE_ICON_COLORS: Record<string, string> = {
  tank: 'bg-ow-tank',
  damage: 'bg-ow-dps',
  support: 'bg-ow-support',
};

function getHeroPortrait(heroKey: string, heroInfoList: HeroInfo[]): string | null {
  const hero = heroInfoList.find(h => h.key === heroKey);
  return hero?.portrait || null;
}

export default function TopHeroes({ heroes, allHeroes, heroInfoList, playerId }: Props) {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);

  const top3 = heroes.slice(0, 3);
  const remaining = allHeroes.slice(3);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-ow-text">{t('Top Heroes')}</h3>

      {/* Top 3 cards */}
      <div className="space-y-2">
        {top3.map((hero, idx) => {
          const portrait = getHeroPortrait(hero.key, heroInfoList);
          const role = getHeroRole(hero.key);
          const roleColor = ROLE_ICON_COLORS[role] || 'bg-ow-border';

          return (
            <div
              key={hero.key}
              className="flex items-center gap-3 bg-ow-card border border-ow-border rounded-xl p-3"
            >
              {/* Rank badge */}
              <div
                className={`w-8 h-8 rounded-lg ${RANK_COLORS[idx]} flex items-center justify-center text-[10px] font-bold flex-shrink-0`}
              >
                {RANK_BADGES[idx]}
              </div>

              {/* Hero portrait */}
              {portrait ? (
                <img
                  src={portrait}
                  alt={hero.key}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-ow-card-hover flex items-center justify-center flex-shrink-0">
                  <span className="text-ow-text-muted text-sm capitalize">
                    {hero.key.charAt(0)}
                  </span>
                </div>
              )}

              {/* Role icon */}
              <div
                className={`w-5 h-5 rounded-full ${roleColor} flex items-center justify-center flex-shrink-0`}
              >
                <span className="text-white text-[8px] font-bold uppercase">
                  {role.charAt(0)}
                </span>
              </div>

              {/* Hero info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ow-text capitalize truncate">
                  {hero.key.replace(/-/g, ' ')}
                </p>
                <p className="text-[10px] text-ow-text-muted">
                  {formatTimePlayedShort(hero.stats.time_played)}
                </p>
              </div>

              {/* Win rate */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-ow-orange">
                  {formatPercent(hero.stats.winrate)}
                </p>
                <p className="text-[10px] text-ow-text-muted">{t('WR')}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show all toggle */}
      {remaining.length > 0 && (
        <>
          <button
            onClick={() => setShowAll(prev => !prev)}
            className="w-full text-xs text-ow-blue hover:text-ow-blue-light flex items-center justify-center gap-1 py-1 transition-colors"
          >
            {showAll
              ? t('Hide All Heroes')
              : t('All Heroes ({{count}})', { count: allHeroes.length })}
            <svg
              className={`w-3 h-3 transition-transform ${showAll ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAll && (
            <div className="space-y-1.5">
              {remaining.map(hero => {
                const portrait = getHeroPortrait(hero.key, heroInfoList);
                return (
                  <div
                    key={hero.key}
                    className="flex items-center gap-2.5 bg-ow-card border border-ow-border rounded-lg px-3 py-2"
                  >
                    {portrait ? (
                      <img
                        src={portrait}
                        alt={hero.key}
                        className="w-7 h-7 rounded object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded bg-ow-card-hover" />
                    )}
                    <span className="text-xs text-ow-text capitalize flex-1 truncate">
                      {hero.key.replace(/-/g, ' ')}
                    </span>
                    <span className="text-xs text-ow-text-secondary">
                      {formatTimePlayedShort(hero.stats.time_played)}
                    </span>
                    <span className="text-xs font-medium text-ow-orange">
                      {formatPercent(hero.stats.winrate)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Link to full career stats */}
      <Link
        to={`/player/${playerId}/career`}
        className="block text-center text-xs text-ow-blue hover:text-ow-blue-light py-1.5 transition-colors"
      >
        {t('View Full Career Stats')}
      </Link>
    </div>
  );
}
