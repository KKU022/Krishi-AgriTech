import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

interface RateLimitRecord {
  timestamps: number[];
}

const userRequestMap = new Map<string, RateLimitRecord>();
const apiRequestMap = new Map<string, RateLimitRecord>();
const MAX_REQUESTS_PER_HOUR = 20;
const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_API_REQUESTS = 300;
const API_WINDOW_MS = 15 * 60 * 1000;

export function apiLimiter(req: AuthRequest, res: Response, next: NextFunction): void {
  const clientKey = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  let record = apiRequestMap.get(clientKey);
  if (!record) {
    record = { timestamps: [] };
    apiRequestMap.set(clientKey, record);
  }
  record.timestamps = record.timestamps.filter((timestamp) => now - timestamp < API_WINDOW_MS);
  if (record.timestamps.length >= MAX_API_REQUESTS) {
    res.status(429).json({ message: 'API request limit reached. Please wait before trying again.' });
    return;
  }
  record.timestamps.push(now);
  next();
}

export function rateLimitAiEndpoints(req: AuthRequest, res: Response, next: NextFunction): void {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Authentication required.' });
    return;
  }

  const now = Date.now();
  let record = userRequestMap.get(userId);

  if (!record) {
    record = { timestamps: [] };
    userRequestMap.set(userId, record);
  }

  // Filter out timestamps older than 1 hour
  record.timestamps = record.timestamps.filter((ts) => now - ts < ONE_HOUR_MS);

  if (record.timestamps.length >= MAX_REQUESTS_PER_HOUR) {
    const oldest = record.timestamps[0];
    const minutesLeft = Math.ceil((ONE_HOUR_MS - (now - oldest)) / 60000);
    res.status(429).json({
      message: `Hourly AI quota reached (limit: 20 calls/hr). Please try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
    });
    return;
  }

  record.timestamps.push(now);
  next();
}

export const geminiLimiter = rateLimitAiEndpoints;
