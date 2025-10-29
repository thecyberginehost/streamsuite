-- =====================================================
-- 015_add_audit_logging.sql
-- Comprehensive Audit Logging System
-- =====================================================
-- This migration creates an audit logging system for tracking:
-- - All user actions (clicks, API calls, credit usage)
-- - Security events (malicious uploads, failed auth)
-- - IP addresses and user agents
-- - Admin-only visibility
-- =====================================================

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Action details
  action_type TEXT NOT NULL CHECK (action_type IN (
    'workflow_generation',
    'workflow_conversion',
    'workflow_debug',
    'batch_generation',
    'file_upload',
    'workflow_download',
    'workflow_save',
    'workflow_delete',
    'n8n_push',
    'n8n_connection_test',
    'credit_purchase',
    'credit_deduction',
    'login',
    'logout',
    'settings_change',
    'api_call',
    'page_view'
  )),
  action_status TEXT NOT NULL CHECK (action_status IN ('success', 'failure', 'blocked', 'warning')),
  action_details JSONB, -- Additional context (workflow name, credits used, etc.)

  -- Security tracking
  ip_address INET, -- User's IP address
  user_agent TEXT, -- Browser/device info
  location JSONB, -- Geolocation data (city, country, etc.) - optional

  -- Threat detection
  threat_detected BOOLEAN DEFAULT false,
  threat_type TEXT CHECK (threat_type IN ('xss', 'dos', 'injection', 'oversized', 'malformed', 'suspicious', 'none')),
  threat_severity TEXT CHECK (threat_severity IN ('low', 'medium', 'high', 'critical')),
  threat_details TEXT, -- Description of the threat

  -- Resource usage
  credits_used INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  execution_time_ms INTEGER, -- How long the action took

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX idx_audit_logs_action_status ON public.audit_logs(action_status);
CREATE INDEX idx_audit_logs_threat_detected ON public.audit_logs(threat_detected) WHERE threat_detected = true;
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_ip_address ON public.audit_logs(ip_address);
CREATE INDEX idx_audit_logs_user_threat ON public.audit_logs(user_id, threat_detected) WHERE threat_detected = true;

-- =====================================================
-- SECURITY INCIDENTS TABLE
-- =====================================================
-- Separate table for high-severity security incidents

CREATE TABLE IF NOT EXISTS public.security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  audit_log_id UUID REFERENCES public.audit_logs(id) ON DELETE CASCADE,

  -- Incident details
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'malicious_upload',
    'xss_attempt',
    'dos_attempt',
    'prompt_injection',
    'credential_theft',
    'api_abuse',
    'rate_limit_exceeded',
    'suspicious_pattern',
    'account_compromise'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  evidence JSONB, -- Store evidence (file content, request data, etc.)

  -- Response
  auto_blocked BOOLEAN DEFAULT false, -- Was the action automatically blocked?
  admin_reviewed BOOLEAN DEFAULT false,
  admin_action TEXT, -- What action admin took (banned, warning, ignored)
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_security_incidents_user_id ON public.security_incidents(user_id);
CREATE INDEX idx_security_incidents_severity ON public.security_incidents(severity);
CREATE INDEX idx_security_incidents_admin_reviewed ON public.security_incidents(admin_reviewed) WHERE admin_reviewed = false;
CREATE INDEX idx_security_incidents_created_at ON public.security_incidents(created_at DESC);

-- =====================================================
-- USER SUSPENSIONS TABLE
-- =====================================================
-- Track banned/suspended users

CREATE TABLE IF NOT EXISTS public.user_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Suspension details
  suspension_type TEXT NOT NULL CHECK (suspension_type IN ('warning', 'temporary_ban', 'permanent_ban', 'feature_restriction')),
  reason TEXT NOT NULL,
  evidence_incident_ids UUID[], -- Array of security_incidents.id

  -- Duration
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL for permanent bans
  is_active BOOLEAN DEFAULT true,

  -- Admin action
  suspended_by UUID NOT NULL REFERENCES auth.users(id),
  admin_notes TEXT,

  -- Appeal
  appeal_submitted BOOLEAN DEFAULT false,
  appeal_text TEXT,
  appeal_reviewed BOOLEAN DEFAULT false,
  appeal_decision TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT one_active_suspension_per_user UNIQUE (user_id, is_active)
);

-- Indexes
CREATE INDEX idx_user_suspensions_user_id ON public.user_suspensions(user_id);
CREATE INDEX idx_user_suspensions_is_active ON public.user_suspensions(is_active) WHERE is_active = true;
CREATE INDEX idx_user_suspensions_expires_at ON public.user_suspensions(expires_at);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Audit logs: Only admins can view
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (is_user_admin((select auth.uid())));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true); -- Allow inserts from service role

-- Security incidents: Only admins can view/modify
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all security incidents"
  ON public.security_incidents FOR SELECT
  USING (is_user_admin((select auth.uid())));

CREATE POLICY "Admins can update security incidents"
  ON public.security_incidents FOR UPDATE
  USING (is_user_admin((select auth.uid())));

CREATE POLICY "System can insert security incidents"
  ON public.security_incidents FOR INSERT
  WITH CHECK (true);

-- User suspensions: Only admins can view/modify
ALTER TABLE public.user_suspensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all suspensions"
  ON public.user_suspensions FOR SELECT
  USING (is_user_admin((select auth.uid())));

CREATE POLICY "Admins can create suspensions"
  ON public.user_suspensions FOR INSERT
  WITH CHECK (is_user_admin((select auth.uid())));

