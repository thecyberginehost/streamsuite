/**
 * User Audit Log Component
 * Shows detailed audit logs for a specific user (admin only)
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Activity,
  Clock,
  MapPin,
  Monitor,
  ChevronDown,
  ChevronUp,
  Download,
  BookOpen,
  Globe
} from 'lucide-react';
import {
  getUserAuditLogs,
  getUserActivitySummary,
  getUserThreatScore,
  getUserSecurityIncidents,
  exportAuditLogsCSV,
  formatActionType,
  formatThreatSeverity,
  type UserActivitySummary,
  type SecurityIncident
} from '@/services/auditService';
import EventCodeLegend from './EventCodeLegend';
import { getEventCode } from '@/lib/eventCodes';

interface UserAuditLogProps {
  userId: string;
  userEmail: string;
}

export default function UserAuditLog({ userId, userEmail }: UserAuditLogProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<UserActivitySummary | null>(null);
  const [threatScore, setThreatScore] = useState<number>(0);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [showOnlyThreats, setShowOnlyThreats] = useState(false);
  const [showLegendDialog, setShowLegendDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    setLoading(true);

    try {
      // Load all data in parallel
      const [logsData, summaryData, threatScoreData, incidentsData] = await Promise.all([
        getUserAuditLogs(userId),
        getUserActivitySummary(userId),
        getUserThreatScore(userId),
        getUserSecurityIncidents(userId)
      ]);

      setLogs(logsData);
      setSummary(summaryData);
      setThreatScore(threatScoreData);
      setIncidents(incidentsData);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = showOnlyThreats
    ? logs.filter(log => log.threat_detected)
    : logs;

  const handleExportCSV = async () => {
    try {
      await exportAuditLogsCSV(userId, userEmail);
      toast({
        title: 'Export successful',
        description: 'Audit logs have been downloaded as CSV'
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export logs',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit Log</h2>
          <p className="text-muted-foreground">{userEmail}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLegendDialog(true)}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Event Legend
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Badge
            variant={threatScore > 50 ? 'destructive' : threatScore > 20 ? 'default' : 'secondary'}
            className="text-lg py-2 px-4"
          >
            Threat Score: {threatScore}/100
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Actions</p>
                <p className="text-2xl font-bold">{summary.total_actions}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Threats Detected</p>
                <p className="text-2xl font-bold text-red-500">{summary.threats_detected}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Credits Used</p>
                <p className="text-2xl font-bold">{summary.total_credits_used}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique IPs</p>
                <p className="text-2xl font-bold">{summary.unique_ips}</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Security Incidents */}
      {incidents.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            Security Incidents ({incidents.length})
          </h3>
          <div className="space-y-3">
            {incidents.slice(0, 5).map((incident) => {
              const severityInfo = formatThreatSeverity(incident.severity);
              return (
                <div
                  key={incident.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{severityInfo.icon}</span>
                    <div>
                      <p className="font-medium">{incident.incident_type.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-muted-foreground">{incident.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={incident.admin_reviewed ? 'secondary' : 'destructive'}>
                      {incident.admin_reviewed ? 'Reviewed' : 'Pending'}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {new Date(incident.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Audit Logs */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Activity Log</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOnlyThreats(!showOnlyThreats)}
          >
            {showOnlyThreats ? 'Show All' : 'Show Threats Only'}
          </Button>
        </div>

        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`border rounded-lg p-4 ${
                  log.threat_detected ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Status Icon */}
                    {log.action_status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    )}
                    {log.action_status === 'failure' && (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    )}
                    {log.action_status === 'blocked' && (
                      <Shield className="h-5 w-5 text-red-500 mt-0.5" />
                    )}
                    {log.action_status === 'warning' && (
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    )}

                    <div className="flex-1">
                      {/* Action Type */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium">{formatActionType(log.action_type)}</p>
                        {log.event_id && (
                          <Badge variant="outline" className="text-xs font-mono">
                            {log.event_id}
                          </Badge>
                        )}
                        {log.threat_detected && (
                          <Badge variant="destructive" className="text-xs">
                            {formatThreatSeverity(log.threat_severity).icon}{' '}
                            {formatThreatSeverity(log.threat_severity).label}
                          </Badge>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                        {log.ip_address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {log.ip_address}
                            {log.geolocation && (
                              <span className="text-xs">
                                ({log.geolocation.city}, {log.geolocation.country})
                              </span>
                            )}
                          </span>
                        )}
                        {log.credits_used > 0 && (
                          <span>💳 {log.credits_used} credits</span>
                        )}
                      </div>

                      {/* Threat Details */}
                      {log.threat_detected && log.threat_details && (
                        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded text-sm">
                          <p className="text-red-700 dark:text-red-300">
                            <strong>Threat:</strong> {log.threat_details}
                          </p>
                        </div>
                      )}

                      {/* Expandable Details */}
                      {log.action_details && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedLog(expandedLog === log.id ? null : log.id)
                          }
                          className="mt-2 h-auto py-1 px-2 text-xs"
                        >
                          {expandedLog === log.id ? (
                            <>
                              <ChevronUp className="h-3 w-3 mr-1" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 mr-1" />
                              Show Details
                            </>
                          )}
                        </Button>
                      )}

                      {expandedLog === log.id && log.action_details && (
                        <div className="mt-2 p-3 bg-muted rounded-lg text-xs font-mono">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(log.action_details, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* User Agent */}
                      {expandedLog === log.id && log.user_agent && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs flex items-start gap-2">
                          <Monitor className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground break-all">
                            {log.user_agent}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No {showOnlyThreats ? 'threat' : 'activity'} logs found
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Event Code Legend Dialog */}
      <Dialog open={showLegendDialog} onOpenChange={setShowLegendDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Event Code Legend</DialogTitle>
            <DialogDescription>
              Reference guide for all event codes and their meanings
            </DialogDescription>
          </DialogHeader>
          <EventCodeLegend />
        </DialogContent>
      </Dialog>
    </div>
  );
}
