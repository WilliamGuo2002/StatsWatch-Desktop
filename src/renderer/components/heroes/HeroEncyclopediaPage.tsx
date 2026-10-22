import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getHeroes, getHeroDetail, getHeroGlobalStats } from '../../api/overwatchApi';
import type { HeroInfo, HeroAbility } from '../../types/models';
import { ROLE_COLORS } from '../../utils/constants';
import { formatPercent } from '../../utils/formatting';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const ROLE_FILTERS = ['all', 'tank', 'damage', 'support'] as const;

function RoleIcon({ role }: { role: string }) {
  const color = ROLE_COLORS[role] || '#9ca3af';
  const icons: Record<string, string> = {
    tank: 'M12 2L3 7v6c0 5.25 3.75 10.07 9 12 5.25-1.93 9-6.75 9-12V7l-9-5z',
    damage: 'M12 2L2 12l10 10 10-10L12 2z',
    support: 'M12 2v8H4v4h8v8h4v-8h8v-4h-8V2h-4z',
  };
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill={color}>
      <path d={icons[role] || icons.damage} />
    </svg>
  );
}

function HeroCard({ hero, isSelected, onClick }: { hero: HeroInfo; isSelected: boolean; onClick: () => void }) {
  const roleColor = ROLE_COLORS[hero.role] || '#9ca3af';
  return (
    <button
      onClick={onClick}
      className={`bg-ow-card border rounded-lg overflow-hidden text-left transition-all hover:bg-ow-card-hover hover:scale-[1.02] ${
        isSelected ? 'border-ow-orange ring-1 ring-ow-orange' : 'border-ow-border'
      }`}
    >
      <div className="relative">
        <img src={hero.portrait} alt={hero.name} className="w-full h-32 object-cover object-top" />
        <div className="absolute top-2 right-2">
          <RoleIcon role={hero.role} />
        </div>
      </div>
      <div className="p-2">
        <p className="text-sm font-semibold text-ow-text truncate">{hero.name}</p>
        <p className="text-xs capitalize" style={{ color: roleColor }}>{hero.role}</p>
      </div>
    </button>
  );
}

function HitpointBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  if (value <= 0) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ow-text-muted w-16">{label}</span>
      <div className="flex-1 h-3 bg-ow-darker rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-ow-text-secondary w-8 text-right">{value}</span>
    </div>
  );
}

