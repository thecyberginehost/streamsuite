// Supabase Edge Function: batch-generate
// Handles batch workflow generation securely on server-side

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendSlackAlert } from '../_shared/alerting.ts'

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

    // **SECURITY VALIDATION** - Validate prompt for malicious input
    const validation = validateBatchPrompt(prompt)
    if (validation.blocked) {
      // Log security event
      await supabaseClient.from('audit_logs').insert({
        user_id: user.id,
        event_id: crypto.randomUUID(),
        action_type: 'batch_generate',
        action_status: 'blocked',
        action_details: {
          platform,
          prompt: prompt.substring(0, 500),
          workflowCount,
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
          `Batch generation blocked: ${validation.category}`,
          validation.threatLevel,
          {
            user_id: user.id,
            platform,
            category: validation.category,
            prompt_preview: prompt.substring(0, 200),
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

/**
 * Validates batch generation prompt for security threats
 * Returns { blocked: true, error: string, category: string, threatLevel: string } if malicious
 * Returns { blocked: false } if safe
 */
function validateBatchPrompt(prompt: string): any {
  const lowerPrompt = prompt.toLowerCase()

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

  // 2. Block malicious workflow requests (CRITICAL THREAT)
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
        error: '🚨 Malicious workflow generation request blocked. This violates our terms of service.',
        category: 'malicious_workflow',
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
    /\b(scrape|harvest)\s+(email|phone|contact)/i,
  ]

  for (const pattern of spamPatterns) {
    if (pattern.test(lowerPrompt)) {
      return {
        blocked: true,
        error: '🚨 Spam/abuse automation is not allowed. This violates our terms of service.',
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

  // 7. Block cryptocurrency mining (CRITICAL)
  const cryptoMiningPatterns = [
    /\b(crypto|bitcoin|ethereum|monero)\s+(mining|miner)/i,
    /\bcoinhive|cryptoloot|jsecoin/i,
    /\b(mine|mining)\s+(cryptocurrency|crypto)/i,
  ]

  for (const pattern of cryptoMiningPatterns) {
    if (pattern.test(lowerPrompt)) {
      return {
        blocked: true,
        error: '🚨 Cryptocurrency mining code is not allowed.',
        category: 'crypto_mining',
        threatLevel: 'critical'
      }
    }
  }

  // 8. Block financial fraud (CRITICAL)
  const financialFraudPatterns = [
    /\b(fake|counterfeit|forged?)\s+(payment|transaction|invoice)/i,
    /\b(chargeback|refund)\s+(fraud|abuse)/i,
    /\b(credit\s+card|payment)\s+(testing|validation)/i,
  ]

  for (const pattern of financialFraudPatterns) {
    if (pattern.test(lowerPrompt)) {
      return {
        blocked: true,
        error: '🚨 Financial fraud detected. This is illegal and has been reported.',
        category: 'financial_fraud',
        threatLevel: 'critical'
      }
    }
  }

  return { blocked: false }
}

function getSystemPrompt(platform: string): string {
  if (platform === 'n8n') {
    return `You are an expert n8n workflow automation engineer.

Generate production-ready n8n workflow JSON from descriptions.

IMPORTANT SECURITY RULES:
- NEVER generate malicious workflows (malware, hacking tools, data theft)
- NEVER generate spam, phishing, or privacy-violating workflows
- NEVER generate workflows for unauthorized access or circumventing security
- REFUSE any requests that violate ethics or laws

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

  return `You are an expert workflow automation engineer.

IMPORTANT SECURITY RULES:
- NEVER generate malicious workflows (malware, hacking tools, data theft)
- NEVER generate spam, phishing, or privacy-violating workflows
- NEVER generate workflows for unauthorized access or circumventing security
- REFUSE any requests that violate ethics or laws`
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
