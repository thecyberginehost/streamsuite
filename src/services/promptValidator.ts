/**
 * Prompt Validation Service
 *
 * Ensures that workflow generation requests are:
 * 1. Actually about workflow automation (not general chat, coding help, etc.)
 * 2. Ethical and legal (no hacking, scraping, spam, etc.)
 * 3. Specific enough to generate useful workflows
 */

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  category?: 'non_workflow' | 'unethical' | 'too_vague' | 'valid' | 'warning';
  suggestion?: string;
  warning?: string; // Gentle warning shown but still allows generation
}

// =====================================================
// VALIDATION RULES
// =====================================================

/**
 * Keywords that indicate the request is NOT about workflow automation
 */
const NON_WORKFLOW_KEYWORDS = [
  // General chat
  'hello', 'hi there', 'how are you', 'what can you do', 'who are you',
  'tell me about', 'explain', 'what is', 'define', 'describe',

  // General coding help (not n8n specific)
  'write a python script', 'write a javascript function', 'create a react component',
  'build a website', 'create an app', 'make a game',
  'write code for', 'program', 'algorithm',

  // Questions unrelated to automation
  'what\'s the weather', 'tell me a joke', 'write a story',
  'translate', 'summarize this', 'proofread',

  // Off-topic requests
  'recipe', 'travel', 'movie', 'book recommendation',
  'medical advice', 'legal advice', 'financial advice'
];

/**
 * Unethical/illegal activities that should be rejected
 */
const UNETHICAL_PATTERNS = [
  // Hacking and unauthorized access
  { pattern: /hack|exploit|penetrate|breach|crack|break into/i, reason: 'Hacking or unauthorized access attempts are not allowed' },
  { pattern: /steal|scrape without permission|bypass security|circumvent/i, reason: 'Unauthorized data access is not allowed' },
  { pattern: /ddos|dos attack|flood|overwhelm server/i, reason: 'Denial of service attacks are illegal' },
  { pattern: /phishing|social engineering|impersonat(e|ion)|fake (email|message)/i, reason: 'Phishing and impersonation are illegal' },

  // Spam and abuse
  { pattern: /spam|mass email blast|send to thousands|unsolicited/i, reason: 'Spam and unsolicited mass messaging violate regulations (CAN-SPAM, GDPR)' },
  { pattern: /bot (farm|network)|fake accounts|mass (register|signup)/i, reason: 'Creating fake accounts or bot networks violates terms of service' },
  { pattern: /review manipulation|fake reviews|astroturfing/i, reason: 'Review manipulation and fake content are unethical' },

  // Data theft and privacy violations
  { pattern: /scrape (facebook|linkedin|twitter|instagram|personal data)/i, reason: 'Scraping personal data without consent violates privacy laws' },
  { pattern: /collect emails without consent|harvest (email|phone|contact)/i, reason: 'Unauthorized data collection violates GDPR/CCPA' },
  { pattern: /track users without consent|spy on|monitor without permission/i, reason: 'Tracking without consent violates privacy laws' },

  // Financial fraud
  { pattern: /pump and dump|market manipulation|insider trading/i, reason: 'Securities fraud is illegal' },
  { pattern: /money laundering|fake invoice|payment fraud/i, reason: 'Financial fraud is illegal' },
  { pattern: /cryptocurrency scam|rug pull|ponzi/i, reason: 'Financial scams are illegal' },

  // Content theft and piracy
  { pattern: /copyright infringement|pirat(e|ed)|download movies|torrent/i, reason: 'Copyright infringement is illegal' },
  { pattern: /steal content|plagiarize|copy without attribution/i, reason: 'Content theft violates copyright law' },

  // Misinformation and manipulation
  { pattern: /fake news|misinformation campaign|propaganda bot/i, reason: 'Spreading misinformation is unethical' },
  { pattern: /manipulate (opinion|votes|ratings|engagement)/i, reason: 'Manipulation and fraud are unethical' },

  // Prohibited services
  { pattern: /dark web|illegal marketplace|drug|weapon|counterfeit/i, reason: 'Illegal marketplace activities are prohibited' },
  { pattern: /child|minor|nsfw|adult content automation/i, reason: 'Content involving minors is illegal' }
];

/**
 * Patterns that indicate the request is actually workflow-related
 */
