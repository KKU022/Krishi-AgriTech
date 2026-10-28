import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  ScanLine,
  CloudSun,
  Bot,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  BookOpen,
  TrendingUp,
  Droplets,
  Layers,
  Lock,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Compass,
  FileCheck,
  Zap,
  Play,
  Pause,
  Video,
  Eye,
  Activity,
  Sliders,
} from 'lucide-react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { Button } from '../components/common/Button.js';
import { Card } from '../components/common/Card.js';
import { Badge } from '../components/common/Badge.js';
import { useAuth } from '../context/AuthContext.js';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  // Scroll Progress Tracking for Top Ambient Progress Bar
  const { scrollYProgress } = useScroll();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Parallax transformations
  const heroImageY = useTransform(heroScrollProgress, [0, 1], ['0%', '16%']);
  const heroContentY = useTransform(heroScrollProgress, [0, 1], ['0%', '6%']);
  const heroOpacity = useTransform(heroScrollProgress, [0, 0.85], [1, 0.25]);

  // Real Background Looping Video State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedVideo, setSelectedVideo] = useState<'aerial' | 'golden'>('aerial');
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);

  // Toggle video playback
  const toggleVideoPlayback = () => {
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsVideoPlaying(true);
    }
  };

  // Switch video stream
  const switchVideo = (type: 'aerial' | 'golden') => {
    setSelectedVideo(type);
    setVideoLoaded(false);
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      if (!shouldReduceMotion && isVideoPlaying) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [selectedVideo, shouldReduceMotion]);

  // 3D Perspective Tilt on the Floating Agronomic Simulator Panel
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handlePanelMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

    setTilt({
      rotateX: -y * 14,
      rotateY: x * 14,
    });
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  const handlePanelMouseEnter = () => {
    setIsHovered(true);
  };

  const handlePanelMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
    setIsHovered(false);
  };

  // Interactive illustrative simulator for Hero section
  const [demoSeason, setDemoSeason] = useState<'Kharif' | 'Rabi' | 'Zaid'>('Rabi');
  const [demoSoil, setDemoSoil] = useState<'Alluvial' | 'Black' | 'Red'>('Alluvial');

  const demoRankings: Record<
    string,
    { topCrop: string; score: number; water: string; duration: string; rule: string }
  > = {
    'Rabi-Alluvial': {
      topCrop: 'Wheat / गेहूं (Triticum aestivum)',
      score: 100,
      water: 'Medium (Canal / Tubewell)',
      duration: '110-140 days',
      rule: 'RULE-SEASON-WHEAT: Verified for Rabi winter sowing in deep alluvial loam',
    },
    'Rabi-Black': {
      topCrop: 'Chickpea / चना (Cicer arietinum)',
      score: 98,
      water: 'Low (Residual moisture)',
      duration: '95-115 days',
      rule: 'RULE-SOIL-CHANA: Deep moisture retention in Black soil supports taproot nodulation',
    },
    'Rabi-Red': {
      topCrop: 'Mustard / सरसों (Brassica juncea)',
      score: 94,
      water: 'Low (Conserved moisture)',
      duration: '105-130 days',
      rule: 'RULE-SOIL-MUSTARD: Light-textured soil prevents water stagnation at root zone',
    },
    'Kharif-Alluvial': {
      topCrop: 'Paddy / धान (Oryza sativa)',
      score: 100,
      water: 'High (Canal / Monsoon)',
      duration: '120-150 days',
      rule: 'RULE-WATER-PADDY: Alluvial clay retention satisfies standing water criteria',
    },
    'Kharif-Black': {
      topCrop: 'Cotton / कपास (Gossypium hirsutum)',
      score: 96,
      water: 'Medium (Rain-fed / Drip)',
      duration: '150-180 days',
      rule: 'RULE-SOIL-COTTON: High montmorillonite clay content provides ideal root anchor',
    },
    'Kharif-Red': {
      topCrop: 'Groundnut / मूंगफली (Arachis hypogaea)',
      score: 95,
      water: 'Medium (Rain-fed)',
      duration: '100-125 days',
      rule: 'RULE-SOIL-PEANUT: Friable soil allows easy peg penetration and pod fill',
    },
    'Zaid-Alluvial': {
      topCrop: 'Green Gram / मूंग (Vigna radiata)',
      score: 98,
      water: 'Low (Short duration)',
      duration: '60-70 days',
      rule: 'RULE-SEASON-MOONG: Heat-tolerant pulse restores nitrogen between Rabi & Kharif',
    },
    'Zaid-Black': {
      topCrop: 'Summer Fodder Maize / मक्का',
      score: 90,
      water: 'Medium (Irrigated)',
      duration: '65-75 days',
      rule: 'RULE-ZAID-MAIZE: High biomass accumulation under spring-summer sun',
    },
    'Zaid-Red': {
      topCrop: 'Pearl Millet / बाजरा (Pennisetum glaucum)',
      score: 92,
      water: 'Low (Drought resilient)',
      duration: '70-80 days',
      rule: 'RULE-WATER-BAJRA: High thermal threshold and low transpiration loss',
    },
  };

  const currentDemo = demoRankings[`${demoSeason}-${demoSoil}`] || demoRankings['Rabi-Alluvial'];

  // Spotlight mouse tracker for Bento Grid 3D card effects
  const handleSpotlightMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div className="relative min-h-screen bg-[#07180F] text-[#FBFBF7] selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden">
      {/* 0. Ambient Top Scroll Progress Indicator */}
      {!shouldReduceMotion && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 z-50 origin-left"
          style={{ scaleX: scrollYProgress }}
        />
      )}

      {/* 1. CINEMATIC FULL-WIDTH HERO SECTION WITH REAL LOOPING VIDEO BACKGROUND */}
      <section ref={heroRef} className="relative min-h-[94vh] flex items-center overflow-hidden pt-8 pb-20 sm:pt-14 sm:pb-28">
        {/* Real Video Background / Image Poster Fallback */}
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ y: shouldReduceMotion ? 0 : heroImageY }}
        >
          {!shouldReduceMotion && !videoError ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              poster="/images/hero-cinematic-forest-field.jpg"
              onCanPlay={() => setVideoLoaded(true)}
              onError={() => setVideoError(true)}
              className="w-full h-[120%] object-cover object-center filter brightness-[0.92] contrast-[1.08] saturate-[1.12]"
            >
              <source
                src={
                  selectedVideo === 'aerial'
                    ? '/videos/hero-aerial-fields.webm'
                    : '/videos/hero-golden-crops.webm'
                }
                type="video/webm"
              />
            </video>
          ) : (
            <img
              src="/images/hero-cinematic-forest-field.jpg"
              alt="Aerial perspective of lush emerald forest canopy meeting golden sunlit agricultural farmland at sunrise"
              className="w-full h-[120%] object-cover object-center filter brightness-[0.88] contrast-[1.08]"
              loading="eager"
            />
          )}

          {/* Nuanced Atmospheric Lighting Gradients: protects headline contrast on left while leaving landscape video clearly visible */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#071B13]/90 via-[#071B13]/55 via-50% to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071B13] via-transparent to-[#071B13]/30 pointer-events-none" />
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
        </motion.div>

        {/* Ambient Video Control Pill (Bottom Right Corner) */}
        {!shouldReduceMotion && !videoError && (
          <div className="absolute bottom-4 right-4 z-20 hidden sm:flex items-center gap-2 p-1.5 rounded-full bg-black/60 backdrop-blur-2xl border border-emerald-500/25 shadow-xl text-xs text-white">
            <button
              onClick={toggleVideoPlayback}
              className="p-1.5 rounded-full hover:bg-white/10 text-emerald-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              aria-label={isVideoPlaying ? 'Pause background video' : 'Play background video'}
              title={isVideoPlaying ? 'Pause background video' : 'Play background video'}
            >
              {isVideoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <div className="h-3 w-px bg-white/20" />
            <button
              onClick={() => switchVideo('aerial')}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                selectedVideo === 'aerial'
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/30'
                  : 'text-[#A3B5AA] hover:text-white'
              }`}
            >
              Aerial Drone
            </button>
            <button
              onClick={() => switchVideo('golden')}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                selectedVideo === 'golden'
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/30'
                  : 'text-[#A3B5AA] hover:text-white'
              }`}
            >
              Golden Crops
            </button>
            <span className="text-[10px] text-emerald-400 font-mono pr-2">
              HD WebM Loop
            </span>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"
            style={{ y: shouldReduceMotion ? 0 : heroContentY, opacity: shouldReduceMotion ? 1 : heroOpacity }}
          >
            {/* Left Column: Editorial Headline & Value Proposition */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold tracking-wide backdrop-blur-xl shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Agricultural SaaS for Indian Farmland</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display text-white tracking-tight leading-[1.08]">
                Intelligent agronomy for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200">modern harvest.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#CCD7D0] leading-relaxed max-w-2xl font-normal">
                Actionable digital agronomy engineered for Indian farmers: deterministic ICAR crop compatibility matching, on-device EXIF-sanitized leaf diagnostics, hyperlocal Open-Meteo microclimate telemetry, and bilingual guidance.
              </p>

              <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
                <Link to={isAuthenticated ? '/dashboard' : '/signup'}>
                  <Button size="lg" variant="primary" className="w-full sm:w-auto">
                    {isAuthenticated ? 'Open Farmer Dashboard' : 'Register your farm'}
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
                <a href="#capabilities">
                  <Button size="lg" variant="glass" className="w-full sm:w-auto">
                    Explore platform tools
                  </Button>
                </a>
              </div>

              {/* Trust Safeguards Bar */}
              <div className="pt-6 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs font-semibold text-[#A3B5AA] border-t border-white/10">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Deterministic Rules Engine
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Open-Meteo Microclimate Cache
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> On-Device EXIF Stripping
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Google Identity Services
                </span>
              </div>
            </motion.div>

            {/* Right Column: Luminous Frosted Dark Emerald Simulator Panel with Interactive 3D Perspective Tilt */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 perspective-1000"
            >
              <div
                onMouseMove={handlePanelMouseMove}
                onMouseEnter={handlePanelMouseEnter}
                onMouseLeave={handlePanelMouseLeave}
                className="spotlight-card rounded-3xl p-6 sm:p-7 border border-emerald-500/25 bg-[#07180F]/55 backdrop-blur-2xl shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.18),0_25px_50px_-12px_rgba(0,0,0,0.7)] transition-transform duration-200 ease-out hover:border-emerald-400/40"
                style={{
                  transform: shouldReduceMotion
                    ? 'none'
                    : `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Header Tag */}
                <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <span className="text-xs font-bold font-display uppercase tracking-wider text-emerald-300">
                      Agronomic Matching Engine
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#A3B5AA] bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    ICAR Certified Rules
                  </span>
                </div>

                {/* Interactive Simulation Controls */}
                <div className="space-y-3.5 my-4">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#CCD7D0]">Season Cycle:</span>
                    <div className="flex gap-1.5 p-1 bg-black/30 rounded-xl border border-white/10">
                      {(['Kharif', 'Rabi', 'Zaid'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setDemoSeason(s)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                            demoSeason === s
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-[#A3B5AA] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#CCD7D0]">Soil Profile:</span>
                    <div className="flex gap-1.5 p-1 bg-black/30 rounded-xl border border-white/10">
                      {(['Alluvial', 'Black', 'Red'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setDemoSoil(st)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                            demoSoil === st
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-[#A3B5AA] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Simulation Output Card */}
                <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 shadow-inner space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold text-[#A3B5AA]">
                      Top Agronomic Match
                    </span>
                    <Badge variant="accent" size="sm">{currentDemo.score}% Fit</Badge>
                  </div>
                  <div className="text-base font-extrabold font-display text-white">
                    {currentDemo.topCrop}
                  </div>
                  <div className="text-xs text-[#CCD7D0] flex items-center justify-between pt-1">
                    <span>Duration: <strong className="text-white font-medium">{currentDemo.duration}</strong></span>
                    <span>Water: <strong className="text-white font-medium">{currentDemo.water}</strong></span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-200 bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-500/25 leading-relaxed">
                    {currentDemo.rule}
                  </div>
                </div>

                {/* Telemetry Indicator */}
                <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CloudSun className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="font-semibold text-white">Open-Meteo Cache (30 min)</span>
                  </div>
                  <span className="text-emerald-300 font-bold">Station Sync Active</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 2. EDITORIAL BENTO GRID: CORE PLATFORM CAPABILITIES */}
      <section id="capabilities" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10">
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-16 space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Integrated Agronomy Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
            Engineered for Precision Across Every Phase
          </h2>
          <p className="text-base text-[#CCD7D0] leading-relaxed">
            Every feature connects to authoritative MongoDB collections, deterministic mathematical rules, and verified Open-Meteo telemetry.
          </p>
        </motion.div>

        {/* Bento Grid Layout with Asymmetrical Spans & Glowing Glass Borders */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-6">
          {/* Bento Card 1: Large Featured Card (Crop Engine) */}
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="md:col-span-3 lg:col-span-8 group"
            onMouseMove={handleSpotlightMove}
          >
            <div className="spotlight-card h-full rounded-3xl p-7 border border-emerald-500/20 bg-[#07180F]/60 backdrop-blur-2xl shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.12),0_20px_40px_-15px_rgba(0,0,0,0.5)] flex flex-col justify-between hover:border-emerald-400/40 transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center">
                    <Sprout className="w-6 h-6 text-emerald-400" />
                  </div>
                  <Badge variant="accent">Deterministic Matching</Badge>
                </div>
                <h3 className="text-2xl font-bold font-display text-white">
                  Deterministic ICAR Agronomic Matching
                </h3>
                <p className="text-sm text-[#CCD7D0] leading-relaxed">
                  Calculates compatibility scores based on verified agricultural parameters: seasonal thermal windows, soil moisture retention curves, soil texture types, and water availability.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                    <div className="text-[#A3B5AA]">Season Windows</div>
                    <div className="text-white font-bold mt-0.5">Kharif, Rabi, Zaid</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                    <div className="text-[#A3B5AA]">Soil Typologies</div>
                    <div className="text-white font-bold mt-0.5">6 Major Classifications</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs col-span-2 sm:col-span-1">
                    <div className="text-[#A3B5AA]">Auditability</div>
                    <div className="text-emerald-300 font-bold mt-0.5">Transparent Rule Trace</div>
                  </div>
                </div>
              </div>
              <div className="pt-6">
                <Link to="/crops" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 group-hover:text-emerald-200 transition-colors">
                  Run crop recommendation matrix <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Bento Card 2: Plant Pathology & Privacy */}
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="md:col-span-3 lg:col-span-4 group"
            onMouseMove={handleSpotlightMove}
          >
            <div className="spotlight-card h-full rounded-3xl p-7 border border-emerald-500/20 bg-[#07180F]/60 backdrop-blur-2xl shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.12),0_20px_40px_-15px_rgba(0,0,0,0.5)] flex flex-col justify-between hover:border-emerald-400/40 transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-300 flex items-center justify-center">
                    <ScanLine className="w-6 h-6 text-amber-400" />
                  </div>
                  <Badge variant="warning">Privacy Preserving</Badge>
                </div>
                <h3 className="text-xl font-bold font-display text-white">
                  Plant Pathology & On-Device Sanitization
                </h3>
                <p className="text-sm text-[#CCD7D0] leading-relaxed">
                  Client-side HTML5 canvas processing strips all EXIF GPS tags before diagnostic inference. Includes IPM biological controls, cultural practices, and chemical countermeasures.
                </p>
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-200 font-mono">
                  EXIF-GPS: Stripped on-device
                </div>
              </div>
              <div className="pt-6">
                <Link to="/disease" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300 group-hover:text-amber-200 transition-colors">
                  Upload leaf for diagnostic <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Bento Card 3: Hyperlocal Microclimate */}
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="md:col-span-3 lg:col-span-5 group"
            onMouseMove={handleSpotlightMove}
          >
            <div className="spotlight-card h-full rounded-3xl p-7 border border-emerald-500/20 bg-[#07180F]/60 backdrop-blur-2xl shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.12),0_20px_40px_-15px_rgba(0,0,0,0.5)] flex flex-col justify-between hover:border-emerald-400/40 transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-400/30 text-sky-300 flex items-center justify-center">
                    <CloudSun className="w-6 h-6 text-sky-400" />
                  </div>
                  <Badge variant="info">Open-Meteo Integration</Badge>
                </div>
                <h3 className="text-xl font-bold font-display text-white">
                  Hyperlocal Weather & Irrigation Guidance
                </h3>
                <p className="text-sm text-[#CCD7D0] leading-relaxed">
                  Real-time microclimate conditions cached for 30 minutes. Evaluates precipitation probability, wind velocity, and evapotranspiration thresholds.
                </p>
                <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-500/20 text-xs text-sky-200 flex items-center justify-between">
                  <span>Advisory Mode:</span>
                  <span className="font-bold text-sky-300">DELAY / PROCEED Guidance</span>
                </div>
              </div>
              <div className="pt-6">
                <Link to="/weather" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300 group-hover:text-sky-200 transition-colors">
                  View 4-day precipitation forecast <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Bento Card 4: Bilingual AI Advisory & Mandi Intelligence */}
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-3 lg:col-span-7 group"
            onMouseMove={handleSpotlightMove}
          >
            <div className="spotlight-card h-full rounded-3xl p-7 border border-emerald-500/20 bg-[#07180F]/60 backdrop-blur-2xl shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.12),0_20px_40px_-15px_rgba(0,0,0,0.5)] flex flex-col justify-between hover:border-emerald-400/40 transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-400/30 text-purple-300 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-purple-400" />
                  </div>
                  <Badge variant="neutral">English + हिन्दी Guidance</Badge>
                </div>
                <h3 className="text-xl font-bold font-display text-white">
                  Bilingual Assistant & Official Government Portals
                </h3>
                <p className="text-sm text-[#CCD7D0] leading-relaxed">
                  Interactive guidance powered by Gemini with strict agricultural guardrails, combined with direct authentic access to PM-KISAN, PMFBY crop insurance, and Agmarknet mandi price trends.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                    <div className="text-[#A3B5AA]">Government Portals</div>
                    <div className="text-white font-semibold mt-0.5">PM-KISAN • PMFBY • Agmarknet</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                    <div className="text-[#A3B5AA]">Data Safety</div>
                    <div className="text-emerald-300 font-semibold mt-0.5">Strict Disclaimer Guardrails</div>
                  </div>
                </div>
              </div>
              <div className="pt-6">
                <Link to="/assistant" className="inline-flex items-center gap-2 text-sm font-semibold text-purple-300 group-hover:text-purple-200 transition-colors">
                  Consult bilingual assistant <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. 3-STAGE INTERACTIVE AGRONOMIC ARCHITECTURE PIPELINE */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10">
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="rounded-3xl p-8 sm:p-12 border border-emerald-500/25 bg-[#07180F]/80 backdrop-blur-2xl shadow-2xl space-y-10"
        >
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold font-display text-white">
              The 3-Stage Agronomic Architecture
            </h2>
            <p className="text-sm sm:text-base text-[#CCD7D0]">
              From soil profile configuration to field-ready diagnostic output with zero guesswork.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative p-6 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-display font-extrabold text-base flex items-center justify-center">
                01
              </div>
              <h3 className="text-lg font-bold text-white font-display">Farm Parcel Registration</h3>
              <p className="text-xs text-[#CCD7D0] leading-relaxed">
                Save multi-parcel profiles with land acreage, primary soil typology, water delivery mechanisms, and state/district boundaries into authoritative MongoDB collections.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-display font-extrabold text-base flex items-center justify-center">
                02
              </div>
              <h3 className="text-lg font-bold text-white font-display">Deterministic Rule Evaluation</h3>
              <p className="text-xs text-[#CCD7D0] leading-relaxed">
                ICAR agronomic equations rank suitable cultivars against real Open-Meteo microclimate cache, ensuring sowing recommendations are rooted in certified science.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-display font-extrabold text-base flex items-center justify-center">
                03
              </div>
              <h3 className="text-lg font-bold text-white font-display">Field Action & Advisory</h3>
              <p className="text-xs text-[#CCD7D0] leading-relaxed">
                Receive bilingual spray and irrigation guidance, log farm activities, track crop progress, and consult verified government welfare schemes directly.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 4. ETHICAL SOVEREIGNTY & DATA PROTECTION SECTION */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 z-10">
        <div className="rounded-3xl p-8 sm:p-10 border border-white/10 bg-black/40 backdrop-blur-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Data Sovereignty & Farm Privacy
                </span>
              </div>
              <h3 className="text-2xl font-bold font-display text-white">
                Farmer Data Belongs Strictly to the Farmer
              </h3>
              <p className="text-xs sm:text-sm text-[#CCD7D0] leading-relaxed">
                Zero third-party monetization or data brokering. Your crop plans, leaf photos, and soil test results remain encrypted and tied to your authenticated account ID.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/about">
                <Button variant="glass" size="md" className="text-white border-white/20 bg-white/10 hover:bg-white/20">
                  Read Data Governance Policy
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION CONVERSION BANNER */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10">
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl p-10 sm:p-14 overflow-hidden border border-emerald-500/30 bg-gradient-to-br from-[#0D281A] via-[#07180F] to-[#04110A] text-center space-y-6 shadow-2xl"
        >
          {/* Luminous Glow Orbs */}
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-teal-500/20 rounded-full blur-[100px] pointer-events-none" />

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-white tracking-tight relative z-10 max-w-3xl mx-auto">
            Ready to enhance your farm yield with intelligent agronomy?
          </h2>
          <p className="text-base text-[#CCD7D0] max-w-2xl mx-auto relative z-10">
            Join thousands of Indian agricultural producers benefiting from ICAR deterministic recommendations, leaf pathology, and real-time microclimate guidance.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link to={isAuthenticated ? '/dashboard' : '/signup'}>
              <Button size="lg" variant="primary">
                {isAuthenticated ? 'Go to Farmer Dashboard' : 'Create Free Farmer Account'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            {!isAuthenticated && (
              <Link to="/login">
                <Button size="lg" variant="glass">
                  Sign in with Existing Account
                </Button>
              </Link>
            )}
          </div>
        </motion.div>
      </section>
    </div>
  );
};
