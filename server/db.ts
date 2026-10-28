import fs from 'fs';
import path from 'path';
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

export interface DatabaseSchema {
  users: Record<string, UserAccount>;
  farms: Record<string, Farm>;
  cropPlans: Record<string, CropPlan>;
  farmActivities: Record<string, FarmActivity>;
  soilTests: Record<string, SoilTest>;
  consultations: Record<string, Consultation>;
  communityPosts: Record<string, CommunityPost>;
  communityComments: Record<string, CommunityComment>;
  savedResources: Record<string, SavedResource>;
  orders: Record<string, Order>;
  inAppNotifications: Record<string, InAppNotification>;
  cropRecommendations: Record<string, CropRecommendationRecord>;
  diseaseAnalyses: Record<string, DiseaseAnalysisRecord>;
  conversations: Record<string, ConversationRecord>;
}

export interface IRepository {
  getUserByEmail(email: string): Promise<UserAccount | null>;
  getUserById(id: string): Promise<UserAccount | null>;
  getUserByGoogleSub(googleSub: string): Promise<UserAccount | null>;
  createUser(user: UserAccount): Promise<UserAccount>;
  updateUser(id: string, updates: Partial<UserAccount>): Promise<UserAccount | null>;
  deleteUser(id: string): Promise<boolean>;
  listUsers(): Promise<UserAccount[]>;

  getFarms(userId: string): Promise<Farm[]>;
  getFarm(userId: string, farmId: string): Promise<Farm | null>;
  saveFarm(farm: Farm): Promise<Farm>;
  deleteFarm(userId: string, farmId: string): Promise<boolean>;

  getCropPlans(userId: string, farmId?: string): Promise<CropPlan[]>;
  saveCropPlan(plan: CropPlan): Promise<CropPlan>;
  deleteCropPlan(userId: string, planId: string): Promise<boolean>;

  getActivities(userId: string, farmId?: string): Promise<FarmActivity[]>;
  saveActivity(activity: FarmActivity): Promise<FarmActivity>;
  deleteActivity(userId: string, activityId: string): Promise<boolean>;

  getSoilTests(userId: string, farmId?: string): Promise<SoilTest[]>;
  saveSoilTest(test: SoilTest): Promise<SoilTest>;
  deleteSoilTest(userId: string, testId: string): Promise<boolean>;

  getConsultations(userId: string): Promise<Consultation[]>;
  getAllConsultations(): Promise<Consultation[]>;
  saveConsultation(consultation: Consultation): Promise<Consultation>;
  updateConsultation(id: string, updates: Partial<Consultation>): Promise<Consultation | null>;

  getCommunityPosts(): Promise<CommunityPost[]>;
  saveCommunityPost(post: CommunityPost): Promise<CommunityPost>;
  updateCommunityPost(postId: string, updates: Partial<CommunityPost>): Promise<CommunityPost | null>;
  deleteCommunityPost(postId: string): Promise<boolean>;
  getPostComments(postId: string): Promise<CommunityComment[]>;
  saveCommunityComment(comment: CommunityComment): Promise<CommunityComment>;
  deleteCommunityComment(commentId: string): Promise<boolean>;

  getSavedResources(userId: string): Promise<SavedResource[]>;
  saveResource(resource: SavedResource): Promise<SavedResource>;
  deleteSavedResource(userId: string, resourceId: string): Promise<boolean>;

  getOrders(userId: string): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  saveOrder(order: Order): Promise<Order>;
  updateOrderStatus(orderId: string, status: Order['status']): Promise<Order | null>;

  getNotifications(userId: string): Promise<InAppNotification[]>;
  saveNotification(notification: InAppNotification): Promise<InAppNotification>;
  markNotificationRead(userId: string, id: string): Promise<boolean>;

  getCropRecommendations(userId: string): Promise<CropRecommendationRecord[]>;
  saveCropRecommendation(rec: CropRecommendationRecord): Promise<CropRecommendationRecord>;
  deleteCropRecommendation(userId: string, id: string): Promise<boolean>;

