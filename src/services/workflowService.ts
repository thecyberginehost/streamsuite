/**
 * Workflow Service
 *
 * Manages workflow persistence in Supabase - save, load, update, and delete
 * user-generated workflows.
 */

import { supabase } from '@/integrations/supabase/client';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  platform: 'n8n' | 'make' | 'zapier';
  workflow_json: any;
  prompt?: string;
  template_used?: string;
  credits_used: number;
  tokens_used: number;
  is_favorite: boolean;
  is_template: boolean;
  template_name?: string;
  template_description?: string;
  folder_id?: string | null;  // For organizing templates into folders
  tags: string[];
  status: 'success' | 'failed' | 'pending';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface SaveWorkflowRequest {
  name: string;
  description?: string;
  platform: 'n8n' | 'make' | 'zapier';
  workflowJson: any;
  prompt?: string;
  templateUsed?: string;
  creditsUsed?: number;
  tokensUsed?: number;
  tags?: string[];
  status?: 'success' | 'failed' | 'pending';
  errorMessage?: string;
}

export interface UpdateWorkflowRequest {
  id: string;
  name?: string;
  description?: string;
  isFavorite?: boolean;
  isTemplate?: boolean;
  templateName?: string;
  templateDescription?: string;
  tags?: string[];
  status?: 'success' | 'failed' | 'pending';
  errorMessage?: string;
}

// =====================================================
// WORKFLOW CRUD OPERATIONS
// =====================================================

/**
 * Save a new workflow to the database
 */
export async function saveWorkflow(request: SaveWorkflowRequest): Promise<Workflow> {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to save workflows');
    }

    // Insert workflow
    const { data, error } = await supabase
      .from('workflows')
      .insert({
        user_id: user.id,
        name: request.name,
        description: request.description,
        platform: request.platform,
        workflow_json: request.workflowJson,
        prompt: request.prompt,
        template_used: request.templateUsed,
        credits_used: request.creditsUsed || 1,
        tokens_used: request.tokensUsed || 0,
        tags: request.tags || [],
        status: request.status || 'pending',
        error_message: request.errorMessage
      })
      .select()
      .single();

    if (error) {
      console.error('Save workflow error:', error);
      throw new Error('Failed to save workflow to database');
    }

    // Update user's total workflow count
    await updateUserWorkflowCount(user.id);

    return data;
  } catch (error) {
    console.error('Save workflow error:', error);
    throw error instanceof Error ? error : new Error('Failed to save workflow');
  }
}

/**
 * Get all workflows for the current user
 */
export async function getUserWorkflows(): Promise<Workflow[]> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to view workflows');
    }

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get workflows error:', error);
      throw new Error('Failed to load workflows');
    }

    return data || [];
  } catch (error) {
    console.error('Get workflows error:', error);
    throw error instanceof Error ? error : new Error('Failed to load workflows');
  }
}

/**
 * Get user's saved templates
 */
export async function getUserTemplates(): Promise<Workflow[]> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to view templates');
    }

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_template', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get templates error:', error);
      throw new Error('Failed to load templates');
    }

    return data || [];
  } catch (error) {
    console.error('Get templates error:', error);
    throw error instanceof Error ? error : new Error('Failed to load templates');
  }
}

/**
 * Get a specific workflow by ID
 */
export async function getWorkflowById(workflowId: string): Promise<Workflow | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to view workflows');
    }

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Get workflow error:', error);
      throw new Error('Failed to load workflow');
    }

    return data;
  } catch (error) {
    console.error('Get workflow error:', error);
    throw error instanceof Error ? error : new Error('Failed to load workflow');
  }
}

/**
 * Update an existing workflow
 */
export async function updateWorkflow(request: UpdateWorkflowRequest): Promise<Workflow> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to update workflows');
    }

    // Build update object
    const updates: any = {};
    if (request.name !== undefined) updates.name = request.name;
    if (request.description !== undefined) updates.description = request.description;
    if (request.isFavorite !== undefined) updates.is_favorite = request.isFavorite;
    if (request.isTemplate !== undefined) updates.is_template = request.isTemplate;
    if (request.templateName !== undefined) updates.template_name = request.templateName;
    if (request.templateDescription !== undefined) updates.template_description = request.templateDescription;
    if (request.tags !== undefined) updates.tags = request.tags;
    if (request.status !== undefined) updates.status = request.status;
    if (request.errorMessage !== undefined) updates.error_message = request.errorMessage;

    const { data, error } = await supabase
      .from('workflows')
      .update(updates)
      .eq('id', request.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Update workflow error:', error);
      throw new Error('Failed to update workflow');
    }

    return data;
  } catch (error) {
    console.error('Update workflow error:', error);
    throw error instanceof Error ? error : new Error('Failed to update workflow');
  }
}

