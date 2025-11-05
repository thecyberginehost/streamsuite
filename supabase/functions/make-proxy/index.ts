/**
 * Make.com Proxy Edge Function
 *
 * Proxies requests to Make.com API to avoid CORS issues and keep API keys secure.
 * This function runs server-side, so Make.com doesn't need CORS configuration.
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

    console.log('make-proxy request:', { action, connectionId, data });

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

    // Check for authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'Missing authorization header',
          code: 401,
          message: 'Missing authorization header'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
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

    // Get Make.com connection from database
    console.log('Querying client_platform_connections:', { connectionId, userId: user.id });

    const { data: connection, error: connError } = await supabaseClient
      .from('client_platform_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('platform', 'make')
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

    const { make_api_key: apiKey, make_team_id: teamId, make_instance_url: instanceUrl } = connection;

    // Extract region from instance URL (e.g., https://us2.make.com/...)
    let region = 'us1'; // default
    if (instanceUrl) {
      const match = instanceUrl.match(/https:\/\/(us\d+|eu\d+)\.make\.com/);
      if (match) {
        region = match[1];
      }
    }
    // Allow metadata to override if needed
    if (connection.metadata?.region) {
      region = connection.metadata.region;
    }

    // Extract organization ID from instance URL (e.g., /organization/4041934/...)
    let organizationId = teamId; // fallback to teamId
    if (instanceUrl) {
      const match = instanceUrl.match(/\/organization\/(\d+)/);
      if (match) {
        organizationId = match[1];
      }
    }

    const baseUrl = `https://${region}.make.com/api/v2`;

    console.log('Make.com API config:', { region, organizationId, baseUrl });

    // Route to appropriate Make.com API endpoint
    let makeResponse;

    switch (action) {
      case 'test': {
        // Test connection by fetching user info
        makeResponse = await fetch(`${baseUrl}/users/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Accept': 'application/json',
          },
        });
        break;
      }

      case 'listScenarios': {
        // List all scenarios - Make.com API requires organizationId parameter
        const url = `${baseUrl}/scenarios?organizationId=${organizationId}`;

        console.log('Listing scenarios from:', url);

        makeResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Accept': 'application/json',
          },
        });
        break;
      }

      case 'getScenario': {
        // Get specific scenario details
        const { scenarioId } = data;
        makeResponse = await fetch(`${baseUrl}/scenarios/${scenarioId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Accept': 'application/json',
          },
        });
        break;
      }

      case 'toggleScheduling': {
        // Enable/disable scenario scheduling
        // scheduling should be an object like:
        // - { type: "indefinitely" } to deactivate
        // - { type: "immediately" } for webhook triggers
        // - { type: "weekly", days: [...], time: "HH:MM" } for scheduled
        const { scenarioId, scheduling } = data;

        console.log('Toggle scheduling request:', { scenarioId, scheduling });

        // Validate scheduling is an object
        if (typeof scheduling !== 'object' || scheduling === null) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Invalid scheduling parameter',
              details: 'scheduling must be an object like { type: "indefinitely" } or { type: "immediately" }'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        makeResponse = await fetch(`${baseUrl}/scenarios/${scenarioId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ scheduling }),
        });

        console.log('Toggle response status:', makeResponse.status);
        break;
      }

      case 'runScenario': {
        // Manually run a scenario
        const { scenarioId } = data;
        makeResponse = await fetch(`${baseUrl}/scenarios/${scenarioId}/run`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Accept': 'application/json',
          },
        });
        break;
      }

      case 'getExecutions': {
        // Get scenario execution history
        const { scenarioId, limit = 20 } = data;

        makeResponse = await fetch(
          `${baseUrl}/scenarios/${scenarioId}/executions?limit=${limit}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Token ${apiKey}`,
              'Accept': 'application/json',
            },
          }
        );
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Get response from Make.com
    const responseText = await makeResponse.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    // Log response for debugging
    console.log('Make.com API response:', { status: makeResponse.status, action, data: responseData });

    // Return response
    if (!makeResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Make.com API error: ${makeResponse.status}`,
          details: responseData,
        }),
        { status: makeResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    console.error('Make.com proxy error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
