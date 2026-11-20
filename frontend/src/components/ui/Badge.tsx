import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'teal';
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
  dotColor?: string;
  pill?: boolean;
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default:
    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-700/80',
  success:
    'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/70',
  warning:
    'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/70',
  danger:
    'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/70',
  info:
    'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/70',
  teal:
    'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/80',
};

const dotColors: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-slate-400 dark:bg-slate-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-blue-500',
  teal: 'bg-teal-500',
};

const sizeStyles: Record<NonNullable<BadgeProps['size']>, string> = {
  xs: 'text-[10px] px-1.5 py-0.5 font-semibold',
  sm: 'text-[11px] px-2 py-0.5 font-semibold',
  md: 'text-xs px-2.5 py-1 font-semibold',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  dot = false,
  dotColor,
  pill = true,
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border tracking-tight transition-colors ${
        pill ? 'rounded-full' : 'rounded-md'
      } ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor || dotColors[variant]}`}
        />
      )}
      <span>{children}</span>
    </span>
  );
};

