import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  Sprout,
  ScanLine,
  CloudSun,
  Bot,
  BookOpen,
  TrendingUp,
  User,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  MapPin,
  Languages,
  Layers,
  Calendar,
  FlaskConical,
  UserCheck,
  Users,
  ShoppingBag,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Badge } from '../common/Badge.js';
import { apiRequest } from '../../lib/api.js';
import { Farm, InAppNotification } from '../../types.js';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout, updateProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('agritech_sidebar_collapsed') === 'true';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  const [farms, setFarms] = useState<Farm[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  const isAdmin = user?.role === 'admin';

  const lang = user?.profile?.language || 'en';

  useEffect(() => {
    // Load farms and notifications
    apiRequest<{ farms: Farm[] }>('/farms')
      .then((res) => setFarms(res.farms || []))
      .catch(() => {});

    apiRequest<{ notifications: InAppNotification[] }>('/notifications')
      .then((res) => setNotifications(res.notifications || []))
      .catch(() => {});
  }, []);

  const toggleSidebar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('agritech_sidebar_collapsed', String(next));
  };

  const handleLanguageToggle = async () => {
    if (!user) return;
    const nextLang = user.profile.language === 'en' ? 'hi' : 'en';
    await updateProfile({ language: nextLang });
  };

  const handleSwitchFarm = async (farmId: string) => {
    await updateProfile({ activeFarmId: farmId });
    window.location.reload();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard', path: '/dashboard', icon: <Compass className="w-5 h-5 shrink-0" /> },
    { name: lang === 'hi' ? 'मेरे खेत' : 'My Farms', path: '/farms', icon: <Layers className="w-5 h-5 shrink-0" /> },
    { name: lang === 'hi' ? 'फसल सिफारिश' : 'Crop Advisory', path: '/crops', icon: <Sprout className="w-5 h-5 shrink-0" /> },
    { name: lang === 'hi' ? 'योजना व कार्य' : 'Plans & Activities', path: '/activities', icon: <Calendar className="w-5 h-5 shrink-0" /> },
    { name: lang === 'hi' ? 'मृदा स्वास्थ्य' : 'Soil Health & NPK', path: '/soil-health', icon: <FlaskConical className="w-5 h-5 shrink-0" /> },
    { name: lang === 'hi' ? 'रोग पहचान' : 'Plant Diagnostics', path: '/disease', icon: <ScanLine className="w-5 h-5 shrink-0" /> },
    { name: lang === 'hi' ? 'मौसम व सिंचाई' : 'Weather & Irrigation', path: '/weather', icon: <CloudSun className="w-5 h-5 shrink-0" /> },
    { name: lang === 'hi' ? 'मंडी भाव' : 'Mandi Benchmarks', path: '/market', icon: <TrendingUp className="w-5 h-5 shrink-0" /> },
    { name: lang === 'hi' ? 'इनपुट स्टोर' : 'Inputs & Store', path: '/marketplace', icon: <ShoppingBag className="w-5 h-5 shrink-0" /> },
    { name: lang === 'hi' ? 'विशेषज्ञ सलाह' : 'Consultations', path: '/consultations', icon: <UserCheck className="w-5 h-5 shrink-0" /> },
    { name: lang === 'hi' ? 'किसान समुदाय' : 'Farmer Community', path: '/community', icon: <Users className="w-5 h-5 shrink-0" /> },
    { name: lang === 'hi' ? 'संसाधन व योजनाएं' : 'Resource Hub', path: '/resources', icon: <BookOpen className="w-5 h-5 shrink-0" /> },
    { name: lang === 'hi' ? 'एआई सहायक' : 'Farming Assistant', path: '/assistant', icon: <Bot className="w-5 h-5 shrink-0" /> },
    ...(isAdmin
      ? [{ name: lang === 'hi' ? 'एडमिन पैनल' : 'Admin Console', path: '/admin', icon: <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500" /> }]
      : []),
    { name: lang === 'hi' ? 'प्रोफाइल' : 'Farm Profile', path: '/profile', icon: <User className="w-5 h-5 shrink-0" /> },
  ];

  const currentNav = navItems.find((item) => item.path === location.pathname);
  const pageTitle = currentNav ? currentNav.name : 'AgriTech Workspace';

  const activeFarm = farms.find((f) => f.id === user?.profile?.activeFarmId) || farms[0];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#07180F] text-[#FBFBF7] flex flex-col md:flex-row antialiased selection:bg-emerald-500/30 selection:text-emerald-200 pb-16 md:pb-0">
      {/* Subtle atmospheric radial glow — gives depth without competing with content */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-900/20 rounded-full blur-[140px] opacity-60" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-emerald-950/30 rounded-full blur-[120px] opacity-50" />
      </div>
      {/* 1. DESKTOP COLLAPSIBLE SIDEBAR */}
      <aside
        className={`hidden md:flex flex-col border-r border-emerald-500/15 bg-[#07180F]/85 backdrop-blur-2xl transition-all duration-300 z-30 sticky top-0 h-screen select-none ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-emerald-500/15">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-xl p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0D281A] border border-emerald-500/30 text-white flex items-center justify-center shadow-xs group-hover:bg-[#145336] transition-colors shrink-0">
              <Sprout className="w-5 h-5 text-emerald-300" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                  AgriTech
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Bharat
                  </span>
                </span>
                <span className="text-[10px] font-medium text-[#A3B5AA] tracking-wider uppercase">
                  Smart Farming
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[#A3B5AA] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  isActive
                    ? 'bg-emerald-600/90 text-white shadow-xs font-semibold border border-emerald-400/30'
                    : 'text-[#A3B5AA] hover:bg-white/10 hover:text-white'
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <span className={isActive ? 'text-emerald-200' : 'text-[#A3B5AA] group-hover:text-white'}>
                  {item.icon}
                </span>
                {!isCollapsed && <span className="truncate">{item.name}</span>}
                {isActive && (
                  <span className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Farm Profile info */}
        <div className="p-3 border-t border-emerald-500/15 bg-[#0D281A]/40">
          {!isCollapsed ? (
            <div className="flex items-center justify-between">
              <Link
                to="/profile"
                className="flex items-center gap-2.5 overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg p-1"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.fullName?.charAt(0).toUpperCase() || 'F'}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                    {user?.fullName || 'Farmer'}
                  </div>
                  <div className="text-[10px] text-[#A3B5AA] truncate">
                    {user?.profile?.district || 'Central District'}, {user?.profile?.state || 'India'}
                  </div>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 text-[#A3B5AA] hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={handleLogout}
                className="p-2 text-[#A3B5AA] hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top Header */}
        <header className="h-16 sticky top-0 z-20 bg-[#07180F]/85 backdrop-blur-2xl border-b border-emerald-500/15 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#A3B5AA] hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div>
              <h1 className="text-lg sm:text-xl font-bold font-display text-white tracking-tight flex items-center gap-2">
                <span>{pageTitle}</span>
              </h1>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#A3B5AA] font-medium">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {user?.profile?.district || 'Central District'}, {user?.profile?.state || 'India'}
                </span>
                <span>•</span>
                <span className="capitalize">{user?.profile?.soilType || 'Alluvial Soil'}</span>
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Multi-Farm Quick Switcher */}
            {farms.length > 0 && (
              <div className="hidden lg:flex items-center gap-2 bg-[#0D281A]/70 border border-emerald-500/25 px-3 py-1.5 rounded-xl shadow-2xs text-xs focus-within:ring-2 focus-within:ring-emerald-400">
                <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[#A3B5AA] font-medium">{lang === 'hi' ? 'खेत:' : 'Parcel:'}</span>
                <select
                  value={activeFarm?.id || ''}
                  onChange={(e) => handleSwitchFarm(e.target.value)}
                  className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
                  aria-label="Switch active farm parcel"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id} className="bg-[#07180F] text-white">
                      {f.name} ({f.size} {f.sizeUnit})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Language Switcher */}
            <button
              onClick={handleLanguageToggle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/25 bg-[#0D281A]/60 hover:bg-emerald-950/80 text-white text-xs font-semibold shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              title="Toggle between English and Hindi"
              aria-label="Toggle language"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-400" />
              <span>{user?.profile.language === 'en' ? 'EN' : 'हिंदी'}</span>
            </button>

            {/* Notifications Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl border border-emerald-500/25 bg-[#0D281A]/60 hover:bg-emerald-950/80 text-[#CCD7D0] hover:text-white transition-colors relative shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                title="Notifications"
                aria-label="Notifications"
                aria-expanded={showNotifications}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#07180F]" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[#07180F]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-emerald-500/30 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
                    <span className="font-bold text-xs uppercase tracking-wider text-white">
                      Farm Alerts & Updates
                    </span>
                    <Badge variant="accent" size="sm">
                      {notifications.length} Active
                    </Badge>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-[#A3B5AA] py-4 text-center">No new notifications.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className="p-3 rounded-xl bg-black/40 hover:bg-white/5 transition-colors border border-white/5 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between font-bold text-white">
                            <span>{n.title}</span>
                            <span className="text-[10px] font-normal text-[#A3B5AA]">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[#CCD7D0] leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/10 text-center">
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pl-2 pr-2.5 rounded-xl border border-emerald-500/25 bg-[#0D281A]/60 hover:bg-emerald-950/80 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-expanded={showUserMenu}
                aria-label="User account menu"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center font-bold text-xs">
                  {user?.fullName?.charAt(0).toUpperCase() || 'F'}
                </div>
                <span className="text-xs font-bold text-white hidden sm:inline max-w-[100px] truncate">
                  {user?.fullName?.split(' ')[0] || 'Farmer'}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-[#07180F]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-emerald-500/30 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-white/10 mb-1">
                    <div className="font-bold text-xs text-white">{user?.fullName}</div>
                    <div className="text-[11px] text-[#A3B5AA] truncate">{user?.email}</div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#CCD7D0] hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <User className="w-4 h-4 text-[#A3B5AA]" />
                    <span>Profile & Farm Settings</span>
                  </Link>
                  <Link
                    to="/farms"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#CCD7D0] hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Layers className="w-4 h-4 text-[#A3B5AA]" />
                    <span>My Farm Parcels</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-purple-300 hover:bg-purple-950/40 transition-colors"
                    >
                      <ShieldAlert className="w-4 h-4 text-purple-400" />
                      <span>Admin Console</span>
                    </Link>
                  )}
                  <div className="my-1 border-t border-white/10" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-[#07180F]/70 backdrop-blur-md flex">
            <div className="w-72 bg-[#07180F] h-full shadow-2xl p-4 flex flex-col animate-in slide-in-from-left duration-200 border-r border-emerald-500/20">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#0D281A] border border-emerald-500/30 text-white flex items-center justify-center">
                    <Sprout className="w-4 h-4 text-emerald-300" />
                  </div>
                  <span className="font-display font-extrabold text-base text-white">AgriTech Bharat</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-[#A3B5AA] hover:bg-white/10 transition-colors"
                  aria-label="Close navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-colors ${
                        isActive
                          ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                          : 'text-[#CCD7D0] hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className={isActive ? 'text-emerald-200' : 'text-[#A3B5AA]'}>{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 text-left transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>

        {/* Mobile Quick Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#07180F]/90 backdrop-blur-xl border-t border-emerald-500/20 px-2 py-1.5 flex items-center justify-around shadow-2xl">
          <Link
            to="/dashboard"
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
              location.pathname === '/dashboard' ? 'text-emerald-300 font-bold' : 'text-[#A3B5AA]'
            }`}
          >
            <Compass className="w-4 h-4 mb-0.5" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/farms"
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
              location.pathname === '/farms' ? 'text-emerald-300 font-bold' : 'text-[#A3B5AA]'
            }`}
          >
            <Layers className="w-4 h-4 mb-0.5" />
            <span>Farms</span>
          </Link>
          <Link
            to="/crops"
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
              location.pathname === '/crops' ? 'text-emerald-300 font-bold' : 'text-[#A3B5AA]'
            }`}
          >
            <Sprout className="w-4 h-4 mb-0.5" />
            <span>Crops</span>
          </Link>
          <Link
            to="/activities"
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
              location.pathname === '/activities' ? 'text-emerald-300 font-bold' : 'text-[#A3B5AA]'
            }`}
          >
            <Calendar className="w-4 h-4 mb-0.5" />
            <span>Tasks</span>
          </Link>
          <Link
            to="/marketplace"
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
              location.pathname === '/marketplace' ? 'text-emerald-300 font-bold' : 'text-[#A3B5AA]'
            }`}
          >
            <ShoppingBag className="w-4 h-4 mb-0.5" />
            <span>Store</span>
          </Link>
        </nav>
      </div>
    </div>
  );
};
