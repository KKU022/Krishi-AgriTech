import { Router, Response } from 'express';
import crypto from 'crypto';
import {
  authenticateToken,
  requireAdmin,
  hashPassword,
  comparePassword,
  generateToken,
  isAdminUser,
  verifyGoogleIdToken,
  AuthRequest,
} from './auth.js';
import { db } from './db.js';
import { rankCrops } from './rulesEngine.js';
import {
  explainCropRecommendations,
  analyzeCropDiseaseWithGemini,
  chatWithFarmingAssistant,
} from './gemini.js';
import { getWeatherForecast } from './weather.js';
import { sanitizeAndStripImageExif } from './imageUtils.js';
import { apiLimiter, geminiLimiter } from './rateLimiter.js';
import {
  CropRecommendationInput,
  CropRecommendationRecord,
  ChatMessage,
  normalizeSeason,
  DiseaseAnalysisRecord,
  ConversationRecord,
  Farm,
  CropPlan,
  FarmActivity,
  SoilTest,
  Consultation,
  CommunityPost,
  CommunityComment,
  SavedResource,
  Order,
  InAppNotification,
} from './types.js';

interface AssistantMessageInput {
  content: string;
  role?: string;
  sender?: string;
  id?: string;
  timestamp?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAssistantMessageInput(value: unknown): value is AssistantMessageInput {
  if (!isRecord(value)) return false;
  const role = value.role ?? value.sender;
  return typeof value.content === 'string'
    && (role === 'user' || role === 'assistant' || role === 'model');
}

export const apiRouter = Router();

// Apply general API rate limiter
apiRouter.use(apiLimiter);

// ==========================================
// 1. AUTHENTICATION & PROFILE
// ==========================================

apiRouter.post('/auth/signup', async (req, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, language, preferredLanguage, state, district } = req.body;
    if (!email || !password || !fullName) {
      res.status(400).json({ message: 'Email, password, and full name are required.' });
      return;
    }

    const lang = language || preferredLanguage || 'en';

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db.getUserByEmail(normalizedEmail);
    if (existing) {
      res.status(409).json({ message: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const id = 'usr_' + crypto.randomBytes(8).toString('hex');

    const user = await db.createUser({
      id,
      email: normalizedEmail,
      fullName,
      passwordHash,
      role: 'farmer',
      createdAt: new Date().toISOString(),
      profile: {
        language: lang,
        role: 'farmer',
        state: state || '',
        district: district || '',
        onboardingCompleted: false,
        onboardingStep: 1,
        updatedAt: new Date().toISOString(),
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role || 'farmer',
      fullName: user.fullName,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Internal server error during account registration.' });
  }
});

apiRouter.post('/auth/login', async (req, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await db.getUserByEmail(normalizedEmail);
    if (!user || !user.passwordHash) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const isAdmin = isAdminUser(user.id, user.role);
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: isAdmin ? 'admin' : (user.role || 'farmer'),
      fullName: user.fullName,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: isAdmin ? 'admin' : (user.role || 'farmer'),
        profile: user.profile,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error during authentication.' });
  }
});

// Expose public Google OAuth Client ID for frontend GIS initialization
apiRouter.get('/auth/google/config', (_req, res: Response): void => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID || '' });
});

apiRouter.post('/auth/google', async (req, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      res.status(400).json({ message: 'Google idToken is required.' });
      return;
    }

    let isNewUser = false;
    let user: any = null;

    // 1. Primary: Verify with Google Identity Services (GIS) via google-auth-library
    const gUser = await verifyGoogleIdToken(idToken);
    if (!gUser || !gUser.sub) {
      res.status(401).json({ message: 'Invalid or expired Google authentication credential.' });
      return;
    }

    // Safe Account Linking Rules:
    // A. Match by stored permanent Google sub
    user = await db.getUserByGoogleSub(gUser.sub);
    if (!user) {
      user = await db.getUserById(gUser.sub);
    }

    // B. If not matched by sub, check email match with strict account type check
    if (!user) {
      const existingByEmail = await db.getUserByEmail(gUser.email);
      if (existingByEmail) {
        const isLegacyGoogle =
          existingByEmail.passwordHash === 'FIREBASE_GOOGLE_AUTH' ||
          existingByEmail.passwordHash === 'GOOGLE_AUTH' ||
          !existingByEmail.passwordHash;

        if (isLegacyGoogle) {
          // Safely attach googleSub to existing Google account and preserve user ID and data
          await db.updateUser(existingByEmail.id, { googleSub: gUser.sub });
          user = { ...existingByEmail, googleSub: gUser.sub };
        } else {
          // Existing account was created with a password: do NOT link automatically solely by email string match
          res.status(409).json({
            code: 'ACCOUNT_EXISTS_WITH_PASSWORD',
            message:
              'An account with this email already exists with password authentication. Please sign in with your email and password.',
          });
          return;
        }
      }
    }

    // C. If no existing user found, create new Google user
    if (!user) {
      isNewUser = true;
      const newId = crypto.randomUUID();
      const isAdmin = isAdminUser(newId, 'farmer');
      user = await db.createUser({
        id: newId,
        googleSub: gUser.sub,
        email: gUser.email,
        fullName: gUser.name || 'Farmer',
        role: isAdmin ? 'admin' : 'farmer',
        passwordHash: 'GOOGLE_AUTH',
        createdAt: new Date().toISOString(),
        profile: {
          language: 'en',
          role: isAdmin ? 'admin' : 'farmer',
          state: '',
          district: '',
          onboardingCompleted: false,
          onboardingStep: 1,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: isAdminUser(user.id, user.role) ? 'admin' : (user.role || 'farmer'),
      fullName: user.fullName,
    });

    res.json({
      token,
      user: { ...user, role: isAdminUser(user.id, user.role) ? 'admin' : (user.role || 'farmer') },
      isNewUser,
    });
  } catch (err: any) {
    console.error('Google sign-in error:', err);
    res.status(500).json({ message: 'Google authentication error.' });
  }
});

apiRouter.get('/auth/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await db.getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    const isAdmin = isAdminUser(user.id, user.role);
    res.json({
      ...user,
      role: isAdmin ? 'admin' : (user.role || 'farmer'),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve current user.' });
  }
});

apiRouter.get('/profile', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await db.getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    res.json({ user, profile: user.profile });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving profile.' });
  }
});

