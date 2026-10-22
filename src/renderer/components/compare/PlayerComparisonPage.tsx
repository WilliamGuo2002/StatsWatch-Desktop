import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getPlayerSummary, getPlayerStatsSummary } from '../../api/overwatchApi';
import { battleTagToPlayerId, formatBattleTag, formatPercent, formatStat, formatNumber } from '../../utils/formatting';
import { ROLE_ORDER, ROLE_COLORS } from '../../utils/constants';
import type { GameMode, PlayerStatsSummary } from '../../types/models';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

interface CompareRow {
  label: string;
  valueA: number;
  valueB: number;
  format: (v: number) => string;
  lowerIsBetter?: boolean;
}

function ComparisonBars({ rows }: { rows: CompareRow[] }) {
  return (
    <div className="space-y-4">
      {rows.map((row) => {
        const max = Math.max(row.valueA, row.valueB, 0.01);
        const aWins = row.lowerIsBetter
          ? row.valueA <= row.valueB
          : row.valueA >= row.valueB;
        return (
          <div key={row.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className={aWins ? 'text-ow-blue-light font-semibold' : 'text-ow-text-secondary'}>{row.format(row.valueA)}</span>
              <span className="text-ow-text-muted text-xs">{row.label}</span>
              <span className={!aWins ? 'text-ow-orange-light font-semibold' : 'text-ow-text-secondary'}>{row.format(row.valueB)}</span>
            </div>
            <div className="flex gap-1">
              <div className="flex-1 h-2.5 bg-ow-darker rounded-full overflow-hidden flex justify-end">
                <div
                  className="h-full bg-ow-blue rounded-full transition-all"
                  style={{ width: `${(row.valueA / max) * 100}%` }}
                />
              </div>
              <div className="flex-1 h-2.5 bg-ow-darker rounded-full overflow-hidden">
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

function RoleBreakdown({
  statsA,
  statsB,
  nameA,
  nameB,
}: {
  statsA: PlayerStatsSummary;
  statsB: PlayerStatsSummary;
  nameA: string;
  nameB: string;
}) {
  const { t } = useTranslation();
  const roles = ROLE_ORDER.filter((r) => r !== 'open');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-ow-text">{t('Role Breakdown')}</h3>
      {roles.map((role) => {
        const roleA = statsA.roles?.[role];
        const roleB = statsB.roles?.[role];
        if (!roleA && !roleB) return null;
        const roleColor = ROLE_COLORS[role];

        return (
          <div key={role} className="bg-ow-card border border-ow-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: roleColor }} />
              <span className="text-sm font-semibold capitalize" style={{ color: roleColor }}>{role}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <p className="text-ow-blue-light font-semibold">{nameA}</p>
                <p className="text-ow-text-secondary mt-1">
                  {roleA ? `${roleA.games_played} ${t('games')}` : '-'}
                </p>
                <p className="text-ow-text-secondary">
                  {roleA ? `${formatPercent(roleA.winrate)} WR` : '-'}
                </p>
                <p className="text-ow-text-secondary">
                  {roleA ? `${formatStat(roleA.kda)} KDA` : '-'}
                </p>
              </div>
              <div className="text-center flex items-center justify-center">
                <span className="text-ow-text-muted text-lg font-bold">{t('VS')}</span>
              </div>
              <div className="text-center">
                <p className="text-ow-orange-light font-semibold">{nameB}</p>
                <p className="text-ow-text-secondary mt-1">
                  {roleB ? `${roleB.games_played} ${t('games')}` : '-'}
                </p>
                <p className="text-ow-text-secondary">
                  {roleB ? `${formatPercent(roleB.winrate)} WR` : '-'}
                </p>
                <p className="text-ow-text-secondary">
                  {roleB ? `${formatStat(roleB.kda)} KDA` : '-'}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PlayerComparisonPage() {
  const { t } = useTranslation();
  const [tagA, setTagA] = useState('');
  const [tagB, setTagB] = useState('');
  const [gamemode, setGamemode] = useState<GameMode>('competitive');
  const [playerIds, setPlayerIds] = useState<{ a: string; b: string } | null>(null);

  const handleCompare = () => {
    const idA = battleTagToPlayerId(tagA.trim());
    const idB = battleTagToPlayerId(tagB.trim());
    if (idA && idB) {
      setPlayerIds({ a: idA, b: idB });
    }
  };

  const {
    data: summaryA,
    isLoading: loadingA,
    error: errorA,
  } = useQuery({
    queryKey: ['playerSummary', playerIds?.a],
    queryFn: () => getPlayerSummary(playerIds!.a),
    enabled: !!playerIds?.a,
  });

  const {
    data: summaryB,
    isLoading: loadingB,
    error: errorB,
  } = useQuery({
    queryKey: ['playerSummary', playerIds?.b],
    queryFn: () => getPlayerSummary(playerIds!.b),
    enabled: !!playerIds?.b,
  });

  const {
    data: statsA,
    isLoading: loadingStatsA,
  } = useQuery({
    queryKey: ['playerStats', playerIds?.a, gamemode],
    queryFn: () => getPlayerStatsSummary(playerIds!.a, gamemode),
    enabled: !!playerIds?.a,
  });

  const {
    data: statsB,
    isLoading: loadingStatsB,
  } = useQuery({
    queryKey: ['playerStats', playerIds?.b, gamemode],
    queryFn: () => getPlayerStatsSummary(playerIds!.b, gamemode),
    enabled: !!playerIds?.b,
  });

  const isLoading = loadingA || loadingB || loadingStatsA || loadingStatsB;
  const hasError = errorA || errorB;
  const hasResults = summaryA && summaryB && statsA && statsB;

  const genA = statsA?.general;
  const genB = statsB?.general;

  const compareRows: CompareRow[] =
    genA && genB
      ? [
          { label: t('Win Rate'), valueA: genA.winrate, valueB: genB.winrate, format: (v) => `${v.toFixed(1)}%` },
          { label: t('KDA'), valueA: genA.kda, valueB: genB.kda, format: (v) => formatStat(v) },
          { label: t('Games'), valueA: genA.games_played, valueB: genB.games_played, format: (v) => v.toFixed(0) },
          { label: t('Elims/10'), valueA: genA.average.eliminations, valueB: genB.average.eliminations, format: (v) => formatStat(v) },
          { label: t('Deaths/10'), valueA: genA.average.deaths, valueB: genB.average.deaths, format: (v) => formatStat(v), lowerIsBetter: true },
          { label: t('Dmg/10'), valueA: genA.average.damage, valueB: genB.average.damage, format: (v) => formatNumber(v) },
          { label: t('Heal/10'), valueA: genA.average.healing, valueB: genB.average.healing, format: (v) => formatNumber(v) },
          { label: t('Assists/10'), valueA: genA.average.assists, valueB: genB.average.assists, format: (v) => formatStat(v) },
        ]
      : [];

  return (
    <div className="py-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-ow-text">{t('Player Comparison')}</h1>

      {/* Input Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-ow-blue-light font-medium mb-1">{t('Player 1')}</label>
          <input
            type="text"
            value={tagA}
            onChange={(e) => setTagA(e.target.value)}
            placeholder="Player#1234"
            className="w-full bg-ow-card border border-ow-blue/30 rounded-lg px-4 py-2.5 text-sm text-ow-text placeholder-ow-text-muted focus:outline-none focus:border-ow-blue"
            onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
          />
        </div>
        <div>
          <label className="block text-sm text-ow-orange-light font-medium mb-1">{t('Player 2')}</label>
          <input
            type="text"
            value={tagB}
            onChange={(e) => setTagB(e.target.value)}
            placeholder="Player#5678"
            className="w-full bg-ow-card border border-ow-orange/30 rounded-lg px-4 py-2.5 text-sm text-ow-text placeholder-ow-text-muted focus:outline-none focus:border-ow-orange"
            onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
          />
        </div>
      </div>

      {/* Game Mode Picker */}
      <div className="flex gap-2">
        <button
          onClick={() => setGamemode('competitive')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            gamemode === 'competitive'
              ? 'bg-ow-orange text-white'
              : 'bg-ow-card border border-ow-border text-ow-text-secondary hover:bg-ow-card-hover'
          }`}
        >
          {t('Competitive')}
        </button>
        <button
          onClick={() => setGamemode('quickplay')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            gamemode === 'quickplay'
              ? 'bg-ow-orange text-white'
              : 'bg-ow-card border border-ow-border text-ow-text-secondary hover:bg-ow-card-hover'
          }`}
        >
          {t('Quick Play')}
        </button>
      </div>

      {/* Compare Button */}
      <button
        onClick={handleCompare}
        disabled={!tagA.trim() || !tagB.trim() || isLoading}
        className="w-full bg-ow-orange hover:bg-ow-orange-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {isLoading ? t('Comparing...') : t('Compare')}
      </button>

      {/* Errors */}
      {hasError && (
        <ErrorMessage message={((errorA || errorB) as Error).message} />
      )}

      {/* Loading */}
      {isLoading && <LoadingSpinner text={t('Fetching player data...')} />}

      {/* Results */}
      {hasResults && (
        <div className="space-y-6">
          {/* Avatars Header */}
          <div className="flex items-center justify-between bg-ow-card border border-ow-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              {summaryA.avatar && (
                <img src={summaryA.avatar} alt="" className="w-12 h-12 rounded-full border-2 border-ow-blue" />
              )}
              <div>
                <p className="text-ow-blue-light font-semibold">{summaryA.username}</p>
                <p className="text-xs text-ow-text-muted">{formatBattleTag(playerIds!.a)}</p>
              </div>
            </div>
            <span className="text-ow-text-muted font-bold text-xl">{t('VS')}</span>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-ow-orange-light font-semibold">{summaryB.username}</p>
                <p className="text-xs text-ow-text-muted">{formatBattleTag(playerIds!.b)}</p>
              </div>
              {summaryB.avatar && (
                <img src={summaryB.avatar} alt="" className="w-12 h-12 rounded-full border-2 border-ow-orange" />
              )}
            </div>
          </div>

          {/* Stat Comparison Bars */}
          <div className="bg-ow-card border border-ow-border rounded-lg p-4">
            <h2 className="text-lg font-semibold text-ow-text mb-4">{t('Overall Stats')}</h2>
            <ComparisonBars rows={compareRows} />
          </div>

          {/* Role Breakdown */}
          <RoleBreakdown
            statsA={statsA}
            statsB={statsB}
            nameA={summaryA.username}
            nameB={summaryB.username}
          />
        </div>
      )}
    </div>
  );
}
