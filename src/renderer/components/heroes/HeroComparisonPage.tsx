import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getPlayerStatsSummary, getHeroes } from '../../api/overwatchApi';
import { formatStat, formatNumber } from '../../utils/formatting';
import { RADAR_MAX } from '../../utils/constants';
import { getHeroRole } from '../../utils/constants';
import { RADAR_LABELS } from '../../utils/statsCalculations';
import type { HeroStatEntry } from '../../types/models';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

function DualRadarChart({
  valuesA,
  valuesB,
  labels,
  labelA,
  labelB,
}: {
  valuesA: number[];
  valuesB: number[];
  labels: string[];
  labelA: string;
  labelB: string;
}) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const r = 85;
  const angleStep = (2 * Math.PI) / labels.length;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    return {
      x: cx + r * value * Math.cos(angle),
      y: cy + r * value * Math.sin(angle),
    };
  };

  const toPolygon = (values: number[]) =>
    values.map((v, i) => {
      const pt = getPoint(i, v);
      return `${pt.x},${pt.y}`;
    }).join(' ');

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[280px]">
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
        <polygon points={toPolygon(valuesA)} fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="2" />
        <polygon points={toPolygon(valuesB)} fill="rgba(249,115,22,0.15)" stroke="#f97316" strokeWidth="2" />
        {labels.map((label, i) => {
          const pt = getPoint(i, 1.25);
          return (
            <text key={i} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle" fill="#9ca3af" fontSize="10">
              {label}
            </text>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 mt-2 text-xs text-ow-text-muted">
        <span className="flex items-center gap-1"><span className="w-3 h-1.5 bg-ow-blue rounded" /> {labelA}</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1.5 bg-ow-orange rounded" /> {labelB}</span>
      </div>
    </div>
  );
}

interface CompareRow {
  label: string;
  valueA: number;
  valueB: number;
  format: (v: number) => string;
}

function ComparisonBars({ rows }: { rows: CompareRow[] }) {
  return (
    <div className="space-y-4">
      {rows.map((row) => {
        const max = Math.max(row.valueA, row.valueB, 1);
        const aWins = row.valueA >= row.valueB;
        return (
          <div key={row.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className={aWins ? 'text-ow-blue-light font-semibold' : 'text-ow-text-secondary'}>{row.format(row.valueA)}</span>
              <span className="text-ow-text-muted">{row.label}</span>
              <span className={!aWins ? 'text-ow-orange-light font-semibold' : 'text-ow-text-secondary'}>{row.format(row.valueB)}</span>
            </div>
            <div className="flex gap-1">
              <div className="flex-1 h-2 bg-ow-darker rounded-full overflow-hidden flex justify-end">
                <div
                  className="h-full bg-ow-blue rounded-full transition-all"
                  style={{ width: `${(row.valueA / max) * 100}%` }}
                />
              </div>
              <div className="flex-1 h-2 bg-ow-darker rounded-full overflow-hidden">
                <div
                  className="h-full bg-ow-orange rounded-full transition-all"
                  style={{ width: `${(row.valueB / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function HeroComparisonPage() {
  const { playerId } = useParams<{ playerId: string }>();
  const { t } = useTranslation();
  const [heroA, setHeroA] = useState<string>('');
  const [heroB, setHeroB] = useState<string>('');

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['playerStats', playerId, 'competitive'],
    queryFn: () => getPlayerStatsSummary(playerId!, 'competitive'),
    enabled: !!playerId,
  });

  const { data: heroesList } = useQuery({
    queryKey: ['heroes'],
    queryFn: getHeroes,
  });

  if (isLoading) return <LoadingSpinner text={t('Loading stats...')} />;
  if (error) return <ErrorMessage message={(error as Error).message} onRetry={() => refetch()} />;

  const heroPool = stats?.heroes ? Object.keys(stats.heroes).filter((k) => stats.heroes![k].games_played > 0) : [];
  const heroMap = new Map(heroesList?.map((h) => [h.key, h]) || []);

  const getHeroName = (key: string) => heroMap.get(key)?.name || key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const statsA: HeroStatEntry | undefined = heroA ? stats?.heroes?.[heroA] : undefined;
  const statsB: HeroStatEntry | undefined = heroB ? stats?.heroes?.[heroB] : undefined;
  const canCompare = statsA && statsB;

  const getRadarValues = (heroStats: HeroStatEntry, key: string): number[] => {
    const role = getHeroRole(key);
    const max = RADAR_MAX[role] || RADAR_MAX.all;
    return [
      Math.min(heroStats.average.eliminations / max[0], 1),
      Math.min(heroStats.average.assists / max[1], 1),
      heroStats.average.deaths > 0 ? 1 - Math.min(heroStats.average.deaths / max[2], 1) : 1,
      Math.min(heroStats.average.damage / max[3], 1),
      Math.min(heroStats.average.healing / max[4], 1),
    ];
  };

  const compareRows: CompareRow[] = canCompare
    ? [
        { label: t('Games'), valueA: statsA.games_played, valueB: statsB.games_played, format: (v) => v.toFixed(0) },
        { label: t('KDA'), valueA: statsA.kda, valueB: statsB.kda, format: (v) => formatStat(v) },
        { label: t('Elims/10'), valueA: statsA.average.eliminations, valueB: statsB.average.eliminations, format: (v) => formatStat(v) },
        { label: t('Deaths/10'), valueA: statsA.average.deaths, valueB: statsB.average.deaths, format: (v) => formatStat(v) },
        { label: t('Dmg/10'), valueA: statsA.average.damage, valueB: statsB.average.damage, format: (v) => formatNumber(v) },
        { label: t('Heal/10'), valueA: statsA.average.healing, valueB: statsB.average.healing, format: (v) => formatNumber(v) },
        { label: t('Assists/10'), valueA: statsA.average.assists, valueB: statsB.average.assists, format: (v) => formatStat(v) },
      ]
    : [];

  return (
    <div className="py-6 space-y-6">
      <h1 className="text-2xl font-bold text-ow-text">{t('Hero Comparison')}</h1>

      {/* Hero Selectors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-ow-blue-light font-medium mb-1">{t('Hero 1')}</label>
          <select
            value={heroA}
            onChange={(e) => setHeroA(e.target.value)}
            className="w-full bg-ow-card border border-ow-blue/30 rounded-lg px-3 py-2 text-ow-text focus:outline-none focus:border-ow-blue"
          >
            <option value="">{t('Select hero...')}</option>
            {heroPool.map((key) => (
              <option key={key} value={key} disabled={key === heroB}>
                {getHeroName(key)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-ow-orange-light font-medium mb-1">{t('Hero 2')}</label>
          <select
            value={heroB}
            onChange={(e) => setHeroB(e.target.value)}
            className="w-full bg-ow-card border border-ow-orange/30 rounded-lg px-3 py-2 text-ow-text focus:outline-none focus:border-ow-orange"
          >
            <option value="">{t('Select hero...')}</option>
            {heroPool.map((key) => (
              <option key={key} value={key} disabled={key === heroA}>
                {getHeroName(key)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {canCompare && (
        <>
          {/* Dual Radar Chart */}
          <div className="bg-ow-card border border-ow-border rounded-lg p-4">
            <h2 className="text-lg font-semibold text-ow-text mb-4">{t('Performance Comparison')}</h2>
            <DualRadarChart
              valuesA={getRadarValues(statsA, heroA)}
              valuesB={getRadarValues(statsB, heroB)}
              labels={RADAR_LABELS}
              labelA={getHeroName(heroA)}
              labelB={getHeroName(heroB)}
            />
          </div>

          {/* Side-by-side Stats */}
          <div className="bg-ow-card border border-ow-border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                {heroMap.get(heroA)?.portrait && (
                  <img src={heroMap.get(heroA)!.portrait} alt="" className="w-8 h-8 rounded-full border border-ow-blue" />
                )}
                <span className="text-ow-blue-light font-semibold text-sm">{getHeroName(heroA)}</span>
              </div>
              <span className="text-ow-text-muted text-xs">{t('VS')}</span>
              <div className="flex items-center gap-2">
                <span className="text-ow-orange-light font-semibold text-sm">{getHeroName(heroB)}</span>
                {heroMap.get(heroB)?.portrait && (
                  <img src={heroMap.get(heroB)!.portrait} alt="" className="w-8 h-8 rounded-full border border-ow-orange" />
                )}
              </div>
            </div>
            <ComparisonBars rows={compareRows} />
          </div>
        </>
      )}

      {!canCompare && heroPool.length > 0 && (
        <div className="text-center py-12 text-ow-text-muted">
          <p>{t('Select two heroes to compare their stats')}</p>
        </div>
      )}

      {heroPool.length === 0 && (
        <div className="text-center py-12 text-ow-text-muted">
          <p>{t('No hero data available')}</p>
        </div>
      )}
    </div>
  );
}
