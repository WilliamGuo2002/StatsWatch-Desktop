import { useTranslation } from 'react-i18next';
import type { PlayerSearchResult } from '../../types/models';
import { formatBattleTag } from '../../utils/formatting';

interface SearchResultsProps {
  results: PlayerSearchResult[];
  onSelect: (playerId: string) => void;
}

export default function SearchResults({ results, onSelect }: SearchResultsProps) {
  const { t } = useTranslation();

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-ow-text-muted">
        {t('No players found')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {results.map((player) => (
        <button
          key={player.player_id}
          onClick={() => onSelect(player.player_id)}
          className="w-full flex items-center gap-3 p-3 bg-ow-card hover:bg-ow-card-hover border border-ow-border rounded-lg transition-colors text-left"
        >
          {player.avatar ? (
            <img
              src={player.avatar}
              alt={player.name}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-ow-border flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-ow-text-muted" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="text-ow-text font-medium truncate">
              {formatBattleTag(player.player_id)}
            </div>
            {player.title && (
              <div className="text-ow-text-muted text-sm truncate">{player.title}</div>
            )}
          </div>

          <span
            className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
              player.is_public
                ? 'bg-green-500/20 text-green-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            {player.is_public ? t('Public') : t('Private')}
          </span>
        </button>
      ))}
    </div>
  );
}
