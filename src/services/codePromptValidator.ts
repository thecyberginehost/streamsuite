/**
 * Code Prompt Validation Service
 *
 * Ensures that custom code generation requests are:
 * 1. Actually requesting code snippets (not full workflows)
 * 2. Using the correct language (JavaScript vs Python detection)
 * 3. Free from security threats (XSS, injection, etc.)
 * 4. Ethical and legal
 */

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface CodeValidationResult {
  isValid: boolean;
  reason?: string;
  category?: 'workflow_attempt' | 'language_mismatch' | 'security_threat' | 'unethical' | 'valid' | 'warning';
  suggestion?: string;
  warning?: string;
  detectedLanguage?: 'javascript' | 'python' | 'unknown';
}

// =====================================================
// VALIDATION RULES
// =====================================================

/**
 * Patterns that indicate the user is trying to generate a full workflow instead of code
 */
const WORKFLOW_GENERATION_PATTERNS = [
  { pattern: /\b(create|generate|build|make)\s+(a\s+)?(complete|full|entire)?\s*workflow/i, reason: 'Requesting full workflow generation' },
  { pattern: /\b(n8n|make\.com|zapier)\s+(workflow|automation|integration)/i, reason: 'Requesting platform workflow' },
  { pattern: /\bwith\s+\d+\s+(nodes?|steps?|modules?|actions?)/i, reason: 'Requesting multi-node workflow' },
  { pattern: /\b(webhook|trigger|schedule|cron)\s+.*\s+(send|create|update|notify)/i, reason: 'Requesting trigger-action workflow' },
  { pattern: /\bconnect\s+\w+\s+to\s+\w+/i, reason: 'Requesting integration workflow' },
  { pattern: /\bautomation\s+(from|with|using)\s+start\s+to\s+(finish|end)/i, reason: 'Requesting end-to-end automation' },
  { pattern: /\b(nodes?|modules?|steps?)\s+that\s+(execute|run|process)/i, reason: 'Requesting workflow structure' },
  { pattern: /\bmulti[- ]?step\s+(automation|workflow|process)/i, reason: 'Requesting multi-step workflow' },
];

/**
 * Patterns that indicate the user is trying to generate a full application/webpage instead of code snippets
 */
const FULL_APP_GENERATION_PATTERNS = [
  { pattern: /\b(create|generate|build|make)\s+(an?\s+)?(html|css|react|vue|angular|web)?\s*(webpage|website|web\s+page|web\s+app|application|app|landing\s+page|dashboard|interface|ui)/i, reason: 'Requesting full application/webpage' },
  { pattern: /\b(create|generate|build)\s+(an?\s+)?(full|complete|entire)?\s*(form|login|signup|registration|contact)\s+(page|form)/i, reason: 'Requesting full form/page' },
  { pattern: /\b(create|generate|build)\s+(an?\s+)?todo\s+(app|list|application)/i, reason: 'Requesting full todo application' },
  { pattern: /\b(create|generate|build)\s+(an?\s+)?calculator/i, reason: 'Requesting full calculator application' },
  { pattern: /\b(create|generate|build)\s+(an?\s+)?game/i, reason: 'Requesting game application' },
];

/**
 * Patterns to detect Python code syntax
 */
