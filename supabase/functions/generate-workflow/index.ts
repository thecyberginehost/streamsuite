// Supabase Edge Function: generate-workflow
// Handles AI workflow generation securely on server-side

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateWorkflowRequest {
  prompt: string
  platform: 'n8n' | 'make' | 'zapier'
  useTemplateId?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Parse request body
    const { prompt, platform, useTemplateId }: GenerateWorkflowRequest = await req.json()

    if (!prompt || !platform) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: prompt, platform' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Get Claude API key from environment
    const claudeApiKey = Deno.env.get('VITE_CLAUDE_API_KEY')
    if (!claudeApiKey) {
      throw new Error('Claude API key not configured')
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        temperature: 0.7,
        system: getSystemPrompt(platform),
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Claude API error:', error)
      throw new Error(`Claude API error: ${response.status}`)
    }

    const claudeResponse = await response.json()

    // Parse workflow from response
    const workflowJson = parseWorkflowResponse(claudeResponse.content[0].text)

    // Calculate credits (always 1 for flat rate)
    const creditsUsed = 1
    const tokensUsed = {
      input: claudeResponse.usage.input_tokens,
      output: claudeResponse.usage.output_tokens,
      total: claudeResponse.usage.input_tokens + claudeResponse.usage.output_tokens,
    }

    return new Response(
      JSON.stringify({
        workflow: workflowJson,
        templateUsed: useTemplateId,
        creditsUsed,
        tokensUsed,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in generate-workflow function:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// System prompt for n8n workflow generation
function getSystemPrompt(platform: string): string {
  if (platform === 'n8n') {
    return `You are an expert n8n workflow automation engineer with deep knowledge of n8n's architecture, nodes, and best practices.

Your task: Generate production-ready n8n workflow JSON from natural language descriptions.

Return ONLY valid JSON in this exact format (no markdown, no code blocks, no explanations):

{
  "name": "Workflow Name",
  "nodes": [
    {
      "parameters": {},
      "id": "unique-uuid",
      "name": "Node Name",
      "type": "n8n-nodes-base.nodeType",
      "typeVersion": 1,
      "position": [x, y]
    }
  ],
  "connections": {},
  "active": false,
  "settings": { "executionOrder": "v1" },
  "pinData": {},
  "tags": []
}

CRITICAL: Return ONLY the JSON object. No markdown formatting, no code blocks, no additional text.`
  }

  return 'You are an expert workflow automation engineer.'
}

// Parse workflow JSON from Claude response
function parseWorkflowResponse(text: string): any {
  // Remove markdown code blocks if present
  let cleanText = text.trim()

  // Remove ```json and ``` markers
  cleanText = cleanText.replace(/^```json\s*/i, '')
  cleanText = cleanText.replace(/^```\s*/i, '')
  cleanText = cleanText.replace(/```\s*$/i, '')

  // Find the first { and last }
  const firstBrace = cleanText.indexOf('{')
  const lastBrace = cleanText.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('No valid JSON object found in response')
  }

  const jsonText = cleanText.substring(firstBrace, lastBrace + 1)

  try {
    return JSON.parse(jsonText)
  } catch (error) {
    throw new Error(`Failed to parse workflow JSON: ${error.message}`)
  }
}
