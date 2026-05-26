#!/usr/bin/env bash
# StreamSuite production-readiness setup script.
# Run on Hostinger as filthy, with sudo available.
#
# Usage: sudo bash ~/streamsuite/prod-setup.sh
#
# Idempotent — safe to re-run. Each step prints its action and outcome.

set -euo pipefail

LOGROTATE_CONF=/etc/logrotate.d/streamsuite
LOGROTATE_SRC=/home/filthy/streamsuite/streamsuite-logs-logrotate

PM2_PATH=/home/filthy/.nvm/versions/node/v22.22.0/bin/pm2
PM2_LIB=/home/filthy/.nvm/versions/node/v22.22.0/lib/node_modules/pm2/bin/pm2
NODE_BIN=/home/filthy/.nvm/versions/node/v22.22.0/bin

echo "─── 1/3 ─── Install logrotate config ───"
if [[ ! -f $LOGROTATE_SRC ]]; then
  echo "ERROR: $LOGROTATE_SRC not found"
  exit 1
fi
cp $LOGROTATE_SRC $LOGROTATE_CONF
chown root:root $LOGROTATE_CONF
chmod 0644 $LOGROTATE_CONF
echo "✓ installed → $LOGROTATE_CONF"
echo "  dry-run check:"
logrotate -d $LOGROTATE_CONF 2>&1 | head -10 || true

echo
echo "─── 2/3 ─── Wire pm2 to systemd for boot persistence ───"
# pm2 startup generates a systemd unit that runs pm2 resurrect at boot.
# pm2 save then dumps current process list to ~/.pm2/dump.pm2 so the
# resurrected pm2 daemon brings streamsuite back up.
env PATH=$NODE_BIN:$PATH $PM2_LIB startup systemd -u filthy --hp /home/filthy
echo "  (the above command was just executed — pm2-filthy systemd unit installed)"
sudo -u filthy env PATH=$NODE_BIN:$PATH $PM2_PATH save
systemctl status pm2-filthy --no-pager | head -5 || true
echo "✓ pm2-filthy enabled — streamsuite will auto-start on reboot"

echo
echo "─── 3/3 ─── Verify ───"
echo "  logrotate:"
ls -la $LOGROTATE_CONF
echo "  pm2 systemd:"
systemctl is-enabled pm2-filthy
echo "  pm2 process list (saved):"
sudo -u filthy env PATH=$NODE_BIN:$PATH $PM2_PATH list 2>&1 | tail -8

echo
echo "─── DONE ───"
echo "Next user-action items (separate steps):"
echo "  • UptimeRobot signup → https://uptimerobot.com → monitor https://streamsuite.io/api/health"
echo "  • Resend bounce webhook → Resend dashboard → Webhooks → URL = https://streamsuite.io/api/internal/resend-webhook"
echo "    Copy whsec_ secret into ~/streamsuite/.env.local as RESEND_WEBHOOK_SECRET=..."
echo "    Then: pm2 reload streamsuite"
echo "  • admin.streamsuite.io subdomain: AWS Route53 A record → 217.15.168.103, then run certbot"
