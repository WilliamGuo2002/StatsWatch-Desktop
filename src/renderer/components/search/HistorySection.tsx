import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { SearchHistoryItem } from '../../types/models';
import { formatBattleTag, getRelativeTime } from '../../utils/formatting';

interface HistorySectionProps {
  history: SearchHistoryItem[];
  onClear: () => void;
}

export default function HistorySection({ history, onClear }: HistorySectionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (history.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-ow-text-secondary text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('Recent Searches')}
        </h3>
        <button
          onClick={onClear}
          className="text-xs text-ow-text-muted hover:text-ow-orange transition-colors"
        >
          {t('Clear')}
        </button>
      </div>

      <div className="space-y-1.5">
        {history.map((item) => (
          <button
            key={item.playerId + item.searchedAt}
            onClick={() => navigate(`/player/${item.playerId}`)}
            className="w-full flex items-center gap-3 p-2.5 hover:bg-ow-card-hover rounded-lg transition-colors text-left"
          >
            {item.avatar ? (
              <img
                src={item.avatar}
                alt={item.name}
                className="w-8 h-8 rounded-md object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-md bg-ow-border flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-ow-text-muted" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <span className="text-sm text-ow-text truncate block">
                {formatBattleTag(item.playerId)}
              </span>
            </div>

            <span className="text-xs text-ow-text-muted flex-shrink-0">
              {getRelativeTime(item.searchedAt)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
