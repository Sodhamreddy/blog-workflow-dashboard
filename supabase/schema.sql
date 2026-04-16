-- ============================================================
-- BlogFlow Dashboard — Supabase Database Schema
-- Run this once in the Supabase SQL Editor
-- ============================================================

-- ─── Topics ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.topics (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title          text        NOT NULL,
  generated_date timestamptz DEFAULT now(),
  status         text        DEFAULT 'Pending'
                             CHECK (status IN ('Pending','Approved','Rejected','In Progress','Published')),
  assignee       text,
  priority       text        DEFAULT 'Medium'
                             CHECK (priority IN ('High','Medium','Low')),
  category       text,
  keywords       text[],
  seo_title      text,
  content        text,
  views          integer     DEFAULT 0,
  current_team   text        DEFAULT 'content'
                             CHECK (current_team IN ('content','ui','dev','completed')),
  deadline       text,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- ─── Notifications ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  type       text        NOT NULL
                         CHECK (type IN ('new_topic','approval','published','teams','reminder')),
  title      text        NOT NULL,
  message    text        NOT NULL,
  read       boolean     DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS topics_status_idx        ON public.topics (status);
CREATE INDEX IF NOT EXISTS topics_current_team_idx  ON public.topics (current_team);
CREATE INDEX IF NOT EXISTS topics_created_at_idx    ON public.topics (created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_read_idx   ON public.notifications (read);
CREATE INDEX IF NOT EXISTS notifications_created_idx ON public.notifications (created_at DESC);

-- ─── Auto-update updated_at ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS topics_updated_at ON public.topics;
CREATE TRIGGER topics_updated_at
  BEFORE UPDATE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────
-- The dashboard backend uses the service role key which bypasses RLS.
-- Enable RLS anyway so anon/public access is blocked by default.

ALTER TABLE public.topics        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- If you add auth later, replace these with role-based policies.
-- For now, the service role key (used by API routes) bypasses RLS.
-- To allow read-only public access, uncomment these:
-- CREATE POLICY "public_read_topics" ON public.topics FOR SELECT USING (true);
-- CREATE POLICY "public_read_notifs" ON public.notifications FOR SELECT USING (true);
