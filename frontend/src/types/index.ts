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
  created_at: string;
  updated_at: string;
  published_at?: string;
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
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: string;
  created_by: number;
  raci_assignments?: RACIAssignment[];
  created_at: string;
  updated_at: string;
}

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",  // ← Было REVIEW, теперь IN_REVIEW
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
  created_at: string;
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
  my_tasks: Task[]; // ← это массив!
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
