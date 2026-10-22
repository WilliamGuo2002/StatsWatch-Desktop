import { useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import type { PlayerSummary, PlayerStatsSummary, HeroStatEntry, HeroInfo, GameMode } from '../../types/models';
import {
  formatBattleTag,
  formatPercent,
  formatStat,
  formatTimePlayed,
  getRankDisplay,
  getDisplaySeason,
} from '../../utils/formatting';

interface Props {
  summary: PlayerSummary;
  stats: PlayerStatsSummary;
  topHeroes: { key: string; stats: HeroStatEntry }[];
  heroInfoList: HeroInfo[];
  gamemode: GameMode;
}

export default function ShareCard({ summary, stats, topHeroes, heroInfoList, gamemode }: Props) {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0e1a',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `statswatch-${summary.username}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Share card render failed', err);
    }
  }, [summary.username]);

  const general = stats.general;
  const ranks = summary.competitive?.pc;
  const season = ranks ? getDisplaySeason(ranks.season) : null;

  const rankEntries = [
    { key: 'Tank', rank: ranks?.tank },
    { key: 'DPS', rank: ranks?.damage },
    { key: 'Sup', rank: ranks?.support },
    { key: '6v6', rank: ranks?.open },
  ].filter(r => r.rank);

  return (
    <>
      {/* Hidden card for rendering */}
      <div
        ref={cardRef}
        className="fixed -left-[9999px] top-0"
        style={{ width: 400, padding: 24, fontFamily: 'sans-serif' }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 100%)',
            borderRadius: 16,
            padding: 24,
            color: '#f9fafb',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            {summary.avatar && (
              <img
                src={summary.avatar}
                alt=""
                style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }}
                crossOrigin="anonymous"
              />
            )}
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{formatBattleTag(summary.username)}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>
                {gamemode === 'competitive' ? 'Competitive' : 'Quick Play'}
                {season !== null && ` - Season ${season}`}
              </div>
            </div>
          </div>

          {/* Ranks row */}
          {rankEntries.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {rankEntries.map(({ key, rank }) => (
                <div
                  key={key}
                  style={{
                    flex: 1,
                    background: '#1f2937',
                    borderRadius: 8,
                    padding: '8px 4px',
                    textAlign: 'center',
                  }}
                >
                  <img
                    src={rank!.rank_icon}
                    alt=""
                    style={{ width: 28, height: 28, margin: '0 auto 4px' }}
                    crossOrigin="anonymous"
                  />
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>{key}</div>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>
                    {getRankDisplay(rank!.division, rank!.tier)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats row */}
          {general && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <div
                style={{
                  flex: 1,
                  background: '#1f2937',
                  borderRadius: 8,
                  padding: 8,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 10, color: '#9ca3af' }}>Win Rate</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f97316' }}>
                  {formatPercent(general.winrate)}
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  background: '#1f2937',
                  borderRadius: 8,
                  padding: 8,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 10, color: '#9ca3af' }}>KDA</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#3b82f6' }}>
                  {formatStat(general.kda)}
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  background: '#1f2937',
                  borderRadius: 8,
                  padding: 8,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 10, color: '#9ca3af' }}>Time</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  {formatTimePlayed(general.time_played)}
                </div>
              </div>
            </div>
          )}

          {/* Per-10 stats row (aligned with iOS) */}
          {general && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {[
                { label: 'Elims/10', value: general.average.eliminations.toFixed(1) },
                { label: 'Deaths/10', value: general.average.deaths.toFixed(1) },
                { label: 'Dmg/10', value: Math.round(general.average.damage).toLocaleString() },
                { label: 'Heal/10', value: Math.round(general.average.healing).toLocaleString() },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    flex: 1,
                    background: '#1f2937',
                    borderRadius: 8,
                    padding: '6px 4px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 9, color: '#9ca3af' }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Top heroes row */}
          {topHeroes.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {topHeroes.slice(0, 3).map(hero => {
                const heroInfo = heroInfoList.find(h => h.key === hero.key);
                return (
                  <div
                    key={hero.key}
                    style={{
                      flex: 1,
                      background: '#1f2937',
                      borderRadius: 8,
                      padding: 8,
                      textAlign: 'center',
                    }}
                  >
                    {heroInfo?.portrait && (
                      <img
                        src={heroInfo.portrait}
                        alt=""
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          objectFit: 'cover',
                          margin: '0 auto 4px',
                        }}
                        crossOrigin="anonymous"
                      />
                    )}
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {hero.key.replace(/-/g, ' ')}
                    </div>
                    <div style={{ fontSize: 10, color: '#f97316' }}>
                      {formatPercent(hero.stats.winrate)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Branding */}
          <div style={{ textAlign: 'center', fontSize: 10, color: '#6b7280' }}>
            StatsWatch.app
          </div>
        </div>
      </div>

      {/* Share button */}
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 bg-ow-card hover:bg-ow-card-hover border border-ow-border rounded-xl text-sm text-ow-text transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        {t('Share')}
      </button>
    </>
  );
}