const WORKFLOW_POSITIVE_SIGNALS = [
  'workflow', 'automation', 'n8n', 'integrate', 'connect',
  'when', 'trigger', 'send notification', 'create task',
  'update database', 'fetch data', 'process', 'schedule',
  'webhook', 'api', 'slack', 'gmail', 'sheets', 'notion',
  'automate', 'sync', 'monitor', 'alert', 'pipeline'
];

/**
 * Minimum specificity requirements
 */
const SPECIFICITY_SIGNALS = {
  hasTrigger: ['when', 'if', 'schedule', 'webhook', 'on', 'trigger'],
  hasAction: ['send', 'create', 'update', 'delete', 'fetch', 'get', 'post', 'notify', 'save'],
  hasIntegration: [
    'slack', 'gmail', 'email', 'sheets', 'notion', 'airtable',
    'telegram', 'discord', 'hubspot', 'salesforce', 'stripe',
    'shopify', 'github', 'jira', 'trello', 'asana', 'database',
    'api', 'http', 'webhook', 'calendar', 'drive', 'dropbox'
  ]
};

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

/**
 * Main validation function
 */
export function validatePrompt(prompt: string): ValidationResult {
  const lowerPrompt = prompt.toLowerCase().trim();

  // 1. Check if too short
  if (lowerPrompt.length < 10) {
    return {
      isValid: false,
      category: 'too_vague',
      reason: 'Prompt is too short',
      suggestion: 'Please provide more details about the workflow you want to create. Include the trigger and actions.'
    };
  }

  // 2. Check for unethical/illegal content
  const ethicalCheck = checkEthicalViolations(lowerPrompt);
  if (!ethicalCheck.isValid) {
    return ethicalCheck;
  }

  // 3. Check if it's actually a workflow request
  const workflowCheck = checkIsWorkflowRequest(lowerPrompt);
  if (!workflowCheck.isValid) {
    return workflowCheck;
  }

  // 4. Check specificity
  const specificityCheck = checkSpecificity(lowerPrompt);
  if (!specificityCheck.isValid) {
    return specificityCheck;
  }

  // All checks passed
  return {
    isValid: true,
    category: 'valid',
    reason: 'Valid workflow request'
  };
}

/**
 * Check for unethical or illegal workflow requests
 */
function checkEthicalViolations(prompt: string): ValidationResult {
  for (const { pattern, reason } of UNETHICAL_PATTERNS) {
    if (pattern.test(prompt)) {
      return {
        isValid: false,
        category: 'unethical',
        reason: `This request was blocked: ${reason}`,
        suggestion: 'StreamSuite can only generate ethical, legal workflow automations. Please ensure your use case complies with laws and platform terms of service.'
      };
    }
  }

  return { isValid: true, category: 'valid' };
}

/**
 * Check if the prompt is actually asking for a workflow
 */
function checkIsWorkflowRequest(prompt: string): ValidationResult {
  // Check for non-workflow keywords (general chat, coding help, etc.)
  const hasNonWorkflowKeywords = NON_WORKFLOW_KEYWORDS.some(keyword =>
    prompt.includes(keyword.toLowerCase())
  );

  // Check for positive workflow signals
  const hasWorkflowSignals = WORKFLOW_POSITIVE_SIGNALS.some(signal =>
    prompt.includes(signal.toLowerCase())
  );

  // If it has non-workflow keywords and no workflow signals, reject
  if (hasNonWorkflowKeywords && !hasWorkflowSignals) {
    return {
      isValid: false,
      category: 'non_workflow',
      reason: 'This doesn\'t appear to be a workflow automation request',
      suggestion: 'StreamSuite generates n8n workflow automations. Please describe an automation task like: "Send a Slack message when a new customer signs up" or "Sync Google Sheets to a database every hour".'
    };
  }

  // If prompt is very generic without workflow context
  if (!hasWorkflowSignals && prompt.length < 30) {
    return {
      isValid: false,
      category: 'too_vague',
      reason: 'Request is too vague',
      suggestion: 'Please describe a specific workflow automation. Include:\n- What triggers the workflow (webhook, schedule, etc.)\n- What actions should happen (send email, update database, etc.)\n- Which tools or services to use (Slack, Gmail, Sheets, etc.)'
    };
  }

  return { isValid: true, category: 'valid' };
}

/**
 * Check if prompt has enough specificity to generate a useful workflow
 * NOW MORE PERMISSIVE - allows generation but shows warnings
 */
