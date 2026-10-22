import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useSnapshots } from '../../hooks/useLocalStorage';
import { formatPercent, formatStat, getRelativeTime } from '../../utils/formatting';
import type { StatSnapshot } from '../../types/models';

type MetricKey = 'winrate' | 'kda' | 'elimsPer10' | 'deathsPer10' | 'damagePer10' | 'healingPer10';

const METRICS: { key: MetricKey; label: string; color: string; format: (v: number) => string }[] = [
  { key: 'winrate', label: 'Win Rate', color: '#f97316', format: (v) => formatPercent(v) },
  { key: 'kda', label: 'KDA', color: '#3b82f6', format: (v) => formatStat(v) },
  { key: 'elimsPer10', label: 'Elims/10', color: '#ef4444', format: (v) => formatStat(v) },
  { key: 'deathsPer10', label: 'Deaths/10', color: '#a855f7', format: (v) => formatStat(v) },
  { key: 'damagePer10', label: 'Dmg/10', color: '#f59e0b', format: (v) => formatStat(v, 0) },
  { key: 'healingPer10', label: 'Heal/10', color: '#22c55e', format: (v) => formatStat(v, 0) },
];

export default function ProgressTrackingPage() {
  const { playerId } = useParams<{ playerId: string }>();
  const { t } = useTranslation();
  const { getSnapshotsForPlayer } = useSnapshots();
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('winrate');

  const snapshots = useMemo(
    () => (playerId ? getSnapshotsForPlayer(playerId) : []),
    [playerId, getSnapshotsForPlayer]
  );

  const metric = METRICS.find((m) => m.key === selectedMetric)!;

  const chartData = useMemo(
    () =>
      [...snapshots]
        .reverse()
        .map((snap) => ({
          date: new Date(snap.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          value: snap[selectedMetric],
          raw: snap,
        })),
    [snapshots, selectedMetric]
  );

  const firstSnap = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const latestSnap = snapshots.length > 0 ? snapshots[0] : null;

  const getDelta = (first: StatSnapshot, latest: StatSnapshot, key: MetricKey): number => {
    return latest[key] - first[key];
  };

  return (
    <div className="py-6 space-y-6">
      <h1 className="text-2xl font-bold text-ow-text">{t('Progress Tracking')}</h1>

      {snapshots.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-ow-text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-ow-text-secondary">{t('No snapshots recorded yet')}</p>
          <p className="text-ow-text-muted text-sm mt-1">{t('Snapshots are saved when you view your profile')}</p>
        </div>
      ) : (
        <>
          {/* Metric Selector */}
          <div className="flex flex-wrap gap-2">
            {METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setSelectedMetric(m.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedMetric === m.key
                    ? 'text-white'
                    : 'bg-ow-card border border-ow-border text-ow-text-secondary hover:bg-ow-card-hover'
                }`}
                style={selectedMetric === m.key ? { backgroundColor: m.color } : undefined}
              >
                {t(m.label)}
              </button>
            ))}
          </div>

          {/* Line Chart */}
          <div className="bg-ow-card border border-ow-border rounded-lg p-4">
            <h2 className="text-lg font-semibold text-ow-text mb-4">{t(metric.label)} {t('Over Time')}</h2>
            {chartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#1f2937' }} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#1f2937' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }}
                    labelStyle={{ color: '#9ca3af' }}
                    formatter={(value) => [metric.format(Number(value)), t(metric.label)]}
                  />
                  <Line type="monotone" dataKey="value" stroke={metric.color} strokeWidth={2} dot={{ r: 4, fill: metric.color }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-ow-text-muted py-8 text-sm">{t('Need at least 2 snapshots for chart')}</p>
            )}
          </div>

          {/* Progress Comparison Card */}
          {firstSnap && latestSnap && firstSnap.id !== latestSnap.id && (
            <div className="bg-ow-card border border-ow-border rounded-lg p-4">
              <h2 className="text-lg font-semibold text-ow-text mb-4">{t('Progress Summary')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {METRICS.map((m) => {
                  const delta = getDelta(firstSnap, latestSnap, m.key);
                  const isPositive = m.key === 'deathsPer10' ? delta <= 0 : delta >= 0;
                  return (
                    <div key={m.key} className="bg-ow-darker rounded-lg p-3 text-center">
                      <p className="text-xs text-ow-text-muted">{t(m.label)}</p>
                      <p className="text-sm text-ow-text-secondary mt-0.5">
                        {m.format(firstSnap[m.key])} {'\u2192'} {m.format(latestSnap[m.key])}
                      </p>
                      <p className={`text-sm font-semibold mt-0.5 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '\u25B2' : '\u25BC'} {m.format(Math.abs(delta))}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* History List */}
          <div className="bg-ow-card border border-ow-border rounded-lg p-4">
            <h2 className="text-lg font-semibold text-ow-text mb-3">{t('Snapshot History')}</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {snapshots.map((snap) => (
                <div key={snap.id} className="flex items-center justify-between py-2 px-3 bg-ow-darker rounded-lg">
                  <div>
                    <p className="text-sm text-ow-text">{new Date(snap.date).toLocaleDateString()}</p>
                    <p className="text-xs text-ow-text-muted">{getRelativeTime(snap.date)} - {snap.gamemode}</p>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-ow-orange">{formatPercent(snap.winrate)} WR</span>
                    <span className="text-ow-blue-light">{formatStat(snap.kda)} KDA</span>
                    <span className="text-ow-text-secondary">{snap.gamesPlayed} G</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
