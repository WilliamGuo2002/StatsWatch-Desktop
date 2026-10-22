import { useTranslation } from 'react-i18next';

interface Props {
  data: number[];
  medianData: number[];
  labels: string[];
  title?: string;
  secondData?: number[];
  secondLabel?: string;
  accentColor?: string;
}

const cx = 140;
const cy = 140;
const r = 110;
const LEVELS = 5;

function angle(i: number): number {
  return (Math.PI * 2 * i) / 5 - Math.PI / 2;
}

function vertex(i: number, scale: number): { x: number; y: number } {
  return {
    x: cx + r * scale * Math.cos(angle(i)),
    y: cy + r * scale * Math.sin(angle(i)),
  };
}

function polygonPoints(values: number[]): string {
  return values
    .map((v, i) => {
      const pt = vertex(i, v);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');
}

export default function RadarChart({
  data,
  medianData,
  labels,
  title,
  secondData,
  secondLabel,
  accentColor = '#f97316',
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="bg-ow-card border border-ow-border rounded-xl p-4">
      {title && (
        <h3 className="text-sm font-semibold text-ow-text mb-3">{title}</h3>
      )}

      <svg viewBox="0 0 280 280" className="w-full max-w-[280px] mx-auto">
        <defs>
          <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="radarGradientBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Grid polygons */}
        {Array.from({ length: LEVELS }, (_, level) => {
          const scale = (level + 1) / LEVELS;
          const pts = Array.from({ length: 5 }, (__, i) => vertex(i, scale));
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
          return (
            <path
              key={level}
              d={d}
              fill="none"
              stroke="#1f2937"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis lines */}
        {Array.from({ length: 5 }, (_, i) => {
          const pt = vertex(i, 1);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={pt.x}
              y2={pt.y}
              stroke="#1f2937"
              strokeWidth="1"
            />
          );
        })}

        {/* Median reference polygon */}
        <polygon
          points={polygonPoints(medianData)}
          fill="none"
          stroke="#6b7280"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity="0.7"
        />

        {/* Optional second data polygon */}
        {secondData && (
          <polygon
            points={polygonPoints(secondData)}
            fill="url(#radarGradientBlue)"
            stroke="#3b82f6"
            strokeWidth="2"
            opacity="0.8"
          />
        )}

        {/* Main data polygon */}
        <polygon
          points={polygonPoints(data)}
          fill="url(#radarGradient)"
          stroke={accentColor}
          strokeWidth="2"
        />

        {/* Data points */}
        {data.map((v, i) => {
          const pt = vertex(i, v);
          return (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r="3"
              fill={accentColor}
              stroke="#0a0e1a"
              strokeWidth="1"
            />
          );
        })}

        {/* Labels */}
        {labels.map((label, i) => {
          const pt = vertex(i, 1.18);
          return (
            <text
              key={i}
              x={pt.x}
              y={pt.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-ow-text-secondary text-[10px]"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 rounded" style={{ backgroundColor: accentColor }} />
          <span className="text-[10px] text-ow-text-secondary">{t('You')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 rounded bg-gray-500 border-dashed" />
          <span className="text-[10px] text-ow-text-secondary">{t('Median')}</span>
        </div>
        {secondData && secondLabel && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 rounded bg-ow-blue" />
            <span className="text-[10px] text-ow-text-secondary">{secondLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
