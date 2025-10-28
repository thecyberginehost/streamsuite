/**
 * Template Folder Service
 *
 * Manages template folders for organizing user-saved workflow templates
 */

import { supabase } from '@/integrations/supabase/client';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface TemplateFolder {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFolderRequest {
  name: string;
  description?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  description?: string;
}

// =====================================================
// FOLDER CRUD OPERATIONS
// =====================================================

/**
 * Get all template folders for the current user
 */
export async function getTemplateFolders(): Promise<TemplateFolder[]> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to view template folders');
    }

    const { data, error } = await supabase
      .from('template_folders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get template folders error:', error);
      throw new Error('Failed to load template folders');
    }

    return data || [];
  } catch (error) {
    console.error('Get template folders error:', error);
    throw error instanceof Error ? error : new Error('Failed to load template folders');
  }
}

/**
 * Create a new template folder
 */
export async function createTemplateFolder(request: CreateFolderRequest): Promise<TemplateFolder> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to create template folders');
    }

    if (!request.name.trim()) {
      throw new Error('Folder name is required');
    }

    const { data, error } = await supabase
      .from('template_folders')
      .insert({
        user_id: user.id,
        name: request.name.trim(),
        description: request.description?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (duplicate folder name)
      if (error.code === '23505') {
        throw new Error(`A folder named "${request.name}" already exists`);
      }
      console.error('Create template folder error:', error);
      throw new Error('Failed to create template folder');
    }

    console.log(`✅ Created template folder: ${request.name}`);
    return data;
  } catch (error) {
    console.error('Create template folder error:', error);
    throw error instanceof Error ? error : new Error('Failed to create template folder');
  }
}

/**
 * Update an existing template folder
 */
export async function updateTemplateFolder(
  folderId: string,
  request: UpdateFolderRequest
): Promise<TemplateFolder> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to update template folders');
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (request.name !== undefined) {
      if (!request.name.trim()) {
        throw new Error('Folder name cannot be empty');
      }
      updateData.name = request.name.trim();
    }

    if (request.description !== undefined) {
      updateData.description = request.description.trim() || null;
    }

    const { data, error } = await supabase
      .from('template_folders')
      .update(updateData)
      .eq('id', folderId)
      .eq('user_id', user.id) // Ensure user owns this folder
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        throw new Error(`A folder named "${request.name}" already exists`);
      }
      console.error('Update template folder error:', error);
      throw new Error('Failed to update template folder');
    }

    if (!data) {
      throw new Error('Folder not found or you do not have permission to update it');
    }

    console.log(`✅ Updated template folder: ${data.name}`);
    return data;
  } catch (error) {
    console.error('Update template folder error:', error);
    throw error instanceof Error ? error : new Error('Failed to update template folder');
  }
}

/**
 * Delete a template folder
 * Note: Templates in this folder will have their folder_id set to NULL (not deleted)
 */
export async function deleteTemplateFolder(folderId: string): Promise<void> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to delete template folders');
    }

    const { error } = await supabase
      .from('template_folders')
      .delete()
      .eq('id', folderId)
      .eq('user_id', user.id); // Ensure user owns this folder

    if (error) {
      console.error('Delete template folder error:', error);
      throw new Error('Failed to delete template folder');
    }

    console.log(`✅ Deleted template folder: ${folderId}`);
  } catch (error) {
    console.error('Delete template folder error:', error);
    throw error instanceof Error ? error : new Error('Failed to delete template folder');
  }
}

// =====================================================
// TEMPLATE-TO-FOLDER OPERATIONS
// =====================================================

/**
 * Move a template workflow to a folder (or remove from folder if folderId is null)
 */
export async function moveTemplateToFolder(
  workflowId: string,
  folderId: string | null
): Promise<void> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to organize templates');
    }

    // If moving to a folder, verify it exists and belongs to the user
    if (folderId) {
      const { data: folder, error: folderError } = await supabase
        .from('template_folders')
        .select('id')
        .eq('id', folderId)
        .eq('user_id', user.id)
        .single();

      if (folderError || !folder) {
        throw new Error('Folder not found or you do not have permission to access it');
      }
    }

    const { error } = await supabase
      .from('workflows')
      .update({
        folder_id: folderId,
        updated_at: new Date().toISOString()
      })
      .eq('id', workflowId)
      .eq('user_id', user.id); // Ensure user owns this workflow

    if (error) {
      console.error('Move template to folder error:', error);
      throw new Error('Failed to move template to folder');
    }

    if (folderId) {
      console.log(`✅ Moved template ${workflowId} to folder ${folderId}`);
    } else {
      console.log(`✅ Removed template ${workflowId} from folder`);
    }
  } catch (error) {
    console.error('Move template to folder error:', error);
    throw error instanceof Error ? error : new Error('Failed to move template to folder');
  }
}

/**
 * Get all templates in a specific folder
 */
export async function getTemplatesInFolder(folderId: string): Promise<any[]> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to view templates');
    }

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('user_id', user.id)
      .eq('folder_id', folderId)
      .eq('is_template', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get templates in folder error:', error);
      throw new Error('Failed to load templates');
    }

    return data || [];
  } catch (error) {
    console.error('Get templates in folder error:', error);
    throw error instanceof Error ? error : new Error('Failed to load templates');
  }
}

/**
 * Get templates that are not in any folder
 */
export async function getUnorganizedTemplates(): Promise<any[]> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to view templates');
    }

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('user_id', user.id)
      .is('folder_id', null)
      .eq('is_template', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get unorganized templates error:', error);
      throw new Error('Failed to load templates');
    }

    return data || [];
  } catch (error) {
    console.error('Get unorganized templates error:', error);
    throw error instanceof Error ? error : new Error('Failed to load templates');
  }
}

/**
 * Count templates in a folder
 */
export async function countTemplatesInFolder(folderId: string): Promise<number> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return 0;
    }

    const { count, error } = await supabase
      .from('workflows')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('folder_id', folderId)
      .eq('is_template', true);

    if (error) {
      console.error('Count templates error:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Count templates error:', error);
    return 0;
  }
}
