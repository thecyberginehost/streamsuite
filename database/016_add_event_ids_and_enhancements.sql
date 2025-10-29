-- =====================================================
-- 016_add_event_ids_and_enhancements.sql
-- Add Event IDs, Full Prompts, Credit Tracking, Copy/Paste Detection
-- =====================================================

-- =====================================================
-- ADD EVENT ID COLUMN
-- =====================================================

ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS event_id TEXT;

-- Add index for event ID filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_id ON public.audit_logs(event_id);

-- =====================================================
-- ADD FULL PROMPT STORAGE
-- =====================================================

-- Store full prompts (not truncated) for admin review
ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS full_prompt TEXT;

-- =====================================================
-- ENHANCED CREDIT TRACKING
-- =====================================================

-- Track credit balance before and after action
ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS credits_before INTEGER,
ADD COLUMN IF NOT EXISTS credits_after INTEGER;

-- =====================================================
-- COPY/PASTE DETECTION
-- =====================================================

-- Track if user copy/pasted content
ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS input_method TEXT CHECK (input_method IN ('typed', 'pasted', 'mixed', 'unknown'));

-- Track paste event count (for bot detection)
ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS paste_event_count INTEGER DEFAULT 0;

-- =====================================================
-- GEOLOCATION DATA
-- =====================================================

-- Store geolocation information from IP
ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS geolocation JSONB;

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_geolocation ON public.audit_logs USING gin(geolocation);

-- =====================================================
-- ERROR DETAILS
-- =====================================================