apiRouter.put('/profile', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updates = req.body;
    const updated = await db.updateUser(req.user!.userId, { profile: updates });
    if (!updated) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    res.json({ message: 'Profile updated successfully', profile: updated.profile });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile.' });
  }
});

apiRouter.delete('/profile/data', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await db.purgeAllUserData(req.user!.userId);
    res.json({ message: 'All user data wiped successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error purging user data.' });
  }
});

apiRouter.get('/user/profile', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await db.getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ message: 'User profile not found.' });
      return;
    }
    const isAdmin = isAdminUser(user.id, user.role);
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: isAdmin ? 'admin' : (user.role || 'farmer'),
      profile: user.profile,
      createdAt: user.createdAt,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Error retrieving profile.' });
  }
});

apiRouter.put('/user/profile', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, profile } = req.body;
    const updates: any = {};
    if (fullName) updates.fullName = fullName;
    if (profile) updates.profile = profile;

    const updated = await db.updateUser(req.user!.userId, updates);
    if (!updated) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.json({
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      role: updated.role,
      profile: updated.profile,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Error updating profile.' });
  }
});

// ==========================================
// 2. FARMS (MULTI-FARM MANAGEMENT)
// ==========================================

apiRouter.get('/farms', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farms = await db.getFarms(req.user!.userId);
    res.json({ farms });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving farm parcels.' });
  }
});

