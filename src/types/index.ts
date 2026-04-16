// ─── Core domain types ───────────────────────────────────────────────────────

export type TopicStatus = 'Pending' | 'Approved' | 'Rejected' | 'In Progress' | 'Published'
export type Priority    = 'High' | 'Medium' | 'Low'
export type NotifType   = 'new_topic' | 'approval' | 'published' | 'teams' | 'reminder'

export type ClientName  = 'Kleza' | 'Interim HC' | 'AHNS' | 'StadiumRx'

// Workflow pipeline stages (maps to current_team field)
export type TeamType =
  | 'content'    // Content team writing + SEO review (dual approval)
  | 'ui_ux'      // UI/UX team
  | 'manager'    // Manager (Vasudha) approval
  | 'completed'  // Published / done

// ─── Comments & Replies ──────────────────────────────────────────────────────

export interface CommentReply {
  id:         string
  author:     string
  text:       string
  created_at: string
}

export interface TopicComment {
  id:         string
  author:     string
  text:       string
  created_at: string
  replies:    CommentReply[]
}

// ─── Topic ───────────────────────────────────────────────────────────────────

export interface Topic {
  id:             string
  title:          string
  generated_date: string
  status:         TopicStatus
  assignee:       string | null
  priority:       Priority
  category:       string | null
  keywords:       string[] | null
  seo_title:      string | null
  content:        string | null       // plain text / markdown (legacy)
  blog_content:   string | null       // rich HTML from editor
  views:          number
  current_team:   TeamType
  deadline:       string | null
  created_at:     string
  updated_at:     string
  // Multi-client
  client:         ClientName
  // Dual approval flags (used in content stage)
  content_approved: boolean
  seo_approved:     boolean
  // Discussion
  comments:         TopicComment[]
}

// ─── Notification ────────────────────────────────────────────────────────────

export interface Notification {
  id:         string
  type:       NotifType
  title:      string
  message:    string
  read:       boolean
  created_at: string
}

// ─── Static data ─────────────────────────────────────────────────────────────

export interface TeamMember {
  id:     number
  name:   string
  avatar: string
  role:   string
  team:   TeamType
  email:  string
}

// ─── Computed shapes ─────────────────────────────────────────────────────────

export interface DashboardStats {
  totalTopics:     number
  pendingApproval: number
  inProgress:      number
  published:       number
}

export interface MonthlyChartData {
  labels:    string[]
  generated: number[]
  approved:  number[]
  published: number[]
}

// ─── Team roster (static, shared across pages) ───────────────────────────────

export const APPROVERS   = ['Praveen', 'Divya']
export const CONTENT_TEAM = ['Sulakshana', 'Salwa', 'Lubna']
export const UIUX_TEAM   = ['Rajesh', 'Deeraj', 'Raghu']
export const MANAGER     = 'Vasudha'

export const ALL_MEMBERS = [...APPROVERS, ...CONTENT_TEAM, ...UIUX_TEAM, MANAGER]

export const CLIENTS: ClientName[] = ['Kleza', 'Interim HC', 'AHNS', 'StadiumRx']

// Pipeline stages for the tracker UI
export const PIPELINE_STAGES = [
  { key: 'pending',   label: 'Pending Approval', team: APPROVERS },
  { key: 'content',   label: 'Content + SEO',    team: [...CONTENT_TEAM, 'SEO Team'] },
  { key: 'ui_ux',     label: 'UI/UX Review',     team: UIUX_TEAM },
  { key: 'manager',   label: 'Manager Approval', team: [MANAGER] },
  { key: 'completed', label: 'Published',         team: [] },
] as const
