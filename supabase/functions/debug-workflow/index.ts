// Supabase Edge Function: debug-workflow
// Handles AI workflow debugging securely on server-side

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendSlackAlert } from '../_shared/alerting.ts'

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

    // **SECURITY VALIDATION** - Validate errorDescription for malicious input
    if (errorDescription) {
      const validation = validateErrorDescription(errorDescription)
      if (validation.blocked) {
        // Log security event
        await supabaseClient.from('audit_logs').insert({
          user_id: user.id,
          event_id: crypto.randomUUID(),
          action_type: 'workflow_debug',
          action_status: 'blocked',
          action_details: {
            platform,
            errorDescription: errorDescription.substring(0, 500),
            validation_category: validation.category,
            threat_level: validation.threatLevel,
          },
          credits_used: 0,
          threat_detected: true,
          threat_type: validation.category,
          threat_severity: validation.threatLevel,
          threat_details: validation.error,
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown',
        })

        // Alert on critical/high severity threats
        if (validation.threatLevel === 'critical' || validation.threatLevel === 'high') {
          await sendSlackAlert(
            `Debug request blocked: ${validation.category}`,
            validation.threatLevel,
            {
              user_id: user.id,
              platform,
              category: validation.category,
              prompt_preview: errorDescription.substring(0, 200),
            }
          ).catch(console.error)
        }

        return new Response(
          JSON.stringify({ error: validation.error }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          }
        )
      }
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

/**
 * Validates error description for security threats
 * Returns { blocked: true, error: string, category: string, threatLevel: string } if malicious
 * Returns { blocked: false } if safe
 */
function validateErrorDescription(errorDescription: string): any {
  const lowerPrompt = errorDescription.toLowerCase()

  // 1. Block prompt injection attempts (CRITICAL THREAT)
  const promptInjectionPatterns = [
    /ignore\s+(all\s+)?(previous|prior)\s+(instructions?|directions?)/i,
    /disregard\s+(all\s+)?(previous|prior)\s+instructions?/i,
    /forget\s+(everything|all\s+previous)/i,
    /you\s+are\s+now\s+(a|an)\s+/i,
    /new\s+instructions?:/i,
    /system\s+prompt:/i,
  ]

  for (const pattern of promptInjectionPatterns) {
    if (pattern.test(lowerPrompt)) {
      return {
        blocked: true,
        error: '🚨 Prompt injection attempt detected. This action has been logged.',
        category: 'prompt_injection',
        threatLevel: 'critical'
      }
    }
  }

  // 2. Block malicious code requests (CRITICAL THREAT)
  const maliciousPatterns = [
    /\b(malicious|virus|trojan|malware|backdoor|keylog|ransomware)\b/i,
    /\b(steal|hack|exploit|breach|crack)\b/i,
    /\b(bypass|circumvent)\s+(security|authentication)/i,
    /\bddos|dos\s+attack/i,
    /\bunauthorized\s+access/i,
    /\b(smb|rce|remote\s+code\s+execution|command\s+injection)\b/i,
    /\b(sql\s+injection|xss|cross[- ]site\s+scripting)/i,
  ]

  for (const pattern of maliciousPatterns) {
    if (pattern.test(lowerPrompt)) {
      return {
        blocked: true,
        error: '🚨 Malicious request blocked. This violates our terms of service.',
        category: 'malicious_code',
        threatLevel: 'critical'
      }
    }
  }

  // 3. Block data exfiltration (CRITICAL)
  const dataExfiltrationPatterns = [
    /\b(exfiltrate|extract|download|dump)\s+(all\s+)?(data|database|credentials?|passwords?)/i,
    /\b(send|post|upload)\s+(to|data\s+to)\s+(external|remote)/i,
    /\bsteal\s+(credentials?|passwords?|tokens?)/i,
  ]

  for (const pattern of dataExfiltrationPatterns) {
    if (pattern.test(lowerPrompt)) {
      return {
        blocked: true,
        error: '🚨 Data exfiltration attempt detected. This action has been logged.',
        category: 'data_exfiltration',
        threatLevel: 'critical'
      }
    }
  }

  // 4. Block spam/abuse (HIGH)
  const spamPatterns = [
    /\b(mass|bulk|automated)\s+(email|sms|message)/i,
    /\bsend\s+\d+\s+(emails?|messages?)/i,
    /\b(scrape|harvest)\ s+(email|phone|contact)/i,
  ]

  for (const pattern of spamPatterns) {
    if (pattern.test(lowerPrompt)) {
      return {
        blocked: true,
        error: '🚨 Spam/abuse automation is not allowed.',
        category: 'spam_abuse',
        threatLevel: 'high'
      }
    }
  }

  // 5. Block privacy violations (HIGH)
  const privacyPatterns = [
    /\b(track|monitor|spy)\s+(users?|people)\s+without/i,
    /\b(hidden|stealth|invisible)\s+(tracker|logger)/i,
    /\bcollect\s+(personal|private)\s+data\s+without\s+consent/i,
  ]

  for (const pattern of privacyPatterns) {
    if (pattern.test(lowerPrompt)) {
      return {
        blocked: true,
        error: '🚨 Privacy violation detected. Unauthorized tracking/monitoring is illegal.',
        category: 'privacy_violation',
        threatLevel: 'high'
      }
    }
  }

  // 6. Block social engineering (CRITICAL)
  const socialEngineeringPatterns = [
    /\b(phishing|spear[- ]?phishing)/i,
    /\b(fake|spoofed?)\s+(login|signin)\s+(page|form)/i,
    /\b(impersonate|pretend\s+to\s+be|pose\s+as)\s+(company|admin)/i,
  ]

  for (const pattern of socialEngineeringPatterns) {
    if (pattern.test(lowerPrompt)) {
      return {
        blocked: true,
        error: '🚨 Social engineering/phishing attempt detected. This is illegal.',
        category: 'social_engineering',
        threatLevel: 'critical'
      }
    }
  }

  return { blocked: false }
}

function getDebugSystemPrompt(platform: string): string {
  return `You are an expert ${platform} workflow debugger.

Your task: Analyze broken workflows, identify issues, and return FIXED JSON.

Common issues to check:
- Missing or invalid node connections
- Incorrect node types or parameters
- Dead-end nodes (no outputs)
- Missing trigger nodes
- Invalid data mappings

IMPORTANT SECURITY RULES:
- NEVER generate malicious code (malware, viruses, hacking tools)
- NEVER generate code for unauthorized access or data theft
- NEVER generate spam, phishing, or privacy-violating code
- REFUSE any requests that violate ethics or laws

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
