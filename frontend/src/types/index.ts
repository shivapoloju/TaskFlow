export type UserRole = 'Admin' | 'Manager' | 'Member';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string | null;
  created_at?: string;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  created_by?: number;
  creator_name?: string;
  member_count?: number;
  project_count?: number;
  created_at: string;
}

export interface TeamMember {
  id: number;
  user_id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  joined_at: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  team_id: number;
  team_name?: string;
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
  created_by?: number;
  creator_name?: string;
  total_tasks?: number;
  completed_tasks?: number;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'In Review' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  project_id: number;
  project_name?: string;
  assignee_id?: number | null;
  assignee_name?: string;
  assignee_email?: string;
  assignee_avatar?: string;
  reporter_id?: number;
  reporter_name?: string;
  due_date?: string;
  estimated_hours?: number;
  comment_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  content: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
  user_role?: UserRole;
  user_avatar?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PerformanceMetrics {
  executionTimeMs: number;
  indexedQuery: boolean;
  optimizedSpeedup: string;
}
