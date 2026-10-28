import React, { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'forest' | 'accent' | 'neutral' | 'warning' | 'danger' | 'info' | 'glass';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'forest',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5 font-bold tracking-tight rounded-md',
    md: 'text-xs px-3 py-1 font-bold tracking-tight rounded-lg',
  };

  const variantClasses = {
    forest: 'bg-emerald-500/15 text-[#54F5BC] border border-emerald-400/30 backdrop-blur-md',
    accent: 'bg-[#00B879]/20 text-[#54F5BC] border border-[#00B879]/40 shadow-[0_0_12px_rgba(0,184,121,0.2)] backdrop-blur-md',
    neutral: 'bg-white/10 text-[#F4F7F1] border border-white/15 backdrop-blur-md',
    warning: 'bg-amber-500/20 text-[#FFC76A] border border-amber-400/30 backdrop-blur-md',
    danger: 'bg-rose-500/20 text-rose-300 border border-rose-400/30 backdrop-blur-md',
    info: 'bg-sky-500/20 text-sky-300 border border-sky-400/30 backdrop-blur-md',
    glass: 'bg-white/15 backdrop-blur-md text-white border border-white/25 shadow-xs',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
