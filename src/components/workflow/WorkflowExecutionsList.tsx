/**
 * Workflow Executions List (MVP - Growth Plan Only)
 * Simple list view of last 20 workflow executions
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { getWorkflowExecutions, retryExecution } from '@/services/n8nIntegrationService';
import { useToast } from '@/hooks/use-toast';
import { formatDistance } from 'date-fns';

interface WorkflowExecutionsListProps {
  connectionId: string;
  workflowId: string;
  workflowName: string;
}

interface Execution {
  id: string;
  workflowId: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt?: string;
  status?: string;
  error?: any;
}

export default function WorkflowExecutionsList({
  connectionId,
  workflowId,
  workflowName
}: WorkflowExecutionsListProps) {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const { toast } = useToast();

  const loadExecutions = async () => {
    try {
      setLoading(true);
      const data = await getWorkflowExecutions(connectionId, workflowId, 20);
      setExecutions(data);
    } catch (error) {
      console.error('Failed to load executions:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load executions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExecutions();
  }, [connectionId, workflowId]);

  const handleRetry = async (executionId: string) => {
    try {
      setRetrying(executionId);
      await retryExecution(connectionId, executionId);
      toast({
        title: 'Execution retried',
        description: 'The workflow execution has been retried successfully'
      });
      // Reload executions after retry
      setTimeout(loadExecutions, 2000);
    } catch (error) {
      toast({
        title: 'Retry failed',
        description: error instanceof Error ? error.message : 'Failed to retry execution',
        variant: 'destructive'
      });
    } finally {
      setRetrying(null);
    }
  };

  const getStatusBadge = (execution: Execution) => {
    if (!execution.finished) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Clock className="h-3 w-3 mr-1" />
          Running
        </Badge>
      );
    }

    if (execution.error || execution.status === 'error') {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Success
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-600 dark:text-gray-400">
          No executions yet for this workflow
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Executions will appear here once the workflow runs
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Recent Executions</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {workflowName} (Last 20)
          </p>
        </div>
        <Button
          onClick={loadExecutions}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {executions.map((execution) => (
          <Card key={execution.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusBadge(execution)}
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDistance(new Date(execution.startedAt), new Date(), {
                      addSuffix: true
                    })}
                  </span>
                </div>

                {execution.error && (
                  <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                    <p className="text-red-800 dark:text-red-200 font-medium mb-1">
                      Error:
                    </p>
                    <p className="text-red-700 dark:text-red-300 text-xs font-mono">
                      {typeof execution.error === 'string'
                        ? execution.error
                        : execution.error?.message || 'Unknown error'}
                    </p>
                  </div>
                )}
              </div>

              {(execution.error || execution.status === 'error') && (
                <Button
                  onClick={() => handleRetry(execution.id)}
                  variant="outline"
                  size="sm"
                  disabled={retrying === execution.id}
                >
                  {retrying === execution.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
