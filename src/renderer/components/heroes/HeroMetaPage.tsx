import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getHeroGlobalStats, getHeroes } from '../../api/overwatchApi';
import { formatPercent } from '../../utils/formatting';
import { ROLE_COLORS } from '../../utils/constants';
import type { GameMode, HeroInfo } from '../../types/models';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const ROLE_FILTERS = ['all', 'tank', 'damage', 'support'] as const;

export default function HeroMetaPage() {
  const { t } = useTranslation();
  const [gamemode, setGamemode] = useState<GameMode>('competitive');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'pickrate' | 'winrate'>('pickrate');

  const { data: globalStats, isLoading, error, refetch } = useQuery({
    queryKey: ['heroGlobalStats', gamemode],
    queryFn: () => getHeroGlobalStats('pc', gamemode),
  });

  const { data: heroesList } = useQuery({
    queryKey: ['heroes'],
    queryFn: getHeroes,
  });

  if (isLoading) return <LoadingSpinner text={t('Loading meta data...')} />;
  if (error) return <ErrorMessage message={(error as Error).message} onRetry={() => refetch()} />;

  const heroMap = new Map<string, HeroInfo>(heroesList?.map((h) => [h.key, h]) || []);

  const filtered = (globalStats || [])
    .filter((stat) => {
      if (roleFilter === 'all') return true;
      const hero = heroMap.get(stat.hero);
      return hero?.role === roleFilter;
    })
    .sort((a, b) => (sortBy === 'pickrate' ? b.pickrate - a.pickrate : b.winrate - a.winrate));

  const maxPickRate = Math.max(...filtered.map((s) => s.pickrate), 1);
  const maxWinRate = Math.max(...filtered.map((s) => s.winrate), 1);

  return (
    <div className="py-6 space-y-6">
      <h1 className="text-2xl font-bold text-ow-text">{t('Hero Meta')}</h1>

      {/* Gamemode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setGamemode('competitive')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            gamemode === 'competitive'
              ? 'bg-ow-orange text-white'
              : 'bg-ow-card border border-ow-border text-ow-text-secondary hover:bg-ow-card-hover'
          }`}
        >
          {t('Competitive')}
        </button>
        <button
          onClick={() => setGamemode('quickplay')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            gamemode === 'quickplay'
              ? 'bg-ow-orange text-white'
              : 'bg-ow-card border border-ow-border text-ow-text-secondary hover:bg-ow-card-hover'
          }`}
        >
          {t('Quick Play')}
        </button>
      </div>

      {/* Role Filter Chips */}
      <div className="flex gap-2">
        {ROLE_FILTERS.map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              roleFilter === r
                ? 'bg-ow-blue text-white'
                : 'bg-ow-card border border-ow-border text-ow-text-secondary hover:bg-ow-card-hover'
            }`}
          >
            {r === 'all' ? t('All') : r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      {/* Sort Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setSortBy('pickrate')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            sortBy === 'pickrate' ? 'text-ow-orange border-b-2 border-ow-orange' : 'text-ow-text-muted'
          }`}
        >
          {t('Pick Rate')}
        </button>
        <button
          onClick={() => setSortBy('winrate')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            sortBy === 'winrate' ? 'text-ow-orange border-b-2 border-ow-orange' : 'text-ow-text-muted'
          }`}
        >
          {t('Win Rate')}
        </button>
      </div>

      {/* Ranked List */}
      <div className="space-y-2">
        {filtered.map((stat, index) => {
          const hero = heroMap.get(stat.hero);
          const role = hero?.role || 'damage';
          const roleColor = ROLE_COLORS[role] || '#9ca3af';
          const barValue = sortBy === 'pickrate' ? stat.pickrate / maxPickRate : stat.winrate / maxWinRate;

          return (
            <div key={stat.hero} className="bg-ow-card border border-ow-border rounded-lg p-3 flex items-center gap-3 hover:bg-ow-card-hover transition-colors">
              {/* Rank number */}
              <span className="text-ow-text-muted font-bold text-sm w-6 text-right">#{index + 1}</span>

              {/* Portrait */}
              {hero?.portrait ? (
                <img src={hero.portrait} alt={hero.name} className="w-10 h-10 rounded-full border-2 object-cover" style={{ borderColor: roleColor }} />
              ) : (
                <div className="w-10 h-10 rounded-full bg-ow-darker border-2" style={{ borderColor: roleColor }} />
              )}

              {/* Name and Role */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ow-text truncate">
                    {hero?.name || stat.hero}
                  </span>
                  <span className="text-xs capitalize" style={{ color: roleColor }}>{role}</span>
                </div>

                {/* Bar */}
                <div className="mt-1 h-1.5 bg-ow-darker rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${barValue * 100}%`,
                      backgroundColor: roleColor,
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-ow-text-muted">{t('Pick')}</p>
                  <p className={`text-sm font-semibold ${sortBy === 'pickrate' ? 'text-ow-orange' : 'text-ow-text-secondary'}`}>
                    {formatPercent(stat.pickrate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ow-text-muted">{t('Win')}</p>
                  <p className={`text-sm font-semibold ${sortBy === 'winrate' ? 'text-ow-orange' : 'text-ow-text-secondary'}`}>
                    {formatPercent(stat.winrate)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-ow-text-muted">
          <p>{t('No data available')}</p>
        </div>
      )}
    </div>
  );
}