apiRouter.post('/farms', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, state, district, size, sizeUnit, soilType, waterSource, primaryCrops, isDefault } = req.body;
    if (!name || !state || !district || !size || !soilType || !waterSource) {
      res.status(400).json({ message: 'Please provide all mandatory farm parcel fields.' });
      return;
    }

    const farmId = 'farm_' + crypto.randomBytes(6).toString('hex');
    const existingFarms = await db.getFarms(req.user!.userId);

    const newFarm: Farm = {
      id: farmId,
      userId: req.user!.userId,
      name,
      state,
      district,
      size: Number(size),
      sizeUnit: sizeUnit || 'acres',
      soilType,
      waterSource,
      primaryCrops: Array.isArray(primaryCrops) ? primaryCrops : [],
      isDefault: existingFarms.length === 0 || !!isDefault,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await db.saveFarm(newFarm);

    // If default, update user activeFarmId
    if (newFarm.isDefault) {
      await db.updateUser(req.user!.userId, {
        profile: { activeFarmId: saved.id } as any,
      });
    }

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error creating farm parcel.' });
  }
});

apiRouter.put('/farms/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = req.params.id;
    const existing = await db.getFarm(req.user!.userId, farmId);
    if (!existing) {
      res.status(404).json({ message: 'Farm parcel not found.' });
      return;
    }

    const updated = await db.saveFarm({
      ...existing,
      ...req.body,
      id: farmId,
      userId: req.user!.userId,
      updatedAt: new Date().toISOString(),
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating farm parcel.' });
  }
});

apiRouter.delete('/farms/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const success = await db.deleteFarm(req.user!.userId, req.params.id);
    if (!success) {
      res.status(404).json({ message: 'Farm not found or already deleted.' });
      return;
    }
    res.json({ success: true, message: 'Farm parcel removed successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting farm parcel.' });
  }
});

// ==========================================
// 3. CROP PLANS & SCHEDULES
// ==========================================

apiRouter.get('/crop-plans', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = req.query.farmId as string | undefined;
    const plans = await db.getCropPlans(req.user!.userId, farmId);
    res.json({ plans });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving crop plans.' });
  }
});

apiRouter.post('/crop-plans', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { farmId, cropName, variety, season, sowingDate, expectedHarvestDate, status, targetYieldQuintals, notes } = req.body;
    if (!farmId || !cropName || !season || !sowingDate) {
      res.status(400).json({ message: 'Farm, crop name, season, and sowing date are required.' });
      return;
    }

    const plan: CropPlan = {
      id: 'plan_' + crypto.randomBytes(6).toString('hex'),
      userId: req.user!.userId,
      farmId,
      cropName,
      variety: variety || 'Standard',
      season,
      sowingDate,
      expectedHarvestDate: expectedHarvestDate || '',
      status: status || 'planned',
      targetYieldQuintals: targetYieldQuintals ? Number(targetYieldQuintals) : undefined,
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    const saved = await db.saveCropPlan(plan);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error creating crop plan.' });
  }
});

apiRouter.delete('/crop-plans/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const success = await db.deleteCropPlan(req.user!.userId, req.params.id);
    if (!success) {
      res.status(404).json({ message: 'Crop plan not found.' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting crop plan.' });
  }
});

// ==========================================
// 4. FARM ACTIVITIES & OPERATIONS LOG
// ==========================================

apiRouter.get('/farm-activities', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = req.query.farmId as string | undefined;
    const activities = await db.getActivities(req.user!.userId, farmId);
    res.json({ activities });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving farm activities.' });
  }
});

apiRouter.post('/farm-activities', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { farmId, cropPlanId, type, title, date, cost, notes, completed } = req.body;
    if (!farmId || !type || !title || !date) {
      res.status(400).json({ message: 'Farm, activity type, title, and date are required.' });
      return;
    }

    const activity: FarmActivity = {
      id: 'act_' + crypto.randomBytes(6).toString('hex'),
      userId: req.user!.userId,
      farmId,
      cropPlanId,
      type,
      title,
      date,
      cost: cost ? Number(cost) : undefined,
      notes: notes || '',
      completed: completed ?? false,
      createdAt: new Date().toISOString(),
    };

    const saved = await db.saveActivity(activity);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error recording farm activity.' });
  }
});

