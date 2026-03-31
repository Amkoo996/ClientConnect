export type Role = "ADMIN" | "CLIENT";
export type TicketStatus = "NEW" | "IN_PROGRESS" | "RESOLVED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH";
export type TicketCategory = "BUG" | "FEATURE" | "BILLING" | "GENERAL";

export interface User {
  uid: string;
  email: string;
  role: Role;
  displayName: string;
  companyName?: string; // only for ADMIN
  createdAt: Date;
  isActive: boolean;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  customFields?: Record<string, string>;
  clientId: string;
  clientName: string;
  clientEmail: string;
  adminId: string;
  assigneeId?: string | null;
  assigneeName?: string | null;
  screenshotUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}

export interface Comment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: Role;
  text: string;
  createdAt: Date;
  isEdited: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  type: 'NEW_TICKET' | 'NEW_COMMENT';
  linkId?: string;
}

export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  login: () => Promise<void>;
}

export interface TicketFilter {
  status?: TicketStatus | "ALL";
  priority?: TicketPriority | "ALL";
  searchQuery?: string;
  page?: number;
  sortBy?: "createdAt" | "priority" | "status";
}
