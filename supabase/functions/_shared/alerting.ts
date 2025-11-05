/**
 * Shared alerting utilities for sending security notifications
 */

export async function sendSlackAlert(message: string, severity: 'critical' | 'high' | 'medium' | 'low', metadata?: any) {
  const slackWebhookUrl = Deno.env.get('SLACK_SECURITY_WEBHOOK_URL')

  if (!slackWebhookUrl) {
    console.warn('SLACK_SECURITY_WEBHOOK_URL not configured, skipping alert')
    return
  }

  const emoji = severity === 'critical' ? '🚨' : severity === 'high' ? '⚠️' : '📊'
  const color = severity === 'critical' ? '#FF0000' : severity === 'high' ? '#FFA500' : '#FFFF00'

  try {
    await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${emoji} Security Alert: ${message}`,
        attachments: [{
          color,
          fields: [
            { title: 'Severity', value: severity.toUpperCase(), short: true },
            { title: 'Timestamp', value: new Date().toISOString(), short: true },
            ...(metadata ? Object.entries(metadata).map(([key, value]) => ({
              title: key,
              value: String(value),
              short: true
            })) : [])
          ]
        }]
      })
    })
  } catch (error) {
    console.error('Failed to send Slack alert:', error)
  }
}

export async function sendDiscordAlert(message: string, severity: 'critical' | 'high' | 'medium' | 'low', metadata?: any) {
  const discordWebhookUrl = Deno.env.get('DISCORD_SECURITY_WEBHOOK_URL')

  if (!discordWebhookUrl) {
    return
  }

  const color = severity === 'critical' ? 0xFF0000 : severity === 'high' ? 0xFFA500 : 0xFFFF00

  try {
    await fetch(discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: '🚨 Security Alert',
          description: message,
          color,
          fields: metadata ? Object.entries(metadata).map(([key, value]) => ({
            name: key,
            value: String(value),
            inline: true
          })) : [],
          timestamp: new Date().toISOString()
        }]
      })
    })
  } catch (error) {
    console.error('Failed to send Discord alert:', error)
  }
}
