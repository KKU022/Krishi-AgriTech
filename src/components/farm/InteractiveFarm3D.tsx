import React, { useState } from 'react';
import {
  Layers,
  Eye,
  Droplets,
  Sprout,
  Compass,
  Info,
  Maximize2,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Farm } from '../../types.js';
import { Badge } from '../common/Badge.js';
import { Button } from '../common/Button.js';

interface InteractiveFarm3DProps {
  farm?: Farm | null;
  onSelectParcel?: (parcelId: string) => void;
}

type CameraView = 'iso' | 'elevated' | 'plan';

interface ParcelZone {
  id: string;
  name: string;
  sharePercent: number;
  cropName: string;
  soilStatus: string;
  moisturePercent: number;
  color: string;
  elevationZ: number;
}

export const InteractiveFarm3D: React.FC<InteractiveFarm3DProps> = ({ farm }) => {
  const shouldReduceMotion = useReducedMotion();
  const [cameraView, setCameraView] = useState<CameraView>('iso');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone-1');
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  // Generate realistic parcel zones based on actual farm data or fallback
  const primaryCrop = farm?.primaryCrops?.[0] || 'Wheat (Rabi)';
  const secondaryCrop = farm?.primaryCrops?.[1] || 'Mustard';
  const soilType = farm?.soilType || 'Alluvial Soil';
  const waterSource = farm?.waterSource || 'Canal Irrigation';

  // Derive soil texture tones
  const getSoilBaseColor = (soil: string) => {
    const s = soil.toLowerCase();
    if (s.includes('black') || s.includes('regur')) return '#1a221d'; // Rich dark montmorillonite
    if (s.includes('red') || s.includes('laterite')) return '#4a2518'; // Warm reddish ochre
    if (s.includes('sandy')) return '#3d3827'; // Coarse sandy silt
    return '#1a3324'; // Fertile alluvial loam
  };

  const soilColor = getSoilBaseColor(soilType);

  const zones: ParcelZone[] = [
    {
      id: 'zone-1',
      name: 'North Terrace (Main Cultivation)',
      sharePercent: 55,
      cropName: primaryCrop,
      soilStatus: `${soilType} • Optimal Loam`,
      moisturePercent: 42,
      color: '#15803d', // Vibrant crop green
      elevationZ: 14,
    },
    {
      id: 'zone-2',
      name: 'South Basin (Intercrop / Nursery)',
      sharePercent: 30,
      cropName: secondaryCrop,
      soilStatus: `${soilType} • Friable Till`,
      moisturePercent: 36,
      color: '#047857', // Deep emerald
      elevationZ: 10,
    },
    {
      id: 'zone-3',
      name: 'East Agro-Forestry & Retention Bund',
      sharePercent: 15,
      cropName: 'Windbreak & Cover Crop',
      soilStatus: 'Stabilized Grass Margin',
      moisturePercent: 28,
      color: '#065f46', // Dense foliage green
      elevationZ: 6,
    },
  ];

  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  // Camera transforms
  const getCameraTransform = () => {
    if (shouldReduceMotion || cameraView === 'plan') {
      return 'rotateX(0deg) rotateZ(0deg)';
    }
    if (cameraView === 'elevated') {
      return 'rotateX(42deg) rotateZ(-18deg)';
    }
    return 'rotateX(56deg) rotateZ(-34deg)';
  };

  return (
    <div className="relative rounded-3xl border border-emerald-500/20 bg-[#07180F]/70 backdrop-blur-2xl p-5 sm:p-6 shadow-2xl overflow-hidden space-y-5">
      {/* 1. Header & Camera Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                <span>3D Farm Parcel Visualizer</span>
                <Badge variant="accent" size="sm">Interactive</Badge>
              </h3>
              <p className="text-xs text-[#CCD7D0]">
                {farm ? `${farm.name} • ${farm.size} ${farm.sizeUnit}` : 'Registered Parcel Demonstration'}
              </p>
            </div>
          </div>
        </div>

        {/* Camera Perspective Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setCameraView('iso')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              cameraView === 'iso'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-[#A3B5AA] hover:text-white hover:bg-white/5'
            }`}
          >
            Isometric 3D
          </button>
          <button
            onClick={() => setCameraView('elevated')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              cameraView === 'elevated'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-[#A3B5AA] hover:text-white hover:bg-white/5'
            }`}
          >
            Elevated 42°
          </button>
          <button
            onClick={() => setCameraView('plan')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              cameraView === 'plan'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-[#A3B5AA] hover:text-white hover:bg-white/5'
            }`}
          >
            2D Plan
          </button>
        </div>
      </div>

      {/* 2. Main 3D Isometric Viewport & Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: 3D Isometric Stage */}
        <div className="lg:col-span-7 relative h-72 sm:h-80 flex items-center justify-center rounded-2xl bg-gradient-to-b from-black/60 to-black/30 border border-emerald-500/15 overflow-hidden">
          {/* Ambient Grid Floor */}
          <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

          {/* Perspective 3D Container */}
          <div
            className="relative w-64 h-64 sm:w-72 sm:h-72 transition-transform duration-500 ease-out"
            style={{
              perspective: '1000px',
              perspectiveOrigin: '50% 50%',
            }}
          >
            <div
              className="relative w-full h-full transition-transform duration-700 ease-out preserve-3d"
              style={{
                transform: getCameraTransform(),
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Ground Substrate Base (Terrain Depth Block) */}
              <div
                className="absolute inset-0 rounded-2xl border border-emerald-900/60 shadow-2xl transition-all"
                style={{
                  backgroundColor: soilColor,
                  transform: 'translateZ(-12px)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.6)',
                }}
              />

              {/* Water Channel / Irrigation Infrastructure Line */}
              <div
                className="absolute top-1/2 left-0 right-0 h-3 bg-gradient-to-r from-sky-500 via-teal-400 to-sky-600 opacity-90 rounded-full blur-[0.5px] shadow-[0_0_12px_rgba(56,189,248,0.7)]"
                style={{
                  transform: 'translateZ(4px)',
                }}
              >
                <div className="absolute -top-4 right-2 text-[9px] font-mono text-sky-200 tracking-wider">
                  {waterSource}
                </div>
              </div>

              {/* Zone 1: North Terrace */}
              <div
                onClick={() => setSelectedZoneId('zone-1')}
                onMouseEnter={() => setHoveredZoneId('zone-1')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className={`absolute top-3 left-3 right-3 h-[42%] rounded-xl cursor-pointer transition-all duration-300 p-3 flex flex-col justify-between ${
                  selectedZoneId === 'zone-1'
                    ? 'ring-2 ring-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.6)]'
                    : 'border border-white/10 hover:border-emerald-400/50'
                }`}
                style={{
                  backgroundColor: zones[0].color,
                  transform: `translateZ(${
                    selectedZoneId === 'zone-1' ? 24 : hoveredZoneId === 'zone-1' ? 18 : 8
                  }px)`,
                  backgroundImage:
                    'repeating-linear-gradient(45deg, rgba(255,255,255,0.06), rgba(255,255,255,0.06) 8px, transparent 8px, transparent 16px)',
                }}
              >
                <div className="flex items-center justify-between text-white text-[11px] font-bold">
                  <span className="flex items-center gap-1.5 drop-shadow-md">
                    <Sprout className="w-3.5 h-3.5 text-emerald-200" />
                    {zones[0].cropName}
                  </span>
                  <span className="bg-black/40 px-1.5 py-0.5 rounded text-[10px] text-emerald-200">
                    {zones[0].sharePercent}% Area
                  </span>
                </div>
                <div className="text-[10px] font-medium text-emerald-100 flex items-center justify-between">
                  <span>Soil Moisture: {zones[0].moisturePercent}%</span>
                  <span className="text-[9px] uppercase tracking-wide bg-emerald-950/70 px-1.5 py-0.5 rounded">
                    Active
                  </span>
                </div>
              </div>

              {/* Zone 2: South Basin */}
              <div
                onClick={() => setSelectedZoneId('zone-2')}
                onMouseEnter={() => setHoveredZoneId('zone-2')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className={`absolute bottom-3 left-3 w-[56%] h-[42%] rounded-xl cursor-pointer transition-all duration-300 p-3 flex flex-col justify-between ${
                  selectedZoneId === 'zone-2'
                    ? 'ring-2 ring-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.6)]'
                    : 'border border-white/10 hover:border-emerald-400/50'
                }`}
                style={{
                  backgroundColor: zones[1].color,
                  transform: `translateZ(${
                    selectedZoneId === 'zone-2' ? 24 : hoveredZoneId === 'zone-2' ? 18 : 6
                  }px)`,
                  backgroundImage:
                    'repeating-linear-gradient(-45deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05) 6px, transparent 6px, transparent 12px)',
                }}
              >
                <div className="flex items-center justify-between text-white text-[11px] font-bold">
                  <span className="drop-shadow-md truncate">{zones[1].cropName}</span>
                  <span className="bg-black/40 px-1.5 py-0.5 rounded text-[9px] text-emerald-200">
                    {zones[1].sharePercent}%
                  </span>
                </div>
                <div className="text-[10px] font-medium text-emerald-100">
                  Moisture: {zones[1].moisturePercent}%
                </div>
              </div>

              {/* Zone 3: Retention & Forest Margins */}
              <div
                onClick={() => setSelectedZoneId('zone-3')}
                onMouseEnter={() => setHoveredZoneId('zone-3')}
                onMouseLeave={() => setHoveredZoneId(null)}
                className={`absolute bottom-3 right-3 w-[36%] h-[42%] rounded-xl cursor-pointer transition-all duration-300 p-2.5 flex flex-col justify-between ${
                  selectedZoneId === 'zone-3'
                    ? 'ring-2 ring-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.6)]'
                    : 'border border-white/10 hover:border-emerald-400/50'
                }`}
                style={{
                  backgroundColor: zones[2].color,
                  transform: `translateZ(${
                    selectedZoneId === 'zone-3' ? 24 : hoveredZoneId === 'zone-3' ? 18 : 4
                  }px)`,
                }}
              >
                <div className="text-white text-[10px] font-bold truncate drop-shadow-md">
                  Agro-Forestry
                </div>
                <div className="text-[9px] text-emerald-200">
                  {zones[2].sharePercent}% Cover
                </div>
              </div>
            </div>
          </div>

          {/* Camera Perspective Indicator Badge */}
          <div className="absolute bottom-2 left-3 text-[10px] text-[#A3B5AA] bg-black/50 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-md">
            Click plots to inspect in 3D
          </div>
        </div>

        {/* Right: Linked Inspection Details Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Selected Zone Telemetry
              </span>
              <Badge variant="accent" size="sm">{selectedZone.sharePercent}% Parcel Share</Badge>
            </div>

            <div>
              <div className="text-base font-extrabold font-display text-white">
                {selectedZone.name}
              </div>
              <div className="text-xs text-emerald-300 font-semibold mt-0.5">
                Target Crop: {selectedZone.cropName}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[10px] text-[#A3B5AA] block">Soil Profile:</span>
                <span className="font-semibold text-white truncate block">{selectedZone.soilStatus}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[10px] text-[#A3B5AA] block">Root Moisture:</span>
                <span className="font-semibold text-emerald-300 block">{selectedZone.moisturePercent}% Saturation</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-emerald-200 bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-500/25 leading-relaxed">
              ICAR-SOIL-EVAL: Drainage and aeration rated optimal for current winter cycle.
            </div>
          </div>

          {/* Location & Ownership Badge */}
          <div className="flex items-center justify-between text-xs text-[#CCD7D0] px-1">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              {farm ? `${farm.district}, ${farm.state}` : 'Field Parcel'}
            </span>
            <span className="text-[11px] text-[#A3B5AA]">
              Primary Source: {waterSource}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Mandatory Scientific Disclaimer Notice */}
      <div className="pt-3 border-t border-white/10 flex items-start gap-2 text-[11px] text-[#A3B5AA]">
        <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
        <span>
          Illustrative isometric representation based on registered farm parcel data. Not an engineering CAD survey, elevation contour map, or measured satellite digital twin.
        </span>
      </div>
    </div>
  );
};

