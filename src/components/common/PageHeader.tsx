import React from 'react';

export interface PageHeaderProps {
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  badge,
  icon,
  title,
  description,
  actions,
  action,
  className = '',
}) => {
  const renderedActions = actions ?? action;
  return (
    <div
      className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-[#0D3022]/90 via-[#071B13]/85 to-[#0D3022]/90 backdrop-blur-2xl border border-emerald-500/25 shadow-2xl overflow-hidden ${className}`}
    >
      {/* Ambient background glow orb */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="space-y-1.5 relative z-10">
        {badge && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00B879]/15 border border-[#00B879]/30 text-[#54F5BC] text-xs font-bold uppercase tracking-wider mb-1 backdrop-blur-md">
            {icon && <span className="shrink-0">{icon}</span>}
            <span>{badge}</span>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-[#B6F5D9]/85 max-w-2xl leading-relaxed mt-1">
            {description}
          </p>
        )}
      </div>

      {renderedActions && (
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center relative z-10">
          {renderedActions}
        </div>
      )}
    </div>
  );
};
