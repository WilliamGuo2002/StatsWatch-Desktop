import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onSearch: () => void;
  isLoading: boolean;
}

export default function SearchBar({ value, onChange, onSearch, isLoading }: SearchBarProps) {
  const { t } = useTranslation();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      onSearch();
    }
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('BattleTag or Name (e.g. Player#1234)')}
          className="w-full bg-ow-card border border-ow-border rounded-lg px-4 py-3 text-ow-text placeholder-ow-text-muted focus:outline-none focus:border-ow-orange focus:ring-1 focus:ring-ow-orange transition-colors"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ow-text-muted hover:text-ow-text transition-colors"
            aria-label={t('Clear')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <button
        onClick={onSearch}
        disabled={isLoading || !value.trim()}
        className="bg-ow-orange hover:bg-ow-orange-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
      >
        {isLoading ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
        <span className="hidden sm:inline">{t('Search')}</span>
      </button>
    </div>
  );
}
