import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { Check, Lock } from 'lucide-react';

interface OptionCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onClick?: () => void;
  badge?: string;
}

export function OptionCard({
  title,
  description,
  icon,
  selected,
  disabled,
  disabledReason,
  onClick,
  badge,
}: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'option-card text-left w-full group',
        selected && 'option-card-selected',
        disabled && 'option-card-disabled'
      )}
      title={disabled ? disabledReason : undefined}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className={cn(
            'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
            selected ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground',
            !disabled && 'group-hover:bg-primary/10 group-hover:text-primary'
          )}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              'font-medium text-sm',
              selected ? 'text-primary' : 'text-foreground'
            )}>
              {title}
            </span>
            {badge && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
          )}
          {disabled && disabledReason && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {disabledReason}
            </p>
          )}
        </div>
        {selected && (
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
      </div>
    </button>
  );
}
