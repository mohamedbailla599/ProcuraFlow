import React from 'react';

export interface PageHeaderProps {
  badge?: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  badge,
  title,
  description,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`pt-1 pb-6 sm:pb-7 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in-up ${className}`}
    >
      <div className="min-w-0">
        {badge && <div className="mb-2.5 inline-block">{badge}</div>}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 self-start md:self-end">
          {actions}
        </div>
      )}
    </div>
  );
};

