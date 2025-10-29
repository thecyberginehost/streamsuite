/**
 * Push to n8n Button Component
 *
 * Reusable button for pushing workflows to user's n8n instance (Pro+ feature)
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, ExternalLink } from 'lucide-react';
import {
  getN8nConnections,
  pushWorkflowToN8n,
  type N8nConnection,
} from '@/services/n8nIntegrationService';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface PushToN8nButtonProps {
  workflowName: string;
  workflowJson: any;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function PushToN8nButton({
  workflowName,
  workflowJson,
  variant = 'outline',
  size = 'sm',
  className,
}: PushToN8nButtonProps) {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [connections, setConnections] = useState<N8nConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');
  const [customWorkflowName, setCustomWorkflowName] = useState(workflowName);
  const [loading, setLoading] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('free');

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = profile?.subscription_tier || 'free';
    setUserPlan(tier);

    // Pro, Growth, and Agency plans can push workflows
    setIsPro(['pro', 'growth', 'agency'].includes(tier));
  };

  const loadConnections = async () => {
    try {
      const conns = await getN8nConnections();
      setConnections(conns.filter(c => c.is_active));

      if (conns.length > 0) {
        setSelectedConnectionId(conns[0].id);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to load n8n connections',
        variant: 'destructive',
      });
    }
  };

  const handleOpenDialog = async () => {
    if (!isPro) {
      toast({
        title: '🔒 Pro Feature',
        description: 'Upgrade to Pro plan or higher to push workflows to your n8n instance.',
        variant: 'destructive',
      });
      return;
    }

    setCustomWorkflowName(workflowName);
    await loadConnections();
    setShowDialog(true);
  };

  const handlePush = async () => {
    if (!selectedConnectionId) {
      toast({
        title: '⚠️ No Connection Selected',
        description: 'Please select an n8n connection',
        variant: 'destructive',
      });
      return;
    }

    if (!customWorkflowName) {
      toast({
        title: '⚠️ Missing Workflow Name',
        description: 'Please enter a workflow name',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await pushWorkflowToN8n(selectedConnectionId, customWorkflowName, workflowJson);

      toast({
        title: '✅ Workflow Pushed!',
        description: `"${customWorkflowName}" has been pushed to your n8n instance.`,
      });

      setShowDialog(false);
    } catch (error) {
      console.error('Error pushing workflow:', error);
      toast({
        title: '❌ Push Failed',
        description: error instanceof Error ? error.message : 'Failed to push workflow',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleOpenDialog}
        variant={variant}
        size={size}
        className={className}
        disabled={!isPro}
      >
        <Upload className="h-3.5 w-3.5 mr-1.5" />
        Push to n8n
        {!isPro && (
          <Badge variant="outline" className="ml-2 text-[9px] px-1 py-0">
            PRO
          </Badge>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Push to n8n Instance</DialogTitle>
            <DialogDescription>
              Deploy this workflow directly to your connected n8n instance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {connections.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-3">
                  No n8n connections found. Add a connection in Settings first.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDialog(false);
                    window.location.href = '/settings';
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-1.5" />
                  Go to Settings
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="connection">n8n Instance</Label>
                  <Select value={selectedConnectionId} onValueChange={setSelectedConnectionId}>
                    <SelectTrigger id="connection">
                      <SelectValue placeholder="Select connection" />
                    </SelectTrigger>
                    <SelectContent>
                      {connections.map((conn) => (
                        <SelectItem key={conn.id} value={conn.id}>
                          {conn.connection_name} ({conn.instance_url})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workflow-name">Workflow Name</Label>
                  <Input
                    id="workflow-name"
                    value={customWorkflowName}
                    onChange={(e) => setCustomWorkflowName(e.target.value)}
                    placeholder="Enter workflow name"
                  />
                  <p className="text-xs text-gray-500">
                    This will be the workflow name in your n8n instance
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    <strong>Note:</strong> The workflow will be created as inactive. You can activate it from your n8n dashboard.
                  </p>
                </div>
              </>
            )}
          </div>

          {connections.length > 0 && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handlePush} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Pushing...
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Push Workflow
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
