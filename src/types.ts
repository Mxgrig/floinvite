/**
 * Floinvite Type Definitions
 * All TypeScript interfaces and enums for the visitor management system
 */

// ═══════════════════════════════════════════════════
// Host/Employee Types
// ═══════════════════════════════════════════════════

export interface Host {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  notificationMethod: 'whatsapp' | 'email' | 'both';
  whatsappNumber?: string; // Phone number for WhatsApp notifications
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

// ═══════════════════════════════════════════════════
// Guest Status Enum
// ═══════════════════════════════════════════════════

export enum GuestStatus {
  EXPECTED = 'Expected',
  CHECKED_IN = 'Checked In',
  CHECKED_OUT = 'Checked Out',
  NO_SHOW = 'No Show'
}

// ═══════════════════════════════════════════════════
// Guest/Visitor Types
// ═══════════════════════════════════════════════════

export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  hostId: string;
  checkInTime: string; // ISO timestamp
  checkOutTime?: string; // ISO timestamp
  status: GuestStatus;
  lastVisit?: string; // ISO timestamp
  visitCount?: number;
  preRegistered?: boolean;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Expected Guest - Pre-registered visitor
 * Extends Guest with expected arrival details
 */
export interface ExpectedGuest extends Guest {
  expectedDate: string; // ISO date
  expectedTime?: string; // HH:MM format
  preRegistered: true;
  magicLink?: string; // Optional unique check-in URL
}

// ═══════════════════════════════════════════════════
// Application Settings
// ═══════════════════════════════════════════════════

export interface AppSettings {
  businessName: string;
  businessAddress?: string;
  logoUrl?: string;
  primaryColor?: string;
  notificationEmail: string; // admin@floinvite.com
  timezone?: string; // IANA timezone string
  locale?: string; // Language/locale code
  kioskMode: boolean; // Enable fullscreen kiosk mode
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

// ═══════════════════════════════════════════════════
// CSV Import Types
// ═══════════════════════════════════════════════════

export interface CSVHostRow {
  Name: string;
  Email: string;
  Phone?: string;
  Department?: string;
  NotificationMethod?: 'whatsapp' | 'email' | 'both';
}

export interface CSVExpectedGuestRow {
  'Guest Name': string;
  Email?: string;
  Company?: string;
  'Host Name': string;
  'Expected Date': string;
  'Expected Time'?: string;
}

export interface CSVImportResult<T> {
  success: boolean;
  count: number;
  data: T[];
  errors: CSVImportError[];
  warnings: string[];
}

export interface CSVImportError {
  row: number;
  message: string;
  field?: string;
}

// ═══════════════════════════════════════════════════
// Validation Types
// ═══════════════════════════════════════════════════

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

// ═══════════════════════════════════════════════════
// API/Service Response Types
// ═══════════════════════════════════════════════════

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ═══════════════════════════════════════════════════
// Notification Types
// ═══════════════════════════════════════════════════

export interface NotificationLog {
  id: string;
  guestId: string;
  hostId: string;
  type: 'arrival' | 'expected' | 'returning' | 'no_show';
  message: string;
  sentAt?: string; // ISO timestamp
  status: 'pending' | 'sent' | 'failed';
  error?: string;
  createdAt: string; // ISO timestamp
}

// ═══════════════════════════════════════════════════
// Component Props Types
// ═══════════════════════════════════════════════════

export interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

// ═══════════════════════════════════════════════════
// Context/State Types
// ═══════════════════════════════════════════════════

export interface AppContextType {
  hosts: Host[];
  setHosts: (hosts: Host[]) => void;
  guests: Guest[];
  setGuests: (guests: Guest[]) => void;
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  loading: boolean;
  error: string | null;
  showNotification: (message: ToastMessage) => void;
}

// ═══════════════════════════════════════════════════
// Analytics Types (Future)
// ═══════════════════════════════════════════════════

export interface GuestAnalytics {
  totalVisitors: number;
  totalCheckIns: number;
  uniqueVisitors: number;
  averageVisitsPerPerson: number;
  mostFrequentVisitor: {
    name: string;
    visits: number;
  } | null;
  mostVisitedHost: {
    name: string;
    visits: number;
  } | null;
  peakHours: Array<{
    hour: number;
    count: number;
  }>;
  topCompanies: Array<{
    company: string;
    visits: number;
  }>;
}

// ═══════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════

export const GUEST_STATUS_COLORS = {
  [GuestStatus.EXPECTED]: '#f59e0b',
  [GuestStatus.CHECKED_IN]: '#10b981',
  [GuestStatus.CHECKED_OUT]: '#6b7280',
  [GuestStatus.NO_SHOW]: '#ef4444'
} as const;

export const RETURNING_VISITOR_THRESHOLD_DAYS = 30;
export const AUTO_ARCHIVE_DAYS = 90;
export const STORAGE_CAPACITY_WARNING_PERCENT = 80;
export const MAX_GUESTS_PER_IMPORT = 1000;
export const LOGBOOK_PAGE_SIZE = 50;
