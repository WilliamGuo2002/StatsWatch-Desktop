import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PlayerStatsSummary, HeroStatEntry } from '../../types/models';
import {
  getQueueRecommendation,
  estimateRank,
  analyzeHeroPool,
  getPersonalizedTips,
} from '../../utils/statsCalculations';

interface Props {
  stats: PlayerStatsSummary;
  heroes: Record<string, HeroStatEntry>;
  selectedRole?: string | null;
}

function ExpandableCard({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-ow-card border border-ow-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-ow-card-hover transition-colors"
      >
        {icon}
        <span className="text-sm font-semibold text-ow-text flex-1 text-left">
          {title}
        </span>
        <svg
          className={`w-4 h-4 text-ow-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

const ROLE_LABELS: Record<string, string> = {
  tank: 'Tank',
  damage: 'DPS',
  support: 'Support',
};

const RANK_COLORS: Record<string, string> = {
  Bronze: 'text-amber-700',
  Silver: 'text-gray-400',
  Gold: 'text-ow-gold',
  Platinum: 'text-cyan-400',
  Diamond: 'text-blue-400',
  Master: 'text-purple-400',
  Gm: 'text-orange-400',
};

export default function SmartCoach({ stats, heroes, selectedRole }: Props) {
  const { t } = useTranslation();

  const roles = stats.roles || {};
  const queueRec = getQueueRecommendation(roles);
  const heroPool = analyzeHeroPool(heroes, selectedRole);
  const tips = getPersonalizedTips(stats, selectedRole, heroes);

  const rankEstimates = ['tank', 'damage', 'support'].map(role => ({
    role,
    ...estimateRank(stats, role),
  }));

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-ow-text">{t('Smart Coach')}</h3>

      {/* 1. Queue Recommendation */}
      <ExpandableCard
        title={t('Queue Recommendation')}
        defaultOpen
        icon={
          <svg className="w-5 h-5 text-ow-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        }
      >
        <div className="space-y-2">
          {queueRec.map((rec, idx) => (
            <div key={rec.role} className="flex items-center gap-2">
              <span className="text-xs text-ow-text-secondary w-14">
                {ROLE_LABELS[rec.role] || rec.role}
              </span>
              <div className="flex-1 h-2 bg-ow-darker rounded-full overflow-hidden">
                <div
                  className="h-full bg-ow-blue rounded-full transition-all"
                  style={{ width: `${rec.score * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-ow-text w-10 text-right">
                {(rec.score * 100).toFixed(0)}%
              </span>
              {idx === 0 && (
                <span className="text-[9px] font-bold bg-ow-orange text-white px-1.5 py-0.5 rounded">
                  {t('BEST')}
                </span>
              )}
            </div>
          ))}
        </div>
      </ExpandableCard>

      {/* 2. Rank Estimation */}
      <ExpandableCard
        title={t('Rank Estimation')}
        icon={
          <svg className="w-5 h-5 text-ow-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        }
      >
        <div className="space-y-3">
          {rankEstimates.map(({ role, rank, confidence }) => (
            <div key={role} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ow-text-secondary">
                  {ROLE_LABELS[role] || role}
                </span>
                <span className={`text-sm font-bold ${RANK_COLORS[rank] || 'text-ow-text'}`}>
                  {rank}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-ow-darker rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ow-orange rounded-full transition-all"
                    style={{ width: `${confidence * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-ow-text-muted w-8 text-right">
                  {(confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </ExpandableCard>

      {/* 3. Hero Pool Analysis */}
      <ExpandableCard
        title={t('Hero Pool Analysis')}
        icon={
          <svg className="w-5 h-5 text-ow-support" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
      >
        <div className="space-y-3">
          {/* Diversity score circle */}
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="#1f2937"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="3"
                  strokeDasharray={`${heroPool.diversityScore} ${100 - heroPool.diversityScore}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-ow-text">
                  {heroPool.diversityScore.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="text-xs text-ow-text-secondary">
              <p>{t('{{count}} heroes played', { count: heroPool.heroCount })}</p>
              <p className="text-ow-tank">{t('{{count}} Tanks', { count: heroPool.tankCount })}</p>
              <p className="text-ow-dps">{t('{{count}} DPS', { count: heroPool.damageCount })}</p>
              <p className="text-ow-support">{t('{{count}} Supports', { count: heroPool.supportCount })}</p>
            </div>
          </div>

          {/* Diversity label */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ow-text-muted">{t('Pool Diversity')}:</span>
            <span className={`text-[11px] font-semibold ${
              heroPool.diversityLabel === 'Versatile' ? 'text-green-400' :
              heroPool.diversityLabel === 'Moderate' ? 'text-orange-400' : 'text-red-400'
            }`}>
              {t(heroPool.diversityLabel)}
            </span>
          </div>

          {/* Subroles */}
          {Object.keys(heroPool.subroles).length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] text-ow-text-muted">{t('Subroles')}</span>
              {Object.entries(heroPool.subroles).map(([subroleName, heroKeys]) => (
                <div key={subroleName} className="flex items-center gap-2">
                  <span className="text-[11px] text-ow-text-secondary">{subroleName}:</span>
                  <span className="text-[11px] text-ow-text">{heroKeys.join(', ')}</span>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {heroPool.warnings.length > 0 && (
            <div className="space-y-1">
              {heroPool.warnings.map((warning, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <svg
                    className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-[11px] text-amber-300">{warning}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </ExpandableCard>

      {/* 4. Personalized Tips */}
      <ExpandableCard
        title={t('Personalized Tips')}
        icon={
          <svg className="w-5 h-5 text-ow-gold" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 002 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM4 11a1 1 0 100-2H3a1 1 0 000 2h1zM10 18a1 1 0 001-1v-1a1 1 0 10-2 0v1a1 1 0 001 1zM7 10a3 3 0 116 0 3 3 0 01-6 0z" />
          </svg>
        }
      >
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <svg
                className="w-4 h-4 text-ow-gold flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 002 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM4 11a1 1 0 100-2H3a1 1 0 000 2h1zM10 18a1 1 0 001-1v-1a1 1 0 10-2 0v1a1 1 0 001 1zM7 10a3 3 0 116 0 3 3 0 01-6 0z" />
              </svg>
              <p className="text-xs text-ow-text-secondary">{tip}</p>
            </div>
          ))}
        </div>
      </ExpandableCard>
    </div>
  );
}
