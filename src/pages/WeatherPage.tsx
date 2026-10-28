import React, { useState, useEffect } from 'react';
import {
  CloudSun,
  Droplets,
  Wind,
  Thermometer,
  Calendar,
  RefreshCw,
  AlertCircle,
  Clock,
  Compass,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { apiRequest } from '../lib/api.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card.js';
import { PageHeader } from '../components/common/PageHeader.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Skeleton } from '../components/common/Skeleton.js';
import { WeatherResponse } from '../types.js';
import { formatTimestamp } from '../lib/dateTime.js';

export const WeatherPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fetchWeather = async (isManual = false) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const query = new URLSearchParams({ state: user?.profile?.state || '', district: user?.profile?.district || '' });
      const data = await apiRequest<WeatherResponse>('/weather?' + query.toString());
      setWeather(data);
      if (isManual) {
        toast.info('Weather telemetry updated', 'Open-Meteo microclimate cache refreshed.');
      }
    } catch (err: any) {
      setErrorMessage('Weather unavailable. Could not connect to atmospheric telemetry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <PageHeader
        badge="Microclimate Telemetry"
        title="Weather & Irrigation Advisory"
        description="Derived from Open-Meteo meteorological models to optimize pump cycles and prevent root-zone waterlogging."
        action={
          <Button
            variant="glass"
            size="sm"
            onClick={() => fetchWeather(true)}
            isLoading={isLoading}
            icon={<RefreshCw className="w-3.5 h-3.5 text-[#54F5BC]" />}
            className="text-xs"
          >
            Refresh Telemetry
          </Button>
        }
      />

      {errorMessage && (
        <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-200">{errorMessage}</h3>
            <p className="text-xs text-rose-300/80 mt-1">
              Please check your network connection or verify that your farm location is saved in your profile.
            </p>
          </div>
          <Button variant="glass" size="sm" onClick={() => fetchWeather(true)} icon={<RefreshCw className="w-3.5 h-3.5" />}>
            Retry Now
          </Button>
        </div>
      )}

      {isLoading && !weather && (
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl bg-white/5" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-28 rounded-xl bg-white/5" />
            <Skeleton className="h-28 rounded-xl bg-white/5" />
            <Skeleton className="h-28 rounded-xl bg-white/5" />
            <Skeleton className="h-28 rounded-xl bg-white/5" />
          </div>
        </div>
      )}

      {weather && (
        <div className="space-y-8">
          {/* IRRIGATION TIP HERO CARD */}
          <Card
            variant="glass"
            className={`border-t-4 ${
              weather.irrigationTip?.action === 'DELAY'
                ? 'border-t-[#FFC76A] bg-[#0D3022]/80'
                : weather.irrigationTip?.action === 'PROCEED'
                ? 'border-t-[#00B879] bg-[#0D3022]/80'
                : 'border-t-sky-500 bg-[#0D3022]/80'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
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
                    RECOMMENDED ACTION: {weather.irrigationTip?.action || 'unavailable'}
                  </Badge>
                  <span className="text-xs text-[#B6F5D9]/70">
                    24h Rain Probability: <strong className="text-[#54F5BC]">{typeof weather.irrigationTip?.rainProbability24h === 'number' ? `${weather.irrigationTip.rainProbability24h}%` : 'Unavailable'}</strong>
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#F4F7F1]">
                  {weather.irrigationTip?.title || 'Irrigation recommendation unavailable'}
                </h3>
                <p className="text-xs sm:text-sm text-[#B6F5D9]/80 leading-relaxed max-w-3xl">
                  {weather.irrigationTip?.detail || 'No irrigation guidance was returned with this forecast.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/20 shadow-2xs text-center shrink-0 min-w-[130px]">
                <div className="text-[10px] uppercase font-bold text-[#B6F5D9]/70">Rain Prob (24h)</div>
                <div className="text-2xl sm:text-3xl font-black text-[#54F5BC] mt-0.5">
                  {typeof weather.irrigationTip?.rainProbability24h === 'number' ? `${weather.irrigationTip.rainProbability24h}%` : 'Unavailable'}
                </div>
              </div>
            </div>
          </Card>

          {/* CURRENT CONDITIONS METRICS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card variant="glass" className="p-4 border-emerald-500/20">
              <div className="flex items-center gap-2 text-[#B6F5D9]/70 text-[11px] font-semibold uppercase mb-1">
                <Thermometer className="w-4 h-4 text-[#54F5BC]" />
                <span>Temperature</span>
              </div>
              <div className="text-2xl font-black text-[#F4F7F1]">
                {weather.current.temperature}&deg;C
              </div>
              <p className="text-xs text-[#B6F5D9]/70 mt-1">
                {weather.current.conditionDescription}
              </p>
            </Card>

            <Card variant="glass" className="p-4 border-emerald-500/20">
              <div className="flex items-center gap-2 text-[#B6F5D9]/70 text-[11px] font-semibold uppercase mb-1">
                <Droplets className="w-4 h-4 text-sky-400" />
                <span>Relative Humidity</span>
              </div>
              <div className="text-2xl font-black text-[#F4F7F1]">
                {weather.current.relativeHumidity}%
              </div>
              <p className="text-xs text-[#B6F5D9]/70 mt-1">
                Atmospheric moisture
              </p>
            </Card>

            <Card variant="glass" className="p-4 border-emerald-500/20">
              <div className="flex items-center gap-2 text-[#B6F5D9]/70 text-[11px] font-semibold uppercase mb-1">
                <Wind className="w-4 h-4 text-teal-400" />
                <span>Wind Velocity</span>
              </div>
              <div className="text-2xl font-black text-[#F4F7F1]">
                {weather.current.windSpeed} km/h
              </div>
              <p className="text-xs text-[#B6F5D9]/70 mt-1">
                Safe for foliar sprays (&lt;15 km/h)
              </p>
            </Card>

            <Card variant="glass" className="p-4 border-emerald-500/20">
              <div className="flex items-center gap-2 text-[#B6F5D9]/70 text-[11px] font-semibold uppercase mb-1">
                <Compass className="w-4 h-4 text-[#FFC76A]" />
                <span>Telemetry Grid</span>
              </div>
              <div className="text-sm font-bold text-[#F4F7F1] truncate">
                {weather.locationName || 'Weather location unavailable'}
              </div>
              <p className="text-xs text-[#B6F5D9]/60 mt-1 font-mono text-[11px]">
                {typeof weather.latitude === 'number' && typeof weather.longitude === 'number' ? `${weather.latitude.toFixed(2)}°N, ${weather.longitude.toFixed(2)}°E` : 'Coordinates unavailable'}
              </p>
            </Card>
          </div>

          {/* 3-DAY AGROMETEOROLOGICAL FORECAST */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#F4F7F1] mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#54F5BC]" />
              <span>3-Day Agrometeorological Forecast</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(weather.forecast ?? []).length > 1 ? (weather.forecast ?? []).slice(1, 4).map((day, idx) => (
                <Card key={day.date} variant="glass" className="space-y-3 border-t-2 border-t-[#00B879]">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-[#B6F5D9]/60">
                        Day {idx + 1}
                      </div>
                      <div className="text-sm font-bold text-[#F4F7F1]">
                        {formatTimestamp(day.date, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <Badge variant="neutral">
                      {typeof day.precipitationProbability === 'number' ? `${day.precipitationProbability}% Rain` : 'Rain probability unavailable'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#B6F5D9]/60">Temp Range</div>
                      <div className="text-base font-extrabold text-[#F4F7F1]">
                        {day.minTemp}&deg;C — {day.maxTemp}&deg;C
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-[#B6F5D9]/60">Rain Sum</div>
                      <div className="text-sm font-bold text-[#54F5BC]">
                        {day.precipitationSum} mm
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-[#F4F7F1] bg-black/40 p-2.5 rounded-xl border border-emerald-500/15">
                    {day.conditionDescription}
                  </div>
                </Card>
              )) : <p className="col-span-full p-4 rounded-xl bg-black/40 border border-emerald-500/20 text-sm text-[#B6F5D9]/70">Forecast data is unavailable for this response.</p>}
            </div>
          </div>

          {/* METADATA ATTRIBUTION BANNER (STRICT REQUIREMENT) */}
          <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[#B6F5D9]/75 gap-2 shadow-2xs">
            <div>
              <strong className="text-[#F4F7F1]">Data Source: </strong> {weather.source || 'Weather source unavailable'}
            </div>
            <div className="flex items-center gap-1.5 text-[#B6F5D9]/60">
              <Clock className="w-3.5 h-3.5" />
              <span>Fetched: {weather.fetchTime ? formatTimestamp(weather.fetchTime, { timeStyle: 'short' }) : 'Timestamp unavailable'} (30-min cache)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
