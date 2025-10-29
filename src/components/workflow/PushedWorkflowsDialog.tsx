/**
 * Workflows Dialog
 * Shows all workflows from n8n instance + workflows pushed from StreamSuite
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Activity,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronRight,
  AlertCircle,
  Server
} from 'lucide-react';
import { getPushedWorkflows, getAllWorkflowsFromN8n, toggleWorkflowActive } from '@/services/n8nIntegrationService';
import WorkflowExecutionsList from './WorkflowExecutionsList';
import { useToast } from '@/hooks/use-toast';
import { canAccessFeature } from '@/config/subscriptionPlans';
import { useCredits } from '@/hooks/useCredits';
import { useNavigate } from 'react-router-dom';

interface PushedWorkflowsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectionId: string;
  connectionName: string;
}

export default function PushedWorkflowsDialog({
  open,
  onOpenChange,
  connectionId,
  connectionName
}: PushedWorkflowsDialogProps) {
  const [pushedWorkflows, setPushedWorkflows] = useState<any[]>([]);
  const [allWorkflows, setAllWorkflows] = useState<any[]>([]);
  const [loadingPushed, setLoadingPushed] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any | null>(null);
  const [togglingWorkflow, setTogglingWorkflow] = useState<string | null>(null);
  const { toast } = useToast();
  const { balance } = useCredits();
  const navigate = useNavigate();

  const userTier = balance?.subscription_tier || 'free';
  const canMonitor = canAccessFeature(userTier, 'n8n_monitoring');

  const handleToggleActive = async (workflowId: string, currentStatus: boolean) => {
    try {
      setTogglingWorkflow(workflowId);
      await toggleWorkflowActive(connectionId, workflowId, !currentStatus);

      toast({
        title: 'Success',
        description: `Workflow ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });

      // Refresh workflows to show updated status
      loadAllWorkflows();
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

  useEffect(() => {
    if (open) {
      loadPushedWorkflows();
      loadAllWorkflows();
    }
  }, [open, connectionId]);

  const loadPushedWorkflows = async () => {
    try {
      setLoadingPushed(true);
      const data = await getPushedWorkflows(connectionId);
      setPushedWorkflows(data);
    } catch (error) {
      console.error('Failed to load pushed workflows:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pushed workflows',
        variant: 'destructive'
      });
    } finally {
      setLoadingPushed(false);
    }
  };

  const loadAllWorkflows = async () => {
    try {
      setLoadingAll(true);
      const data = await getAllWorkflowsFromN8n(connectionId);
      setAllWorkflows(data);
    } catch (error) {
      console.error('Failed to load workflows from n8n:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workflows from n8n instance',
        variant: 'destructive'
      });
    } finally {
      setLoadingAll(false);
    }
  };

  // If viewing executions, show the executions list
  if (selectedWorkflow && canMonitor) {
    return (
      <Dialog open={open} onOpenChange={(newOpen) => {
        if (!newOpen) {
          setSelectedWorkflow(null);
        }
        onOpenChange(newOpen);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedWorkflow(null)}
              >
                ← Back to Workflows
              </Button>
            </div>
            <DialogTitle>{selectedWorkflow.name || selectedWorkflow.workflow_name}</DialogTitle>
            <DialogDescription>
              Execution history from {connectionName}
            </DialogDescription>
          </DialogHeader>

          <WorkflowExecutionsList
            connectionId={connectionId}
            workflowId={selectedWorkflow.id || selectedWorkflow.workflow_id}
            workflowName={selectedWorkflow.name || selectedWorkflow.workflow_name}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Main dialog with tabs
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Workflows - {connectionName}</DialogTitle>
              <DialogDescription>
                Quick preview of workflows from your n8n instance
              </DialogDescription>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                navigate(`/monitoring/${connectionId}`);
              }}
            >
              <Activity className="h-4 w-4 mr-2" />
              Full Analytics
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">
              <Server className="h-4 w-4 mr-2" />
              All Workflows ({allWorkflows.length})
            </TabsTrigger>
            <TabsTrigger value="pushed">
              <Activity className="h-4 w-4 mr-2" />
              Pushed from StreamSuite ({pushedWorkflows.length})
            </TabsTrigger>
          </TabsList>

          {/* All Workflows Tab */}
          <TabsContent value="all" className="mt-4">
            {loadingAll ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : allWorkflows.length === 0 ? (
              <div className="text-center py-12">
                <Server className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 dark:text-gray-400">
                  No workflows found in n8n instance
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Create workflows in n8n or push from StreamSuite
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {!canMonitor && (
                  <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                          Upgrade to Growth Plan for Execution Monitoring
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                          View execution history, retry failed workflows, and monitor performance.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {allWorkflows.map((workflow) => (
                  <Card key={workflow.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{workflow.name}</h3>
                          {workflow.active ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-600">
                              Inactive
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {workflow.nodes?.length || 0} nodes
                          {workflow.updatedAt && ` • Updated ${new Date(workflow.updatedAt).toLocaleDateString()}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant={workflow.active ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleToggleActive(workflow.id, workflow.active)}
                          disabled={togglingWorkflow === workflow.id}
                        >
                          {togglingWorkflow === workflow.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : workflow.active ? (
                            'Deactivate'
                          ) : (
                            'Activate'
                          )}
                        </Button>

                        {canMonitor && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedWorkflow(workflow)}
                          >
                            <Activity className="h-4 w-4 mr-2" />
                            View Executions
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pushed from StreamSuite Tab */}
          <TabsContent value="pushed" className="mt-4">
            {loadingPushed ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : pushedWorkflows.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 dark:text-gray-400">
                  No workflows pushed from StreamSuite yet
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Use the "Push to n8n" button when generating workflows
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {!canMonitor && (
                  <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                          Upgrade to Growth Plan for Execution Monitoring
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                          View execution history, retry failed workflows, and monitor performance.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {pushedWorkflows.map((workflow) => (
                  <Card key={workflow.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{workflow.workflow_name}</h3>
                          {workflow.push_status === 'success' ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Pushed
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Pushed {new Date(workflow.pushed_at).toLocaleDateString()}
                        </p>

                        {workflow.error_message && workflow.push_status === 'failed' && (
                          <p className="text-xs text-red-600 mt-1">
                            Error: {workflow.error_message}
                          </p>
                        )}

                        {workflow.last_monitored_at && (
                          <div className="mt-2 text-xs text-gray-500">
                            <p>
                              {workflow.total_executions || 0} total executions •{' '}
                              {workflow.successful_executions || 0} successful •{' '}
                              {workflow.failed_executions || 0} failed
                            </p>
                          </div>
                        )}
                      </div>

                      {canMonitor && workflow.push_status === 'success' && workflow.workflow_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedWorkflow(workflow)}
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          View Executions
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
