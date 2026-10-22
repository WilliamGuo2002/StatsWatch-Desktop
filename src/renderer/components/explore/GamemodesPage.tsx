import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getGamemodes } from '../../api/overwatchApi';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

export default function GamemodesPage() {
  const { t } = useTranslation();
  const { data: gamemodes, isLoading, error, refetch } = useQuery({
    queryKey: ['gamemodes'],
    queryFn: getGamemodes,
  });

  if (isLoading) return <LoadingSpinner text={t('Loading profile...')} />;
  if (error) return <ErrorMessage message="Failed to load game modes" onRetry={() => refetch()} />;

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-6">{t('Game Modes')}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {gamemodes?.map((mode) => (
          <div key={mode.key} className="bg-ow-card rounded-xl border border-ow-border overflow-hidden hover:border-ow-orange/30 transition-colors">
            <div className="relative h-40">
              <img
                src={mode.screenshot}
                alt={mode.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                {mode.icon && (
                  <img src={mode.icon} alt="" className="w-8 h-8" />
                )}
                <h3 className="text-lg font-bold">{mode.name}</h3>
              </div>
            </div>
            <div className="p-4">
              <p className="text-ow-text-secondary text-sm leading-relaxed">
                {mode.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
