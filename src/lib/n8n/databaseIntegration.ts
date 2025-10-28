/**
 * Database Integration Patterns for n8n Workflows
 * Based on official n8n documentation and database node capabilities
 */

export const N8N_DATABASE_NODES = {
  mysql: {
    nodeType: 'n8n-nodes-base.mysql',
    description: 'Connect to MySQL databases and execute SQL operations',
    operations: [
      'Delete', 'Execute SQL', 'Insert', 'Insert or Update', 'Select', 'Update'
    ],
    credentials: 'MySQL credentials with host, port, database, username, password',
    aiToolCapable: true,
    useCases: [
      'Automate work in MySQL databases',
      'Integrate MySQL with other applications',
      'Execute SQL queries from workflows',
      'Insert and update database records'
    ]
  },
  
  mongodb: {
    nodeType: 'n8n-nodes-base.mongodb',
    description: 'Connect to MongoDB databases using the Node.js driver',
    operations: {
      document: [
        'Aggregate documents', 'Delete documents', 'Find documents',
        'Find and replace documents', 'Find and update documents',
        'Insert documents', 'Update documents'
      ],
      searchIndex: [
        'Create search indexes', 'Drop search indexes', 'List search indexes'
      ]
    },
    credentials: 'MongoDB credentials with connection string or individual parameters',
    aiToolCapable: true,
    driver: 'Uses MongoDB Node.js driver for all operations'
  },
  
  microsoftSql: {
    nodeType: 'n8n-nodes-base.microsoftsql',
    description: 'Connect to Microsoft SQL Server databases',
    operations: [
      'Execute an SQL query', 'Insert rows in database',
      'Update rows in database', 'Delete rows in database'
    ],
    credentials: 'Microsoft SQL credentials with server, database, authentication',
    aiToolCapable: true,
    useCases: [
      'Automate work with SQL Server',
      'Execute SQL queries and stored procedures',
      'Integrate with Microsoft ecosystem'
    ]
  }
} as const;