apiRouter.put('/farm-activities/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const act = await db.getActivities(req.user!.userId);
    const existing = act.find((a) => a.id === req.params.id);
    if (!existing) {
      res.status(404).json({ message: 'Activity record not found.' });
      return;
    }

    const updated = await db.saveActivity({
      ...existing,
      ...req.body,
      id: existing.id,
      userId: req.user!.userId,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating farm activity.' });
  }
});

apiRouter.delete('/farm-activities/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const success = await db.deleteActivity(req.user!.userId, req.params.id);
    if (!success) {
      res.status(404).json({ message: 'Activity record not found.' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error removing farm activity.' });
  }
});

// ==========================================
// 5. SOIL HEALTH TESTS & CARD RECORDS
// ==========================================

apiRouter.get('/soil-tests', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const farmId = req.query.farmId as string | undefined;
    const tests = await db.getSoilTests(req.user!.userId, farmId);
    res.json({ tests });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving soil tests.' });
  }
});

apiRouter.post('/soil-tests', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      farmId,
      date,
      isLabTest,
      labName,
      sampleDepthCm,
      ph,
      nitrogen,
      nitrogenLevel,
      phosphorus,
      phosphorusLevel,
      potassium,
      potassiumLevel,
      organicCarbonPercent,
      electricalConductivity,
      notes,
    } = req.body;

    if (!farmId || !date || ph === undefined) {
      res.status(400).json({ message: 'Farm parcel, test date, and pH level are required.' });
      return;
    }

    // Generate scientific advisory notes based on NPK & pH
    const recommendations: string[] = [];
    const numPh = Number(ph);
    if (numPh < 6.0) {
      recommendations.push('Acidic soil detected. Consider agricultural lime or dolomite application prior to sowing.');
    } else if (numPh > 8.0) {
      recommendations.push('Alkaline soil detected. Incorporate organic compost and gypsum to improve nutrient availability.');
    } else {
      recommendations.push('Soil pH is in optimal range (6.0 - 7.5) for nutrient uptake.');
    }

    if (nitrogenLevel === 'low') {
      recommendations.push('Low nitrogen: integrate legume green manuring (dhaincha/sunnhemp) or bio-fertilizer Azotobacter.');
    }
    if (phosphorusLevel === 'low') {
      recommendations.push('Low phosphorus: apply Phosphate Solubilizing Bacteria (PSB) alongside organic matter.');
    }
    if (potassiumLevel === 'low') {
      recommendations.push('Low potassium: incorporate wood ash or potash bio-mobilizers.');
    }

    const testRecord: SoilTest = {
      id: 'soil_' + crypto.randomBytes(6).toString('hex'),
      userId: req.user!.userId,
      farmId,
      date,
      isLabTest: !!isLabTest,
      labName: labName || '',
      sampleDepthCm: sampleDepthCm ? Number(sampleDepthCm) : 15,
      ph: numPh,
      nitrogen: nitrogen ? Number(nitrogen) : undefined,
      nitrogenLevel,
      phosphorus: phosphorus ? Number(phosphorus) : undefined,
      phosphorusLevel,
      potassium: potassium ? Number(potassium) : undefined,
      potassiumLevel,
      organicCarbonPercent: organicCarbonPercent ? Number(organicCarbonPercent) : undefined,
      electricalConductivity: electricalConductivity ? Number(electricalConductivity) : undefined,
      recommendations,
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    const saved = await db.saveSoilTest(testRecord);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error recording soil test.' });
  }
});

apiRouter.delete('/soil-tests/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const success = await db.deleteSoilTest(req.user!.userId, req.params.id);
    if (!success) {
      res.status(404).json({ message: 'Soil test record not found.' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting soil test.' });
  }
});

// ==========================================
// 6. EXPERT CONSULTATION REQUESTS
// ==========================================

apiRouter.get('/consultations', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const consultations = await db.getConsultations(req.user!.userId);
    res.json({ consultations });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving consultation requests.' });
  }
});

