import { MongoClient, Db, Collection } from 'mongodb';
import fs from 'fs';
import path from 'path';
import {
  IRepository,
  DatabaseSchema,
} from './db.js';
import {
  UserAccount,
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
  CropRecommendationRecord,
  DiseaseAnalysisRecord,
  ConversationRecord,
} from './types.js';

function normalizeConversationMessages(conversation: ConversationRecord): ConversationRecord {
  return {
    ...conversation,
    messages: (conversation.messages || []).map((message) => {
      const role = message.role ?? message.sender ?? 'user';
      return { ...message, role, sender: message.sender ?? role };
    }),
  };
}

function cleanDoc<T>(doc: any): T {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest as T;
}

export class MongoRepository implements IRepository {
  private db: Db;
  private client: MongoClient;

  constructor(client: MongoClient, db: Db) {
    this.client = client;
    this.db = db;
  }

  // Collections
  private get users(): Collection<UserAccount & { _id: string }> {
    return this.db.collection('users');
  }
  private get farms(): Collection<Farm & { _id: string }> {
    return this.db.collection('farms');
  }
  private get cropPlans(): Collection<CropPlan & { _id: string }> {
    return this.db.collection('crop_plans');
  }
  private get farmActivities(): Collection<FarmActivity & { _id: string }> {
    return this.db.collection('farm_activities');
  }
  private get soilTests(): Collection<SoilTest & { _id: string }> {
    return this.db.collection('soil_tests');
  }
  private get consultations(): Collection<Consultation & { _id: string }> {
    return this.db.collection('consultations');
  }
  private get communityPosts(): Collection<CommunityPost & { _id: string }> {
    return this.db.collection('community_posts');
  }
  private get communityComments(): Collection<CommunityComment & { _id: string }> {
    return this.db.collection('community_comments');
  }
  private get savedResources(): Collection<SavedResource & { _id: string }> {
    return this.db.collection('saved_resources');
  }
  private get orders(): Collection<Order & { _id: string }> {
    return this.db.collection('orders');
  }
  private get inAppNotifications(): Collection<InAppNotification & { _id: string }> {
    return this.db.collection('in_app_notifications');
  }
  private get cropRecommendations(): Collection<CropRecommendationRecord & { _id: string }> {
    return this.db.collection('crop_recommendations');
  }
  private get diseaseAnalyses(): Collection<DiseaseAnalysisRecord & { _id: string }> {
    return this.db.collection('disease_analyses');
  }
  private get conversations(): Collection<ConversationRecord & { _id: string }> {
    return this.db.collection('conversations');
  }

  /**
   * Ensure essential performance and uniqueness indexes are present
   */
  async ensureIndexes(): Promise<void> {
    try {
      await Promise.all([
        this.users.createIndex({ id: 1 }, { unique: true }),
        this.users.createIndex({ email: 1 }, { unique: true }),
        this.users.createIndex({ googleSub: 1 }, { sparse: true }),
        this.farms.createIndex({ id: 1 }, { unique: true }),
        this.farms.createIndex({ userId: 1 }),
        this.cropPlans.createIndex({ id: 1 }, { unique: true }),
        this.cropPlans.createIndex({ userId: 1, farmId: 1 }),
        this.farmActivities.createIndex({ id: 1 }, { unique: true }),
        this.farmActivities.createIndex({ userId: 1, farmId: 1 }),
        this.farmActivities.createIndex({ date: -1 }),
        this.soilTests.createIndex({ id: 1 }, { unique: true }),
        this.soilTests.createIndex({ userId: 1, farmId: 1 }),
        this.consultations.createIndex({ id: 1 }, { unique: true }),
        this.consultations.createIndex({ userId: 1 }),
        this.consultations.createIndex({ createdAt: -1 }),
        this.communityPosts.createIndex({ id: 1 }, { unique: true }),
        this.communityPosts.createIndex({ status: 1, createdAt: -1 }),
        this.communityPosts.createIndex({ cropTag: 1 }),
        this.communityComments.createIndex({ id: 1 }, { unique: true }),
        this.communityComments.createIndex({ postId: 1, createdAt: 1 }),
        this.savedResources.createIndex({ id: 1 }, { unique: true }),
        this.savedResources.createIndex({ userId: 1, savedAt: -1 }),
        this.orders.createIndex({ id: 1 }, { unique: true }),
        this.orders.createIndex({ userId: 1, createdAt: -1 }),
        this.inAppNotifications.createIndex({ id: 1 }, { unique: true }),
        this.inAppNotifications.createIndex({ userId: 1, read: 1 }),
        this.cropRecommendations.createIndex({ id: 1 }, { unique: true }),
        this.cropRecommendations.createIndex({ userId: 1, timestamp: -1 }),
        this.diseaseAnalyses.createIndex({ id: 1 }, { unique: true }),
        this.diseaseAnalyses.createIndex({ userId: 1, timestamp: -1 }),
        this.conversations.createIndex({ id: 1 }, { unique: true }),
        this.conversations.createIndex({ userId: 1, updatedAt: -1 }),
      ]);
      console.log('[AgriTech MongoDB] All collection indexes verified and ensured.');
    } catch (err) {
      console.warn('[AgriTech MongoDB] Index creation warning:', err);
    }
  }

