/**
 * JSON Sanitization & Validation
 * Prevents malicious JSON uploads (DoS, XSS, injection attacks)
 */

export interface SanitizationOptions {
  maxSize?: number; // Max file size in bytes (default: 5MB)
  maxDepth?: number; // Max object nesting depth (default: 10)
  maxKeys?: number; // Max keys in workflow (default: 10000)
  maxArrayLength?: number; // Max array length (default: 1000)
  allowedFields?: string[]; // Whitelist of allowed top-level fields
}

const DEFAULT_OPTIONS: SanitizationOptions = {
  maxSize: 5 * 1024 * 1024, // 5MB
  maxDepth: 10,
  maxKeys: 10000,
  maxArrayLength: 1000,
  allowedFields: ['name', 'nodes', 'connections', 'settings', 'staticData', 'pinData', 'versionId', 'meta']
};

export interface SanitizationResult {
  valid: boolean;
  sanitized?: any;
  error?: string;
  warnings?: string[];
  threat?: {
    type: 'xss' | 'dos' | 'injection' | 'oversized' | 'malformed';
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: string;
  };
}

/**
 * Main sanitization function
 * Validates and sanitizes workflow JSON to prevent attacks
 */
export function sanitizeWorkflowJson(
  jsonString: string,
  options: SanitizationOptions = {}
): SanitizationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const warnings: string[] = [];

  // 1. Check size (prevent DoS via large files)
  if (jsonString.length > opts.maxSize!) {
    return {
      valid: false,
      error: `File too large (${(jsonString.length / 1024 / 1024).toFixed(2)}MB). Maximum allowed: ${opts.maxSize! / 1024 / 1024}MB`,
      threat: {
        type: 'dos',
        severity: 'high',
        details: `Attempted upload of ${(jsonString.length / 1024 / 1024).toFixed(2)}MB file (limit: ${opts.maxSize! / 1024 / 1024}MB)`
      }
    };
  }

  // 2. Parse JSON safely
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return {
      valid: false,
      error: 'Invalid JSON syntax',
      threat: {
        type: 'malformed',
        severity: 'low',
        details: `JSON parse error: ${e instanceof Error ? e.message : 'Unknown error'}`
      }
    };
  }

  // 3. Check depth (prevent stack overflow)
  const depth = getObjectDepth(parsed);
  if (depth > opts.maxDepth!) {
    return {
      valid: false,
      error: `Object too deeply nested (${depth} levels). Maximum allowed: ${opts.maxDepth}`,
      threat: {
        type: 'dos',
        severity: 'critical',
        details: `Deeply nested object attack detected (${depth} levels)`
      }
    };
  }

  if (depth > opts.maxDepth! * 0.7) {
    warnings.push(`Deep nesting detected (${depth} levels)`);
  }

  // 4. Count keys (prevent DoS via excessive keys)
  const keyCount = countKeys(parsed);
  if (keyCount > opts.maxKeys!) {
    return {
      valid: false,
      error: `Too many keys (${keyCount}). Maximum allowed: ${opts.maxKeys}`,
      threat: {
        type: 'dos',
        severity: 'high',
        details: `Excessive key count attack detected (${keyCount} keys)`
      }
    };
  }

  if (keyCount > opts.maxKeys! * 0.7) {
    warnings.push(`Large number of keys (${keyCount})`);
  }

  // 5. Check array lengths (prevent memory exhaustion)
  const arrayCheck = checkArrayLengths(parsed, opts.maxArrayLength!);
  if (!arrayCheck.valid) {
    return {
      valid: false,
      error: arrayCheck.error,
      threat: {
        type: 'dos',
        severity: 'high',
        details: `Excessive array length attack detected (${arrayCheck.maxFound} items)`
      }
    };
  }

  // 6. Detect XSS attempts
  const xssDetection = detectXSS(parsed);
  if (xssDetection.detected) {
    return {
      valid: false,
      error: 'Potential XSS attack detected in workflow content',
      threat: {
        type: 'xss',
        severity: 'critical',
        details: `XSS payload detected: ${xssDetection.examples.join(', ')}`
      }
    };
  }

  // 7. Detect prompt injection attempts
  const injectionDetection = detectPromptInjection(parsed);
  if (injectionDetection.detected) {
    warnings.push(`Potential AI prompt injection detected in: ${injectionDetection.locations.join(', ')}`);
  }

  // 8. Sanitize strings (escape HTML entities)
  const sanitized = sanitizeStrings(parsed);

  // 9. Validate required workflow fields
  const validationResult = validateWorkflowStructure(sanitized);
  if (!validationResult.valid) {
    return {
      valid: false,
      error: validationResult.error,
      warnings
    };
  }

  // 10. Remove suspicious fields
  const cleaned = removeSuspiciousFields(sanitized);

  return {
    valid: true,
    sanitized: cleaned,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Get maximum depth of nested objects
 */
function getObjectDepth(obj: any, current = 0): number {
  if (typeof obj !== 'object' || obj === null) return current;
  if (current > 50) return current; // Hard limit to prevent infinite recursion

  const depths = Object.values(obj).map(v => getObjectDepth(v, current + 1));
  return Math.max(current, ...depths);
}

/**
 * Count total number of keys in object tree
 */
function countKeys(obj: any): number {
  if (typeof obj !== 'object' || obj === null) return 0;

  let count = Object.keys(obj).length;
  for (const value of Object.values(obj)) {
    count += countKeys(value);
  }
  return count;
}

/**
 * Check array lengths recursively
 */
function checkArrayLengths(
  obj: any,
  maxLength: number,
  path = 'root'
): { valid: boolean; error?: string; maxFound?: number } {
  if (Array.isArray(obj)) {
    if (obj.length > maxLength) {
      return {
        valid: false,
        error: `Array at ${path} has ${obj.length} items (max: ${maxLength})`,
        maxFound: obj.length
      };
    }

    for (let i = 0; i < obj.length; i++) {
      const result = checkArrayLengths(obj[i], maxLength, `${path}[${i}]`);
      if (!result.valid) return result;
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      const result = checkArrayLengths(value, maxLength, `${path}.${key}`);
      if (!result.valid) return result;
    }
  }

  return { valid: true };
}

/**
 * Detect XSS attempts in strings
 */
function detectXSS(obj: any): { detected: boolean; examples: string[] } {
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>/gi,
    /javascript:/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi, // onerror, onclick, etc.
    /<img[\s\S]*?onerror/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
    /<embed[\s\S]*?>/gi,
    /<object[\s\S]*?>/gi
  ];

  const examples: string[] = [];

  function checkString(str: string): boolean {
    for (const pattern of xssPatterns) {
      if (pattern.test(str)) {
        const match = str.match(pattern);
        if (match) {
          examples.push(match[0].substring(0, 50));
        }
        return true;
      }
    }
    return false;
  }

  function scan(value: any): boolean {
    if (typeof value === 'string') {
      return checkString(value);
    }
    if (Array.isArray(value)) {
      return value.some(scan);
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(scan);
    }
    return false;
  }

  return {
    detected: scan(obj),
    examples: [...new Set(examples)].slice(0, 3) // Dedupe and limit to 3 examples
  };
}

