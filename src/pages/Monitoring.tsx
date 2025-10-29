/**
 * Monitoring Page - n8n Workflow Monitoring (Growth Plan)
 * Central hub for viewing and monitoring all n8n workflows
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Activity,
  Server,
  Loader2,
  AlertCircle,
  Zap,
  CheckCircle2,
  XCircle,
  BarChart3
} from 'lucide-react';
import { getN8nConnections } from '@/services/n8nIntegrationService';
import PushedWorkflowsDialog from '@/components/workflow/PushedWorkflowsDialog';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { canAccessFeature } from '@/config/subscriptionPlans';

export default function Monitoring() {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConnection, setSelectedConnection] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { profile } = useProfile();

  const canAccessN8n = profile ? canAccessFeature(profile.subscription_tier, 'n8n_push') : false;
  const canMonitor = profile ? canAccessFeature(profile.subscription_tier, 'n8n_monitoring') : false;

  useEffect(() => {
    if (canAccessN8n) {
      loadConnections();
    }
  }, [canAccessN8n]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const data = await getN8nConnections();
      setConnections(data);
    } catch (error) {
      console.error('Failed to load connections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load n8n connections',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const openWorkflows = (connection: any) => {
    setSelectedConnection(connection);
    setDialogOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Activity className="h-8 w-8" />
          Workflow Monitoring
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Monitor and manage your n8n workflows across all connections
        </p>
      </div>

      {/* Feature Gating */}
      {!canAccessN8n ? (
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertTitle>Pro Feature</AlertTitle>
          <AlertDescription>
            n8n workflow monitoring is available on Pro, Growth, and Agency plans.
            Upgrade to connect your n8n instances and monitor workflows.
          </AlertDescription>
        </Alert>
      ) : !canMonitor ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Growth Feature</AlertTitle>
          <AlertDescription>
            Full workflow execution monitoring (view executions, retry failures) is available on Growth and Agency plans.
            You can view your workflows, but upgrade to Growth for execution monitoring.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Connections Grid */}
      {canAccessN8n && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Your n8n Connections</h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : connections.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Server className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No n8n connections yet
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Add your first n8n connection in Settings to start monitoring
                  </p>
                  <Button
                    onClick={() => window.location.href = '/settings'}
                    variant="outline"
                  >
                    Go to Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map((connection) => (
                <Card key={connection.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-lg">{connection.connection_name}</CardTitle>
                      {connection.is_active && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs">
                      {connection.instance_url}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      {connection.last_test_success !== null && (
                        <div className="flex items-center gap-2 text-sm">
                          {connection.last_test_success ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span className="text-green-600">Connected</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-red-600">Connection failed</span>
                            </>
                          )}
                        </div>
                      )}

                      {connection.last_tested_at && (
                        <p className="text-xs text-gray-500">
                          Last tested: {new Date(connection.last_tested_at).toLocaleString()}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => openWorkflows(connection)}
                          className="flex-1"
                          variant="outline"
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          Quick View
                        </Button>

                        <Button
                          onClick={() => navigate(`/monitoring/${connection.id}`)}
                          className="flex-1"
                          variant="default"
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Analytics
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feature Info */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            What You Can Do Here
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>View All Workflows:</strong> See every workflow in your n8n instance (not just ones pushed from StreamSuite)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Monitor Executions:</strong> {canMonitor ? 'View last 20 executions for any workflow, see success/failure status' : '(Growth Plan required)'}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Retry Failures:</strong> {canMonitor ? 'Manually retry failed workflow executions with one click' : '(Growth Plan required)'}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Track Status:</strong> See which workflows are active/inactive, when they were last updated</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Workflows Dialog */}
      {selectedConnection && (
        <PushedWorkflowsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          connectionId={selectedConnection.id}
          connectionName={selectedConnection.connection_name}
        />
      )}
    </div>
  );
}
