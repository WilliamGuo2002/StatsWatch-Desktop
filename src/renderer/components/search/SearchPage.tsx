import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { searchPlayers, getPlayerSummary, ApiError } from '../../api/overwatchApi';
import { battleTagToPlayerId } from '../../utils/formatting';
import { useFavorites, useSearchHistory } from '../../hooks/useLocalStorage';
import type { PlayerSearchResult } from '../../types/models';
import SearchBar from './SearchBar';
import SearchResults from './SearchResults';
import QuickLinks from './QuickLinks';
import FavoritesSection from './FavoritesSection';
import HistorySection from './HistorySection';

export default function SearchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { favorites, removeFavorite } = useFavorites();
  const { history, addToHistory, clearHistory } = useSearchHistory();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);
    setResults([]);
    setHasSearched(true);

    try {
      // If input contains "#", try direct lookup
      if (trimmed.includes('#')) {
        const playerId = battleTagToPlayerId(trimmed);
        try {
          const summary = await getPlayerSummary(playerId);
          addToHistory({
            playerId,
            name: summary.username,
            avatar: summary.avatar ?? null,
          });
          navigate(`/player/${playerId}`);
          return;
        } catch (err) {
          // If direct lookup fails, fall through to search
          if (err instanceof ApiError && err.status === 404) {
            // Player not found via direct lookup, try search
          } else {
            throw err;
          }
        }
      }

      // Search by name
      const response = await searchPlayers(trimmed);
      setResults(response.results);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t('An unexpected error occurred'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlayer = (playerId: string) => {
    const player = results.find((r) => r.player_id === playerId);
    if (player) {
      addToHistory({
        playerId: player.player_id,
        name: player.name,
        avatar: player.avatar ?? null,
      });
    }
    navigate(`/player/${playerId}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-ow-text mb-2">{t('StatsWatch')}</h1>
        <p className="text-ow-text-secondary">
          {t('Track your Overwatch 2 stats and compare with others')}
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Search Results */}
      {hasSearched && !isLoading && !error && (
        <div className="mb-8">
          <SearchResults results={results} onSelect={handleSelectPlayer} />
        </div>
      )}

      {/* Quick Links */}
      {!hasSearched && (
        <div className="space-y-8">
          <div>
            <h3 className="text-ow-text-secondary text-sm font-medium mb-3">
              {t('Quick Links')}
            </h3>
            <QuickLinks />
          </div>

          {/* Favorites */}
          <FavoritesSection favorites={favorites} onRemove={removeFavorite} />

          {/* History */}
          <HistorySection history={history} onClear={clearHistory} />

          {/* Tips */}
          <div className="bg-ow-card border border-ow-border rounded-lg p-4">
            <h3 className="text-ow-text-secondary text-sm font-medium mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('Tips')}
            </h3>
            <ul className="text-xs text-ow-text-muted space-y-1.5">
              <li>{t('Enter the full BattleTag (Name#1234) for direct lookup')}</li>
              <li>{t('BattleTag is case-sensitive')}</li>
              <li>{t('Search by name to browse matching players')}</li>
              <li>{t('Player profiles must be set to public in Overwatch 2 settings')}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
