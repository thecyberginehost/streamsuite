/**
 * Workflow API Service
 *
 * Provides programmatic access to workflow operations via API keys
 * Supports: Create, Read, Update, Delete workflows
 */

import { supabase } from "@/integrations/supabase/client";

export interface APIWorkflow {
  id: string;
  name: string;
  description?: string;
  platform: 'n8n' | 'make' | 'zapier';
  workflow_json: any;
  client_id?: string;
  project_id?: string;
  is_active?: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  platform: 'n8n' | 'make' | 'zapier';
  workflow_json: any;
  client_id?: string;
  project_id?: string;
  tags?: string[];
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  workflow_json?: any;
  is_active?: boolean;
  tags?: string[];
}

export interface ListWorkflowsParams {
  client_id?: string;
  platform?: 'n8n' | 'make' | 'zapier';
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Validate API Key and get user ID
 */
export async function validateAPIKey(apiKey: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
  try {
    // Hash the API key
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Find the API key in database
    const { data: apiKeyRecord, error } = await supabase
      .from('api_keys')
      .select('user_id, is_active, expires_at, permissions')
      .eq('key_hash', keyHash)
      .single();

    if (error || !apiKeyRecord) {
      return { valid: false, error: 'Invalid API key' };
    }

    // Check if key is active
    if (!apiKeyRecord.is_active) {
      return { valid: false, error: 'API key is inactive' };
    }

    // Check if key is expired
    if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date()) {
      return { valid: false, error: 'API key has expired' };
    }

    // Update last_used_at
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('key_hash', keyHash);

    return { valid: true, userId: apiKeyRecord.user_id };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * Create a new workflow
 */
export async function createWorkflow(
  apiKey: string,
  workflow: CreateWorkflowRequest
): Promise<APIResponse<APIWorkflow>> {
  try {
    // Validate API key
    const validation = await validateAPIKey(apiKey);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Create workflow
    const { data, error } = await supabase
      .from('workflows')
      .insert({
        user_id: validation.userId,
        name: workflow.name,
        description: workflow.description,
        platform: workflow.platform,
        workflow_json: workflow.workflow_json,
        client_id: workflow.client_id,
        project_id: workflow.project_id,
        tags: workflow.tags,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data as APIWorkflow,
      message: 'Workflow created successfully',
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get a workflow by ID
 */
export async function getWorkflow(
  apiKey: string,
  workflowId: string
): Promise<APIResponse<APIWorkflow>> {
  try {
    // Validate API key
    const validation = await validateAPIKey(apiKey);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Get workflow
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('user_id', validation.userId)
      .single();

    if (error || !data) {
      return { success: false, error: 'Workflow not found' };
    }

    return {
      success: true,
      data: data as APIWorkflow,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * List workflows with filters
 */
export async function listWorkflows(
  apiKey: string,
  params: ListWorkflowsParams = {}
): Promise<APIResponse<APIWorkflow[]>> {
  try {
    // Validate API key
    const validation = await validateAPIKey(apiKey);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Build query
    let query = supabase
      .from('workflows')
      .select('*')
      .eq('user_id', validation.userId)
      .order('created_at', { ascending: false });

    if (params.client_id) {
      query = query.eq('client_id', params.client_id);
    }

    if (params.platform) {
      query = query.eq('platform', params.platform);
    }

    if (params.is_active !== undefined) {
      query = query.eq('is_active', params.is_active);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data as APIWorkflow[],
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update a workflow
 */
export async function updateWorkflow(
  apiKey: string,
  workflowId: string,
  updates: UpdateWorkflowRequest
): Promise<APIResponse<APIWorkflow>> {
  try {
    // Validate API key
    const validation = await validateAPIKey(apiKey);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Update workflow
    const { data, error } = await supabase
      .from('workflows')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workflowId)
      .eq('user_id', validation.userId)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: 'Workflow not found or update failed' };
    }

    return {
      success: true,
      data: data as APIWorkflow,
      message: 'Workflow updated successfully',
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete a workflow
 */
export async function deleteWorkflow(
  apiKey: string,
  workflowId: string
): Promise<APIResponse<void>> {
  try {
    // Validate API key
    const validation = await validateAPIKey(apiKey);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Delete workflow
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', workflowId)
      .eq('user_id', validation.userId);

    if (error) {
      return { success: false, error: 'Workflow not found or deletion failed' };
    }

    return {
      success: true,
      message: 'Workflow deleted successfully',
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Activate/Deactivate a workflow
 */
export async function toggleWorkflowStatus(
  apiKey: string,
  workflowId: string,
  isActive: boolean
): Promise<APIResponse<APIWorkflow>> {
  return updateWorkflow(apiKey, workflowId, { is_active: isActive });
}

/**
 * Batch operations
 */
export async function batchCreateWorkflows(
  apiKey: string,
  workflows: CreateWorkflowRequest[]
): Promise<APIResponse<APIWorkflow[]>> {
  try {
    // Validate API key
    const validation = await validateAPIKey(apiKey);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Create all workflows
    const results: APIWorkflow[] = [];
    const errors: string[] = [];

    for (const workflow of workflows) {
      const result = await createWorkflow(apiKey, workflow);
      if (result.success && result.data) {
        results.push(result.data);
      } else {
        errors.push(`${workflow.name}: ${result.error}`);
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: `Some workflows failed to create: ${errors.join(', ')}`,
        data: results,
      };
    }

    return {
      success: true,
      data: results,
      message: `${results.length} workflows created successfully`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Generate workflow from prompt (AI generation via API)
 */
export async function generateWorkflowFromPrompt(
  apiKey: string,
  prompt: string,
  platform: 'n8n' | 'make' | 'zapier',
  clientId?: string
): Promise<APIResponse<APIWorkflow>> {
  try {
    // Validate API key
    const validation = await validateAPIKey(apiKey);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // This would integrate with your AI generation service
    // For now, return a placeholder
    return {
      success: false,
      error: 'AI generation via API coming soon - use the web interface for now',
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
