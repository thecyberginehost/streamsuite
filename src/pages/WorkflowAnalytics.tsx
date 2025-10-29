/**
 * Workflow Analytics Page
 * Shows detailed analytics for a specific n8n connection
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Server,
  Clock,
  ChevronRight
} from 'lucide-react';
import {
  getAllWorkflowsFromN8n,
  getWorkflowExecutions,
  toggleWorkflowActive,
  retryExecution
} from '@/services/n8nIntegrationService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { canAccessFeature } from '@/config/subscriptionPlans';
import { useCredits } from '@/hooks/useCredits';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

export default function WorkflowAnalytics() {
  const { connectionId } = useParams<{ connectionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { balance } = useCredits();

  const [connection, setConnection] = useState<any>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any | null>(null);
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingExecutions, setLoadingExecutions] = useState(false);
  const [togglingWorkflow, setTogglingWorkflow] = useState<string | null>(null);
  const [retryingExecution, setRetryingExecution] = useState<string | null>(null);

  const userTier = balance?.subscription_tier || 'free';
  const canMonitor = canAccessFeature(userTier, 'n8n_monitoring');

  useEffect(() => {
    if (connectionId) {
      loadConnection();
      loadWorkflows();
    }
  }, [connectionId]);

  useEffect(() => {
    if (selectedWorkflow && canMonitor) {
      loadExecutions(selectedWorkflow.id);
    }
  }, [selectedWorkflow]);

  const loadConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('n8n_connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (error) throw error;
      setConnection(data);
    } catch (error) {
      console.error('Failed to load connection:', error);
      toast({
        title: 'Error',
        description: 'Failed to load connection details',
        variant: 'destructive'
      });
      navigate('/monitoring');
    }
  };

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const data = await getAllWorkflowsFromN8n(connectionId!);
      setWorkflows(data);

      // Auto-select first active workflow if none selected
      if (!selectedWorkflow && data.length > 0) {
        const firstActive = data.find((w: any) => w.active) || data[0];
        setSelectedWorkflow(firstActive);
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workflows',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadExecutions = async (workflowId: string) => {
    try {
      setLoadingExecutions(true);
      const data = await getWorkflowExecutions(connectionId!, workflowId, 50);
      setExecutions(data);
    } catch (error) {
      console.error('Failed to load executions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load execution history',
        variant: 'destructive'
      });
    } finally {
      setLoadingExecutions(false);
    }
  };

  const handleToggleActive = async (workflowId: string, currentStatus: boolean) => {
    try {
      setTogglingWorkflow(workflowId);
      await toggleWorkflowActive(connectionId!, workflowId, !currentStatus);

      toast({
        title: 'Success',
        description: `Workflow ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });

      loadWorkflows();
    } catch (error) {
      console.error('Failed to toggle workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to change workflow status',
        variant: 'destructive'
      });
    } finally {
      setTogglingWorkflow(null);
    }
  };

  const handleRetry = async (executionId: string) => {
    try {
      setRetryingExecution(executionId);
      await retryExecution(connectionId!, executionId);

      toast({
        title: 'Success',
        description: 'Execution retry started',
      });

      // Reload executions after a delay
      setTimeout(() => {
        if (selectedWorkflow) {
          loadExecutions(selectedWorkflow.id);
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to retry execution:', error);
      toast({
        title: 'Error',
        description: 'Failed to retry execution',
        variant: 'destructive'
      });
    } finally {
      setRetryingExecution(null);
    }
  };

  // Calculate analytics
  const totalExecutions = executions.length;
  const successfulExecutions = executions.filter((e: any) =>
    e.finished === true && !e.stoppedAt && e.status === 'success'
  ).length;
  const failedExecutions = executions.filter((e: any) =>
    e.status === 'error' || e.status === 'crashed' || e.status === 'failed'
  ).length;
  const runningExecutions = executions.filter((e: any) => e.status === 'running').length;

  const successRate = totalExecutions > 0 ? ((successfulExecutions / totalExecutions) * 100).toFixed(1) : '0';

  // Chart data
  const pieChartData = [
    { name: 'Success', value: successfulExecutions, color: '#22c55e' },
    { name: 'Failed', value: failedExecutions, color: '#ef4444' },
    { name: 'Running', value: runningExecutions, color: '#3b82f6' },
  ].filter(item => item.value > 0);

  const barChartData = workflows.slice(0, 10).map((workflow: any) => {
    const workflowExecs = executions.filter((e: any) => e.workflowId === workflow.id);
    const success = workflowExecs.filter((e: any) => e.status === 'success').length;
    const failed = workflowExecs.filter((e: any) => e.status === 'error' || e.status === 'failed').length;

    return {
      name: workflow.name.length > 20 ? workflow.name.substring(0, 20) + '...' : workflow.name,
      success,
      failed,
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!connection) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/monitoring')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Monitoring
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">{connection.connection_name}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{connection.instance_url}</p>
      </div>

      {!canMonitor && (
        <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Upgrade to Growth Plan for Execution Analytics
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                  View detailed execution history, charts, and performance metrics.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Workflow List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Workflows ({workflows.length})</CardTitle>
            <CardDescription>Select a workflow to view analytics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-auto">
            {workflows.map((workflow: any) => (
              <Card
                key={workflow.id}
                className={`p-3 cursor-pointer transition-colors ${
                  selectedWorkflow?.id === workflow.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => setSelectedWorkflow(workflow)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{workflow.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {workflow.active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600 text-xs">
                          Inactive
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500">{workflow.nodes?.length || 0} nodes</span>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 flex-shrink-0 ${
                    selectedWorkflow?.id === workflow.id ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Right: Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {selectedWorkflow ? (
            <>
              {/* Workflow Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedWorkflow.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {selectedWorkflow.nodes?.length || 0} nodes
                        {selectedWorkflow.updatedAt && ` • Updated ${new Date(selectedWorkflow.updatedAt).toLocaleDateString()}`}
                      </CardDescription>
                    </div>
                    <Button
                      variant={selectedWorkflow.active ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleToggleActive(selectedWorkflow.id, selectedWorkflow.active)}
                      disabled={togglingWorkflow === selectedWorkflow.id}
                    >
                      {togglingWorkflow === selectedWorkflow.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : selectedWorkflow.active ? (
                        'Deactivate'
                      ) : (
                        'Activate'
                      )}
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {canMonitor ? (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                            <p className="text-2xl font-bold mt-1">{totalExecutions}</p>
                          </div>
                          <Activity className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Success</p>
                            <p className="text-2xl font-bold mt-1 text-green-600">{successfulExecutions}</p>
                          </div>
                          <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
                            <p className="text-2xl font-bold mt-1 text-red-600">{failedExecutions}</p>
                          </div>
                          <XCircle className="h-8 w-8 text-red-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                            <p className="text-2xl font-bold mt-1">{successRate}%</p>
                          </div>
                          {parseFloat(successRate) >= 80 ? (
                            <TrendingUp className="h-8 w-8 text-green-600" />
                          ) : (
                            <TrendingDown className="h-8 w-8 text-orange-600" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Execution Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {pieChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={pieChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {pieChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-[250px] flex items-center justify-center text-gray-500">
                            No execution data available
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Bar Chart - Workflow Comparison (if multiple workflows) */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Workflows</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {barChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={barChartData}>
                              <XAxis dataKey="name" fontSize={12} />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="success" fill="#22c55e" name="Success" />
                              <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-[250px] flex items-center justify-center text-gray-500">
                            No workflow data available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Execution List */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Executions</CardTitle>
                      <CardDescription>Last 50 executions for this workflow</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingExecutions ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                      ) : executions.length === 0 ? (
                        <div className="text-center py-12">
                          <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-gray-600 dark:text-gray-400">No executions found</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[400px] overflow-auto">
                          {executions.map((execution: any) => (
                            <Card key={execution.id} className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {execution.status === 'success' ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  ) : execution.status === 'running' ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                  )}
                                  <div>
                                    <p className="text-sm font-medium">
                                      {execution.status === 'success' ? 'Success' :
                                       execution.status === 'running' ? 'Running' : 'Failed'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {execution.startedAt ? new Date(execution.startedAt).toLocaleString() : 'N/A'}
                                    </p>
                                  </div>
                                </div>

                                {(execution.status === 'error' || execution.status === 'failed') && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRetry(execution.id)}
                                    disabled={retryingExecution === execution.id}
                                  >
                                    {retryingExecution === execution.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      'Retry'
                                    )}
                                  </Button>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-400" />
                      <h3 className="text-lg font-semibold mb-2">Analytics Available on Growth Plan</h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        Upgrade to Growth plan to view execution history, success rates, charts, and retry failed workflows.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Server className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Select a workflow to view analytics
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
