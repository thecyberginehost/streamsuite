/**
 * Client Management Service
 *
 * Handles client CRUD operations for agency users
 */

import { supabase } from '@/integrations/supabase/client';

export interface Client {
  id: string;
  agency_id: string;
  name: string;
  email?: string;
  company?: string;
  notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ClientProject {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on_hold' | 'archived';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Get all clients for the current agency user
 */
export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
    throw new Error('Failed to fetch clients');
  }

  return data || [];
}

/**
 * Get a single client by ID
 */
export async function getClient(clientId: string): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error) {
    console.error('Error fetching client:', error);
    throw new Error('Failed to fetch client');
  }

  return data;
}

/**
 * Create a new client
 */
export async function createClient(client: {
  name: string;
  email?: string;
  company?: string;
  notes?: string;
}): Promise<Client> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({
      agency_id: user.id,
      name: client.name,
      email: client.email,
      company: client.company,
      notes: client.notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating client:', error);
    throw new Error('Failed to create client');
  }

  return data;
}

/**
 * Update an existing client
 */
export async function updateClient(
  clientId: string,
  updates: {
    name?: string;
    email?: string;
    company?: string;
    notes?: string;
  }
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', clientId)
    .select()
    .single();

  if (error) {
    console.error('Error updating client:', error);
    throw new Error('Failed to update client');
  }

  return data;
}

/**
 * Delete a client
 */
export async function deleteClient(clientId: string): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId);

  if (error) {
    console.error('Error deleting client:', error);
    throw new Error('Failed to delete client');
  }
}

/**
 * Get all projects for a client
 */
export async function getClientProjects(clientId: string): Promise<ClientProject[]> {
  const { data, error } = await supabase
    .from('client_projects')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client projects:', error);
    throw new Error('Failed to fetch client projects');
  }

  return data || [];
}

/**
 * Create a new project for a client
 */
export async function createClientProject(project: {
  client_id: string;
  name: string;
  description?: string;
  status?: 'active' | 'completed' | 'on_hold' | 'archived';
}): Promise<ClientProject> {
  const { data, error } = await supabase
    .from('client_projects')
    .insert(project)
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    throw new Error('Failed to create project');
  }

  return data;
}

/**
 * Update a client project
 */
export async function updateClientProject(
  projectId: string,
  updates: {
    name?: string;
    description?: string;
    status?: 'active' | 'completed' | 'on_hold' | 'archived';
  }
): Promise<ClientProject> {
  const { data, error } = await supabase
    .from('client_projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    throw new Error('Failed to update project');
  }

  return data;
}

/**
 * Delete a client project
 */
export async function deleteClientProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('client_projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    console.error('Error deleting project:', error);
    throw new Error('Failed to delete project');
  }
}

/**
 * Get client stats (workflows, projects, connections, etc.)
 */
export async function getClientStats(clientId: string): Promise<{
  totalProjects: number;
  activeProjects: number;
  totalWorkflows: number;
  totalConnections: number;
  recentActivity: Date | null;
}> {
  // Get projects count
  const { data: projects, error: projectsError } = await supabase
    .from('client_projects')
    .select('id, status')
    .eq('client_id', clientId);

  if (projectsError) {
    console.error('Error fetching project stats:', projectsError);
  }

  const totalProjects = projects?.length || 0;
  const activeProjects = projects?.filter(p => p.status === 'active').length || 0;

  // Get workflows count
  const { data: workflows, error: workflowsError } = await supabase
    .from('workflows')
    .select('id, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (workflowsError) {
    console.error('Error fetching workflow stats:', workflowsError);
  }

  const totalWorkflows = workflows?.length || 0;
  const recentActivity = workflows && workflows.length > 0
    ? new Date(workflows[0].created_at)
    : null;

  // Get connections count
  const { data: connections, error: connectionsError } = await supabase
    .from('client_platform_connections')
    .select('id')
    .eq('client_id', clientId)
    .eq('is_active', true);

  if (connectionsError) {
    console.error('Error fetching connections stats:', connectionsError);
  }

  const totalConnections = connections?.length || 0;

  return {
    totalProjects,
    activeProjects,
    totalWorkflows,
    totalConnections,
    recentActivity,
  };
}
