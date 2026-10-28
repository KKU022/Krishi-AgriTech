interface WeatherCacheEntry {
  timestamp: number; // Date.now()
  data: WeatherResponse;
}

export interface DayForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  precipitationProbability: number;
  precipitationSum: number;
  weatherCode: number;
  conditionDescription: string;
}

export interface WeatherResponse {
  locationName: string;
  latitude: number;
  longitude: number;
  fetchTime: string;
  source: 'Open-Meteo API';
  current: {
    temperature: number;
    relativeHumidity: number;
    windSpeed: number;
    weatherCode: number;
    conditionDescription: string;
    isDay: boolean;
  };
  forecast: DayForecast[];
  irrigationTip: {
    action: 'DELAY' | 'PROCEED' | 'MONITOR';
    title: string;
    detail: string;
    rainProbability24h: number;
  };
}

const cache = new Map<string, WeatherCacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Indian agricultural state/district coordinates mapping
const INDIAN_COORDINATES: Record<string, { lat: number; lon: number; name: string }> = {
  // Northern / Western / Central / Southern states
  punjab: { lat: 30.901, lon: 75.8573, name: 'Punjab (Ludhiana)' },
  haryana: { lat: 29.0588, lon: 76.0856, name: 'Haryana (Karnal / Rohtak)' },
  'uttar pradesh': { lat: 26.8467, lon: 80.9462, name: 'Uttar Pradesh (Lucknow)' },
  bihar: { lat: 25.5941, lon: 85.1376, name: 'Bihar (Patna)' },
  'madhya pradesh': { lat: 23.2599, lon: 77.4126, name: 'Madhya Pradesh (Bhopal)' },
  maharashtra: { lat: 19.7515, lon: 75.7139, name: 'Maharashtra (Aurangabad / Pune)' },
  rajasthan: { lat: 26.9124, lon: 75.7873, name: 'Rajasthan (Jaipur / Kota)' },
  gujarat: { lat: 23.0225, lon: 72.5714, name: 'Gujarat (Ahmedabad / Anand)' },
  karnataka: { lat: 15.3173, lon: 75.7139, name: 'Karnataka (Hubli / Mandya)' },
  'andhra pradesh': { lat: 16.5062, lon: 80.648, name: 'Andhra Pradesh (Vijayawada)' },
  telangana: { lat: 17.385, lon: 78.4867, name: 'Telangana (Warangal / Hyderabad)' },
  'tamil nadu': { lat: 11.1271, lon: 78.6569, name: 'Tamil Nadu (Thanjavur / Trichy)' },
  'west bengal': { lat: 22.9868, lon: 87.855, name: 'West Bengal (Burdwan)' },
  odisha: { lat: 20.9517, lon: 85.0985, name: 'Odisha (Cuttack / Sambalpur)' },
  assam: { lat: 26.2006, lon: 92.9376, name: 'Assam (Jorhat / Guwahati)' },
  chhattisgarh: { lat: 21.2787, lon: 81.8661, name: 'Chhattisgarh (Raipur)' },
  jharkhand: { lat: 23.6102, lon: 85.2799, name: 'Jharkhand (Ranchi)' },
  kerala: { lat: 10.8505, lon: 76.2711, name: 'Kerala (Palakkad)' },
  default: { lat: 28.6139, lon: 77.209, name: 'New Delhi / Central Plains' },
};

export function getWmoWeatherDescription(code: number): string {
  switch (code) {
    case 0:
      return 'Clear sky';
    case 1:
      return 'Mainly clear';
    case 2:
      return 'Partly cloudy';
    case 3:
      return 'Overcast';
    case 45:
    case 48:
      return 'Fog and depositing rime fog';
    case 51:
    case 53:
    case 55:
      return 'Drizzle: light to dense';
    case 61:
      return 'Slight rain';
    case 63:
      return 'Moderate rain';
    case 65:
      return 'Heavy rain';
    case 71:
    case 73:
    case 75:
      return 'Snow fall';
    case 80:
    case 81:
    case 82:
      return 'Rain showers: slight to violent';
    case 95:
      return 'Thunderstorm: slight or moderate';
    case 96:
    case 99:
      return 'Thunderstorm with slight or heavy hail';
    default:
      return 'Variable conditions';
  }
}

