/**
 * Advanced n8n Workflow Patterns and Error Handling
 */

export const N8N_WORKFLOW_PATTERNS = {
  // Common workflow patterns
  simpleAutomation: {
    description: 'Trigger → Transform → Action pattern',
    structure: ['Trigger Node', 'Data Processing', 'Action Node'],
    example: 'Webhook → Set Values → Send Slack Message'
  },
  
  conditionalBranching: {
    description: 'Different actions based on conditions',
    structure: ['Trigger', 'IF/Switch Node', 'Multiple Action Branches'],
    example: 'Form Submit → Check Priority → High: Email + Slack, Low: Email Only'
  },
  
  dataCollection: {
    description: 'Gather data from multiple sources',
    structure: ['Multiple Triggers/HTTP Requests', 'Merge Node', 'Processing'],
    example: 'API Call 1 + API Call 2 → Merge → Transform → Store'
  },
  
  loopProcessing: {
    description: 'Process items in batches or loops',
    structure: ['Data Source', 'Loop Over Items', 'Batch Processing', 'Aggregation'],
    example: 'Get Users → Loop → Process Each → Send Summary'
  },
  
  webhookToAction: {
    description: 'Respond to external webhook events',
    structure: ['Webhook Trigger', 'Validation', 'Processing', 'Response'],
    example: 'GitHub Webhook → Validate → Deploy → Notify Team'
  },
  
  scheduledReports: {
    description: 'Generate and send regular reports',
    structure: ['Schedule Trigger', 'Data Collection', 'Report Generation', 'Distribution'],
    example: 'Daily 9AM → Fetch Analytics → Create Report → Email Team'
  },
  
  errorHandlingPattern: {
    description: 'Robust error handling and recovery',
    structure: ['Try Block', 'Error Handling', 'Retry Logic', 'Fallback Action'],
    example: 'API Call → On Error: Log + Retry → Final Fallback'
  },
  
  approvalWorkflow: {
    description: 'Human approval in automated processes',
    structure: ['Trigger', 'Pre-processing', 'Wait for Approval', 'Conditional Action'],
    example: 'Expense Request → Format → Wait Approval → Approve/Reject Actions'
  },
} as const;

export const N8N_ERROR_HANDLING = {
  nodeLevel: {
    description: 'Error handling at individual node level',
    options: {
      stopWorkflow: 'Stop the entire workflow execution on error',
      continueRegularOutput: 'Continue workflow but mark node as failed',
      continueErrorOutput: 'Continue workflow using error output path',
    },
    retrySettings: {
      retryOnFail: 'Enable automatic retries on failure',
      maxTries: 'Maximum number of retry attempts (1-5)',
      waitBetweenTries: 'Delay between retries in milliseconds',
    },
  },
  
  workflowLevel: {
    description: 'Global error handling for entire workflow',
    errorWorkflow: 'Specify a separate workflow to handle errors',
    saveDataErrorExecution: 'Whether to save data when execution fails',
    settings: {
      executionTimeout: 'Maximum time workflow can run (seconds)',
      saveManualExecutions: 'Save data from manual executions',
    },
  },
  
  commonPatterns: {
    tryPattern: {
      description: 'Try-catch pattern using node error handling',
      implementation: 'Set node to "Continue on Error" → Check for errors in next node',
      example: 'HTTP Request (continue on error) → IF (check for error) → Handle Error/Success'
    },
    
    gracefulDegradation: {
      description: 'Provide fallback when primary action fails',
      implementation: 'Primary action → On error: Secondary action → Final fallback',
      example: 'Send Slack → On error: Send Email → On error: Log to Database'
    },
    
    retryWithBackoff: {
      description: 'Intelligent retry with increasing delays',
      implementation: 'Enable retry on node + Use expressions for dynamic delays',
      example: 'API Call with retry: 1s, 5s, 30s delays'
    },
    
    circuitBreaker: {
      description: 'Stop retrying after too many failures',
      implementation: 'Track failure count → Stop after threshold',
      example: 'Count failures in static data → Skip processing if > 5 failures'
    },
  },
  
  errorExpressions: {
    hasError: '{{ $json.error !== undefined }}',
    errorMessage: '{{ $json.error?.message || "Unknown error occurred" }}',
    isHttpError: '{{ $statusCode >= 400 }}',
    isTimeout: '{{ $json.error?.code === "ETIMEDOUT" }}',
    isNetworkError: '{{ $json.error?.code === "ENOTFOUND" }}',
    retryCount: '{{ $runIndex }}',
    shouldRetry: '{{ $runIndex < 3 && $json.error?.retryable !== false }}',
  },
  
  loggingPatterns: {
    errorToSlack: 'Send error details to monitoring channel',
    errorToDatabase: 'Log error with context for analysis',
    errorToEmail: 'Email admin with error details',
    errorToWebhook: 'Send to external monitoring service',
  },
} as const;

export const N8N_ADVANCED_PATTERNS = {
  subworkflowComposition: {
    description: 'Breaking complex workflows into reusable components',
    mainWorkflow: 'Orchestrates overall process',
    subworkflows: 'Handle specific tasks (authentication, data processing, notifications)',
    benefits: ['Reusability', 'Maintainability', 'Parallel execution', 'Error isolation'],
    example: {
      main: 'Process Order → [Execute: Validate Payment] → [Execute: Update Inventory] → [Execute: Send Confirmation]',
      subs: ['Payment Validation Workflow', 'Inventory Management Workflow', 'Notification Workflow']
    }
  },
  
  parameterizedWorkflows: {
    description: 'Workflows that accept dynamic parameters',
    techniques: [
      'Webhook with query parameters',
      'Manual trigger with form inputs',
      'Static data for configuration',
      'Environment variables for settings'
    ],
    example: 'Webhook receives: { "action": "process_order", "priority": "high", "customer_id": "123" }'
  },
  
  eventDrivenArchitecture: {
    description: 'Workflows triggered by events from other workflows',
    pattern: 'Producer Workflow → Event/Webhook → Consumer Workflows',
    useCases: [
      'Order processing triggers inventory and shipping workflows',
      'User registration triggers welcome email and account setup',
      'File upload triggers processing and analysis workflows'
    ]
  },
  
  dataTransformationPipelines: {
    description: 'Multi-stage data processing workflows',
    stages: ['Extract', 'Transform', 'Validate', 'Enrich', 'Load'],
    nodes: ['HTTP Request/Database', 'Function/Set nodes', 'IF/Filter nodes', 'API enrichment', 'Database/API storage'],
    example: 'CSV Upload → Parse → Validate emails → Enrich with company data → Store in CRM'
  },
} as const;