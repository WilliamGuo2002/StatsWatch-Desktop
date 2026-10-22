import { useTranslation } from 'react-i18next';
import type { PlayerStatsSummary, HeroStatEntry } from '../../types/models';
import {
  getQueueRecommendation,
  estimateRank,
  analyzeHeroPool,
  getPersonalizedTips,
  type TipTone,
} from '../../utils/statsCalculations';

interface Props {
  stats: PlayerStatsSummary;
  heroes: Record<string, HeroStatEntry>;
  selectedRole?: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  tank: 'Tank',
  damage: 'Damage',
  support: 'Support',
};

const ROLE_COLOR: Record<string, string> = {
  tank: 'text-ow-tank',
  damage: 'text-ow-dps',
  support: 'text-ow-support',
};

const ROLE_BG: Record<string, string> = {
  tank: 'bg-ow-tank',
  damage: 'bg-ow-dps',
  support: 'bg-ow-support',
};

/** Rank tiers in iOS order, with its icon colour per tier. */
const RANK_STYLE: Record<string, { color: string; ring: string }> = {
  Bronze: { color: 'text-amber-700', ring: 'bg-amber-700/15' },
  Silver: { color: 'text-gray-400', ring: 'bg-gray-400/15' },
  Gold: { color: 'text-ow-gold', ring: 'bg-ow-gold/15' },
  Platinum: { color: 'text-cyan-400', ring: 'bg-cyan-400/15' },
  Diamond: { color: 'text-blue-400', ring: 'bg-blue-400/15' },
  Master: { color: 'text-purple-400', ring: 'bg-purple-400/15' },
  Gm: { color: 'text-orange-400', ring: 'bg-orange-400/15' },
};

