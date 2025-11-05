/**
 * Client Workflows Page
 *
 * Dedicated page for managing client workflows across n8n, Make.com, and Zapier.
 * Three tabs: n8n, Make.com, and Zapier (with embedded browser).
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Zap,
  Activity,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClient, type Client } from '@/services/clientService';
import { getClientConnections, type ClientPlatformConnection } from '@/services/clientPlatformService';
import {
  listN8NWorkflowsViaProxy,
  toggleN8NWorkflowViaProxy,
  getN8NWorkflowStats,
  type N8NWorkflow,
} from '@/services/n8nApiService';
import {
  listMakeScenariosViaProxy,
  toggleMakeScenarioViaProxy,
  getMakeScenarioUsage,
  type MakeScenario,
} from '@/services/makeApiService';

export default function ClientWorkflows() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [connections, setConnections] = useState<ClientPlatformConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'n8n' | 'make' | 'zapier'>('n8n');

  // n8n state
  const [n8nWorkflows, setN8nWorkflows] = useState<N8NWorkflow[]>([]);
  const [n8nLoading, setN8nLoading] = useState(false);
  const [n8nConnection, setN8nConnection] = useState<ClientPlatformConnection | null>(null);

  // Make.com state
  const [makeScenarios, setMakeScenarios] = useState<MakeScenario[]>([]);
  const [makeLoading, setMakeLoading] = useState(false);
  const [makeConnection, setMakeConnection] = useState<ClientPlatformConnection | null>(null);

  // Zapier state
  const [zapierConnection, setZapierConnection] = useState<ClientPlatformConnection | null>(null);

  useEffect(() => {
    if (clientId) {
      loadData();
    }
  }, [clientId]);

  // Load workflows when tab changes
  useEffect(() => {
    if (!loading) {
      if (activeTab === 'n8n' && n8nConnection && n8nWorkflows.length === 0) {
        loadN8NWorkflows(n8nConnection);
      } else if (activeTab === 'make' && makeConnection && makeScenarios.length === 0) {
        loadMakeScenarios(makeConnection);
      }
    }
  }, [activeTab, loading]);


  const loadData = async () => {
    try {
      setLoading(true);
      const [clientData, connectionsData] = await Promise.all([
        getClient(clientId!),
        getClientConnections(clientId!),
      ]);

      setClient(clientData);
      setConnections(connectionsData);

      // Find platform-specific connections
      const n8n = connectionsData.find((c) => c.platform === 'n8n' && c.is_active);
      const make = connectionsData.find((c) => c.platform === 'make' && c.is_active);
      const zapier = connectionsData.find((c) => c.platform === 'zapier' && c.is_active);

      setN8nConnection(n8n || null);
      setMakeConnection(make || null);
      setZapierConnection(zapier || null);

      // Auto-load first available platform
      if (n8n) {
        setActiveTab('n8n');
        loadN8NWorkflows(n8n);
      } else if (make) {
        setActiveTab('make');
        loadMakeScenarios(make);
      } else if (zapier) {
        setActiveTab('zapier');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load client data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // n8n Functions
  const loadN8NWorkflows = async (connection: ClientPlatformConnection) => {
    try {
      setN8nLoading(true);
      const result = await listN8NWorkflowsViaProxy(connection.id);

      if (result.success && result.data) {
        setN8nWorkflows(result.data);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load n8n workflows',
          variant: 'destructive',
        });
        setN8nWorkflows([]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load workflows',
        variant: 'destructive',
      });
      setN8nWorkflows([]);
    } finally {
      setN8nLoading(false);
    }
  };

  const handleN8NToggle = async (workflow: N8NWorkflow) => {
    if (!n8nConnection) return;

    try {
      const result = await toggleN8NWorkflowViaProxy(
        n8nConnection.id,
        workflow.id,
        !workflow.active
      );

      if (result.success) {
        toast({
          title: 'Success',
          description: `Workflow ${workflow.active ? 'deactivated' : 'activated'}`,
        });
        loadN8NWorkflows(n8nConnection);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to toggle workflow',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to toggle workflow',
        variant: 'destructive',
      });
    }
  };

  // Make.com Functions
  const loadMakeScenarios = async (connection: ClientPlatformConnection) => {
    try {
      setMakeLoading(true);
      const result = await listMakeScenariosViaProxy(connection.id);

      if (result.success && result.data) {
        setMakeScenarios(result.data);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load Make.com scenarios',
          variant: 'destructive',
        });
        setMakeScenarios([]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load scenarios',
        variant: 'destructive',
      });
      setMakeScenarios([]);
    } finally {
      setMakeLoading(false);
    }
  };

  const handleMakeToggle = async (scenario: MakeScenario) => {
    if (!makeConnection) return;

    try {
      // Check if scenario is currently active
      // Active = scheduling exists AND type is NOT "indefinitely"
      const isCurrentlyActive = scenario.scheduling?.type && scenario.scheduling.type !== 'indefinitely';

      // Create proper scheduling object
      const scheduling = isCurrentlyActive
        ? { type: 'indefinitely' as const }  // Deactivate
        : { type: 'immediately' as const };  // Activate (webhook trigger)

      const result = await toggleMakeScenarioViaProxy(
        makeConnection.id,
        scenario.id,
        scheduling
      );

      if (result.success) {
        toast({
          title: 'Success',
          description: `Scenario ${isCurrentlyActive ? 'deactivated' : 'activated'}`,
        });
        loadMakeScenarios(makeConnection);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to toggle scenario',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle scenario',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Client not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/agency/client/${clientId}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{client.name} - Workflows</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage workflows across all platforms
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {n8nConnection && (
                <Badge variant="outline" className="gap-1">
                  <Activity className="h-3 w-3" />
                  n8n
                </Badge>
              )}
              {makeConnection && (
                <Badge variant="outline" className="gap-1">
                  <Activity className="h-3 w-3" />
                  Make.com
                </Badge>
              )}
              {zapierConnection && (
                <Badge variant="outline" className="gap-1">
                  <Zap className="h-3 w-3" />
                  Zapier
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="n8n" disabled={!n8nConnection}>
              ⚡ n8n {n8nWorkflows.length > 0 && `(${n8nWorkflows.length})`}
            </TabsTrigger>
            <TabsTrigger value="make" disabled={!makeConnection}>
              🔧 Make.com {makeScenarios.length > 0 && `(${makeScenarios.length})`}
            </TabsTrigger>
            <TabsTrigger value="zapier" disabled={!zapierConnection}>
              ⚙️ Zapier
            </TabsTrigger>
          </TabsList>

          {/* n8n Tab */}
          <TabsContent value="n8n" className="mt-6">
            {!n8nConnection ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No n8n connection configured for this client.{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => navigate(`/agency/client/${clientId}`)}
                  >
                    Add connection
                  </Button>
                </AlertDescription>
              </Alert>
            ) : n8nLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header with Open Workspace button */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      {n8nWorkflows.length} workflow{n8nWorkflows.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadN8NWorkflows(n8nConnection)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => window.open(n8nConnection.n8n_instance_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open n8n Workspace
                    </Button>
                  </div>
                </div>

                {/* Workflows List */}
                {n8nWorkflows.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-600 dark:text-gray-400">No n8n workflows found</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {n8nWorkflows.map((workflow) => (
                      <Card key={workflow.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{workflow.name}</h3>
                                <Badge variant={workflow.active ? 'default' : 'secondary'}>
                                  {workflow.active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {workflow.nodes.length} nodes • Updated{' '}
                                {new Date(workflow.updatedAt).toLocaleDateString()}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleN8NToggle(workflow)}
                              >
                                {workflow.active ? (
                                  <>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
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
          </TabsContent>

          {/* Make.com Tab */}
          <TabsContent value="make" className="mt-6">
            {!makeConnection ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No Make.com connection configured for this client.{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => navigate(`/agency/client/${clientId}`)}
                  >
                    Add connection
                  </Button>
                </AlertDescription>
              </Alert>
            ) : !makeConnection.make_instance_url ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Make.com instance URL not configured.{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => navigate(`/agency/client/${clientId}`)}
                  >
                    Update connection
                  </Button>
                </AlertDescription>
              </Alert>
            ) : makeLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header with Open Workspace button */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      {makeScenarios.length} scenario{makeScenarios.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadMakeScenarios(makeConnection)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => window.open(makeConnection.make_instance_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Make.com Workspace
                    </Button>
                  </div>
                </div>

                {/* Scenarios List */}
                {makeScenarios.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-600 dark:text-gray-400">No Make.com scenarios found</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {makeScenarios.map((scenario) => (
                      <Card key={scenario.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{scenario.name}</h3>
                                <Badge variant={scenario.scheduling?.type && scenario.scheduling.type !== 'indefinitely' ? 'default' : 'secondary'}>
                                  {scenario.scheduling?.type && scenario.scheduling.type !== 'indefinitely' ? 'Active' : 'Inactive'}
                                </Badge>
                                {scenario.concept && <Badge variant="outline">Draft</Badge>}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {scenario.description || 'No description'} • Updated{' '}
                                {new Date(scenario.updatedAt).toLocaleDateString()}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMakeToggle(scenario)}
                              >
                                {scenario.scheduling?.type && scenario.scheduling.type !== 'indefinitely' ? (
                                  <>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
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
          </TabsContent>

          {/* Zapier Tab (Embedded Browser) */}
          <TabsContent value="zapier" className="mt-6">
            {!zapierConnection ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No Zapier connection configured for this client.{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => navigate(`/agency/client/${clientId}`)}
                  >
                    Add connection
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {/* Header with Open Workspace button */}
                <div className="flex items-center justify-end">
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => window.open(zapierConnection.zapier_instance_url || 'https://zapier.com/app/dashboard', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Zapier Workspace
                  </Button>
                </div>

                {/* No API - Show info card */}
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center max-w-xl mx-auto">
                      <Zap className="h-16 w-16 mx-auto text-orange-500 mb-4" />
                      <h3 className="text-xl font-bold mb-2">Zapier Workspace Access</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Zapier does not provide a public API for listing or managing Zaps.
                        Click "Open Zapier Workspace" above to access {client?.name}'s Zapier account directly.
                      </p>

                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 text-left">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>⚠️ API Limitations:</strong> Unlike n8n and Make.com, Zapier does not offer workflow management APIs.
                          StreamSuite can generate Code by Zapier snippets but cannot list, monitor, or control Zaps programmatically.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
