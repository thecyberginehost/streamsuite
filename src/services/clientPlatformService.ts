/**
 * Client Platform Connection Service
 *
 * Manage platform API connections (n8n, Make, Zapier) for clients
 */

import { supabase } from '@/integrations/supabase/client';
import { testN8NConnection } from './n8nApiService';
import { testMakeConnection } from './makeApiService';

export interface ClientPlatformConnection {
  id: string;
  client_id: string;
  platform: 'n8n' | 'make' | 'zapier';
  connection_name: string;

  // n8n specific
  n8n_instance_url?: string;
  n8n_api_key?: string;

  // Make.com specific
  make_api_key?: string;
  make_team_id?: string;
  make_instance_url?: string;

  // Zapier specific
  zapier_api_key?: string;
  zapier_instance_url?: string; // Client-specific Zapier workspace URL

  // Status
  is_active: boolean;
  last_tested_at?: string;
  last_test_success?: boolean;

  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ClientWorkflowAnalytics {
  client_id: string;
  client_name: string;
  client_company?: string;
  total_workflows: number;
  total_connections: number;
  failed_executions_24h: number;
  total_executions_7d: number;
  success_rate: number;
  last_workflow_created?: string;
  client_since: string;
}

/**
 * Get all platform connections for a client
 */
export async function getClientConnections(clientId: string): Promise<ClientPlatformConnection[]> {
  const { data, error } = await supabase
    .from('client_platform_connections')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client connections:', error);
    throw new Error('Failed to fetch client connections');
  }

  return data || [];
}

/**
 * Get all connections across all clients (for agency overview)
 */
export async function getAllClientConnections(): Promise<ClientPlatformConnection[]> {
  const { data, error } = await supabase
    .from('client_platform_connections')
    .select('*, clients(name, company)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all connections:', error);
    throw new Error('Failed to fetch connections');
  }

  return data || [];
}

/**
 * Create a new platform connection for a client
 */
export async function createClientConnection(
  connection: {
    client_id: string;
    platform: 'n8n' | 'make' | 'zapier';
    connection_name: string;
    // n8n
    n8n_instance_url?: string;
    n8n_api_key?: string;
    // Make
    make_api_key?: string;
    make_team_id?: string;
    make_instance_url?: string;
    // Zapier
    zapier_api_key?: string;
    zapier_instance_url?: string;
  }
): Promise<ClientPlatformConnection> {
  const { data, error } = await supabase
    .from('client_platform_connections')
    .insert(connection)
    .select()
    .single();

  if (error) {
    console.error('Error creating connection:', error);
    throw new Error('Failed to create connection');
  }

  return data;
}

/**
 * Update a platform connection
 */
export async function updateClientConnection(
  connectionId: string,
  updates: {
    connection_name?: string;
    n8n_instance_url?: string;
    n8n_api_key?: string;
    make_api_key?: string;
    make_team_id?: string;
    make_instance_url?: string;
    zapier_api_key?: string;
    zapier_instance_url?: string;
    is_active?: boolean;
  }
): Promise<ClientPlatformConnection> {
  const { data, error } = await supabase
    .from('client_platform_connections')
    .update(updates)
    .eq('id', connectionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating connection:', error);
    throw new Error('Failed to update connection');
  }

  return data;
}

/**
 * Delete a platform connection
 */
export async function deleteClientConnection(connectionId: string): Promise<void> {
  const { error } = await supabase
    .from('client_platform_connections')
    .delete()
    .eq('id', connectionId);

  if (error) {
    console.error('Error deleting connection:', error);
    throw new Error('Failed to delete connection');
  }
}

/**
 * Test a platform connection
 */
export async function testClientConnection(connectionId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Get the connection
    const { data: connection, error } = await supabase
      .from('client_platform_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (error || !connection) {
      throw new Error('Connection not found');
    }

    // Test based on platform
    let testResult = { success: false, message: 'Unknown error' };

    if (connection.platform === 'n8n') {
      // Test n8n connection using the API service
      const result = await testN8NConnection({
        instanceUrl: connection.n8n_instance_url!,
        apiKey: connection.n8n_api_key!,
      });

      if (result.success) {
        testResult = {
          success: true,
          message: '✅ n8n connection successful - API accessible',
        };
      } else {
        testResult = {
          success: false,
          message: `❌ n8n connection failed: ${result.error}`,
        };
      }
    } else if (connection.platform === 'make') {
      // Test Make.com connection using the API service
      const result = await testMakeConnection({
        apiKey: connection.make_api_key!,
        teamId: connection.make_team_id,
        region: 'us1', // Default to US region, could be stored in metadata
      });

      if (result.success) {
        testResult = {
          success: true,
          message: '✅ Make.com connection successful - API accessible',
        };
      } else {
        testResult = {
          success: false,
          message: `❌ Make.com connection failed: ${result.error}`,
        };
      }
    } else if (connection.platform === 'zapier') {
      // Zapier has no workflow management API
      testResult = {
        success: false,
        message: '⚠️ Zapier does not provide a workflow management API. Limited functionality available.',
      };
    }

    // Update test results in database
    await supabase
      .from('client_platform_connections')
      .update({
        last_tested_at: new Date().toISOString(),
        last_test_success: testResult.success,
      })
      .eq('id', connectionId);

    return testResult;
  } catch (error: any) {
    console.error('Error testing connection:', error);
    return { success: false, message: error.message || 'Connection test failed' };
  }
}

/**
 * Get workflow analytics for all clients
 */
export async function getClientWorkflowAnalytics(): Promise<ClientWorkflowAnalytics[]> {
  const { data, error } = await supabase
    .from('client_workflow_analytics')
    .select('*')
    .order('client_name');

  if (error) {
    console.error('Error fetching analytics:', error);
    throw new Error('Failed to fetch analytics');
  }

  return data || [];
}

/**
 * Get clients that need attention (failed executions, errors, etc.)
 */
export async function getClientsNeedingAttention(): Promise<ClientWorkflowAnalytics[]> {
  const analytics = await getClientWorkflowAnalytics();

  // Filter clients that need attention:
  // - Have failed executions in last 24h
  // - Have success rate below 80%
  // - Have no workflows despite having connections
  return analytics.filter(client =>
    client.failed_executions_24h > 0 ||
    (client.success_rate < 80 && client.total_executions_7d > 0) ||
    (client.total_connections > 0 && client.total_workflows === 0)
  );
}
