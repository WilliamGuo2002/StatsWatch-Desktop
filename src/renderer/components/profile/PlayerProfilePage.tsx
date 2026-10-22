import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import type { GameMode } from '../../types/models';
import {
  getPlayerSummary,
  getPlayerStatsSummary,
  getPlayerCareerStats,
  getHeroes,
  getHeroGlobalStats,
} from '../../api/overwatchApi';
import {
  useFavorites,
  useSearchHistory,
  useSnapshots,
} from '../../hooks/useLocalStorage';
import {
  getRadarData,
  getRadarMedianData,
  RADAR_LABELS,
  calculateHeroTiers,
  classifyPlayStyle,
  getTopHeroes,
  getAllHeroesSorted,
} from '../../utils/statsCalculations';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import PlayerHeader from './PlayerHeader';
import CompetitiveRanks from './CompetitiveRanks';
import GameModeToggle from './GameModeToggle';
import StatsOverview from './StatsOverview';
import RoleStats from './RoleStats';
import RadarChart from './RadarChart';
import PlayStyleCard from './PlayStyleCard';
import TopHeroes from './TopHeroes';
import HeroTierList from './HeroTierList';
import SmartCoach from './SmartCoach';
import ShareCard from './ShareCard';
import RoleSelector from './RoleSelector';

