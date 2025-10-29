/**
 * n8n Integration Service
 *
 * Handles pushing workflows to user's n8n instance and monitoring (Growth plan)
 */

import { supabase } from '@/integrations/supabase/client';

export interface N8nConnection {
  id: string;
  user_id: string;
  connection_name: string;
  instance_url: string;
  api_key: string;
  is_active: boolean;
  last_tested_at: string | null;
  last_test_success: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface PushedWorkflow {
  id: string;
  user_id: string;
  connection_id: string;
  workflow_name: string;
  workflow_id: string | null;
  workflow_json: any;
  push_status: 'pending' | 'success' | 'failed';
  error_message: string | null;
  pushed_at: string;

  // Monitoring data (Growth plan)
  last_execution_time: string | null;
  last_execution_status: string | null;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  last_monitored_at: string | null;
}

/**
 * Get all n8n connections for current user
 */
export async function getN8nConnections(): Promise<N8nConnection[]> {
  const { data, error } = await supabase
    .from('n8n_connections')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching n8n connections:', error);
    throw new Error('Failed to fetch n8n connections');
  }

  return data || [];
}

/**
 * Test n8n connection using Edge Function proxy
 */
export async function testN8nConnection(
  connectionId: string
): Promise<{ success: boolean; error?: string; version?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('n8n-proxy', {
      body: {
        action: 'test',
        connectionId: connectionId,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to test connection',
      };
    }

    if (data.success) {
      return {
        success: true,
        version: data.data?.data?.[0]?.version,
      };
    } else {
      return {
        success: false,
        error: data.error || 'Connection test failed',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Save n8n connection (without testing - test happens after save via proxy)
 */
export async function saveN8nConnection(
  connectionName: string,
  instanceUrl: string,
  apiKey: string
): Promise<N8nConnection> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('n8n_connections')
    .insert({
      user_id: user.id,
      connection_name: connectionName,
      instance_url: instanceUrl.replace(/\/$/, ''),
      api_key: apiKey,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving n8n connection:', error);
    throw new Error('Failed to save n8n connection');
  }

  return data;
}

/**
 * Update n8n connection
 */
export async function updateN8nConnection(
  connectionId: string,
  updates: Partial<Omit<N8nConnection, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<N8nConnection> {
  const { data, error } = await supabase
    .from('n8n_connections')
    .update(updates)
    .eq('id', connectionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating n8n connection:', error);
    throw new Error('Failed to update n8n connection');
  }

  return data;
}

/**
 * Delete n8n connection
 */
export async function deleteN8nConnection(connectionId: string): Promise<void> {
  const { error } = await supabase
    .from('n8n_connections')
    .delete()
    .eq('id', connectionId);

  if (error) {
    console.error('Error deleting n8n connection:', error);
    throw new Error('Failed to delete n8n connection');
  }
}

/**
 * Push workflow to n8n instance (Pro plan feature) using Edge Function proxy
 */
export async function pushWorkflowToN8n(
  connectionId: string,
  workflowName: string,
  workflowJson: any
): Promise<PushedWorkflow> {
  try {
    // Push workflow via Edge Function proxy
    const { data: proxyResponse, error: proxyError } = await supabase.functions.invoke('n8n-proxy', {
      body: {
        action: 'push',
        connectionId: connectionId,
        data: {
          workflowName,
          workflowJson,
        },
      },
    });

    if (proxyError) {
      throw new Error(proxyError.message || 'Failed to push workflow');
    }

    if (!proxyResponse.success) {
      throw new Error(proxyResponse.error || 'Failed to push workflow');
    }

    const n8nWorkflow = proxyResponse.data;

    // Save to database
    const { data, error } = await supabase
      .from('pushed_workflows')
      .insert({
        connection_id: connectionId,
        workflow_name: workflowName,
        workflow_id: n8nWorkflow.id || n8nWorkflow.data?.id,
        workflow_json: workflowJson,
        push_status: 'success',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving pushed workflow:', error);
      throw new Error('Workflow pushed but failed to save record');
    }

    return data;
  } catch (error) {
    // Save failed attempt
    const { data } = await supabase
      .from('pushed_workflows')
      .insert({
        connection_id: connectionId,
        workflow_name: workflowName,
        workflow_json: workflowJson,
        push_status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .select()
      .single();

    throw error;
  }
}

/**
 * Get pushed workflows for current user
 */
export async function getPushedWorkflows(connectionId?: string): Promise<PushedWorkflow[]> {
  let query = supabase
    .from('pushed_workflows')
    .select('*')
    .order('pushed_at', { ascending: false });

  if (connectionId) {
    query = query.eq('connection_id', connectionId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching pushed workflows:', error);
    throw new Error('Failed to fetch pushed workflows');
  }

  return data || [];
}

/**
 * Monitor workflow executions (Growth plan feature)
 */
export async function monitorWorkflow(pushedWorkflowId: string): Promise<PushedWorkflow> {
  // Get workflow details
  const { data: workflow, error: workflowError } = await supabase
    .from('pushed_workflows')
    .select('*, n8n_connections(*)')
    .eq('id', pushedWorkflowId)
    .single();

  if (workflowError || !workflow) {
    throw new Error('Workflow not found');
  }

  const connection = workflow.n8n_connections as any;

  try {
    // Get workflow executions from n8n
    const response = await fetch(
      `${connection.instance_url}/api/v1/executions?workflowId=${workflow.workflow_id}`,
      {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': connection.api_key,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch executions: ${response.status}`);
    }

    const executions = await response.json();
    const executionsData = executions.data || [];

    // Calculate stats
    const totalExecutions = executionsData.length;
    const successfulExecutions = executionsData.filter(
      (e: any) => e.finished === true && e.stoppedAt
    ).length;
    const failedExecutions = executionsData.filter(
      (e: any) => e.finished === false || e.data?.resultData?.error
    ).length;

    const lastExecution = executionsData[0];

    // Update workflow with monitoring data
    const { data: updated, error: updateError } = await supabase
      .from('pushed_workflows')
      .update({
        last_execution_time: lastExecution?.startedAt || null,
        last_execution_status: lastExecution?.finished ? 'success' : 'failed',
        total_executions: totalExecutions,
        successful_executions: successfulExecutions,
        failed_executions: failedExecutions,
        last_monitored_at: new Date().toISOString(),
      })
      .eq('id', pushedWorkflowId)
      .select()
      .single();

    if (updateError) {
      throw new Error('Failed to update monitoring data');
    }

    return updated;
  } catch (error) {
    console.error('Error monitoring workflow:', error);
    throw error;
  }
}

/**
 * Get workflow executions from n8n (Growth plan feature - MVP)
 * Simple list of last 20 executions
 */
export async function getWorkflowExecutions(
  connectionId: string,
  workflowId: string,
  limit = 20
): Promise<any[]> {
  try {
    // Get connection details via Edge Function proxy
    const { data: proxyResponse, error: proxyError } = await supabase.functions.invoke('n8n-proxy', {
      body: {
        action: 'getExecutions',
        connectionId: connectionId,
        data: {
          workflowId,
          limit
        }
      }
    });

    if (proxyError) {
      throw new Error(proxyError.message || 'Failed to fetch executions');
    }

    if (!proxyResponse.success) {
      throw new Error(proxyResponse.error || 'Failed to fetch executions');
    }

    return proxyResponse.data?.data || [];
  } catch (error) {
    console.error('Error fetching executions:', error);
    throw error;
  }
}

/**
 * Retry a failed execution (Growth plan feature - MVP)
 */
export async function retryExecution(
  connectionId: string,
  executionId: string
): Promise<any> {
  try {
    const { data: proxyResponse, error: proxyError } = await supabase.functions.invoke('n8n-proxy', {
      body: {
        action: 'retryExecution',
        connectionId: connectionId,
        data: {
          executionId
        }
      }
    });

    if (proxyError) {
      throw new Error(proxyError.message || 'Failed to retry execution');
    }

    if (!proxyResponse.success) {
      throw new Error(proxyResponse.error || 'Failed to retry execution');
    }

    return proxyResponse.data;
  } catch (error) {
    console.error('Error retrying execution:', error);
    throw error;
  }
}

/**
 * Activate/deactivate workflow in n8n
 */
export async function toggleWorkflowActive(
  pushedWorkflowId: string,
  active: boolean
): Promise<void> {
  // Get workflow details
  const { data: workflow, error: workflowError } = await supabase
    .from('pushed_workflows')
    .select('*, n8n_connections(*)')
    .eq('id', pushedWorkflowId)
    .single();

  if (workflowError || !workflow) {
    throw new Error('Workflow not found');
  }

  const connection = workflow.n8n_connections as any;

  // Update workflow status in n8n
  const response = await fetch(
    `${connection.instance_url}/api/v1/workflows/${workflow.workflow_id}`,
    {
      method: 'PATCH',
      headers: {
        'X-N8N-API-KEY': connection.api_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ active }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to toggle workflow: ${response.status} - ${errorText}`);
  }
}
