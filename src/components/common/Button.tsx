import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'forest' | 'outline' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B879] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071B13] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 select-none active:scale-[0.985] cursor-pointer';

  const sizeClasses = {
    sm: 'text-xs px-3.5 py-1.5 min-h-[36px] gap-1.5 tracking-tight',
    md: 'text-sm px-4.5 py-2.5 min-h-[42px] gap-2 tracking-tight',
    lg: 'text-base px-6 py-3 min-h-[48px] gap-2.5 font-bold tracking-tight',
  };

  const variantClasses = {
    primary:
      'bg-[#00B879] hover:bg-[#009E66] active:bg-[#008757] text-[#071B13] font-extrabold border border-[#54F5BC]/50 shadow-[0_0_20px_rgba(0,184,121,0.35)] hover:shadow-[0_0_25px_rgba(84,245,188,0.5)]',
    forest:
      'bg-[#0D3022] hover:bg-[#145336] active:bg-[#071B13] text-[#F4F7F1] border border-emerald-500/30 shadow-md hover:border-emerald-400/50 hover:shadow-lg',
    secondary:
      'bg-emerald-500/15 hover:bg-emerald-500/25 active:bg-emerald-500/30 text-[#54F5BC] border border-[#00B879]/40 shadow-xs hover:border-[#54F5BC]/60',
    outline:
      'border border-emerald-500/35 hover:border-[#00B879] hover:bg-emerald-950/40 text-[#F4F7F1] bg-black/25 shadow-xs',
    glass:
      'bg-white/10 hover:bg-white/20 active:bg-white/25 text-[#F4F7F1] border border-white/20 backdrop-blur-xl shadow-xs hover:border-white/35',
    danger:
      'bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white border border-rose-500/40 shadow-xs',
    ghost:
      'text-[#B6F5D9] hover:text-white hover:bg-white/10 border border-transparent active:bg-white/15',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" aria-hidden="true" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};