export default function PlayerProfilePage() {
  const { playerId } = useParams<{ playerId: string }>();
  const { t } = useTranslation();
  const [gamemode, setGamemode] = useState<GameMode>('competitive');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { addToHistory } = useSearchHistory();
  const { addSnapshot } = useSnapshots();

  // --- Queries ---
  const summaryQuery = useQuery({
    queryKey: ['playerSummary', playerId],
    queryFn: () => getPlayerSummary(playerId!),
    enabled: !!playerId,
  });

  const statsQuery = useQuery({
    queryKey: ['playerStats', playerId, gamemode],
    queryFn: () => getPlayerStatsSummary(playerId!, gamemode),
    enabled: !!playerId,
  });

  // Career stats pre-fetched for sub-pages
  useQuery({
    queryKey: ['playerCareer', playerId, gamemode],
    queryFn: () => getPlayerCareerStats(playerId!, gamemode),
    enabled: !!playerId,
  });

  const heroesQuery = useQuery({
    queryKey: ['heroes'],
    queryFn: getHeroes,
    staleTime: 1000 * 60 * 60,
  });

  // Global stats pre-fetched for sub-pages
  useQuery({
    queryKey: ['heroGlobalStats'],
    queryFn: () => getHeroGlobalStats('pc', 'competitive'),
    staleTime: 1000 * 60 * 30,
  });

  // --- Side effects on load ---
  const summary = summaryQuery.data;
  const statsData = statsQuery.data;

  useEffect(() => {
    if (summary && playerId) {
      addToHistory({
        playerId,
        name: summary.username,
        avatar: summary.avatar,
      });
    }
  }, [summary, playerId, addToHistory]);

  useEffect(() => {
    if (statsData?.general && playerId) {
      const g = statsData.general;
      addSnapshot({
        playerId,
        date: new Date().toISOString(),
        gamemode,
        winrate: g.winrate,
        kda: g.kda,
        gamesPlayed: g.games_played,
        elimsPer10: g.average.eliminations,
        deathsPer10: g.average.deaths,
        damagePer10: g.average.damage,
        healingPer10: g.average.healing,
        assistsPer10: g.average.assists,
      });
    }
  }, [statsData, playerId, gamemode, addSnapshot]);

  // --- Derived data ---
  const heroInfoList = heroesQuery.data || [];
  const heroes = statsData?.heroes || {};
  const roles = statsData?.roles || {};

  const topHeroes = useMemo(() => getTopHeroes(heroes, 3), [heroes]);
  const allHeroes = useMemo(() => getAllHeroesSorted(heroes), [heroes]);
  const tiers = useMemo(() => calculateHeroTiers(heroes), [heroes]);
  const playStyle = useMemo(
    () => classifyPlayStyle(statsData || {}, heroes, selectedRole),
    [statsData, heroes, selectedRole]
  );
  const radarData = useMemo(() => getRadarData(statsData || {}, selectedRole), [statsData, selectedRole]);
  const radarMedian = useMemo(() => getRadarMedianData(selectedRole), [selectedRole]);

  const signaturePortrait = useMemo(() => {
    if (!playStyle.signatureHero) return undefined;
    const hero = heroInfoList.find(h => h.key === playStyle.signatureHero!.key);
    return hero?.portrait;
  }, [playStyle.signatureHero, heroInfoList]);

  // --- Favorite toggle ---
  const favorited = playerId ? isFavorite(playerId) : false;

  const handleFavoriteToggle = () => {
    if (!playerId || !summary) return;
    if (favorited) {
      removeFavorite(playerId);
    } else {
      addFavorite({
        playerId,
        name: summary.username,
        avatar: summary.avatar,
      });
    }
  };

  // --- Loading / Error ---
  const isLoading = summaryQuery.isLoading || statsQuery.isLoading;
  const error = summaryQuery.error || statsQuery.error;

  if (isLoading) {
    return <LoadingSpinner text={t('Loading profile...')} />;
  }

  if (error || !summary || !statsData) {
    return (
      <ErrorMessage
        message={(error as Error)?.message || t('Failed to load profile')}
        onRetry={() => {
          summaryQuery.refetch();
          statsQuery.refetch();
        }}
      />
    );
  }

  // --- Nav links ---
  // iOS gives each of these an icon and a colour. It also routes Hero
  // Comparison to hero-comparison: `/compare` matched no route at all, so
  // this button navigated to a blank screen.
  const navLinks = [
    { to: `/player/${playerId}/hero-comparison`, label: t('Hero Comparison'), color: 'text-ow-blue', d: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    { to: `/player/${playerId}/career`, label: t('Full Career Stats'), color: 'text-purple-400', d: 'M4 6h16M4 12h16M4 18h7' },
    { to: '/meta', label: t('Hero Meta'), color: 'text-ow-orange', d: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { to: `/player/${playerId}/session`, label: t('Session Tracker'), color: 'text-ow-dps', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { to: `/player/${playerId}/progress`, label: t('Progress Tracking'), color: 'text-ow-support', d: 'M3 17l6-6 4 4 8-8m0 0h-5m5 0v5' },
    { to: '/heroes', label: t('Hero Encyclopedia'), color: 'text-cyan-400', d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 pb-8">
      {/* Toolbar */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {/* Favorite toggle */}
          <button
            onClick={handleFavoriteToggle}
            className="p-2 rounded-lg hover:bg-ow-card-hover transition-colors"
            title={favorited ? t('Remove from favorites') : t('Add to favorites')}
          >
            <svg
              className={`w-5 h-5 ${favorited ? 'text-ow-gold fill-ow-gold' : 'text-ow-text-muted'}`}
              fill={favorited ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>

          {/* Share card */}
          <ShareCard
            summary={summary}
            stats={statsData}
            topHeroes={topHeroes}
            heroInfoList={heroInfoList}
            gamemode={gamemode}
          />
        </div>
      </div>

      {/* Identity and ranks run the full width. */}
      <PlayerHeader summary={summary} />
      <CompetitiveRanks ranks={summary.competitive?.pc} />

      {/* The two controls that scope everything below them. */}
      <div className="flex flex-wrap items-center gap-3">
        <GameModeToggle mode={gamemode} onChange={setGamemode} />
        <RoleSelector selectedRole={selectedRole} onChange={setSelectedRole} />
      </div>

      {/* Columns on a desktop window, instead of one phone-width column
          with several hundred pixels of empty margin either side. */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-4">
          <StatsOverview stats={statsData} selectedRole={selectedRole} />
          {Object.keys(roles).length > 0 && <RoleStats roles={roles} />}
        </div>

        <div className="space-y-4">
          <RadarChart
            data={radarData}
            medianData={radarMedian}
            labels={RADAR_LABELS}
            title={t('Performance Radar')}
            accentColor={
              selectedRole === 'tank' ? '#3b82f6' :
              selectedRole === 'damage' ? '#ef4444' :
              selectedRole === 'support' ? '#22c55e' : '#f97316'
            }
          />
          <PlayStyleCard style={playStyle} heroPortraitUrl={signaturePortrait} />
        </div>

        <div className="space-y-4 lg:col-span-2 xl:col-span-1">
          {allHeroes.length > 0 && (
            <TopHeroes
              heroes={topHeroes}
              allHeroes={allHeroes}
              heroInfoList={heroInfoList}
              playerId={playerId!}
            />
          )}
          {/* iOS gates the tier list on at least 3 heroes; below that an
              S/A/B/C/D split says nothing. */}
          {allHeroes.length >= 3 && <HeroTierList tiers={tiers} heroInfoList={heroInfoList} />}
        </div>
      </div>

      <SmartCoach stats={statsData} heroes={heroes} selectedRole={selectedRole} />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {navLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center gap-2.5 rounded-xl border border-ow-border bg-ow-card px-3.5 py-3 text-[13px] font-medium text-ow-text transition-colors hover:border-ow-orange/30 hover:bg-ow-card-hover"
          >
            <svg className={`h-4 w-4 shrink-0 ${link.color}`} fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={link.d} />
            </svg>
            <span className="min-w-0 flex-1 truncate">{link.label}</span>
            <svg className="h-3 w-3 shrink-0 text-ow-text-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