  getDiseaseAnalyses(userId: string): Promise<DiseaseAnalysisRecord[]>;
  saveDiseaseAnalysis(analysis: DiseaseAnalysisRecord): Promise<DiseaseAnalysisRecord>;
  deleteDiseaseAnalysis(userId: string, id: string): Promise<boolean>;

  getConversations(userId: string): Promise<ConversationRecord[]>;
  getConversation(userId: string, conversationId: string): Promise<ConversationRecord | null>;
  saveConversation(conv: ConversationRecord): Promise<ConversationRecord>;
  deleteConversation(userId: string, conversationId: string): Promise<boolean>;

  getAdminMetrics(): Promise<{
    totalFarmers: number;
    totalFarms: number;
    activeConsultations: number;
    pendingOrders: number;
    totalPosts: number;
  }>;

  purgeAllUserData(userId: string): Promise<boolean>;
}

function normalizeConversationMessages(conversation: ConversationRecord): ConversationRecord {
  return {
    ...conversation,
    messages: conversation.messages.map((message) => {
      const role = message.role ?? message.sender ?? 'user';
      return { ...message, role, sender: message.sender ?? role };
    }),
  };
}

export class JsonFileRepository implements IRepository {
  private filePath: string;
  private data: DatabaseSchema;
  private isLoaded: boolean = false;

  constructor(filePath?: string) {
    this.filePath = filePath || path.resolve(process.cwd(), '.data', 'agritech-db.json');
    this.data = {
      users: {},
      farms: {},
      cropPlans: {},
      farmActivities: {},
      soilTests: {},
      consultations: {},
      communityPosts: {},
      communityComments: {},
      savedResources: {},
      orders: {},
      inAppNotifications: {},
      cropRecommendations: {},
      diseaseAnalyses: {},
      conversations: {},
    };
    this.load();
  }

