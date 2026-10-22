import { useTranslation } from 'react-i18next';
import type { RoleStatEntry } from '../../types/models';
import { formatPercent, formatStat } from '../../utils/formatting';

interface Props {
  roles: Record<string, RoleStatEntry>;
}

const ROLE_CONFIG: Record<string, { label: string; headerClass: string }> = {
  tank: { label: 'Tank', headerClass: 'bg-ow-tank' },
  damage: { label: 'DPS', headerClass: 'bg-ow-dps' },
  support: { label: 'Support', headerClass: 'bg-ow-support' },
  open: { label: 'Open', headerClass: 'bg-ow-open' },
};

export default function RoleStats({ roles }: Props) {
  const { t } = useTranslation();

  const roleEntries = Object.entries(roles).filter(
    ([, data]) => data.games_played > 0
  );

  if (roleEntries.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-ow-text">{t('Role Stats')}</h3>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
        {roleEntries.map(([key, data]) => {
          const config = ROLE_CONFIG[key] || {
            label: key,
            headerClass: 'bg-ow-border',
          };

          return (
            <div
              key={key}
              className="flex-shrink-0 w-[140px] bg-ow-card border border-ow-border rounded-xl overflow-hidden"
            >
              {/* Colored header */}
              <div
                className={`${config.headerClass} px-3 py-1.5 text-center`}
              >
                <span className="text-xs font-bold text-white">
                  {t(config.label)}
                </span>
              </div>

              {/* Stats */}
              <div className="p-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-ow-text-muted">{t('Games')}</span>
                  <span className="text-xs font-medium text-ow-text">
                    {data.games_played}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-ow-text-muted">{t('WR%')}</span>
                  <span className="text-xs font-medium text-ow-orange">
                    {formatPercent(data.winrate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-ow-text-muted">{t('KDA')}</span>
                  <span className="text-xs font-medium text-ow-blue">
                    {formatStat(data.kda)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