CREATE POLICY "Admins can update suspensions"
  ON public.user_suspensions FOR UPDATE
  USING (is_user_admin((select auth.uid())));

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Check if user is currently suspended
CREATE OR REPLACE FUNCTION is_user_suspended(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_suspensions
    WHERE user_id = p_user_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;

-- Function: Get user's threat score (0-100)
CREATE OR REPLACE FUNCTION get_user_threat_score(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_critical_count INTEGER;
  v_high_count INTEGER;
  v_medium_count INTEGER;
  v_recent_threats INTEGER;
  v_score INTEGER := 0;
BEGIN
  -- Count security incidents by severity (last 30 days)
  SELECT
    COUNT(*) FILTER (WHERE severity = 'critical'),
    COUNT(*) FILTER (WHERE severity = 'high'),
    COUNT(*) FILTER (WHERE severity = 'medium')
  INTO v_critical_count, v_high_count, v_medium_count
  FROM public.security_incidents
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '30 days';

  -- Calculate score
  v_score := (v_critical_count * 50) + (v_high_count * 20) + (v_medium_count * 5);

  -- Count recent threats (last 7 days)
  SELECT COUNT(*) INTO v_recent_threats
  FROM public.audit_logs
  WHERE user_id = p_user_id
    AND threat_detected = true
    AND created_at > NOW() - INTERVAL '7 days';

  -- Add recent threat penalty
  v_score := v_score + (v_recent_threats * 10);

  -- Cap at 100
  RETURN LEAST(v_score, 100);
END;
$$;

-- Function: Get user's activity summary
CREATE OR REPLACE FUNCTION get_user_activity_summary(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_summary JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_actions', COUNT(*),
    'successful_actions', COUNT(*) FILTER (WHERE action_status = 'success'),
    'failed_actions', COUNT(*) FILTER (WHERE action_status = 'failure'),
    'blocked_actions', COUNT(*) FILTER (WHERE action_status = 'blocked'),
    'threats_detected', COUNT(*) FILTER (WHERE threat_detected = true),
    'total_credits_used', COALESCE(SUM(credits_used), 0),
    'total_api_calls', COALESCE(SUM(api_calls_made), 0),
    'unique_ips', COUNT(DISTINCT ip_address),
    'first_seen', MIN(created_at),
    'last_seen', MAX(created_at)
  ) INTO v_summary
  FROM public.audit_logs
  WHERE user_id = p_user_id;

  RETURN v_summary;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at on security_incidents
CREATE OR REPLACE FUNCTION update_security_incident_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_security_incidents_updated_at
  BEFORE UPDATE ON public.security_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_security_incident_timestamp();

-- Auto-update updated_at on user_suspensions
CREATE TRIGGER update_user_suspensions_updated_at
  BEFORE UPDATE ON public.user_suspensions
  FOR EACH ROW
  EXECUTE FUNCTION update_security_incident_timestamp();

-- Auto-create security incident for critical threats
CREATE OR REPLACE FUNCTION auto_create_security_incident()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create incident for high/critical threats
  IF NEW.threat_detected = true AND NEW.threat_severity IN ('high', 'critical') THEN
    INSERT INTO public.security_incidents (
      user_id,
      audit_log_id,
      incident_type,
      severity,
      description,
      evidence,
      auto_blocked
    ) VALUES (
      NEW.user_id,
      NEW.id,
      CASE
        WHEN NEW.threat_type = 'xss' THEN 'xss_attempt'
        WHEN NEW.threat_type = 'dos' THEN 'dos_attempt'
        WHEN NEW.threat_type = 'injection' THEN 'prompt_injection'
        ELSE 'suspicious_pattern'
      END,
      NEW.threat_severity,
      COALESCE(NEW.threat_details, 'Automatic threat detection'),
      jsonb_build_object(
        'action_type', NEW.action_type,
        'action_details', NEW.action_details,
        'ip_address', NEW.ip_address::TEXT,
        'user_agent', NEW.user_agent
      ),
      NEW.action_status = 'blocked'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_create_incident_from_audit_log
  AFTER INSERT ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_security_incident();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify tables exist
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM (
  VALUES
    ('audit_logs'),
    ('security_incidents'),
    ('user_suspensions')
) AS t(table_name)
ORDER BY table_name;

-- Verify functions exist
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'is_user_suspended',
    'get_user_threat_score',
    'get_user_activity_summary'
  )
ORDER BY routine_name;

-- =====================================================
-- NOTES
-- =====================================================
--
-- Audit Logging System Created:
-- ✅ audit_logs: Tracks all user actions with IP, user agent, threats
-- ✅ security_incidents: High-severity events requiring admin review
-- ✅ user_suspensions: Track banned/suspended users
-- ✅ Helper functions: Check suspension status, calculate threat scores
-- ✅ Auto-incident creation: Critical threats create security incidents automatically
--
-- Admin Capabilities:
-- ✅ View all user actions (audit_logs)
-- ✅ View user threat scores
-- ✅ Ban/suspend users
-- ✅ Review security incidents
-- ✅ Track IP addresses and patterns
--
-- Security Features:
-- ✅ RLS policies: Only admins can view logs
-- ✅ Automatic threat detection and blocking
-- ✅ IP tracking for abuse detection
-- ✅ Geolocation support (optional)
--
-- Next Steps:
-- 1. Create audit logging service (TypeScript)
-- 2. Integrate with file upload handlers
-- 3. Create admin UI for viewing logs
-- 4. Add IP geolocation API integration (optional)
-- =====================================================