apiRouter.post('/consultations', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { farmerName, farmerPhone, state, district, crop, category, question, urgency } = req.body;
    if (!crop || !category || !question) {
      res.status(400).json({ message: 'Crop, query category, and question details are required.' });
      return;
    }

    const consultation: Consultation = {
      id: 'cns_' + crypto.randomBytes(6).toString('hex'),
      userId: req.user!.userId,
      farmerName: farmerName || req.user!.fullName || 'Farmer',
      farmerPhone: farmerPhone || '',
      state: state || 'India',
      district: district || '',
      crop,
      category,
      question,
      urgency: urgency || 'routine',
      status: 'submitted',
      createdAt: new Date().toISOString(),
    };

    const saved = await db.saveConsultation(consultation);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error submitting consultation inquiry.' });
  }
});

// ==========================================
// 7. COMMUNITY DISCUSSIONS & MODERATION
// ==========================================

apiRouter.get('/community/posts', authenticateToken, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const posts = (await db.getCommunityPosts()).filter((post) => post.userId !== 'system_extension');
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ message: 'Error loading community discussions.' });
  }
});

apiRouter.post('/community/posts', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, body, state, cropTag } = req.body;
    if (!title || !body) {
      res.status(400).json({ message: 'Title and content are required.' });
      return;
    }

    const post: CommunityPost = {
      id: 'post_' + crypto.randomBytes(6).toString('hex'),
      userId: req.user!.userId,
      authorName: req.user!.fullName || 'Farmer',
      state: state || 'India',
      cropTag: cropTag || 'General',
      title,
      body,
      upvotes: 0,
      commentCount: 0,
      reportCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const saved = await db.saveCommunityPost(post);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error publishing community post.' });
  }
});

apiRouter.post('/community/posts/:id/upvote', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const posts = (await db.getCommunityPosts()).filter((post) => post.userId !== 'system_extension');
    const post = posts.find((p) => p.id === req.params.id);
    if (!post) {
      res.status(404).json({ message: 'Post not found.' });
      return;
    }

    const updated = await db.updateCommunityPost(post.id, {
      upvotes: (post.upvotes || 0) + 1,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error upvoting post.' });
  }
});

apiRouter.post('/community/posts/:id/report', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const posts = (await db.getCommunityPosts()).filter((post) => post.userId !== 'system_extension');
    const post = posts.find((p) => p.id === req.params.id);
    if (!post) {
      res.status(404).json({ message: 'Post not found.' });
      return;
    }

    const reports = (post.reportCount || 0) + 1;
    const status = reports >= 3 ? 'flagged' : post.status;
    const updated = await db.updateCommunityPost(post.id, {
      reportCount: reports,
      status,
    });
    res.json({ message: 'Post reported for moderator review.', post: updated });
  } catch (err) {
    res.status(500).json({ message: 'Error reporting post.' });
  }
});

apiRouter.get('/community/posts/:id/comments', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const comments = await db.getPostComments(req.params.id);
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving comments.' });
  }
});

apiRouter.post('/community/posts/:id/comments', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) {
      res.status(400).json({ message: 'Comment content cannot be empty.' });
      return;
    }

    const comment: CommunityComment = {
      id: 'comm_' + crypto.randomBytes(6).toString('hex'),
      postId: req.params.id,
      userId: req.user!.userId,
      authorName: req.user!.fullName || 'Farmer',
      body: body.trim(),
      createdAt: new Date().toISOString(),
    };

    const saved = await db.saveCommunityComment(comment);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error adding comment.' });
  }
});

// ==========================================
// 8. SAVED RESOURCES / BOOKMARKS
// ==========================================

apiRouter.get('/saved-resources', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resources = await db.getSavedResources(req.user!.userId);
    res.json({ resources });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving saved resources.' });
  }
});

apiRouter.post('/saved-resources', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resourceId, title, category, officialUrl } = req.body;
    if (!resourceId || !title || !officialUrl) {
      res.status(400).json({ message: 'Resource ID, title, and official link are required.' });
      return;
    }

    const resource: SavedResource = {
      id: 'res_' + crypto.randomBytes(6).toString('hex'),
      userId: req.user!.userId,
      resourceId,
      title,
      category: category || 'Government Scheme',
      officialUrl,
      savedAt: new Date().toISOString(),
    };

    const saved = await db.saveResource(resource);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error saving resource bookmark.' });
  }
});

