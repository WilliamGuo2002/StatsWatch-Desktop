import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getMaps, getGamemodes } from '../../api/overwatchApi';
import type { MapInfo, GamemodeInfo } from '../../types/models';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

function MapCard({ map, onClick }: { map: MapInfo; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-ow-card border border-ow-border rounded-lg overflow-hidden text-left hover:bg-ow-card-hover hover:scale-[1.01] transition-all group"
    >
      <div className="relative overflow-hidden">
        <img
          src={map.screenshot}
          alt={map.name}
          className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3">
          <h3 className="text-sm font-bold text-white">{map.name}</h3>
          <div className="flex items-center gap-1 mt-0.5">
            {map.country_code && (
              <img
                src={`https://flagcdn.com/16x12/${map.country_code.toLowerCase()}.png`}
                alt=""
                className="w-4 h-3"
              />
            )}
            <span className="text-xs text-gray-300">{map.location}</span>
          </div>
        </div>
      </div>
      <div className="p-2 flex flex-wrap gap-1">
        {map.gamemodes.map((gm) => (
          <span key={gm} className="px-2 py-0.5 bg-ow-darker rounded text-[10px] text-ow-text-muted capitalize">
            {gm.replace(/-/g, ' ')}
          </span>
        ))}
      </div>
    </button>
  );
}

function MapDetailModal({
  map,
  onClose,
  gamemodeInfoList,
}: {
  map: MapInfo;
  onClose: () => void;
  gamemodeInfoList: GamemodeInfo[];
}) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div
        className="bg-ow-card border border-ow-border rounded-xl max-w-lg w-full overflow-hidden max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <img src={map.screenshot} alt={map.name} className="w-full h-52 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute bottom-4 left-4">
            <h2 className="text-xl font-bold text-white">{map.name}</h2>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            {map.country_code && (
              <img
                src={`https://flagcdn.com/24x18/${map.country_code.toLowerCase()}.png`}
                alt=""
                className="w-6 h-4"
              />
            )}
            <span className="text-ow-text-secondary">{map.location}</span>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ow-text mb-2">{t('Game Modes')}</h3>
            <div className="space-y-3">
              {map.gamemodes.map((gmKey) => {
                const gmInfo = gamemodeInfoList.find((g) => g.key === gmKey);
                return (
                  <div key={gmKey} className="bg-ow-darker rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {gmInfo?.icon && (
                        <img src={gmInfo.icon} alt="" className="w-5 h-5" />
                      )}
                      <span className="text-sm font-medium text-ow-text capitalize">
                        {gmInfo?.name || gmKey.replace(/-/g, ' ')}
                      </span>
                    </div>
                    {gmInfo?.description && (
                      <p className="text-xs text-ow-text-muted leading-relaxed">
                        {gmInfo.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MapGalleryPage() {
  const { t } = useTranslation();
  const [gamemodeFilter, setGamemodeFilter] = useState<string>('all');
  const [selectedMap, setSelectedMap] = useState<MapInfo | null>(null);

  const { data: maps, isLoading, error, refetch } = useQuery({
    queryKey: ['maps'],
    queryFn: getMaps,
  });

  const { data: gamemodeInfoList = [] } = useQuery({
    queryKey: ['gamemodes'],
    queryFn: getGamemodes,
    staleTime: 1000 * 60 * 60,
  });

  if (isLoading) return <LoadingSpinner text={t('Loading maps...')} />;
  if (error) return <ErrorMessage message={(error as Error).message} onRetry={() => refetch()} />;

  const allGamemodes = Array.from(new Set((maps || []).flatMap((m) => m.gamemodes))).sort();

  const filtered = (maps || []).filter(
    (m) => gamemodeFilter === 'all' || m.gamemodes.includes(gamemodeFilter)
  );

  return (
    <div className="py-6 space-y-6">
      <h1 className="text-2xl font-bold text-ow-text">{t('Map Gallery')}</h1>

      {/* Gamemode Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setGamemodeFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
            gamemodeFilter === 'all'
              ? 'bg-ow-orange text-white'
              : 'bg-ow-card border border-ow-border text-ow-text-secondary hover:bg-ow-card-hover'
          }`}
        >
          {t('All')}
        </button>
        {allGamemodes.map((gm) => (
          <button
            key={gm}
            onClick={() => setGamemodeFilter(gm)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors capitalize shrink-0 ${
              gamemodeFilter === gm
                ? 'bg-ow-orange text-white'
                : 'bg-ow-card border border-ow-border text-ow-text-secondary hover:bg-ow-card-hover'
            }`}
          >
            {gm.replace(/-/g, ' ')}
          </button>
        ))}
      </div>

      {/* Map Count */}
      <p className="text-sm text-ow-text-muted">{filtered.length} {t('maps')}</p>

      {/* Map Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((map) => (
          <MapCard key={map.key} map={map} onClick={() => setSelectedMap(map)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-ow-text-muted">
          <p>{t('No maps found')}</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedMap && (
        <MapDetailModal
          map={selectedMap}
          onClose={() => setSelectedMap(null)}
          gamemodeInfoList={gamemodeInfoList}
        />
      )}
    </div>
  );
}
