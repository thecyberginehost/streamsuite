/**
 * Audit Logging Service
 * Tracks all user actions for security and admin monitoring
 */

import { supabase } from '@/integrations/supabase/client';
import type { SanitizationResult } from '@/utils/jsonSanitizer';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export type ActionType =
  | 'workflow_generation'
  | 'workflow_conversion'
  | 'workflow_debug'
  | 'batch_generation'
  | 'file_upload'
  | 'workflow_download'
  | 'workflow_save'
  | 'workflow_delete'
  | 'n8n_push'
  | 'n8n_connection_test'
  | 'credit_purchase'
  | 'credit_deduction'
  | 'login'
  | 'logout'
  | 'settings_change'
  | 'api_call'
  | 'page_view';

export type ActionStatus = 'success' | 'failure' | 'blocked' | 'warning';

export type ThreatType = 'xss' | 'dos' | 'injection' | 'oversized' | 'malformed' | 'suspicious' | 'none';

export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLogEntry {
  action_type: ActionType;
  action_status: ActionStatus;
  action_details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  threat_detected?: boolean;
  threat_type?: ThreatType;
  threat_severity?: ThreatSeverity;
  threat_details?: string;
  credits_used?: number;
  api_calls_made?: number;
  execution_time_ms?: number;
}

export interface UserActivitySummary {
  total_actions: number;
  successful_actions: number;
  failed_actions: number;
  blocked_actions: number;
  threats_detected: number;
  total_credits_used: number;
  total_api_calls: number;
  unique_ips: number;
  first_seen: string;
  last_seen: string;
}

export interface SecurityIncident {
  id: string;
  user_id: string;
  incident_type: string;
  severity: ThreatSeverity;
  description: string;
  evidence: Record<string, any>;
  auto_blocked: boolean;
  admin_reviewed: boolean;
  created_at: string;
}

// =====================================================
// LOGGING FUNCTIONS
// =====================================================

/**
 * Log a user action with threat detection
 */
export async function logAction(entry: AuditLogEntry): Promise<void> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('[AuditService] No user logged in, skipping audit log');
      return;
    }

    // Get IP address and user agent from browser
    const clientInfo = await getClientInfo();

    // Insert audit log
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        ...entry,
        ip_address: entry.ip_address || clientInfo.ipAddress,
        user_agent: entry.user_agent || clientInfo.userAgent
      });

    if (error) {
      console.error('[AuditService] Failed to log action:', error);
    }

    // If critical threat detected, also notify admins (future feature)
    if (entry.threat_detected && entry.threat_severity === 'critical') {
      // TODO: Send real-time notification to admins
      console.warn('[AuditService] CRITICAL THREAT DETECTED:', entry);
    }
  } catch (error) {
    console.error('[AuditService] Error logging action:', error);
  }
}

/**
 * Log a successful action
 */
export async function logSuccess(
  actionType: ActionType,
  details?: Record<string, any>,
  creditsUsed = 0
): Promise<void> {
  await logAction({
    action_type: actionType,
    action_status: 'success',
    action_details: details,
    credits_used: creditsUsed,
    threat_detected: false
  });
}

/**
 * Log a failed action
 */
export async function logFailure(
  actionType: ActionType,
  error: string,
  details?: Record<string, any>
): Promise<void> {
  await logAction({
    action_type: actionType,
    action_status: 'failure',
    action_details: { ...details, error },
    threat_detected: false
  });
}

/**
 * Log a blocked action (security threat)
 */
export async function logBlocked(
  actionType: ActionType,
  threat: SanitizationResult['threat'],
  details?: Record<string, any>
): Promise<void> {
  if (!threat) return;

  await logAction({
    action_type: actionType,
    action_status: 'blocked',
    action_details: details,
    threat_detected: true,
    threat_type: threat.type,
    threat_severity: threat.severity,
    threat_details: threat.details
  });
}

/**
 * Log file upload with sanitization result
 */
export async function logFileUpload(
  fileName: string,
  fileSize: number,
  sanitizationResult: SanitizationResult
): Promise<void> {
  const entry: AuditLogEntry = {
    action_type: 'file_upload',
    action_status: sanitizationResult.valid ? 'success' : 'blocked',
    action_details: {
      file_name: fileName,
      file_size: fileSize,
      warnings: sanitizationResult.warnings
    }
  };

  if (sanitizationResult.threat) {
    entry.threat_detected = true;
    entry.threat_type = sanitizationResult.threat.type;
    entry.threat_severity = sanitizationResult.threat.severity;
    entry.threat_details = sanitizationResult.threat.details;
  }

  await logAction(entry);
}

/**
 * Log workflow generation with timing
 */
export async function logWorkflowGeneration(
  platform: string,
  success: boolean,
  creditsUsed: number,
  executionTimeMs: number,
  workflowName?: string
): Promise<void> {
  await logAction({
    action_type: 'workflow_generation',
    action_status: success ? 'success' : 'failure',
    action_details: {
      platform,
      workflow_name: workflowName
    },
    credits_used: creditsUsed,
    api_calls_made: 1,
    execution_time_ms: executionTimeMs,
    threat_detected: false
  });
}

/**
 * Log n8n workflow push
 */
