import React from 'react';
import { RefreshCw } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Chargement des données en cours...',
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center text-slate-500 dark:text-slate-400 ${className}`}
    >
      <div className="relative flex items-center justify-center mb-3">
        <RefreshCw className={`${sizeClasses[size]} text-teal-600 dark:text-teal-400 animate-spin`} />
      </div>
      <p className="text-xs sm:text-sm font-medium">{message}</p>
    </div>
  );
};

