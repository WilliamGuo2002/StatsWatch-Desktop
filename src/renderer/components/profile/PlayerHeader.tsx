import { useTranslation } from 'react-i18next';
import type { PlayerSummary } from '../../types/models';
import { formatBattleTag } from '../../utils/formatting';

interface Props {
  summary: PlayerSummary;
}

export default function PlayerHeader({ summary }: Props) {
  const { t } = useTranslation();

  const ranks = summary.competitive?.pc;
  const roleEntries = [
    { key: 'tank', rank: ranks?.tank },
    { key: 'damage', rank: ranks?.damage },
    { key: 'support', rank: ranks?.support },
    { key: 'open', rank: ranks?.open },
  ].filter(r => r.rank);

  return (
    <div className="flex items-center gap-4">
      {/* Avatar */}
      <img
        src={summary.avatar || '/placeholder-avatar.png'}
        alt={summary.username}
        className="w-[72px] h-[72px] rounded-xl object-cover border-2 border-ow-border"
      />

      <div className="flex flex-col gap-1 min-w-0">
        {/* Username */}
        <h1 className="text-xl font-bold text-ow-text truncate">
          {formatBattleTag(summary.username)}
        </h1>

        {/* Title */}
        {summary.title && (
          <p className="text-sm text-ow-text-secondary truncate">{summary.title}</p>
        )}

        {/* Endorsement + Compact rank icons */}
        <div className="flex items-center gap-2 mt-0.5">
          {summary.endorsement && (
            <div
              className="w-7 h-7 rounded-full bg-ow-gold flex items-center justify-center text-xs font-bold text-ow-dark"
              title={t('Endorsement Level {{level}}', { level: summary.endorsement.level })}
            >
              {summary.endorsement.level}
            </div>
          )}

          {roleEntries.length > 0 && (
            <div className="flex items-center gap-1">
              {roleEntries.map(({ key, rank }) => (
                <img
                  key={key}
                  src={rank!.rank_icon}
                  alt={key}
                  className="w-6 h-6"
                  title={key}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
