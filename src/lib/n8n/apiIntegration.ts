/**
 * API Integration Patterns for n8n Workflows
 * Based on official n8n documentation and HTTP Request node capabilities
 */

export const N8N_HTTP_REQUEST_NODE = {
  description: 'The HTTP Request node is one of the most versatile nodes in n8n for API integrations',
  nodeType: 'n8n-nodes-base.httprequest',
  useCases: [
    'Making REST API calls to any service',
    'Querying data from apps with REST APIs',
    'Custom API operations not supported by built-in nodes',
    'As an AI agent tool for dynamic API interactions'
  ],
  
  nodeParameters: {
    method: {
      description: 'HTTP method to use for the request',
      options: ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
      defaultRecommendations: {
        'GET': 'Retrieve data from APIs',
        'POST': 'Create new resources or submit data',
        'PUT': 'Update existing resources completely',
        'PATCH': 'Update specific fields of resources',
        'DELETE': 'Remove resources from the system'
      }
    },
    
    url: {
      description: 'The URL to make the request to',
      supportsExpressions: true,
      examples: [
        'https://api.example.com/users',
        '{{ $json.apiEndpoint }}/data',
        'https://{{ $json.subdomain }}.api.com/v1/items'
      ]
    },
    
    authentication: {
      description: 'Authentication method for the API',
      types: [
        'None',
        'Basic Auth',
        'Header Auth',
        'OAuth1',
        'OAuth2',
        'Digest Auth',
        'Query Auth',
        'Predefined Credential Type'
      ]
    },
    
    parameters: {
      queryString: 'URL query parameters',
      headers: 'Custom HTTP headers',
      body: 'Request body for POST/PUT/PATCH requests',
      options: 'Additional request options (timeout, redirect, etc.)'
    }
  },
  
  curlImport: {
    description: 'Import curl commands directly into HTTP Request node',
    benefits: [
      'Quick setup from API documentation',
      'Preserve complex authentication',
      'Copy exact request structure',
      'Reduce configuration errors'
    ]
  }
} as const;