apiRouter.delete('/saved-resources/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const success = await db.deleteSavedResource(req.user!.userId, req.params.id);
    if (!success) {
      res.status(404).json({ message: 'Resource bookmark not found.' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error removing bookmark.' });
  }
});

// ==========================================
// 9. ORDERS & INPUT MARKETPLACE
// ==========================================

apiRouter.get('/orders', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await db.getOrders(req.user!.userId);
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving order inquiries.' });
  }
});

apiRouter.post('/orders', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items, totalAmount, deliveryAddress, phone, paymentMode } = req.body;
    if (!items || !items.length || !deliveryAddress || !phone) {
      res.status(400).json({ message: 'Cart items, delivery address, and phone number are required.' });
      return;
    }

    const order: Order = {
      id: 'ord_' + crypto.randomBytes(6).toString('hex'),
      userId: req.user!.userId,
      farmerName: req.user!.fullName || 'Farmer',
      items,
      totalAmount: Number(totalAmount),
      deliveryAddress,
      phone,
      paymentMode: paymentMode || 'cash_on_delivery',
      status: 'pending_confirmation',
      createdAt: new Date().toISOString(),
    };

    const saved = await db.saveOrder(order);

    // Create confirmation in-app notification
    await db.saveNotification({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: req.user!.userId,
      title: 'Order Inquiry Received',
      message: `Your inquiry for order #${saved.id.slice(-6)} has been recorded. Our regional agricultural coordinator will verify stock and contact you.`,
      type: 'order_update',
      read: false,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error creating order inquiry.' });
  }
});

// ==========================================
// 10. NOTIFICATIONS
// ==========================================

apiRouter.get('/notifications', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await db.getNotifications(req.user!.userId);
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving notifications.' });
  }
});

apiRouter.post('/notifications/:id/read', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const success = await db.markNotificationRead(req.user!.userId, req.params.id);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ message: 'Error updating notification status.' });
  }
});

// ==========================================
// 11. PROTECTED ADMINISTRATOR WORKSPACE
// ==========================================

apiRouter.get('/admin/metrics', authenticateToken, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const metrics = await db.getAdminMetrics();
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ message: 'Error loading admin metrics.' });
  }
});

apiRouter.get('/admin/users', authenticateToken, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await db.listUsers();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Error loading user registry.' });
  }
});

apiRouter.get('/admin/consultations', authenticateToken, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const consultations = await db.getAllConsultations();
    res.json({ consultations });
  } catch (err) {
    res.status(500).json({ message: 'Error loading consultation queue.' });
  }
});

apiRouter.put('/admin/consultations/:id/respond', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { expertResponse, status } = req.body;
    if (!expertResponse) {
      res.status(400).json({ message: 'Expert response cannot be empty.' });
      return;
    }

    const updated = await db.updateConsultation(req.params.id, {
      expertResponse,
      status: status || 'resolved',
      assignedExpert: req.user!.fullName || 'Agronomist Specialist',
      respondedAt: new Date().toISOString(),
    });

    if (!updated) {
      res.status(404).json({ message: 'Consultation request not found.' });
      return;
    }

    // Send notification to farmer
    await db.saveNotification({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: updated.userId,
      title: 'Agronomist Advisory Update',
      message: `An agronomist has responded to your consultation query on ${updated.crop}. Check your consultation tab for details.`,
      type: 'consultation_reply',
      read: false,
      createdAt: new Date().toISOString(),
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating consultation response.' });
  }
});

apiRouter.get('/admin/orders', authenticateToken, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await db.getAllOrders();
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: 'Error loading order inquiries.' });
  }
});

