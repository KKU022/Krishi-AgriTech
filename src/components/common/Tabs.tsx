import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'underline' | 'pills';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  variant = 'underline',
}) => {
  if (variant === 'pills') {
    return (
      <div className={`flex flex-wrap gap-1.5 p-1.5 bg-[#071B13]/70 backdrop-blur-xl rounded-2xl border border-emerald-500/20 ${className}`} role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B879] ${
                isActive
                  ? 'bg-[#00B879] text-[#071B13] shadow-[0_0_15px_rgba(0,184,121,0.4)]'
                  : 'text-[#B6F5D9]/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`py-0.5 px-1.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-[#071B13] text-[#54F5BC]' : 'bg-black/40 text-[#B6F5D9]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`border-b border-white/10 ${className}`}>
      <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs" role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`whitespace-nowrap py-3 px-4 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B879] rounded-t-lg ${
                isActive
                  ? 'border-[#00B879] text-[#54F5BC] bg-emerald-500/10'
                  : 'border-transparent text-[#B6F5D9]/70 hover:text-white hover:border-white/20'
              }`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`py-0.5 px-1.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-[#00B879] text-[#071B13]' : 'bg-white/10 text-[#A3B5AA]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
