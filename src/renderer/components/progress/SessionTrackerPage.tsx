import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getPlayerStatsSummary } from '../../api/overwatchApi';
import { useActiveSession } from '../../hooks/useLocalStorage';
import { formatPercent, formatStat, formatNumber, getRelativeTime } from '../../utils/formatting';
import type { GameMode } from '../../types/models';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

interface SessionResult {
  gamesPlayed: number;
  estimatedWins: number;
  estimatedLosses: number;
  deltas: {
    label: string;
    before: number;
    after: number;
    delta: number;
    format: (v: number) => string;
    isPositive: boolean;
  }[];
}

export default function SessionTrackerPage() {
  const { playerId } = useParams<{ playerId: string }>();
  const { t } = useTranslation();
  const { session, startSession, endSession } = useActiveSession(playerId || '');
  const [gamemode, setGamemode] = useState<GameMode>('competitive');
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [isEnding, setIsEnding] = useState(false);

  const { data: currentStats, isLoading, error, refetch } = useQuery({
    queryKey: ['playerStats', playerId, session?.gamemode || gamemode],
    queryFn: () => getPlayerStatsSummary(playerId!, session?.gamemode || gamemode),
    enabled: !!playerId,
  });

  const handleStartSession = () => {
    if (!currentStats?.general) return;
    const gen = currentStats.general;
    startSession(gamemode, {
      winrate: gen.winrate,
      kda: gen.kda,
      gamesPlayed: gen.games_played,
      elimsPer10: gen.average.eliminations,
      deathsPer10: gen.average.deaths,
      damagePer10: gen.average.damage,
      healingPer10: gen.average.healing,
    });
  };

  const handleEndSession = async () => {
    if (!session || !playerId) return;
    setIsEnding(true);

    try {
      const freshStats = await getPlayerStatsSummary(playerId, session.gamemode);
      const gen = freshStats.general;
      if (!gen) {
        setIsEnding(false);
        return;
      }

      const start = session.startSnapshot;
      const gamesPlayed = gen.games_played - start.gamesPlayed;
      const wrDelta = gen.winrate - start.winrate;
      const estimatedWins = Math.max(0, Math.round(gamesPlayed * (0.5 + wrDelta)));
      const estimatedLosses = Math.max(0, gamesPlayed - estimatedWins);

      const result: SessionResult = {
        gamesPlayed: Math.max(0, gamesPlayed),
        estimatedWins,
        estimatedLosses,
        deltas: [
          {
            label: t('Win Rate'),
            before: start.winrate,
            after: gen.winrate,
            delta: gen.winrate - start.winrate,
            format: (v) => formatPercent(v),
            isPositive: gen.winrate >= start.winrate,
          },
          {
            label: t('KDA'),
            before: start.kda,
            after: gen.kda,
            delta: gen.kda - start.kda,
            format: (v) => formatStat(v),
            isPositive: gen.kda >= start.kda,
          },
          {
            label: t('Elims/10'),
            before: start.elimsPer10,
            after: gen.average.eliminations,
            delta: gen.average.eliminations - start.elimsPer10,
            format: (v) => formatStat(v),
            isPositive: gen.average.eliminations >= start.elimsPer10,
          },
          {
            label: t('Deaths/10'),
            before: start.deathsPer10,
            after: gen.average.deaths,
            delta: gen.average.deaths - start.deathsPer10,
            format: (v) => formatStat(v),
            isPositive: gen.average.deaths <= start.deathsPer10,
          },
          {
            label: t('Dmg/10'),
            before: start.damagePer10,
            after: gen.average.damage,
            delta: gen.average.damage - start.damagePer10,
            format: (v) => formatNumber(v),
            isPositive: gen.average.damage >= start.damagePer10,
          },
          {
            label: t('Heal/10'),
            before: start.healingPer10,
            after: gen.average.healing,
            delta: gen.average.healing - start.healingPer10,
            format: (v) => formatNumber(v),
            isPositive: gen.average.healing >= start.healingPer10,
          },
        ],
      };

      setSessionResult(result);
      endSession();
    } catch {
      // Silently handle errors
    } finally {
      setIsEnding(false);
    }
  };

  const handleCancel = () => {
    endSession();
    setSessionResult(null);
  };

  if (isLoading) return <LoadingSpinner text={t('Loading stats...')} />;
  if (error) return <ErrorMessage message={(error as Error).message} onRetry={() => refetch()} />;

  return (
    <div className="py-6 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-ow-text">{t('Session Tracker')}</h1>

      {/* No Session Active */}
      {!session && !sessionResult && (
        <div className="bg-ow-card border border-ow-border rounded-lg p-6 text-center space-y-4">
          <svg className="w-16 h-16 text-ow-orange mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h2 className="text-lg font-semibold text-ow-text">{t('Track Your Session')}</h2>
            <p className="text-ow-text-secondary text-sm mt-1">
              {t('Start a session before you play, then end it after to see how your stats changed.')}
            </p>
          </div>

          {/* Gamemode Selector */}
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setGamemode('competitive')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                gamemode === 'competitive'
                  ? 'bg-ow-orange text-white'
                  : 'bg-ow-darker text-ow-text-secondary hover:bg-ow-card-hover'
              }`}
            >
              {t('Competitive')}
            </button>
            <button
              onClick={() => setGamemode('quickplay')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                gamemode === 'quickplay'
                  ? 'bg-ow-orange text-white'
                  : 'bg-ow-darker text-ow-text-secondary hover:bg-ow-card-hover'
              }`}
            >
              {t('Quick Play')}
            </button>
          </div>

          <button
            onClick={handleStartSession}
            disabled={!currentStats?.general}
            className="bg-ow-orange hover:bg-ow-orange-light disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            {t('Start Session')}
          </button>
        </div>
      )}

      {/* Session Active */}
      {session && (
        <div className="bg-ow-card border border-ow-orange/30 rounded-lg p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-ow-orange/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-ow-orange animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ow-orange">{t('Session Active')}</h2>
            <p className="text-ow-text-secondary text-sm mt-1">{t('Go play some games! Come back when you are done.')}</p>
            <p className="text-ow-text-muted text-xs mt-2">
              {t('Started')}: {getRelativeTime(session.startedAt)} ({session.gamemode})
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={handleEndSession}
              disabled={isEnding}
              className="bg-ow-orange hover:bg-ow-orange-light disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              {isEnding ? t('Calculating...') : t('End Session')}
            </button>
            <button
              onClick={handleCancel}
              className="bg-ow-darker hover:bg-ow-card-hover text-ow-text-secondary font-medium px-6 py-2.5 rounded-lg transition-colors border border-ow-border"
            >
              {t('Cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Session Result */}
      {sessionResult && (
        <div className="bg-ow-card border border-ow-border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-ow-text text-center">{t('Session Results')}</h2>

          {/* Games Overview */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-ow-darker rounded-lg p-3 text-center">
              <p className="text-xs text-ow-text-muted">{t('Games')}</p>
              <p className="text-2xl font-bold text-ow-text">{sessionResult.gamesPlayed}</p>
            </div>
            <div className="bg-ow-darker rounded-lg p-3 text-center">
              <p className="text-xs text-ow-text-muted">{t('Est. Wins')}</p>
              <p className="text-2xl font-bold text-green-400">{sessionResult.estimatedWins}</p>
            </div>
            <div className="bg-ow-darker rounded-lg p-3 text-center">
              <p className="text-xs text-ow-text-muted">{t('Est. Losses')}</p>
              <p className="text-2xl font-bold text-red-400">{sessionResult.estimatedLosses}</p>
            </div>
          </div>

          {/* Before/After Deltas */}
          <div className="space-y-2">
            {sessionResult.deltas.map((d) => (
              <div key={d.label} className="flex items-center justify-between py-2 px-3 bg-ow-darker rounded-lg">
                <span className="text-sm text-ow-text-secondary">{d.label}</span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-ow-text-muted">{d.format(d.before)}</span>
                  <span className="text-ow-text-muted">{'\u2192'}</span>
                  <span className="text-ow-text">{d.format(d.after)}</span>
                  <span className={`font-semibold ${d.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {d.isPositive ? '\u25B2' : '\u25BC'} {d.format(Math.abs(d.delta))}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setSessionResult(null)}
            className="w-full bg-ow-darker hover:bg-ow-card-hover text-ow-text-secondary font-medium py-2.5 rounded-lg transition-colors border border-ow-border"
          >
            {t('Done')}
          </button>
        </div>
      )}
    </div>
  );
}