function checkSpecificity(prompt: string): ValidationResult {
  const hasTrigger = SPECIFICITY_SIGNALS.hasTrigger.some(t => prompt.includes(t));
  const hasAction = SPECIFICITY_SIGNALS.hasAction.some(a => prompt.includes(a));
  const hasIntegration = SPECIFICITY_SIGNALS.hasIntegration.some(i => prompt.includes(i));

  // Calculate specificity score (0-3)
  const specificityScore = (hasTrigger ? 1 : 0) + (hasAction ? 1 : 0) + (hasIntegration ? 1 : 0);

  // Build warning message for missing components
  const missingComponents: string[] = [];
  if (!hasTrigger) missingComponents.push('trigger (when to run)');
  if (!hasAction) missingComponents.push('action (what to do)');
  if (!hasIntegration) missingComponents.push('integrations (which tools)');

  // Score 0: Show warning but allow (AI will add defaults)
  if (specificityScore === 0) {
    return {
      isValid: true, // Changed to true!
      category: 'warning',
      reason: 'Prompt is quite vague - AI will use best judgment',
      warning: `⚠️ Your prompt is missing: ${missingComponents.join(', ')}. The AI will add reasonable defaults, but results may not match your expectations.`,
      suggestion: 'For better results, specify:\n• When it should run (webhook, schedule, manual)\n• What it should do (send, create, update)\n• Which tools to use (Slack, Gmail, Sheets, etc.)\n\nExample: "When a form is submitted, send a Slack notification"'
    };
  }

  // Score 1: Show warning but allow
  if (specificityScore === 1) {
    return {
      isValid: true, // Changed to true!
      category: 'warning',
      reason: 'Prompt could be more specific',
      warning: `⚠️ Missing: ${missingComponents.join(', ')}. The AI will make assumptions.`,
      suggestion: 'Add more details for better results:\n' +
        (!hasTrigger ? '• When should this run? (webhook, schedule, manual)\n' : '') +
        (!hasAction ? '• What should it do? (send, create, update, notify)\n' : '') +
        (!hasIntegration ? '• Which tools? (Slack, Gmail, Notion, etc.)\n' : '')
    };
  }

  // Score 2-3 is good
  return { isValid: true, category: 'valid' };
}

/**
 * Get helpful feedback for improving a prompt (even if valid)
 */
export function getPromptFeedback(prompt: string): string[] {
  const feedback: string[] = [];
  const lowerPrompt = prompt.toLowerCase();

  // Check for common improvements
  if (!SPECIFICITY_SIGNALS.hasTrigger.some(t => lowerPrompt.includes(t))) {
    feedback.push('💡 Consider specifying when the workflow should trigger (webhook, schedule, manual)');
  }

  if (!SPECIFICITY_SIGNALS.hasIntegration.some(i => lowerPrompt.includes(i))) {
    feedback.push('💡 Mention specific tools/services (e.g., Slack, Gmail, Notion, Google Sheets)');
  }

  if (!lowerPrompt.includes('then') && !lowerPrompt.includes('and')) {
    feedback.push('💡 Multi-step workflows are more powerful! Try: "Do X, then Y, and finally Z"');
  }

  if (prompt.length < 50) {
    feedback.push('💡 More details = better results! Describe the data flow and any conditions.');
  }

  return feedback;
}

/**
 * Get example prompts for guidance
 */
export function getExamplePrompts(): { good: string[]; bad: string[] } {
  return {
    good: [
      'Send a Slack notification when a new customer signs up via webhook, and add their info to Google Sheets',
      'Every day at 9am, fetch GitHub issues labeled "bug" and create a summary in Notion',
      'When a payment succeeds in Stripe, send a welcome email via Gmail and create a HubSpot contact',
      'Build an AI agent that can answer customer questions from our knowledge base and escalate complex issues to a human via Slack',
      'Monitor a webhook for form submissions, validate the email address, and if valid, add to Airtable and send a confirmation email'
    ],
    bad: [
      'automate my business', // Too vague
      'send emails', // Missing trigger and details
      'make something cool', // Not specific at all
      'write a python script to hack a database', // Unethical
      'create a bot to spam Discord servers', // Unethical
      'hello, what can you do?', // Not a workflow request
      'explain how n8n works' // Not asking to generate a workflow
    ]
  };
}
