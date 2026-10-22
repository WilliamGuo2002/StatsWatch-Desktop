import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { FavoritePlayer } from '../../types/models';
import { formatBattleTag } from '../../utils/formatting';

interface FavoritesSectionProps {
  favorites: FavoritePlayer[];
  onRemove: (id: string) => void;
}

export default function FavoritesSection({ favorites, onRemove }: FavoritesSectionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (favorites.length === 0) return null;

  return (
    <div>
      <h3 className="text-ow-text-secondary text-sm font-medium mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-ow-orange" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        {t('Favorites')}
      </h3>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {favorites.map((player) => (
          <button
            key={player.playerId}
            onClick={() => navigate(`/player/${player.playerId}`)}
            className="flex-shrink-0 flex flex-col items-center gap-2 p-3 bg-ow-card hover:bg-ow-card-hover border border-ow-border rounded-lg transition-colors w-28 group relative"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(player.playerId);
              }}
              className="absolute top-1 right-1 text-ow-text-muted hover:text-ow-orange opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
              aria-label={t('Remove from favorites')}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>

            {player.avatar ? (
              <img
                src={player.avatar}
                alt={player.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-ow-border flex items-center justify-center">
                <svg className="w-6 h-6 text-ow-text-muted" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}

            <span className="text-xs text-ow-text-secondary group-hover:text-ow-text truncate w-full text-center transition-colors">
              {formatBattleTag(player.playerId)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
