/**
 * n8n Proxy Edge Function
 *
 * Proxies requests to n8n instances to avoid CORS issues and keep API keys secure.
 * This function runs server-side, so n8n doesn't need CORS configuration.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const { action, connectionId, data } = await req.json();

    console.log('n8n-proxy request:', { action, connectionId, data });

    // Validate request
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Missing action parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!connectionId) {
      return new Response(
        JSON.stringify({ error: 'Missing connectionId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from auth header
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get n8n connection from database (using new client_platform_connections table)
    console.log('Querying client_platform_connections:', { connectionId, userId: user.id });

    const { data: connection, error: connError } = await supabaseClient
      .from('client_platform_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('platform', 'n8n')
      .single();

    console.log('client_platform_connections query result:', { connection, connError });

    if (connError || !connection) {
      return new Response(
        JSON.stringify({
          error: 'Connection not found',
          details: connError?.message || 'No connection record found',
          connectionId,
          userId: user.id
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { n8n_instance_url: instance_url, n8n_api_key: api_key } = connection;

    // Route to appropriate n8n API endpoint
    let n8nResponse;

    switch (action) {
      case 'test': {
        // Test connection by fetching workflows
        n8nResponse = await fetch(`${instance_url}/api/v1/workflows`, {
          method: 'GET',
          headers: {
            'X-N8N-API-KEY': api_key,
            'Accept': 'application/json',
          },
        });
        break;
      }

      case 'listWorkflows': {
        // List all workflows in n8n instance (for Growth plan monitoring)
        n8nResponse = await fetch(`${instance_url}/api/v1/workflows`, {
          method: 'GET',
          headers: {
            'X-N8N-API-KEY': api_key,
            'Accept': 'application/json',
          },
        });
        break;
      }

      case 'push': {
        // Push workflow to n8n
        const { workflowName, workflowJson } = data;
        const pushBody = {
          name: workflowName,
          nodes: workflowJson.nodes,
          connections: workflowJson.connections,
          settings: workflowJson.settings || {},
          staticData: workflowJson.staticData || null,
        };
        console.log('Pushing workflow to n8n:', workflowName);
        n8nResponse = await fetch(`${instance_url}/api/v1/workflows`, {
          method: 'POST',
          headers: {
            'X-N8N-API-KEY': api_key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pushBody),
        });
        break;
      }

      case 'monitor': {
        // Get workflow executions
        const { workflowId } = data;
        n8nResponse = await fetch(
          `${instance_url}/api/v1/executions?workflowId=${workflowId}`,
          {
            method: 'GET',
            headers: {
              'X-N8N-API-KEY': api_key,
              'Accept': 'application/json',
            },
          }
        );
        break;
      }

      case 'getExecutions': {
        // Get workflow executions (MVP - simple list)
        const { workflowId, limit = 20 } = data;

        if (!workflowId) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Missing workflowId parameter',
              details: 'The workflow may not have been pushed successfully or the workflow_id was not saved.'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        n8nResponse = await fetch(
          `${instance_url}/api/v1/executions?workflowId=${workflowId}&limit=${limit}`,
          {
            method: 'GET',
            headers: {
              'X-N8N-API-KEY': api_key,
              'Accept': 'application/json',
            },
          }
        );
        break;
      }

      case 'retryExecution': {
        // Retry a failed execution (MVP)
        const { executionId } = data;
        n8nResponse = await fetch(
          `${instance_url}/api/v1/executions/${executionId}/retry`,
          {
            method: 'POST',
            headers: {
              'X-N8N-API-KEY': api_key,
              'Accept': 'application/json',
            },
          }
        );
        break;
      }

      case 'toggleActive': {
        // Activate/deactivate workflow
        const { workflowId, active } = data;

        console.log('Toggle active request:', { workflowId, active, url: `${instance_url}/api/v1/workflows/${workflowId}/${active ? 'activate' : 'deactivate'}` });

        // n8n has specific endpoints for activate/deactivate
        const endpoint = active
          ? `${instance_url}/api/v1/workflows/${workflowId}/activate`
          : `${instance_url}/api/v1/workflows/${workflowId}/deactivate`;

        n8nResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'X-N8N-API-KEY': api_key,
            'Accept': 'application/json',
          },
        });

        console.log('Toggle response status:', n8nResponse.status);
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Get response from n8n
    const responseText = await n8nResponse.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    // Log response for debugging
    console.log('n8n API response:', { status: n8nResponse.status, action, data: responseData });

    // Return response
    if (!n8nResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `n8n API error: ${n8nResponse.status}`,
          details: responseData,
        }),
        { status: n8nResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: responseData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('n8n proxy error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
