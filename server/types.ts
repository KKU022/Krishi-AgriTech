export type Language = 'en' | 'hi';
export type UserRole = 'farmer' | 'admin';
export type Season = 'Kharif' | 'Rabi' | 'Zaid';

export function normalizeSeason(value: unknown): Season | undefined {
  if (typeof value !== 'string') return undefined;
  switch (value.trim().toLowerCase()) {
    case 'kharif': return 'Kharif';
    case 'rabi': return 'Rabi';
    case 'zaid': return 'Zaid';
    default: return undefined;
  }
}
export type SoilType = string;
export type WaterSource = string;

export interface Farm {
  id: string;
  userId: string;
  name: string;
  state: string;
  district: string;
  size: number;
  sizeUnit: 'acres' | 'hectares';
  soilType: string;
  waterSource: string;
  primaryCrops?: string[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface FarmerProfile {
  userId?: string;
  email?: string;
  fullName?: string;
  language?: Language;
  role?: UserRole;
  state?: string;
  district?: string;
  activeFarmId?: string;
  landArea?: number;
  landAreaUnit?: 'acres' | 'hectares';
  soilType?: string;
  waterSource?: string;
  farmingInterests?: string[];
  onboardingCompleted?: boolean;
  onboardingStep?: number;
  updatedAt?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  role?: UserRole;
  createdAt: string;
  profile: FarmerProfile;
  passwordHash?: string;
  googleSub?: string;
}

export interface CropPlan {
  id: string;
  userId: string;
  farmId: string;
  cropName: string;
  variety: string;
  season: Season;
  sowingDate: string;
  expectedHarvestDate: string;
  status: 'planned' | 'sown' | 'growing' | 'harvested' | 'cancelled';
  targetYieldQuintals?: number;
  notes?: string;
  createdAt: string;
}

export interface FarmActivity {
  id: string;
  userId: string;
  farmId: string;
  cropPlanId?: string;
  type: 'sowing' | 'irrigation' | 'fertilizer' | 'pest_control' | 'weeding' | 'harvesting' | 'soil_testing' | 'other';
  title: string;
  date: string;
  cost?: number;
  notes?: string;
  completed: boolean;
  createdAt: string;
}

export interface SoilTest {
  id: string;
  userId: string;
  farmId: string;
  date: string;
  isLabTest: boolean;
  labName?: string;
  sampleDepthCm?: number;
  ph: number;
  nitrogen?: number;
  nitrogenLevel?: 'low' | 'medium' | 'high';
  phosphorus?: number;
  phosphorusLevel?: 'low' | 'medium' | 'high';
  potassium?: number;
  potassiumLevel?: 'low' | 'medium' | 'high';
  organicCarbonPercent?: number;
  electricalConductivity?: number;
  recommendations?: string[];
  notes?: string;
  createdAt: string;
}

export interface Consultation {
  id: string;
  userId: string;
  farmerName: string;
  farmerPhone?: string;
  state: string;
  district: string;
  crop: string;
  category: 'crop_disease' | 'soil_fertility' | 'water_irrigation' | 'market_advisory' | 'government_scheme' | 'general';
  question: string;
  urgency: 'routine' | 'urgent' | 'critical';
  status: 'submitted' | 'under_review' | 'resolved';
  expertResponse?: string;
  assignedExpert?: string;
  respondedAt?: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  authorName: string;
  state: string;
  cropTag: string;
  title: string;
  body: string;
  upvotes: number;
  commentCount: number;
  reportCount: number;
  status: 'active' | 'flagged' | 'hidden';
  createdAt: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface SavedResource {
  id: string;
  userId: string;
  resourceId: string;
  title: string;
  category: string;
  officialUrl: string;
  savedAt: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  unit: string;
}

export interface Order {
  id: string;
  userId: string;
  farmerName: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  phone: string;
  paymentMode: 'cash_on_delivery' | 'direct_bank_transfer';
  status: 'pending_confirmation' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'weather_alert' | 'consultation_reply' | 'order_update' | 'activity_due' | 'system';
  read: boolean;
  createdAt: string;
}

export interface CropRecommendationInput {
  state: string;
  district?: string;
  soilType: string;
  waterSource: string;
  season?: Season;
  month?: number;
  landArea?: number;
  landAreaUnit?: 'acres' | 'hectares';
  ph?: number;
  nitrogen?: number;
}

export interface RankedCrop {
  cropName: string;
  hindiName: string;
  suitabilityScore: number;
  durationDays: string;
  waterRequirement: 'High' | 'Medium' | 'Low';
  soilCompatibilityNotes: string;
  matchedRules: string[];
}

export interface CropRecommendationRecord {
  id: string;
  userId: string;
  farmId?: string;
  timestamp: string;
  inputs: CropRecommendationInput;
  rankedCrops: RankedCrop[];
  geminiExplanation?: string;
  matchedRulesSummary: string[];
}

export interface StructuredDiseaseAnalysisResult {
  possibleConditions: Array<{ name: string; pathogenType: string; description: string }>;
  visibleSymptoms: string[];
  certaintyLevel: 'low' | 'medium' | 'high';
  generalPreventionSteps: string[];
  expertAdviceRecommendation: string;
}

export interface LegacyDiseaseAnalysisResult {
  diseaseName: string;
  pathogenType: string;
  confidenceScore: number;
  severityLevel: 'low' | 'moderate' | 'high' | 'critical';
  symptomsObserved: string[];
  recommendedActions: {
    cultural: string[];
    biological: string[];
    chemicalGuidanceDisclaimer: string;
  };
  preventiveMeasures: string[];
  safetyDisclaimer: string;
}

export type DiseaseAnalysisResult = StructuredDiseaseAnalysisResult | LegacyDiseaseAnalysisResult;

export interface DiseaseAnalysisRecord {
  id: string;
  userId: string;
  farmId?: string;
  timestamp: string;
  cropHint?: string;
  notes?: string;
  result: DiseaseAnalysisResult;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  sender?: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  language?: Language;
}

export interface ConversationRecord {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}
