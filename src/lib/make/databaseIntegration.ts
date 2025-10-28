/**
 * Make.com Database Integration Patterns
 * Comprehensive guide for connecting to databases and data storage systems
 */

export const MAKE_DATABASE_INTEGRATION = {
  // Data Stores - Make.com's Built-in Database
  data_stores: {
    overview: {
      description: "Make.com's built-in NoSQL database for storing and retrieving data",
      features: [
        "Key-value storage with complex object support",
        "Automatic scaling and management",
        "Built-in search and filtering capabilities",
        "No additional configuration required"
      ],
      use_cases: [
        "Store temporary data between scenario runs",
        "Cache API responses to reduce external calls",
        "Maintain state and counters",
        "Store configuration and lookup data"
      ]
    },
    operations: {
      add_record: {
        description: "Insert new records into data store",
        parameters: {
          data_store: "Name of the data store",
          key: "Unique identifier for the record",
          data: "Object containing the data to store"
        },
        example: {
          key: "user_{{user_id}}",
          data: {
            name: "John Doe",
            email: "john@example.com",
            last_login: "{{now}}",
            preferences: { theme: "dark", notifications: true }
          }
        }
      },
      get_record: {
        description: "Retrieve a specific record by key",
        parameters: {
          data_store: "Name of the data store",
          key: "Key of the record to retrieve",
          fallback: "Value to return if record doesn't exist"
        },
        example: {
          key: "user_{{user_id}}",
          fallback: { name: "Unknown User", email: null }
        }
      },
      search_records: {
        description: "Find records matching specific criteria",
        parameters: {
          data_store: "Name of the data store",
          filter: "Search criteria and conditions",
          limit: "Maximum number of records to return",
          sort: "Sorting options"
        },
        filters: {
          equals: "field = value",
          contains: "field contains 'text'",
          greater_than: "field > value",
          date_range: "field between date1 and date2",
          exists: "field exists"
        },
        example: {
          filter: "status = 'active' AND last_login > '2024-01-01'",
          sort: "last_login DESC",
          limit: 100
        }
      },
      update_record: {
        description: "Modify existing records",
        parameters: {
          data_store: "Name of the data store",
          key: "Key of the record to update",
          data: "New data to merge or replace"
        },
        modes: {
          merge: "Merge new data with existing record",
          replace: "Replace entire record with new data"
        }
      },
      delete_record: {
        description: "Remove records from data store",
        parameters: {
          data_store: "Name of the data store",
          key: "Key of the record to delete"
        }
      }
    },
    best_practices: {
      key_design: [
        "Use descriptive, hierarchical keys (user_123, order_456_item_789)",
        "Include timestamps in keys for time-series data",
        "Use consistent naming conventions",
        "Avoid special characters in keys"
      ],
      data_structure: [
        "Keep data structures flat when possible",
        "Use consistent field names across records",
        "Include metadata (created_at, updated_at)",
        "Validate data before storing"
      ],
      performance: [
        "Limit record size to essential data",
        "Use search efficiently with proper filters",
        "Implement pagination for large result sets",
        "Cache frequently accessed data"
      ]
    }
  },

  // External Database Connections
  external_databases: {
    mysql: {
      connection: {
        setup: "Use MySQL connection with host, database, username, password",
        ssl: "Enable SSL for secure connections",
        pooling: "Connection pooling handled automatically by Make.com"
      },
      modules: {
        execute_query: {
          description: "Run custom SQL queries",
          types: ["SELECT", "INSERT", "UPDATE", "DELETE", "STORED PROCEDURES"],
          parameters: {
            query: "SQL query with parameter placeholders",
            parameters: "Values to bind to query placeholders"
          },
          example: {
            query: "SELECT * FROM users WHERE created_at > ? AND status = ?",
            parameters: ["2024-01-01", "active"]
          }
        },
        insert_record: {
          description: "Add new records with form-based interface",
          configuration: "Map Make.com data to database columns",
          example: {
            table: "users",
            data: {
              name: "{{name}}",
              email: "{{email}}",
              created_at: "{{now}}"
            }
          }
        },
        update_record: {
          description: "Modify existing records",
          where_clause: "Conditions to identify records to update",
          example: {
            table: "users",
            set: { last_login: "{{now}}", status: "active" },
            where: "id = {{user_id}}"
          }
        },
        search_records: {
          description: "Query records with visual query builder",
          features: ["Column selection", "WHERE conditions", "ORDER BY", "LIMIT"],
          example: {
            table: "orders",
            columns: ["id", "customer_id", "total", "status"],
            where: "status = 'pending' AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)",
            order: "created_at DESC",
            limit: 50
          }
        }
      },
      patterns: {
        data_sync: "SELECT new records → Process → UPDATE status",
        bulk_insert: "Aggregate data → Generate INSERT statements → Execute",
        incremental_update: "Track last sync time → SELECT changed records → UPDATE destination"
      }
    },
    postgresql: {
      connection: {
        setup: "Similar to MySQL with PostgreSQL-specific features",
        json_support: "Native JSON column support",
        arrays: "PostgreSQL array data types"
      },
      advanced_features: {
        json_operations: {
          description: "Work with JSON columns directly",
          functions: ["jsonb_extract_path", "json_agg", "json_object_agg"],
          example: "SELECT data->>'name' as name FROM users WHERE data->>'active' = 'true'"
        },
        arrays: {
          description: "Handle array columns",
          operations: ["ANY", "ALL", "array_agg", "unnest"],
          example: "SELECT * FROM products WHERE 'electronics' = ANY(categories)"
        }
      }
    },
    mongodb: {
      connection: {
        setup: "MongoDB connection string with authentication",
        collections: "Work with MongoDB collections directly"
      },
      operations: {
        find: {
          description: "Query documents with MongoDB query syntax",
          filters: { status: "active", "profile.age": { $gte: 18 } },
          projection: { name: 1, email: 1, _id: 0 },
          sort: { created_at: -1 },
          limit: 100
        },
        insert: {
          description: "Insert new documents",
          single: "insertOne operation",
          bulk: "insertMany for multiple documents"
        },
        update: {
          description: "Update existing documents",
          operators: ["$set", "$unset", "$inc", "$push", "$pull"],
          example: {
            filter: { _id: "{{document_id}}" },
            update: { $set: { last_login: new Date(), $inc: { login_count: 1 } } }
          }
        },
        aggregate: {
          description: "Complex data processing with aggregation pipeline",
          stages: ["$match", "$group", "$sort", "$project", "$lookup"],
          example: [
            { $match: { status: "active" } },
            { $group: { _id: "$department", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ]
        }
      }
    }
  },

  // Database Integration Patterns
  integration_patterns: {
    real_time_sync: {
      description: "Continuously sync data between systems",
      trigger: "Database watch or scheduled polling",
      flow: "Watch → Filter Changed → Transform → Upsert Destination → Update Status",
      considerations: [
        "Handle duplicate processing",
        "Track sync state and timestamps",
        "Implement conflict resolution",
        "Monitor for sync failures"
      ],
      example: {
        source: "MySQL orders table",
        destination: "CRM system",
        sync_field: "updated_at",
        batch_size: 100
      }
    },
    batch_processing: {
      description: "Process large datasets in manageable chunks",
      scheduling: "Daily, weekly, or monthly batch jobs",
      flow: "Schedule → Query Batch → Iterator → Process → Update → Report",
      optimization: [
        "Use LIMIT and OFFSET for pagination",
        "Process records in chronological order",
        "Implement checkpointing for recovery",
        "Monitor processing progress"
      ]
    },
    data_warehouse_etl: {
      description: "Extract, Transform, Load operations for analytics",
      extract: "Pull data from multiple sources",
      transform: "Clean, normalize, and enrich data",
      load: "Insert into data warehouse or analytics database",
      flow: "Multiple Sources → Transform → Aggregate → Load → Validate"
    },
    backup_and_recovery: {
      description: "Automated backup and disaster recovery",
      backup_types: ["Full backup", "Incremental backup", "Point-in-time recovery"],
      storage: "Cloud storage integration (S3, Google Cloud, Azure)",
      verification: "Test restore procedures automatically"
    }
  },

  // Performance and Optimization
  performance: {
    query_optimization: {
      indexing: "Ensure proper database indexes for query performance",
      query_tuning: "Optimize SQL queries for faster execution",
      connection_pooling: "Efficient connection management",
      result_limiting: "Use LIMIT clauses to prevent memory issues"
    },
    batch_operations: {
      bulk_insert: "Insert multiple records in single operations",
      prepared_statements: "Use parameterized queries for better performance",
      transaction_batching: "Group related operations in transactions"
    },
    monitoring: {
      execution_time: "Track query execution times",
      error_rates: "Monitor database connection and query failures",
      resource_usage: "Watch CPU, memory, and connection usage"
    }
  },

  // Error Handling and Recovery
  error_handling: {
    connection_errors: {
      timeout: "Handle database connection timeouts",
      network_issues: "Retry logic for network failures",
      authentication: "Handle credential expiration and rotation"
    },
    query_errors: {
      syntax_errors: "Validate SQL syntax before execution",
      constraint_violations: "Handle unique key and foreign key violations",
      data_type_errors: "Validate data types before insertion"
    },
    recovery_strategies: {
      retry_logic: "Exponential backoff for transient failures",
      circuit_breaker: "Prevent cascading failures",
      fallback_data: "Use cached or default data when database unavailable"
    }
  }
};

// Common database integration examples
export const MAKE_DATABASE_EXAMPLES = {
  user_sync: {
    name: "User Data Synchronization",
    description: "Sync user data between CRM and application database",
    modules: [
      "Schedule (Every 15 minutes)",
      "MySQL Search (New/updated users)",
      "Iterator (Process each user)",
      "HTTP POST (Update CRM)",
      "MySQL Update (Mark as synced)"
    ],
    sql_queries: {
      select: "SELECT * FROM users WHERE updated_at > ? AND sync_status != 'synced'",
      update: "UPDATE users SET sync_status = 'synced', synced_at = NOW() WHERE id = ?"
    }
  },
  order_processing: {
    name: "E-commerce Order Processing",
    description: "Process new orders and update inventory",
    modules: [
      "Webhook (New order notification)",
      "Data Store Get (Check inventory)",
      "MySQL Insert (Create order record)",
      "Iterator (Process order items)",
      "MySQL Update (Update inventory)",
      "Email (Order confirmation)"
    ],
    data_flow: "Order → Validate → Store → Update Inventory → Notify"
  },
  data_analytics: {
    name: "Daily Analytics Aggregation",
    description: "Generate daily reports from transaction data",
    modules: [
      "Schedule (Daily at midnight)",
      "PostgreSQL Query (Aggregate transactions)",
      "JSON Transform (Format report data)",
      "Data Store Add (Store daily metrics)",
      "HTTP POST (Send to analytics API)"
    ],
    sql_example: `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_orders,
        SUM(amount) as total_revenue,
        AVG(amount) as avg_order_value
      FROM orders 
      WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
      GROUP BY DATE(created_at)
    `
  }
};