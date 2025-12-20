// Пользователь
export interface User {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  role: UserRole;
  system_role: string;  
  is_active: boolean;  
  avatar?: string | null;
  created_at: string;
}

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

// Проект
export interface Project {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  deadline: string;
  creator_id: number;
  creator?: User;
  team?: Array<{
    id: number;
    user_id: number;
    user: User;
    joined_at: string;
  }>;
  team_count?: number;
  priority?: number; // 0=Low, 1=Medium, 2=High
  is_archived?: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string;
  created_by_id?: number;
}

export enum ProjectStatus {
  DRAFT = "DRAFT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  ACTIVE = "ACTIVE",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
}

// Задача
export interface Task {
  id: number;
  project_id: number;
  milestone_id?: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: string;
  created_by: number;
  raci_assignments?: RACIAssignment[];
  tags?: Tag[];
  checklist_items?: ChecklistItem[];
  comments_count?: number;
  created_at: string;
  updated_at: string;
}

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW", 
  DONE = "DONE",
  BLOCKED = "BLOCKED",
}


export enum TaskPriority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3,
}

// RACI роли
export interface RACIAssignment {
  id: number;
  task_id: number;
  user_id: number;
  user_name?: string; 
  role: RACIRole;
  assigned_by_id: number;
  created_at: string;
  user?: User;
}



export enum RACIRole {
  RESPONSIBLE = "RESPONSIBLE",
  ACCOUNTABLE = "ACCOUNTABLE",
  CONSULTED = "CONSULTED",
  INFORMED = "INFORMED",
}

// Лог активности
export interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  details: string | null;
  description?: string;  
  created_at: string;
  user?: User;
  project_id?: number;
}


// Dashboard статистика
export interface DashboardStats {
  my_projects_count: number;
  my_tasks_count: number;
  my_tasks: Task[]; // это массив
  urgent_tasks: Task[];
  urgent_tasks_count: number;
  status_breakdown: {
    TODO: number;
    IN_PROGRESS: number;
    IN_REVIEW: number;
    DONE: number;
    BLOCKED: number;
  };
}

// Загруженность команды
export interface TeamWorkload {
  user_id: number;
  username: string;
  full_name: string;
  task_count: number;
}

// Ответы API
export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface ApiResponse<T> {
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

// Уведомления
export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  entity_type?: string;
  entity_id?: number;
  is_read: boolean;
  created_at: string;
}

// Комментарии
export interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  user?: User;
  content: string;
  parent_id?: number;
  replies?: Comment[];
  created_at: string;
  updated_at: string;
}

// Этапы проекта (Milestones)
export interface Milestone {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  deadline?: string;
  status: MilestoneStatus;
  order_index: number;
  progress: number; // 0-100
  tasks_count?: number;
  completed_tasks_count?: number;
  created_at: string;
  updated_at: string;
}

export enum MilestoneStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  BLOCKED = "BLOCKED",
}

// Чеклисты
export interface ChecklistItem {
  id: number;
  task_id: number;
  title: string;
  is_done: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Теги
export interface Tag {
  id: number;
  name: string;
  color: string; // HEX цвет
  project_id?: number;
  created_at: string;
}

// Аналитика проекта
export interface ProjectAnalytics {
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  overdue_tasks: number;
  high_priority_tasks: number;
  tasks_by_status: {
    TODO: number;
    IN_PROGRESS: number;
    IN_REVIEW: number;
    DONE: number;
    BLOCKED: number;
  };
  tasks_by_milestone: Array<{
    milestone_id: number;
    milestone_name: string;
    task_count: number;
  }>;
  team_workload: Array<{
    user_id: number;
    full_name: string;
    task_count: number;
  }>;
}

// Админ: Фильтры логов
export interface AdminLogFilters {
  page?: number;
  per_page?: number;
  user_id?: number;
  action?: string;
  entity_type?: string;
  project_id?: number;
  date_from?: string;
  date_to?: string;
}

// Админ: Фильтры пользователей
export interface AdminUserFilters {
  role?: "ADMIN" | "USER";
  is_active?: boolean;
  search?: string;
}