const PYTHON_SYNTAX_PATTERNS = [
  /\bdef\s+\w+\s*\(/,                          // Function definition: def function_name(
  /\bclass\s+\w+\s*[:\(]/,                     // Class definition: class MyClass:
  /\bimport\s+\w+/,                            // Import statement: import module
  /\bfrom\s+\w+\s+import/,                     // From import: from module import
  /\b(print|len|range|enumerate|zip)\s*\(/,   // Python built-ins
  /\bif\s+.*:\s*$/m,                           // If statement with colon
  /\bfor\s+\w+\s+in\s+/,                       // For loop: for item in
  /\belif\s+/,                                 // elif keyword
  /\bTrue|False|None\b/,                       // Python booleans/None
  /\b__\w+__/,                                 // Dunder methods: __init__, __str__
  /\bself\.\w+/,                               // self reference
  /\b(return|yield)\s+[\[\{]/,                 // Return/yield with list/dict
  /#\s*.*$/m,                                  // Python comments (stronger indicator)
  /'''|"""/,                                   // Triple quotes for docstrings
  /\bdict\(|list\(|tuple\(/,                   // Python type constructors
];

/**
 * Patterns to detect JavaScript code syntax
 */
const JAVASCRIPT_SYNTAX_PATTERNS = [
  /\bfunction\s+\w+\s*\(/,                     // Function declaration: function name(
  /\b(const|let|var)\s+\w+\s*=/,              // Variable declaration
  /\b(=>|function)\s*\(/,                      // Arrow function or function expression
  /\bconsole\.(log|error|warn)/,              // Console methods
  /\bnew\s+\w+\(/,                             // Constructor: new Object()
  /\b(async|await)\s+/,                        // Async/await
  /\.\s*(map|filter|reduce|forEach)\s*\(/,    // Array methods
  /\bthis\.\w+/,                               // this reference
  /\b(JSON\.parse|JSON\.stringify)/,          // JSON methods
  /\b(true|false|null|undefined)\b/,          // JavaScript primitives
  /\/\/\s*.*$/m,                               // JavaScript comments (weaker indicator)
  /\bPromise\.|\.then\(|\.catch\(/,           // Promises
  /\$\{.*?\}/,                                 // Template literals
  /\brequire\(|module\.exports/,              // CommonJS
  /\bimport\s+.*\s+from\s+/,                  // ES6 imports
];

/**
 * Security patterns (reused from promptValidator but focused on code)
 */
const SECURITY_PATTERNS = [
  // XSS attempts
  { pattern: /<script[\s\S]*?>/i, reason: 'XSS attack detected: Script tags not allowed', severity: 'critical' },
  { pattern: /<iframe[\s\S]*?>/i, reason: 'XSS attack detected: Iframe tags not allowed', severity: 'critical' },
  { pattern: /javascript:/i, reason: 'XSS attack detected: JavaScript URLs not allowed', severity: 'critical' },
  { pattern: /on\w+\s*=\s*["'][^"']*["']/i, reason: 'XSS attack detected: Event handlers not allowed', severity: 'critical' },
  { pattern: /document\.cookie|document\.write/i, reason: 'XSS attack detected: Cookie/DOM manipulation', severity: 'critical' },

  // SQL Injection
  { pattern: /'\s*(or|and)\s*'?\d*'?\s*=\s*'?\d/i, reason: 'SQL injection detected: OR/AND equality attack', severity: 'critical' },
  { pattern: /union\s+select/i, reason: 'SQL injection detected: UNION SELECT', severity: 'critical' },
  { pattern: /;\s*(drop|delete|truncate|alter)\s+(table|database)/i, reason: 'SQL injection detected: Destructive SQL', severity: 'critical' },

  // Command Injection
  { pattern: /\|.*?(ls|cat|wget|curl|bash|sh|cmd|rm|del)/i, reason: 'Command injection detected: Shell commands', severity: 'critical' },
  { pattern: /`[\w\s]+`|$\([\w\s]+\)/i, reason: 'Command injection detected: Command substitution', severity: 'critical' },

  // Path Traversal
  { pattern: /\.\.\/|\.\.\\|%2e%2e/i, reason: 'Path traversal detected', severity: 'critical' },
  { pattern: /\/etc\/passwd|\/windows\/system32/i, reason: 'Path traversal: System file access', severity: 'critical' },

  // SSRF
  { pattern: /localhost|127\.0\.0\.1|0\.0\.0\.0/i, reason: 'SSRF detected: Local network access', severity: 'critical' },
  { pattern: /169\.254\.169\.254/i, reason: 'SSRF detected: Cloud metadata access', severity: 'critical' },
  { pattern: /file:\/\/|ftp:\/\/|gopher:\/\//i, reason: 'SSRF detected: Dangerous protocols', severity: 'critical' },

  // Prototype Pollution
  { pattern: /__proto__|constructor\[["']prototype["']\]/i, reason: 'Prototype pollution detected', severity: 'critical' },

  // Prompt Injection (AI-specific)
  { pattern: /ignore\s+(all\s+)?previous\s+instructions/i, reason: 'Prompt injection attempt', severity: 'high' },
  { pattern: /disregard\s+(all\s+)?prior\s+(instructions|prompts)/i, reason: 'Prompt injection attempt', severity: 'high' },
  { pattern: /you\s+are\s+now\s+(a|an)\s+\w+/i, reason: 'Prompt injection: Role override', severity: 'high' },
  { pattern: /forget\s+everything/i, reason: 'Prompt injection attempt', severity: 'high' },
  { pattern: /instead of.*code.*generate.*workflow/i, reason: 'Prompt injection: Output manipulation', severity: 'high' },
];

/**
 * Unethical code generation patterns (COMPREHENSIVE)
 */
const UNETHICAL_CODE_PATTERNS = [
  // Original patterns
  { pattern: /hack|exploit|breach|crack password/i, reason: 'Hacking code not allowed' },
  { pattern: /bypass|circumvent|override\s+security/i, reason: 'Security bypass code not allowed' },
  { pattern: /steal|unauthorized access/i, reason: 'Unauthorized access code not allowed' },
  { pattern: /keylog|screen capture|spy|monitor without consent/i, reason: 'Surveillance code not allowed' },
  { pattern: /ddos|dos attack|flood requests/i, reason: 'DoS attack code not allowed' },
  { pattern: /phish|fake login|impersonate/i, reason: 'Phishing code not allowed' },
  { pattern: /spam|mass email|unsolicited/i, reason: 'Spam code not allowed' },
  { pattern: /decrypt\s+(password|credential|key)\s+without/i, reason: 'Unauthorized decryption code not allowed' },

  // Data exfiltration
  { pattern: /\b(exfiltrate|extract|download|dump)\s+(all\s+)?(data|database|credentials?|passwords?)/i, reason: 'Data exfiltration not allowed' },
  { pattern: /\b(send|post|upload)\s+(to|data\s+to)\s+(external|remote)/i, reason: 'Unauthorized data transfer not allowed' },

  // Cryptocurrency mining
  { pattern: /\b(crypto|bitcoin|ethereum|monero)\s+(mining|miner)/i, reason: 'Cryptocurrency mining not allowed' },
  { pattern: /\bcoinhive|cryptoloot|jsecoin/i, reason: 'Cryptocurrency mining scripts not allowed' },

  // Spam/abuse
  { pattern: /\b(mass|bulk|automated)\s+(email|sms|message)/i, reason: 'Mass messaging/spam not allowed' },
  { pattern: /\bsend\s+\d+\s+(emails?|messages?)/i, reason: 'Bulk sending not allowed' },
  { pattern: /\b(scrape|harvest)\s+(email|phone|contact)\s+(addresses?|numbers?)/i, reason: 'Contact harvesting not allowed' },
  { pattern: /\bfollow[- ]unfollow\s+(bot|automation)/i, reason: 'Social media manipulation not allowed' },
  { pattern: /\bauto[- ]?liker?|auto[- ]?comment/i, reason: 'Automated engagement not allowed' },

  // Privacy violations
  { pattern: /\b(track|monitor|spy)\s+(users?|people)\s+without/i, reason: 'Unauthorized tracking not allowed' },
  { pattern: /\b(hidden|stealth|invisible)\s+(tracker|logger)/i, reason: 'Hidden tracking not allowed' },
  { pattern: /\b(record|capture)\s+(keystrokes?|passwords?|screen)\s+without/i, reason: 'Unauthorized recording not allowed' },
  { pattern: /\bcollect\s+(personal|private)\s+data\s+without\s+consent/i, reason: 'Unauthorized data collection not allowed' },

  // Rate limit abuse
  { pattern: /\b(bypass|circumvent|avoid)\s+(rate\s+limit|throttle)/i, reason: 'Rate limit bypass not allowed' },
  { pattern: /\binfinite\s+(loop|requests?)/i, reason: 'Infinite loops not allowed' },
  { pattern: /\b(flood|overwhelm|bombard)\s+(api|endpoint)/i, reason: 'API flooding not allowed' },

  // Account takeover
  { pattern: /\b(credential|password)\s+stuffing/i, reason: 'Credential stuffing not allowed' },
  { pattern: /\btry\s+(multiple|all|many)\s+(passwords?|credentials?)/i, reason: 'Password testing not allowed' },
  { pattern: /\baccount\s+(takeover|hijack|compromise)/i, reason: 'Account takeover not allowed' },

  // Malicious scraping
  { pattern: /\bscrape.*without\s+(permission|robots\.txt)/i, reason: 'Unauthorized scraping not allowed' },
  { pattern: /\bbypass\s+(cloudflare|captcha|anti[- ]?bot)/i, reason: 'Anti-bot bypass not allowed' },
  { pattern: /\bcopy\s+(entire|all)\s+(website|content)/i, reason: 'Content theft not allowed' },

  // Financial fraud
  { pattern: /\b(fake|counterfeit|forged?)\s+(payment|transaction|invoice)/i, reason: 'Financial fraud not allowed' },
  { pattern: /\b(chargeback|refund)\s+(fraud|abuse)/i, reason: 'Payment fraud not allowed' },
  { pattern: /\b(credit\s+card|payment)\s+(testing|validation|checking)/i, reason: 'Payment card testing not allowed' },

  // Social engineering
  { pattern: /\b(phishing|spear[- ]?phishing)/i, reason: 'Phishing not allowed' },
  { pattern: /\b(fake|spoofed?)\s+(login|signin|authentication)\s+(page|form)/i, reason: 'Fake login pages not allowed' },
  { pattern: /\bcreate\s+(fake|fraudulent)\s+(website|page)/i, reason: 'Fraudulent pages not allowed' },
];

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

/**
 * Main validation function for code generation prompts
 */
export function validateCodePrompt(
  prompt: string,
  selectedLanguage: 'javascript' | 'python',
  platform: 'n8n' | 'make' | 'zapier'
): CodeValidationResult {
  const lowerPrompt = prompt.toLowerCase().trim();

  // 1. Check if too short
  if (lowerPrompt.length < 10) {
    return {
      isValid: false,
      category: 'warning',
      reason: 'Prompt is too short',
      suggestion: 'Please describe what the code should do. Example: "Parse a JSON response and extract the email addresses"'
    };
  }

  // 2. Check for security threats - HIGHEST PRIORITY
  const securityCheck = checkCodeSecurityThreats(prompt);
  if (!securityCheck.isValid) {
    return securityCheck;
  }

  // 3. Check for unethical code requests
  const ethicalCheck = checkCodeEthicalViolations(lowerPrompt);
  if (!ethicalCheck.isValid) {
    return ethicalCheck;
  }

  // 4. Check if trying to generate full workflow instead of code
  const workflowCheck = checkWorkflowGenerationAttempt(lowerPrompt);
  if (!workflowCheck.isValid) {
    return workflowCheck;
  }

  // 4.5. Check if trying to generate full app/webpage instead of code snippet
  const appCheck = checkFullAppGenerationAttempt(lowerPrompt);
  if (!appCheck.isValid) {
    return appCheck;
  }

  // 5. Detect language mismatch (Python code in JavaScript selection, etc.)
  const languageCheck = checkLanguageMismatch(prompt, selectedLanguage, platform);
  if (!languageCheck.isValid) {
    return languageCheck;
  }

  // All checks passed
  return {
    isValid: true,
    category: 'valid',
    reason: 'Valid code generation request',
    detectedLanguage: languageCheck.detectedLanguage
  };
}

/**
 * Check for security threats in code prompts
 */
function checkCodeSecurityThreats(prompt: string): CodeValidationResult {
  for (const { pattern, reason, severity } of SECURITY_PATTERNS) {
    if (pattern.test(prompt)) {
      console.warn('[CodeValidator] Security threat detected:', { reason, severity, prompt: prompt.substring(0, 50) });
      return {
        isValid: false,
        category: 'security_threat',
        reason: `🚨 ${reason}`,
        suggestion: 'This action has been logged. Repeated malicious attempts may result in account suspension.'
      };
    }
  }

  return { isValid: true, category: 'valid' };
}

/**
 * Check for unethical code generation requests
 */
function checkCodeEthicalViolations(prompt: string): CodeValidationResult {
  for (const { pattern, reason } of UNETHICAL_CODE_PATTERNS) {
    if (pattern.test(prompt)) {
      return {
        isValid: false,
        category: 'unethical',
        reason: `This request was blocked: ${reason}`,
        suggestion: 'StreamSuite can only generate ethical, legal code. Please ensure your use case complies with laws and platform terms of service.'
      };
    }
  }

  return { isValid: true, category: 'valid' };
}

/**
 * Check if user is trying to generate a full workflow instead of just code
 */
function checkWorkflowGenerationAttempt(prompt: string): CodeValidationResult {
  for (const { pattern, reason } of WORKFLOW_GENERATION_PATTERNS) {
    if (pattern.test(prompt)) {
      return {
        isValid: false,
        category: 'workflow_attempt',
        reason: `❌ ${reason} detected`,
        suggestion: 'The Custom Code Generator is for code snippets only, not full workflows.\n\n' +
                   '✅ Use this for: "Extract email from JSON response", "Format date to ISO string"\n' +
                   '❌ Not for: "Create workflow that sends emails", "Build automation with 5 nodes"\n\n' +
                   '💡 To generate full workflows, use the "Workflow Generator" tab instead.'
      };
    }
  }

  return { isValid: true, category: 'valid' };
}

/**
 * Check if user is trying to generate a full application/webpage instead of code snippet
 */
function checkFullAppGenerationAttempt(prompt: string): CodeValidationResult {
  for (const { pattern, reason } of FULL_APP_GENERATION_PATTERNS) {
    if (pattern.test(prompt)) {
      return {
        isValid: false,
        category: 'workflow_attempt',
        reason: `❌ ${reason} detected`,
        suggestion: 'The Custom Code Generator creates code snippets for workflow automation, not full applications.\n\n' +
                   '✅ Use this for: "Parse JSON and extract specific fields", "Format date string", "Calculate sum of array"\n' +
                   '❌ Not for: "Create a webpage", "Build a todo app", "Make a calculator"\n\n' +
                   '💡 This tool generates code snippets that run inside n8n/Make.com/Zapier automation workflows.'
      };
    }
  }

  return { isValid: true, category: 'valid' };
}

/**
 * Detect language in the prompt and check for mismatch
 */
function checkLanguageMismatch(
  prompt: string,
  selectedLanguage: 'javascript' | 'python',
  platform: 'n8n' | 'make' | 'zapier'
): CodeValidationResult {
  // Count Python syntax occurrences
  const pythonMatches = PYTHON_SYNTAX_PATTERNS.filter(pattern => pattern.test(prompt)).length;

  // Count JavaScript syntax occurrences
  const jsMatches = JAVASCRIPT_SYNTAX_PATTERNS.filter(pattern => pattern.test(prompt)).length;

  // Determine detected language (need at least 2 matches for confidence)
  let detectedLanguage: 'javascript' | 'python' | 'unknown' = 'unknown';
  if (pythonMatches >= 2 && pythonMatches > jsMatches) {
    detectedLanguage = 'python';
  } else if (jsMatches >= 2 && jsMatches > pythonMatches) {
    detectedLanguage = 'javascript';
  }

  // Check for Make.com + Python (not supported)
  if (platform === 'make' && selectedLanguage === 'python') {
    return {
      isValid: false,
      category: 'language_mismatch',
      reason: 'Make.com only supports JavaScript',
      suggestion: 'Please switch to JavaScript or select n8n/Zapier platform for Python code generation.'
    };
  }

  // Check for language mismatch if we detected code
  if (detectedLanguage !== 'unknown' && detectedLanguage !== selectedLanguage) {
    const detectedLangName = detectedLanguage === 'python' ? 'Python' : 'JavaScript';
    const selectedLangName = selectedLanguage === 'python' ? 'Python' : 'JavaScript';

    return {
      isValid: false,
      category: 'language_mismatch',
      reason: `Language mismatch detected`,
      suggestion: `Your prompt appears to contain ${detectedLangName} code, but you have ${selectedLangName} selected.\n\n` +
                 `Please either:\n` +
                 `• Switch to ${detectedLangName} in the language selector, or\n` +
                 `• Rewrite your prompt to describe what the code should do (instead of providing code)`
    };
  }

  return { isValid: true, category: 'valid', detectedLanguage };
}

/**
 * Get helpful examples for code generation
 */
export function getCodeExamples(platform: 'n8n' | 'make' | 'zapier', language: 'javascript' | 'python'): string[] {
  const platformName = platform === 'n8n' ? 'n8n Code node' : platform === 'make' ? 'Make.com module' : 'Zapier Code step';

  if (language === 'javascript') {
    return [
      `Extract all email addresses from a text string`,
      `Parse JSON response and return only items with status="active"`,
      `Convert date from MM/DD/YYYY to ISO 8601 format`,
      `Calculate the total price from an array of order items`,
      `Remove duplicate entries from an array of customer IDs`,
      `Format phone numbers to (XXX) XXX-XXXX format`,
    ];
  } else {
    return [
      `Extract all URLs from a text string using regex`,
      `Parse CSV data and convert to list of dictionaries`,
      `Calculate the average of numeric values in a list`,
      `Filter dictionary items where value is greater than 100`,
      `Convert timestamp to readable date format`,
      `Validate email addresses using regex pattern`,
    ];
  }
}

/**
 * Quick security check for logging purposes
 */
export function getSecurityThreatLevel(prompt: string): 'none' | 'low' | 'medium' | 'high' | 'critical' {
  for (const { pattern, severity } of SECURITY_PATTERNS) {
    if (pattern.test(prompt)) {
      return severity as 'high' | 'critical';
    }
  }

  for (const { pattern } of UNETHICAL_CODE_PATTERNS) {
    if (pattern.test(prompt)) {
      return 'high';
    }
  }

  for (const { pattern } of WORKFLOW_GENERATION_PATTERNS) {
    if (pattern.test(prompt)) {
      return 'low';
    }
  }

  return 'none';
}