export async function logN8nPush(
  connectionId: string,
  workflowName: string,
  success: boolean,
  error?: string
): Promise<void> {
  await logAction({
    action_type: 'n8n_push',
    action_status: success ? 'success' : 'failure',
    action_details: {
      connection_id: connectionId,
      workflow_name: workflowName,
      error
    },
    threat_detected: false
  });
}

/**
 * Log credit deduction
 */
export async function logCreditDeduction(
  amount: number,
  reason: string,
  relatedAction?: string
): Promise<void> {
  await logAction({
    action_type: 'credit_deduction',
    action_status: 'success',
    action_details: {
      amount,
      reason,
      related_action: relatedAction
    },
    credits_used: amount,
    threat_detected: false
  });
}

/**
 * Log page view (for suspicious activity detection)
 */
export async function logPageView(pageName: string): Promise<void> {
  // Only log if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await logAction({
    action_type: 'page_view',
    action_status: 'success',
    action_details: { page: pageName },
    threat_detected: false
  });
}

// =====================================================
// QUERY FUNCTIONS (Admin Only)
// =====================================================

/**
 * Get user's audit logs (admin only)
 */
export async function getUserAuditLogs(
  userId: string,
  limit = 100,
  offset = 0
): Promise<any[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[AuditService] Failed to fetch audit logs:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user's activity summary (admin only)
 */
export async function getUserActivitySummary(userId: string): Promise<UserActivitySummary | null> {
  const { data, error } = await supabase
    .rpc('get_user_activity_summary', { p_user_id: userId });

  if (error) {
    console.error('[AuditService] Failed to fetch activity summary:', error);
    return null;
  }

  return data;
}

/**
 * Get user's threat score (admin only)
 */
export async function getUserThreatScore(userId: string): Promise<number> {
  const { data, error } = await supabase
    .rpc('get_user_threat_score', { p_user_id: userId });

  if (error) {
    console.error('[AuditService] Failed to fetch threat score:', error);
    return 0;
  }

  return data || 0;
}

/**
 * Check if user is suspended (admin only)
 */
export async function isUserSuspended(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('is_user_suspended', { p_user_id: userId });

  if (error) {
    console.error('[AuditService] Failed to check suspension status:', error);
    return false;
  }

  return data || false;
}

/**
 * Get security incidents for user (admin only)
 */
export async function getUserSecurityIncidents(
  userId: string,
  limit = 50
): Promise<SecurityIncident[]> {
  const { data, error } = await supabase
    .from('security_incidents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[AuditService] Failed to fetch security incidents:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all unreviewed security incidents (admin only)
 */
export async function getUnreviewedIncidents(limit = 100): Promise<SecurityIncident[]> {
  const { data, error } = await supabase
    .from('security_incidents')
    .select('*')
    .eq('admin_reviewed', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[AuditService] Failed to fetch unreviewed incidents:', error);
    return [];
  }

  return data || [];
}

/**
 * Mark security incident as reviewed (admin only)
 */
export async function reviewSecurityIncident(
  incidentId: string,
  adminAction: string,
  adminNotes?: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('security_incidents')
    .update({
      admin_reviewed: true,
      admin_action: adminAction,
      admin_notes: adminNotes,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', incidentId);

  if (error) {
    console.error('[AuditService] Failed to review incident:', error);
    return false;
  }

  return true;
}

/**
 * Suspend user (admin only)
 */
export async function suspendUser(
  userId: string,
  suspensionType: 'warning' | 'temporary_ban' | 'permanent_ban' | 'feature_restriction',
  reason: string,
  expiresAt?: string,
  evidenceIncidentIds?: string[]
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('user_suspensions')
    .insert({
      user_id: userId,
      suspension_type: suspensionType,
      reason,
      expires_at: expiresAt,
      evidence_incident_ids: evidenceIncidentIds,
      suspended_by: user.id
    });

  if (error) {
    console.error('[AuditService] Failed to suspend user:', error);
    return false;
  }

  // Log the suspension action
  await logAction({
    action_type: 'settings_change',
    action_status: 'success',
    action_details: {
      action: 'user_suspended',
      target_user_id: userId,
      suspension_type: suspensionType,
      reason
    },
    threat_detected: false
  });

  return true;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Get client information (IP, user agent)
 */
async function getClientInfo(): Promise<{ ipAddress: string | null; userAgent: string }> {
  const userAgent = navigator.userAgent;

  // Get IP address from a third-party service (optional)
  // Note: This requires a backend proxy to avoid CORS issues
  let ipAddress: string | null = null;

  try {
    // Optional: Implement IP detection via your backend
    // const response = await fetch('/api/get-client-ip');
    // const data = await response.json();
    // ipAddress = data.ip;
  } catch (error) {
    console.warn('[AuditService] Could not fetch IP address');
  }

  return { ipAddress, userAgent };
}

/**
 * Format threat severity for display
 */
export function formatThreatSeverity(severity: ThreatSeverity): {
  color: string;
  label: string;
  icon: string;
} {
  switch (severity) {
    case 'critical':
      return { color: 'red', label: 'Critical', icon: '🚨' };
    case 'high':
      return { color: 'orange', label: 'High', icon: '⚠️' };
    case 'medium':
      return { color: 'yellow', label: 'Medium', icon: '⚡' };
    case 'low':
      return { color: 'blue', label: 'Low', icon: 'ℹ️' };
  }
}

/**
 * Format action type for display
 */
export function formatActionType(actionType: ActionType): string {
  return actionType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
