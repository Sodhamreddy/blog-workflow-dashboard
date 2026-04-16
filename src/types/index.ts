// ─── Core domain types ───────────────────────────────────────────────────────

export type TopicStatus = 'Pending' | 'Approved' | 'Rejected' | 'In Progress' | 'Published'
export type Priority    = 'High' | 'Medium' | 'Low'
export type TeamType    = 'content' | 'ui' | 'dev' | 'completed'
export type NotifType   = 'new_topic' | 'approval' | 'published' | 'teams' | 'reminder'

// ─── Supabase row shapes (snake_case matches DB columns) ─────────────────────

export interface Topic {
  id: string              // uuid
  title: string
  generated_date: string  // timestamptz
  status: TopicStatus
  assignee: string | null
  priority: Priority
  category: string | null
  keywords: string[] | null
  seo_title: string | null
  content: string | null
  views: number
  current_team: TeamType  // which team is currently handling this
  deadline: string | null
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  type: NotifType
  title: string
  message: string
  read: boolean
  created_at: string
}

// ─── Static data (team members don't change often) ──────────────────────────

export interface TeamMember {
  id: number
  name: string
  avatar: string
  role: string
  team: TeamType
  email: string
}

// ─── Derived / computed shapes ───────────────────────────────────────────────

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