function AbilityRow({ ability }: { ability: HeroAbility }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b border-ow-border last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 py-3 px-2 hover:bg-ow-card-hover transition-colors text-left"
      >
        <img src={ability.icon} alt={ability.name} className="w-8 h-8 rounded" />
        <span className="text-sm font-medium text-ow-text flex-1">{ability.name}</span>
        <svg className={`w-4 h-4 text-ow-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="px-2 pb-3 pl-13">
          <p className="text-sm text-ow-text-secondary leading-relaxed ml-11">{ability.description}</p>
        </div>
      )}
    </div>
  );
}

function HeroDetailPanel({ heroKey }: { heroKey: string }) {
  const { t } = useTranslation();

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['heroDetail', heroKey],
    queryFn: () => getHeroDetail(heroKey),
    enabled: !!heroKey,
  });

  const { data: globalStats } = useQuery({
    queryKey: ['heroGlobalStats'],
    queryFn: () => getHeroGlobalStats('pc', 'competitive'),
  });

  if (detailLoading) return <LoadingSpinner text={t('Loading hero details...')} />;
  if (!detail) return null;

  const heroGlobal = globalStats?.find((g) => g.hero === heroKey);
  const roleColor = ROLE_COLORS[detail.role] || '#9ca3af';
  const totalHp = detail.hitpoints?.total || 0;

  return (
    <div className="bg-ow-card border border-ow-border rounded-lg p-5 space-y-5">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-ow-text">{detail.name}</h2>
        <p className="text-ow-text-secondary text-sm mt-1">{detail.description}</p>
      </div>

      {/* Info Chips */}
      <div className="flex flex-wrap justify-center gap-2">
        <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${roleColor}20`, color: roleColor }}>
          {detail.role.charAt(0).toUpperCase() + detail.role.slice(1)}
        </span>
        {detail.location && (
          <span className="px-3 py-1 rounded-full text-xs bg-ow-border text-ow-text-secondary">
            {detail.location}
          </span>
        )}
        {detail.age && (
          <span className="px-3 py-1 rounded-full text-xs bg-ow-border text-ow-text-secondary">
            {t('Age')}: {detail.age}
          </span>
        )}
      </div>

      {/* Hitpoints */}
      {detail.hitpoints && totalHp > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-ow-text mb-2">{t('Hitpoints')} ({totalHp})</h3>
          <div className="space-y-1.5">
            <HitpointBar value={detail.hitpoints.health} max={totalHp} color="#22c55e" label={t('Health')} />
            <HitpointBar value={detail.hitpoints.armor} max={totalHp} color="#f97316" label={t('Armor')} />
            <HitpointBar value={detail.hitpoints.shields} max={totalHp} color="#06b6d4" label={t('Shields')} />
          </div>
        </div>
      )}

      {/* Global Stats */}
      {heroGlobal && (
        <div className="flex justify-center gap-4">
          <div className="bg-ow-darker rounded-lg px-4 py-2 text-center">
            <p className="text-xs text-ow-text-muted">{t('Win Rate')}</p>
            <p className="text-lg font-bold text-ow-orange">{formatPercent(heroGlobal.winrate)}</p>
          </div>
          <div className="bg-ow-darker rounded-lg px-4 py-2 text-center">
            <p className="text-xs text-ow-text-muted">{t('Pick Rate')}</p>
            <p className="text-lg font-bold text-ow-blue-light">{formatPercent(heroGlobal.pickrate)}</p>
          </div>
        </div>
      )}

      {/* Abilities */}
      {detail.abilities.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-ow-text mb-2">{t('Abilities')}</h3>
          <div className="bg-ow-darker rounded-lg overflow-hidden">
            {detail.abilities.map((ability) => (
              <AbilityRow key={ability.name} ability={ability} />
            ))}
          </div>
        </div>
      )}

      {/* Backstory */}
      {detail.story?.summary && (
        <div>
          <h3 className="text-sm font-semibold text-ow-text mb-2">{t('Backstory')}</h3>
          <p className="text-sm text-ow-text-secondary leading-relaxed">{detail.story.summary}</p>
        </div>
      )}
    </div>
  );
}

export default function HeroEncyclopediaPage() {
  const { heroKey } = useParams<{ heroKey?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const { data: heroes, isLoading, error, refetch } = useQuery({
    queryKey: ['heroes'],
    queryFn: getHeroes,
  });

  if (isLoading) return <LoadingSpinner text={t('Loading heroes...')} />;
  if (error) return <ErrorMessage message={(error as Error).message} onRetry={() => refetch()} />;

  const filtered = (heroes || []).filter((hero) => {
    const matchesSearch = hero.name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || hero.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="py-6 space-y-6">
      <h1 className="text-2xl font-bold text-ow-text">{t('Hero Encyclopedia')}</h1>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ow-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('Search heroes...')}
          className="w-full bg-ow-card border border-ow-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-ow-text placeholder-ow-text-muted focus:outline-none focus:border-ow-orange"
        />
      </div>

      {/* Role Filters */}
      <div className="flex gap-2">
        {ROLE_FILTERS.map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              roleFilter === r
                ? 'bg-ow-orange text-white'
                : 'bg-ow-card border border-ow-border text-ow-text-secondary hover:bg-ow-card-hover'
            }`}
          >
            {r === 'all' ? t('All') : r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      <div className={heroKey ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}>
        {/* Hero Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {filtered.map((hero) => (
            <HeroCard
              key={hero.key}
              hero={hero}
              isSelected={hero.key === heroKey}
              onClick={() => navigate(hero.key === heroKey ? '/heroes' : `/heroes/${hero.key}`)}
            />
          ))}
        </div>

        {/* Detail Panel */}
        {heroKey && (
          <div className="mt-6 lg:mt-0">
            <HeroDetailPanel heroKey={heroKey} />
          </div>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-ow-text-muted">
          <p>{t('No heroes found')}</p>
        </div>
      )}
    </div>
  );
}
