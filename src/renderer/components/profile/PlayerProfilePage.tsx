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
  const navLinks = [
    { to: `/player/${playerId}/compare`, label: t('Hero Comparison') },
    { to: `/player/${playerId}/career`, label: t('Full Career Stats') },
    { to: '/meta', label: t('Hero Meta') },
    { to: `/player/${playerId}/session`, label: t('Session Tracker') },
    { to: `/player/${playerId}/progress`, label: t('Progress Tracking') },
    { to: '/heroes', label: t('Hero Encyclopedia') },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 pb-8 space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between pt-2">
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

      {/* 1. Player Header */}
      <PlayerHeader summary={summary} />

      {/* 2. Competitive Ranks */}
      <CompetitiveRanks ranks={summary.competitive?.pc} />

      {/* 3. Game Mode Toggle */}
      <GameModeToggle mode={gamemode} onChange={setGamemode} />

      {/* 4. Stats Overview */}
      <StatsOverview stats={statsData} selectedRole={selectedRole} />

      {/* 5. Role Stats */}
      {Object.keys(roles).length > 0 && <RoleStats roles={roles} />}

      {/* 6. Role Selector + Radar Chart */}
      <RoleSelector selectedRole={selectedRole} onChange={setSelectedRole} />
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

      {/* 7. Play Style Card */}
      <PlayStyleCard style={playStyle} heroPortraitUrl={signaturePortrait} />

      {/* 8. Top Heroes */}
      {allHeroes.length > 0 && (
        <TopHeroes
          heroes={topHeroes}
          allHeroes={allHeroes}
          heroInfoList={heroInfoList}
          playerId={playerId!}
        />
      )}

      {/* 9. Hero Tier List */}
      <HeroTierList tiers={tiers} heroInfoList={heroInfoList} />

      {/* 10. Smart Coach */}
      <SmartCoach stats={statsData} heroes={heroes} selectedRole={selectedRole} />

      {/* 11. Navigation Links */}
      <div className="grid grid-cols-2 gap-2">
        {navLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className="bg-ow-card border border-ow-border rounded-xl px-4 py-3 text-sm text-ow-text hover:bg-ow-card-hover hover:border-ow-orange/30 transition-colors text-center"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
