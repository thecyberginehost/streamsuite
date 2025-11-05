/**
 * n8n API Service
 *
 * Provides integration with n8n instances for workflow management,
 * execution monitoring, and credential handling.
 *
 * Documentation: https://docs.n8n.io/api/
 */

import { supabase } from '@/integrations/supabase/client';

export interface N8NWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes: any[];
  connections: any;
  settings?: any;
  staticData?: any;
  tags?: Array<{ id: string; name: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface N8NExecution {
  id: string;
  finished: boolean;
  mode: 'manual' | 'trigger' | 'webhook' | 'retry';
  retryOf?: string;
  retrySuccessId?: string;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  workflowData?: any;
  data?: any;
  error?: {
    message: string;
    stack?: string;
  };
}

export interface N8NCredential {
  id: string;
  name: string;
  type: string;
  nodesAccess?: Array<{ nodeType: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface N8NConnectionConfig {
  instanceUrl: string;
  apiKey: string;
}

export interface N8NAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Test connection to n8n instance
 */
export async function testN8NConnection(
  config: N8NConnectionConfig
): Promise<N8NAPIResponse<{ version: string; executionMode: string }>> {
  try {
    const response = await fetch(`${config.instanceUrl}/api/v1/workflows?limit=1`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': config.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Connection failed: ${response.status} - ${error}`,
      };
    }

    // Connection successful
    return {
      success: true,
      data: {
        version: 'n8n', // n8n doesn't return version in workflow list, but connection works
        executionMode: 'regular',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * List all workflows from n8n instance
 */
export async function listN8NWorkflows(
  config: N8NConnectionConfig
): Promise<N8NAPIResponse<N8NWorkflow[]>> {
  try {
    const response = await fetch(`${config.instanceUrl}/api/v1/workflows`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': config.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to list workflows: ${response.status} - ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || data, // Handle both {data: []} and [] responses
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get single workflow details
 */
export async function getN8NWorkflow(
  config: N8NConnectionConfig,
  workflowId: string
): Promise<N8NAPIResponse<N8NWorkflow>> {
  try {
    const response = await fetch(`${config.instanceUrl}/api/v1/workflows/${workflowId}`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': config.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to get workflow: ${response.status} - ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create new workflow in n8n
 */
export async function createN8NWorkflow(
  config: N8NConnectionConfig,
  workflow: Partial<N8NWorkflow>
): Promise<N8NAPIResponse<N8NWorkflow>> {
  try {
    const response = await fetch(`${config.instanceUrl}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workflow),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to create workflow: ${response.status} - ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update existing workflow
 */
export async function updateN8NWorkflow(
  config: N8NConnectionConfig,
  workflowId: string,
  workflow: Partial<N8NWorkflow>
): Promise<N8NAPIResponse<N8NWorkflow>> {
  try {
    const response = await fetch(`${config.instanceUrl}/api/v1/workflows/${workflowId}`, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workflow),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to update workflow: ${response.status} - ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete workflow
 */
export async function deleteN8NWorkflow(
  config: N8NConnectionConfig,
  workflowId: string
): Promise<N8NAPIResponse<void>> {
  try {
    const response = await fetch(`${config.instanceUrl}/api/v1/workflows/${workflowId}`, {
      method: 'DELETE',
      headers: {
        'X-N8N-API-KEY': config.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to delete workflow: ${response.status} - ${error}`,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Activate workflow
 */
export async function activateN8NWorkflow(
  config: N8NConnectionConfig,
  workflowId: string
): Promise<N8NAPIResponse<N8NWorkflow>> {
  try {
    // Get current workflow
    const workflowResult = await getN8NWorkflow(config, workflowId);
    if (!workflowResult.success || !workflowResult.data) {
      return {
        success: false,
        error: workflowResult.error || 'Failed to get workflow',
      };
    }

    // Update with active: true
    return await updateN8NWorkflow(config, workflowId, {
      ...workflowResult.data,
      active: true,
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Deactivate workflow
 */
export async function deactivateN8NWorkflow(
  config: N8NConnectionConfig,
  workflowId: string
): Promise<N8NAPIResponse<N8NWorkflow>> {
  try {
    // Get current workflow
    const workflowResult = await getN8NWorkflow(config, workflowId);
    if (!workflowResult.success || !workflowResult.data) {
      return {
        success: false,
        error: workflowResult.error || 'Failed to get workflow',
      };
    }

    // Update with active: false
    return await updateN8NWorkflow(config, workflowId, {
      ...workflowResult.data,
      active: false,
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * List executions for a workflow
 */
export async function listN8NExecutions(
  config: N8NConnectionConfig,
  workflowId?: string,
  limit: number = 20
): Promise<N8NAPIResponse<N8NExecution[]>> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(workflowId && { workflowId }),
    });

    const response = await fetch(`${config.instanceUrl}/api/v1/executions?${params}`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': config.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to list executions: ${response.status} - ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get execution details
 */
export async function getN8NExecution(
  config: N8NConnectionConfig,
  executionId: string
): Promise<N8NAPIResponse<N8NExecution>> {
  try {
    const response = await fetch(`${config.instanceUrl}/api/v1/executions/${executionId}`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': config.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to get execution: ${response.status} - ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Trigger workflow execution
 */
export async function executeN8NWorkflow(
  config: N8NConnectionConfig,
  workflowId: string
): Promise<N8NAPIResponse<{ executionId: string }>> {
  try {
    const response = await fetch(`${config.instanceUrl}/api/v1/workflows/${workflowId}/execute`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': config.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to execute workflow: ${response.status} - ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: { executionId: data.id || data.executionId },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * List credentials
 */
export async function listN8NCredentials(
  config: N8NConnectionConfig
): Promise<N8NAPIResponse<N8NCredential[]>> {
  try {
    const response = await fetch(`${config.instanceUrl}/api/v1/credentials`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': config.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to list credentials: ${response.status} - ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get workflow execution statistics
 */
export async function getN8NWorkflowStats(
  config: N8NConnectionConfig,
  workflowId: string
): Promise<N8NAPIResponse<{
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
}>> {
  try {
    const executionsResult = await listN8NExecutions(config, workflowId, 100);

    if (!executionsResult.success || !executionsResult.data) {
      return {
        success: false,
        error: executionsResult.error || 'Failed to get executions',
      };
    }

    const executions = executionsResult.data;
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.finished && !e.error).length;
    const failedExecutions = executions.filter(e => e.error).length;
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

    return {
      success: true,
      data: {
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        successRate,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * ============================================================================
 * PROXY-BASED API FUNCTIONS (CORS-safe)
 * ============================================================================
 * These functions call the Supabase Edge Function proxy instead of making
 * direct API calls to n8n, which avoids CORS issues.
 */

/**
 * Call n8n proxy edge function
 */
async function callN8NProxy(action: string, connectionId: string, data?: any): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await supabase.functions.invoke('n8n-proxy', {
    body: {
      action,
      connectionId,
      data,
    },
  });

  if (response.error) {
    throw new Error(response.error.message || 'Proxy request failed');
  }

  if (!response.data.success) {
    throw new Error(response.data.error || 'Unknown error');
  }

  return response.data.data;
}

/**
 * List workflows via proxy (CORS-safe)
 */
export async function listN8NWorkflowsViaProxy(
  connectionId: string
): Promise<N8NAPIResponse<N8NWorkflow[]>> {
  try {
    const data = await callN8NProxy('listWorkflows', connectionId);
    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Toggle workflow active status via proxy (CORS-safe)
 */
export async function toggleN8NWorkflowViaProxy(
  connectionId: string,
  workflowId: string,
  active: boolean
): Promise<N8NAPIResponse<N8NWorkflow>> {
  try {
    const data = await callN8NProxy('toggleActive', connectionId, { workflowId, active });
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test connection via proxy (CORS-safe)
 */
export async function testN8NConnectionViaProxy(
  connectionId: string
): Promise<N8NAPIResponse<{ version: string; executionMode: string }>> {
  try {
    await callN8NProxy('test', connectionId);
    return {
      success: true,
      data: {
        version: 'n8n',
        executionMode: 'regular',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get workflow executions via proxy (CORS-safe)
 */
export async function listN8NExecutionsViaProxy(
  connectionId: string,
  workflowId: string,
  limit: number = 20
): Promise<N8NAPIResponse<N8NExecution[]>> {
  try {
    const data = await callN8NProxy('getExecutions', connectionId, { workflowId, limit });
    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