/**
 * Delete a workflow
 */
export async function deleteWorkflow(workflowId: string): Promise<void> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to delete workflows');
    }

    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', workflowId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete workflow error:', error);
      throw new Error('Failed to delete workflow');
    }

    // Update user's total workflow count
    await updateUserWorkflowCount(user.id);
  } catch (error) {
    console.error('Delete workflow error:', error);
    throw error instanceof Error ? error : new Error('Failed to delete workflow');
  }
}

// =====================================================
// WORKFLOW QUERIES
// =====================================================

/**
 * Get workflows by platform
 */
export async function getWorkflowsByPlatform(platform: 'n8n' | 'make' | 'zapier'): Promise<Workflow[]> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to view workflows');
    }

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get workflows by platform error:', error);
      throw new Error('Failed to load workflows');
    }

    return data || [];
  } catch (error) {
    console.error('Get workflows by platform error:', error);
    throw error instanceof Error ? error : new Error('Failed to load workflows');
  }
}

/**
 * Get favorite workflows
 */
export async function getFavoriteWorkflows(): Promise<Workflow[]> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to view workflows');
    }

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_favorite', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get favorite workflows error:', error);
      throw new Error('Failed to load favorite workflows');
    }

    return data || [];
  } catch (error) {
    console.error('Get favorite workflows error:', error);
    throw error instanceof Error ? error : new Error('Failed to load favorite workflows');
  }
}

/**
 * Search workflows by name or description
 */
export async function searchWorkflows(query: string): Promise<Workflow[]> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to search workflows');
    }

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('user_id', user.id)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Search workflows error:', error);
      throw new Error('Failed to search workflows');
    }

    return data || [];
  } catch (error) {
    console.error('Search workflows error:', error);
    throw error instanceof Error ? error : new Error('Failed to search workflows');
  }
}

// =====================================================
// WORKFLOW STATISTICS
// =====================================================

/**
 * Get workflow statistics for the current user
 */
export async function getWorkflowStats() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to view statistics');
    }

    const { data, error } = await supabase
      .from('workflows')
      .select('platform, credits_used, created_at')
      .eq('user_id', user.id);

    if (error) {
      console.error('Get workflow stats error:', error);
      throw new Error('Failed to load statistics');
    }

    const workflows = data || [];

    return {
      total: workflows.length,
      byPlatform: {
        n8n: workflows.filter(w => w.platform === 'n8n').length,
        make: workflows.filter(w => w.platform === 'make').length,
        zapier: workflows.filter(w => w.platform === 'zapier').length
      },
      totalCreditsUsed: workflows.reduce((sum, w) => sum + (w.credits_used || 0), 0),
      thisWeek: workflows.filter(w => {
        const created = new Date(w.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created >= weekAgo;
      }).length,
      thisMonth: workflows.filter(w => {
        const created = new Date(w.created_at);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return created >= monthAgo;
      }).length
    };
  } catch (error) {
    console.error('Get workflow stats error:', error);
    return {
      total: 0,
      byPlatform: { n8n: 0, make: 0, zapier: 0 },
      totalCreditsUsed: 0,
      thisWeek: 0,
      thisMonth: 0
    };
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Update user's total workflow count
 */
async function updateUserWorkflowCount(userId: string): Promise<void> {
  try {
    // Count user's workflows
    const { count, error: countError } = await supabase
      .from('workflows')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.error('Count workflows error:', countError);
      return;
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ total_workflows_generated: count || 0 })
      .eq('id', userId);

    if (updateError) {
      console.error('Update workflow count error:', updateError);
    }
  } catch (error) {
    console.error('Update workflow count error:', error);
  }
}

/**
 * Toggle workflow favorite status
 */
export async function toggleFavorite(workflowId: string): Promise<boolean> {
  try {
    // Get current workflow
    const workflow = await getWorkflowById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Toggle favorite
    const newFavoriteStatus = !workflow.is_favorite;
    await updateWorkflow({ id: workflowId, isFavorite: newFavoriteStatus });

    return newFavoriteStatus;
  } catch (error) {
    console.error('Toggle favorite error:', error);
    throw error instanceof Error ? error : new Error('Failed to toggle favorite');
  }
}