-- Store structured error information
ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS error_code TEXT,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS error_stack TEXT;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Get event code legend (for admin UI)
CREATE OR REPLACE FUNCTION get_event_code_legend()
RETURNS TABLE(
  event_id TEXT,
  category TEXT,
  description TEXT,
  severity TEXT,
  action_required TEXT,
  occurrence_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.event_id,
    CASE
      WHEN al.event_id LIKE 'GEN-%' THEN 'Generation'
      WHEN al.event_id LIKE 'CVT-%' THEN 'Conversion'
      WHEN al.event_id LIKE 'DBG-%' THEN 'Debug'
      WHEN al.event_id LIKE 'SEC-%' THEN 'Security'
      WHEN al.event_id LIKE 'CRD-%' THEN 'Credits'
      WHEN al.event_id LIKE 'N8N-%' THEN 'n8n Integration'
      WHEN al.event_id LIKE 'USR-%' THEN 'User Action'
      WHEN al.event_id LIKE 'SYS-%' THEN 'System'
      ELSE 'Unknown'
    END as category,
    'Event description' as description,
    CASE
      WHEN al.threat_severity IS NOT NULL THEN al.threat_severity
      WHEN al.action_status = 'blocked' THEN 'high'
      WHEN al.action_status = 'failure' THEN 'medium'
      WHEN al.action_status = 'warning' THEN 'low'
      ELSE 'low'
    END as severity,
    '' as action_required,
    COUNT(*) as occurrence_count
  FROM public.audit_logs al
  WHERE al.event_id IS NOT NULL
  GROUP BY al.event_id, al.threat_severity, al.action_status
  ORDER BY occurrence_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function: Detect suspicious patterns (rapid actions, excessive paste)
CREATE OR REPLACE FUNCTION detect_suspicious_activity(p_user_id UUID, p_time_window_minutes INTEGER DEFAULT 5)
RETURNS JSONB AS $$
DECLARE
  v_recent_actions INTEGER;
  v_paste_ratio NUMERIC;
  v_failed_ratio NUMERIC;
  v_threat_count INTEGER;
  v_is_suspicious BOOLEAN := false;
  v_reasons TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Count recent actions
  SELECT COUNT(*) INTO v_recent_actions
  FROM public.audit_logs
  WHERE user_id = p_user_id
    AND created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;

  -- Calculate paste ratio (pasted vs typed)
  SELECT
    COALESCE(
      COUNT(*) FILTER (WHERE input_method = 'pasted')::NUMERIC /
      NULLIF(COUNT(*), 0),
      0
    ) INTO v_paste_ratio
  FROM public.audit_logs
  WHERE user_id = p_user_id
    AND created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL
    AND input_method IS NOT NULL;

  -- Calculate failure ratio
  SELECT
    COALESCE(
      COUNT(*) FILTER (WHERE action_status = 'failure')::NUMERIC /
      NULLIF(COUNT(*), 0),
      0
    ) INTO v_failed_ratio
  FROM public.audit_logs
  WHERE user_id = p_user_id
    AND created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;

  -- Count recent threats
  SELECT COUNT(*) INTO v_threat_count
  FROM public.audit_logs
  WHERE user_id = p_user_id
    AND created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL
    AND threat_detected = true;

  -- Evaluate suspicion criteria
  IF v_recent_actions > 20 THEN
    v_is_suspicious := true;
    v_reasons := array_append(v_reasons, 'Rapid actions detected');
  END IF;

  IF v_paste_ratio > 0.8 THEN
    v_is_suspicious := true;
    v_reasons := array_append(v_reasons, 'Excessive copy/paste behavior');
  END IF;

  IF v_failed_ratio > 0.5 AND v_recent_actions > 5 THEN
    v_is_suspicious := true;
    v_reasons := array_append(v_reasons, 'High failure rate');
  END IF;

  IF v_threat_count > 0 THEN
    v_is_suspicious := true;
    v_reasons := array_append(v_reasons, 'Security threats detected');
  END IF;

  RETURN jsonb_build_object(
    'is_suspicious', v_is_suspicious,
    'reasons', v_reasons,
    'metrics', jsonb_build_object(
      'recent_actions', v_recent_actions,
      'paste_ratio', ROUND(v_paste_ratio, 2),
      'failed_ratio', ROUND(v_failed_ratio, 2),
      'threat_count', v_threat_count
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- CSV EXPORT FUNCTION
-- =====================================================

-- Function to export audit logs as CSV (for download)
-- Note: This returns CSV-formatted text that can be downloaded
CREATE OR REPLACE FUNCTION export_audit_logs_csv(
  p_user_id UUID DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TEXT AS $$
DECLARE
  v_csv TEXT;
BEGIN
  -- Build CSV header
  v_csv := 'Event ID,Timestamp,User ID,Action Type,Status,Credits Used,IP Address,User Agent,Threat Detected,Threat Type,Threat Severity,Details' || E'\n';

  -- Build CSV rows
  SELECT v_csv || string_agg(
    COALESCE(event_id, 'N/A') || ',' ||
    to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') || ',' ||
    user_id::TEXT || ',' ||
    action_type || ',' ||
    action_status || ',' ||
    COALESCE(credits_used::TEXT, '0') || ',' ||
    COALESCE(host(ip_address), 'N/A') || ',' ||
    COALESCE('"' || replace(user_agent, '"', '""') || '"', 'N/A') || ',' ||
    threat_detected::TEXT || ',' ||
    COALESCE(threat_type, 'N/A') || ',' ||
    COALESCE(threat_severity, 'N/A') || ',' ||
    COALESCE('"' || replace(action_details::TEXT, '"', '""') || '"', 'N/A'),
    E'\n'
  ) INTO v_csv
  FROM public.audit_logs
  WHERE (p_user_id IS NULL OR user_id = p_user_id)
    AND created_at BETWEEN p_start_date AND p_end_date
  ORDER BY created_at DESC;

  RETURN v_csv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check new columns exist
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'audit_logs'
  AND column_name IN ('event_id', 'full_prompt', 'credits_before', 'credits_after', 'input_method', 'paste_event_count', 'geolocation', 'error_code', 'error_message', 'error_stack')
ORDER BY column_name;

-- Verify new functions exist
SELECT
  routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_event_code_legend', 'detect_suspicious_activity', 'export_audit_logs_csv')
ORDER BY routine_name;

-- =====================================================
-- NOTES
-- =====================================================
--
-- New Features Added:
-- ✅ Event ID system for categorized logging
-- ✅ Full prompt storage (not truncated)
-- ✅ Before/after credit balance tracking
-- ✅ Copy/paste detection for bot identification
-- ✅ Geolocation storage from IP data
-- ✅ Structured error tracking (code, message, stack)
-- ✅ Event code legend generator
-- ✅ Suspicious activity detector
-- ✅ CSV export function for audit logs
--
-- Admin Capabilities Added:
-- ✅ Filter logs by event ID
-- ✅ View full prompts (not truncated)
-- ✅ Track credit changes per action
-- ✅ Detect automated bot behavior
-- ✅ Export logs as CSV for external analysis
-- ✅ View event code statistics
--
-- =====================================================
