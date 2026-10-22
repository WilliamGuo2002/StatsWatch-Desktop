import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PlayerStatsSummary } from '../../types/models';
import {
  formatPercent,
  formatStat,
  formatTimePlayed,
  formatNumber,
} from '../../utils/formatting';

interface Props {
  stats: PlayerStatsSummary;
  selectedRole?: string | null;
}

export default function StatsOverview({ stats, selectedRole }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  // Use role-specific data if a role is selected, otherwise general
  const roleData = selectedRole && stats.roles?.[selectedRole]
    ? stats.roles[selectedRole]
    : stats.general;

  if (!roleData) return null;

  const general = roleData;
  const winRate = general.winrate;
  const gamesWon = general.games_won;
  const gamesPlayed = general.games_played;

  return (
    <div className="space-y-3">
      {/* Main stat cards */}
      <div className="grid grid-cols-3 gap-2">
        {/* Win Rate */}
        <div className="bg-ow-card border border-ow-border rounded-xl p-3 text-center">
          <p className="text-xs text-ow-text-secondary mb-1">{t('Win Rate')}</p>
          <p className="text-xl font-bold text-ow-orange">{formatPercent(winRate)}</p>
          <p className="text-[10px] text-ow-text-muted mt-0.5">
            {gamesWon}W / {gamesPlayed}{t('G')}
          </p>
        </div>

        {/* KDA */}
        <div className="bg-ow-card border border-ow-border rounded-xl p-3 text-center">
          <p className="text-xs text-ow-text-secondary mb-1">{t('KDA')}</p>
          <p className="text-xl font-bold text-ow-blue">{formatStat(general.kda)}</p>
          <p className="text-[10px] text-ow-text-muted mt-0.5">
            {t('K/D/A Ratio')}
          </p>
        </div>

        {/* Play Time */}
        <div className="bg-ow-card border border-ow-border rounded-xl p-3 text-center">
          <p className="text-xs text-ow-text-secondary mb-1">{t('Play Time')}</p>
          <p className="text-xl font-bold text-ow-text">{formatTimePlayed(general.time_played)}</p>
          <p className="text-[10px] text-ow-text-muted mt-0.5">
            {gamesPlayed} {t('games')}
          </p>
        </div>
      </div>

      {/* Per-10 row */}
      <div className="grid grid-cols-3 gap-2">
        <StatPill
          label={t('Elims/10')}
          value={formatStat(general.average.eliminations)}
        />
        <StatPill
          label={t('Deaths/10')}
          value={formatStat(general.average.deaths)}
        />
        <StatPill
          label={t('Assists/10')}
          value={formatStat(general.average.assists)}
        />
      </div>

      {/* Expandable section */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full text-xs text-ow-text-secondary hover:text-ow-text flex items-center justify-center gap-1 py-1 transition-colors"
      >
        {expanded ? t('Show Less') : t('Show More')}
        <svg
          className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <StatPill
              label={t('Dmg/10')}
              value={formatNumber(general.average.damage)}
            />
            <StatPill
              label={t('Heal/10')}
              value={formatNumber(general.average.healing)}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatPill
              label={t('Total Elims')}
              value={formatNumber(general.total.eliminations)}
            />
            <StatPill
              label={t('Total Dmg')}
              value={formatNumber(general.total.damage)}
            />
            <StatPill
              label={t('Total Heal')}
              value={formatNumber(general.total.healing)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ow-card border border-ow-border rounded-lg px-3 py-2 text-center">
      <p className="text-[10px] text-ow-text-muted">{label}</p>
      <p className="text-sm font-semibold text-ow-text">{value}</p>
    </div>
  );
}