const TIP_STYLE: Record<TipTone, { color: string; path: string }> = {
  warning: { color: 'text-red-400', path: 'M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-.83-1.96-.83-2.73 0L3.34 16c-.77 1.33.19 3 1.73 3z' },
  success: { color: 'text-ow-support', path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  decline: { color: 'text-red-400', path: 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6' },
  fire: { color: 'text-ow-orange', path: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z' },
  aim: { color: 'text-ow-orange', path: 'M12 8v8m4-4H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z' },
  star: { color: 'text-ow-gold', path: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  tank: { color: 'text-ow-tank', path: 'M9 12l2 2 4-4M12 3l7 4v5c0 4.42-3.13 8.44-7 9.5-3.87-1.06-7-5.08-7-9.5V7l7-4z' },
  damage: { color: 'text-ow-dps', path: 'M13 10V3L4 14h7v7l9-11h-7z' },
  heal: { color: 'text-ow-blue', path: 'M12 6v12m6-6H6' },
  thumbs: { color: 'text-ow-support', path: 'M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20M14 10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5' },
  team: { color: 'text-purple-400', path: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  pool: { color: 'text-cyan-400', path: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
};

function Card({
  title,
  iconPath,
  iconColor,
  right,
  children,
}: {
  title: string;
  iconPath: string;
  iconColor: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ow-border bg-ow-card p-3.5">
      <div className="mb-2.5 flex items-center gap-2">
        <svg className={`h-4 w-4 ${iconColor}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
        </svg>
        <span className="text-[13px] font-bold text-ow-text">{title}</span>
        {right && <div className="ml-auto">{right}</div>}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] text-ow-text-secondary">{children}</p>;
}

export default function SmartCoach({ stats, heroes, selectedRole }: Props) {
  const { t } = useTranslation();

  const roles = stats.roles || {};
  const queueRec = getQueueRecommendation(roles);
  const heroPool = analyzeHeroPool(heroes, selectedRole);
  const tips = getPersonalizedTips(stats, selectedRole, heroes);

  // iOS shows ONE estimate, driven by the selected role (or overall).
  const estimate = estimateRank(stats, selectedRole ?? null);
  const rankStyle = estimate ? RANK_STYLE[estimate.rank] ?? RANK_STYLE.Gold : null;
  const roleLabel = selectedRole ? ROLE_LABELS[selectedRole] : null;

  const diversityTone =
    heroPool.diversityScore >= 70
      ? { stroke: '#22c55e', text: 'text-ow-support' }
      : heroPool.diversityScore >= 40
        ? { stroke: '#f59e0b', text: 'text-amber-400' }
        : { stroke: '#ef4444', text: 'text-red-400' };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h3 className="text-[15px] font-bold text-ow-text">{t('Smart Coach')}</h3>
        {selectedRole ? (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${ROLE_BG[selectedRole]}`}>
            {t(ROLE_LABELS[selectedRole])}
          </span>
        ) : (
          <span className="text-[11px] text-ow-text-secondary">{t('All Roles')}</span>
        )}
      </div>

      {/* 1 — Queue Recommendation */}
      <Card
        title={t('Queue Recommendation')}
        iconPath="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        iconColor="text-ow-support"
      >
        {queueRec.length === 0 ? (
          <Empty>{t('Play at least 3 games per role to get recommendations')}</Empty>
        ) : (
          <div className="space-y-2">
            {queueRec.map((r, index) => (
              <div key={r.role} className="flex items-center gap-2.5">
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                    index === 0 ? 'bg-ow-support/15 text-ow-support' : 'bg-ow-border text-ow-text-muted'
                  }`}
                >
                  {index + 1}
                </span>
                <span className={`text-[13px] font-semibold ${ROLE_COLOR[r.role]}`}>
                  {t(ROLE_LABELS[r.role])}
                </span>

                <div className="ml-auto text-right leading-tight">
                  <div
                    className={`text-[11px] font-semibold tabular-nums ${
                      r.winrate >= 50 ? 'text-ow-support' : 'text-red-400'
                    }`}
                  >
                    {r.winrate.toFixed(1)}% {t('WR')}
                  </div>
                  <div className="text-[9px] text-ow-text-muted tabular-nums">
                    {t('{{count}} games', { count: r.games })}
                  </div>
                </div>

                {r.role === selectedRole ? (
                  <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-black text-white ${ROLE_BG[r.role]}`}>
                    {t('SELECTED')}
                  </span>
                ) : index === 0 ? (
                  <span className="rounded-full bg-ow-support px-1.5 py-0.5 text-[8px] font-black text-white">
                    {t('BEST')}
                  </span>
                ) : (
                  <span className="w-[52px]" />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 2 — Stats-Based Rank Reference */}
      <Card
        title={t('Stats-Based Rank Reference')}
        iconPath="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
        iconColor="text-ow-orange"
      >
        {!estimate || !rankStyle ? (
          <Empty>{t('Not enough stat data for estimation')}</Empty>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${rankStyle.ring}`}>
                <svg className={`h-5 w-5 ${rankStyle.color}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[20px] font-bold ${rankStyle.color}`}>~{t(estimate.rank)}</span>
                  {roleLabel && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-white ${ROLE_BG[selectedRole!]}`}>
                      {t(roleLabel)}
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-ow-text-secondary">
                  {roleLabel
                    ? t('Rough reference from {{role}} per-10min stats', { role: t(roleLabel) })
                    : t('Rough reference from per-10min stats')}
                </p>

                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[9px] text-ow-text-muted">{t('Confidence')}</span>
                  <div className="h-1 w-[60px] overflow-hidden rounded-full bg-ow-border">
                    <div
                      className={`h-full rounded-full ${rankStyle.color.replace('text-', 'bg-')}`}
                      style={{ width: `${estimate.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-ow-text-muted tabular-nums">
                    {(estimate.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* iOS carries this disclaimer right under the estimate, and it
                matters: the number is a stat lookup, not a real rank. */}
            <p className="text-[9px] leading-relaxed text-ow-text-muted">
              {t('Only based on elims/deaths/damage/healing averages. Real rank also depends on accuracy, positioning, ult economy, team play and more.')}
            </p>
          </div>
        )}
      </Card>

      {/* 3 — Hero Pool Analysis */}
      <Card
        title={t('Hero Pool Analysis')}
        iconPath="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        iconColor="text-cyan-400"
      >
        {heroPool.heroCount === 0 ? (
          <Empty>{t('Not enough data to analyze hero pool')}</Empty>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 shrink-0">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="3.5" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke={diversityTone.stroke}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={`${heroPool.diversityScore} ${100 - heroPool.diversityScore}`}
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <span className="text-[11px] font-bold tabular-nums text-ow-text">
                    {heroPool.diversityScore.toFixed(0)}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[13px] font-semibold text-ow-text">
                  {t('Diversity')}: <span className={diversityTone.text}>{t(heroPool.diversityLabel)}</span>
                </p>
                <p className="text-[11px] text-ow-text-secondary">
                  {selectedRole
                    ? t('{{count}} {{role}} heroes played', {
                        count: heroPool.heroCount,
                        role: t(ROLE_LABELS[selectedRole]),
                      })
                    : t('{{count}} heroes ({{tank}}T / {{damage}}D / {{support}}S)', {
                        count: heroPool.heroCount,
                        tank: heroPool.tankCount,
                        damage: heroPool.damageCount,
                        support: heroPool.supportCount,
                      })}
                </p>
              </div>
            </div>

            {/* One-trick alert — computed all along, never shown until now. */}
            {heroPool.oneTrick && (
              <div className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 shrink-0 text-ow-orange" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-[11px] text-ow-orange">
                  {t('One-trick alert: >60% playtime on')}{' '}
                  <strong className="font-bold capitalize">{heroPool.oneTrick.replace(/-/g, ' ')}</strong>
                </span>
              </div>
            )}

            {heroPool.missingSubroles.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] text-ow-text-secondary">{t('Gaps in hero pool')}:</p>
                <div className="flex flex-wrap gap-1.5">
                  {heroPool.missingSubroles.map((gap) => (
                    <span
                      key={gap}
                      className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400"
                    >
                      {t(gap)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 4 — Personalized Tips */}
      <Card
        title={t('Personalized Tips')}
        iconPath="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        iconColor="text-ow-gold"
      >
        {tips.length === 0 ? (
          <Empty>{t('Play more games to get personalized coaching tips')}</Empty>
        ) : (
          <div className="space-y-2">
            {tips.map((tip, i) => {
              const style = TIP_STYLE[tip.tone];
              return (
                <div key={i} className="flex items-start gap-2">
                  <svg
                    className={`mt-[2px] h-3.5 w-3.5 shrink-0 ${style.color}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={style.path} />
                  </svg>
                  <p className="text-[12px] leading-relaxed text-ow-text-secondary">{tip.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
