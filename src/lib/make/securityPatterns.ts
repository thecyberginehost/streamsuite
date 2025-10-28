/**
 * Make.com Security and Authentication Patterns
 * Comprehensive security practices and authentication methods
 */

export const MAKE_SECURITY_PATTERNS = {
  // Authentication Methods
  authentication: {
    oauth2: {
      description: "OAuth 2.0 authorization flow for secure third-party access",
      use_cases: ["Google services", "Microsoft 365", "Social media APIs", "SaaS platforms"],
      implementation: {
        setup: "Automatic browser-based authorization flow",
        refresh: "Automatic token refresh handling",
        scopes: "Granular permission control",
        security: "Secure credential storage with encryption"
      },
      best_practices: [
        "Use minimal required scopes",
        "Regularly audit connected applications",
        "Monitor token usage and expiration",
        "Implement proper error handling for expired tokens"
      ]
    },
    api_keys: {
      description: "API key-based authentication for direct service access",
      storage: "Encrypted storage in Make.com connections",
      rotation: "Regular API key rotation procedures",
      validation: "Connection testing and health checks",
      security_measures: [
        "Store keys in Make.com connections, never in scenario code",
        "Use environment-specific keys (dev/staging/prod)",
        "Monitor API key usage and rate limits",
        "Implement key rotation schedules"
      ]
    },
    webhook_security: {
      signature_verification: "Validate webhook signatures for authenticity",
      ip_whitelisting: "Restrict webhook sources by IP address",
      https_enforcement: "Require HTTPS for all webhook endpoints",
      payload_validation: "Validate webhook payload structure and content",
      rate_limiting: "Implement rate limiting to prevent abuse"
    }
  },

  // Data Protection & Privacy
  data_protection: {
    encryption: {
      at_rest: "All data encrypted using AES-256 encryption",
      in_transit: "TLS 1.2+ encryption for all data transmission",
      keys: "Secure key management with regular rotation"
    },
    pii_handling: {
      identification: "Identify and tag personally identifiable information",
      masking: "Mask sensitive data in logs and error messages",
      retention: "Implement data retention policies",
      deletion: "Secure data deletion procedures"
    },
    compliance: {
      gdpr: {
        data_mapping: "Document data flows and processing activities",
        consent_tracking: "Track user consent and preferences",
        right_to_deletion: "Implement data deletion workflows",
        data_portability: "Enable data export capabilities",
        breach_notification: "Automated breach detection and notification"
      },
      hipaa: {
        baa_compliance: "Business Associate Agreement requirements",
        access_controls: "Role-based access to PHI data",
        audit_trails: "Comprehensive logging of PHI access",
        encryption: "End-to-end encryption for health data"
      },
      sox_compliance: {
        change_control: "Documented change management processes",
        access_review: "Regular access reviews and certifications",
        segregation_duties: "Separation of development and production access",
        audit_logging: "Immutable audit trails for financial data"
      }
    }
  },

  // Access Control & Governance
  access_control: {
    rbac: {
      roles: {
        admin: "Full system access and user management",
        developer: "Scenario creation and modification",
        operator: "Scenario execution and monitoring",
        viewer: "Read-only access to scenarios and logs"
      },
      permissions: {
        scenario_management: "Create, edit, delete scenarios",
        connection_management: "Manage API connections",
        data_access: "Access to sensitive data stores",
        user_management: "Add/remove team members"
      }
    },
    team_governance: {
      organization_structure: "Hierarchical team organization",
      workspace_isolation: "Isolated environments per team/project",
      resource_sharing: "Controlled sharing of connections and scenarios",
      approval_workflows: "Multi-stage approval for critical changes"
    }
  },

  // Security Monitoring & Incident Response
  monitoring: {
    threat_detection: {
      anomaly_detection: "Unusual usage pattern identification",
      failed_attempts: "Monitor authentication failures",
      data_exfiltration: "Detect unusual data access patterns",
      suspicious_ips: "Flag connections from unusual locations"
    },
    audit_logging: {
      user_actions: "Log all user actions with timestamps",
      data_access: "Track all data read/write operations",
      configuration_changes: "Log scenario and connection changes",
      system_events: "Monitor system-level security events"
    },
    incident_response: {
      detection: "Automated threat detection and alerting",
      containment: "Immediate access revocation capabilities",
      investigation: "Comprehensive audit trail analysis",
      recovery: "Secure restoration procedures",
      communication: "Stakeholder notification processes"
    }
  },

  // Secure Development Practices
  secure_development: {
    code_security: {
      input_validation: "Validate all external inputs",
      output_encoding: "Properly encode outputs to prevent injection",
      error_handling: "Secure error handling without data leakage",
      secret_management: "Never hardcode secrets in scenarios"
    },
    testing: {
      security_testing: "Regular security testing of scenarios",
      penetration_testing: "External security assessments",
      vulnerability_scanning: "Automated vulnerability detection",
      code_review: "Peer review for security issues"
    },
    deployment: {
      environment_separation: "Isolated dev/staging/production environments",
      change_management: "Controlled deployment processes",
      rollback_procedures: "Quick rollback capabilities for security issues",
      monitoring: "Continuous security monitoring post-deployment"
    }
  }
};

export const MAKE_SECURITY_EXAMPLES = {
  // Secure webhook implementation
  secure_webhook: {
    description: "Implement secure webhook with signature verification",
    modules: ["webhook", "crypto", "builtin:Filter", "builtin:Router"],
    pattern: "Webhook → Signature verification → Payload validation → Processing",
    security_checks: [
      "Verify webhook signature using shared secret",
      "Validate payload structure and required fields",
      "Check timestamp to prevent replay attacks",
      "Rate limit to prevent abuse"
    ]
  },

  // PII data processing
  pii_processing: {
    description: "Securely process personally identifiable information",
    modules: ["data-masking", "encryption", "audit-log", "gdpr-compliance"],
    pattern: "Data input → PII detection → Masking/encryption → Processing → Audit log",
    privacy_controls: [
      "Automatic PII detection and classification",
      "Field-level encryption for sensitive data",
      "Audit trail for all PII access",
      "Consent verification before processing"
    ]
  },

  // Multi-tenant security
  multi_tenant: {
    description: "Implement secure multi-tenant data isolation",
    modules: ["tenant-filter", "rbac", "data-isolation", "audit"],
    pattern: "Request → Tenant identification → Access control → Data filtering → Response",
    isolation_methods: [
      "Tenant-based data filtering at all levels",
      "Role-based access control per tenant",
      "Encrypted tenant-specific data stores",
      "Cross-tenant access monitoring"
    ]
  }
};