// Supabase Edge Function: batch-generate
// Handles batch workflow generation securely on server-side

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BatchWorkflowItem {
  name: string
  description: string
}

interface BatchGenerateRequest {
  prompt: string
  platform: 'n8n' | 'make' | 'zapier'
  workflowCount: number
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
    const { prompt, platform, workflowCount }: BatchGenerateRequest = await req.json()

    if (!prompt || !platform || !workflowCount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: prompt, platform, workflowCount' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    if (workflowCount < 2 || workflowCount > 10) {
      return new Response(
        JSON.stringify({ error: 'workflowCount must be between 2 and 10' }),
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

    // First, get workflow breakdown from Claude
    const breakdownPrompt = `Break down this workflow requirement into ${workflowCount} separate workflows:

"${prompt}"

Return ONLY a JSON array of workflow descriptions in this format:
[
  {
    "name": "Workflow 1 Name",
    "description": "Detailed description of what this workflow does"
  },
  {
    "name": "Workflow 2 Name",
    "description": "Detailed description of what this workflow does"
  }
]

No markdown, no code blocks, just the JSON array.`

    const breakdownResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: breakdownPrompt,
          },
        ],
      }),
    })

    if (!breakdownResponse.ok) {
      throw new Error(`Claude API error: ${breakdownResponse.status}`)
    }

    const breakdownData = await breakdownResponse.json()
    const workflows: BatchWorkflowItem[] = JSON.parse(
      breakdownData.content[0].text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '')
    )

    // Generate each workflow
    const generatedWorkflows = []
    let totalTokens = breakdownData.usage.input_tokens + breakdownData.usage.output_tokens

    for (const workflow of workflows) {
      const workflowPrompt = `${workflow.name}: ${workflow.description}`

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
              content: workflowPrompt,
            },
          ],
        }),
      })

      if (!response.ok) {
        console.error(`Failed to generate workflow: ${workflow.name}`)
        continue
      }

      const claudeResponse = await response.json()
      totalTokens += claudeResponse.usage.input_tokens + claudeResponse.usage.output_tokens

      try {
        const workflowJson = parseWorkflowResponse(claudeResponse.content[0].text)
        generatedWorkflows.push({
          name: workflow.name,
          description: workflow.description,
          json: workflowJson,
          nodeCount: workflowJson.nodes?.length || 0,
        })
      } catch (error) {
        console.error(`Failed to parse workflow ${workflow.name}:`, error)
      }
    }

    return new Response(
      JSON.stringify({
        workflows: generatedWorkflows,
        creditsUsed: workflowCount,
        tokensUsed: {
          total: totalTokens,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in batch-generate function:', error)
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

function getSystemPrompt(platform: string): string {
  if (platform === 'n8n') {
    return `You are an expert n8n workflow automation engineer.

Generate production-ready n8n workflow JSON from descriptions.

Return ONLY valid JSON in this format (no markdown, no code blocks):

{
  "name": "Workflow Name",
  "nodes": [...],
  "connections": {},
  "active": false,
  "settings": { "executionOrder": "v1" },
  "pinData": {},
  "tags": []
}`
  }

  return 'You are an expert workflow automation engineer.'
}

function parseWorkflowResponse(text: string): any {
  let cleanText = text.trim()

  cleanText = cleanText.replace(/^```json\s*/i, '')
  cleanText = cleanText.replace(/^```\s*/i, '')
  cleanText = cleanText.replace(/```\s*$/i, '')

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
