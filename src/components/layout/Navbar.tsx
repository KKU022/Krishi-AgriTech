import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sprout,
  Menu,
  X,
  CloudSun,
  Bot,
  ScanLine,
  Compass,
  BookOpen,
  TrendingUp,
  User as UserIcon,
  LogOut,
  Languages,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../common/Button.js';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLanguageToggle = async () => {
    if (!user) return;
    const nextLang = user.profile.language === 'en' ? 'hi' : 'en';
    await updateProfile({ language: nextLang });
  };

  interface NavItem {
    name: string;
    path: string;
    icon?: React.ReactNode;
  }

  const navLinks: NavItem[] = isAuthenticated
    ? [
        { name: 'Dashboard', path: '/dashboard', icon: <Compass className="w-4 h-4" /> },
        { name: 'Crop Advisory', path: '/crops', icon: <Sprout className="w-4 h-4" /> },
        { name: 'Plant Health', path: '/disease', icon: <ScanLine className="w-4 h-4" /> },
        { name: 'Weather', path: '/weather', icon: <CloudSun className="w-4 h-4" /> },
        { name: 'Assistant', path: '/assistant', icon: <Bot className="w-4 h-4" /> },
        { name: 'Resources', path: '/resources', icon: <BookOpen className="w-4 h-4" /> },
        { name: 'Mandi Prices', path: '/market', icon: <TrendingUp className="w-4 h-4" /> },
      ]
    : [
        { name: 'Features', path: '/#features' },
        { name: 'How It Works', path: '/#how-it-works' },
        { name: 'Advisory Guardrails', path: '/#disclaimer' },
      ];

  const handleSignOut = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-40 transition-all duration-300 bg-[#071B13]/85 backdrop-blur-2xl border-b border-emerald-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-xl p-1"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-9 h-9 rounded-xl bg-[#0D3022] border border-emerald-500/30 flex items-center justify-center text-white shadow-xs group-hover:bg-[#145336] transition-all duration-200">
              <Sprout className="w-5 h-5 text-[#54F5BC]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold font-display text-xl tracking-tight text-white">
                AgriTech
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#54F5BC] bg-[#54F5BC]/15 border border-[#54F5BC]/30 px-1.5 py-0.5 rounded-md">
                Bharat
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    isActive
                      ? 'bg-[#00B879]/20 text-[#54F5BC] font-semibold border border-[#00B879]/30 shadow-[0_0_12px_rgba(0,184,121,0.2)]'
                      : 'text-[#B6F5D9]/80 hover:text-[#F4F7F1] hover:bg-white/10'
                  }`}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Items */}
          <div className="hidden md:flex items-center gap-2.5">
            {isAuthenticated && (
              <button
                onClick={handleLanguageToggle}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-emerald-500/30 bg-[#071B13]/70 text-[#F4F7F1] hover:bg-emerald-950/80 transition-colors shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer"
                title="Switch between English and Hindi"
              >
                <Languages className="w-3.5 h-3.5 text-[#54F5BC]" />
                <span>{user?.profile.language === 'en' ? 'EN' : 'हिंदी'}</span>
              </button>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-emerald-500/30 bg-[#071B13]/70 text-[#F4F7F1] hover:bg-emerald-950/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <div className="w-6 h-6 rounded-full bg-[#00B879]/20 border border-[#00B879]/30 text-[#54F5BC] flex items-center justify-center font-bold text-xs">
                    {user?.fullName?.charAt(0).toUpperCase() || 'F'}
                  </div>
                  <span className="text-xs font-semibold max-w-[120px] truncate text-[#F4F7F1]">
                    {user?.fullName || 'Farmer'}
                  </span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-[#B6F5D9]/70 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button
                    variant="glass"
                    size="sm"
                    className="text-white border-white/20 bg-white/10 hover:bg-white/20"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="sm" className="shadow-xs font-semibold">
                    Register Farm
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLanguageToggle}
                className="px-2 py-1 text-xs font-bold rounded-lg border border-emerald-500/30 bg-[#071B13] text-[#F4F7F1]"
              >
                {user?.profile.language === 'en' ? 'EN' : 'हिंदी'}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#B6F5D9] hover:text-[#F4F7F1] hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B879] cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-emerald-500/20 bg-[#071B13]/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-2 shadow-2xl animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-[#00B879]/20 text-[#54F5BC] font-semibold border border-[#00B879]/30 shadow-xs'
                      : 'text-[#B6F5D9] hover:bg-white/10'
                  }`}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-emerald-500/20">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-[#F4F7F1] font-medium hover:bg-white/10 rounded-xl"
                >
                  <UserIcon className="w-4 h-4 text-[#54F5BC]" />
                  <span className="text-sm">Farmer Profile ({user?.email})</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2 text-rose-400 font-medium hover:bg-rose-950/30 rounded-xl text-left text-sm cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="glass" className="w-full justify-center text-sm">
                    Log in
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full justify-center text-sm">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
