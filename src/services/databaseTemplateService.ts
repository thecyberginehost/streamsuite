/**
 * Database Template Service
 *
 * Handles fetching and managing workflow templates from Supabase database
 * Enforces subscription tier access control via database views
 *
 * This is separate from templateService.ts which manages static file-based templates
 */

import { supabase } from '@/integrations/supabase/client';

export interface DatabaseWorkflowTemplate {
  id: string;
  template_name: string;
  template_slug: string;
  description: string | null;
  category: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  is_featured: boolean;
  is_starter_accessible: boolean;
  template_data: any; // n8n workflow JSON
  preview_image_url: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  // From accessible_templates view
  subscription_tier?: string;
  can_access?: boolean;
}

export interface TemplateAccessInfo {
  totalAccessible: number;
  isLimited: boolean;
  maxTemplates: number | null; // null = unlimited
  hasFullAccess: boolean;
}

/**
 * Fetch templates accessible to the current user
 * Uses the accessible_templates view which enforces tier-based access
 */
export async function getAccessibleTemplates(): Promise<DatabaseWorkflowTemplate[]> {
  const { data, error } = await supabase
    .from('accessible_templates')
    .select('*')
    .eq('can_access', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching accessible templates:', error);
    throw new Error(`Failed to fetch templates: ${error.message}`);
  }

  return data || [];
}

/**
 * Get template access information for current user
 */
export async function getTemplateAccessInfo(userTier: string): Promise<TemplateAccessInfo> {
  const templates = await getAccessibleTemplates();

  const isLimited = userTier === 'starter';
  const hasFullAccess = ['pro', 'growth', 'agency'].includes(userTier);

  return {
    totalAccessible: templates.length,
    isLimited,
    maxTemplates: isLimited ? 3 : null, // null = unlimited
    hasFullAccess
  };
}

/**
 * Get a specific template by slug
 */
export async function getTemplateBySlug(slug: string): Promise<DatabaseWorkflowTemplate | null> {
  const { data, error } = await supabase
    .from('accessible_templates')
    .select('*')
    .eq('template_slug', slug)
    .eq('can_access', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found or no access
      return null;
    }
    console.error('Error fetching template:', error);
    throw new Error(`Failed to fetch template: ${error.message}`);
  }

  return data;
}

/**
 * Get featured templates accessible to current user
 */
export async function getFeaturedTemplates(): Promise<DatabaseWorkflowTemplate[]> {
  const { data, error } = await supabase
    .from('accessible_templates')
    .select('*')
    .eq('can_access', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Error fetching featured templates:', error);
    throw new Error(`Failed to fetch featured templates: ${error.message}`);
  }

  return data || [];
}

/**
 * Get templates by category
 */
export async function getTemplatesByCategory(category: string): Promise<DatabaseWorkflowTemplate[]> {
  const { data, error } = await supabase
    .from('accessible_templates')
    .select('*')
    .eq('can_access', true)
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching templates by category:', error);
    throw new Error(`Failed to fetch templates: ${error.message}`);
  }

  return data || [];
}

/**
 * Search templates by name or description
 */
export async function searchTemplates(query: string): Promise<DatabaseWorkflowTemplate[]> {
  const { data, error } = await supabase
    .from('accessible_templates')
    .select('*')
    .eq('can_access', true)
    .or(`template_name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching templates:', error);
    throw new Error(`Failed to search templates: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all unique categories
 */
export async function getTemplateCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('workflow_templates')
    .select('category')
    .not('category', 'is', null);

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  // Get unique categories
  const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
  return categories as string[];
}
