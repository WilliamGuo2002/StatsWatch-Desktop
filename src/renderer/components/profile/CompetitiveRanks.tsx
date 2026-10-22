import { useTranslation } from 'react-i18next';
import type { PlatformRanks, RankInfo } from '../../types/models';
import { getRankDisplay, getDisplaySeason } from '../../utils/formatting';

interface Props {
  ranks: PlatformRanks | null | undefined;
}

const ROLES = [
  { key: 'tank' as const, label: 'Tank', letter: 'T', color: 'bg-ow-tank' },
  { key: 'damage' as const, label: 'DPS', letter: 'D', color: 'bg-ow-dps' },
  { key: 'support' as const, label: 'Support', letter: 'S', color: 'bg-ow-support' },
  { key: 'open' as const, label: 'Open 6v6', letter: 'O', color: 'bg-ow-open' },
];

function RankCard({
  role,
  rank,
}: {
  role: (typeof ROLES)[number];
  rank: RankInfo | null | undefined;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-2 bg-ow-card border border-ow-border rounded-xl p-3 min-w-[70px] flex-1">
      {/* Role icon circle */}
      <div
        className={`w-8 h-8 rounded-full ${role.color} flex items-center justify-center text-white text-xs font-bold`}
      >
        {role.letter}
      </div>

      {/* Rank icon or unranked */}
      {rank ? (
        <>
          <img src={rank.rank_icon} alt={rank.division} className="w-10 h-10" />
          <span className="text-xs text-ow-text font-medium text-center">
            {getRankDisplay(rank.division, rank.tier)}
          </span>
        </>
      ) : (
        <>
          <div className="w-10 h-10 rounded-full bg-ow-border flex items-center justify-center">
            <span className="text-ow-text-muted text-lg">?</span>
          </div>
          <span className="text-xs text-ow-text-muted">{t('Unranked')}</span>
        </>
      )}
    </div>
  );
}

export default function CompetitiveRanks({ ranks }: Props) {
  const { t } = useTranslation();

  const season = ranks ? getDisplaySeason(ranks.season) : null;

  return (
    <div className="space-y-2">
      {/* Season badge */}
      {season !== null && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-ow-text-secondary font-medium bg-ow-card border border-ow-border rounded-full px-2.5 py-0.5">
            {t('Season {{season}}', { season })}
          </span>
        </div>
      )}

      {/* Rank cards row */}
      <div className="grid grid-cols-4 gap-2">
        {ROLES.map(role => (
          <RankCard
            key={role.key}
            role={role}
            rank={ranks?.[role.key]}
          />
        ))}
      </div>
    </div>
  );
}
