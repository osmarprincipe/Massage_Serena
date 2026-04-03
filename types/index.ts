// Serene Studio — Core Type Definitions

export type UserRole = "ADMIN" | "USER";
export type UserStatus = "ACTIVE" | "INACTIVE" | "PENDING";
export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type MembershipStatus = "ACTIVE" | "CANCELLED" | "EXPIRED" | "PENDING";
export type MembershipLevel = "Normal" | "VIP" | "Premium";
export type BillingCycle = "MONTHLY" | "WEEKLY";
export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type MediaType = "VIDEO" | "AUDIO" | "IMAGE" | "PDF" | "TEXT";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
  client?: Client | null;
  memberships?: UserMembership[];
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: User | null;
  bookings?: Booking[];
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  date: Date;
  duration: number;
  notes: string | null;
  status: BookingStatus;
  clientId: string;
  serviceId: string | null;
  createdAt: Date;
  updatedAt: Date;
  client?: Client;
  service?: Service | null;
}

export interface MembershipPlan {
  id: string;
  name: MembershipLevel;
  level: number;
  description: string | null;
  price: number;
  billingCycle: BillingCycle;
  features: string; // JSON string
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMembership {
  id: string;
  status: MembershipStatus;
  startDate: Date;
  endDate: Date | null;
  autoRenew: boolean;
  userId: string;
  planId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  plan?: MembershipPlan;
}

export interface Content {
  id: string;
  title: string;
  description: string | null;
  mediaType: MediaType;
  contentUrl: string | null;
  thumbnailUrl: string | null;
  status: ContentStatus;
  publishDate: Date | null;
  separatePurchaseEnabled: boolean;
  separatePurchasePrice: number | null;
  createdAt: Date;
  updatedAt: Date;
  membershipAccess?: { plan: MembershipPlan }[];
  purchases?: ContentPurchase[];
}

export interface ContentPurchase {
  id: string;
  pricePaid: number;
  purchasedAt: Date;
  status: string;
  userId: string;
  contentId: string;
  user?: User;
  content?: Content;
}

export interface BusinessInfo {
  id: string;
  businessName: string;
  address: string | null;
  workingHours: string | null; // JSON
  phone: string | null;
  email: string | null;
  description: string | null;
  logoUrl: string | null;
  updatedAt: Date;
}

export interface BotSettings {
  id: string;
  businessName: string | null;
  tone: string | null;
  personalityDesc: string | null;
  responseStyle: string | null;
  emojiUsage: boolean;
  greetingMessage: string | null;
  fallbackMessage: string | null;
  updatedAt: Date;
}

// ── Dashboard Stats ────────────────────────────────────────────────────────

export interface DashboardStats {
  todayBookings: number;
  activeUsers: number;
  totalClients: number;
  activeMemberships: number;
  recentBookings: Booking[];
  membershipBreakdown: {
    normal: number;
    vip: number;
    premium: number;
  };
}

// ── API Response ──────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// ── Form Types ────────────────────────────────────────────────────────────

export interface BookingFormData {
  clientId: string;
  serviceId?: string;
  date: string;
  time: string;
  duration: number;
  notes?: string;
  status: BookingStatus;
  // New client fields (used when creating client inline)
  newClientName?: string;
  newClientEmail?: string;
  newClientPhone?: string;
}

export interface ClientFormData {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface UserFormData {
  email: string;
  name?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  linkedClientId?: string;
  membershipPlanId?: string;
}

export interface ContentFormData {
  title: string;
  description?: string;
  mediaType: MediaType;
  contentUrl?: string;
  thumbnailUrl?: string;
  status: ContentStatus;
  publishDate?: string;
  separatePurchaseEnabled: boolean;
  separatePurchasePrice?: number;
  membershipLevels: string[]; // planIds
}