  private load(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users || {},
          farms: parsed.farms || {},
          cropPlans: parsed.cropPlans || {},
          farmActivities: parsed.farmActivities || {},
          soilTests: parsed.soilTests || {},
          consultations: parsed.consultations || {},
          communityPosts: parsed.communityPosts || {},
          communityComments: parsed.communityComments || {},
          savedResources: parsed.savedResources || {},
          orders: parsed.orders || {},
          inAppNotifications: parsed.inAppNotifications || {},
          cropRecommendations: parsed.cropRecommendations || {},
          diseaseAnalyses: parsed.diseaseAnalyses || {},
          conversations: parsed.conversations || {},
        };
      } else {
        this.persist();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('Error loading repository file, initializing empty state:', err);
      this.isLoaded = true;
    }
  }

  private persist(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to file:', err);
    }
  }

  async getUserByEmail(email: string): Promise<UserAccount | null> {
    const normalized = email.toLowerCase().trim();
    for (const user of Object.values(this.data.users)) {
      if (user.email.toLowerCase().trim() === normalized) {
        return { ...user };
      }
    }
    return null;
  }

  async getUserById(id: string): Promise<UserAccount | null> {
    const user = this.data.users[id];
    return user ? { ...user } : null;
  }

  async getUserByGoogleSub(googleSub: string): Promise<UserAccount | null> {
    for (const user of Object.values(this.data.users)) {
      if (user.googleSub === googleSub) {
        return { ...user };
      }
    }
    return null;
  }

  async createUser(user: UserAccount): Promise<UserAccount> {
    const finalUser = {
      ...user,
      role: user.role || 'farmer',
    };
    this.data.users[user.id] = finalUser;
    this.persist();
    return { ...finalUser };
  }

  async updateUser(id: string, updates: Partial<UserAccount>): Promise<UserAccount | null> {
    const existing = this.data.users[id];
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      profile: {
        ...existing.profile,
        ...(updates.profile || {}),
        updatedAt: new Date().toISOString(),
      },
    };
    this.data.users[id] = updated;
    this.persist();
    return { ...updated };
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.purgeAllUserData(id);
  }

  async listUsers(): Promise<UserAccount[]> {
    return Object.values(this.data.users).map((u) => {
      const { passwordHash, ...safe } = u;
      return safe as UserAccount;
    });
  }

  async getFarms(userId: string): Promise<Farm[]> {
    return Object.values(this.data.farms)
      .filter((f) => f.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getFarm(userId: string, farmId: string): Promise<Farm | null> {
    const farm = this.data.farms[farmId];
    if (farm && farm.userId === userId) {
      return { ...farm };
    }
    return null;
  }

  async saveFarm(farm: Farm): Promise<Farm> {
    this.data.farms[farm.id] = { ...farm, updatedAt: new Date().toISOString() };
    this.persist();
    return { ...farm };
  }

  async deleteFarm(userId: string, farmId: string): Promise<boolean> {
    const farm = this.data.farms[farmId];
    if (farm && farm.userId === userId) {
      delete this.data.farms[farmId];
      for (const [id, p] of Object.entries(this.data.cropPlans)) {
        if (p.farmId === farmId) delete this.data.cropPlans[id];
      }
      for (const [id, a] of Object.entries(this.data.farmActivities)) {
        if (a.farmId === farmId) delete this.data.farmActivities[id];
      }
      for (const [id, s] of Object.entries(this.data.soilTests)) {
        if (s.farmId === farmId) delete this.data.soilTests[id];
      }
      this.persist();
      return true;
    }
    return false;
  }

  async getCropPlans(userId: string, farmId?: string): Promise<CropPlan[]> {
    return Object.values(this.data.cropPlans)
      .filter((p) => p.userId === userId && (!farmId || p.farmId === farmId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async saveCropPlan(plan: CropPlan): Promise<CropPlan> {
    this.data.cropPlans[plan.id] = { ...plan };
    this.persist();
    return { ...plan };
  }

  async deleteCropPlan(userId: string, planId: string): Promise<boolean> {
    const plan = this.data.cropPlans[planId];
    if (plan && plan.userId === userId) {
      delete this.data.cropPlans[planId];
      this.persist();
      return true;
    }
    return false;
  }

  async getActivities(userId: string, farmId?: string): Promise<FarmActivity[]> {
    return Object.values(this.data.farmActivities)
      .filter((a) => a.userId === userId && (!farmId || a.farmId === farmId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async saveActivity(activity: FarmActivity): Promise<FarmActivity> {
    this.data.farmActivities[activity.id] = { ...activity };
    this.persist();
    return { ...activity };
  }

  async deleteActivity(userId: string, activityId: string): Promise<boolean> {
    const act = this.data.farmActivities[activityId];
    if (act && act.userId === userId) {
      delete this.data.farmActivities[activityId];
      this.persist();
      return true;
    }
    return false;
  }

  async getSoilTests(userId: string, farmId?: string): Promise<SoilTest[]> {
    return Object.values(this.data.soilTests)
      .filter((s) => s.userId === userId && (!farmId || s.farmId === farmId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async saveSoilTest(test: SoilTest): Promise<SoilTest> {
    this.data.soilTests[test.id] = { ...test };
    this.persist();
    return { ...test };
  }

  async deleteSoilTest(userId: string, testId: string): Promise<boolean> {
    const t = this.data.soilTests[testId];
    if (t && t.userId === userId) {
      delete this.data.soilTests[testId];
      this.persist();
      return true;
    }
    return false;
  }

  async getConsultations(userId: string): Promise<Consultation[]> {
    return Object.values(this.data.consultations)
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllConsultations(): Promise<Consultation[]> {
    return Object.values(this.data.consultations).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async saveConsultation(consultation: Consultation): Promise<Consultation> {
    this.data.consultations[consultation.id] = { ...consultation };
    this.persist();
    return { ...consultation };
  }

  async updateConsultation(id: string, updates: Partial<Consultation>): Promise<Consultation | null> {
    const existing = this.data.consultations[id];
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.data.consultations[id] = updated;
    this.persist();
    return { ...updated };
  }

  async getCommunityPosts(): Promise<CommunityPost[]> {
    return Object.values(this.data.communityPosts)
      .filter((p) => p.status !== 'hidden')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async saveCommunityPost(post: CommunityPost): Promise<CommunityPost> {
    this.data.communityPosts[post.id] = { ...post };
    this.persist();
    return { ...post };
  }

  async updateCommunityPost(postId: string, updates: Partial<CommunityPost>): Promise<CommunityPost | null> {
    const post = this.data.communityPosts[postId];
    if (!post) return null;
    const updated = { ...post, ...updates };
    this.data.communityPosts[postId] = updated;
    this.persist();
    return { ...updated };
  }

  async deleteCommunityPost(postId: string): Promise<boolean> {
    if (this.data.communityPosts[postId]) {
      delete this.data.communityPosts[postId];
      for (const [id, c] of Object.entries(this.data.communityComments)) {
        if (c.postId === postId) delete this.data.communityComments[id];
      }
      this.persist();
      return true;
    }
    return false;
  }

  async getPostComments(postId: string): Promise<CommunityComment[]> {
    return Object.values(this.data.communityComments)
      .filter((c) => c.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async saveCommunityComment(comment: CommunityComment): Promise<CommunityComment> {
    this.data.communityComments[comment.id] = { ...comment };
    if (this.data.communityPosts[comment.postId]) {
      this.data.communityPosts[comment.postId].commentCount =
        (this.data.communityPosts[comment.postId].commentCount || 0) + 1;
    }
    this.persist();
    return { ...comment };
  }

  async deleteCommunityComment(commentId: string): Promise<boolean> {
    const comment = this.data.communityComments[commentId];
    if (comment) {
      const postId = comment.postId;
      delete this.data.communityComments[commentId];
      if (this.data.communityPosts[postId] && this.data.communityPosts[postId].commentCount > 0) {
        this.data.communityPosts[postId].commentCount -= 1;
      }
      this.persist();
      return true;
    }
    return false;
  }

  async getSavedResources(userId: string): Promise<SavedResource[]> {
    return Object.values(this.data.savedResources)
      .filter((r) => r.userId === userId)
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }

  async saveResource(resource: SavedResource): Promise<SavedResource> {
    this.data.savedResources[resource.id] = { ...resource };
    this.persist();
    return { ...resource };
  }

  async deleteSavedResource(userId: string, resourceId: string): Promise<boolean> {
    const r = this.data.savedResources[resourceId];
    if (r && r.userId === userId) {
      delete this.data.savedResources[resourceId];
      this.persist();
      return true;
    }
    return false;
  }

  async getOrders(userId: string): Promise<Order[]> {
    return Object.values(this.data.orders)
      .filter((o) => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllOrders(): Promise<Order[]> {
    return Object.values(this.data.orders).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async saveOrder(order: Order): Promise<Order> {
    this.data.orders[order.id] = { ...order };
    this.persist();
    return { ...order };
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<Order | null> {
    const order = this.data.orders[orderId];
    if (!order) return null;
    order.status = status;
    this.persist();
    return { ...order };
  }

  async getNotifications(userId: string): Promise<InAppNotification[]> {
    return Object.values(this.data.inAppNotifications)
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async saveNotification(notification: InAppNotification): Promise<InAppNotification> {
    this.data.inAppNotifications[notification.id] = { ...notification };
    this.persist();
    return { ...notification };
  }

  async markNotificationRead(userId: string, id: string): Promise<boolean> {
    const notif = this.data.inAppNotifications[id];
    if (notif && notif.userId === userId) {
      notif.read = true;
      this.persist();
      return true;
    }
    return false;
  }

  async getCropRecommendations(userId: string): Promise<CropRecommendationRecord[]> {
    return Object.values(this.data.cropRecommendations)
      .filter((rec) => rec.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async saveCropRecommendation(rec: CropRecommendationRecord): Promise<CropRecommendationRecord> {
    const existing = this.data.cropRecommendations[rec.id];
    if (existing && existing.userId !== rec.userId) throw new Error('Crop recommendation belongs to another user.');
    this.data.cropRecommendations[rec.id] = { ...rec };
    this.persist();
    return { ...rec };
  }

  async deleteCropRecommendation(userId: string, id: string): Promise<boolean> {
    const rec = this.data.cropRecommendations[id];
    if (rec && rec.userId === userId) {
      delete this.data.cropRecommendations[id];
      this.persist();
      return true;
    }
    return false;
  }

  async getDiseaseAnalyses(userId: string): Promise<DiseaseAnalysisRecord[]> {
    return Object.values(this.data.diseaseAnalyses)
      .filter((rec) => rec.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async saveDiseaseAnalysis(analysis: DiseaseAnalysisRecord): Promise<DiseaseAnalysisRecord> {
    const existing = this.data.diseaseAnalyses[analysis.id];
    if (existing && existing.userId !== analysis.userId) throw new Error('Disease analysis belongs to another user.');
    this.data.diseaseAnalyses[analysis.id] = { ...analysis };
    this.persist();
    return { ...analysis };
  }

  async deleteDiseaseAnalysis(userId: string, id: string): Promise<boolean> {
    const rec = this.data.diseaseAnalyses[id];
    if (rec && rec.userId === userId) {
      delete this.data.diseaseAnalyses[id];
      this.persist();
      return true;
    }
    return false;
  }

  async getConversations(userId: string): Promise<ConversationRecord[]> {
    return Object.values(this.data.conversations)
      .filter((conv) => conv.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map(normalizeConversationMessages);
  }

  async getConversation(userId: string, conversationId: string): Promise<ConversationRecord | null> {
    const conv = this.data.conversations[conversationId];
    if (conv && conv.userId === userId) {
      return normalizeConversationMessages(conv);
    }
    return null;
  }

  async saveConversation(conv: ConversationRecord): Promise<ConversationRecord> {
    const existing = this.data.conversations[conv.id];
    if (existing && existing.userId !== conv.userId) throw new Error('Conversation belongs to another user.');
    this.data.conversations[conv.id] = { ...conv };
    this.persist();
    return { ...conv };
  }

  async deleteConversation(userId: string, conversationId: string): Promise<boolean> {
    const conv = this.data.conversations[conversationId];
    if (conv && conv.userId === userId) {
      delete this.data.conversations[conversationId];
      this.persist();
      return true;
    }
    return false;
  }

  async getAdminMetrics(): Promise<{
    totalFarmers: number;
    totalFarms: number;
    activeConsultations: number;
    pendingOrders: number;
    totalPosts: number;
  }> {
    const totalFarmers = Object.values(this.data.users).filter((u) => u.role !== 'admin').length;
    const totalFarms = Object.keys(this.data.farms).length;
    const activeConsultations = Object.values(this.data.consultations).filter(
      (c) => c.status !== 'resolved'
    ).length;
    const pendingOrders = Object.values(this.data.orders).filter(
      (o) => o.status === 'pending_confirmation' || o.status === 'processing'
    ).length;
    const totalPosts = Object.keys(this.data.communityPosts).length;

    return {
      totalFarmers,
      totalFarms,
      activeConsultations,
      pendingOrders,
      totalPosts,
    };
  }

  async purgeAllUserData(userId: string): Promise<boolean> {
    delete this.data.users[userId];

    for (const [id, f] of Object.entries(this.data.farms)) {
      if (f.userId === userId) delete this.data.farms[id];
    }
    for (const [id, p] of Object.entries(this.data.cropPlans)) {
      if (p.userId === userId) delete this.data.cropPlans[id];
    }
    for (const [id, a] of Object.entries(this.data.farmActivities)) {
      if (a.userId === userId) delete this.data.farmActivities[id];
    }
    for (const [id, s] of Object.entries(this.data.soilTests)) {
      if (s.userId === userId) delete this.data.soilTests[id];
    }
    for (const [id, rec] of Object.entries(this.data.cropRecommendations)) {
      if (rec.userId === userId) delete this.data.cropRecommendations[id];
    }
    for (const [id, rec] of Object.entries(this.data.diseaseAnalyses)) {
      if (rec.userId === userId) delete this.data.diseaseAnalyses[id];
    }
    for (const [id, rec] of Object.entries(this.data.conversations)) {
      if (rec.userId === userId) delete this.data.conversations[id];
    }
    for (const [id, c] of Object.entries(this.data.consultations)) {
      if (c.userId === userId) delete this.data.consultations[id];
    }
    for (const [id, o] of Object.entries(this.data.orders)) {
      if (o.userId === userId) delete this.data.orders[id];
    }
    for (const [id, n] of Object.entries(this.data.inAppNotifications)) {
      if (n.userId === userId) delete this.data.inAppNotifications[id];
    }

    this.persist();
    return true;
  }
}

export class DelegatingRepository implements IRepository {
  private activeRepo: IRepository;

  constructor(initialRepo: IRepository) {
    this.activeRepo = initialRepo;
  }

  setActiveRepository(repo: IRepository): void {
    this.activeRepo = repo;
  }

  getActiveRepository(): IRepository {
    return this.activeRepo;
  }

  getUserByEmail(email: string): Promise<UserAccount | null> {
    return this.activeRepo.getUserByEmail(email);
  }
  getUserById(id: string): Promise<UserAccount | null> {
    return this.activeRepo.getUserById(id);
  }
  getUserByGoogleSub(googleSub: string): Promise<UserAccount | null> {
    return this.activeRepo.getUserByGoogleSub(googleSub);
  }
  createUser(user: UserAccount): Promise<UserAccount> {
    return this.activeRepo.createUser(user);
  }
  updateUser(id: string, updates: Partial<UserAccount>): Promise<UserAccount | null> {
    return this.activeRepo.updateUser(id, updates);
  }
  deleteUser(id: string): Promise<boolean> {
    return this.activeRepo.deleteUser(id);
  }
  listUsers(): Promise<UserAccount[]> {
    return this.activeRepo.listUsers();
  }

  getFarms(userId: string): Promise<Farm[]> {
    return this.activeRepo.getFarms(userId);
  }
  getFarm(userId: string, farmId: string): Promise<Farm | null> {
    return this.activeRepo.getFarm(userId, farmId);
  }
  saveFarm(farm: Farm): Promise<Farm> {
    return this.activeRepo.saveFarm(farm);
  }
  deleteFarm(userId: string, farmId: string): Promise<boolean> {
    return this.activeRepo.deleteFarm(userId, farmId);
  }

  getCropPlans(userId: string, farmId?: string): Promise<CropPlan[]> {
    return this.activeRepo.getCropPlans(userId, farmId);
  }
  saveCropPlan(plan: CropPlan): Promise<CropPlan> {
    return this.activeRepo.saveCropPlan(plan);
  }
  deleteCropPlan(userId: string, planId: string): Promise<boolean> {
    return this.activeRepo.deleteCropPlan(userId, planId);
  }

  getActivities(userId: string, farmId?: string): Promise<FarmActivity[]> {
    return this.activeRepo.getActivities(userId, farmId);
  }
  saveActivity(activity: FarmActivity): Promise<FarmActivity> {
    return this.activeRepo.saveActivity(activity);
  }
  deleteActivity(userId: string, activityId: string): Promise<boolean> {
    return this.activeRepo.deleteActivity(userId, activityId);
  }

  getSoilTests(userId: string, farmId?: string): Promise<SoilTest[]> {
    return this.activeRepo.getSoilTests(userId, farmId);
  }
  saveSoilTest(test: SoilTest): Promise<SoilTest> {
    return this.activeRepo.saveSoilTest(test);
  }
  deleteSoilTest(userId: string, testId: string): Promise<boolean> {
    return this.activeRepo.deleteSoilTest(userId, testId);
  }

  getConsultations(userId: string): Promise<Consultation[]> {
    return this.activeRepo.getConsultations(userId);
  }
  getAllConsultations(): Promise<Consultation[]> {
    return this.activeRepo.getAllConsultations();
  }
  saveConsultation(consultation: Consultation): Promise<Consultation> {
    return this.activeRepo.saveConsultation(consultation);
  }
  updateConsultation(id: string, updates: Partial<Consultation>): Promise<Consultation | null> {
    return this.activeRepo.updateConsultation(id, updates);
  }

  getCommunityPosts(): Promise<CommunityPost[]> {
    return this.activeRepo.getCommunityPosts();
  }
  saveCommunityPost(post: CommunityPost): Promise<CommunityPost> {
    return this.activeRepo.saveCommunityPost(post);
  }
  updateCommunityPost(postId: string, updates: Partial<CommunityPost>): Promise<CommunityPost | null> {
    return this.activeRepo.updateCommunityPost(postId, updates);
  }
  deleteCommunityPost(postId: string): Promise<boolean> {
    return this.activeRepo.deleteCommunityPost(postId);
  }
  getPostComments(postId: string): Promise<CommunityComment[]> {
    return this.activeRepo.getPostComments(postId);
  }
  saveCommunityComment(comment: CommunityComment): Promise<CommunityComment> {
    return this.activeRepo.saveCommunityComment(comment);
  }
  deleteCommunityComment(commentId: string): Promise<boolean> {
    return this.activeRepo.deleteCommunityComment(commentId);
  }

  getSavedResources(userId: string): Promise<SavedResource[]> {
    return this.activeRepo.getSavedResources(userId);
  }
  saveResource(resource: SavedResource): Promise<SavedResource> {
    return this.activeRepo.saveResource(resource);
  }
  deleteSavedResource(userId: string, resourceId: string): Promise<boolean> {
    return this.activeRepo.deleteSavedResource(userId, resourceId);
  }

  getOrders(userId: string): Promise<Order[]> {
    return this.activeRepo.getOrders(userId);
  }
  getAllOrders(): Promise<Order[]> {
    return this.activeRepo.getAllOrders();
  }
  saveOrder(order: Order): Promise<Order> {
    return this.activeRepo.saveOrder(order);
  }
  updateOrderStatus(orderId: string, status: Order['status']): Promise<Order | null> {
    return this.activeRepo.updateOrderStatus(orderId, status);
  }

  getNotifications(userId: string): Promise<InAppNotification[]> {
    return this.activeRepo.getNotifications(userId);
  }
  saveNotification(notification: InAppNotification): Promise<InAppNotification> {
    return this.activeRepo.saveNotification(notification);
  }
  markNotificationRead(userId: string, id: string): Promise<boolean> {
    return this.activeRepo.markNotificationRead(userId, id);
  }

  getCropRecommendations(userId: string): Promise<CropRecommendationRecord[]> {
    return this.activeRepo.getCropRecommendations(userId);
  }
  saveCropRecommendation(rec: CropRecommendationRecord): Promise<CropRecommendationRecord> {
    return this.activeRepo.saveCropRecommendation(rec);
  }
  deleteCropRecommendation(userId: string, id: string): Promise<boolean> {
    return this.activeRepo.deleteCropRecommendation(userId, id);
  }

  getDiseaseAnalyses(userId: string): Promise<DiseaseAnalysisRecord[]> {
    return this.activeRepo.getDiseaseAnalyses(userId);
  }
  saveDiseaseAnalysis(analysis: DiseaseAnalysisRecord): Promise<DiseaseAnalysisRecord> {
    return this.activeRepo.saveDiseaseAnalysis(analysis);
  }
  deleteDiseaseAnalysis(userId: string, id: string): Promise<boolean> {
    return this.activeRepo.deleteDiseaseAnalysis(userId, id);
  }

  getConversations(userId: string): Promise<ConversationRecord[]> {
    return this.activeRepo.getConversations(userId);
  }
  getConversation(userId: string, conversationId: string): Promise<ConversationRecord | null> {
    return this.activeRepo.getConversation(userId, conversationId);
  }
  saveConversation(conv: ConversationRecord): Promise<ConversationRecord> {
    return this.activeRepo.saveConversation(conv);
  }
  deleteConversation(userId: string, conversationId: string): Promise<boolean> {
    return this.activeRepo.deleteConversation(userId, conversationId);
  }

  getAdminMetrics(): Promise<{
    totalFarmers: number;
    totalFarms: number;
    activeConsultations: number;
    pendingOrders: number;
    totalPosts: number;
  }> {
    return this.activeRepo.getAdminMetrics();
  }

  purgeAllUserData(userId: string): Promise<boolean> {
    return this.activeRepo.purgeAllUserData(userId);
  }
}

export const delegatingDb = new DelegatingRepository(new JsonFileRepository());
export const db: IRepository = delegatingDb;

/**
 * Initialize repository:
 * Connects to MongoDB Atlas if MONGODB_URI is provided, applies indexes, and runs idempotent migration.
 * In development, explicitly logs and falls back to JsonFileRepository if MONGODB_URI is absent or unreachable.
 * In production, fails loudly and stops startup if MONGODB_URI is absent or fails to connect.
 */
export async function initDatabase(): Promise<IRepository> {
  const mongoUri = process.env.MONGODB_URI;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!mongoUri) {
    if (isProduction) {
      throw new Error('[AgriTech DB] FATAL: MONGODB_URI environment variable is required in production.');
    }
    console.log('[AgriTech DB] NOTICE: MONGODB_URI not configured. Explicitly using local JSON database (.data/agritech-db.json) for development.');
    return db;
  }

  try {
    const { MongoClient } = await import('mongodb');
    const { MongoRepository, dryRunJsonToMongo, migrateJsonToMongo } = await import('./mongoDb.js');

    console.log('[AgriTech DB] Connecting to MongoDB Atlas...');
    const client = new MongoClient(mongoUri, {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });

    await client.connect();
    const dbName = process.env.MONGODB_DB_NAME || 'AgriTech';
    const database = client.db(dbName);
    const mongoRepo = new MongoRepository(client, database);

    await mongoRepo.ensureIndexes();

    // Perform conflict-safe dry-run inspection
    const dryRun = await dryRunJsonToMongo(mongoRepo);
    if (process.env.EXECUTE_MIGRATION === 'true') {
      const liveResults = await migrateJsonToMongo(mongoRepo, { execute: true });
      console.log(`[AgriTech DB] Live migration executed: ${liveResults.totalToInsert} inserted, ${liveResults.totalToUpdate} updated.`);
    } else {
      console.log(`[AgriTech DB] Migration dry-run evaluated: ${dryRun.totalToInsert} ready to insert, ${dryRun.totalToSkip} skipped/preserved, ${dryRun.totalConflicts} conflicts.`);
    }

    delegatingDb.setActiveRepository(mongoRepo);
    console.log(`[AgriTech DB] Connected successfully to MongoDB Atlas (Database: "${dbName}"). Authoritative primary database is now MongoDB.`);
    return mongoRepo;
  } catch (err: any) {
    if (isProduction) {
      throw new Error(`[AgriTech DB] FATAL: Failed to connect to MongoDB Atlas in production: ${err.message}`);
    }
    console.warn(`[AgriTech DB] WARNING: MongoDB connection failed (${err.message}). Explicitly falling back to local JSON database for development.`);
    return db;
  }
}
