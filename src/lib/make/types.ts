/**
 * Make.com Core Types and Data Structures
 * Defines the fundamental types, interfaces, and structures used in Make.com scenarios
 */

export const MAKE_TYPES = {
  // Core scenario structure
  scenario: {
    definition: "A complete automation workflow in Make.com",
    structure: {
      modules: "Individual components that perform specific actions",
      connections: "Links between modules that define data flow",
      settings: "Configuration options for execution, scheduling, and error handling"
    },
    properties: {
      name: "string - Descriptive name for the scenario",
      scheduling: "object - When and how often the scenario runs",
      state: "string - active, inactive, or paused",
      team_id: "number - Team/organization identifier",
      created_at: "datetime - Creation timestamp",
      updated_at: "datetime - Last modification timestamp"
    }
  },

  // Module types and categories
  moduleTypes: {
    triggers: {
      description: "Modules that start scenario execution",
      types: {
        instant: "Real-time triggers that respond immediately to events",
        polling: "Triggers that check for new data at regular intervals",
        manual: "Triggers activated manually by users",
        scheduled: "Triggers that run at specific times or intervals"
      },
      examples: [
        "Webhooks - Receive instant notifications",
        "Watch Records - Poll for new database entries",
        "Schedule - Run at specific times",
        "Manual Trigger - User-initiated execution"
      ]
    },
    actions: {
      description: "Modules that perform operations and modify data",
      types: {
        create: "Add new records or objects",
        update: "Modify existing data",
        delete: "Remove records or objects",
        upsert: "Create or update based on conditions"
      },
      examples: [
        "Create Record - Add new database entry",
        "Send Email - Deliver messages",
        "Upload File - Store documents",
        "Update Status - Modify record states"
      ]
    },
    searches: {
      description: "Modules that find existing data without modifications",
      types: {
        single: "Return one matching record",
        multiple: "Return array of matching records",
        conditional: "Search with complex criteria"
      },
      examples: [
        "Search Records - Find existing entries",
        "List Files - Get file inventories",
        "Get User - Retrieve user information",
        "Find Duplicates - Identify matching records"
      ]
    },
    tools: {
      description: "Utility modules for data processing and flow control",
      categories: {
        flow_control: ["Router", "Filter", "Iterator", "Aggregator"],
        data_processing: ["Text Parser", "JSON", "XML", "Math"],
        utilities: ["Set Variables", "Sleep", "Break"]
      }
    }
  },

  // Bundle structure and data flow
  bundles: {
    definition: "Individual data packages that flow through scenarios",
    structure: {
      data: "object - The actual data payload",
      metadata: "object - Processing information and headers"
    },
    processing: {
      individual: "Each bundle is processed separately through modules",
      parallel: "Multiple bundles can be processed simultaneously",
      sequential: "Some modules require sequential bundle processing"
    },
    examples: {
      simple: {
        name: "John Doe",
        email: "john@example.com",
        created_at: "2024-01-15T10:30:00Z"
      },
      complex: {
        user: {
          id: 12345,
          profile: { name: "Jane Smith", role: "Admin" },
          preferences: ["email", "sms"],
          metadata: { source: "api", version: "v2" }
        }
      }
    }
  },

  // Connection and authentication types
  connections: {
    description: "Authentication credentials for connecting to external services",
    types: {
      oauth2: {
        description: "OAuth 2.0 authentication flow",
        use_cases: ["Google services", "Microsoft 365", "Social media APIs"],
        setup: "Automatic authorization through browser redirect"
      },
      api_key: {
        description: "Simple API key authentication",
        use_cases: ["REST APIs", "Database connections", "Custom services"],
        setup: "Manual entry of API key or token"
      },
      basic_auth: {
        description: "Username and password authentication",
        use_cases: ["Legacy systems", "Internal APIs", "Simple services"],
        setup: "Enter credentials in connection form"
      },
      custom: {
        description: "Custom authentication methods",
        use_cases: ["Proprietary systems", "Complex auth flows", "Certificate-based auth"],
        setup: "Manual configuration of headers and parameters"
      }
    },
    properties: {
      name: "string - Descriptive name for the connection",
      type: "string - Authentication method",
      verified: "boolean - Whether connection is working",
      shared: "boolean - Whether connection can be used by team members"
    }
  },

  // Scenario execution and scheduling
  execution: {
    scheduling: {
      types: {
        manual: "Execute only when manually triggered",
        immediate: "Run as soon as triggered",
        interval: "Run at regular time intervals",
        specific_time: "Run at specific date/time",
        cron: "Advanced scheduling with cron expressions"
      },
      options: {
        timezone: "string - Timezone for scheduled execution",
        max_cycles: "number - Maximum number of cycles per execution",
        sequential_processing: "boolean - Process bundles one at a time"
      }
    },
    settings: {
      error_handling: {
        ignore: "Continue execution despite errors",
        stop: "Halt scenario execution on errors", 
        retry: "Attempt to retry failed operations",
        route: "Direct errors to specific error handling modules"
      },
      data_storage: {
        enabled: "boolean - Whether to store execution data",
        days: "number - How long to retain execution logs",
        incomplete_runs: "boolean - Store data from incomplete executions"
      }
    }
  },

  // Common data formats and structures
  dataFormats: {
    json: {
      description: "JavaScript Object Notation - most common format",
      use_cases: ["API responses", "Configuration data", "Complex objects"],
      example: '{"name": "value", "array": [1, 2, 3], "nested": {"key": "value"}}'
    },
    xml: {
      description: "Extensible Markup Language for structured data",
      use_cases: ["SOAP APIs", "Configuration files", "Data exchange"],
      example: '<root><item name="value"><nested>content</nested></item></root>'
    },
    csv: {
      description: "Comma-separated values for tabular data",
      use_cases: ["Data exports", "Bulk imports", "Spreadsheet data"],
      example: 'name,email,status\nJohn,john@example.com,active'
    },
    form_data: {
      description: "HTML form encoded data",
      use_cases: ["Form submissions", "File uploads", "Simple data"],
      example: 'name=John&email=john@example.com&status=active'
    }
  }
};

// Type definitions for TypeScript integration
export interface MakeScenario {
  id: number;
  name: string;
  state: 'active' | 'inactive' | 'paused';
  team_id: number;
  scheduling: {
    type: 'manual' | 'immediate' | 'interval' | 'specific_time' | 'cron';
    interval?: number;
    cron?: string;
    timezone?: string;
  };
  modules: MakeModule[];
  connections: MakeConnection[];
}

export interface MakeModule {
  id: number;
  type: string;
  app: string;
  metadata: {
    designer: {
      x: number;
      y: number;
    };
    restore?: object;
  };
  parameters?: Record<string, any>;
  mapper?: Record<string, any>;
  routes?: MakeRoute[];
}

export interface MakeConnection {
  id: number;
  name: string;
  type: 'oauth2' | 'api_key' | 'basic_auth' | 'custom';
  verified: boolean;
  shared: boolean;
}

export interface MakeRoute {
  flow: MakeRouteFlow[];
}

export interface MakeRouteFlow {
  id: number;
  module: number;
}

export interface MakeBundle {
  [key: string]: any;
}