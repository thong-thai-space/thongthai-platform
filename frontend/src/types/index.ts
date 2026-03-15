// ==================== ENUMS ====================

export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'CLIENT';

export type ProjectStatus =
  | 'DRAFT'
  | 'PROPOSAL_SENT'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'REVIEW'
  | 'COMPLETED'
  | 'CANCELLED';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_UPDATED'
  | 'PROJECT_UPDATE'
  | 'PROJECT_REQUEST'
  | 'CONTACT_REQUEST'
  | 'INVOICE_PAID'
  | 'CLIENT_MESSAGE'
  | 'AI_COMPLETED'
  | 'SYSTEM';

export type Language = 'VI' | 'EN';
export type Currency = 'VND' | 'USD';

// ==================== MODELS ====================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  role: UserRole;
  locale: Language;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  budget?: number;
  budgetUsd?: number;
  currency: Currency;
  techStack: string[];
  repoUrl?: string;
  liveUrl?: string;
  figmaUrl?: string;
  ownerId: string;
  owner?: User;
  clientId?: string;
  client?: User;
  tasks?: Task[];
  milestones?: Milestone[];
  isShowcase: boolean;
  showcaseOrder?: number;
  showcaseCategory?: string;
  showcaseResults?: string;
  thumbnailUrl?: string;
  screenshots: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  order: number;
  projectId: string;
  project?: Project;
  assigneeId?: string;
  assignee?: User;
  creatorId: string;
  creator?: User;
  parentId?: string;
  subTasks?: Task[];
  milestoneId?: string;
  labels: string[];
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  isCompleted: boolean;
  completedAt?: string;
  projectId: string;
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author?: User;
  projectId?: string;
  taskId?: string;
  isAiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  totalUsd?: number;
  currency: Currency;
  notes?: string;
  projectId?: string;
  project?: Project;
  clientId: string;
  client?: User;
  creatorId: string;
  creator?: User;
  items?: InvoiceItem[];
  paidAt?: string;
  paidAmount?: number;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  invoiceId: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  userId: string;
  createdAt: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  projectId: string;
  uploadedBy: string;
  createdAt: string;
}

export interface AiConversation {
  id: string;
  title?: string;
  context?: string;
  userId: string;
  messages?: AiMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tokenUsage?: number;
  conversationId: string;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  description?: string;
  hours: number;
  date: string;
  billable: boolean;
  userId: string;
  taskId?: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  userId: string;
  user?: User;
  projectId?: string;
  createdAt: string;
}

// ==================== API RESPONSES ====================

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  sender?: User;
  receiverId: string;
  receiver?: User;
  projectId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  userId: string;
  user: User;
  lastMessage: Message;
  unreadCount: number;
}