export const N8N_DATABASE_PATTERNS = {
  basicDatabaseOperations: {
    description: 'Common database operations using n8n database nodes',
    patterns: {
      simpleQuery: {
        description: 'Execute a SELECT query and process results',
        implementation: {
          mysqlNode: {
            operation: 'Execute SQL',
            query: 'SELECT * FROM users WHERE status = "active"',
            outputFormat: 'Each row becomes an item in the n8n data array'
          },
          dataProcessing: 'Use subsequent nodes to process query results',
          errorHandling: 'Configure node error handling for connection issues'
        }
      },
      
      dynamicQueries: {
        description: 'Build SQL queries using workflow data',
        examples: [
          'Query: SELECT * FROM {{ $json.tableName }} WHERE id = {{ $json.userId }}',
          'Filter: WHERE created_date >= "{{ $json.startDate }}"',
          'Dynamic columns: SELECT {{ $json.columns.join(",") }} FROM table'
        ]
      },
      
      batchInserts: {
        description: 'Insert multiple records efficiently',
        strategy: [
          '1. Use Loop Over Items node to process array data',
          '2. Configure database node for "Insert" operation',
          '3. Map input data to database columns using expressions',
          '4. Handle conflicts with "Insert or Update" operation'
        ]
      },
      
      transactionHandling: {
        description: 'Handle database transactions in workflows',
        approach: [
          'Use Try-Catch pattern with node error handling',
          'Configure "Continue on Error" for rollback scenarios',
          'Implement compensation logic for failed operations',
          'Use database-specific transaction syntax in SQL queries'
        ]
      }
    }
  },
  
  queryPatterns: {
    description: 'Complex database query strategies and optimization',
    complexQueries: {
      joins: {
        description: 'Efficient multi-table queries',
        patterns: {
          innerJoin: 'Retrieve related records from multiple tables',
          leftJoin: 'Include all records from primary table with optional related data',
          crossJoin: 'Cartesian product for complex analysis',
          selfJoin: 'Join table with itself for hierarchical data'
        },
        optimization: [
          'Use appropriate indexes on join columns',
          'Consider query execution plan',
          'Limit result sets with WHERE clauses',
          'Use subqueries vs joins based on performance'
        ]
      },
      
      aggregation: {
        description: 'Data aggregation and analytics queries',
        functions: {
          count: 'Count records with optional conditions',
          sum: 'Calculate totals for numeric columns',
          avg: 'Compute averages for analytics',
          groupBy: 'Group data for categorical analysis',
          having: 'Filter aggregated results'
        },
        windowFunctions: [
          'ROW_NUMBER() for ranking',
          'LEAD/LAG for time series analysis',
          'SUM() OVER for running totals',
          'RANK() for competitive ranking'
        ]
      },
      
      jsonQueries: {
        description: 'Working with JSON data in databases',
        postgresql: {
          operators: ['-> for JSON field access', '->> for text extraction', '@> for containment'],
          functions: ['json_extract_path for nested data', 'json_agg for aggregation']
        },
        mysql: {
          functions: ['JSON_EXTRACT for field access', 'JSON_UNQUOTE for clean text', 'JSON_ARRAYAGG for arrays']
        }
      }
    },
    
    dynamicQueries: {
      description: 'Build queries dynamically based on workflow data',
      parameterization: {
        description: 'Safe parameter injection to prevent SQL injection',
        techniques: [
          'Use prepared statements with placeholders',
          'Validate input data types and ranges',
          'Escape special characters properly',
          'Use allowlists for dynamic table/column names'
        ]
      },
      
      conditionalClauses: {
        description: 'Build WHERE clauses based on available data',
        example: `
          SELECT * FROM users 
          WHERE 1=1
          {{ $json.name ? "AND name LIKE ?" : "" }}
          {{ $json.email ? "AND email = ?" : "" }}
          {{ $json.active !== undefined ? "AND active = ?" : "" }}
        `
      }
    }
  },
  
  dataSyncStrategies: {
    description: 'Patterns for synchronizing data between systems',
    strategies: {
      fullSync: {
        description: 'Complete data replacement strategy',
        steps: [
          '1. Extract all data from source',
          '2. Transform data to target format',
          '3. Truncate target table',
          '4. Load all data to target',
          '5. Validate data integrity'
        ],
        useCases: ['Small datasets', 'Nightly batch updates', 'Data warehouse loads']
      },
      
      incrementalSync: {
        description: 'Sync only changed data since last update',
        strategies: {
          timestampBased: {
            description: 'Use timestamp columns to identify changes',
            implementation: `
              1. Track last sync timestamp
              2. Query for records modified after last sync
              3. Apply changes to target system
              4. Update last sync timestamp
            `
          },
          
          changeDataCapture: {
            description: 'Capture database changes in real-time',
            techniques: ['Database triggers', 'Transaction log mining', 'Event sourcing']
          },
          
          hashBased: {
            description: 'Compare record hashes to detect changes',
            steps: [
              '1. Calculate hash for each record',
              '2. Compare with stored hashes',
              '3. Sync records with different hashes',
              '4. Update hash storage'
            ]
          }
        }
      },
      
      bidirectionalSync: {
        description: 'Two-way data synchronization between systems',
        challenges: [
          'Conflict resolution for simultaneous changes',
          'Handling deleted records',
          'Maintaining referential integrity',
          'Preventing infinite sync loops'
        ],
        strategies: [
          'Last-write-wins conflict resolution',
          'Manual conflict resolution workflows',
          'Tombstone records for deletions',
          'Vector clocks for change tracking'
        ]
      }
    },
    
    dataValidation: {
      description: 'Ensure data integrity during sync operations',
      checks: [
        'Row count validation between source and target',
        'Checksum validation for critical data',
        'Foreign key constraint validation',
        'Data type and format validation',
        'Business rule validation'
      ]
    }
  },
  
  migrationPatterns: {
    description: 'Database migration and schema evolution patterns',
    schemaChanges: {
      addColumn: {
        description: 'Safely add new columns to existing tables',
        steps: [
          '1. Add column with default value',
          '2. Update application to handle new column',
          '3. Backfill existing data if needed',
          '4. Remove default constraint if appropriate'
        ]
      },
      
      removeColumn: {
        description: 'Safely remove columns from tables',
        steps: [
          '1. Update application to stop using column',
          '2. Deploy application changes',
          '3. Remove column from database',
          '4. Update related indexes and constraints'
        ]
      },
      
      renameColumn: {
        description: 'Rename columns without breaking existing code',
        strategy: [
          '1. Add new column with correct name',
          '2. Copy data from old to new column',
          '3. Update application to use new column',
          '4. Remove old column after verification'
        ]
      }
    },
    
    dataTransformation: {
      description: 'Transform data during migration',
      patterns: {
        normalize: 'Split denormalized data into proper tables',
        denormalize: 'Combine related data for performance',
        typeConversion: 'Change data types with proper validation',
        formatStandardization: 'Standardize date, currency, and text formats'
      }
    },
    
    rollbackStrategies: {
      description: 'Safe rollback procedures for failed migrations',
      techniques: [
        'Database backups before migration',
        'Transaction-based migrations with rollback points',
        'Blue-green deployment strategies',
        'Feature flags for gradual rollout'
      ]
    }
  },
  
  performanceOptimization: {
    description: 'Database performance optimization strategies',
    indexing: {
      strategies: [
        'Create indexes on frequently queried columns',
        'Use composite indexes for multi-column queries',
        'Consider partial indexes for filtered queries',
        'Monitor index usage and remove unused indexes'
      ],
      
      types: {
        btree: 'Standard index for equality and range queries',
        hash: 'Fast equality lookups (PostgreSQL)',
        gin: 'Generalized inverted index for arrays/JSON',
        gist: 'Generalized search tree for geometric data'
      }
    },
    
    queryOptimization: [
      'Use EXPLAIN ANALYZE to understand query performance',
      'Optimize WHERE clause ordering',
      'Use appropriate JOIN types',
      'Limit result sets with pagination',
      'Consider materialized views for complex aggregations'
    ],
    
    batchProcessing: {
      description: 'Efficient bulk data operations',
      techniques: [
        'Use bulk INSERT statements instead of row-by-row',
        'Implement proper batch sizing',
        'Use database-specific bulk load utilities',
        'Process data in chunks to avoid memory issues'
      ]
    }
  },
  
  errorHandling: {
    description: 'Database error handling and recovery patterns',
    transactionManagement: {
      description: 'Ensure data consistency with transactions',
      patterns: {
        explicitTransactions: 'Wrap related operations in BEGIN/COMMIT blocks',
        savepoints: 'Use savepoints for partial rollbacks',
        isolationLevels: 'Choose appropriate isolation level for consistency needs'
      }
    },
    
    connectionErrors: {
      handling: [
        'Implement automatic reconnection with exponential backoff',
        'Use connection pooling for resilience',
        'Handle network timeouts gracefully',
        'Implement circuit breaker pattern'
      ]
    },
    
    dataIntegrityErrors: {
      scenarios: [
        'Foreign key constraint violations',
        'Unique constraint violations',
        'Check constraint failures',
        'Data type conversion errors'
      ],
      
      strategies: [
        'Validate data before database operations',
        'Use proper error codes for different failure types',
        'Implement retry logic for transient errors',
        'Log detailed error information for debugging'
      ]
    }
  }
} as const;

export const N8N_DATABASE_BEST_PRACTICES = {
  security: [
    'Use parameterized queries to prevent SQL injection',
    'Implement proper authentication and authorization',
    'Encrypt sensitive data at rest and in transit',
    'Regular security audits and penetration testing',
    'Use database connection encryption (SSL/TLS)'
  ],
  
  monitoring: [
    'Monitor query performance and slow queries',
    'Track database connection pool metrics',
    'Set up alerts for error rates and downtime',
    'Monitor disk space and database growth',
    'Track lock contention and deadlocks'
  ],
  
  backup: [
    'Implement regular automated backups',
    'Test backup restoration procedures',
    'Use point-in-time recovery capabilities',
    'Store backups in multiple locations',
    'Document recovery procedures and test them'
  ],
  
  scalability: [
    'Design for horizontal scaling when possible',
    'Implement read replicas for read-heavy workloads',
    'Use database sharding for large datasets',
    'Consider NoSQL alternatives for specific use cases',
    'Plan for data archiving and cleanup strategies'
  ]
} as const;