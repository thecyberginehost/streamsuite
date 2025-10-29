/**
 * Pushed Workflows Dialog
 * Shows all workflows pushed to an n8n connection with execution monitoring
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Activity,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { getPushedWorkflows } from '@/services/n8nIntegrationService';
import WorkflowExecutionsList from './WorkflowExecutionsList';
import { useToast } from '@/hooks/use-toast';
import { canAccessFeature } from '@/config/subscriptionPlans';
import { useCredits } from '@/hooks/useCredits';

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
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any | null>(null);
  const { toast } = useToast();
  const { balance } = useCredits();

  const userTier = balance?.subscription_tier || 'free';
  const canMonitor = canAccessFeature(userTier, 'n8n_monitoring');

  useEffect(() => {
    if (open) {
      loadWorkflows();
    }
  }, [open, connectionId]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const data = await getPushedWorkflows(connectionId);
      setWorkflows(data);
    } catch (error) {
      console.error('Failed to load workflows:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pushed workflows',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

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
            <DialogTitle>{selectedWorkflow.workflow_name}</DialogTitle>
            <DialogDescription>
              Execution history from {connectionName}
            </DialogDescription>
          </DialogHeader>

          <WorkflowExecutionsList
            connectionId={connectionId}
            workflowId={selectedWorkflow.workflow_id}
            workflowName={selectedWorkflow.workflow_name}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Pushed Workflows</DialogTitle>
          <DialogDescription>
            Workflows pushed to {connectionName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 dark:text-gray-400">
              No workflows pushed yet
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

            {workflows.map((workflow) => (
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
      </DialogContent>
    </Dialog>
  );
}