apiRouter.put('/admin/orders/:id/status', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ message: 'Status is required.' });
      return;
    }

    const updated = await db.updateOrderStatus(req.params.id, status);
    if (!updated) {
      res.status(404).json({ message: 'Order not found.' });
      return;
    }

    await db.saveNotification({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: updated.userId,
      title: `Order Status: ${status.replace('_', ' ').toUpperCase()}`,
      message: `Your agricultural input order #${updated.id.slice(-6)} status is now ${status}.`,
      type: 'order_update',
      read: false,
      createdAt: new Date().toISOString(),
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating order status.' });
  }
});

apiRouter.put('/admin/posts/:id/moderate', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status || !['active', 'flagged', 'hidden'].includes(status)) {
      res.status(400).json({ message: 'Valid moderation status is required.' });
      return;
    }

    const updated = await db.updateCommunityPost(req.params.id, { status });
    if (!updated) {
      res.status(404).json({ message: 'Post not found.' });
      return;
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error moderating post.' });
  }
});

// ==========================================
// 12. CROP RECOMMENDATION ENGINE
// ==========================================

apiRouter.post('/crops/recommend', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const input: CropRecommendationInput = req.body;
    const season = normalizeSeason(input.season);
    if (!input.state || !input.soilType || !input.waterSource || !season) {
      res.status(400).json({ message: 'State, soil type, water source, and a valid sowing season are required.' });
      return;
    }
    const normalizedInput: CropRecommendationInput = { ...input, season };

    const deterministicResult = rankCrops(normalizedInput);

    let explanation: string | undefined = undefined;
    if (process.env.GEMINI_API_KEY) {
      try {
        explanation = await explainCropRecommendations(
          normalizedInput,
          deterministicResult.rankedCrops,
          req.body.language === 'hi' ? 'hi' : 'en'
        );
      } catch (err) {
        console.warn('Gemini explanation note:', err);
      }
    }

    const record: CropRecommendationRecord = {
      id: 'rec_' + crypto.randomBytes(8).toString('hex'),
      userId: req.user!.userId,
      timestamp: new Date().toISOString(),
      inputs: normalizedInput,
      rankedCrops: deterministicResult.rankedCrops,
      geminiExplanation: explanation,
      matchedRulesSummary: deterministicResult.matchedRulesSummary,
    };

    await db.saveCropRecommendation(record);
    res.json(record);
  } catch (err: any) {
    console.error('Crop recommendation error:', err);
    res.status(500).json({ message: 'Failed to compute crop recommendations.' });
  }
});

apiRouter.get('/crops/history', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recs = await db.getCropRecommendations(req.user!.userId);
    res.json({ recommendations: recs });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving recommendation history.' });
  }
});

apiRouter.post('/crops/save', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rec: CropRecommendationRecord = req.body;
    rec.userId = req.user!.userId;
    const saved = await db.saveCropRecommendation(rec);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error saving crop recommendation.' });
  }
});

// ==========================================
// 13. PLANT DISEASE PATHOLOGY
// ==========================================

apiRouter.post('/disease/analyze', authenticateToken, geminiLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { imageBase64, mimeType, cropHint, notes, language } = req.body;
    if (!imageBase64) {
      res.status(400).json({ message: 'Image data is required for plant disease diagnosis.' });
      return;
    }

    // Strip EXIF metadata to protect farmer location and camera privacy
    const sanitizedImage = sanitizeAndStripImageExif(imageBase64, mimeType);
    const diagnosis = await analyzeCropDiseaseWithGemini(
      sanitizedImage.sanitizedBase64,
      sanitizedImage.mimeType,
      cropHint,
      language === 'hi' ? 'hi' : 'en'
    );

    const record: DiseaseAnalysisRecord = {
      id: 'dis_' + crypto.randomBytes(8).toString('hex'),
      userId: req.user!.userId,
      timestamp: new Date().toISOString(),
      cropHint,
      notes,
      result: diagnosis,
    };

    await db.saveDiseaseAnalysis(record);
    res.json(record);
  } catch (err: any) {
    console.error('Plant pathology error:', err);
    res.status(500).json({ message: err.message || 'Plant pathology analysis failed.' });
  }
});

apiRouter.get('/disease/history', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const history = await db.getDiseaseAnalyses(req.user!.userId);
    res.json({ analyses: history });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving pathology history.' });
  }
});

