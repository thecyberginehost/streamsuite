/**
 * Event Code System for Audit Logging
 * Provides categorized event IDs for quick identification and filtering
 */

export interface EventCode {
  code: string;
  category: 'success' | 'warning' | 'error' | 'security' | 'system';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actionRequired?: string;
}

/**
 * Event Code Categories:
 * - GEN-xxxx: Generation events (workflow, code)
 * - CVT-xxxx: Conversion events
 * - DBG-xxxx: Debug events
 * - SEC-xxxx: Security events (threats, blocks)
 * - CRD-xxxx: Credit/billing events
 * - N8N-xxxx: n8n integration events
 * - SYS-xxxx: System events
 * - USR-xxxx: User action events
 */

export const EVENT_CODES: Record<string, EventCode> = {
  // =====================================================
  // GENERATION EVENTS (GEN-xxxx)
  // =====================================================
  'GEN-1000': {
    code: 'GEN-1000',
    category: 'success',
    description: 'Workflow generation completed successfully',
    severity: 'low'
  },
  'GEN-1001': {
    code: 'GEN-1001',
    category: 'success',
    description: 'Code generation completed successfully',
    severity: 'low'
  },
  'GEN-2001': {
    code: 'GEN-2001',
    category: 'error',
    description: 'Workflow generation failed - API timeout',
    severity: 'medium',
    actionRequired: 'Retry generation. If persists, check API status.'
  },
  'GEN-2002': {
    code: 'GEN-2002',
    category: 'error',
    description: 'Workflow generation failed - Invalid prompt',
    severity: 'low',
    actionRequired: 'User should revise prompt and try again.'
  },
  'GEN-2003': {
    code: 'GEN-2003',
    category: 'error',
    description: 'Workflow generation failed - Token limit exceeded',
    severity: 'medium',
    actionRequired: 'User should simplify prompt or break into smaller workflows.'
  },
  'GEN-2004': {
    code: 'GEN-2004',
    category: 'error',
    description: 'Code generation failed - API error',
    severity: 'medium',
    actionRequired: 'Check Claude API status and retry.'
  },

  // =====================================================
  // CONVERSION EVENTS (CVT-xxxx)
  // =====================================================
  'CVT-1000': {
    code: 'CVT-1000',
    category: 'success',
    description: 'Workflow conversion completed successfully',
    severity: 'low'
  },
  'CVT-2001': {
    code: 'CVT-2001',
    category: 'error',
    description: 'Conversion failed - Unsupported platform',
    severity: 'medium',
    actionRequired: 'Check platform compatibility.'
  },
  'CVT-2002': {
    code: 'CVT-2002',
    category: 'error',
    description: 'Conversion failed - Malformed workflow JSON',
    severity: 'medium',
    actionRequired: 'Validate source workflow JSON format.'
  },

  // =====================================================
  // DEBUG EVENTS (DBG-xxxx)
  // =====================================================
  'DBG-1000': {
    code: 'DBG-1000',
    category: 'success',
    description: 'Workflow debug completed successfully',
    severity: 'low'
  },
  'DBG-2001': {
    code: 'DBG-2001',
    category: 'error',
    description: 'Debug failed - Unable to parse workflow',
    severity: 'medium',
    actionRequired: 'Check workflow JSON syntax.'
  },

  // =====================================================
  // SECURITY EVENTS (SEC-xxxx)
  // =====================================================
  'SEC-3001': {
    code: 'SEC-3001',
    category: 'security',
    description: 'XSS attempt detected and blocked',
    severity: 'critical',
    actionRequired: 'Review user activity. Consider suspension if repeated.'
  },
  'SEC-3002': {
    code: 'SEC-3002',
    category: 'security',
    description: 'DoS attempt detected - Oversized file upload',
    severity: 'high',
    actionRequired: 'Monitor user for abuse patterns.'
  },
  'SEC-3003': {
    code: 'SEC-3003',
    category: 'security',
    description: 'Prompt injection attempt detected',
    severity: 'high',
    actionRequired: 'Review prompt content. May indicate AI abuse.'
  },
  'SEC-3004': {
    code: 'SEC-3004',
    category: 'security',
    description: 'Malicious file upload blocked',
    severity: 'critical',
    actionRequired: 'Review file content. Consider immediate suspension.'
  },
  'SEC-3005': {
    code: 'SEC-3005',
    category: 'security',
    description: 'Suspicious activity pattern detected',
    severity: 'medium',
    actionRequired: 'Monitor for automated bot behavior.'
  },
  'SEC-3006': {
    code: 'SEC-3006',
    category: 'security',
    description: 'Multiple failed login attempts',
    severity: 'medium',
    actionRequired: 'Possible brute force. Enable 2FA.'
  },
  'SEC-3007': {
    code: 'SEC-3007',
    category: 'security',
    description: 'Rate limit exceeded',
    severity: 'medium',
    actionRequired: 'User exceeding API limits. May be bot.'
  },
  'SEC-3008': {
    code: 'SEC-3008',
    category: 'security',
    description: 'Unethical prompt content detected',
    severity: 'high',
    actionRequired: 'Review prompt. May violate ToS.'
  },

  // =====================================================
  // CREDIT EVENTS (CRD-xxxx)
  // =====================================================
  'CRD-1000': {
    code: 'CRD-1000',
    category: 'success',
    description: 'Credits deducted successfully',
    severity: 'low'
  },
  'CRD-1001': {
    code: 'CRD-1001',
    category: 'success',
    description: 'Credits refunded successfully',
    severity: 'low'
  },
  'CRD-2001': {
    code: 'CRD-2001',
    category: 'warning',
    description: 'Insufficient credits for operation',
    severity: 'low',
    actionRequired: 'User needs to purchase more credits.'
  },
  'CRD-2002': {
    code: 'CRD-2002',
    category: 'error',
    description: 'Credit deduction failed - Database error',
    severity: 'high',
    actionRequired: 'Check database connection. May require manual credit adjustment.'
  },
  'CRD-2003': {
    code: 'CRD-2003',
    category: 'warning',
    description: 'Credits deducted but operation failed',
    severity: 'medium',
    actionRequired: 'May require refund. Review transaction.'
  },

  // =====================================================
  // N8N EVENTS (N8N-xxxx)
  // =====================================================
  'N8N-1000': {
    code: 'N8N-1000',
    category: 'success',
    description: 'Workflow pushed to n8n successfully',
    severity: 'low'
  },
  'N8N-1001': {
    code: 'N8N-1001',
    category: 'success',
    description: 'n8n connection test successful',
    severity: 'low'
  },
  'N8N-2001': {
    code: 'N8N-2001',
    category: 'error',
    description: 'n8n push failed - Authentication error',
    severity: 'medium',
    actionRequired: 'User needs to check API key.'
  },
  'N8N-2002': {
    code: 'N8N-2002',
    category: 'error',
    description: 'n8n push failed - Network error',
    severity: 'medium',
    actionRequired: 'Check n8n instance URL and connectivity.'
  },
  'N8N-2003': {
    code: 'N8N-2003',
    category: 'error',
    description: 'n8n connection test failed',
    severity: 'low',
    actionRequired: 'User needs to update connection settings.'
  },

  // =====================================================
  // SYSTEM EVENTS (SYS-xxxx)
  // =====================================================
  'SYS-1000': {
    code: 'SYS-1000',
    category: 'system',
    description: 'User logged in successfully',
    severity: 'low'
  },
  'SYS-1001': {
    code: 'SYS-1001',
    category: 'system',
    description: 'User logged out',
    severity: 'low'
  },
  'SYS-2001': {
    code: 'SYS-2001',
    category: 'error',
    description: 'Database connection error',
    severity: 'critical',
    actionRequired: 'Check Supabase status immediately.'
  },
  'SYS-2002': {
    code: 'SYS-2002',
    category: 'error',
    description: 'API service unavailable',
    severity: 'high',
    actionRequired: 'Check Claude API status.'
  },

  // =====================================================
  // USER ACTION EVENTS (USR-xxxx)
  // =====================================================
  'USR-1000': {
    code: 'USR-1000',
    category: 'success',
    description: 'Workflow saved to history',
    severity: 'low'
  },
  'USR-1001': {
    code: 'USR-1001',
    category: 'success',
    description: 'Workflow downloaded',
    severity: 'low'
  },
  'USR-1002': {
    code: 'USR-1002',
    category: 'success',
    description: 'Settings updated',
    severity: 'low'
  },
  'USR-2001': {
    code: 'USR-2001',
    category: 'warning',
    description: 'Bulk copy/paste detected',
    severity: 'low',
    actionRequired: 'May indicate bot behavior. Monitor for patterns.'
  },
  'USR-2002': {
    code: 'USR-2002',
    category: 'warning',
    description: 'Rapid consecutive actions detected',
    severity: 'low',
    actionRequired: 'Possible automation. Check for bot activity.'
  }
};

