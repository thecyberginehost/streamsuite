/**
 * Infrastructure and Deployment
 */

export const N8N_PERFORMANCE_MONITORING = {
  description: 'Performance optimization, monitoring, and observability for n8n workflows',
  
  // Performance monitoring
  performanceMonitoring: {
    executionMetrics: {
      duration: 'Total workflow execution time',
      nodeExecutionTimes: 'Individual node performance tracking',
      memoryUsage: 'Memory consumption during execution',
      throughput: 'Items processed per second',
      errorRate: 'Percentage of failed executions',
      concurrency: 'Number of simultaneous executions'
    },
    
    monitoring: {
      realTimeMetrics: 'Live monitoring of workflow performance',
      historicalAnalysis: 'Trend analysis over time',
      alerting: 'Automated alerts for performance degradation',
      dashboards: 'Visual performance dashboards',
      reporting: 'Regular performance reports'
    }
  }
} as const;

export const N8N_ENVIRONMENT_DEPLOYMENT = {
  description: 'Self-hosting configurations, environment variables, and production deployment guidance for n8n',
  
  // Self-hosting configurations
  selfHostingConfigurations: {
    installationMethods: {
      npm: {
        description: 'Install n8n globally using npm',
        installation: `# Install n8n globally
npm install n8n -g

# Start n8n
n8n start

# Alternative - start with custom settings
N8N_BASIC_AUTH_ACTIVE=true \\
N8N_BASIC_AUTH_USER=admin \\
N8N_BASIC_AUTH_PASSWORD=password \\
n8n start`,
        
        systemRequirements: {
          nodeJs: 'Node.js 16.x or higher',
          memory: '512MB minimum, 2GB+ recommended',
          storage: '1GB+ for application and data',
          network: 'Internet access for node installations'
        }
      },
      
      docker: {
        description: 'Run n8n in Docker containers for consistency and isolation',
        basicSetup: `# Run n8n with Docker
docker run -it --rm \\
  --name n8n \\
  -p 5678:5678 \\
  -v ~/.n8n:/home/node/.n8n \\
  n8nio/n8n`,
        
        productionSetup: `# Production Docker setup with environment variables
docker run -d \\
  --name n8n-production \\
  --restart unless-stopped \\
  -p 5678:5678 \\
  -e N8N_BASIC_AUTH_ACTIVE=true \\
  -e N8N_BASIC_AUTH_USER=admin \\
  -e N8N_BASIC_AUTH_PASSWORD=secure_password \\
  -e N8N_HOST=yourdomain.com \\
  -e N8N_PORT=5678 \\
  -e N8N_PROTOCOL=https \\
  -e WEBHOOK_URL=https://yourdomain.com \\
  -e GENERIC_TIMEZONE=UTC \\
  -v n8n_data:/home/node/.n8n \\
  n8nio/n8n`
      }
    },
    
    databaseConfigurations: {
      postgresql: {
        description: 'Recommended database for production environments',
        configuration: `# PostgreSQL Environment Variables
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n_user
DB_POSTGRESDB_PASSWORD=secure_password
DB_POSTGRESDB_SCHEMA=public

# Connection pool settings
DB_POSTGRESDB_POOL_SIZE=20
DB_POSTGRESDB_CONNECTION_TIMEOUT=30000`,
        
        optimizations: {
          indexing: 'CREATE INDEX CONCURRENTLY idx_execution_workflow_id ON execution_entity(workflowId);',
          partitioning: 'Partition execution tables by date for better performance',
          maintenance: 'Regular VACUUM and ANALYZE operations',
          monitoring: 'Monitor query performance and connection pool usage'
        }
      }
    }
  },
  
  // Environment variable patterns
  environmentVariablePatterns: {
    deploymentVariables: {
      coreSettings: {
        N8N_HOST: {
          description: 'Host name n8n runs on',
          example: 'n8n.yourdomain.com',
          required: 'Production deployments'
        },
        
        N8N_PORT: {
          description: 'Port n8n runs on',
          default: 5678,
          example: 'N8N_PORT=5678'
        },
        
        N8N_PROTOCOL: {
          description: 'Protocol n8n runs on',
          options: ['http', 'https'],
          example: 'N8N_PROTOCOL=https'
        },
        
        WEBHOOK_URL: {
          description: 'URL for webhook callbacks',
          example: 'https://n8n.yourdomain.com',
          importance: 'Critical for webhook nodes'
        }
      }
    }
  }
} as const;