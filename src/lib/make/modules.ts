/**
 * Make.com Core Modules and Components
 * Comprehensive guide to built-in modules and their usage patterns
 */

export const MAKE_MODULES = {
  // Flow Control Modules
  flowControl: {
    router: {
      description: "Splits scenario execution into multiple parallel paths",
      use_cases: [
        "Process different record types differently",
        "Send data to multiple destinations",
        "Implement conditional logic with multiple outcomes",
        "Create backup processes for critical data"
      ],
      configuration: {
        filters: "Define conditions for each route",
        fallback: "Optional default route for unmatched data",
        parallel: "All matching routes execute simultaneously"
      },
      example: {
        scenario: "Customer data routing",
        logic: "Route new customers to onboarding, existing to updates, VIP to special handling",
        implementation: "Router with 3 filters: customer.status='new', customer.status='existing', customer.tier='VIP'"
      }
    },
    filter: {
      description: "Controls which bundles continue through the scenario",
      use_cases: [
        "Process only new records",
        "Skip incomplete data",
        "Filter by date ranges",
        "Prevent duplicate processing"
      ],
      operators: {
        text: ["Equal to", "Not equal to", "Contains", "Does not contain", "Starts with", "Ends with"],
        numeric: ["Equal to", "Not equal to", "Greater than", "Less than", "Between"],
        date: ["Equal to", "After", "Before", "Between"],
        boolean: ["True", "False"],
        exists: ["Exists", "Does not exist"]
      },
      example: {
        condition: "{{created_at}} > {{addDays(now; -1)}}",
        description: "Only process records created in the last 24 hours"
      }
    },
    iterator: {
      description: "Converts arrays into individual bundles for processing",
      use_cases: [
        "Process each item in a list separately",
        "Transform array data into individual records",
        "Apply operations to multiple files",
        "Handle bulk data imports"
      ],
      configuration: {
        array: "Source array to iterate over",
        bundle_count: "Number of bundles to process per cycle"
      },
      example: {
        input: ["email1@example.com", "email2@example.com", "email3@example.com"],
        output: "3 separate bundles, each containing one email address",
        usage: "Send individual emails to each address in the list"
      }
    },
    aggregator: {
      description: "Combines multiple bundles into arrays or single bundles",
      types: {
        array: "Combines all bundles into a single array",
        text: "Concatenates text values with delimiters",
        numeric: "Performs mathematical operations (sum, average, etc.)",
        table: "Creates structured table format"
      },
      use_cases: [
        "Generate reports from multiple data sources",
        "Create batch operations",
        "Summarize processed data",
        "Prepare data for bulk imports"
      ],
      example: {
        input: "Multiple customer records",
        aggregation: "Sum total orders, average order value, list all email addresses",
        output: "Single bundle with summary statistics"
      }
    },
    flow_control: {
      description: "Advanced flow control with break, resume, and commit operations",
      operations: {
        break: "Stop processing additional bundles",
        resume: "Continue processing after an error",
        commit: "Save current state before continuing",
        rollback: "Revert to previous committed state"
      },
      use_cases: [
        "Implement complex error handling",
        "Create checkpoints in long-running scenarios",
        "Handle partial failures gracefully",
        "Implement transaction-like behavior"
      ]
    }
  },

  // Data Processing Tools
  dataProcessing: {
    text_parser: {
      description: "Extract and manipulate text data using patterns and rules",
      operations: {
        match_pattern: "Extract data using regular expressions",
        replace_text: "Find and replace text patterns",
        split_text: "Divide text into multiple parts",
        extract_html: "Parse HTML content and extract elements",
        extract_email: "Find email addresses in text",
        extract_url: "Find URLs in text content"
      },
      patterns: {
        email: "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b",
        phone: "\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b",
        url: "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)",
        date: "\\b\\d{1,2}[/-]\\d{1,2}[/-]\\d{4}\\b"
      },
      example: {
        input: "Contact John Doe at john.doe@company.com or call (555) 123-4567",
        extraction: "Email: john.doe@company.com, Phone: (555) 123-4567, Name: John Doe"
      }
    },
    json: {
      description: "Parse, create, and manipulate JSON objects",
      operations: {
        parse: "Convert JSON string to object",
        create: "Build JSON from individual values",
        transform: "Modify existing JSON structure",
        validate: "Check JSON syntax and structure"
      },
      functions: {
        get: "{{get(object; 'path.to.value')}}",
        set: "{{set(object; 'path.to.value'; newValue)}}",
        merge: "{{merge(object1; object2)}}",
        keys: "{{keys(object)}}",
        values: "{{values(object)}}"
      },
      example: {
        parse: 'Input: "{\\"name\\": \\"John\\", \\"age\\": 30}" → Output: Object with name and age properties',
        create: 'Input: name="John", age=30 → Output: "{\\"name\\": \\"John\\", \\"age\\": 30}"'
      }
    },
    xml: {
      description: "Process XML data and convert between XML and JSON",
      operations: {
        parse: "Convert XML string to structured object",
        create: "Generate XML from object data",
        transform: "Apply XSLT transformations",
        validate: "Check XML syntax and schema compliance"
      },
      use_cases: [
        "Process SOAP API responses",
        "Handle configuration files",
        "Transform data between XML and JSON",
        "Parse RSS/Atom feeds"
      ]
    },
    math: {
      description: "Perform mathematical calculations and operations",
      functions: {
        basic: ["add", "subtract", "multiply", "divide"],
        advanced: ["pow", "sqrt", "abs", "round", "ceil", "floor"],
        trigonometric: ["sin", "cos", "tan", "asin", "acos", "atan"],
        statistical: ["sum", "average", "min", "max", "median"]
      },
      example: {
        calculation: "{{round({{multiply({{price}}; 1.1)}}; 2)}}",
        description: "Add 10% tax to price and round to 2 decimal places"
      }
    },
    set_variables: {
      description: "Store and retrieve values for use throughout the scenario",
      types: {
        simple: "Store single values (text, number, boolean)",
        complex: "Store objects and arrays",
        temporary: "Variables that exist only during scenario execution",
        persistent: "Variables that persist between scenario runs"
      },
      use_cases: [
        "Store API tokens for reuse",
        "Keep counters and totals",
        "Cache frequently used data",
        "Share data between different scenario paths"
      ],
      example: {
        set: "Variable name: 'customerCount', Value: {{add({{get(customerCount)}}; 1)}}",
        get: "Access stored value: {{get(customerCount)}}"
      }
    }
  },

  // HTTP and API Modules
  http: {
    http_module: {
      description: "Make custom HTTP requests to any REST API or web service",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
      configuration: {
        url: "Target API endpoint",
        method: "HTTP method to use",
        headers: "Custom headers (Authorization, Content-Type, etc.)",
        query_parameters: "URL query string parameters",
        body: "Request body for POST/PUT requests"
      },
      authentication: {
        none: "No authentication required",
        basic: "Username and password",
        bearer: "Bearer token in Authorization header",
        api_key: "API key in header or query parameter",
        oauth: "OAuth 1.0/2.0 authentication"
      },
      response_handling: {
        parse_response: "Automatically parse JSON/XML responses",
        evaluate_all_states: "Handle both success and error responses",
        follow_redirects: "Automatically follow HTTP redirects",
        timeout: "Set request timeout limits"
      },
      example: {
        get_request: {
          url: "https://api.example.com/users/{{user_id}}",
          method: "GET",
          headers: { "Authorization": "Bearer {{api_token}}" }
        },
        post_request: {
          url: "https://api.example.com/users",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: '{"name": "{{name}}", "email": "{{email}}"}'
        }
      }
    },
    webhooks: {
      description: "Receive real-time data from external systems",
      types: {
        instant: "Immediate trigger when webhook receives data",
        custom: "User-defined webhook URL and processing",
        app_specific: "Pre-configured webhooks for specific applications"
      },
      configuration: {
        url: "Unique webhook URL provided by Make.com",
        response: "Custom response to send back to the sender",
        data_structure: "Expected format of incoming data",
        authentication: "Optional webhook verification"
      },
      security: {
        ip_restrictions: "Limit access to specific IP addresses",
        hmac_verification: "Verify webhook signatures",
        custom_headers: "Require specific headers for validation"
      },
      use_cases: [
        "Receive notifications from external systems",
        "Process form submissions in real-time",
        "Handle payment notifications",
        "Sync data changes immediately"
      ]
    }
  },

  // Utility Modules
  utilities: {
    sleep: {
      description: "Pause scenario execution for a specified duration",
      configuration: {
        duration: "Number of seconds to pause (1-300 seconds max)",
        use_case: "Rate limiting, waiting for external processes"
      },
      example: "Sleep for 30 seconds between API calls to respect rate limits"
    },
    break: {
      description: "Stop processing additional bundles in the current cycle",
      use_cases: [
        "Stop after processing a certain number of records",
        "Halt execution when an error condition is met",
        "Implement early termination logic"
      ]
    },
    ignore: {
      description: "Skip errors and continue with next bundle",
      configuration: {
        error_types: "Specify which errors to ignore",
        logging: "Whether to log ignored errors"
      }
    }
  },

  // App-Specific Modules (Common Examples)
  commonApps: {
    email: {
      modules: ["Send an Email", "Watch Emails", "Search Emails"],
      capabilities: {
        smtp: "Send emails via SMTP servers",
        templates: "Use HTML templates with dynamic content",
        attachments: "Include files and documents",
        tracking: "Monitor email delivery and opens"
      }
    },
    google_sheets: {
      modules: ["Add a Row", "Update a Row", "Search Rows", "Watch New Rows"],
      capabilities: {
        crud: "Full create, read, update, delete operations",
        formatting: "Apply cell formatting and formulas",
        sharing: "Manage sheet permissions",
        bulk_operations: "Process multiple rows efficiently"
      }
    },
    slack: {
      modules: ["Send a Message", "Watch Messages", "Create Channel", "Upload File"],
      capabilities: {
        messaging: "Send text, rich text, and interactive messages",
        files: "Upload and share documents",
        channels: "Create and manage channels",
        users: "Manage team members and permissions"
      }
    }
  }
};

// Common module patterns and combinations
export const MAKE_MODULE_PATTERNS = {
  data_sync: {
    pattern: "Watch Records → Filter → Transform → Upsert Records",
    description: "Continuously sync data between two systems",
    modules: ["Database Watch", "Filter", "Set Variables", "HTTP Request"]
  },
  notification_system: {
    pattern: "Webhook → Router → [Email/Slack/SMS] → Log",
    description: "Multi-channel notification system",
    modules: ["Webhook", "Router", "Email", "Slack", "Set Variables"]
  },
  data_processing: {
    pattern: "Schedule → HTTP Get → Iterator → Transform → Aggregator → Report",
    description: "Scheduled data processing and reporting",
    modules: ["Schedule", "HTTP", "Iterator", "JSON", "Aggregator", "Email"]
  },
  error_handling: {
    pattern: "Action → Error Handler → [Log Error] → [Retry/Notify]",
    description: "Robust error handling with logging and recovery",
    modules: ["HTTP Request", "Error Handler", "Set Variables", "Email"]
  }
};