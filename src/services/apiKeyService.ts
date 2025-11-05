/**
 * API Key Management Service
 *
 * Handles API key generation and management for programmatic access
 */

import { supabase } from '@/integrations/supabase/client';

export interface APIKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string; // First 8 chars for display
  last_used_at?: string;
  expires_at?: string;
  is_active: boolean;
  permissions: string[];
  rate_limit_per_minute: number;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Generate random string for API key
 */
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a string using SHA-256
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a new API key
 * Format: sk_live_[32 random chars]
 */
async function generateAPIKey(): Promise<{ key: string; hash: string; prefix: string }> {
  const randomPart = generateRandomString(24);
  const key = `sk_live_${randomPart}`;

  // Create hash for storage (never store plain keys)
  const hash = await hashString(key);

  // Store first 16 chars for display
  const prefix = key.substring(0, 16) + '...';

  return { key, hash, prefix };
}

/**
 * Get all API keys for the current user
 */
export async function getAPIKeys(): Promise<APIKey[]> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching API keys:', error);
    throw new Error('Failed to fetch API keys');
  }

  return data || [];
}

/**
 * Create a new API key
 * Returns the plain key ONCE - it cannot be retrieved again
 */
/**
 * Available API permissions
 */
export const API_PERMISSIONS = {
  WORKFLOW_READ: 'workflow:read',
  WORKFLOW_CREATE: 'workflow:create',
  WORKFLOW_UPDATE: 'workflow:update',
  WORKFLOW_DELETE: 'workflow:delete',
  WORKFLOW_GENERATE: 'workflow:generate', // AI generation
  CLIENT_READ: 'client:read',
  CLIENT_MANAGE: 'client:manage',
  ALL: '*', // Full access
} as const;

export const DEFAULT_PERMISSIONS = [
  API_PERMISSIONS.WORKFLOW_READ,
  API_PERMISSIONS.WORKFLOW_CREATE,
  API_PERMISSIONS.WORKFLOW_UPDATE,
  API_PERMISSIONS.WORKFLOW_DELETE,
  API_PERMISSIONS.WORKFLOW_GENERATE,
];

export async function createAPIKey(params: {
  name: string;
  permissions?: string[];
  rate_limit_per_minute?: number;
  expires_at?: Date;
}): Promise<{ apiKey: APIKey; plainKey: string }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Generate the key
  const { key, hash, prefix } = await generateAPIKey();

  // Store in database
  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: user.id,
      name: params.name,
      key_hash: hash,
      key_prefix: prefix,
      permissions: params.permissions || DEFAULT_PERMISSIONS,
      rate_limit_per_minute: params.rate_limit_per_minute || 60,
      expires_at: params.expires_at?.toISOString(),
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating API key:', error);
    throw new Error('Failed to create API key');
  }

  return {
    apiKey: data,
    plainKey: key, // Return plain key ONCE
  };
}

/**
 * Update an API key (name, active status, etc.)
 */
export async function updateAPIKey(
  keyId: string,
  updates: {
    name?: string;
    is_active?: boolean;
    permissions?: string[];
    rate_limit_per_minute?: number;
  }
): Promise<APIKey> {
  const { data, error } = await supabase
    .from('api_keys')
    .update(updates)
    .eq('id', keyId)
    .select()
    .single();

  if (error) {
    console.error('Error updating API key:', error);
    throw new Error('Failed to update API key');
  }

  return data;
}

/**
 * Delete an API key
 */
export async function deleteAPIKey(keyId: string): Promise<void> {
  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', keyId);

  if (error) {
    console.error('Error deleting API key:', error);
    throw new Error('Failed to delete API key');
  }
}

/**
 * Verify an API key and return user info
 * This would be called by the API endpoint
 */
export async function verifyAPIKey(plainKey: string): Promise<{
  valid: boolean;
  userId?: string;
  permissions?: string[];
  rateLimit?: number;
}> {
  // Hash the provided key
  const hash = await hashString(plainKey);

  // Look up in database
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_hash', hash)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return { valid: false };
  }

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false };
  }

  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);

  return {
    valid: true,
    userId: data.user_id,
    permissions: data.permissions,
    rateLimit: data.rate_limit_per_minute,
  };
}

/**
 * Get API usage stats for a key
 */
export async function getAPIKeyStats(keyId: string): Promise<{
  totalCalls: number;
  lastUsed: Date | null;
  isExpired: boolean;
}> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('last_used_at, expires_at')
    .eq('id', keyId)
    .single();

  if (error) {
    console.error('Error fetching API key stats:', error);
    throw new Error('Failed to fetch API key stats');
  }

  const lastUsed = data.last_used_at ? new Date(data.last_used_at) : null;
  const isExpired = data.expires_at ? new Date(data.expires_at) < new Date() : false;

  return {
    totalCalls: 0, // TODO: Implement call tracking
    lastUsed,
    isExpired,
  };
}
