import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { UserRole } from './types.js';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters before authentication can be used.');
  }
  return secret;
}

const ADMIN_USER_IDS = new Set((process.env.ADMIN_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean));

export function isAdminUser(userId: string, role?: UserRole): boolean {
  return role === 'admin' || ADMIN_USER_IDS.has(userId);
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
  fullName?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

import { OAuth2Client } from 'google-auth-library';

const googleOAuthClient = new OAuth2Client();

export interface VerifiedGoogleUser {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

/**
 * Safely compares password against stored hash.
 * Immediately rejects non-bcrypt markers such as FIREBASE_GOOGLE_AUTH and GOOGLE_AUTH.
 */
export async function comparePassword(plain: string, hash?: string): Promise<boolean> {
  if (!hash || hash === 'FIREBASE_GOOGLE_AUTH' || hash === 'GOOGLE_AUTH' || !hash.startsWith('$2')) {
    return false;
  }
  return bcrypt.compare(plain, hash);
}

export function generateToken(payload: AuthenticatedUser): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthenticatedUser | null {
  try {
    return jwt.verify(token, getJwtSecret()) as AuthenticatedUser;
  } catch {
    return null;
  }
}

/**
 * Cryptographically verifies a Google ID token from Google Identity Services (GIS).
 * Validates signature, audience (GOOGLE_CLIENT_ID), issuer, expiration, and email_verified.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleUser | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || !idToken) {
    return null;
  }

  try {
    const ticket = await googleOAuthClient.verifyIdToken({
      idToken,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      return null;
    }

    // Cryptographically validate issuer
    const issuer = payload.iss;
    if (issuer !== 'accounts.google.com' && issuer !== 'https://accounts.google.com') {
      console.warn('[AgriTech Auth] Token rejected: Invalid Google issuer:', issuer);
      return null;
    }

    // Require verified email claim
    if (!payload.email_verified) {
      console.warn('[AgriTech Auth] Token rejected: Google email is not verified.');
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email.toLowerCase().trim(),
      emailVerified: true,
      name: payload.name || payload.given_name || 'Farmer',
      picture: payload.picture,
    };
  } catch (err: any) {
    console.warn('[AgriTech Auth] Google ID token verification failed:', err.message);
    return null;
  }
}

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required. Please log in.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    res.status(503).json({ message: 'Authentication is not configured on this server.' });
    return;
  }

  // 1. Try our signed JWT first (Primary Application Token)
  try {
    const decoded = jwt.verify(token, secret) as AuthenticatedUser;
    if (decoded && decoded.userId) {
      const user = await db.getUserById(decoded.userId);
      if (user) {
        req.user = {
          userId: user.id,
          email: user.email,
          role: isAdminUser(user.id, user.role) ? 'admin' : (user.role || 'farmer'),
          fullName: user.fullName,
        };
        next();
        return;
      }
    }
  } catch {
    // Fall through to direct Google ID Token verification
  }

  // 2. Try direct Google ID Token verification (GIS)
  try {
    const gUser = await verifyGoogleIdToken(token);
    if (gUser && gUser.sub) {
      let user = await db.getUserByGoogleSub(gUser.sub);
      if (!user) {
        user = await db.getUserById(gUser.sub);
      }
      if (user) {
        req.user = {
          userId: user.id,
          email: user.email,
          role: isAdminUser(user.id, user.role) ? 'admin' : (user.role || 'farmer'),
          fullName: user.fullName,
        };
        next();
        return;
      }
    }
  } catch (err: any) {
    console.warn('[AgriTech Auth] Google ID Token authentication note:', err.message);
  }

  res.status(401).json({ message: 'Session expired or invalid signature. Please log in again.' });
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Access denied: Administrator privileges required.' });
    return;
  }
  next();
}