export async function fetchLocationWeather(
  stateName?: string,
  districtName?: string
): Promise<WeatherResponse> {
  const normalizedKey = (stateName || '').toLowerCase().trim();
  const matchedCoords =
    INDIAN_COORDINATES[normalizedKey] || INDIAN_COORDINATES['default'];

  const cacheKey = `${matchedCoords.lat.toFixed(2)},${matchedCoords.lon.toFixed(2)}`;
  const now = Date.now();

  const cached = cache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Open-Meteo URL with current weather and 3-day daily forecast
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${matchedCoords.lat}&longitude=${matchedCoords.lon}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&forecast_days=4&timezone=Asia%2FKolkata`;

  // 20-second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Open-Meteo responded with status ${res.status}`);
    }

    const json = await res.json();
    const current = json.current;
    const daily = json.daily;

    const forecastDays: DayForecast[] = [];
    // Index 0 is today, 1..3 are next 3 days
    for (let i = 0; i < Math.min(daily.time.length, 4); i++) {
      const code = daily.weather_code[i];
      forecastDays.push({
        date: daily.time[i],
        maxTemp: Math.round(daily.temperature_2m_max[i]),
        minTemp: Math.round(daily.temperature_2m_min[i]),
        precipitationProbability: daily.precipitation_probability_max[i] ?? 0,
        precipitationSum: daily.precipitation_sum[i] ?? 0,
        weatherCode: code,
        conditionDescription: getWmoWeatherDescription(code),
      });
    }

    // Determine 24-48h rain probability from today & tomorrow
    const rainProb24h = forecastDays[0]?.precipitationProbability ?? 0;
    const rainSum24h = forecastDays[0]?.precipitationSum ?? 0;

    let irrigationTip: WeatherResponse['irrigationTip'];
    if (rainProb24h >= 60 || rainSum24h >= 5) {
      irrigationTip = {
        action: 'DELAY',
        title: 'Delay Scheduled Irrigation',
        detail: `Rain is probable (${rainProb24h}% chance, ~${rainSum24h} mm) in the next 24 hours. Postponing irrigation conserves water, electricity/diesel, and prevents root-zone waterlogging.`,
        rainProbability24h: rainProb24h,
      };
    } else if (rainProb24h >= 30) {
      irrigationTip = {
        action: 'MONITOR',
        title: 'Monitor Soil Moisture Before Irrigating',
        detail: `Moderate chance of scattered precipitation (${rainProb24h}%). Check top 2 inches of field soil moisture before operating pumps or opening canals.`,
        rainProbability24h: rainProb24h,
      };
    } else {
      irrigationTip = {
        action: 'PROCEED',
        title: 'Favorable for Scheduled Irrigation',
        detail: `Low probability of rainfall (${rainProb24h}%). Proceed with normal irrigation cycles, preferably early morning or late evening to minimize evaporative losses.`,
        rainProbability24h: rainProb24h,
      };
    }

    const locationDisplay = districtName
      ? `${districtName}, ${stateName || 'India'}`
      : stateName
        ? matchedCoords.name
        : 'Central Agricultural Plains (Default)';

    const result: WeatherResponse = {
      locationName: locationDisplay,
      latitude: matchedCoords.lat,
      longitude: matchedCoords.lon,
      fetchTime: new Date().toISOString(),
      source: 'Open-Meteo API',
      current: {
        temperature: Math.round(current.temperature_2m),
        relativeHumidity: Math.round(current.relative_humidity_2m),
        windSpeed: Math.round(current.wind_speed_10m),
        weatherCode: current.weather_code,
        conditionDescription: getWmoWeatherDescription(current.weather_code),
        isDay: Boolean(current.is_day),
      },
      forecast: forecastDays,
      irrigationTip,
    };

    cache.set(cacheKey, { timestamp: now, data: result });
    return result;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Open-Meteo request timed out after 20 seconds.');
    }
    throw new Error(`Failed to retrieve weather data: ${err.message || 'Network error'}`);
  }
}

export const getWeatherForecast = fetchLocationWeather;
