/**
 * Subworkflows & Composition Patterns
 */

export const N8N_SUBWORKFLOWS_COMPOSITION = {
  description: 'Advanced patterns for building modular, reusable workflows through composition',

  // Core composition concepts
  compositionConcepts: {
    modularDesign: {
      description: 'Break complex workflows into smaller, focused components',
      benefits: [
        'Improved maintainability and debugging',
        'Reusability across multiple parent workflows', 
        'Parallel development and testing',
        'Error isolation and recovery'
      ],
      principles: [
        'Single Responsibility: Each sub-workflow has one clear purpose',
        'Loose Coupling: Minimal dependencies between components',
        'High Cohesion: Related functionality grouped together',
        'Clear Interfaces: Well-defined inputs and outputs'
      ]
    },

    dataFlow: {
      description: 'How data flows between parent and sub-workflows',
      patterns: [
        'Input Mapping: Parent data to sub-workflow parameters',
        'Output Processing: Sub-workflow results back to parent',
        'Context Preservation: Maintaining execution context',
        'Error Propagation: How errors flow between workflows'
      ],
      considerations: [
        'Data transformation and validation',
        'Memory usage with large datasets',
        'Performance impact of data serialization',
        'Security and data privacy'
      ]
    }
  },

  // Sub-workflow execution patterns  
  executionPatterns: {
    sequential: {
      description: 'Execute sub-workflows one after another',
      useCase: 'Pipeline processing where each stage depends on the previous',
      implementation: `// Sequential sub-workflow execution
{
  "workflow": "Data Processing Pipeline",
  "pattern": "sequential",
  "stages": [
    {
      "name": "Data Validation",
      "subworkflow": "validate-input-data",
      "waitForCompletion": true,
      "inputs": {
        "data": "={{ $json.rawData }}",
        "schema": "{{ $json.validationSchema }}"
      }
    },
    {
      "name": "Data Transformation", 
      "subworkflow": "transform-data",
      "waitForCompletion": true,
      "inputs": {
        "data": "={{ $node['Data Validation'].json.validData }}",
        "rules": "{{ $json.transformationRules }}"
      }
    },
    {
      "name": "Data Storage",
      "subworkflow": "store-processed-data",
      "waitForCompletion": true,
      "inputs": {
        "data": "={{ $node['Data Transformation'].json.transformedData }}",
        "destination": "{{ $json.storageConfig }}"
      }
    }
  ]
}`,
      errorHandling: 'If any stage fails, the entire pipeline stops and can rollback previous stages'
    },

    parallel: {
      description: 'Execute multiple sub-workflows simultaneously',
      useCase: 'Independent operations that can run concurrently',
      implementation: `// Parallel sub-workflow execution
{
  "workflow": "Multi-Channel Notification",
  "pattern": "parallel",
  "subworkflows": [
    {
      "name": "Email Notification",
      "subworkflow": "send-email-notification",
      "inputs": {
        "recipients": "={{ $json.emailRecipients }}",
        "template": "{{ $json.emailTemplate }}",
        "data": "={{ $json.notificationData }}"
      }
    },
    {
      "name": "SMS Notification", 
      "subworkflow": "send-sms-notification",
      "inputs": {
        "recipients": "={{ $json.smsRecipients }}",
        "message": "{{ $json.smsMessage }}"
      }
    },
    {
      "name": "Slack Notification",
      "subworkflow": "send-slack-notification", 
      "inputs": {
        "channel": "{{ $json.slackChannel }}",
        "message": "{{ $json.slackMessage }}"
      }
    }
  ],
  "waitForAll": false,
  "continueOnPartialFailure": true
}`,
      errorHandling: 'Individual failures don\'t stop other parallel executions'
    },

    conditional: {
      description: 'Execute different sub-workflows based on conditions',
      useCase: 'Dynamic routing based on data content or business rules',
      implementation: `// Conditional sub-workflow execution
{
  "workflow": "Order Processing Router",
  "pattern": "conditional",
  "routing": {
    "highValue": {
      "condition": "{{ $json.orderTotal > 10000 }}",
      "subworkflow": "high-value-order-processing",
      "inputs": {
        "order": "={{ $json }}",
        "approvalRequired": true,
        "priorityLevel": "high"
      }
    },
    "standardOrder": {
      "condition": "{{ $json.orderTotal <= 10000 && $json.orderTotal > 100 }}",
      "subworkflow": "standard-order-processing",
      "inputs": {
        "order": "={{ $json }}",
        "fastTrack": true
      }
    },
    "smallOrder": {
      "condition": "{{ $json.orderTotal <= 100 }}",
      "subworkflow": "simple-order-processing",
      "inputs": {
        "order": "={{ $json }}",
        "autoApprove": true
      }
    }
  },
  "fallback": {
    "subworkflow": "order-processing-error-handler",
    "condition": "no-match"
  }
}`
    },

    fanOutFanIn: {
      description: 'Split data to multiple sub-workflows, then combine results',
      useCase: 'Process data chunks in parallel, then aggregate results',
      implementation: `// Fan-out/Fan-in pattern
{
  "workflow": "Parallel Data Processing",
  "pattern": "fan-out-fan-in",
  "fanOut": {
    "splitStrategy": "chunk",
    "chunkSize": 100,
    "maxParallelJobs": 5,
    "subworkflow": "process-data-chunk",
    "inputs": {
      "dataChunk": "={{ $json.chunk }}",
      "processingConfig": "={{ $json.config }}"
    }
  },
  "fanIn": {
    "aggregationStrategy": "merge",
    "waitForAll": true,
    "timeoutMinutes": 30,
    "combineResults": true,
    "errorStrategy": "partial-success"
  }
}`,
      benefits: [
        'Improved processing speed through parallelization',
        'Better resource utilization',
        'Fault tolerance through partial success handling',
        'Scalable processing of large datasets'
      ]
    }
  },

  // Advanced composition techniques
  advancedComposition: {
    dynamicWorkflowSelection: {
      description: 'Select and execute workflows dynamically at runtime',
      implementation: `// Dynamic workflow selection based on conditions
const selectWorkflow = (data, context) => {
  const workflowMap = {
    'user-signup': {
      workflowId: 'user-onboarding-workflow',
      requiredFields: ['email', 'name'],
      validation: 'user-validation-schema'
    },
    'order-processing': {
      workflowId: 'order-fulfillment-workflow', 
      requiredFields: ['items', 'payment'],
      validation: 'order-validation-schema'
    },
    'data-import': {
      workflowId: 'data-processing-workflow',
      requiredFields: ['source', 'format'],
      validation: 'import-validation-schema'
    }
  };
  
  const workflowType = determineWorkflowType(data);
  const workflow = workflowMap[workflowType];
  
  if (!workflow) {
    throw new Error(\`Unknown workflow type: \${workflowType}\`);
  }
  
  return workflow;
};`,
      benefits: [
        'Flexible workflow execution based on runtime conditions',
        'Reduced complexity in main workflow logic',
        'Easy addition of new workflow types',
        'Better separation of concerns'
      ]
    },

    workflowChaining: {
      description: 'Chain multiple workflows together with data transformation',
      implementation: `// Workflow chaining with data transformation
{
  "chainedWorkflows": [
    {
      "name": "Data Extraction",
      "workflow": "extract-source-data",
      "inputs": {
        "source": "={{ $json.dataSource }}",
        "filters": "={{ $json.extractionFilters }}"
      },
      "outputMapping": {
        "extractedData": "data",
        "metadata": "extractionMetadata"
      }
    },
    {
      "name": "Data Cleaning",
      "workflow": "clean-and-validate-data",
      "inputs": {
        "rawData": "={{ $node['Data Extraction'].json.extractedData }}",
        "cleaningRules": "={{ $json.cleaningConfiguration }}"
      },
      "outputMapping": {
        "cleanData": "processedData",
        "issues": "dataQualityIssues"
      }
    },
    {
      "name": "Data Analysis",
      "workflow": "analyze-processed-data", 
      "inputs": {
        "data": "={{ $node['Data Cleaning'].json.cleanData }}",
        "analysisType": "{{ $json.analysisConfiguration }}"
      },
      "outputMapping": {
        "results": "analysisResults",
        "insights": "dataInsights"
      }
    }
  ],
  "finalOutput": {
    "combinedResults": {
      "originalData": "={{ $node['Data Extraction'].json.extractedData }}",
      "processedData": "={{ $node['Data Cleaning'].json.cleanData }}",
      "analysis": "={{ $node['Data Analysis'].json.analysisResults }}",
      "insights": "={{ $node['Data Analysis'].json.dataInsights }}",
      "metadata": {
        "extractionTime": "={{ $node['Data Extraction'].json.extractionMetadata.timestamp }}",
        "processingStats": "={{ $node['Data Cleaning'].json.dataQualityIssues }}",
        "analysisTimestamp": "={{ $now }}"
      }
    }
  }
}`
    },

    contextPreservation: {
      description: 'Maintain execution context across sub-workflow calls',
      implementation: `// Context preservation pattern
{
  "contextManagement": {
    "globalContext": {
      "userId": "={{ $json.user.id }}",
      "sessionId": "={{ $json.session.id }}",
      "requestId": "={{ $execution.id }}",
      "timestamp": "={{ $now }}"
    },
    "workflowContext": {
      "parentWorkflow": "={{ $workflow.name }}",
      "executionMode": "{{ $execution.mode }}",
      "callStack": "={{ $json.callStack || [] }}"
    },
    "dataContext": {
      "originalInput": "={{ $items()[0].json }}",
      "transformationHistory": "={{ $json.transformations || [] }}"
    }
  },
  "contextPassing": {
    "strategy": "embed-in-payload",
    "contextKey": "_executionContext",
    "preserveAcrossCalls": true,
    "includeCallStack": true
  }
}`,
      benefits: [
        'Debugging and tracing across workflow boundaries',
        'State management in complex workflow chains',
        'Audit trails for compliance and monitoring',
        'Error context for better troubleshooting'
      ]
    }
  },

  // Error handling and resilience
  errorHandlingPatterns: {
    gracefulDegradation: {
      description: 'Continue execution with reduced functionality when sub-workflows fail',
      implementation: `// Graceful degradation pattern
{
  "primaryWorkflow": {
    "name": "enhanced-data-processing",
    "optional": false,
    "fallback": "basic-data-processing",
    "timeout": 300
  },
  "enhancementWorkflows": [
    {
      "name": "ai-enrichment",
      "optional": true,
      "continueOnFailure": true,
      "fallback": "skip"
    },
    {
      "name": "external-validation", 
      "optional": true,
      "continueOnFailure": true,
      "fallback": "cached-validation"
    }
  ],
  "errorStrategy": {
    "level1": "retry-with-backoff",
    "level2": "fallback-workflow",
    "level3": "graceful-degradation",
    "level4": "fail-with-notification"
  }
}`
    },

    compensatingTransactions: {
      description: 'Implement rollback logic for failed workflow chains',
      implementation: `// Compensating transaction pattern
{
  "transactionWorkflow": {
    "steps": [
      {
        "name": "Reserve Inventory",
        "workflow": "inventory-reservation",
        "compensation": "release-inventory-reservation"
      },
      {
        "name": "Process Payment",
        "workflow": "payment-processing",
        "compensation": "refund-payment"
      },
      {
        "name": "Create Order",
        "workflow": "order-creation",
        "compensation": "cancel-order"
      },
      {
        "name": "Send Confirmation",
        "workflow": "send-order-confirmation", 
        "compensation": "send-cancellation-notice"
      }
    ],
    "onFailure": {
      "strategy": "rollback-all",
      "executeCompensations": true,
      "notifyStakeholders": true,
      "logIncident": true
    }
  }
}`
    },

    circuitBreaker: {
      description: 'Prevent cascading failures by monitoring sub-workflow health',
      implementation: `// Circuit breaker for sub-workflows
{
  "circuitBreaker": {
    "failureThreshold": 5,
    "timeWindow": 300000,
    "resetTimeout": 60000,
    "states": {
      "closed": "normal operation",
      "open": "failures exceeded threshold",
      "halfOpen": "testing if service recovered"
    },
    "monitoring": {
      "trackFailureRate": true,
      "trackResponseTime": true,
      "alertOnStateChange": true
    }
  },
  "fallbackStrategy": {
    "useCache": true,
    "degradedMode": "essential-functions-only",
    "userNotification": "service-temporarily-unavailable"
  }
}`
    }
  },

  // Best practices for composition
  bestPractices: {
    design: [
      'Keep sub-workflows focused on single responsibilities',
      'Define clear input/output contracts',
      'Implement proper error handling and timeouts',
      'Use meaningful names and documentation',
      'Version sub-workflows for backward compatibility'
    ],
    
    performance: [
      'Minimize data transfer between workflows',
      'Use parallel execution where possible',
      'Implement caching for frequently called sub-workflows',
      'Monitor execution times and optimize bottlenecks',
      'Consider memory usage with large datasets'
    ],
    
    maintenance: [
      'Maintain sub-workflow libraries with versioning',
      'Document dependencies and interaction patterns',
      'Implement automated testing for sub-workflows',
      'Use configuration parameters for flexibility',
      'Regular review and refactoring of composition patterns'
    ],
    
    monitoring: [
      'Track sub-workflow execution metrics',
      'Monitor failure rates and patterns',
      'Implement distributed tracing across workflows',
      'Set up alerts for performance degradation',
      'Regular health checks for critical sub-workflows'
    ]
  }
} as const;