apiRouter.post('/disease/save', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const record: DiseaseAnalysisRecord = req.body;
    record.userId = req.user!.userId;
    const saved = await db.saveDiseaseAnalysis(record);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error saving disease diagnosis.' });
  }
});

// ==========================================
// 14. BILINGUAL AI ADVISOR CHAT
// ==========================================

apiRouter.post('/assistant/chat', authenticateToken, geminiLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId, language } = req.body;
    const rawMessages: unknown = req.body.messages;
    if (!Array.isArray(rawMessages) || rawMessages.length === 0 || !rawMessages.every(isAssistantMessageInput)) {
      res.status(400).json({ message: 'A non-empty array of valid chat messages is required.' });
      return;
    }
    const messages = rawMessages;
    const normalizedHistory = messages.map((message) => ({
      role: message.role === 'assistant' || message.sender === 'assistant' || message.role === 'model' || message.sender === 'model' ? 'model' as const : 'user' as const,
      content: message.content,
    }));
    const profileUser = await db.getUserById(req.user!.userId);
    const responseLanguage = language === 'hi' ? 'hi' : 'en';
    const reply = await chatWithFarmingAssistant(normalizedHistory, profileUser?.profile, responseLanguage);

    const convId = typeof conversationId === 'string' && conversationId ? conversationId : 'conv_' + crypto.randomBytes(8).toString('hex');
    const existing = await db.getConversation(req.user!.userId, convId);
    const updatedMessages: ChatMessage[] = messages.map((message) => {
      const role: 'assistant' | 'user' = message.role === 'assistant' || message.sender === 'assistant' || message.role === 'model' || message.sender === 'model' ? 'assistant' : 'user';
      return {
        id: message.id || 'msg_' + crypto.randomBytes(6).toString('hex'),
        role,
        sender: role,
        content: message.content,
        timestamp: message.timestamp || new Date().toISOString(),
      };
    });
    updatedMessages.push({
      id: 'msg_' + crypto.randomBytes(6).toString('hex'),
      role: 'assistant',
      sender: 'assistant',
      content: reply,
      timestamp: new Date().toISOString(),
      language: responseLanguage,
    });
    const firstUserMessage = updatedMessages.find((message: any) => message.role === 'user');
    const conversation: ConversationRecord = {
      id: convId,
      userId: req.user!.userId,
      title: (firstUserMessage?.content || 'Farming Advisory Session').slice(0, 40),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: updatedMessages,
    };
    await db.saveConversation(conversation);
    res.json({ reply, conversationId: convId, messages: updatedMessages, conversation });
  } catch (err: any) {
    console.error('Assistant chat error:', err);
    res.status(500).json({ message: err.message?.includes('CONFIG_REQUIRED') ? err.message : 'Assistant response could not be generated.' });
  }
});

apiRouter.get('/assistant/conversations', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const conversations = await db.getConversations(req.user!.userId);
    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving conversations.' });
  }
});

apiRouter.get('/assistant/conversations/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const conversation = await db.getConversation(req.user!.userId, req.params.id);
    if (!conversation) {
      res.status(404).json({ message: 'Conversation not found.' });
      return;
    }
    res.json(conversation);
  } catch {
    res.status(500).json({ message: 'Error retrieving conversation.' });
  }
});

apiRouter.delete('/assistant/conversations/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deleted = await db.deleteConversation(req.user!.userId, req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'Conversation not found.' });
      return;
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Error deleting conversation.' });
  }
});
// ==========================================
// 15. WEATHER & OPEN-METEO CACHED ADVISORY
// ==========================================

apiRouter.get('/weather', async (req, res: Response): Promise<void> => {
  try {
    const state = (req.query.state as string) || 'Madhya Pradesh';
    const district = (req.query.district as string) || 'Indore';
    const forecast = await getWeatherForecast(state, district);
    res.json(forecast);
  } catch (err: any) {
    console.error('Weather forecast error:', err);
    res.status(500).json({ message: 'Failed to retrieve meteorological data.' });
  }
});
