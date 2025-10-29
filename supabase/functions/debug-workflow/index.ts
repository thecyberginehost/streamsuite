// Supabase Edge Function: debug-workflow
// Handles AI workflow debugging securely on server-side

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DebugWorkflowRequest {
  workflowJson: any
  errorDescription?: string
  platform: 'n8n' | 'make' | 'zapier'
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
    const { workflowJson, errorDescription, platform }: DebugWorkflowRequest = await req.json()

    if (!workflowJson || !platform) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: workflowJson, platform' }),
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

    // Build prompt for debugging
    const debugPrompt = `Analyze this ${platform} workflow and fix any issues:

${JSON.stringify(workflowJson, null, 2)}

${errorDescription ? `\n\nError Description: ${errorDescription}` : ''}

Identify problems and return a FIXED version of the workflow JSON.
Return ONLY valid JSON (no markdown, no code blocks, no explanations).`

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
        temperature: 0.3,
        system: getDebugSystemPrompt(platform),
        messages: [
          {
            role: 'user',
            content: debugPrompt,
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

    // Parse fixed workflow from response
    const fixedWorkflow = parseWorkflowResponse(claudeResponse.content[0].text)

    // Always 1 credit for debug operations
    const creditsUsed = 1
    const tokensUsed = {
      input: claudeResponse.usage.input_tokens,
      output: claudeResponse.usage.output_tokens,
      total: claudeResponse.usage.input_tokens + claudeResponse.usage.output_tokens,
    }

    return new Response(
      JSON.stringify({
        fixedWorkflow,
        creditsUsed,
        tokensUsed,
        issues: extractIssues(claudeResponse.content[0].text),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in debug-workflow function:', error)
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

function getDebugSystemPrompt(platform: string): string {
  return `You are an expert ${platform} workflow debugger.

Your task: Analyze broken workflows, identify issues, and return FIXED JSON.

Common issues to check:
- Missing or invalid node connections
- Incorrect node types or parameters
- Dead-end nodes (no outputs)
- Missing trigger nodes
- Invalid data mappings

Return ONLY the fixed workflow JSON (no markdown, no code blocks, no explanations).`
}

function parseWorkflowResponse(text: string): any {
  let cleanText = text.trim()

  // Remove markdown code blocks if present
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

function extractIssues(text: string): string[] {
  // Extract any issues mentioned before the JSON
  const issues: string[] = []
  const lines = text.split('\n')

  for (const line of lines) {
    if (line.includes('Issue:') || line.includes('Problem:') || line.includes('Fixed:')) {
      issues.push(line.trim())
    }
  }

  return issues.length > 0 ? issues : ['Workflow analyzed and fixed']
}
