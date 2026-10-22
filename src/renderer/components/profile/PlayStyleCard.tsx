import { useTranslation } from 'react-i18next';
import type { PlayStyle } from '../../utils/statsCalculations';
import { formatPercent } from '../../utils/formatting';

interface Props {
  style: PlayStyle;
  heroPortraitUrl?: string;
}

const TRAIT_COLORS: Record<string, string> = {
  'High Aggression': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Passive Playstyle': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  'Hard to Kill': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Risk Taker': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Frag Hunter': 'bg-red-500/20 text-red-400 border-red-500/30',
  'DPS Monster': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'One-Trick Specialist': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'High Impact': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const DEFAULT_TRAIT = 'bg-ow-border text-ow-text-secondary border-ow-border';

export default function PlayStyleCard({ style, heroPortraitUrl }: Props) {
  const { t } = useTranslation();

  return (
    <div className="bg-ow-card border border-ow-border rounded-xl p-4 space-y-3">
      {/* Title */}
      <div>
        <h3 className="text-base font-bold text-ow-text">{style.type}</h3>
        <p className="text-xs text-ow-text-secondary">{style.subtitle}</p>
      </div>

      {/* Traits */}
      {style.traits.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {style.traits.map(trait => (
            <span
              key={trait}
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                TRAIT_COLORS[trait] || DEFAULT_TRAIT
              }`}
            >
              {t(trait)}
            </span>
          ))}
        </div>
      )}

      {/* Insights */}
      {style.insights.length > 0 && (
        <div className="space-y-1.5">
          {style.insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2">
              <svg
                className="w-4 h-4 text-ow-gold flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 002 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM4 11a1 1 0 100-2H3a1 1 0 000 2h1zM10 18a1 1 0 001-1v-1a1 1 0 10-2 0v1a1 1 0 001 1zM7 10a3 3 0 116 0 3 3 0 01-6 0z" />
              </svg>
              <p className="text-xs text-ow-text-secondary">{insight}</p>
            </div>
          ))}
        </div>
      )}

      {/* Signature hero */}
      {style.signatureHero && (
        <div className="flex items-center gap-3 bg-ow-darker rounded-lg p-2.5 border border-ow-border">
          {heroPortraitUrl ? (
            <img
              src={heroPortraitUrl}
              alt={style.signatureHero.key}
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-ow-card-hover flex items-center justify-center">
              <span className="text-ow-text-muted text-lg">?</span>
            </div>
          )}
          <div>
            <p className="text-xs text-ow-text-muted">{t('Signature Hero')}</p>
            <p className="text-sm font-semibold text-ow-text capitalize">
              {style.signatureHero.key.replace(/-/g, ' ')}
            </p>
            <p className="text-[10px] text-ow-orange">
              {formatPercent(style.signatureHero.winrate)} {t('WR')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
