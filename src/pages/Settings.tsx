/**
 * Settings Page - User Settings and n8n Connections
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Settings as SettingsIcon,
  Server,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  Zap,
  Lock,
  Activity,
  Crown,
  CreditCard,
  Check
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { canAccessFeature, getPlanByTier, SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';
import {
  testN8nConnection,
  saveN8nConnection,
  getN8nConnections,
  deleteN8nConnection,
  type N8nConnection
} from '@/services/n8nIntegrationService';
import PushedWorkflowsDialog from '@/components/workflow/PushedWorkflowsDialog';

export default function Settings() {
  const [connections, setConnections] = useState<N8nConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<N8nConnection | null>(null);
  const [workflowsDialogOpen, setWorkflowsDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<N8nConnection | null>(null);

  // Form state
  const [connectionName, setConnectionName] = useState('');
  const [instanceUrl, setInstanceUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();
  const { profile } = useProfile();

  const canAccessN8n = profile ? canAccessFeature(profile.subscription_tier, 'n8n_push') : false;

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const data = await getN8nConnections();
      setConnections(data);
    } catch (error: any) {
      console.error('Failed to load connections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load n8n connections.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!instanceUrl || !apiKey) {
      toast({
        title: 'Missing fields',
        description: 'Please enter both instance URL and API key.',
        variant: 'destructive'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const result = await testN8nConnection(instanceUrl, apiKey);

      if (result.success) {
        setTestResult('success');
        toast({
          title: 'Connection successful',
          description: `Connected to n8n v${result.version || 'unknown'}`,
        });
      } else {
        setTestResult('error');
        toast({
          title: 'Connection failed',
          description: result.error || 'Could not connect to n8n instance.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      setTestResult('error');
      toast({
        title: 'Connection failed',
        description: error.message || 'Could not connect to n8n instance.',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConnection = async () => {
    if (!connectionName || !instanceUrl || !apiKey) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all fields.',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    setTestResult(null);

    try {
      // Save connection first (required for Edge Function proxy)
      const savedConnection = await saveN8nConnection(connectionName, instanceUrl, apiKey);

      // Test connection via Edge Function proxy
      setTesting(true);
      const result = await testN8nConnection(savedConnection.id);
      setTesting(false);

      if (result.success) {
        setTestResult('success');
        toast({
          title: 'Connection saved & tested',
          description: `${connectionName} is connected successfully!`,
        });

        // Reset form and close dialog
        setConnectionName('');
        setInstanceUrl('');
        setApiKey('');
        setTestResult(null);
        setAddDialogOpen(false);

        // Reload connections
        loadConnections();
      } else {
        toast({
          title: 'Connection saved but test failed',
          description: result.error || 'Connection was saved but could not be verified. Check your URL and API key.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error.message || 'Failed to save connection.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConnection = async () => {
    if (!connectionToDelete) return;

    try {
      await deleteN8nConnection(connectionToDelete.id);

      toast({
        title: 'Connection deleted',
        description: `${connectionToDelete.connection_name} has been deleted.`,
      });

      setDeleteDialogOpen(false);
      setConnectionToDelete(null);
      loadConnections();
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete connection.',
        variant: 'destructive'
      });
    }
  };

  const openDeleteDialog = (connection: N8nConnection) => {
    setConnectionToDelete(connection);
    setDeleteDialogOpen(true);
  };

  const openWorkflowsDialog = (connection: N8nConnection) => {
    setSelectedConnection(connection);
    setWorkflowsDialogOpen(true);
  };

  const currentPlan = profile ? getPlanByTier(profile.subscription_tier) : SUBSCRIPTION_PLANS.free;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <SettingsIcon className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your subscription, n8n connections, and account settings
        </p>
      </div>

      {/* Subscription Plan Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Current Subscription
              </CardTitle>
              <CardDescription className="mt-2">
                Your plan details and included features
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {currentPlan.displayName}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Plan Summary */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-semibold">{currentPlan.displayName} Plan</h3>
                {currentPlan.id !== 'free' && (
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentPlan.credits.monthly} credits per month
                {currentPlan.batchCredits && ` • ${currentPlan.batchCredits.monthly} batch credits`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {currentPlan.price.monthly === 0 ? 'Free' : `$${currentPlan.price.monthly}`}
              </div>
              {currentPlan.price.monthly > 0 && (
                <p className="text-xs text-gray-500">per month</p>
              )}
            </div>
          </div>

          {/* Included Features */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Included Features
            </h4>
            <div className="grid md:grid-cols-2 gap-2">
              {currentPlan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coming Soon Features (if any) */}
          {currentPlan.comingSoonFeatures && currentPlan.comingSoonFeatures.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Coming Soon
              </h4>
              <div className="grid md:grid-cols-2 gap-2">
                {currentPlan.comingSoonFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <Loader2 className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5 animate-spin" />
                    <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upgrade CTA (for non-Agency users) */}
          {currentPlan.id !== 'agency' && (
            <div className="pt-4 border-t">
              <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
                <Zap className="h-4 w-4" />
                <AlertTitle>Want more features?</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    Upgrade to unlock {currentPlan.id === 'free' ? 'advanced AI features' : currentPlan.id === 'starter' ? 'debugging and templates' : currentPlan.id === 'pro' ? 'batch operations and monitoring' : 'team collaboration'}
                  </span>
                  <Button size="sm" className="ml-4">
                    View Plans
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* n8n Connections Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                n8n Instance Connections
              </CardTitle>
              <CardDescription className="mt-2">
                Connect your n8n instances to push workflows directly from StreamSuite
              </CardDescription>
            </div>
            {canAccessN8n ? (
              <Button onClick={() => setAddDialogOpen(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Connection
              </Button>
            ) : (
              <Badge variant="outline" className="text-purple-600 border-purple-300">
                PRO
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {!canAccessN8n ? (
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertTitle>Pro Feature</AlertTitle>
              <AlertDescription>
                n8n push integration is available on Pro, Growth, and Agency plans.
                Upgrade to connect your n8n instances and push workflows directly.
              </AlertDescription>
            </Alert>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-12">
              <Server className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No n8n connections yet
              </p>
              <Button onClick={() => setAddDialogOpen(true)} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Connection
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold">{connection.connection_name}</h3>
                      {connection.is_active && (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          Active
                        </Badge>
                      )}
                      {connection.last_test_success !== null && (
                        <div className="flex items-center gap-1 text-xs">
                          {connection.last_test_success ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              <span className="text-green-600">Connected</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 text-red-500" />
                              <span className="text-red-600">Connection failed</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {connection.instance_url}
                    </p>
                    {connection.last_tested_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last tested: {new Date(connection.last_tested_at).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openWorkflowsDialog(connection)}
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      View Workflows
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(connection)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Keys Security Notice */}
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>Security Notice</AlertTitle>
        <AlertDescription>
          Your n8n API keys are stored securely in our database. We recommend using API keys with appropriate permissions and rotating them regularly.
        </AlertDescription>
      </Alert>

      {/* Add Connection Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add n8n Connection</DialogTitle>
            <DialogDescription>
              Connect your n8n instance to push workflows directly from StreamSuite
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="connection-name">Connection Name</Label>
              <Input
                id="connection-name"
                placeholder="My n8n Instance"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
              />
              <p className="text-xs text-gray-500">A friendly name to identify this connection</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instance-url">Instance URL</Label>
              <Input
                id="instance-url"
                placeholder="https://your-n8n-instance.com"
                value={instanceUrl}
                onChange={(e) => setInstanceUrl(e.target.value)}
              />
              <p className="text-xs text-gray-500">Your n8n instance URL (including https://)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="n8n_api_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Find this in your n8n Settings → API
              </p>
            </div>

            {/* Test Result */}
            {testResult && (
              <Alert variant={testResult === 'success' ? 'default' : 'destructive'}>
                {testResult === 'success' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Connection successful</AlertTitle>
                    <AlertDescription>
                      Successfully connected to your n8n instance. You can now save this connection.
                    </AlertDescription>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Connection failed</AlertTitle>
                    <AlertDescription>
                      Could not connect to n8n instance. Please check your URL and API key.
                    </AlertDescription>
                  </>
                )}
              </Alert>
            )}

          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false);
                setConnectionName('');
                setInstanceUrl('');
                setApiKey('');
                setTestResult(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveConnection}
              disabled={saving || testing}
            >
              {saving || testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {testing ? 'Testing...' : 'Saving...'}
                </>
              ) : (
                'Save & Test Connection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Connection?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{connectionToDelete?.connection_name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConnection}>
              Delete Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pushed Workflows Dialog */}
      {selectedConnection && (
        <PushedWorkflowsDialog
          open={workflowsDialogOpen}
          onOpenChange={setWorkflowsDialogOpen}
          connectionId={selectedConnection.id}
          connectionName={selectedConnection.connection_name}
        />
      )}
    </div>
  );
}
