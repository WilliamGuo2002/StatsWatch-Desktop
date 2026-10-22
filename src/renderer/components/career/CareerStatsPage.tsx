import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getPlayerCareerStats } from '../../api/overwatchApi';
import { formatStatValue } from '../../utils/formatting';
import type { CareerStatCategory } from '../../types/models';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const CATEGORY_ICONS: Record<string, string> = {
  best: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  combat: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  assists: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  average: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  game: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z',
  miscellaneous: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
};

const CATEGORY_COLORS: Record<string, string> = {
  best: 'text-ow-orange',
  combat: 'text-red-400',
  assists: 'text-green-400',
  average: 'text-ow-blue-light',
  game: 'text-purple-400',
  miscellaneous: 'text-ow-text-muted',
};

function CategorySection({ category, isExpanded, onToggle }: { category: CareerStatCategory; isExpanded: boolean; onToggle: () => void }) {
  const iconPath = CATEGORY_ICONS[category.category] || CATEGORY_ICONS.miscellaneous;
  const colorClass = CATEGORY_COLORS[category.category] || CATEGORY_COLORS.miscellaneous;

  return (
    <div className="bg-ow-card border border-ow-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-ow-card-hover transition-colors"
      >
        <svg className={`w-5 h-5 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
        </svg>
        <span className={`font-semibold text-sm flex-1 text-left ${colorClass}`}>{category.label}</span>
        <span className="text-xs text-ow-text-muted">{category.stats.length}</span>
        <svg className={`w-4 h-4 text-ow-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="px-4 pb-3 space-y-0">
          {category.stats.map((stat) => (
            <div key={stat.key} className="flex items-center justify-between py-2 border-t border-ow-border/50">
              <span className="text-sm text-ow-text-secondary">{stat.label}</span>
              <span className="text-sm font-semibold text-ow-text">{formatStatValue(stat.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CareerStatsPage() {
  const { playerId, heroKey } = useParams<{ playerId: string; heroKey?: string }>();
  const { t } = useTranslation();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['best']));

  const { data: careerData, isLoading, error, refetch } = useQuery({
    queryKey: ['careerStats', playerId, 'competitive'],
    queryFn: () => getPlayerCareerStats(playerId!, 'competitive'),
    enabled: !!playerId,
  });

  if (isLoading) return <LoadingSpinner text={t('Loading career stats...')} />;
  if (error) return <ErrorMessage message={(error as Error).message} onRetry={() => refetch()} />;
  if (!careerData) return <ErrorMessage message={t('No data available')} />;

  const selectedHero = heroKey || 'all-heroes';
  const categories: CareerStatCategory[] = careerData[selectedHero] || [];

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Extract personal bests
  const bestCategory = categories.find((c) => c.category === 'best');
  const topBests = bestCategory?.stats.slice(0, 6) || [];

  const heroDisplayName = selectedHero === 'all-heroes'
    ? t('All Heroes')
    : selectedHero.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ow-text">{t('Career Stats')}</h1>
        <p className="text-ow-text-secondary text-sm mt-1">{heroDisplayName}</p>
      </div>

      {/* Personal Bests */}
      {topBests.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-ow-orange mb-3">{t('Personal Bests')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {topBests.map((stat) => (
              <div
                key={stat.key}
                className="bg-gradient-to-br from-ow-orange/10 to-ow-card border border-ow-orange/20 rounded-lg p-3 text-center"
              >
                <p className="text-xs text-ow-orange/80 truncate">{stat.label}</p>
                <p className="text-xl font-bold text-ow-orange mt-1">{formatStatValue(stat.value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Sections */}
      <div className="space-y-3">
        {categories.map((category) => (
          <CategorySection
            key={category.category}
            category={category}
            isExpanded={expandedCategories.has(category.category)}
            onToggle={() => toggleCategory(category.category)}
          />
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 text-ow-text-muted">
          <p>{t('No career stats available for this hero')}</p>
        </div>
      )}
    </div>
  );
}
