/**
 * Make.com Notification Patterns
 * Comprehensive guide for implementing notifications across multiple channels
 */

export const MAKE_NOTIFICATION_PATTERNS = {
  // Email Notifications
  email: {
    send_email_module: {
      description: "Send emails via SMTP or email service providers",
      configuration: {
        connection: "SMTP server or email service credentials",
        from: "Sender email address and display name",
        to: "Recipient email addresses (single or multiple)",
        subject: "Email subject line with dynamic content",
        content: "HTML or plain text email body",
        attachments: "Optional file attachments"
      },
      features: {
        html_templates: "Rich HTML email templates with CSS",
        dynamic_content: "Insert variables and expressions",
        multiple_recipients: "Send to multiple recipients simultaneously",
        cc_bcc: "Carbon copy and blind carbon copy support",
        reply_to: "Custom reply-to addresses"
      },
      examples: {
        welcome_email: {
          subject: "Welcome to {{company_name}}, {{user_name}}!",
          html_body: `
            <h1>Welcome {{user_name}}!</h1>
            <p>Thank you for joining {{company_name}}. Your account has been created successfully.</p>
            <p>Your login details:</p>
            <ul>
              <li>Email: {{user_email}}</li>
              <li>Account ID: {{account_id}}</li>
            </ul>
            <a href="{{login_url}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none;">
              Login to Your Account
            </a>
          `,
          attachments: ["welcome_guide.pdf", "terms_of_service.pdf"]
        },
        alert_email: {
          subject: "🚨 ALERT: {{alert_type}} - {{timestamp}}",
          html_body: `
            <h2 style="color: #dc3545;">System Alert</h2>
            <p><strong>Alert Type:</strong> {{alert_type}}</p>
            <p><strong>Severity:</strong> {{severity}}</p>
            <p><strong>Description:</strong> {{description}}</p>
            <p><strong>Time:</strong> {{timestamp}}</p>
            <hr>
            <p>Please investigate this issue immediately.</p>
          `
        }
      }
    },
    gmail_integration: {
      description: "Send emails using Gmail API with OAuth authentication",
      features: [
        "Send from Gmail accounts",
        "Access to Gmail labels and threads",
        "Rich formatting and attachments",
        "Integration with Google Workspace"
      ],
      modules: {
        send_email: "Send emails through Gmail API",
        create_draft: "Create draft emails for review",
        watch_emails: "Monitor incoming emails for automation triggers"
      }
    },
    email_validation: {
      patterns: {
        recipient_validation: "Validate email addresses before sending",
        bounce_handling: "Process bounced email notifications",
        unsubscribe_management: "Handle unsubscribe requests automatically"
      }
    }
  },

  // Slack Notifications
  slack: {
    send_message: {
      description: "Send messages to Slack channels or users",
      configuration: {
        connection: "Slack workspace OAuth connection",
        channel: "Target channel (by name or ID) or direct message",
        message: "Message text with Slack markdown formatting",
        thread: "Reply to existing message thread",
        username: "Custom username for the bot message",
        icon: "Custom icon or emoji for the message"
      },
      formatting: {
        markdown: "*bold*, _italic_, ~strikethrough~, `code`",
        mentions: "<@user_id>, <@channel>, <!here>, <!everyone>",
        links: "<https://example.com|Link Text>",
        channels: "<#channel_id|channel_name>"
      },
      examples: {
        system_alert: {
          channel: "#alerts",
          message: `
🚨 *System Alert* 🚨
*Severity:* {{severity}}
*Service:* {{service_name}}
*Error:* {{error_message}}
*Time:* {{timestamp}}

<@channel> Please investigate immediately!
          `,
          thread_ts: null
        },
        daily_report: {
          channel: "#reports",
          message: `
📊 *Daily Report - {{date}}*

• Total Orders: {{total_orders}}
• Revenue: $\{{total_revenue}}
• New Customers: {{new_customers}}
• Top Product: {{top_product}}

View full report: <{{report_url}}|Dashboard>
          `
        }
      }
    },
    interactive_messages: {
      description: "Create messages with buttons and interactive elements",
      components: {
        buttons: "Action buttons that trigger workflows",
        menus: "Dropdown menus for user selection",
        date_pickers: "Calendar interfaces for date selection"
      },
      blocks: {
        section: "Text content with optional accessories",
        divider: "Visual separator between content",
        image: "Display images in messages",
        actions: "Interactive components like buttons"
      },
      example: {
        approval_request: {
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "*Approval Required*\nExpense Report: ${{amount}}\nSubmitted by: {{employee_name}}"
              }
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: { type: "plain_text", text: "Approve" },
                  style: "primary",
                  value: "approve_{{expense_id}}"
                },
                {
                  type: "button",
                  text: { type: "plain_text", text: "Reject" },
                  style: "danger",
                  value: "reject_{{expense_id}}"
                }
              ]
            }
          ]
        }
      }
    },
    file_sharing: {
      upload_file: {
        description: "Upload files and documents to Slack",
        parameters: {
          file: "File content or URL to upload",
          filename: "Name for the uploaded file",
          channels: "Channels to share the file in",
          title: "Title for the file",
          initial_comment: "Message to accompany the file"
        }
      }
    }
  },

  // SMS Notifications
  sms: {
    twilio_integration: {
      description: "Send SMS messages using Twilio service",
      configuration: {
        account_sid: "Twilio account identifier",
        auth_token: "Twilio authentication token",
        from_number: "Twilio phone number (sender)",
        to_number: "Recipient phone number"
      },
      message_types: {
        standard_sms: "Regular text messages up to 160 characters",
        long_sms: "Multi-part messages for longer content",
        unicode_sms: "Support for emoji and international characters"
      },
      examples: {
        verification_code: {
          message: "Your verification code is: {{verification_code}}. This code expires in 10 minutes.",
          from: "+1234567890",
          to: "{{user_phone}}"
        },
        order_update: {
          message: "Hi {{customer_name}}, your order #{{order_id}} has been shipped! Track at: {{tracking_url}}",
          from: "+1234567890",
          to: "{{customer_phone}}"
        },
        emergency_alert: {
          message: "🚨 URGENT: {{alert_message}}. Please respond immediately. Time: {{timestamp}}",
          from: "+1234567890",
          to: ["{{manager_phone}}", "{{admin_phone}}"]
        }
      }
    },
    other_sms_providers: {
      nexmo: "Vonage/Nexmo SMS API integration",
      messagebird: "MessageBird SMS service",
      aws_sns: "Amazon SNS for SMS delivery"
    }
  },

  // Discord Notifications
  discord: {
    send_message: {
      description: "Send messages to Discord channels via webhooks",
      configuration: {
        webhook_url: "Discord webhook URL for the target channel",
        content: "Message content with Discord markdown",
        username: "Custom username for the webhook",
        avatar_url: "Custom avatar image URL"
      },
      formatting: {
        markdown: "**bold**, *italic*, __underline__, ~~strikethrough~~, `code`",
        code_blocks: "```language\ncode here\n```",
        mentions: "<@user_id>, <@&role_id>, <#channel_id>",
        emojis: ":emoji_name: or custom <:name:id>"
      },
      embeds: {
        description: "Rich embed messages with colors, fields, and images",
        structure: {
          title: "Embed title",
          description: "Main embed content",
          color: "Hex color code for the embed border",
          fields: "Array of field objects with name and value",
          thumbnail: "Small image in top-right corner",
          image: "Large image in the embed",
          footer: "Footer text and icon"
        },
        example: {
          title: "Server Status Update",
          description: "All systems operational",
          color: 0x00ff00,
          fields: [
            { name: "Uptime", value: "99.9%", inline: true },
            { name: "Response Time", value: "45ms", inline: true }
          ],
          timestamp: "{{now}}"
        }
      }
    }
  },

  // Push Notifications
  push_notifications: {
    firebase: {
      description: "Send push notifications to mobile apps via Firebase",
      configuration: {
        server_key: "Firebase server key for authentication",
        device_tokens: "Target device registration tokens",
        topic: "Topic for broadcasting to multiple devices"
      },
      payload: {
        notification: {
          title: "Notification title",
          body: "Notification body text",
          icon: "Notification icon",
          sound: "Notification sound"
        },
        data: {
          custom_key: "custom_value",
          action: "open_screen",
          screen_id: "product_details"
        }
      }
    },
    one_signal: {
      description: "Cross-platform push notification service",
      features: ["iOS, Android, Web push", "Audience targeting", "A/B testing", "Analytics"]
    }
  },

  // Multi-Channel Notification Patterns
  notification_strategies: {
    escalation_pattern: {
      description: "Escalate notifications through multiple channels based on response",
      flow: "Email → Wait 15min → SMS → Wait 30min → Phone Call → Wait 1hr → Manager Alert",
      implementation: {
        modules: ["Send Email", "Sleep", "Check Response", "Send SMS", "Sleep", "Phone Alert"],
        tracking: "Use Data Store to track notification status and responses"
      }
    },
    preference_based: {
      description: "Send notifications based on user preferences",
      flow: "Get User Preferences → Router → [Email Route] | [SMS Route] | [Slack Route]",
      preferences: {
        channels: ["email", "sms", "slack", "push"],
        urgency_levels: ["low: email only", "medium: email + push", "high: all channels"],
        quiet_hours: "Respect user's do-not-disturb settings"
      }
    },
    broadcast_pattern: {
      description: "Send notifications to multiple channels simultaneously",
      flow: "Trigger → Router → [Email to All] + [Slack to Teams] + [SMS to Managers]",
      use_cases: ["System outages", "Company announcements", "Emergency alerts"]
    },
    digest_pattern: {
      description: "Batch notifications into periodic digests",
      flow: "Collect Events → Store in Data Store → Schedule → Aggregate → Send Digest",
      timing: ["Hourly summaries", "Daily reports", "Weekly newsletters"],
      implementation: "Use Data Store to collect events, then aggregate and send periodic summaries"
    }
  },

  // Notification Content and Personalization
  content_strategies: {
    personalization: {
      user_data: "Include user name, preferences, and relevant context",
      behavior_based: "Customize content based on user actions and history",
      location_aware: "Include timezone and location-specific information"
    },
    formatting: {
      subject_lines: "Clear, actionable subject lines with urgency indicators",
      message_structure: "Lead with most important information",
      call_to_action: "Clear next steps and action buttons",
      branding: "Consistent visual identity and tone of voice"
    },
    accessibility: {
      plain_text_alternatives: "Provide plain text versions of HTML emails",
      screen_reader_friendly: "Use proper heading structure and alt text",
      color_contrast: "Ensure sufficient contrast for readability"
    }
  },

  // Monitoring and Analytics
  tracking: {
    delivery_tracking: {
      email: "Track sent, delivered, opened, clicked, bounced",
      sms: "Track sent, delivered, failed",
      push: "Track sent, delivered, opened, converted"
    },
    engagement_metrics: {
      open_rates: "Percentage of emails opened",
      click_through_rates: "Percentage of links clicked",
      response_rates: "Percentage of notifications that generated responses",
      unsubscribe_rates: "Rate of opt-outs by channel"
    },
    error_handling: {
      failed_deliveries: "Log and retry failed notifications",
      invalid_addresses: "Handle bounce-backs and invalid contacts",
      rate_limiting: "Respect service provider rate limits",
      fallback_channels: "Use alternative channels when primary fails"
    }
  }
};

// Common notification workflow examples
export const MAKE_NOTIFICATION_EXAMPLES = {
  order_confirmation: {
    name: "E-commerce Order Confirmation",
    description: "Multi-channel order confirmation workflow",
    channels: ["Email", "SMS", "Push Notification"],
    flow: [
      "Order Webhook",
      "Get Customer Preferences", 
      "Router (by preference)",
      "Send Email Confirmation",
      "Send SMS Update",
      "Send Push Notification"
    ],
    personalization: "Include order details, delivery estimate, tracking info"
  },
  system_monitoring: {
    name: "System Health Monitoring",
    description: "Alert system for infrastructure monitoring",
    escalation: ["Slack → Email → SMS → Phone"],
    severity_levels: {
      low: "Slack notification only",
      medium: "Slack + Email",
      high: "All channels + phone call",
      critical: "Immediate all-hands alert"
    }
  },
  customer_support: {
    name: "Customer Support Ticket System",
    description: "Automated customer support notifications",
    triggers: ["New ticket", "Status update", "Resolution"],
    channels: {
      customer: "Email updates with ticket status",
      agent: "Slack notifications for new assignments",
      manager: "Daily digest of ticket metrics"
    }
  }
};