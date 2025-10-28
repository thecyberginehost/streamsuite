/**
 * Security & Credentials Management
 */

export const N8N_SECURITY_CREDENTIALS = {
  description: 'Comprehensive security patterns, credential management, and authentication strategies for enterprise workflows',
  
  // Core security principles
  securityPrinciples: {
    leastPrivilege: 'Grant minimum necessary permissions for workflows and credentials',
    defenseInDepth: 'Multiple layers of security controls and validation',
    zeroTrust: 'Verify and validate all access requests regardless of source',
    dataProtection: 'Encrypt sensitive data at rest and in transit',
    auditability: 'Comprehensive logging and monitoring of all security events'
  },

  // Credential management
  credentialManagement: {
    credentialTypes: {
      basicAuth: {
        description: 'Username and password authentication',
        useCase: 'Simple API authentication, legacy systems',
        security: 'Store passwords encrypted, avoid plaintext transmission'
      },
      
      apiKeys: {
        description: 'Token-based authentication for APIs',
        useCase: 'REST APIs, cloud services, third-party integrations',
        bestPractices: [
          'Regular key rotation',
          'Scope limitation',
          'Environment-specific keys',
          'Secure key storage'
        ]
      },
      
      oauth: {
        description: 'OAuth 1.0/2.0 authentication flows',
        useCase: 'Social media APIs, enterprise applications',
        security: 'Secure token storage, refresh token handling, scope management'
      },
      
      certificates: {
        description: 'X.509 certificates for mutual TLS authentication',
        useCase: 'Enterprise B2B integrations, high-security environments',
        management: 'Certificate lifecycle, renewal automation, revocation'
      }
    },

    credentialSharing: {
      principle: 'Least privilege access to credentials',
      behavior: [
        'Shared workflows include credential access',
        'Editors can use but not modify unshared credentials',
        'Node editing restricted without credential access',
        'Separate credential sharing for full access'
      ],
      
      security: [
        'Credential values never exposed to editors',
        'Usage tracking and audit logs',
        'Revokable access control',
        'Scope-limited credential sharing'
      ]
    },

    rotationStrategies: {
      automatic: {
        description: 'Automated credential rotation workflows',
        implementation: [
          'Schedule-based rotation triggers',
          'API-driven key generation',
          'Atomic credential updates',
          'Rollback procedures for failures'
        ]
      },
      
      eventDriven: {
        description: 'Rotate credentials based on security events',
        triggers: [
          'Suspected credential compromise',
          'Employee departure',
          'Compliance requirements',
          'Security incident response'
        ]
      }
    }
  },

  // Authentication patterns
  authenticationPatterns: {
    jwt: {
      description: 'JSON Web Token authentication implementation',
      benefits: ['Stateless authentication', 'Scalable across services', 'Built-in expiration'],
      implementation: `// JWT Authentication Flow
const authenticateWithJWT = async (credentials) => {
  const { username, password } = credentials;
  
  // Step 1: Authenticate user
  const authResponse = await fetch('https://api.provider.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const { access_token, refresh_token, expires_in } = await authResponse.json();
  
  // Step 2: Store tokens securely
  await storeCredentials({
    access_token,
    refresh_token,
    expires_at: Date.now() + (expires_in * 1000)
  });
  
  return access_token;
};`
    },

    oauth2Implementation: {
      description: 'OAuth 2.0 implementation with proper token management',
      flow: `// OAuth 2.0 Authorization Code Flow
const oauth2Flow = {
  // Step 1: Authorization URL
  authorizationUrl: 'https://provider.com/oauth/authorize?' +
    'response_type=code&' +
    'client_id=CLIENT_ID&' +
    'redirect_uri=REDIRECT_URI&' +
    'scope=read write&' +
    'state=RANDOM_STATE',
  
  // Step 2: Exchange code for tokens
  tokenExchange: async (authCode, state) => {
    const response = await fetch('https://provider.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: authCode,
        redirect_uri: REDIRECT_URI
      })
    });
    
    return await response.json();
  },
  
  // Step 3: Refresh tokens
  refreshToken: async (refreshToken) => {
    const response = await fetch('https://provider.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken
      })
    });
    
    return await response.json();
  }
};`
    },

    apiKeyRotation: {
      description: 'Implement automatic API key rotation',
      example: `// API Key Rotation Pattern
const rotateApiKey = async () => {
  try {
    // Generate new API key
    const newKeyResponse = await fetch('https://api.provider.com/keys', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${currentApiKey}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: \`Auto-rotated-\${Date.now()}\`,
        permissions: ['read', 'write']
      })
    });
    
    const newKey = await newKeyResponse.json();
    
    // Test new key
    const testResponse = await fetch('https://api.provider.com/test', {
      headers: { 'Authorization': \`Bearer \${newKey.key}\` }
    });
    
    if (testResponse.ok) {
      // Update credential in n8n
      await updateCredential(credentialId, { apiKey: newKey.key });
      
      // Revoke old key
      await fetch(\`https://api.provider.com/keys/\${currentKeyId}\`, {
        method: 'DELETE',
        headers: { 'Authorization': \`Bearer \${newKey.key}\` }
      });
      
      return newKey.key;
    }
  } catch (error) {
    console.error('API key rotation failed:', error);
    throw error;
  }
};`
    }
  },

  // Security monitoring and compliance
  securityMonitoring: {
    auditingFeatures: {
      credentialUsage: 'Track when and how credentials are used',
      accessPatterns: 'Monitor unusual access patterns or failures',
      permissionChanges: 'Log all credential permission modifications',
      complianceReporting: 'Generate reports for security audits'
    },
    
    alerting: {
      failedAuthentications: 'Alert on repeated authentication failures',
      unusualAccess: 'Detect access from unexpected locations or times',
      permissionEscalation: 'Monitor for unauthorized permission changes',
      credentialExpiry: 'Warn before credentials expire'
    },
    
    complianceFrameworks: {
      soc2: 'SOC 2 Type II compliance considerations',
      gdpr: 'GDPR requirements for credential data',
      pciDss: 'PCI DSS standards for payment credentials',
      hipaa: 'HIPAA compliance for healthcare integrations'
    }
  }
} as const;