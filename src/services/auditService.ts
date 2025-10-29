/**
 * Audit Logging Service
 * Tracks all user actions for security and admin monitoring
 */

import { supabase } from '@/integrations/supabase/client';
import type { SanitizationResult } from '@/utils/jsonSanitizer';
import { generateEventId, getEventCode } from '@/lib/eventCodes';

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
  // New fields for enhanced tracking
  event_id?: string;
  full_prompt?: string;
  credits_before?: number;
  credits_after?: number;
  input_method?: 'typed' | 'pasted' | 'mixed' | 'unknown';
  paste_event_count?: number;
  geolocation?: Record<string, any>;
  error_code?: string;
  error_message?: string;
  error_stack?: string;
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

    // Get IP address, user agent, and geolocation from browser
    const clientInfo = await getClientInfo();

    // Auto-generate event ID if not provided
    const eventId = entry.event_id || generateEventId(
      entry.action_type,
      entry.action_status,
      entry.threat_type
    );

    console.log('[AuditService] Logging action:', {
      action_type: entry.action_type,
      action_status: entry.action_status,
      event_id: eventId,
      has_ip: !!clientInfo.ipAddress,
      has_geolocation: !!clientInfo.geolocation
    });

    // Insert audit log with all new fields
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        ...entry,
        event_id: eventId,
        ip_address: entry.ip_address || clientInfo.ipAddress,
        user_agent: entry.user_agent || clientInfo.userAgent,
        geolocation: entry.geolocation || clientInfo.geolocation
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
  // Extract credits_used from details if provided there
  const extractedCredits = details?.credits_used || creditsUsed;
  const extractedApiCalls = details?.api_calls_made || 0;
  const extractedExecutionTime = details?.time_taken_ms || details?.execution_time_ms || undefined;

  await logAction({
    action_type: actionType,
    action_status: 'success',
    action_details: details,
    credits_used: extractedCredits,
    api_calls_made: extractedApiCalls,
    execution_time_ms: extractedExecutionTime,
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
 * Export user audit logs as CSV (admin only)
 */
export async function exportAuditLogsCSV(userId: string, userEmail: string): Promise<void> {
  try {
    // Fetch all logs for user
    const logs = await getUserAuditLogs(userId, 1000);

    if (logs.length === 0) {
      throw new Error('No audit logs found for this user');
    }

    // Build CSV content
    const headers = [
      'Event ID',
      'Timestamp',
      'Action Type',
      'Status',
      'Credits Used',
      'IP Address',
      'Location',
      'User Agent',
      'Threat Detected',
      'Threat Type',
      'Threat Severity',
      'Details'
    ];

    const rows = logs.map(log => [
      log.event_id || 'N/A',
      new Date(log.created_at).toISOString(),
      log.action_type,
      log.action_status,
      log.credits_used || 0,
      log.ip_address || 'N/A',
      log.geolocation ? `${log.geolocation.city}, ${log.geolocation.country}` : 'N/A',
      log.user_agent || 'N/A',
      log.threat_detected ? 'Yes' : 'No',
      log.threat_type || 'N/A',
      log.threat_severity || 'N/A',
      JSON.stringify(log.action_details || {})
    ]);

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create and download blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-log-${userEmail.replace('@', '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[AuditService] Failed to export CSV:', error);
    throw error;
  }
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
 * Get client information (IP, user agent, geolocation)
 * Uses ipapi.co for IP detection (free tier: 1000 requests/day)
 */
async function getClientInfo(): Promise<{
  ipAddress: string | null;
  userAgent: string;
  geolocation: Record<string, any> | null;
}> {
  const userAgent = navigator.userAgent;
  let ipAddress: string | null = null;
  let geolocation: Record<string, any> | null = null;

  try {
    // Try to get IP and geolocation from ipapi.co (free, no auth required)
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      ipAddress = data.ip || null;

      // Store geolocation data
      if (data.city && data.country_name) {
        geolocation = {
          city: data.city,
          region: data.region,
          country: data.country_name,
          country_code: data.country_code,
          postal: data.postal,
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.timezone,
          org: data.org // ISP/Organization
        };
        console.log(`[AuditService] Location detected: ${data.city}, ${data.country_name}`);
      }
    }
  } catch (error) {
    console.warn('[AuditService] Could not fetch IP address:', error);

    // Fallback: Try ipify as backup (simpler, IP only, no geolocation)
    try {
      const fallbackResponse = await fetch('https://api.ipify.org?format=json');
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        ipAddress = fallbackData.ip || null;
      }
    } catch (fallbackError) {
      console.warn('[AuditService] Fallback IP detection failed');
    }
  }

  return { ipAddress, userAgent, geolocation };
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
