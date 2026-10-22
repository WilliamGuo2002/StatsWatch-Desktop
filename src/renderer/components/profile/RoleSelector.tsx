import { useTranslation } from 'react-i18next';

interface Props {
  selectedRole: string | null;
  onChange: (role: string | null) => void;
}

const ROLES = [
  { key: null, label: 'All', color: '#f97316' },
  { key: 'tank', label: 'Tank', color: '#3b82f6' },
  { key: 'damage', label: 'DPS', color: '#ef4444' },
  { key: 'support', label: 'Support', color: '#22c55e' },
] as const;

export default function RoleSelector({ selectedRole, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2">
      {ROLES.map((role) => {
        const isSelected = selectedRole === role.key;
        return (
          <button
            key={role.label}
            onClick={() => onChange(role.key)}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              isSelected
                ? 'text-white border-transparent'
                : 'bg-ow-card border-ow-border text-ow-text-secondary hover:bg-ow-card-hover'
            }`}
            style={isSelected ? { backgroundColor: role.color } : undefined}
          >
            {t(role.label)}
          </button>
        );
      })}
    </div>
  );
}