export const N8N_API_INTEGRATION_PATTERNS = {
  restIntegration: {
    description: 'RESTful API integration strategies using n8n HTTP Request node',
    patterns: {
      basicRestCall: {
        description: 'Simple REST API call with n8n HTTP Request node',
        structure: ['HTTP Request Node', 'Response Processing', 'Error Handling'],
        implementation: {
          httpRequest: {
            method: 'GET',
            url: 'https://api.example.com/users',
            headers: { 'Content-Type': 'application/json' },
            authentication: 'Predefined Credential Type'
          },
          responseProcessing: 'Use expressions like {{ $json.data }} to access response data',
          errorHandling: 'Configure node error handling: stopWorkflow, continueRegularOutput, or continueErrorOutput'
        }
      },
      
      paginatedApiCalls: {
        description: 'Handle paginated API responses in n8n',
        nodeSequence: [
          'HTTP Request (initial page)',
          'Set node (extract pagination info)', 
          'Loop Over Items node (for remaining pages)',
          'HTTP Request (in loop)',
          'Merge node (combine all results)'
        ],
        expressions: {
          nextPageUrl: '{{ $json.links?.next }}',
          hasMorePages: '{{ $json.page < $json.total_pages }}',
          pageParameter: '{{ $json.currentPage + 1 }}'
        }
      },
      
      batchProcessing: {
        description: 'Process multiple API calls efficiently',
        n8nNodes: [
          'Split In Batches node (batch size: 50-100)',
          'HTTP Request node (parallel execution enabled)',
          'Merge node (aggregate results)',
          'Error handling for failed requests'
        ],
        configuration: {
          batchSize: 'Optimize based on API rate limits',
          parallelExecution: 'Enable in HTTP Request node settings',
          retryLogic: 'Configure retry on fail with exponential backoff'
        }
      },
      
      dynamicEndpoints: {
        description: 'Build API URLs dynamically using expressions',
        examples: [
          'Base URL: https://api.example.com/{{ $json.resource }}',
          'With parameters: https://api.com/users/{{ $json.userId }}/orders',
          'Conditional endpoints: {{ $json.isProduction ? "api.prod.com" : "api.staging.com" }}'
        ]
      }
    },
    
    authenticationPatterns: {
      description: 'Authentication strategies in n8n HTTP Request node',
      methods: {
        apiKey: {
          headerAuth: 'Set header name: X-API-Key, value: your-api-key',
          queryAuth: 'Add api_key parameter to query string',
          customHeader: 'Authorization: Bearer your-api-key'
        },
        
        oauth2: {
          predefinedCredential: 'Use OAuth2 credential for automatic token management',
          manualTokens: 'Store tokens in workflow static data',
          tokenRefresh: 'Implement refresh logic using additional HTTP Request nodes'
        },
        
        basicAuth: {
          credentials: 'Use Basic Auth credential type',
          manual: 'Set Authorization header: Basic base64(username:password)'
        }
      }
    }
  },
  
  errorHandling: {
    description: 'Error handling strategies for API integrations in n8n',
    nodeSettings: {
      onError: {
        stopWorkflow: 'Stop entire workflow on API error',
        continueRegularOutput: 'Continue workflow, mark node as failed',
        continueErrorOutput: 'Route errors to error output for handling'
      },
      
      retrySettings: {
        retryOnFail: 'Enable automatic retries on failure',
        maxTries: 'Set maximum retry attempts (1-5)',
        waitBetweenTries: 'Configure delay between retries (milliseconds)'
      }
    },
    
    statusCodeHandling: {
      '2xx': 'Success - data available in $json',
      '4xx': 'Client error - check $statusCode and $response in error output',
      '5xx': 'Server error - implement retry logic',
      'timeout': 'Network timeout - increase timeout in node options'
    },
    
    errorExpressions: {
      checkError: '{{ $execution.mode === "trigger" && $json.error }}',
      statusCode: '{{ $statusCode }}',
      errorMessage: '{{ $json.error?.message || "API call failed" }}',
      isRetryable: '{{ $statusCode >= 500 || $statusCode === 429 }}'
    }
  },
  
  rateLimiting: {
    description: 'Rate limiting strategies for n8n API integrations',
    nodeConfiguration: {
      requestInterval: 'Set delay between requests in node options',
      batchSize: 'Use Split In Batches node to control request volume',
      parallelExecution: 'Disable for rate-limited APIs',
      timeout: 'Increase timeout for slow APIs'
    },
    
    rateLimitHeaders: {
      reading: [
        'X-RateLimit-Limit: {{ $response.headers["x-ratelimit-limit"] }}',
        'X-RateLimit-Remaining: {{ $response.headers["x-ratelimit-remaining"] }}',
        'X-RateLimit-Reset: {{ $response.headers["x-ratelimit-reset"] }}'
      ],
      
      conditionalDelay: {
        description: 'Add conditional delays based on rate limit headers',
        implementation: 'Use IF node to check remaining requests and add Wait node'
      }
    },
    
    retryStrategies: {
      exponentialBackoff: 'Increase wait time: 1s, 2s, 4s, 8s using expressions',
      respectRetryAfter: 'Use Retry-After header value for delay',
      circuitBreaker: 'Stop retrying after consecutive failures'
    }
  },
  
  customOperations: {
    description: 'Using HTTP Request node for custom API operations',
    whenToUse: [
      'API operation not supported by built-in nodes',
      'Need custom request configuration',
      'Complex authentication requirements',
      'Beta or experimental API endpoints'
    ],
    
    predefinedCredentials: {
      description: 'Reuse existing node credentials in HTTP Request',
      steps: [
        '1. Select Authentication > Predefined Credential Type',
        '2. Choose the service (e.g., Slack, Google, etc.)',
        '3. Select your existing credential',
        '4. HTTP Request inherits authentication automatically'
      ],
      
      supportedServices: [
        'Most built-in n8n nodes support credential reuse',
        'OAuth2, API Key, and Basic Auth credentials',
        'Service-specific authentication flows'
      ]
    }
  }
} as const;

export const N8N_API_BEST_PRACTICES = {
  nodeConfiguration: [
    'Always configure appropriate timeouts for API calls',
    'Use meaningful node names for debugging',
    'Enable "Always Output Data" for debugging',
    'Set proper error handling based on workflow requirements',
    'Use expressions for dynamic URLs and parameters'
  ],
  
  dataHandling: [
    'Validate API responses before processing',
    'Use Set node to transform data structures',
    'Handle null/undefined values in expressions',
    'Consider data size limits for large responses',
    'Use binary data handling for file downloads'
  ],
  
  performance: [
    'Batch API calls when possible',
    'Use appropriate request methods',
    'Implement caching for repeated requests',
    'Monitor execution times and optimize',
    'Consider queue mode for high-volume workflows'
  ],
  
  security: [
    'Store sensitive data in credentials, not workflow',
    'Use HTTPS for all API communications',
    'Implement proper error logging without exposing secrets',
    'Validate and sanitize API responses',
    'Follow principle of least privilege for API access'
  ],
  
  testing: [
    'Test API integrations with manual executions',
    'Use different environments for development and production',
    'Test error scenarios and edge cases',
    'Monitor API usage and quotas',
    'Document API dependencies and requirements'
  ]
} as const;