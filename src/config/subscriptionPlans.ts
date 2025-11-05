/**
 * Subscription Plans Configuration
 *
 * Define all subscription tiers and their benefits
 */

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  price: {
    monthly: number;
    yearly: number;
  };
  credits: {
    monthly: number;
    rolloverMax: number;
  };
  batchCredits?: {
    monthly: number;
    maxWorkflowsPerSet: number;
  };
  features: string[]; // Current available features
  comingSoonFeatures?: string[]; // Features in development
  allowedFeatures: string[];
  stripePriceId?: {
    monthly: string;
    yearly: string;
  };
  seatAddOn?: {
    pricePerSeat: {
      monthly: number;
      yearly: number;
    };
    creditsPerSeat: number;
    minSeats: number;
    maxSeats: number;
  };
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'free',
    displayName: 'Free',
    price: {
      monthly: 0,
      yearly: 0
    },
    credits: {
      monthly: 5,
      rolloverMax: 0
    },
    features: [
      '5 credits per month',
      'n8n workflow generation',
      'Download workflow JSON',
      'Community support'
    ],
    allowedFeatures: ['workflow_generation']
  },

  starter: {
    id: 'starter',
    name: 'starter',
    displayName: 'Starter',
    price: {
      monthly: 19,
      yearly: 180 // $15/month when billed yearly (save $48/year = 21% off)
    },
    credits: {
      monthly: 25,
      rolloverMax: 0
    },
    features: [
      '25 credits per month',
      'Everything in Free',
      'n8n Code Generator',
      'Save to History (manual)',
      'Access to 3 default templates',
      'Basic email support'
    ],
    allowedFeatures: ['workflow_generation', 'code_generation', 'history', 'templates_limited'],
    stripePriceId: {
      monthly: 'price_starter_monthly',
      yearly: 'price_starter_yearly'
    }
  },

  pro: {
    id: 'pro',
    name: 'pro',
    displayName: 'Pro',
    price: {
      monthly: 49,
      yearly: 470 // ~$39/month when billed yearly (save $118/year = 20% off)
    },
    credits: {
      monthly: 100,
      rolloverMax: 0
    },
    features: [
      '100 credits per month',
      'Everything in Starter',
      'Auto-save to History',
      'AI debugging & error fixes',
      'Push workflows directly to n8n',
      'ALL default templates (full library)',
      'Save unlimited custom templates',
      'Template folders & organization',
      'API access (programmatic generation)',
      'Priority email support'
    ],
    comingSoonFeatures: [
      'Workflow conversion (n8n ↔ Make ↔ Zapier)'
    ],
    allowedFeatures: ['workflow_generation', 'code_generation', 'workflow_conversion', 'workflow_debugging', 'templates', 'history', 'history_auto_save', 'template_folders', 'api_access', 'n8n_push'],
    stripePriceId: {
      monthly: 'price_pro_monthly',
      yearly: 'price_pro_yearly'
    }
  },

  growth: {
    id: 'growth',
    name: 'growth',
    displayName: 'Growth',
    price: {
      monthly: 99,
      yearly: 950 // ~$79/month when billed yearly (save $238/year = 20% off)
    },
    credits: {
      monthly: 250,
      rolloverMax: 0
    },
    batchCredits: {
      monthly: 10,
      maxWorkflowsPerSet: 5
    },
    features: [
      '250 credits per month',
      '10 batch credits per month',
      'Everything in Pro',
      'Auto-save to History',
      'Monitor workflow executions in n8n',
      'View last 20 executions with status',
      'Manual retry for failed workflows',
      'Batch workflow generation (up to 5 per set)',
      'Export workflow sets as packages',
      'Shared context optimization',
      'Priority email support'
    ],
    comingSoonFeatures: [
      'Workflow Set Marketplace (publish your sets)',
      'Advanced export options'
    ],
    allowedFeatures: ['workflow_generation', 'code_generation', 'workflow_conversion', 'workflow_debugging', 'templates', 'history', 'history_auto_save', 'template_folders', 'api_access', 'batch_operations', 'workflow_sets', 'advanced_export', 'n8n_push', 'n8n_monitoring'],
    stripePriceId: {
      monthly: 'price_growth_monthly',
      yearly: 'price_growth_yearly'
    }
  },

  agency: {
    id: 'agency',
    name: 'agency',
    displayName: 'Agency',
    price: {
      monthly: 499, // Base price includes 2 seats
      yearly: 4790 // ~$399/month when billed yearly (save ~$1198/year = 20% off)
    },
    credits: {
      monthly: 750,
      rolloverMax: 0
    },
    batchCredits: {
      monthly: 50,
      maxWorkflowsPerSet: 5
    },
    features: [
      '750 credits per month (shared pool)',
      '50 batch credits per month',
      'Everything in Growth',
      'Auto-save to History',
      'Batch workflow generation (up to 10 per set)',
      '2 team seats included',
      'Dedicated account manager'
    ],
    comingSoonFeatures: [
      'Agency Dashboard (client management)',
      'Client workspaces & projects',
      'Admin credit delegation',
      'Usage analytics & reporting per user',
      'Custom branding on exports',
      'Priority processing queue'
    ],
    allowedFeatures: ['workflow_generation', 'code_generation', 'workflow_conversion', 'workflow_debugging', 'templates', 'history', 'history_auto_save', 'template_folders', 'api_access', 'batch_operations', 'workflow_sets', 'advanced_export', 'agency_dashboard', 'team_access', 'client_workspaces', 'usage_analytics', 'custom_branding', 'priority_queue', 'credit_delegation', 'n8n_push', 'n8n_monitoring'],
    stripePriceId: {
      monthly: 'price_agency_monthly',
      yearly: 'price_agency_yearly'
    }
  }
};

