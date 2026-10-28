import React from 'react';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`rounded-3xl border border-dashed border-emerald-500/25 bg-black/40 backdrop-blur-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto text-[#F4F7F1] ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center mb-4 shadow-lg">
        {icon}
      </div>
      <h3 className="text-lg sm:text-xl font-bold font-display tracking-tight text-white mb-1.5">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#B6F5D9]/80 max-w-md leading-relaxed mb-6">
        {description}
      </p>
      {action && <div className="flex items-center justify-center gap-3">{action}</div>}
    </div>
  );
};
