/**
 * Make.com Module Validation
 * Validates module names and provides suggestions for correct usage
 */

export const VERIFIED_MODULE_NAMES = {
  // Built-in modules (verified from working blueprints)
  builtin: {
    "webhook": "Webhook trigger/receiver",
    "builtin:iterator": "Process arrays item by item", 
    "builtin:aggregator": "Combine multiple bundles into arrays",
    "builtin:BasicRouter": "Split workflow into multiple paths",
    "builtin:filter": "Control data flow with conditions",
    "builtin:sleep": "Add delays between operations",
    "builtin:set-variables": "Set and store variables",
    "builtin:break": "Stop scenario execution"
  },

  // AI & ML modules
  ai: {
    "openai-gpt-3": "OpenAI (ChatGPT, Whisper, DALL-E) - CORRECT",
    "anthropic-claude": "Anthropic Claude AI"
  },

  // Communication modules  
  communication: {
    "email": "Email sending and processing",
    "slack": "Slack messaging",
    "microsoft-teams": "Microsoft Teams",
    "aws-ses": "AWS Simple Email Service"
  },

  // Social media modules
  social: {
    "facebook-pages-2": "Facebook Pages (v2) - CORRECT",
    "instagram-business": "Instagram Business",
    "linkedin": "LinkedIn",
    "twitter": "Twitter/X"
  },

  // Productivity modules
  productivity: {
    "google-sheets": "Google Sheets",
    "google-calendar": "Google Calendar", 
    "notion": "Notion",
    "airtable": "Airtable"
  },

  // Data processing
  data: {
    "http": "HTTP requests",
    "json": "JSON processing",
    "text-parser": "Text parsing"
  }
};

export const COMMON_MODULE_MISTAKES = {
  // Common incorrect names and their corrections
  "openai": "openai-gpt-3",
  "facebook-pages": "facebook-pages-2", 
  "builtin:Router": "builtin:BasicRouter",
  "builtin:BasicIterator": "builtin:iterator",
  "builtin:BasicAggregator": "builtin:aggregator",
  "builtin:Filter": "builtin:filter",
  "builtin:Sleep": "builtin:sleep",
  "json:ParseJSON": "json",
  "notion:SearchDatabaseItems": "notion",
  "aws:SES:SendEmail": "aws-ses"
};

export const MODULE_VALIDATION_NOTES = [
  "🔥 CRITICAL: Always use exact module names as they appear in working Make.com blueprints",
  "⚠️ Version numbers matter: Use 'facebook-pages-2' not 'facebook-pages'", 
  "🛠️ Built-in modules: Use lowercase for most (builtin:iterator, builtin:filter, builtin:sleep)",
  "📝 Exception: builtin:BasicRouter (not builtin:router)",
  "🤖 AI modules: Use 'openai-gpt-3' not 'openai'",
  "✅ Test module names: Import blueprint to Make.com to verify module names work"
];

/**
 * Validates a module name and suggests corrections
 */
export function validateModuleName(moduleName: string): {
  isValid: boolean;
  suggestion?: string;
  category?: string;
} {
  // Check if module name exists in verified list
  for (const [category, modules] of Object.entries(VERIFIED_MODULE_NAMES)) {
    if (Object.keys(modules).includes(moduleName)) {
      return { isValid: true, category };
    }
  }

  // Check for common mistakes
  const correction = COMMON_MODULE_MISTAKES[moduleName];
  if (correction) {
    return { 
      isValid: false, 
      suggestion: correction,
      category: "common_mistake"
    };
  }

  return { isValid: false };
}

/**
 * Get all verified module names for a category
 */
export function getModulesByCategory(category: keyof typeof VERIFIED_MODULE_NAMES): string[] {
  return Object.keys(VERIFIED_MODULE_NAMES[category] || {});
}

/**
 * Search for modules by keyword
 */
export function searchModules(keyword: string): Array<{name: string, description: string, category: string}> {
  const results: Array<{name: string, description: string, category: string}> = [];
  
  for (const [category, modules] of Object.entries(VERIFIED_MODULE_NAMES)) {
    for (const [name, description] of Object.entries(modules)) {
      if (name.toLowerCase().includes(keyword.toLowerCase()) || 
          description.toLowerCase().includes(keyword.toLowerCase())) {
        results.push({ name, description, category });
      }
    }
  }
  
  return results;
}