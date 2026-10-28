import React, { HTMLAttributes } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  icon?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  title,
  icon,
  className = '',
  ...props
}) => {
  const configs = {
    info: {
      bg: 'bg-sky-950/60 border-sky-500/40 text-sky-200 backdrop-blur-sm',
      icon: <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" aria-hidden="true" />,
      titleColor: 'text-sky-100',
    },
    success: {
      bg: 'bg-emerald-950/60 border-emerald-500/40 text-[#B6F5D9] backdrop-blur-sm',
      icon: <CheckCircle2 className="w-5 h-5 text-[#54F5BC] shrink-0 mt-0.5" aria-hidden="true" />,
      titleColor: 'text-[#54F5BC]',
    },
    warning: {
      bg: 'bg-amber-950/60 border-amber-500/40 text-amber-200 backdrop-blur-sm',
      icon: <AlertTriangle className="w-5 h-5 text-[#FFC76A] shrink-0 mt-0.5" aria-hidden="true" />,
      titleColor: 'text-amber-100',
    },
    error: {
      bg: 'bg-rose-950/60 border-rose-500/40 text-rose-200 backdrop-blur-sm',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />,
      titleColor: 'text-rose-100',
    },
  };

  const current = configs[variant];

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border p-4 flex gap-3 text-sm leading-relaxed shadow-2xs ${current.bg} ${className}`}
      {...props}
    >
      {icon ? <span className="shrink-0 mt-0.5 flex items-center justify-center">{icon}</span> : current.icon}
      <div className="flex-1">
        {title && <h5 className={`font-semibold mb-1 tracking-tight ${current.titleColor}`}>{title}</h5>}
        <div className="text-sm font-normal">{children}</div>
      </div>
    </div>
  );
};
