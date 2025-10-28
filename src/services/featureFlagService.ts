/**
 * Feature Flag Service
 *
 * Manages feature flags for controlling platform features
 * Admin-controlled toggles for enabling/disabling functionality
 */

import { supabase } from '@/integrations/supabase/client';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  description?: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type FeatureFlagKey =
  | 'workflow_generation_make'
  | 'workflow_generation_zapier'
  | 'code_generation_make'
  | 'code_generation_zapier'
  | 'enterprise_builder';

// =====================================================
// FEATURE FLAG QUERIES
// =====================================================

/**
 * Check if a specific feature flag is enabled
 */
export async function isFeatureEnabled(flagKey: FeatureFlagKey): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('is_enabled')
      .eq('flag_key', flagKey)
      .single();

    if (error) {
      console.error(`Failed to check feature flag: ${flagKey}`, error);
      return false; // Default to disabled if query fails
    }

    return data?.is_enabled || false;
  } catch (error) {
    console.error(`Feature flag check error: ${flagKey}`, error);
    return false;
  }
}

/**
 * Get all feature flags
 */
export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('flag_name', { ascending: true });

    if (error) {
      console.error('Failed to fetch feature flags', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get feature flags error:', error);
    return [];
  }
}

/**
 * Get enabled workflow generation platforms
 * Returns which platforms are enabled for AI workflow generation
 */
export async function getEnabledWorkflowPlatforms(): Promise<{
  n8n: boolean;
  make: boolean;
  zapier: boolean;
}> {
  try {
    const [makeEnabled, zapierEnabled] = await Promise.all([
      isFeatureEnabled('workflow_generation_make'),
      isFeatureEnabled('workflow_generation_zapier')
    ]);

    return {
      n8n: true, // n8n is always enabled (core platform)
      make: makeEnabled,
      zapier: zapierEnabled
    };
  } catch (error) {
    console.error('Get enabled workflow platforms error:', error);
    return {
      n8n: true,
      make: false,
      zapier: false
    };
  }
}

/**
 * Get enabled code generation platforms
 * Returns which platforms are enabled for custom code generation
 */
export async function getEnabledCodePlatforms(): Promise<{
  n8n: boolean;
  make: boolean;
  zapier: boolean;
}> {
  try {
    const [makeEnabled, zapierEnabled] = await Promise.all([
      isFeatureEnabled('code_generation_make'),
      isFeatureEnabled('code_generation_zapier')
    ]);

    return {
      n8n: true, // n8n is always enabled (core platform)
      make: makeEnabled,
      zapier: zapierEnabled
    };
  } catch (error) {
    console.error('Get enabled code platforms error:', error);
    return {
      n8n: true,
      make: false,
      zapier: false
    };
  }
}

// =====================================================
// ADMIN-ONLY FEATURE FLAG MANAGEMENT
// =====================================================

/**
 * Update a feature flag (admin only)
 */
export async function updateFeatureFlag(
  flagKey: FeatureFlagKey,
  isEnabled: boolean
): Promise<FeatureFlag> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to update feature flags');
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      throw new Error('Only admins can update feature flags');
    }

    // Update the flag
    const { data, error } = await supabase
      .from('feature_flags')
      .update({
        is_enabled: isEnabled,
        updated_at: new Date().toISOString()
      })
      .eq('flag_key', flagKey)
      .select()
      .single();

    if (error) {
      console.error('Update feature flag error:', error);
      throw new Error('Failed to update feature flag');
    }

    console.log(`✅ Feature flag updated: ${flagKey} = ${isEnabled}`);
    return data;
  } catch (error) {
    console.error('Update feature flag error:', error);
    throw error instanceof Error ? error : new Error('Failed to update feature flag');
  }
}

/**
 * Batch update multiple feature flags (admin only)
 */
export async function batchUpdateFeatureFlags(
  updates: Array<{ flagKey: FeatureFlagKey; isEnabled: boolean }>
): Promise<void> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to update feature flags');
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      throw new Error('Only admins can update feature flags');
    }

    // Update all flags
    await Promise.all(
      updates.map(({ flagKey, isEnabled }) =>
        supabase
          .from('feature_flags')
          .update({
            is_enabled: isEnabled,
            updated_at: new Date().toISOString()
          })
          .eq('flag_key', flagKey)
      )
    );

    console.log(`✅ Batch updated ${updates.length} feature flags`);
  } catch (error) {
    console.error('Batch update feature flags error:', error);
    throw error instanceof Error ? error : new Error('Failed to batch update feature flags');
  }
}