/**
 * Detect AI prompt injection attempts
 */
function detectPromptInjection(obj: any): { detected: boolean; locations: string[] } {
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/gi,
    /disregard\s+(all\s+)?prior\s+(instructions|prompts)/gi,
    /you\s+are\s+now\s+(a|an)\s+\w+/gi, // "you are now a DAN"
    /forget\s+everything/gi,
    /new\s+instructions?:/gi,
    /system\s+prompt\s+override/gi,
    /\[INST\]/gi, // Common prompt injection markers
    /\<\|im_start\|\>/gi
  ];

  const locations: string[] = [];

  function checkString(str: string, path: string): boolean {
    for (const pattern of injectionPatterns) {
      if (pattern.test(str)) {
        locations.push(path);
        return true;
      }
    }
    return false;
  }

  function scan(value: any, path = 'root'): boolean {
    if (typeof value === 'string') {
      return checkString(value, path);
    }
    if (Array.isArray(value)) {
      return value.some((item, i) => scan(item, `${path}[${i}]`));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.entries(value).some(([key, val]) =>
        scan(val, `${path}.${key}`)
      );
    }
    return false;
  }

  scan(obj);

  return {
    detected: locations.length > 0,
    locations: [...new Set(locations)].slice(0, 5)
  };
}

/**
 * Sanitize all strings in object (escape HTML entities)
 */
function sanitizeStrings(obj: any): any {
  if (typeof obj === 'string') {
    return escapeHtml(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeStrings);
  }
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Also sanitize keys
      const sanitizedKey = escapeHtml(key);
      sanitized[sanitizedKey] = sanitizeStrings(value);
    }
    return sanitized;
  }
  return obj;
}

/**
 * Escape HTML entities
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate workflow structure
 */
function validateWorkflowStructure(workflow: any): { valid: boolean; error?: string } {
  if (typeof workflow !== 'object' || workflow === null) {
    return { valid: false, error: 'Workflow must be an object' };
  }

  if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
    return { valid: false, error: 'Missing or invalid "nodes" array' };
  }

  if (!workflow.connections || typeof workflow.connections !== 'object') {
    return { valid: false, error: 'Missing or invalid "connections" object' };
  }

  // Validate nodes structure
  for (let i = 0; i < workflow.nodes.length; i++) {
    const node = workflow.nodes[i];
    if (typeof node !== 'object' || !node.id || !node.type) {
      return {
        valid: false,
        error: `Invalid node at index ${i} (missing id or type)`
      };
    }
  }

  return { valid: true };
}

/**
 * Remove suspicious or unnecessary fields
 */
function removeSuspiciousFields(obj: any): any {
  const suspiciousFields = [
    '__proto__',
    'constructor',
    'prototype',
    'eval',
    'Function',
    'setTimeout',
    'setInterval'
  ];

  if (Array.isArray(obj)) {
    return obj.map(removeSuspiciousFields);
  }

  if (typeof obj === 'object' && obj !== null) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!suspiciousFields.includes(key)) {
        cleaned[key] = removeSuspiciousFields(value);
      }
    }
    return cleaned;
  }

  return obj;
}

/**
 * Quick validation (for client-side checks before upload)
 */
export function quickValidate(jsonString: string): { valid: boolean; error?: string } {
  // Check size
  if (jsonString.length > 5 * 1024 * 1024) {
    return { valid: false, error: 'File too large (max 5MB)' };
  }

  // Check if valid JSON
  try {
    JSON.parse(jsonString);
  } catch (e) {
    return { valid: false, error: 'Invalid JSON' };
  }

  return { valid: true };
}