/**
 * Get event code details
 */
export function getEventCode(code: string): EventCode | undefined {
  return EVENT_CODES[code];
}

/**
 * Get all event codes by category
 */
export function getEventCodesByCategory(category: EventCode['category']): EventCode[] {
  return Object.values(EVENT_CODES).filter(event => event.category === category);
}

/**
 * Get all event codes by severity
 */
export function getEventCodesBySeverity(severity: EventCode['severity']): EventCode[] {
  return Object.values(EVENT_CODES).filter(event => event.severity === severity);
}

/**
 * Generate event ID for action
 */
export function generateEventId(
  actionType: string,
  actionStatus: 'success' | 'failure' | 'blocked' | 'warning',
  errorType?: string
): string {
  // Map action types to event code prefixes
  const prefix = actionType.startsWith('workflow_generation') ? 'GEN' :
                 actionType.startsWith('workflow_conversion') ? 'CVT' :
                 actionType.startsWith('workflow_debug') ? 'DBG' :
                 actionType.startsWith('n8n') ? 'N8N' :
                 actionType.startsWith('credit') ? 'CRD' :
                 actionType.startsWith('file_upload') ? 'SEC' :
                 'USR';

  // Success codes end in 000-999, errors in 2000-2999, security in 3000-3999
  if (actionStatus === 'success') {
    return `${prefix}-1000`;
  } else if (actionStatus === 'blocked' || errorType?.includes('xss') || errorType?.includes('injection')) {
    return `${prefix}-3001`; // Security event
  } else if (actionStatus === 'failure') {
    return `${prefix}-2001`; // Generic failure
  } else if (actionStatus === 'warning') {
    return `${prefix}-2001`; // Warning
  }

  return `${prefix}-0000`; // Unknown
}

/**
 * Format event code for display
 */
export function formatEventCode(code: string): {
  badge: string;
  color: string;
  tooltip: string;
} {
  const event = getEventCode(code);

  if (!event) {
    return {
      badge: code,
      color: 'gray',
      tooltip: 'Unknown event'
    };
  }

  const colors = {
    success: 'green',
    warning: 'yellow',
    error: 'red',
    security: 'purple',
    system: 'blue'
  };

  return {
    badge: event.code,
    color: colors[event.category],
    tooltip: `${event.description}${event.actionRequired ? '\n\nAction: ' + event.actionRequired : ''}`
  };
}

/**
 * Search event codes by keyword
 */
export function searchEventCodes(keyword: string): EventCode[] {
  const lowerKeyword = keyword.toLowerCase();
  return Object.values(EVENT_CODES).filter(
    event =>
      event.code.toLowerCase().includes(lowerKeyword) ||
      event.description.toLowerCase().includes(lowerKeyword) ||
      event.actionRequired?.toLowerCase().includes(lowerKeyword)
  );
}
