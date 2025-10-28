/**
 * Email Service
 *
 * Handles transactional email sending via Resend or SendGrid
 */

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Email templates
export const EMAIL_TEMPLATES = {
  welcome: (userName: string, credits: number): EmailTemplate => ({
    subject: 'Welcome to StreamSuite - Your Free Credits Are Ready',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to StreamSuite!</h1>
        <p>Hi ${userName},</p>
        <p>Thanks for signing up! You're now ready to start building workflow automations in seconds.</p>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Quick Start Guide:</h3>
          <ol>
            <li>Go to the Generator page</li>
            <li>Describe your workflow in plain English</li>
            <li>Download the JSON and import to n8n</li>
          </ol>
        </div>

        <p><strong>Your Starting Balance: ${credits} credits</strong></p>
        <p>Each workflow generation costs 1 credit.</p>

        <a href="https://app.streamsuite.io" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Start Generating Workflows
        </a>

        <p style="margin-top: 40px; color: #6b7280; font-size: 14px;">
          Need help? Reply to this email or visit our docs.
        </p>
      </div>
    `,
    text: `
      Welcome to StreamSuite!

      Hi ${userName},

      Thanks for signing up! You're now ready to start building workflow automations in seconds.

      Quick Start Guide:
      1. Go to the Generator page
      2. Describe your workflow in plain English
      3. Download the JSON and import to n8n

      Your Starting Balance: ${credits} credits
      Each workflow generation costs 1 credit.

      Start generating: https://app.streamsuite.io

      Need help? Reply to this email or visit our docs.
    `
  }),

  creditsLow: (userName: string, remainingCredits: number): EmailTemplate => ({
    subject: `You Have ${remainingCredits} Credits Left - Upgrade to Keep Building`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f59e0b;">Low on Credits</h1>
        <p>Hi ${userName},</p>
        <p>You have <strong>${remainingCredits} credits</strong> remaining.</p>

        <p>To keep generating workflows without interruption, consider upgrading your plan or your credits will reset next billing cycle.</p>

        <a href="https://streamsuite.io/pricing" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          View Plans
        </a>

        <p style="margin-top: 40px; color: #6b7280; font-size: 14px;">
          Questions? Reply to this email.
        </p>
      </div>
    `,
    text: `
      Low on Credits

      Hi ${userName},

      You have ${remainingCredits} credits remaining.

      To keep generating workflows without interruption, consider upgrading your plan or your credits will reset next billing cycle.

      View plans: https://streamsuite.io/pricing

      Questions? Reply to this email.
    `
  }),

  creditsDepleted: (userName: string, resetDate: string): EmailTemplate => ({
    subject: "You're Out of Credits - Upgrade to Continue",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ef4444;">Out of Credits</h1>
        <p>Hi ${userName},</p>
        <p>You've used all your credits for this month.</p>

        ${resetDate ? `<p>Your credits will reset on <strong>${resetDate}</strong>.</p>` : ''}

        <p>Want to keep building? Upgrade to a paid plan for more credits:</p>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <ul style="list-style: none; padding: 0;">
            <li>✓ <strong>Starter:</strong> 25 credits/month - $19</li>
            <li>✓ <strong>Pro:</strong> 100 credits/month - $49</li>
            <li>✓ <strong>Growth:</strong> 250 credits/month + batch generation - $99</li>
          </ul>
        </div>

        <a href="https://streamsuite.io/pricing" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Upgrade Your Plan
        </a>
      </div>
    `,
    text: `
      Out of Credits

      Hi ${userName},

      You've used all your credits for this month.

      ${resetDate ? `Your credits will reset on ${resetDate}.` : ''}

      Want to keep building? Upgrade to a paid plan:
      - Starter: 25 credits/month - $19
      - Pro: 100 credits/month - $49
      - Growth: 250 credits/month + batch generation - $99

      Upgrade: https://streamsuite.io/pricing
    `
  }),

  monthlyRefresh: (userName: string, newBalance: number): EmailTemplate => ({
    subject: `Your Credits Have Been Refreshed - ${newBalance} Credits Ready`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Credits Refreshed!</h1>
        <p>Hi ${userName},</p>
        <p>Your monthly credits have been refreshed.</p>

        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="margin-top: 0;">New Balance: ${newBalance} credits</h3>
        </div>

        <p>Ready to build more automations? Start generating workflows now!</p>

        <a href="https://app.streamsuite.io" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Start Generating
        </a>
      </div>
    `,
    text: `
      Credits Refreshed!

      Hi ${userName},

      Your monthly credits have been refreshed.

      New Balance: ${newBalance} credits

      Ready to build more automations? Start generating workflows now!

      Start generating: https://app.streamsuite.io
    `
  }),

  paymentFailed: (userName: string): EmailTemplate => ({
    subject: 'Payment Failed - Update Your Payment Method',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ef4444;">Payment Failed</h1>
        <p>Hi ${userName},</p>
        <p>We were unable to process your recent payment.</p>

        <p><strong>Action Required:</strong> Please update your payment method within 3 days to avoid service interruption.</p>

        <a href="https://app.streamsuite.io/settings" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Update Payment Method
        </a>

        <p style="margin-top: 40px; color: #6b7280; font-size: 14px;">
          Questions? Reply to this email or contact support.
        </p>
      </div>
    `,
    text: `
      Payment Failed

      Hi ${userName},

      We were unable to process your recent payment.

      Action Required: Please update your payment method within 3 days to avoid service interruption.

      Update payment: https://app.streamsuite.io/settings

      Questions? Reply to this email or contact support.
    `
  }),

  paymentSuccess: (userName: string, amount: number, creditsAdded: number): EmailTemplate => ({
    subject: 'Payment Successful - Your Credits Are Ready',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Payment Successful</h1>
        <p>Hi ${userName},</p>
        <p>Thank you for your payment!</p>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Amount Paid:</strong> $${amount.toFixed(2)}</p>
          <p style="margin: 10px 0 0 0;"><strong>Credits Added:</strong> ${creditsAdded}</p>
        </div>

        <p>Your credits are ready to use. Start generating workflows now!</p>

        <a href="https://app.streamsuite.io" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Start Generating
        </a>

        <p style="margin-top: 40px; color: #6b7280; font-size: 14px;">
          View receipt: <a href="https://app.streamsuite.io/settings">Account Settings</a>
        </p>
      </div>
    `,
    text: `
      Payment Successful

      Hi ${userName},

      Thank you for your payment!

      Amount Paid: $${amount.toFixed(2)}
      Credits Added: ${creditsAdded}

      Your credits are ready to use. Start generating workflows now!

      Start generating: https://app.streamsuite.io

      View receipt: https://app.streamsuite.io/settings
    `
  }),

  subscriptionCancelled: (userName: string, endDate: string): EmailTemplate => ({
    subject: "Subscription Cancelled - You'll Be Missed",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Subscription Cancelled</h1>
        <p>Hi ${userName},</p>
        <p>Your subscription has been cancelled.</p>

        <p>You'll continue to have access until <strong>${endDate}</strong>.</p>

        <p>We'd love to hear your feedback. What could we have done better?</p>

        <a href="mailto:feedback@streamsuite.io" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Send Feedback
        </a>

        <p style="margin-top: 40px;">Changed your mind? You can reactivate anytime.</p>

        <a href="https://streamsuite.io/pricing" style="color: #2563eb; text-decoration: none;">
          Reactivate Subscription →
        </a>
      </div>
    `,
    text: `
      Subscription Cancelled

      Hi ${userName},

      Your subscription has been cancelled.

      You'll continue to have access until ${endDate}.

      We'd love to hear your feedback. What could we have done better?

      Send feedback: feedback@streamsuite.io

      Changed your mind? You can reactivate anytime.
      Reactivate: https://streamsuite.io/pricing
    `
  })
};

/**
 * Send an email using Resend (or SendGrid as fallback)
 *
 * For now, this is a stub. To implement:
 * 1. Sign up for Resend (https://resend.com)
 * 2. Add VITE_RESEND_API_KEY to .env
 * 3. Create Supabase Edge Function for email sending
 * 4. Call the edge function from here
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📧 Email would be sent:', {
      to,
      subject: template.subject,
      preview: template.text.substring(0, 100)
    });

    // TODO: Implement actual email sending
    // For now, just log to console
    // In production, this will call a Supabase Edge Function:

    /*
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject: template.subject,
        html: template.html,
        text: template.text
      }
    });

    if (error) throw error;
    return { success: true };
    */

    return { success: true };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(userEmail: string, userName: string, credits: number) {
  const template = EMAIL_TEMPLATES.welcome(userName, credits);
  return sendEmail(userEmail, template);
}

/**
 * Send low credits warning
 */
export async function sendLowCreditsEmail(userEmail: string, userName: string, remainingCredits: number) {
  const template = EMAIL_TEMPLATES.creditsLow(userName, remainingCredits);
  return sendEmail(userEmail, template);
}

/**
 * Send credits depleted notification
 */
export async function sendCreditsDepletedEmail(userEmail: string, userName: string, resetDate?: string) {
  const template = EMAIL_TEMPLATES.creditsDepleted(userName, resetDate || '');
  return sendEmail(userEmail, template);
}

/**
 * Send monthly credit refresh notification
 */
export async function sendMonthlyRefreshEmail(userEmail: string, userName: string, newBalance: number) {
  const template = EMAIL_TEMPLATES.monthlyRefresh(userName, newBalance);
  return sendEmail(userEmail, template);
}

/**
 * Send payment failed notification
 */
export async function sendPaymentFailedEmail(userEmail: string, userName: string) {
  const template = EMAIL_TEMPLATES.paymentFailed(userName);
  return sendEmail(userEmail, template);
}

/**
 * Send payment success confirmation
 */
export async function sendPaymentSuccessEmail(
  userEmail: string,
  userName: string,
  amount: number,
  creditsAdded: number
) {
  const template = EMAIL_TEMPLATES.paymentSuccess(userName, amount, creditsAdded);
  return sendEmail(userEmail, template);
}

/**
 * Send subscription cancelled notification
 */
export async function sendSubscriptionCancelledEmail(
  userEmail: string,
  userName: string,
  endDate: string
) {
  const template = EMAIL_TEMPLATES.subscriptionCancelled(userName, endDate);
  return sendEmail(userEmail, template);
}
