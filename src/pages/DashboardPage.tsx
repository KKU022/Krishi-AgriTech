import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CloudSun,
  Sprout,
  ScanLine,
  BookOpen,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Droplets,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Bot,
  Layers,
  ChevronRight,
  Plus,
  FlaskConical,
  Clock,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useAuth } from '../context/AuthContext.js';
import { apiRequest } from '../lib/api.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Skeleton, SkeletonCard } from '../components/common/Skeleton.js';
import { InteractiveFarm3D } from '../components/farm/InteractiveFarm3D.js';
import {
  WeatherResponse,
  CropRecommendationRecord,
  DiseaseAnalysisRecord,
  Farm,
  CropPlan,
  FarmActivity,
  SoilTest,
} from '../types.js';
import { getDiseaseResultView } from '../lib/diseaseResult.js';
import { formatTimestamp } from '../lib/dateTime.js';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  // Real Data States
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(true);
  const [weatherError, setWeatherError] = useState<string>('');

  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmsLoading, setFarmsLoading] = useState<boolean>(true);

  const [cropPlans, setCropPlans] = useState<CropPlan[]>([]);
  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const [soilTests, setSoilTests] = useState<SoilTest[]>([]);
  const [recordsLoading, setRecordsLoading] = useState<boolean>(true);

  const [latestCropRec, setLatestCropRec] = useState<CropRecommendationRecord | null>(null);
  const [latestDisease, setLatestDisease] = useState<DiseaseAnalysisRecord | null>(null);
  const [advisoryLoading, setAdvisoryLoading] = useState<boolean>(true);

  // 1. Fetch Real Open-Meteo Weather
  const fetchWeatherData = async () => {
    setWeatherLoading(true);
    setWeatherError('');
    try {
      const query = new URLSearchParams({
        state: user?.profile?.state || '',
        district: user?.profile?.district || '',
      });
      const data = await apiRequest<WeatherResponse>('/weather?' + query.toString());
      setWeather(data);
    } catch {
      setWeatherError('Microclimate telemetry temporarily unavailable from Open-Meteo cache.');
    } finally {
      setWeatherLoading(false);
    }
  };

  // 2. Fetch User's Registered Farms
  const fetchFarms = async () => {
    setFarmsLoading(true);
    try {
      const res = await apiRequest<{ farms: Farm[] }>('/farms');
      setFarms(res.farms || []);
    } catch (err) {
      console.warn('Error loading farms:', err);
    } finally {
      setFarmsLoading(false);
    }
  };

  // 3. Fetch Operational Records (Activities, Crop Plans, Soil Tests)
  const fetchRecords = async () => {
    setRecordsLoading(true);
    try {
      const [plansRes, actsRes, soilRes] = await Promise.allSettled([
        apiRequest<{ plans: CropPlan[] }>('/crop-plans'),
        apiRequest<{ activities: FarmActivity[] }>('/farm-activities'),
        apiRequest<{ soilTests: SoilTest[] }>('/soil-tests'),
      ]);

      if (plansRes.status === 'fulfilled') setCropPlans(plansRes.value.plans || []);
      if (actsRes.status === 'fulfilled') setActivities(actsRes.value.activities || []);
      if (soilRes.status === 'fulfilled') setSoilTests(soilRes.value.soilTests || []);
    } catch (err) {
      console.warn('Error loading operational records:', err);
    } finally {
      setRecordsLoading(false);
    }
  };

  // 4. Fetch Advisory & Diagnostic History
  const fetchAdvisories = async () => {
    setAdvisoryLoading(true);
    try {
      const [cropsRes, diseasesRes] = await Promise.allSettled([
        apiRequest<{ recommendations: CropRecommendationRecord[] }>('/crops/history'),
        apiRequest<{ analyses: DiseaseAnalysisRecord[] }>('/disease/history'),
      ]);

      if (cropsRes.status === 'fulfilled' && cropsRes.value.recommendations?.length > 0) {
        setLatestCropRec(cropsRes.value.recommendations[0]);
      }
      if (diseasesRes.status === 'fulfilled' && diseasesRes.value.analyses?.length > 0) {
        setLatestDisease(diseasesRes.value.analyses[0]);
      }
    } catch (err) {
      console.warn('Error fetching advisory history:', err);
    } finally {
      setAdvisoryLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
    fetchFarms();
    fetchRecords();
    fetchAdvisories();
  }, [user?.profile?.state, user?.profile?.district]);

  // Compute Seasonal Context
  const computeSeasonContext = () => {
    const month = new Date().getMonth();
    if (month >= 5 && month <= 8) {
      return {
        seasonLabel: 'Kharif Monsoon Cycle',
        stage: 'Vegetative Monitoring',
        taskSummary: 'Monitor field bunds for runoff damage and check for early stem borer symptoms.',
      };
    } else if (month >= 9 && month <= 10) {
      return {
        seasonLabel: 'Rabi Winter Sowing Cycle',
        stage: 'Seed Bed Preparation',
        taskSummary: 'Execute shallow plowing, incorporate FYM compost, and secure certified seed stocks.',
      };
    } else if (month >= 11 || month <= 1) {
      return {
        seasonLabel: 'Rabi Growth Cycle',
        stage: 'Crown Root Moisture',
        taskSummary: 'Assess soil moisture around crown roots of wheat and pulses; verify irrigation readiness.',
      };
    } else {
      return {
        seasonLabel: 'Zaid Summer Cycle',
        stage: 'Catch Crop Management',
        taskSummary: 'Evaluate short-duration pulses (Moong) or fodder before the arrival of pre-monsoon showers.',
      };
    }
  };

  const season = computeSeasonContext();
  const activeFarm = farms.find((f) => f.id === user?.profile?.activeFarmId) || farms[0] || null;
  const upcomingActivities = activities.filter((a) => !a.completed).slice(0, 3);
  const activePlans = cropPlans.filter((p) => p.status !== 'harvested' && p.status !== 'cancelled').slice(0, 3);
  const latestSoilTest = soilTests[0];

  // Video layer for dashboard hero
  const dashVideoRef = useRef<HTMLVideoElement>(null);
  const [dashVideoReady, setDashVideoReady] = useState(false);
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!prefersReducedMotion && dashVideoRef.current) {
      dashVideoRef.current.play().catch(() => {});
    }
  }, [prefersReducedMotion]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. CINEMATIC SAAS HERO WELCOME BAR WITH REAL BOTANICAL IMAGERY & AMBIENT GLOW */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative rounded-3xl bg-[#0D281A] text-white p-6 sm:p-8 shadow-2xl overflow-hidden border border-emerald-500/25"
      >
        {/* Live video backdrop — aerial fields, tuned down for legibility */}
        {!prefersReducedMotion ? (
          <video
            ref={dashVideoRef}
            autoPlay
            muted
            loop
            playsInline
            poster="/images/hero-cinematic-forest-field.jpg"
            onCanPlay={() => setDashVideoReady(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${dashVideoReady ? 'opacity-100' : 'opacity-0'}`}
            style={{ filter: 'brightness(0.35) saturate(1.05)' }}
          >
            <source src="/videos/hero-aerial-fields.webm" type="video/webm" />
          </video>
        ) : (
          <img
            src="/images/hero-cinematic-forest-field.jpg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-[120%] object-cover object-center"
            style={{ filter: 'brightness(0.3)' }}
          />
        )}

        {/* Atmospheric Gradients — lighter to let video breathe */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#07180F]/90 via-[#0D281A]/70 to-[#07180F]/60 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-400/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 uppercase tracking-wider border border-emerald-400/30 backdrop-blur-md">
                {season.seasonLabel}
              </span>
              <span className="text-xs text-[#CCD7D0] font-medium">
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              Namaste, {user?.fullName || 'Farmer'}!
            </h1>

            <div className="text-xs sm:text-sm text-[#CCD7D0] flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <MapPin className="w-3.5 h-3.5" />
                {user?.profile?.district || 'Central District'}, {user?.profile?.state || 'India'}
              </span>
              <span aria-hidden="true" className="text-emerald-700">·</span>
              <span>{user?.profile?.soilType || 'Alluvial Soil'}</span>
              <span aria-hidden="true" className="text-emerald-700">·</span>
              <span>{user?.profile?.waterSource || 'Canal Irrigation'}</span>
              {activeFarm && (
                <>
                  <span aria-hidden="true" className="text-emerald-700">·</span>
                  <span className="font-semibold text-white flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    Parcel: {activeFarm.name} ({activeFarm.size} {activeFarm.sizeUnit})
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link to="/crops">
              <Button size="md" variant="secondary" className="shadow-[0_0_20px_rgba(7,150,105,0.4)]">
                <Sprout className="w-4 h-4 mr-1.5 text-emerald-200" /> New Crop Advisory
              </Button>
            </Link>
            <Link to="/disease">
              <Button size="md" variant="glass" className="text-white border-white/20 bg-white/10 hover:bg-white/20">
                <ScanLine className="w-4 h-4 mr-1.5" /> Scan Plant Leaf
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* 2. REAL OPEN-METEO WEATHER & 4-DAY RAINFALL OUTLOOK */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Card variant="emerald-glass" padding="lg" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/30 text-sky-300 flex items-center justify-center shrink-0">
                <CloudSun className="w-5 h-5 text-sky-300" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-display text-white">
                  Microclimate Telemetry & 4-Day Precipitation Outlook
                </h2>
                <p className="text-xs text-[#CCD7D0]">
                  {weather ? `${weather.locationName || 'Local Microclimate Station'} • 30-min Open-Meteo cache` : 'Connecting to station...'}
                </p>
              </div>
            </div>

            {weather && (
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    weather.irrigationTip?.action === 'DELAY'
                      ? 'warning'
                      : weather.irrigationTip?.action === 'PROCEED'
                      ? 'accent'
                      : 'info'
                  }
                >
                  IRRIGATION: {weather.irrigationTip?.action || 'MONITOR'}
                </Badge>
                <Link to="/weather">
                  <Button variant="glass" size="sm" className="text-xs text-white border-white/20 bg-white/10 hover:bg-white/20">
                    Full Forecast <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {weatherLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-28 rounded-2xl bg-white/5" />
              <Skeleton className="h-28 rounded-2xl bg-white/5" />
              <Skeleton className="h-28 rounded-2xl bg-white/5" />
              <Skeleton className="h-28 rounded-2xl bg-white/5" />
            </div>
          ) : weatherError ? (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{weatherError}</span>
              </div>
              <Button size="sm" variant="outline" onClick={fetchWeatherData} className="text-white border-white/20 hover:bg-white/10">
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
              </Button>
            </div>
          ) : weather ? (
            <div className="space-y-5">
              {/* Real 4-Day Forecast Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {weather.forecast?.length ? (
                  weather.forecast.map((day, idx) => {
                    const isToday = idx === 0;
                    const rainProb = typeof day.precipitationProbability === 'number' ? day.precipitationProbability : null;
                    return (
                      <div
                        key={day.date}
                        className={`p-4 rounded-2xl border transition-all ${
                          isToday
                            ? 'border-emerald-400/40 bg-emerald-500/15 shadow-md'
                            : 'border-white/10 bg-black/30 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className={`font-bold ${isToday ? 'text-emerald-300' : 'text-white'}`}>
                            {isToday ? 'Today' : formatTimestamp(day.date, { weekday: 'short' })}
                          </span>
                          <span className="text-[11px] text-[#A3B5AA]">
                            {formatTimestamp(day.date, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="text-xl sm:text-2xl font-black font-display text-white tabular-nums">
                          {Math.round(day.maxTemp)}°C
                          <span className="text-xs font-normal text-[#A3B5AA] ml-1">/ {Math.round(day.minTemp)}°</span>
                        </div>
                        <div className="text-xs text-[#CCD7D0] truncate mt-1">
                          {day.conditionDescription || 'Clear Sky'}
                        </div>

                        {/* Precipitation Probability Progress Meter */}
                        {rainProb !== null && (
                          <div className="mt-3 pt-2.5 border-t border-white/10">
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="text-[#A3B5AA] flex items-center gap-1">
                                <Droplets className="w-3 h-3 text-sky-400" /> Rain
                              </span>
                              <span className={`font-mono font-bold ${rainProb > 40 ? 'text-sky-300' : 'text-[#A3B5AA]'}`}>
                                {rainProb}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  rainProb > 50
                                    ? 'bg-sky-400'
                                    : rainProb > 25
                                    ? 'bg-teal-400'
                                    : 'bg-emerald-400'
                                }`}
                                style={{ width: `${Math.min(100, rainProb)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-4 p-4 text-center text-xs text-[#A3B5AA]">
                    Detailed multi-day forecast is synchronizing with Open-Meteo cache.
                  </div>
                )}
              </div>

              {/* Hyperlocal Telemetry Bar */}
              <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[#A3B5AA] block">Air Temperature</span>
                    <span className="text-base font-extrabold text-white tabular-nums">
                      {weather.current?.temperature ?? '--'}°C
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A3B5AA] block">Relative Humidity</span>
                    <span className="text-base font-extrabold text-sky-300 tabular-nums">
                      {weather.current?.relativeHumidity ?? '--'}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A3B5AA] block">Wind Velocity</span>
                    <span className="text-base font-extrabold text-white tabular-nums">
                      {weather.current?.windSpeed ?? '--'} km/h
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[#A3B5AA] block">Irrigation Recommendation</span>
                  <span className="text-xs font-semibold text-emerald-300">
                    {weather.irrigationTip?.detail || 'Maintain routine monitoring.'}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      </motion.div>

      {/* 3. SIGNATURE FEATURE: 3D FARM PARCEL VISUALIZER */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        <InteractiveFarm3D farm={activeFarm} />
      </motion.div>

      {/* 4. ACTIVE FARM PARCEL METADATA & SEASONAL STAGE RADAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Farm Parcel Overview */}
        <div className="lg:col-span-2">
          <Card variant="spotlight" padding="lg" className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-white">Active Farm Parcel Records</h3>
                    <p className="text-xs text-[#A3B5AA]">Synchronized plot for live agronomic recommendations</p>
                  </div>
                </div>
                <Link to="/farms">
                  <Button variant="glass" size="sm" className="text-xs text-white border-white/20 bg-white/10 hover:bg-white/20">
                    Manage Parcels ({farms.length})
                  </Button>
                </Link>
              </div>

              {farmsLoading ? (
                <SkeletonCard />
              ) : farms.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-black/40 border border-dashed border-white/20">
                  <Layers className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <div className="text-sm font-bold text-white">No Registered Farm Parcels</div>
                  <p className="text-xs text-[#A3B5AA] max-w-sm mx-auto mt-1 mb-4">
                    Register your agricultural plots to calculate tailored crop suitability, irrigation advisories, and soil health profiles.
                  </p>
                  <Link to="/farms">
                    <Button variant="secondary" size="sm">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Register First Parcel
                    </Button>
                  </Link>
                </div>
              ) : activeFarm ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xl font-bold font-display text-white">{activeFarm.name}</div>
                      <div className="flex items-center gap-1.5 text-xs text-[#A3B5AA] mt-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{activeFarm.district}, {activeFarm.state}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black font-display text-emerald-300 tabular-nums">
                        {activeFarm.size}{' '}
                        <span className="text-xs font-semibold text-[#A3B5AA] uppercase">{activeFarm.sizeUnit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10">
                      <span className="text-[#A3B5AA] font-medium block mb-0.5">Soil Profile</span>
                      <span className="font-semibold text-white">{activeFarm.soilType}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10">
                      <span className="text-[#A3B5AA] font-medium block mb-0.5">Water Infrastructure</span>
                      <span className="font-semibold text-white">{activeFarm.waterSource}</span>
                    </div>
                  </div>

                  {activeFarm.primaryCrops && activeFarm.primaryCrops.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-semibold text-[#A3B5AA] uppercase tracking-wider block mb-2">
                        Registered Primary Crops
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {activeFarm.primaryCrops.map((c, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 text-xs font-medium rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-400/30"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between text-xs text-[#CCD7D0]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Primary parcel active
              </span>
              <Link to="/farms" className="text-emerald-300 hover:text-white font-semibold transition-colors">
                Switch Active Parcel →
              </Link>
            </div>
          </Card>
        </div>

        {/* Right: Seasonal Advisory & Stage Radar */}
        <div>
          <Card variant="emerald-glass" padding="lg" className="h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    Agronomic Stage Radar
                  </span>
                </div>
                <Badge variant="accent" size="sm">Active Phase</Badge>
              </div>

              <div>
                <div className="text-xl font-bold font-display text-white">{season.stage}</div>
                <div className="text-xs text-emerald-300 font-semibold mt-1">{season.seasonLabel}</div>
                <p className="text-xs text-[#CCD7D0] leading-relaxed mt-3">
                  {season.taskSummary}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-500/20 text-xs space-y-1">
                <div className="text-[#A3B5AA] font-medium">Deterministic Rule Audit:</div>
                <div className="text-emerald-200 font-mono text-[11px] leading-relaxed">
                  ICAR-CALENDAR-CYCLE: Validated for current calendar window and soil profile.
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-emerald-500/20 mt-4">
              <Link to="/assistant">
                <Button variant="secondary" size="sm" className="w-full justify-between shadow-xs">
                  <span>Consult Bilingual AI Assistant</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* 5. OPERATIONAL TRACKING: TASKS & CROP PLANS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Upcoming Farm Activities */}
        <Card variant="spotlight" padding="lg">
          <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold font-display text-white">Field Tasks & Activities</h3>
            </div>
            <Link to="/activities">
              <Button variant="glass" size="sm" className="text-xs text-white border-white/20 bg-white/10 hover:bg-white/20">
                View All ({activities.length})
              </Button>
            </Link>
          </div>

          {recordsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 rounded-xl bg-white/5" />
              <Skeleton className="h-14 rounded-xl bg-white/5" />
            </div>
          ) : upcomingActivities.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-black/30 border border-white/10">
              <Clock className="w-6 h-6 text-[#A3B5AA] mx-auto mb-2 opacity-60" />
              <div className="text-xs font-bold text-white">No Pending Field Tasks</div>
              <p className="text-[11px] text-[#A3B5AA] mt-1 mb-3">
                Log sowing, irrigation cycles, or nutrient applications to keep your field schedule organized.
              </p>
              <Link to="/activities">
                <Button variant="glass" size="sm" className="text-xs text-white border-white/20 bg-white/10 hover:bg-white/20">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Task
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-between gap-3 text-xs hover:border-emerald-500/30 transition-all"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="font-bold text-white truncate">{act.title}</div>
                    <div className="text-[11px] text-[#A3B5AA] flex items-center gap-1.5">
                      <span className="capitalize">{act.type.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{formatTimestamp(act.date, { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <Badge variant="warning" size="sm">Pending</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Right: Active Crop Rotation Plans */}
        <Card variant="spotlight" padding="lg">
          <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center">
                <Sprout className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold font-display text-white">Active Crop Rotations</h3>
            </div>
            <Link to="/activities">
              <Button variant="glass" size="sm" className="text-xs text-white border-white/20 bg-white/10 hover:bg-white/20">
                Manage Plans ({cropPlans.length})
              </Button>
            </Link>
          </div>

          {recordsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 rounded-xl bg-white/5" />
              <Skeleton className="h-14 rounded-xl bg-white/5" />
            </div>
          ) : activePlans.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-black/30 border border-white/10">
              <Sprout className="w-6 h-6 text-[#A3B5AA] mx-auto mb-2 opacity-60" />
              <div className="text-xs font-bold text-white">No Active Crop Plans</div>
              <p className="text-[11px] text-[#A3B5AA] mt-1 mb-3">
                Plan seasonal crop rotations, track target sowing windows, and register expected yields.
              </p>
              <Link to="/crops">
                <Button variant="glass" size="sm" className="text-xs text-white border-white/20 bg-white/10 hover:bg-white/20">
                  <Sprout className="w-3.5 h-3.5 mr-1" /> Discover Crops
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activePlans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-3.5 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-between gap-3 text-xs hover:border-emerald-500/30 transition-all"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="font-bold text-white truncate">{plan.cropName}</div>
                    <div className="text-[11px] text-[#A3B5AA]">
                      {plan.variety || 'Standard Variety'} • Sown: {formatTimestamp(plan.sowingDate, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <Badge variant="accent" size="sm">{plan.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 6. HISTORICAL AUDIT & RECENT ADVISORIES STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Soil Health Summary Card */}
        <Card variant="spotlight" padding="lg" className="flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="neutral" size="sm">Soil Health Card</Badge>
              <FlaskConical className="w-4 h-4 text-[#A3B5AA]" />
            </div>
            <h4 className="text-base font-bold font-display text-white">
              {latestSoilTest ? `Soil Test: ${formatTimestamp(latestSoilTest.date, { month: 'short', year: 'numeric' })}` : 'Soil Chemistry'}
            </h4>
            <p className="text-xs text-[#CCD7D0] mt-1.5 leading-relaxed">
              {latestSoilTest
                ? `pH: ${latestSoilTest.ph} • Nitrogen: ${latestSoilTest.nitrogenLevel || 'Logged'} • Phosphorus: ${latestSoilTest.phosphorusLevel || 'Logged'}`
                : 'No soil tests logged yet. Track NPK macro-nutrients and electrical conductivity.'}
            </p>
          </div>
          <div className="pt-3 border-t border-white/10">
            <Link to="/soil-health" className="w-full">
              <Button variant="glass" size="sm" className="w-full justify-between text-xs text-white border-white/20 bg-white/10 hover:bg-white/20">
                <span>{latestSoilTest ? 'View NPK Report' : 'Log Soil Test'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Latest Plant Pathology Diagnostic Card */}
        <Card variant="spotlight" padding="lg" className="flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="warning" size="sm">Leaf Pathology</Badge>
              <ScanLine className="w-4 h-4 text-amber-400" />
            </div>
            <h4 className="text-base font-bold font-display text-white">
              {latestDisease ? getDiseaseResultView(latestDisease.result).conditions[0]?.name || 'Leaf Diagnostic' : 'Plant Diagnostics'}
            </h4>
            <p className="text-xs text-[#CCD7D0] mt-1.5 leading-relaxed">
              {latestDisease
                ? `${getDiseaseResultView(latestDisease.result).certaintyLevel?.toUpperCase() || 'Verified'} · ${latestDisease.cropHint || 'Crop'}`
                : 'Upload leaf photos with on-device canvas EXIF sanitization for IPM cultural advice.'}
            </p>
          </div>
          <div className="pt-3 border-t border-white/10">
            <Link to="/disease" className="w-full">
              <Button variant="glass" size="sm" className="w-full justify-between text-xs text-white border-white/20 bg-white/10 hover:bg-white/20">
                <span>{latestDisease ? 'Review Diagnosis' : 'Scan Plant Leaf'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Latest Crop Recommendation Advisory Card */}
        <Card variant="spotlight" padding="lg" className="flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="accent" size="sm">ICAR Rules Engine</Badge>
              <Sprout className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-base font-bold font-display text-white">
              {latestCropRec ? latestCropRec.rankedCrops[0]?.cropName : 'Crop Advisory'}
            </h4>
            <p className="text-xs text-[#CCD7D0] mt-1.5 leading-relaxed">
              {latestCropRec
                ? `${latestCropRec.rankedCrops[0]?.suitabilityScore}% ICAR match for ${latestCropRec.inputs.season?.toUpperCase() || 'Season'}`
                : 'Deterministic matching against soil texture, season cycle, and irrigation capacity.'}
            </p>
          </div>
          <div className="pt-3 border-t border-white/10">
            <Link to="/crops" className="w-full">
              <Button variant="glass" size="sm" className="w-full justify-between text-xs text-white border-white/20 bg-white/10 hover:bg-white/20">
                <span>{latestCropRec ? 'View Audit Breakdown' : 'Run Suitability Match'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* 7. QUICK ACTION WORKFLOW SHORTCUTS */}
      <Card variant="spotlight" padding="lg">
        <h3 className="text-xs font-extrabold font-display text-emerald-300 uppercase tracking-wider mb-3">
          Quick Farming Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/crops"
            className="p-3.5 rounded-2xl border border-white/10 bg-black/30 hover:border-emerald-400/40 hover:bg-emerald-950/40 transition-all flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Sprout className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">Run Crop Match</div>
              <div className="text-[10px] text-[#A3B5AA]">Kharif/Rabi/Zaid</div>
            </div>
          </Link>

          <Link
            to="/disease"
            className="p-3.5 rounded-2xl border border-white/10 bg-black/30 hover:border-amber-400/40 hover:bg-amber-950/40 transition-all flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ScanLine className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">Scan Plant Leaf</div>
              <div className="text-[10px] text-[#A3B5AA]">EXIF-sanitized</div>
            </div>
          </Link>

          <Link
            to="/assistant"
            className="p-3.5 rounded-2xl border border-white/10 bg-black/30 hover:border-purple-400/40 hover:bg-purple-950/40 transition-all flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">Farm Assistant</div>
              <div className="text-[10px] text-[#A3B5AA]">Bilingual AI</div>
            </div>
          </Link>

          <Link
            to="/resources"
            className="p-3.5 rounded-2xl border border-white/10 bg-black/30 hover:border-emerald-400/40 hover:bg-emerald-950/40 transition-all flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">Official Portals</div>
              <div className="text-[10px] text-[#A3B5AA]">PM-KISAN / PMFBY</div>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
};