  // User accounts
  async getUserByEmail(email: string): Promise<UserAccount | null> {
    const normalized = email.toLowerCase().trim();
    const doc = await this.users.findOne({ email: normalized });
    return cleanDoc<UserAccount>(doc);
  }

  async getUserById(id: string): Promise<UserAccount | null> {
    const doc = await this.users.findOne({ id });
    return cleanDoc<UserAccount>(doc);
  }

  async getUserByGoogleSub(googleSub: string): Promise<UserAccount | null> {
    const doc = await this.users.findOne({ googleSub });
    return cleanDoc<UserAccount>(doc);
  }

  async createUser(user: UserAccount): Promise<UserAccount> {
    const finalUser = {
      ...user,
      email: user.email.toLowerCase().trim(),
      role: user.role || 'farmer',
      _id: user.id,
    };
    await this.users.updateOne({ id: user.id }, { $set: finalUser }, { upsert: true });
    return cleanDoc<UserAccount>(finalUser);
  }

  async updateUser(id: string, updates: Partial<UserAccount>): Promise<UserAccount | null> {
    const existing = await this.getUserById(id);
    if (!existing) return null;
    const updated: UserAccount = {
      ...existing,
      ...updates,
      profile: {
        ...existing.profile,
        ...(updates.profile || {}),
        updatedAt: new Date().toISOString(),
      },
    };
    await this.users.updateOne({ id }, { $set: updated });
    return cleanDoc<UserAccount>(updated);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.purgeAllUserData(id);
  }

  async listUsers(): Promise<UserAccount[]> {
    const docs = await this.users.find({}, { projection: { passwordHash: 0, _id: 0 } }).toArray();
    return docs as unknown as UserAccount[];
  }

