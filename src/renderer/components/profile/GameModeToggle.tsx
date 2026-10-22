import { useTranslation } from 'react-i18next';
import type { GameMode } from '../../types/models';

interface Props {
  mode: GameMode;
  onChange: (mode: GameMode) => void;
}

export default function GameModeToggle({ mode, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex bg-ow-card border border-ow-border rounded-xl overflow-hidden">
      <button
        onClick={() => onChange('quickplay')}
        className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
          mode === 'quickplay'
            ? 'bg-ow-blue text-white'
            : 'text-ow-text-secondary hover:text-ow-text hover:bg-ow-card-hover'
        }`}
      >
        {t('Quick Play')}
      </button>
      <button
        onClick={() => onChange('competitive')}
        className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
          mode === 'competitive'
            ? 'bg-ow-orange text-white'
            : 'text-ow-text-secondary hover:text-ow-text hover:bg-ow-card-hover'
        }`}
      >
        {t('Competitive')}
      </button>
    </div>
  );
}
