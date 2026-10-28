import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'solid' | 'elevated' | 'forest' | 'emerald-glass' | 'spotlight';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  onMouseMove,
  ...props
}) => {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (variant === 'spotlight' || className.includes('spotlight')) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
      e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
    }
    onMouseMove?.(e);
  };

  const variantStyles = {
    default:
      'bg-[#0D3022]/70 backdrop-blur-xl border border-emerald-500/20 text-[#F4F7F1] shadow-[0_8px_30px_-4px_rgba(7,27,19,0.4)] hover:border-emerald-400/40 hover:shadow-[0_16px_40px_-6px_rgba(7,27,19,0.5),0_0_20px_rgba(0,184,121,0.15)] hover:-translate-y-0.5 transition-all duration-300',
    glass:
      'bg-[#071B13]/60 backdrop-blur-2xl border border-emerald-500/25 text-[#F4F7F1] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.15),0_16px_36px_-6px_rgba(0,0,0,0.5)] hover:border-[#54F5BC]/40 hover:-translate-y-0.5 transition-all duration-300',
    'emerald-glass':
      'bg-[#071B13]/75 backdrop-blur-3xl border border-emerald-500/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_25px_50px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(0,184,121,0.08)] text-[#F4F7F1] hover:border-emerald-400/45 hover:bg-[#071B13]/80 transition-all duration-300',
    spotlight:
      'spotlight-card bg-[#071B13]/65 backdrop-blur-2xl border border-emerald-500/20 text-[#F4F7F1] shadow-[0_16px_36px_-6px_rgba(0,0,0,0.5)] hover:border-emerald-400/40 hover:-translate-y-0.5 transition-all duration-300',
    solid:
      'bg-[#0D3022] border border-emerald-500/25 text-[#F4F7F1] shadow-md hover:-translate-y-0.5 transition-all duration-300',
    elevated:
      'bg-[#0D3022]/90 backdrop-blur-2xl border border-emerald-500/35 text-[#F4F7F1] shadow-[0_20px_48px_-8px_rgba(7,27,19,0.6),0_0_25px_rgba(0,184,121,0.12)] hover:-translate-y-1 hover:shadow-[0_28px_56px_-8px_rgba(7,27,19,0.7),0_0_30px_rgba(0,184,121,0.18)] transition-all duration-300',
    forest:
      'bg-[#071B13] text-[#F4F7F1] border border-emerald-500/25 shadow-[0_14px_34px_-6px_rgba(0,184,121,0.2)] hover:-translate-y-0.5 hover:border-emerald-400/40 transition-all duration-300',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={`rounded-3xl ${paddingStyles[padding]} ${variantStyles[variant]} ${className}`}
      onMouseMove={handleMouseMove}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <h3
      className={`text-lg sm:text-xl font-bold tracking-tight text-[#F4F7F1] flex items-center gap-2 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <p className={`text-xs sm:text-sm text-[#B6F5D9]/80 mt-1 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-4 ${className}`} {...props}>
      {children}
    </div>
  );
};