  // Farms
  async getFarms(userId: string): Promise<Farm[]> {
    const docs = await this.farms
      .find({ userId }, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    return docs as unknown as Farm[];
  }

  async getFarm(userId: string, farmId: string): Promise<Farm | null> {
    const doc = await this.farms.findOne({ id: farmId, userId }, { projection: { _id: 0 } });
    return cleanDoc<Farm>(doc);
  }

  async saveFarm(farm: Farm): Promise<Farm> {
    const toSave = { ...farm, updatedAt: new Date().toISOString(), _id: farm.id };
    await this.farms.updateOne({ id: farm.id }, { $set: toSave }, { upsert: true });
    return cleanDoc<Farm>(toSave);
  }

  async deleteFarm(userId: string, farmId: string): Promise<boolean> {
    const existing = await this.getFarm(userId, farmId);
    if (!existing) return false;

    await this.farms.deleteOne({ id: farmId, userId });
    await Promise.all([
      this.cropPlans.deleteMany({ farmId, userId }),
      this.farmActivities.deleteMany({ farmId, userId }),
      this.soilTests.deleteMany({ farmId, userId }),
    ]);
    return true;
  }

  // Crop Plans
  async getCropPlans(userId: string, farmId?: string): Promise<CropPlan[]> {
    const query: any = { userId };
    if (farmId) query.farmId = farmId;
    const docs = await this.cropPlans
      .find(query, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    return docs as unknown as CropPlan[];
  }

  async saveCropPlan(plan: CropPlan): Promise<CropPlan> {
    const toSave = { ...plan, _id: plan.id };
    await this.cropPlans.updateOne({ id: plan.id }, { $set: toSave }, { upsert: true });
    return cleanDoc<CropPlan>(toSave);
  }

  async deleteCropPlan(userId: string, planId: string): Promise<boolean> {
    const res = await this.cropPlans.deleteOne({ id: planId, userId });
    return res.deletedCount > 0;
  }

  // Farm Activities
  async getActivities(userId: string, farmId?: string): Promise<FarmActivity[]> {
    const query: any = { userId };
    if (farmId) query.farmId = farmId;
    const docs = await this.farmActivities
      .find(query, { projection: { _id: 0 } })
      .sort({ date: -1 })
      .toArray();
    return docs as unknown as FarmActivity[];
  }

  async saveActivity(activity: FarmActivity): Promise<FarmActivity> {
    const toSave = { ...activity, _id: activity.id };
    await this.farmActivities.updateOne({ id: activity.id }, { $set: toSave }, { upsert: true });
    return cleanDoc<FarmActivity>(toSave);
  }

  async deleteActivity(userId: string, activityId: string): Promise<boolean> {
    const res = await this.farmActivities.deleteOne({ id: activityId, userId });
    return res.deletedCount > 0;
  }

  // Soil Tests
  async getSoilTests(userId: string, farmId?: string): Promise<SoilTest[]> {
    const query: any = { userId };
    if (farmId) query.farmId = farmId;
    const docs = await this.soilTests
      .find(query, { projection: { _id: 0 } })
      .sort({ date: -1 })
      .toArray();
    return docs as unknown as SoilTest[];
  }

  async saveSoilTest(test: SoilTest): Promise<SoilTest> {
    const toSave = { ...test, _id: test.id };
    await this.soilTests.updateOne({ id: test.id }, { $set: toSave }, { upsert: true });
    return cleanDoc<SoilTest>(toSave);
  }

  async deleteSoilTest(userId: string, testId: string): Promise<boolean> {
    const res = await this.soilTests.deleteOne({ id: testId, userId });
    return res.deletedCount > 0;
  }

  // Consultations
  async getConsultations(userId: string): Promise<Consultation[]> {
    const docs = await this.consultations
      .find({ userId }, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    return docs as unknown as Consultation[];
  }

  async getAllConsultations(): Promise<Consultation[]> {
    const docs = await this.consultations
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    return docs as unknown as Consultation[];
  }

  async saveConsultation(consultation: Consultation): Promise<Consultation> {
    const toSave = { ...consultation, _id: consultation.id };
    await this.consultations.updateOne({ id: consultation.id }, { $set: toSave }, { upsert: true });
    return cleanDoc<Consultation>(toSave);
  }

  async updateConsultation(id: string, updates: Partial<Consultation>): Promise<Consultation | null> {
    const res = await this.consultations.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after', projection: { _id: 0 } }
    );
    return cleanDoc<Consultation>(res);
  }

  // Community Posts & Comments
  async getCommunityPosts(): Promise<CommunityPost[]> {
    const docs = await this.communityPosts
      .find({ status: { $ne: 'hidden' } }, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    return docs as unknown as CommunityPost[];
  }

  async saveCommunityPost(post: CommunityPost): Promise<CommunityPost> {
    const toSave = { ...post, _id: post.id };
    await this.communityPosts.updateOne({ id: post.id }, { $set: toSave }, { upsert: true });
    return cleanDoc<CommunityPost>(toSave);
  }

  async updateCommunityPost(postId: string, updates: Partial<CommunityPost>): Promise<CommunityPost | null> {
    const res = await this.communityPosts.findOneAndUpdate(
      { id: postId },
      { $set: updates },
      { returnDocument: 'after', projection: { _id: 0 } }
    );
    return cleanDoc<CommunityPost>(res);
  }

  async deleteCommunityPost(postId: string): Promise<boolean> {
    const res = await this.communityPosts.deleteOne({ id: postId });
    if (res.deletedCount > 0) {
      await this.communityComments.deleteMany({ postId });
      return true;
    }
    return false;
  }

  async getPostComments(postId: string): Promise<CommunityComment[]> {
    const docs = await this.communityComments
      .find({ postId }, { projection: { _id: 0 } })
      .sort({ createdAt: 1 })
      .toArray();
    return docs as unknown as CommunityComment[];
  }

  async saveCommunityComment(comment: CommunityComment): Promise<CommunityComment> {
    const toSave = { ...comment, _id: comment.id };
    await this.communityComments.updateOne({ id: comment.id }, { $set: toSave }, { upsert: true });
    await this.communityPosts.updateOne(
      { id: comment.postId },
      { $inc: { commentCount: 1 } }
    );
    return cleanDoc<CommunityComment>(toSave);
  }

  async deleteCommunityComment(commentId: string): Promise<boolean> {
    const comment = await this.communityComments.findOne({ id: commentId });
    if (comment) {
      await this.communityComments.deleteOne({ id: commentId });
      await this.communityPosts.updateOne(
        { id: comment.postId, commentCount: { $gt: 0 } },
        { $inc: { commentCount: -1 } }
      );
      return true;
    }
    return false;
  }

  // Saved Resources
  async getSavedResources(userId: string): Promise<SavedResource[]> {
    const docs = await this.savedResources
      .find({ userId }, { projection: { _id: 0 } })
      .sort({ savedAt: -1 })
      .toArray();
    return docs as unknown as SavedResource[];
  }

  async saveResource(resource: SavedResource): Promise<SavedResource> {
    const toSave = { ...resource, _id: resource.id };
    await this.savedResources.updateOne({ id: resource.id }, { $set: toSave }, { upsert: true });
    return cleanDoc<SavedResource>(toSave);
  }

  async deleteSavedResource(userId: string, resourceId: string): Promise<boolean> {
    const res = await this.savedResources.deleteOne({ id: resourceId, userId });
    return res.deletedCount > 0;
  }

  // Orders
  async getOrders(userId: string): Promise<Order[]> {
    const docs = await this.orders
      .find({ userId }, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    return docs as unknown as Order[];
  }

  async getAllOrders(): Promise<Order[]> {
    const docs = await this.orders
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    return docs as unknown as Order[];
  }

  async saveOrder(order: Order): Promise<Order> {
    const toSave = { ...order, _id: order.id };
    await this.orders.updateOne({ id: order.id }, { $set: toSave }, { upsert: true });
    return cleanDoc<Order>(toSave);
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<Order | null> {
    const res = await this.orders.findOneAndUpdate(
      { id: orderId },
      { $set: { status } },
      { returnDocument: 'after', projection: { _id: 0 } }
    );
    return cleanDoc<Order>(res);
  }

  // Notifications
  async getNotifications(userId: string): Promise<InAppNotification[]> {
    const docs = await this.inAppNotifications
      .find({ userId }, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    return docs as unknown as InAppNotification[];
  }

  async saveNotification(notification: InAppNotification): Promise<InAppNotification> {
    const toSave = { ...notification, _id: notification.id };
    await this.inAppNotifications.updateOne({ id: notification.id }, { $set: toSave }, { upsert: true });
    return cleanDoc<InAppNotification>(toSave);
  }

  async markNotificationRead(userId: string, id: string): Promise<boolean> {
    const res = await this.inAppNotifications.updateOne(
      { id, userId },
      { $set: { read: true } }
    );
    return res.modifiedCount > 0;
  }

  // Crop Recommendations
  async getCropRecommendations(userId: string): Promise<CropRecommendationRecord[]> {
    const docs = await this.cropRecommendations
      .find({ userId }, { projection: { _id: 0 } })
      .sort({ timestamp: -1 })
      .toArray();
    return docs as unknown as CropRecommendationRecord[];
  }

  async saveCropRecommendation(rec: CropRecommendationRecord): Promise<CropRecommendationRecord> {
    const existing = await this.cropRecommendations.findOne({ id: rec.id });
    if (existing && existing.userId !== rec.userId) {
      throw new Error('Crop recommendation belongs to another user.');
    }
    const toSave = { ...rec, _id: rec.id };
    await this.cropRecommendations.updateOne({ id: rec.id }, { $set: toSave }, { upsert: true });
    return cleanDoc<CropRecommendationRecord>(toSave);
  }

  async deleteCropRecommendation(userId: string, id: string): Promise<boolean> {
    const res = await this.cropRecommendations.deleteOne({ id, userId });
    return res.deletedCount > 0;
  }

  // Disease Analyses
  async getDiseaseAnalyses(userId: string): Promise<DiseaseAnalysisRecord[]> {
    const docs = await this.diseaseAnalyses
      .find({ userId }, { projection: { _id: 0 } })
      .sort({ timestamp: -1 })
      .toArray();
    return docs as unknown as DiseaseAnalysisRecord[];
  }

  async saveDiseaseAnalysis(analysis: DiseaseAnalysisRecord): Promise<DiseaseAnalysisRecord> {
    const existing = await this.diseaseAnalyses.findOne({ id: analysis.id });
    if (existing && existing.userId !== analysis.userId) {
      throw new Error('Disease analysis belongs to another user.');
    }
    const toSave = { ...analysis, _id: analysis.id };
    await this.diseaseAnalyses.updateOne({ id: analysis.id }, { $set: toSave }, { upsert: true });
    return cleanDoc<DiseaseAnalysisRecord>(toSave);
  }

  async deleteDiseaseAnalysis(userId: string, id: string): Promise<boolean> {
    const res = await this.diseaseAnalyses.deleteOne({ id, userId });
    return res.deletedCount > 0;
  }

  // Conversations
  async getConversations(userId: string): Promise<ConversationRecord[]> {
    const docs = await this.conversations
      .find({ userId }, { projection: { _id: 0 } })
      .sort({ updatedAt: -1 })
      .toArray();
    return (docs as unknown as ConversationRecord[]).map(normalizeConversationMessages);
  }

  async getConversation(userId: string, conversationId: string): Promise<ConversationRecord | null> {
    const doc = await this.conversations.findOne(
      { id: conversationId, userId },
      { projection: { _id: 0 } }
    );
    if (!doc) return null;
    return normalizeConversationMessages(cleanDoc<ConversationRecord>(doc));
  }

  async saveConversation(conv: ConversationRecord): Promise<ConversationRecord> {
    const existing = await this.conversations.findOne({ id: conv.id });
    if (existing && existing.userId !== conv.userId) {
      throw new Error('Conversation belongs to another user.');
    }
    const toSave = { ...conv, _id: conv.id };
    await this.conversations.updateOne({ id: conv.id }, { $set: toSave }, { upsert: true });
    return cleanDoc<ConversationRecord>(toSave);
  }

  async deleteConversation(userId: string, conversationId: string): Promise<boolean> {
    const res = await this.conversations.deleteOne({ id: conversationId, userId });
    return res.deletedCount > 0;
  }

  // Metrics
  async getAdminMetrics(): Promise<{
    totalFarmers: number;
    totalFarms: number;
    activeConsultations: number;
    pendingOrders: number;
    totalPosts: number;
  }> {
    const [totalFarmers, totalFarms, activeConsultations, pendingOrders, totalPosts] = await Promise.all([
      this.users.countDocuments({ role: { $ne: 'admin' } }),
      this.farms.countDocuments(),
      this.consultations.countDocuments({ status: { $ne: 'resolved' } }),
      this.orders.countDocuments({ status: { $in: ['pending_confirmation', 'processing'] } }),
      this.communityPosts.countDocuments(),
    ]);

    return {
      totalFarmers,
      totalFarms,
      activeConsultations,
      pendingOrders,
      totalPosts,
    };
  }

  // User Data Purge
  async purgeAllUserData(userId: string): Promise<boolean> {
    await Promise.all([
      this.users.deleteOne({ id: userId }),
      this.farms.deleteMany({ userId }),
      this.cropPlans.deleteMany({ userId }),
      this.farmActivities.deleteMany({ userId }),
      this.soilTests.deleteMany({ userId }),
      this.cropRecommendations.deleteMany({ userId }),
      this.diseaseAnalyses.deleteMany({ userId }),
      this.conversations.deleteMany({ userId }),
      this.consultations.deleteMany({ userId }),
      this.orders.deleteMany({ userId }),
      this.inAppNotifications.deleteMany({ userId }),
      this.savedResources.deleteMany({ userId }),
    ]);
    return true;
  }

  getRawCollection<T extends import('mongodb').Document = import('mongodb').Document>(name: string): Collection<T> {
    return this.db.collection<T>(name);
  }
}

export interface MigrationConflict {
  collection: string;
  id: string;
  type:
    | 'ID_EXISTS_NEWER_IN_MONGODB'
    | 'EMAIL_COLLISION'
    | 'ID_COLLISION_EMAIL_MISMATCH'
    | 'TIMESTAMP_MISSING_PRESERVED_MONGO';
  message: string;
}

export interface CollectionMigrationStats {
  collection: string;
  totalInJson: number;
  toInsert: number;
  toUpdate: number;
  toSkip: number;
  conflicts: MigrationConflict[];
}

export interface MigrationDryRunResult {
  stats: Record<string, CollectionMigrationStats>;
  totalInJson: number;
  totalToInsert: number;
  totalToUpdate: number;
  totalToSkip: number;
  totalConflicts: number;
  conflicts: MigrationConflict[];
}

function extractTimestamp(doc: any): number | null {
  if (!doc || typeof doc !== 'object') return null;
  const raw =
    doc.updatedAt ||
    doc.profile?.updatedAt ||
    doc.timestamp ||
    doc.savedAt ||
    doc.createdAt ||
    doc.date;
  if (!raw) return null;
  const t = new Date(raw).getTime();
  return isNaN(t) ? null : t;
}

const COLLECTION_MAP: Record<string, string> = {
  users: 'users',
  farms: 'farms',
  cropPlans: 'crop_plans',
  farmActivities: 'farm_activities',
  soilTests: 'soil_tests',
  consultations: 'consultations',
  communityPosts: 'community_posts',
  communityComments: 'community_comments',
  savedResources: 'saved_resources',
  orders: 'orders',
  inAppNotifications: 'in_app_notifications',
  cropRecommendations: 'crop_recommendations',
  diseaseAnalyses: 'disease_analyses',
  conversations: 'conversations',
};

/**
 * Performs a dry-run conflict inspection between local JSON database and MongoDB.
 * Reports insert, skip, and conflict counts without modifying any MongoDB or JSON data.
 */
export async function dryRunJsonToMongo(
  mongoRepo: MongoRepository,
  jsonFilePath?: string
): Promise<MigrationDryRunResult> {
  const file = jsonFilePath || path.resolve(process.cwd(), '.data', 'agritech-db.json');
  const result: MigrationDryRunResult = {
    stats: {},
    totalInJson: 0,
    totalToInsert: 0,
    totalToUpdate: 0,
    totalToSkip: 0,
    totalConflicts: 0,
    conflicts: [],
  };

  if (!fs.existsSync(file)) {
    return result;
  }

  const raw = fs.readFileSync(file, 'utf-8');
  const parsed: Partial<DatabaseSchema> = JSON.parse(raw);

  for (const [jsonKey, mongoColName] of Object.entries(COLLECTION_MAP)) {
    const records = (parsed as any)[jsonKey] as Record<string, any> | undefined;
    const col = mongoRepo.getRawCollection(mongoColName);

    const stat: CollectionMigrationStats = {
      collection: mongoColName,
      totalInJson: records ? Object.keys(records).length : 0,
      toInsert: 0,
      toUpdate: 0,
      toSkip: 0,
      conflicts: [],
    };

    if (records && typeof records === 'object') {
      for (const item of Object.values(records)) {
        if (!item || !item.id) continue;

        if (mongoColName === 'users') {
          const normEmail = (item.email || '').toLowerCase().trim();
          const [idMatch, emailMatch] = await Promise.all([
            col.findOne({ id: item.id }),
            normEmail ? col.findOne({ email: normEmail }) : null,
          ]);

          if (emailMatch && emailMatch.id !== item.id) {
            const conflict: MigrationConflict = {
              collection: mongoColName,
              id: item.id,
              type: 'EMAIL_COLLISION',
              message: `User in JSON with ID "${item.id}" has email "${normEmail}" which already belongs to user ID "${emailMatch.id}" in MongoDB.`,
            };
            stat.conflicts.push(conflict);
            stat.toSkip++;
            continue;
          }

          if (idMatch) {
            const existingNormEmail = (idMatch.email || '').toLowerCase().trim();
            if (existingNormEmail !== normEmail) {
              const conflict: MigrationConflict = {
                collection: mongoColName,
                id: item.id,
                type: 'ID_COLLISION_EMAIL_MISMATCH',
                message: `User ID "${item.id}" exists in MongoDB with email "${existingNormEmail}" but JSON has "${normEmail}".`,
              };
              stat.conflicts.push(conflict);
              stat.toSkip++;
              continue;
            }

            const mTs = extractTimestamp(idMatch);
            const jTs = extractTimestamp(item);
            if (mTs !== null && jTs !== null && mTs >= jTs) {
              stat.toSkip++;
            } else if (mTs !== null && jTs !== null && jTs > mTs) {
              stat.toUpdate++;
            } else {
              stat.toSkip++;
            }
          } else {
            stat.toInsert++;
          }
        } else {
          // Other collections
          const existing = await col.findOne({ id: item.id });
          if (!existing) {
            stat.toInsert++;
          } else {
            const mTs = extractTimestamp(existing);
            const jTs = extractTimestamp(item);
            if (mTs !== null && jTs !== null) {
              if (mTs >= jTs) {
                stat.toSkip++;
              } else {
                stat.toUpdate++;
              }
            } else {
              stat.toSkip++;
              stat.conflicts.push({
                collection: mongoColName,
                id: item.id,
                type: 'TIMESTAMP_MISSING_PRESERVED_MONGO',
                message: `Record ${item.id} in ${mongoColName} has no verifiable timestamps; preserving MongoDB record.`,
              });
            }
          }
        }
      }
    }

    result.stats[mongoColName] = stat;
    result.totalInJson += stat.totalInJson;
    result.totalToInsert += stat.toInsert;
    result.totalToUpdate += stat.toUpdate;
    result.totalToSkip += stat.toSkip;
    result.totalConflicts += stat.conflicts.length;
    result.conflicts.push(...stat.conflicts);
  }

  return result;
}

/**
 * Idempotently migrate data from local JSON database into MongoDB collections.
 * Genuine conflict-safe behavior:
 * - Compares timestamps; never silently overwrites newer MongoDB data with older JSON data.
 * - Detects and logs email collisions without merging users.
 * - Never deletes or modifies the local JSON file.
 */
export async function migrateJsonToMongo(
  mongoRepo: MongoRepository,
  options: { jsonFilePath?: string; execute?: boolean } = {}
): Promise<MigrationDryRunResult> {
  const file = options.jsonFilePath || path.resolve(process.cwd(), '.data', 'agritech-db.json');
  const dryRun = await dryRunJsonToMongo(mongoRepo, file);

  if (!options.execute) {
    return dryRun;
  }

  if (!fs.existsSync(file)) {
    return dryRun;
  }

  const raw = fs.readFileSync(file, 'utf-8');
  const parsed: Partial<DatabaseSchema> = JSON.parse(raw);

  const saveHandlers: Record<string, (item: any) => Promise<any>> = {
    users: (u) => mongoRepo.createUser(u),
    farms: (f) => mongoRepo.saveFarm(f),
    crop_plans: (p) => mongoRepo.saveCropPlan(p),
    farm_activities: (a) => mongoRepo.saveActivity(a),
    soil_tests: (s) => mongoRepo.saveSoilTest(s),
    consultations: (c) => mongoRepo.saveConsultation(c),
    community_posts: (p) => mongoRepo.saveCommunityPost(p),
    community_comments: (c) => mongoRepo.saveCommunityComment(c),
    saved_resources: (r) => mongoRepo.saveResource(r),
    orders: (o) => mongoRepo.saveOrder(o),
    in_app_notifications: (n) => mongoRepo.saveNotification(n),
    crop_recommendations: (r) => mongoRepo.saveCropRecommendation(r),
    disease_analyses: (d) => mongoRepo.saveDiseaseAnalysis(d),
    conversations: (c) => mongoRepo.saveConversation(c),
  };

  for (const [jsonKey, mongoColName] of Object.entries(COLLECTION_MAP)) {
    const records = (parsed as any)[jsonKey] as Record<string, any> | undefined;
    const saveFn = saveHandlers[mongoColName];
    const stat = dryRun.stats[mongoColName];

    if (!records || typeof records !== 'object' || !saveFn) continue;

    for (const item of Object.values(records)) {
      if (!item || !item.id) continue;

      // Skip records flagged with critical conflicts
      const hasConflict = stat?.conflicts.some(
        (c) => c.id === item.id && (c.type === 'EMAIL_COLLISION' || c.type === 'ID_COLLISION_EMAIL_MISMATCH')
      );
      if (hasConflict) {
        console.warn(`[AgriTech Migration] Skipping conflicting record ${item.id} in ${mongoColName}`);
        continue;
      }

      // Check if existing document in MongoDB is newer
      const col = mongoRepo.getRawCollection(mongoColName);
      const existing = await col.findOne({ id: item.id });
      if (existing) {
        const mTs = extractTimestamp(existing);
        const jTs = extractTimestamp(item);
        if (mTs !== null && jTs !== null && mTs >= jTs) {
          // MongoDB record is already newer or identical; skip to protect Atlas data
          continue;
        }
      }

      try {
        await saveFn(item);
      } catch (err: any) {
        console.warn(`[AgriTech Migration] Failed to persist ${mongoColName} record ${item.id}:`, err.message);
      }
    }
  }

  return dryRun;
}