/**
 * Get plan details by tier name
 */
export function getPlanByTier(tier: string): SubscriptionPlan {
  return SUBSCRIPTION_PLANS[tier] || SUBSCRIPTION_PLANS.free;
}

/**
 * Check if user can access a feature based on plan
 */
export function canAccessFeature(userTier: string, feature: string): boolean {
  const plan = getPlanByTier(userTier);
  return plan.allowedFeatures.includes(feature);
}

/**
 * Get upgrade message for a feature
 */
export function getUpgradeMessage(userTier: string, feature: string): string {
  const messages: Record<string, Record<string, string>> = {
    free: {
      code_generation: 'Upgrade to Starter to unlock the custom code generator',
      history: 'Upgrade to Starter to save and access your workflow history',
      templates_limited: 'Upgrade to Starter to access default templates',
      workflow_conversion: 'Upgrade to Pro to unlock workflow conversion between platforms',
      workflow_debugging: 'Upgrade to Pro to unlock AI-powered debugging',
      templates: 'Upgrade to Pro to access all default templates and save unlimited custom templates',
      template_folders: 'Upgrade to Pro to organize templates with folders',
      api_access: 'Upgrade to Pro for API access and programmatic generation',
      batch_operations: 'Upgrade to Growth for batch operations and workflow sets',
      workflow_sets: 'Upgrade to Growth to generate complete workflow orchestration sets',
      advanced_export: 'Upgrade to Growth for advanced export options',
      agency_dashboard: 'Upgrade to Agency for client management dashboard',
      team_access: 'Upgrade to Agency for multi-user team access',
      client_workspaces: 'Upgrade to Agency for client workspaces',
      usage_analytics: 'Upgrade to Agency for usage analytics',
      custom_branding: 'Upgrade to Agency for custom branding',
      priority_queue: 'Upgrade to Agency for priority processing'
    },
    starter: {
      workflow_conversion: 'Upgrade to Pro to unlock workflow conversion between platforms',
      workflow_debugging: 'Upgrade to Pro to unlock AI-powered debugging',
      api_access: 'Upgrade to Pro for API access and programmatic generation',
      templates: 'Upgrade to Pro to access all templates and save unlimited custom templates',
      template_folders: 'Upgrade to Pro to organize templates with folders',
      batch_operations: 'Upgrade to Growth for batch operations and workflow sets',
      workflow_sets: 'Upgrade to Growth to generate complete workflow orchestration sets',
      advanced_export: 'Upgrade to Growth for advanced export options',
      agency_dashboard: 'Upgrade to Agency for client management dashboard',
      team_access: 'Upgrade to Agency for multi-user team access'
    },
    pro: {
      batch_operations: 'Upgrade to Growth for batch operations and workflow sets',
      workflow_sets: 'Upgrade to Growth to generate complete workflow orchestration sets',
      advanced_export: 'Upgrade to Growth for advanced export options',
      agency_dashboard: 'Upgrade to Agency for client management dashboard',
      team_access: 'Upgrade to Agency for multi-user team access',
      client_workspaces: 'Upgrade to Agency for client workspaces'
    },
    growth: {
      agency_dashboard: 'Upgrade to Agency for client management dashboard',
      team_access: 'Upgrade to Agency for multi-user team access',
      client_workspaces: 'Upgrade to Agency for client workspaces',
      usage_analytics: 'Upgrade to Agency for usage analytics',
      custom_branding: 'Upgrade to Agency for custom branding',
      priority_queue: 'Upgrade to Agency for priority processing'
    }
  };

  return messages[userTier]?.[feature] || 'Upgrade to access this feature';
}

/**
 * Get minimum required plan for a feature
 */
export function getMinimumPlanForFeature(feature: string): SubscriptionPlan {
  // Check plans in order: free -> starter -> pro -> growth -> agency
  const planOrder: ('free' | 'starter' | 'pro' | 'growth' | 'agency')[] = ['free', 'starter', 'pro', 'growth', 'agency'];

  for (const tierName of planOrder) {
    const plan = SUBSCRIPTION_PLANS[tierName];
    if (plan.allowedFeatures.includes(feature)) {
      return plan;
    }
  }

  // Default to starter if feature not found
  return SUBSCRIPTION_PLANS.starter;
}

/**
 * Get monthly credit allocation for a tier
 */
export function getMonthlyCredits(tier: string): number {
  const plan = getPlanByTier(tier);
  return plan.credits.monthly;
}

/**
 * Get max rollover credits for a tier
 */
export function getMaxRollover(tier: string): number {
  const plan = getPlanByTier(tier);
  return plan.credits.rolloverMax;
}

/**
 * Get monthly batch credits for a tier
 */
export function getMonthlyBatchCredits(tier: string): number {
  const plan = getPlanByTier(tier);
  return plan.batchCredits?.monthly || 0;
}

/**
 * Get max workflows per batch set for a tier
 */
export function getMaxWorkflowsPerSet(tier: string): number {
  const plan = getPlanByTier(tier);
  return plan.batchCredits?.maxWorkflowsPerSet || 0;
}

/**
 * Check if user has batch credits access
 */
export function hasBatchCreditsAccess(tier: string): boolean {
  const plan = getPlanByTier(tier);
  return !!plan.batchCredits && plan.batchCredits.monthly > 0;
}

/**
 * Check if user has auto-save to history enabled (Pro, Growth, Agency)
 */
export function hasAutoSaveHistory(tier: string): boolean {
  return canAccessFeature(tier, 'history_auto_save');
}
