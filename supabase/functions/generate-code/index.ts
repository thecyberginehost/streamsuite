// Supabase Edge Function: generate-code
// Handles custom code generation for n8n, Make.com, and Zapier

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateCodeRequest {
  prompt: string
  platform: 'n8n' | 'make' | 'zapier'
  language: 'javascript' | 'python'
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
    const { prompt, platform, language }: GenerateCodeRequest = await req.json()

    if (!prompt || !platform || !language) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: prompt, platform, language' }),
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

    // Build platform-specific instruction
    let platformInstruction = ''

    if (platform === 'n8n') {
      platformInstruction = language === 'javascript'
        ? 'Generate JavaScript code for n8n Code node.'
        : 'Generate Python code for n8n Code node.'
    } else if (platform === 'make') {
      platformInstruction = 'Generate JavaScript code for Make.com custom module. Must use module.exports pattern.'
    } else if (platform === 'zapier') {
      platformInstruction = language === 'javascript'
        ? 'Generate JavaScript code for Zapier Code by Zapier step. Use inputData and return/output.'
        : 'Generate Python code for Zapier Code by Zapier step. Use input_data and return/output.'
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
        max_tokens: 2000,
        system: getCodeGenerationSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: `${platformInstruction}\n\nUser request: ${prompt}`,
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
    const content = claudeResponse.content[0]

    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude API')
    }

    let code = content.text.trim()

    // Remove markdown code blocks if present
    code = code.replace(/^```(?:javascript|python|js)?\n/, '').replace(/\n```$/, '')

    const platformName = platform === 'n8n' ? 'n8n Code node'
      : platform === 'make' ? 'Make.com custom module'
      : 'Zapier Code step'

    return new Response(
      JSON.stringify({
        code,
        explanation: `Generated ${language} code for ${platformName}`,
        tokensUsed: claudeResponse.usage.input_tokens + claudeResponse.usage.output_tokens,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in generate-code function:', error)
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

function getCodeGenerationSystemPrompt(): string {
  return `You are an expert at writing custom code for workflow automation platforms.

**YOUR TASK:** Generate clean, production-ready code based on the user's platform and description.

# PLATFORM-SPECIFIC CONTEXT:

## n8n Code Node

**JavaScript:**
- Access: \`$input\` (current item), \`$items\` (all items), \`$node\`, \`$workflow\`, \`$json\` (shorthand for $input.json)
- Return: Array of items → \`return $input.all()\` or \`return [{json: {...}}]\`
- NPM packages available: axios, lodash, moment, cheerio, crypto

**Python:**
- Access: \`_input\` (current item), \`_items\` (all items)
- Return: List of dictionaries → \`return [{'json': {...}}]\`
- Standard library available

**Example (JS):**
// Transform data to uppercase and add timestamp
const items = $input.all();
return items.map(item => ({
  json: {
    ...item.json,
    nameUpper: item.json.name.toUpperCase(),
    processedAt: new Date().toISOString()
  }
}));

## Make.com Custom Module

**JavaScript:**
- Use \`module.exports\` pattern
- Access input: via function parameters
- Return: Object with output structure

**Example:**
module.exports = async function(input) {
  const processed = input.data.map(item => ({
    ...item,
    processed: true
  }));

  return {
    data: processed,
    count: processed.length
  };
};

## Zapier Code by Zapier

**JavaScript:**
- Input: \`inputData\` object
- Return: Object or array
- Libraries: lodash (_), moment, axios available

**Python:**
- Input: \`input_data\` dict
- Return: dict or list
- Standard library + common packages available

**Example (JS):**
// inputData contains: { name: "John", email: "john@example.com" }
const formatted = {
  fullName: inputData.name,
  emailLower: inputData.email.toLowerCase(),
  createdAt: new Date().toISOString()
};

return formatted;

# OUTPUT RULES:

1. Return ONLY the code - no markdown blocks, no explanations
2. Code must be immediately usable in the target platform
3. Include helpful comments for complex logic
4. Use platform-specific syntax and conventions
5. Handle errors gracefully where appropriate
`
}
