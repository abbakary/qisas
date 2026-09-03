export type Role = "USER" | "ADMIN";
export type MediaType = "AUDIO" | "VIDEO";
export type VideoJobStatus =
  | "DRAFT"
  | "QUEUED"
  | "GENERATING_SCENES"
  | "SYNTHESIZING_VOICE"
  | "RENDERING"
  | "READY"
  | "COMPLETED"
  | "PUBLISHED"
  | "FAILED";
export type VideoQuality = "auto" | "720p" | "1080p";
export type SeriesCoverGradient = "teal" | "forest" | "gold" | "deep" | "olive" | "emerald";
export type NotificationType =
  | "PAYMENT"
  | "NEW_EPISODE"
  | "SYSTEM"
  | "COMMUNITY"
  | "ANNOUNCEMENT"
  | "SUBSCRIPTION_EXPIRING";
export type TargetAudience = "ALL" | "VIP_ONLY" | "FREE_TIER_ONLY";

export type Category = {
  id: string;            // e.g. "cat-manabii"
  slug: string;          // unique URL key, lowercase kebab
  name: string;          // English
  nameSw: string;        // Kiswahili
  order: number;         // sort on viewer category rail
  image: string | null;  // HTTPS URL
  iconName?: string;
};

export type Series = {
  id: string;
  slug: string;                 // unique
  title: string;
  titleSw: string;
  description: string;
  descriptionSw: string;
  categoryId: string;           // FK Category
  coverGradient: string;        // "teal" | "forest" | "gold" | "deep" | "olive" | "emerald"
  image: string | null;
  backdropImage?: string | null;
  featured: boolean;            // home hero
  published: boolean;           // viewer only sees published
  views: number;
  likes?: number;
  seasonsCount: number;
  rating?: number;
  tags?: string[];
  createdAt: string;            // ISO-8601
};

export type Episode = {
  id: string;
  seriesId: string;
  seasonNumber: number;         // default 1
  order: number;                // unique per (seriesId, seasonNumber)
  title: string;
  titleSw: string;
  description?: string;
  descriptionSw?: string;
  durationSec: number;
  mediaUrl: string;             // playable HTTPS URL
  mediaType: MediaType;
  posterUrl?: string | null;
  isFree: boolean;              // false = VIP locked in player
  views: number;
  published: boolean;
  authorName?: string;
  authorPhone?: string;
  createdAt: string;
  fromVideoJob?: boolean;
};

export type User = {
  id: string;
  name: string;
  phone: string;                // unique, primary login
  email: string;                // unique
  password: string;             // hash in production
  role: Role;
  language: string;             // default "sw"
  avatar?: string;
  dataSaverEnabled?: boolean;
  preferredQuality?: VideoQuality;
  subscriptionStatus?: "ACTIVE" | "EXPIRED" | "FREE_TIER";
  createdAt: string;
};

export type SubscriptionPlan = "WEEKLY" | "MONTHLY" | "ANNUAL" | "VIP_LIFETIME";
export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "PENDING" | "CANCELLED";

export type Subscription = {
  id: string;
  userId: string;
  userName: string;             // denormalized for admin tables
  userPhone: string;
  plan: SubscriptionPlan;
  planNameSw: string;
  amountTzs: number;
  paymentMethod: "M-Pesa" | "Tigo Pesa" | "Airtel Money" | "Admin Grant";
  referenceCode: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
};

export type Comment = {
  id: string;
  seriesId: string;
  episodeId?: string;
  userId: string;
  userName: string;
  userPhone?: string;
  userAvatar?: string;
  text: string;
  likes: number;
  createdAt: string;
  hidden?: boolean;
  parentId?: string;
};

export type CommunityUpload = {
  id: string;
  userId?: string;
  userName?: string;
  userPhone?: string;
  uploaderName?: string;
  uploaderPhone?: string;
  authorName?: string;
  authorPhone?: string;
  verifiedSpeaker?: boolean;    // true if uploader.role === ADMIN
  title: string;
  titleSw: string;
  category: string;             // free-text today, NOT categoryId
  description: string;
  descriptionSw?: string;
  mediaUrl: string;
  mediaType: MediaType;
  thumbnailUrl?: string;
  durationSec?: number;
  references?: string;
  likes: number;
  views?: number;
  status: "APPROVED" | "PENDING" | "REJECTED";
  moderationNotes?: string;
  createdAt: string;
};

export type AppNotification = {
  id: string;
  targetUserId?: string | "ALL";
  targetPhone?: string;
  targetAudience?: TargetAudience;
  title: string;
  titleSw: string;
  message: string;
  messageSw: string;
  type: NotificationType;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
};

export type Notification = AppNotification;

export type Progress = {
  id: string;
  userId: string;
  episodeId: string;
  positionSec: number;
  completed: boolean;
  updatedAt: string;
};

export type Favorite = {
  id: string;
  userId: string;
  seriesId: string;
  createdAt: string;
};

export type Motif = "desert" | "stars" | "light" | "water" | "geometric" | "dusk";

export type Scene = {
  id: string;
  narrationSw: string;
  narrationEn: string;
  motif: Motif;
  headline?: string;
  seconds: number;
};

export type VideoJob = {
  id: string;
  seriesId: string;
  episodeId: string | null;     // set on publish
  episodeTitle?: string;
  format?: "VERTICAL_9_16" | "LANDSCAPE_16_9";
  engine?: string;
  progress?: number;
  currentStep?: string;
  status: VideoJobStatus;
  brief: string;
  titleSw: string;
  titleEn: string;
  storyboard: Scene[];
  scriptProvider: string;
  ttsProvider: string;
  voice: string;
  outputUrl: string | null;
  posterUrl: string | null;
  durationSec: number | null;
  logs: string;
  error: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  language: string;
  subscriptionStatus?: "ACTIVE" | "EXPIRED" | "FREE_TIER";
};

export type SeriesCard = {
  slug: string;
  title: string;
  titleSw: string;
  description: string;
  descriptionSw: string;
  coverGradient: string;
  image: string | null;
  featured: boolean;
  episodeCount: number;
  favoriteCount: number;
  categoryName: string;
  categoryNameSw: string;
  categorySlug: string;
  views?: number;
  likes?: number;
};
