import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getPlayerStatsSummary, getHeroes } from '../../api/overwatchApi';
import { formatPercent, formatStat, formatTimePlayed, formatNumber } from '../../utils/formatting';
import { getHeroRole, ROLE_COLORS, RADAR_MAX } from '../../utils/constants';
import { RADAR_LABELS } from '../../utils/statsCalculations';
import type { HeroStatEntry, HeroInfo } from '../../types/models';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

function RadarChart({ values, labels }: { values: number[]; labels: string[] }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 80;
  const angleStep = (2 * Math.PI) / labels.length;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    return {
      x: cx + r * value * Math.cos(angle),
      y: cy + r * value * Math.sin(angle),
    };
  };

  const polygonPoints = values.map((v, i) => {
    const pt = getPoint(i, v);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[250px] mx-auto">
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={labels.map((_, i) => {
            const pt = getPoint(i, level);
            return `${pt.x},${pt.y}`;
          }).join(' ')}
          fill="none"
          stroke="#1f2937"
          strokeWidth="1"
        />
      ))}
      {labels.map((_, i) => {
        const pt = getPoint(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#1f2937" strokeWidth="1" />;
      })}
      <polygon points={polygonPoints} fill="rgba(249,115,22,0.2)" stroke="#f97316" strokeWidth="2" />
      {values.map((v, i) => {
        const pt = getPoint(i, v);
        return <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#f97316" />;
      })}
      {labels.map((label, i) => {
        const pt = getPoint(i, 1.25);
        return (
          <text key={i} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle" fill="#9ca3af" fontSize="10">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-ow-card border border-ow-border rounded-lg p-3 text-center">
      <p className="text-ow-text-muted text-xs mb-1">{label}</p>
      <p className={`text-lg font-bold ${color || 'text-ow-text'}`}>{value}</p>
    </div>
  );
}

function ComparisonBar({ label, heroValue, overallValue, unit }: { label: string; heroValue: number; overallValue: number; unit?: string }) {
  const max = Math.max(heroValue, overallValue, 1);
  const diff = heroValue - overallValue;
  const isPositive = diff > 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-ow-text-secondary">{label}</span>
        <div className="flex items-center gap-2">
          <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
            {isPositive ? '+' : ''}{formatStat(diff)}{unit}
          </span>
          <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
            {isPositive ? '\u25B2' : '\u25BC'}
          </span>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <div className="flex-1 h-2 bg-ow-darker rounded-full overflow-hidden">
          <div className="h-full bg-ow-orange rounded-full transition-all" style={{ width: `${(heroValue / max) * 100}%` }} />
        </div>
        <span className="text-xs text-ow-text-muted w-16 text-right">{formatStat(heroValue)}{unit}</span>
      </div>
      <div className="flex gap-2 items-center">
        <div className="flex-1 h-2 bg-ow-darker rounded-full overflow-hidden">
          <div className="h-full bg-ow-blue rounded-full transition-all" style={{ width: `${(overallValue / max) * 100}%` }} />
        </div>
        <span className="text-xs text-ow-text-muted w-16 text-right">{formatStat(overallValue)}{unit}</span>
      </div>
    </div>
  );
}

export default function HeroDetailPage() {
  const { playerId, heroKey } = useParams<{ playerId: string; heroKey: string }>();
  const { t } = useTranslation();

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['playerStats', playerId, 'competitive'],
    queryFn: () => getPlayerStatsSummary(playerId!, 'competitive'),
    enabled: !!playerId,
  });

  const { data: heroesList } = useQuery({
    queryKey: ['heroes'],
    queryFn: getHeroes,
  });

  if (isLoading) return <LoadingSpinner text={t('Loading hero stats...')} />;
  if (error) return <ErrorMessage message={(error as Error).message} onRetry={() => refetch()} />;
  if (!stats || !heroKey) return <ErrorMessage message={t('No data available')} />;

  const heroStats: HeroStatEntry | undefined = stats.heroes?.[heroKey];
  const generalStats = stats.general;
  const heroInfo: HeroInfo | undefined = heroesList?.find((h) => h.key === heroKey);
  const role = getHeroRole(heroKey);
  const roleColor = ROLE_COLORS[role] || ROLE_COLORS.damage;

  if (!heroStats) {
    return (
      <div className="py-12 text-center">
        <p className="text-ow-text-secondary">{t('No stats found for this hero')}</p>
        <Link to={`/player/${playerId}`} className="text-ow-orange hover:underline text-sm mt-2 inline-block">
          {t('Back to profile')}
        </Link>
      </div>
    );
  }

  // Radar data for single hero
  const roleKey = role || 'all';
  const max = RADAR_MAX[roleKey] || RADAR_MAX.all;
  const radarValues = [
    Math.min(heroStats.average.eliminations / max[0], 1),
    Math.min(heroStats.average.assists / max[1], 1),
    heroStats.average.deaths > 0 ? 1 - Math.min(heroStats.average.deaths / max[2], 1) : 1,
    Math.min(heroStats.average.damage / max[3], 1),
    Math.min(heroStats.average.healing / max[4], 1),
  ];

  const heroName = heroInfo?.name || heroKey.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="py-6 space-y-6">
      {/* Hero Header */}
      <div className="flex items-center gap-4">
        {heroInfo?.portrait && (
          <img src={heroInfo.portrait} alt={heroName} className="w-20 h-20 rounded-lg border-2 border-ow-border" />
        )}
        <div>
          <h1 className="text-2xl font-bold text-ow-text">{heroName}</h1>
          <span
            className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold mt-1"
            style={{ backgroundColor: `${roleColor}20`, color: roleColor }}
          >
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label={t('Win Rate')} value={formatPercent(heroStats.winrate)} color="text-ow-orange" />
        <StatCard label={t('KDA')} value={formatStat(heroStats.kda)} color="text-ow-blue-light" />
        <StatCard label={t('Games')} value={heroStats.games_played.toString()} />
        <StatCard label={t('Time')} value={formatTimePlayed(heroStats.time_played)} />
      </div>

      {/* Performance Radar */}
      <div className="bg-ow-card border border-ow-border rounded-lg p-4">
        <h2 className="text-lg font-semibold text-ow-text mb-4">{t('Performance Radar')}</h2>
        <RadarChart values={radarValues} labels={RADAR_LABELS} />
      </div>

      {/* Average Per-10 Stats */}
      <div className="bg-ow-card border border-ow-border rounded-lg p-4">
        <h2 className="text-lg font-semibold text-ow-text mb-3">{t('Average per 10 Minutes')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label={t('Eliminations')} value={formatStat(heroStats.average.eliminations)} />
          <StatCard label={t('Assists')} value={formatStat(heroStats.average.assists)} />
          <StatCard label={t('Deaths')} value={formatStat(heroStats.average.deaths)} />
          <StatCard label={t('Damage')} value={formatNumber(heroStats.average.damage)} />
          <StatCard label={t('Healing')} value={formatNumber(heroStats.average.healing)} />
        </div>
      </div>

      {/* Total Stats */}
      <div className="bg-ow-card border border-ow-border rounded-lg p-4">
        <h2 className="text-lg font-semibold text-ow-text mb-3">{t('Total Stats')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label={t('Eliminations')} value={formatNumber(heroStats.total.eliminations)} />
          <StatCard label={t('Assists')} value={formatNumber(heroStats.total.assists)} />
          <StatCard label={t('Deaths')} value={formatNumber(heroStats.total.deaths)} />
          <StatCard label={t('Damage')} value={formatNumber(heroStats.total.damage)} />
          <StatCard label={t('Healing')} value={formatNumber(heroStats.total.healing)} />
        </div>
      </div>

      {/* Hero vs Overall Comparison */}
      {generalStats && (
        <div className="bg-ow-card border border-ow-border rounded-lg p-4">
          <h2 className="text-lg font-semibold text-ow-text mb-2">{t('Hero vs Overall')}</h2>
          <div className="flex items-center gap-3 text-xs text-ow-text-muted mb-4">
            <span className="flex items-center gap-1"><span className="w-3 h-1.5 bg-ow-orange rounded" /> {heroName}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-1.5 bg-ow-blue rounded" /> {t('Overall')}</span>
          </div>
          <div className="space-y-4">
            <ComparisonBar label={t('Win Rate')} heroValue={heroStats.winrate} overallValue={generalStats.winrate} unit="%" />
            <ComparisonBar label={t('KDA')} heroValue={heroStats.kda} overallValue={generalStats.kda} />
            <ComparisonBar label={t('Elims/10')} heroValue={heroStats.average.eliminations} overallValue={generalStats.average.eliminations} />
            <ComparisonBar label={t('Deaths/10')} heroValue={heroStats.average.deaths} overallValue={generalStats.average.deaths} />
            <ComparisonBar label={t('Dmg/10')} heroValue={heroStats.average.damage} overallValue={generalStats.average.damage} />
            <ComparisonBar label={t('Heal/10')} heroValue={heroStats.average.healing} overallValue={generalStats.average.healing} />
          </div>
        </div>
      )}

      {/* Career Stats Link */}
      <Link
        to={`/player/${playerId}/career/${heroKey}`}
        className="block text-center bg-ow-orange/10 hover:bg-ow-orange/20 border border-ow-orange/30 rounded-lg py-3 text-ow-orange font-semibold transition-colors"
      >
        {t('View Career Stats for {{hero}}', { hero: heroName })}
      </Link>
    </div>
  );
}
