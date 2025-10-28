/**
 * Make.com Common Patterns & Workflow Templates
 * Reusable scenario patterns and automation blueprints
 */

export const MAKE_PATTERNS = {
  workflow_templates: {
    description: "Pre-built scenario templates for common automation needs",
    templates: {
      data_sync: {
        name: "Bi-directional Data Synchronization",
        description: "Synchronize data between two systems in real-time",
        modules: [
          "Webhook (System A) → Data Transformer → HTTP (System B)",
          "Webhook (System B) → Data Transformer → HTTP (System A)",
          "Error Handler → Notification → Data Store (Log)"
        ],
        use_cases: ["CRM-ERP sync", "Inventory management", "Customer data unification"],
        configuration: {
          triggers: ["Instant webhooks for real-time sync", "Scheduled triggers for batch sync"],
          error_handling: ["Exponential backoff", "Dead letter queue", "Alert notifications"],
          data_transformation: ["Field mapping", "Format conversion", "Validation rules"]
        }
      },
      
      lead_qualification: {
        name: "Automated Lead Qualification Pipeline",
        description: "Score and route leads based on predefined criteria",
        modules: [
          "Webhook (Form) → Lead Scorer → Router → CRM Actions",
          "Email Notification → Slack Alert → Task Creation"
        ],
        use_cases: ["Marketing automation", "Sales pipeline", "Lead nurturing"],
        scoring_logic: {
          company_size: "Large (50pts), Medium (30pts), Small (10pts)",
          industry: "Target (40pts), Adjacent (20pts), Other (0pts)",
          engagement: "Demo request (60pts), Download (20pts), Visit (5pts)"
        }
      },
      
      order_fulfillment: {
        name: "E-commerce Order Processing",
        description: "Complete order lifecycle automation",
        modules: [
          "Order Webhook → Inventory Check → Payment Processing",
          "Shipping Label → Customer Notification → Analytics Update"
        ],
        use_cases: ["E-commerce automation", "Inventory management", "Customer service"],
        workflow_steps: [
          "Order validation and fraud detection",
          "Inventory reservation and allocation",
          "Payment processing and confirmation",
          "Shipping and tracking setup",
          "Customer communication and updates"
        ]
      },
      
      content_approval: {
        name: "Content Review and Approval Workflow",
        description: "Multi-stage content approval with notifications",
        modules: [
          "Content Submission → Reviewer Assignment → Approval Router",
          "Notification System → Publishing → Archive"
        ],
        use_cases: ["Marketing content", "Legal compliance", "Brand management"],
        approval_stages: [
          "Initial review (Content team)",
          "Legal approval (Legal team)",
          "Final approval (Management)",
          "Publishing (Marketing team)"
        ]
      },
      
      customer_onboarding: {
        name: "Automated Customer Onboarding",
        description: "Progressive customer activation workflow",
        modules: [
          "Signup Event → Welcome Email → Progress Tracker",
          "Task Reminders → Support Escalation → Success Metrics"
        ],
        use_cases: ["SaaS onboarding", "Service activation", "Customer success"],
        onboarding_steps: [
          "Welcome email with getting started guide",
          "Account setup completion tracking",
          "Feature introduction sequence",
          "Progress milestones and celebrations",
          "Support intervention for stuck users"
        ]
      }
    }
  },

  integration_patterns: {
    description: "Common patterns for connecting different systems",
    patterns: {
      api_first: {
        name: "API-First Integration",
        description: "Direct API connections between systems",
        structure: "Source API → Data Transform → Target API",
        benefits: ["Real-time sync", "Direct data flow", "Minimal latency"],
        considerations: ["Rate limiting", "Authentication management", "Error handling"],
        example: "Shopify orders → Transform → QuickBooks invoices"
      },
      
      webhook_driven: {
        name: "Webhook-Driven Automation",
        description: "Event-based triggers for immediate response",
        structure: "Event Source → Webhook → Processing → Actions",
        benefits: ["Instant response", "Event-driven", "Efficient resource usage"],
        considerations: ["Webhook reliability", "Payload validation", "Idempotency"],
        example: "GitHub push → Webhook → Deploy → Slack notification"
      },
      
      batch_processing: {
        name: "Scheduled Batch Processing",
        description: "Process large datasets in scheduled intervals",
        structure: "Schedule → Data Fetch → Iterator → Batch Process → Summary",
        benefits: ["Handle large volumes", "Resource optimization", "Predictable execution"],
        considerations: ["Processing time limits", "Data consistency", "Error recovery"],
        example: "Daily sales report → Process orders → Update analytics → Email summary"
      },
      
      hub_and_spoke: {
        name: "Hub and Spoke Integration",
        description: "Central hub managing multiple system connections",
        structure: "System A → Hub → Distribution → Systems B, C, D",
        benefits: ["Centralized control", "Reduced complexity", "Single point of truth"],
        considerations: ["Hub reliability", "Data transformation", "Scalability"],
        example: "CRM as hub → Distribute customer updates → Email, Support, Billing"
      },
      
      event_sourcing: {
        name: "Event Sourcing Pattern",
        description: "Capture and replay business events",
        structure: "Event → Event Store → Event Processor → State Update",
        benefits: ["Audit trail", "Replay capability", "Temporal queries"],
        considerations: ["Storage requirements", "Event versioning", "Complexity"],
        example: "User actions → Event log → Analytics → Personalization updates"
      }
    }
  },

  data_transformation_patterns: {
    description: "Common data transformation and mapping patterns",
    patterns: {
      field_mapping: {
        name: "Direct Field Mapping",
        description: "One-to-one field transformations",
        pattern: "source.field → transformation → target.field",
        examples: [
          "firstName → capitalize → contact_name",
          "email → lower → email_address",
          "phone → formatPhone → phone_number"
        ]
      },
      
      data_enrichment: {
        name: "Data Enrichment",
        description: "Add additional data from external sources",
        pattern: "Core Data → Lookup → External API → Merge → Enhanced Data",
        examples: [
          "Email → Company lookup → Add company data",
          "Address → Geocoding → Add coordinates",
          "Domain → Company API → Add firmographic data"
        ]
      },
      
      data_aggregation: {
        name: "Data Aggregation",
        description: "Combine multiple records into summaries",
        pattern: "Multiple Records → Group → Calculate → Summary Record",
        examples: [
          "Order items → Group by product → Sum quantities",
          "Sales data → Group by region → Calculate totals",
          "User activities → Group by user → Calculate engagement"
        ]
      },
      
      data_validation: {
        name: "Data Validation and Cleansing",
        description: "Ensure data quality and consistency",
        pattern: "Raw Data → Validate → Clean → Standardize → Output",
        validation_rules: [
          "Email format validation",
          "Phone number standardization",
          "Date format consistency",
          "Required field validation",
          "Data type verification"
        ]
      },
      
      format_conversion: {
        name: "Format Conversion",
        description: "Convert between different data formats",
        pattern: "Input Format → Parse → Transform → Output Format",
        conversions: [
          "CSV → JSON transformation",
          "XML → Database records",
          "PDF → Structured data",
          "Image → Text (OCR)",
          "Date format standardization"
        ]
      }
    }
  },

  error_handling_patterns: {
    description: "Robust error handling and recovery patterns",
    patterns: {
      retry_with_backoff: {
        name: "Exponential Backoff Retry",
        description: "Retry failed operations with increasing delays",
        implementation: [
          "Catch error in error handler",
          "Check retry count (max 3-5 attempts)",
          "Calculate delay (1s, 2s, 4s, 8s)",
          "Sleep for calculated time",
          "Retry the operation",
          "Log attempt and result"
        ],
        use_cases: ["API rate limiting", "Temporary service outages", "Network timeouts"]
      },
      
      circuit_breaker: {
        name: "Circuit Breaker Pattern",
        description: "Prevent cascading failures by stopping requests to failing services",
        states: ["Closed (normal)", "Open (failing)", "Half-open (testing)"],
        implementation: [
          "Track failure rate over time window",
          "Open circuit after threshold failures",
          "Return cached/default response when open",
          "Periodically test service availability",
          "Close circuit when service recovers"
        ]
      },
      
      dead_letter_queue: {
        name: "Dead Letter Queue",
        description: "Store failed messages for later processing or analysis",
        implementation: [
          "Catch unrecoverable errors",
          "Store original data and error details",
          "Add timestamp and retry count",
          "Send to dedicated storage/queue",
          "Alert administrators",
          "Provide manual processing interface"
        ]
      },
      
      graceful_degradation: {
        name: "Graceful Degradation",
        description: "Continue operation with reduced functionality",
        strategies: [
          "Use cached data when live data unavailable",
          "Provide default values for missing data",
          "Skip non-critical operations",
          "Show user-friendly error messages",
          "Log issues for later resolution"
        ]
      },
      
      compensation_transaction: {
        name: "Compensation Transaction",
        description: "Undo operations when part of a workflow fails",
        implementation: [
          "Track all operations in workflow",
          "Define compensation for each operation",
          "Execute compensations in reverse order",
          "Log compensation actions",
          "Notify stakeholders of rollback"
        ]
      }
    }
  },

  performance_patterns: {
    description: "Patterns for optimizing scenario performance",
    patterns: {
      bulk_operations: {
        name: "Bulk API Operations",
        description: "Process multiple records in single API calls",
        benefits: ["Reduced API calls", "Better rate limit usage", "Improved performance"],
        implementation: [
          "Collect records using aggregator",
          "Batch into optimal sizes (100-1000 records)",
          "Use bulk API endpoints when available",
          "Handle partial failures gracefully",
          "Track processing results"
        ]
      },
      
      parallel_processing: {
        name: "Parallel Processing",
        description: "Execute independent operations simultaneously",
        use_cases: ["Multiple API calls", "Independent data processing", "Parallel workflows"],
        implementation: [
          "Use router to split workflow",
          "Execute parallel branches",
          "Use aggregator to collect results",
          "Handle different completion times",
          "Manage resource limits"
        ]
      },
      
      caching_strategy: {
        name: "Data Caching",
        description: "Store frequently accessed data to reduce API calls",
        cache_types: ["Data Store cache", "Variable cache", "External cache (Redis)"],
        strategies: [
          "Cache reference data (countries, currencies)",
          "Cache expensive calculations",
          "Implement cache expiration",
          "Use cache-aside pattern",
          "Handle cache misses gracefully"
        ]
      },
      
      lazy_loading: {
        name: "Lazy Data Loading",
        description: "Load data only when needed",
        implementation: [
          "Check if data is required for current operation",
          "Load minimal data initially",
          "Fetch additional data on demand",
          "Use conditional logic to control loading",
          "Cache loaded data for reuse"
        ]
      }
    }
  },

  monitoring_patterns: {
    description: "Patterns for monitoring and observability",
    patterns: {
      health_checks: {
        name: "Scenario Health Monitoring",
        description: "Regular checks to ensure scenarios are functioning",
        implementation: [
          "Scheduled test transactions",
          "API endpoint monitoring",
          "Data quality checks",
          "Performance metrics tracking",
          "Alert on anomalies"
        ]
      },
      
      audit_logging: {
        name: "Comprehensive Audit Logging",
        description: "Track all operations for compliance and debugging",
        log_data: [
          "Execution timestamps",
          "Input and output data",
          "User identities",
          "Operation results",
          "Error details"
        ]
      },
      
      metrics_collection: {
        name: "Metrics and Analytics",
        description: "Collect operational metrics for optimization",
        metrics: [
          "Execution frequency and duration",
          "Success/failure rates",
          "Data volume processed",
          "API response times",
          "Resource utilization"
        ]
      }
    }
  }
};

