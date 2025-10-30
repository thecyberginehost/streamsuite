/**
 * Agency Dashboard
 *
 * Enterprise-grade dashboard for Agency plan users
 * Features: Client management, API keys, programmatic access, all workflow tools
 */

import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useCredits } from "@/hooks/useCredits";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import {
  Users,
  BarChart3,
  Settings,
  Sparkles,
  FolderKanban,
  Zap,
  Crown,
  TrendingUp,
  Shield,
  Mail,
  Coins,
  Activity,
  Building2,
  CheckCircle2,
  Clock,
  Bell,
  Home,
  Package,
  Key,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertCircle,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Services
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  getClientStats,
  type Client,
} from "@/services/clientService";
import {
  getAPIKeys,
  createAPIKey,
  deleteAPIKey,
  updateAPIKey,
  type APIKey,
} from "@/services/apiKeyService";

export default function AgencyDashboard() {
  const { profile } = useProfile();
  const { balance } = useCredits();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("overview");
  const [clients, setClients] = useState<Client[]>([]);
  const [apiKeys, setAPIKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Client dialog state
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    company: "",
    notes: "",
  });

  // API Key dialog state
  const [showAPIKeyDialog, setShowAPIKeyDialog] = useState(false);
  const [newAPIKey, setNewAPIKey] = useState<{ key: string; name: string } | null>(null);
  const [apiKeyForm, setAPIKeyForm] = useState({ name: "" });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'client' | 'apiKey'; id: string; name: string } | null>(null);

  const creditsRemaining = balance?.credits_remaining || 750;
  const batchCreditsRemaining = balance?.batch_credits_remaining || 50;

  // Load data
  useEffect(() => {
    if (activeTab === "clients") {
      loadClients();
    } else if (activeTab === "api-keys") {
      loadAPIKeys();
    }
  }, [activeTab]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error("Failed to load clients:", error);
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAPIKeys = async () => {
    try {
      setLoading(true);
      const data = await getAPIKeys();
      setAPIKeys(data);
    } catch (error) {
      console.error("Failed to load API keys:", error);
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Client operations
  const handleCreateClient = async () => {
    try {
      await createClient(clientForm);
      toast({
        title: "Success",
        description: "Client created successfully",
      });
      setShowClientDialog(false);
      setClientForm({ name: "", email: "", company: "", notes: "" });
      loadClients();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create client",
        variant: "destructive",
      });
    }
  };

  const handleUpdateClient = async () => {
    if (!editingClient) return;
    try {
      await updateClient(editingClient.id, clientForm);
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
      setShowClientDialog(false);
      setEditingClient(null);
      setClientForm({ name: "", email: "", company: "", notes: "" });
      loadClients();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await deleteClient(clientId);
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
      setDeleteConfirm(null);
      loadClients();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    }
  };

  // API Key operations
  const handleCreateAPIKey = async () => {
    try {
      const { apiKey, plainKey } = await createAPIKey({
        name: apiKeyForm.name,
      });
      setNewAPIKey({ key: plainKey, name: apiKey.name });
      setApiKeyForm({ name: "" });
      loadAPIKeys();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAPIKey = async (keyId: string) => {
    try {
      await deleteAPIKey(keyId);
      toast({
        title: "Success",
        description: "API key deleted successfully",
      });
      setDeleteConfirm(null);
      loadAPIKeys();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    }
  };

  const handleToggleAPIKey = async (keyId: string, currentStatus: boolean) => {
    try {
      await updateAPIKey(keyId, { is_active: !currentStatus });
      toast({
        title: "Success",
        description: `API key ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
      loadAPIKeys();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update API key",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">StreamSuite</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Agency Dashboard</p>
                </div>
              </div>

              {/* Main Navigation */}
              <div className="hidden lg:flex items-center gap-1">
                <Button
                  variant={activeTab === 'overview' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('overview')}
                  className="gap-2"
                >
                  <Home className="h-4 w-4" />
                  Overview
                </Button>
                <Button
                  variant={activeTab === 'clients' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('clients')}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Clients
                </Button>
                <Button
                  variant={activeTab === 'api-keys' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('api-keys')}
                  className="gap-2"
                >
                  <Key className="h-4 w-4" />
                  API Keys
                </Button>
                <Button
                  variant={activeTab === 'workflows' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('workflows')}
                  className="gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Workflows
                </Button>
                <Button
                  variant={activeTab === 'analytics' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('analytics')}
                  className="gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Button>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Credits Display */}
              <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{creditsRemaining}</span>
                  <span className="text-xs text-gray-500">credits</span>
                </div>
                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{batchCreditsRemaining}</span>
                  <span className="text-xs text-gray-500">batch</span>
                </div>
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
                  <Crown className="h-3 w-3 mr-1" />
                  Agency
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Clients
                    </CardTitle>
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {clients.length}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Active client accounts
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      API Keys
                    </CardTitle>
                    <Key className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {apiKeys.filter(k => k.is_active).length}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Active API keys
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Credit Usage
                    </CardTitle>
                    <BarChart3 className="h-5 w-5 text-amber-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {((750 - creditsRemaining) / 750 * 100).toFixed(0)}%
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {750 - creditsRemaining} / 750 used
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Quick Access
                    </CardTitle>
                    <Sparkles className="h-5 w-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => navigate('/')}
                  >
                    Generate Workflow
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Client Management</CardTitle>
                  <CardDescription>Organize work by client</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveTab('clients')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View All Clients ({clients.length})
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab('clients');
                      setShowClientDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Client
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Programmatic Access</CardTitle>
                  <CardDescription>Manage API keys</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveTab('api-keys')}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    View All Keys ({apiKeys.length})
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab('api-keys');
                      setShowAPIKeyDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create API Key
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Workflow Tools Quick Access */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Workflow Tools</CardTitle>
                <CardDescription>Access all automation features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <Button variant="outline" size="sm" className="h-auto flex-col gap-2 py-4" onClick={() => navigate('/')}>
                    <Sparkles className="h-5 w-5" />
                    <span className="text-xs">Generator</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto flex-col gap-2 py-4" onClick={() => navigate('/batch')}>
                    <Package className="h-5 w-5" />
                    <span className="text-xs">Batch</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto flex-col gap-2 py-4" onClick={() => navigate('/templates')}>
                    <FolderKanban className="h-5 w-5" />
                    <span className="text-xs">Templates</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto flex-col gap-2 py-4" onClick={() => navigate('/debugger')}>
                    <Activity className="h-5 w-5" />
                    <span className="text-xs">Debugger</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto flex-col gap-2 py-4" onClick={() => navigate('/monitoring')}>
                    <Zap className="h-5 w-5" />
                    <span className="text-xs">Monitoring</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto flex-col gap-2 py-4" onClick={() => navigate('/history')}>
                    <Clock className="h-5 w-5" />
                    <span className="text-xs">History</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your agency clients</p>
              </div>
              <Button onClick={() => {
                setEditingClient(null);
                setClientForm({ name: "", email: "", company: "", notes: "" });
                setShowClientDialog(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Client List */}
            {loading ? (
              <div className="text-center py-12">
                <Activity className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              </div>
            ) : filteredClients.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery ? "No clients found" : "No clients yet. Add your first client to get started."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClients.map((client) => (
                  <Card key={client.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{client.name}</CardTitle>
                          {client.company && (
                            <CardDescription className="text-sm truncate">{client.company}</CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingClient(client);
                              setClientForm({
                                name: client.name,
                                email: client.email || "",
                                company: client.company || "",
                                notes: client.notes || "",
                              });
                              setShowClientDialog(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => setDeleteConfirm({ type: 'client', id: client.id, name: client.name })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {client.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.notes && (
                        <p className="text-xs text-gray-500 line-clamp-2">{client.notes}</p>
                      )}
                      <div className="pt-2 text-xs text-gray-400">
                        Added {new Date(client.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api-keys' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">API Keys</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Manage programmatic access</p>
              </div>
              <Button onClick={() => {
                setApiKeyForm({ name: "" });
                setShowAPIKeyDialog(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </div>

            {/* API Documentation */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      API Documentation
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Use API keys to generate workflows programmatically. View our API docs for integration details.
                    </p>
                    <Button variant="link" size="sm" className="text-blue-600 p-0 h-auto mt-2">
                      View API Documentation →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Key List */}
            {loading ? (
              <div className="text-center py-12">
                <Activity className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              </div>
            ) : apiKeys.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Key className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No API keys yet. Create your first key to enable programmatic access.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <Card key={apiKey.id} className="border-0 shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{apiKey.name}</h3>
                            <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                              {apiKey.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {apiKey.key_prefix}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(apiKey.key_prefix)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Created {new Date(apiKey.created_at).toLocaleDateString()}
                            {apiKey.last_used_at && ` • Last used ${new Date(apiKey.last_used_at).toLocaleDateString()}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAPIKey(apiKey.id, apiKey.is_active)}
                          >
                            {apiKey.is_active ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                            {apiKey.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setDeleteConfirm({ type: 'apiKey', id: apiKey.id, name: apiKey.name })}
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Workflows Tab */}
        {activeTab === 'workflows' && (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Access workflow tools from the sidebar or overview tab
              </p>
              <Button onClick={() => setActiveTab('overview')}>
                Go to Overview
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>Track credit usage and performance</CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Advanced analytics coming soon
              </p>
              <Badge variant="outline">Available Q2 2026</Badge>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Client Dialog */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
            <DialogDescription>
              {editingClient ? "Update client information" : "Add a new client to your agency"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Client Name *</Label>
              <Input
                id="name"
                value={clientForm.name}
                onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={clientForm.email}
                onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                placeholder="contact@acme.com"
              />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={clientForm.company}
                onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                placeholder="Acme Corporation"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={clientForm.notes}
                onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                placeholder="Additional notes about this client..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClientDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={editingClient ? handleUpdateClient : handleCreateClient}
              disabled={!clientForm.name}
            >
              {editingClient ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Key Dialog */}
      <Dialog open={showAPIKeyDialog} onOpenChange={(open) => {
        setShowAPIKeyDialog(open);
        if (!open) setNewAPIKey(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key for programmatic access
            </DialogDescription>
          </DialogHeader>
          {newAPIKey ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900 dark:text-green-200 mb-2">
                      API Key Created Successfully
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 mb-3">
                      Save this key now - you won't be able to see it again!
                    </p>
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-900 rounded border border-green-300">
                      <code className="text-sm font-mono flex-1 break-all">{newAPIKey.key}</code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(newAPIKey.key)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="keyName">Key Name *</Label>
                <Input
                  id="keyName"
                  value={apiKeyForm.name}
                  onChange={(e) => setApiKeyForm({ ...apiKeyForm, name: e.target.value })}
                  placeholder="Production API Key"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            {newAPIKey ? (
              <Button onClick={() => {
                setShowAPIKeyDialog(false);
                setNewAPIKey(null);
              }}>
                Done
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowAPIKeyDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAPIKey}
                  disabled={!apiKeyForm.name}
                >
                  Create Key
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteConfirm?.type === 'client' ? 'client' : 'API key'} "{deleteConfirm?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  if (deleteConfirm.type === 'client') {
                    handleDeleteClient(deleteConfirm.id);
                  } else {
                    handleDeleteAPIKey(deleteConfirm.id);
                  }
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
