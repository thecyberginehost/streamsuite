/**
 * All Audit Logs Component
 * Shows audit logs for ALL users (admin only)
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Clock,
  MapPin,
  Download,
  Filter,
  User,
  Calendar
} from 'lucide-react';
import {
  getAllAuditLogs,
  exportAllAuditLogsCSV,
  formatActionType,
  formatThreatSeverity,
} from '@/services/auditService';

export default function AllAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    severity: '',
    eventType: '',
    startDate: '',
    endDate: '',
  });
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      console.log('[AllAuditLogs] Loading logs with filters:', filters);
      const data = await getAllAuditLogs(1000, 0, {
        // Don't pass 'all' as a filter value - it should be undefined to get all
        severity: filters.severity && filters.severity !== 'all' ? filters.severity : undefined,
        eventType: filters.eventType || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      console.log('[AllAuditLogs] Loaded', data.length, 'logs');
      setLogs(data);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load audit logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    loadLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      severity: '',
      eventType: '',
      startDate: '',
      endDate: '',
    });
    // Reload without filters
    setTimeout(() => loadLogs(), 100);
  };

  const handleExportCSV = async () => {
    try {
      await exportAllAuditLogsCSV({
        severity: filters.severity || undefined,
        eventType: filters.eventType || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      toast({
        title: 'Export successful',
        description: `${logs.length} audit logs have been downloaded as CSV`,
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export logs',
        variant: 'destructive',
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
          <h2 className="text-2xl font-bold">All Audit Logs</h2>
          <p className="text-muted-foreground">Aggregated logs across all users</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV ({logs.length} logs)
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Logs</p>
              <p className="text-2xl font-bold">{logs.length}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Threats Detected</p>
              <p className="text-2xl font-bold text-red-500">
                {logs.filter((l) => l.threat_detected).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Unique Users</p>
              <p className="text-2xl font-bold">
                {new Set(logs.map((l) => l.user_id)).size}
              </p>
            </div>
            <User className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Critical Events</p>
              <p className="text-2xl font-bold text-red-600">
                {logs.filter((l) => l.threat_severity === 'critical').length}
              </p>
            </div>
            <Shield className="h-8 w-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4" />
          <h3 className="font-semibold">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Severity</Label>
            <Select
              value={filters.severity}
              onValueChange={(value) => setFilters({ ...filters, severity: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>

          <div className="space-y-2 flex items-end gap-2">
            <Button onClick={handleApplyFilters} className="flex-1">
              Apply Filters
            </Button>
            <Button variant="outline" onClick={handleClearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Activity Logs</h3>
        <ScrollArea className="h-[600px]">
          <div className="space-y-2">
            {logs.map((log) => (
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
                      {/* User & Action */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          <User className="h-3 w-3 mr-1" />
                          {(log.profiles as any)?.email || 'Unknown'}
                        </Badge>
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
                          </span>
                        )}
                        {log.credits_used > 0 && <span>💳 {log.credits_used} credits</span>}
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
                      {log.action_details && expandedLog === log.id && (
                        <div className="mt-2 p-3 bg-muted rounded-lg text-xs font-mono">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(log.action_details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground space-y-4">
                <p className="font-medium">No audit logs found</p>
                <div className="text-sm text-left max-w-md mx-auto space-y-2">
                  <p>Possible reasons:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>No actions have been logged yet</li>
                    <li>RLS policy issue - check browser console for errors</li>
                    <li>Your user may not have <code className="bg-muted px-1 rounded">is_admin = true</code> in profiles table</li>
                    <li>Migration 019 may not have been applied</li>
                  </ul>
                  <p className="mt-4">
                    Run <code className="bg-muted px-1 rounded">await testAuditLogging()</code> in the browser console to diagnose.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
