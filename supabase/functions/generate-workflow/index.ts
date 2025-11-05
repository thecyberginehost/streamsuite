// Supabase Edge Function: generate-workflow
// Handles AI workflow generation securely on server-side

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendSlackAlert } from '../_shared/alerting.ts'

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

    // SERVER-SIDE VALIDATION: Security checks before calling AI
    const validation = validateWorkflowPrompt(prompt)
    if (validation.blocked) {
      console.warn('[generate-workflow] Blocked malicious request:', {
        user: user.id,
        reason: validation.error,
        threatLevel: validation.threatLevel,
        prompt: prompt.substring(0, 100)
      })

      // Send real-time alert for critical/high severity threats
      if (validation.threatLevel === 'critical' || validation.threatLevel === 'high') {
        await sendSlackAlert(
          validation.error || 'Workflow generation blocked',
          validation.threatLevel,
          {
            user_id: user.id.substring(0, 8) + '...',
            category: validation.category,
            platform,
            prompt_preview: prompt.substring(0, 100)
          }
        )
      }

      // Log to audit_logs table
      try {
        await supabaseClient.from('audit_logs').insert({
          user_id: user.id,
          event_type: 'workflow_generation',
          event_subtype: 'blocked',
          severity: validation.threatLevel === 'critical' ? 'critical' : validation.threatLevel === 'high' ? 'high' : 'medium',
          description: validation.error || 'Workflow generation blocked',
          metadata: {
            platform,
            prompt: prompt.substring(0, 200),
            category: validation.category,
            threat_level: validation.threatLevel
          }
        })
      } catch (logError) {
        console.error('[generate-workflow] Failed to log to audit_logs:', logError)
      }

      return new Response(
        JSON.stringify({
          error: validation.error,
          blocked: true,
          category: validation.category,
          threatLevel: validation.threatLevel
        }),
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

interface ValidationResult {
  blocked: boolean
  error?: string
  category?: string
  threatLevel?: 'critical' | 'high' | 'medium' | 'low'
}

// SERVER-SIDE VALIDATION: Prevents malicious workflow generation prompts
function validateWorkflowPrompt(prompt: string): ValidationResult {
  const lowerPrompt = prompt.toLowerCase()

  // 1. Block prompt injection attempts (CRITICAL THREAT)
  const promptInjectionPatterns = [
    /ignore\s+(all\s+)?(previous|prior)\s+(instructions?|directions?|prompts?)/i,
    /disregard\s+(all\s+)?(previous|prior)\s+(instructions?|prompts?)/i,
    /forget\s+(everything|all\s+previous)/i,
    /you\s+are\s+now\s+(a|an)\s+/i,
    /new\s+instructions?:/i,
  ]

  for (const pattern of promptInjectionPatterns) {
    if (pattern.test(prompt)) {
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
    /\b(smb|rce|remote\s+code\s+execution|command\s+injection)\b/i, // Added SMB/RCE detection
    /\b(sql\s+injection|xss|cross[- ]site\s+scripting)/i,
    /\b(brute[- ]force|password\s+cracking)/i,
    /\b(port\s+scanning|network\s+scanning|vulnerability\s+scanning)/i,
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

  // 2.5. Block data exfiltration attempts (CRITICAL THREAT)
  const dataExfiltrationPatterns = [
    /\b(exfiltrate|extract|download|dump)\s+(all\s+)?(data|database|credentials?|passwords?|users?|accounts?)/i,
    /\b(send|post|upload)\s+(to|data\s+to)\s+(external|remote|http)/i,
    /\b(copy|mirror|sync)\s+(database|data)\s+to\s+(external|remote)/i,
    /\bsteal\s+(credentials?|passwords?|tokens?|keys?|data)/i,
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

  // 2.6. Block cryptocurrency mining (CRITICAL THREAT)
  const cryptoMiningPatterns = [
    /\b(crypto|bitcoin|ethereum|monero)\s+(mining|miner)/i,
    /\bcoinhive|cryptoloot|jsecoin/i,
    /\b(mine|mining)\s+(cryptocurrency|crypto|bitcoin)/i,
  ]

  for (const pattern of cryptoMiningPatterns) {
    if (pattern.test(lowerPrompt)) {
      return {
        blocked: true,
        error: '🚨 Cryptocurrency mining workflows are not allowed.',
        category: 'crypto_mining',
        threatLevel: 'critical'
      }
    }
  }

  // 2.7. Block spam/abuse patterns (HIGH THREAT)
  const spamAbusePatterns = [
    /\b(mass|bulk|automated)\s+(email|sms|message|dm|comment)/i,
    /\b(spam|unsolicited)\s+(email|message|sms)/i,
    /\bsend\s+\d+\s+(emails?|messages?|sms)\s+to/i,
    /\b(scrape|harvest)\s+(email|phone|contact)\s+(addresses?|numbers?|info)/i,
    /\bfollow[- ]unfollow\s+(bot|automation|script)/i,
    /\bauto[- ]?liker?|auto[- ]?comment/i,
  ]

  for (const pattern of spamAbusePatterns) {
    if (pattern.test(lowerPrompt)) {
      return {
        blocked: true,
        error: '🚨 Spam/abuse automation is not allowed. This violates our terms of service.',
        category: 'spam_abuse',
        threatLevel: 'high'
      }
    }
  }

  // 2.8. Block privacy violations (HIGH THREAT)
  const privacyViolationPatterns = [
    /\b(track|monitor|spy)\s+(users?|people|employees?)\s+without/i,
    /\b(hidden|stealth|invisible)\s+(tracker|logger|monitor)/i,
    /\b(record|capture)\s+(keystrokes?|passwords?|screen)\s+without/i,
    /\bcollect\s+(personal|private)\s+data\s+without\s+consent/i,
    /\bscreenshot\s+(without|secretly)/i,
  ]

  for (const pattern of privacyViolationPatterns) {
    if (pattern.test(lowerPrompt)) {
      return {
        blocked: true,
        error: '🚨 Privacy violation detected. Unauthorized tracking/monitoring is illegal.',
        category: 'privacy_violation',
        threatLevel: 'high'
      }
    }
  }

  // 2.9. Block rate limit abuse (HIGH THREAT)
  const rateLimitAbusePatterns = [
    /\b(bypass|circumvent|avoid)\s+(rate\s+limit|throttle|quota)/i,
    /\binfinite\s+(loop|requests?|calls?)/i,
    /\b(flood|overwhelm|bombard)\s+(api|endpoint|server)/i,
    /\bmake\s+\d{3,}\s+(requests?|calls?)/i,
  ]

  for (const pattern of rateLimitAbusePatterns) {
    if (pattern.test(lowerPrompt)) {
      return {
        blocked: true,
        error: '🚨 Rate limit abuse detected. This could cause service disruption.',
        category: 'rate_limit_abuse',
        threatLevel: 'high'
      }
    }
  }

  // 2.10. Block credential stuffing / account takeover (HIGH THREAT)
  const accountTakeoverPatterns = [
    /\b(credential|password)\s+stuffing/i,
    /\b(brute[- ]?force|dictionary)\s+attack/i,
    /\btry\s+(multiple|all|many)\s+(passwords?|credentials?)/i,
    /\baccount\s+(takeover|hijack|compromise)/i,
    /\bcheck\s+if\s+(password|credential)\s+(is\s+)?valid/i,
  ]

  for (const pattern of accountTakeoverPatterns) {
    if (pattern.test(lowerPrompt)) {
      return {
        blocked: true,
        error: '🚨 Account takeover attempt detected. This is illegal and has been logged.',
        category: 'account_takeover',
        threatLevel: 'high'
      }
    }
  }

  // 2.11. Block malicious scraping (HIGH THREAT)
  const maliciousScrapingPatterns = [
    /\bscrape\s+(prices?|products?)\s+from\s+competitor/i,
    /\bcopy\s+(entire|all)\s+(website|content|articles?)/i,
    /\b(clone|duplicate|mirror)\s+website/i,
    /\bscrape.*without\s+(permission|robots\.txt|consent)/i,
    /\bbypass\s+(cloudflare|captcha|anti[- ]?bot)/i,
  ]

  for (const pattern of maliciousScrapingPatterns) {
    if (pattern.test(lowerPrompt)) {
      return {
        blocked: true,
        error: '🚨 Unauthorized scraping detected. Ensure you have permission and respect robots.txt.',
        category: 'malicious_scraping',
        threatLevel: 'high'
      }
    }
  }

  // 2.12. Block financial fraud (CRITICAL THREAT)
  const financialFraudPatterns = [
    /\b(fake|counterfeit|forged?)\s+(payment|transaction|invoice)/i,
    /\b(chargeback|refund)\s+(fraud|abuse)/i,
    /\b(credit\s+card|payment)\s+(testing|validation|checking)/i,
    /\bgenerate\s+(fake|invalid)\s+(credit\s+card|payment)/i,
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

  // 2.13. Block social engineering (CRITICAL THREAT)
  const socialEngineeringPatterns = [
    /\b(phishing|spear[- ]?phishing)\s+(email|page|site)/i,
    /\b(fake|spoofed?)\s+(login|signin|authentication)\s+(page|form)/i,
    /\b(impersonate|pretend\s+to\s+be|pose\s+as)\s+(company|admin|support)/i,
    /\bcreate\s+(fake|fraudulent)\s+(website|page)\s+(that\s+looks\s+like|mimicking)/i,
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

  // 3. Block command injection patterns (HIGH THREAT)
  const commandPatterns = [
    /\|\s*(ls|cat|wget|curl|rm|del|bash|sh|cmd)/i,
    /`[\w\s]+`/,
    /\$\([\w\s]+\)/,
  ]

  for (const pattern of commandPatterns) {
    if (pattern.test(prompt)) {
      return {
        blocked: true,
        error: '🚨 Command injection attempt detected. This action has been logged.',
        category: 'command_injection',
        threatLevel: 'high'
      }
    }
  }

  // 4. Warn about sensitive patterns (ALLOW but log for monitoring)
  const sensitivePatterns = [
    {
      pattern: /\b(authenticate|login|signin)\s+to\s+\w+\s+account/i,
      warning: '⚠️ Authentication workflow detected. Ensure proper authorization and secure credential storage.',
      type: 'authentication'
    },
    {
      pattern: /\b(download|fetch|get)\s+(user|customer)\s+data/i,
      warning: '⚠️ User data access detected. Ensure GDPR/privacy compliance and proper permissions.',
      type: 'data_access'
    },
    {
      pattern: /\b(delete|remove|purge)\s+(all|users?|accounts?|data)/i,
      warning: '⚠️ Destructive operation detected. Ensure you have backups and proper authorization.',
      type: 'destructive'
    },
    {
      pattern: /\b(scrap|crawl|extract)\s+(website|web|page|data|content)/i,
      warning: '⚠️ Scraping detected. Ensure you have permission and respect robots.txt.',
      type: 'scraping'
    },
  ]

  for (const { pattern, warning, type } of sensitivePatterns) {
    if (pattern.test(lowerPrompt)) {
      return {
        blocked: false,
        warning,
        category: type,
        threatLevel: 'low'
      }
    }
  }

  return { blocked: false } // Valid prompt
}