export const MAKE_PATTERN_EXAMPLES = {
  customer_service: {
    name: "Customer Service Automation",
    description: "Automate common customer service workflows",
    scenario: [
      "Support Ticket → Categorize → Route to Team",
      "Auto-response → Knowledge Base Search → Human Escalation"
    ],
    modules: {
      intake: "Webhook (Support Form) → Text Analysis → Category Assignment",
      routing: "Router → Team Assignment → Notification",
      response: "Knowledge Base Search → Template Response → Queue for Review"
    }
  },
  
  marketing_automation: {
    name: "Lead Nurturing Campaign",
    description: "Progressive lead nurturing based on engagement",
    scenario: [
      "Lead Capture → Scoring → Segmentation",
      "Personalized Content → Engagement Tracking → Sales Handoff"
    ],
    modules: {
      capture: "Form Webhook → Lead Validation → CRM Creation",
      scoring: "Activity Tracker → Score Calculator → Segment Assignment",
      nurturing: "Email Sequence → Engagement Monitor → Sales Alert"
    }
  },
  
  financial_reporting: {
    name: "Automated Financial Reporting",
    description: "Generate and distribute financial reports automatically",
    scenario: [
      "Data Collection → Calculation → Report Generation",
      "Stakeholder Distribution → Archival → Dashboard Update"
    ],
    modules: {
      collection: "Multiple APIs → Data Aggregator → Validation",
      processing: "Calculator → Report Generator → Format Converter",
      distribution: "Email Distribution → Dashboard Update → Archive Storage"
    }
  }
};