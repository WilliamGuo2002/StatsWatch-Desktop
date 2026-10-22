import { useTranslation } from 'react-i18next';
import type { TierEntry } from '../../utils/statsCalculations';
import type { HeroInfo } from '../../types/models';
import { formatPercent } from '../../utils/formatting';

interface Props {
  tiers: Record<string, TierEntry[]>;
  heroInfoList: HeroInfo[];
}

const TIER_CONFIG: Record<string, { color: string; bg: string }> = {
  S: { color: 'text-tier-s', bg: 'bg-tier-s' },
  A: { color: 'text-tier-a', bg: 'bg-tier-a' },
  B: { color: 'text-tier-b', bg: 'bg-tier-b' },
  C: { color: 'text-tier-c', bg: 'bg-tier-c' },
  D: { color: 'text-tier-d', bg: 'bg-tier-d' },
};

const TIER_ORDER = ['S', 'A', 'B', 'C', 'D'];

export default function HeroTierList({ tiers, heroInfoList }: Props) {
  const { t } = useTranslation();

  const hasTiers = TIER_ORDER.some(tier => (tiers[tier]?.length ?? 0) > 0);
  if (!hasTiers) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-ow-text">{t('Hero Tier List')}</h3>

      <div className="space-y-1.5">
        {TIER_ORDER.map(tier => {
          const entries = tiers[tier];
          if (!entries || entries.length === 0) return null;

          const config = TIER_CONFIG[tier];

          return (
            <div
              key={tier}
              className="flex items-center gap-2 bg-ow-card border border-ow-border rounded-lg p-2"
            >
              {/* Tier badge */}
              <div
                className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}
              >
                <span className="text-sm font-bold text-white">{tier}</span>
              </div>

              {/* Heroes scroll */}
              <div className="flex gap-2 overflow-x-auto py-0.5 flex-1">
                {entries.map(entry => {
                  const heroInfo = heroInfoList.find(h => h.key === entry.heroKey);
                  return (
                    <div
                      key={entry.heroKey}
                      className="flex flex-col items-center gap-0.5 flex-shrink-0"
                    >
                      {heroInfo?.portrait ? (
                        <img
                          src={heroInfo.portrait}
                          alt={entry.heroKey}
                          className="w-9 h-9 rounded-lg object-cover border border-ow-border"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-ow-card-hover border border-ow-border flex items-center justify-center">
                          <span className="text-ow-text-muted text-[10px] capitalize">
                            {entry.heroKey.charAt(0)}
                          </span>
                        </div>
                      )}
                      <span className="text-[9px] text-ow-text-secondary">
                        {formatPercent(entry.winrate)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
