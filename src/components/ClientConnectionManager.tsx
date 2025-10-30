/**
 * Client Connection Manager Component
 *
 * Manage platform API connections for a client
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Loader2,
  Link as LinkIcon,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getClientConnections,
  createClientConnection,
  updateClientConnection,
  deleteClientConnection,
  testClientConnection,
  type ClientPlatformConnection,
} from '@/services/clientPlatformService';

interface ClientConnectionManagerProps {
  clientId: string;
  clientName: string;
}

export function ClientConnectionManager({ clientId, clientName }: ClientConnectionManagerProps) {
  const { toast } = useToast();
  const [connections, setConnections] = useState<ClientPlatformConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingConnection, setEditingConnection] = useState<ClientPlatformConnection | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  const [form, setForm] = useState({
    platform: 'n8n' as 'n8n' | 'make' | 'zapier',
    connection_name: '',
    // n8n
    n8n_instance_url: '',
    n8n_api_key: '',
    // Make
    make_api_key: '',
    make_team_id: '',
    // Zapier
    zapier_api_key: '',
  });

  useEffect(() => {
    loadConnections();
  }, [clientId]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const data = await getClientConnections(clientId);
      setConnections(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load connections',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createClientConnection({
        client_id: clientId,
        platform: form.platform,
        connection_name: form.connection_name,
        ...(form.platform === 'n8n' && {
          n8n_instance_url: form.n8n_instance_url,
          n8n_api_key: form.n8n_api_key,
        }),
        ...(form.platform === 'make' && {
          make_api_key: form.make_api_key,
          make_team_id: form.make_team_id,
        }),
        ...(form.platform === 'zapier' && {
          zapier_api_key: form.zapier_api_key,
        }),
      });

      toast({
        title: 'Success',
        description: 'Connection created successfully',
      });

      setShowDialog(false);
      resetForm();
      loadConnections();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create connection',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingConnection) return;

    try {
      await updateClientConnection(editingConnection.id, {
        connection_name: form.connection_name,
        ...(form.platform === 'n8n' && {
          n8n_instance_url: form.n8n_instance_url,
          n8n_api_key: form.n8n_api_key,
        }),
        ...(form.platform === 'make' && {
          make_api_key: form.make_api_key,
          make_team_id: form.make_team_id,
        }),
        ...(form.platform === 'zapier' && {
          zapier_api_key: form.zapier_api_key,
        }),
      });

      toast({
        title: 'Success',
        description: 'Connection updated successfully',
      });

      setShowDialog(false);
      setEditingConnection(null);
      resetForm();
      loadConnections();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update connection',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteClientConnection(id);
      toast({
        title: 'Success',
        description: 'Connection deleted successfully',
      });
      setDeleteConfirm(null);
      loadConnections();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete connection',
        variant: 'destructive',
      });
    }
  };

  const handleTest = async (connectionId: string) => {
    try {
      setTestingConnection(connectionId);
      const result = await testClientConnection(connectionId);

      toast({
        title: result.success ? 'Success' : 'Failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });

      loadConnections();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Connection test failed',
        variant: 'destructive',
      });
    } finally {
      setTestingConnection(null);
    }
  };

  const resetForm = () => {
    setForm({
      platform: 'n8n',
      connection_name: '',
      n8n_instance_url: '',
      n8n_api_key: '',
      make_api_key: '',
      make_team_id: '',
      zapier_api_key: '',
    });
  };

  const openCreateDialog = () => {
    setEditingConnection(null);
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (connection: ClientPlatformConnection) => {
    setEditingConnection(connection);
    setForm({
      platform: connection.platform,
      connection_name: connection.connection_name,
      n8n_instance_url: connection.n8n_instance_url || '',
      n8n_api_key: connection.n8n_api_key || '',
      make_api_key: connection.make_api_key || '',
      make_team_id: connection.make_team_id || '',
      zapier_api_key: connection.zapier_api_key || '',
    });
    setShowDialog(true);
  };

  const getPlatformIcon = (platform: string) => {
    const icons = {
      n8n: '⚡',
      make: '🔧',
      zapier: '⚙️',
    };
    return icons[platform as keyof typeof icons] || '🔗';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Platform Connections</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage API connections for {clientName}
          </p>
        </div>
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Connection
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
        </div>
      ) : connections.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <LinkIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 dark:text-gray-400">
              No platform connections yet. Add one to start tracking workflows.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {connections.map((connection) => (
            <Card key={connection.id} className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">{getPlatformIcon(connection.platform)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{connection.connection_name}</h4>
                        <Badge variant={connection.is_active ? 'default' : 'secondary'}>
                          {connection.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {connection.platform}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {connection.platform === 'n8n' && connection.n8n_instance_url}
                        {connection.platform === 'make' && connection.make_team_id && `Team: ${connection.make_team_id}`}
                        {connection.platform === 'zapier' && 'Zapier Account'}
                      </div>
                      {connection.last_tested_at && (
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          {connection.last_test_success ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-600" />
                          )}
                          <span className="text-gray-500">
                            Last tested {new Date(connection.last_tested_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(connection.id)}
                      disabled={testingConnection === connection.id}
                    >
                      {testingConnection === connection.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Test'
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(connection)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700"
                      onClick={() =>
                        setDeleteConfirm({ id: connection.id, name: connection.connection_name })
                      }
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

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingConnection ? 'Edit Connection' : 'Add Platform Connection'}
            </DialogTitle>
            <DialogDescription>
              Connect to {clientName}'s automation platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="platform">Platform *</Label>
              <Select
                value={form.platform}
                onValueChange={(value: 'n8n' | 'make' | 'zapier') =>
                  setForm({ ...form, platform: value })
                }
                disabled={!!editingConnection}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="n8n">⚡ n8n</SelectItem>
                  <SelectItem value="make">🔧 Make.com</SelectItem>
                  <SelectItem value="zapier">⚙️ Zapier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="connection_name">Connection Name *</Label>
              <Input
                id="connection_name"
                value={form.connection_name}
                onChange={(e) => setForm({ ...form, connection_name: e.target.value })}
                placeholder="Production Instance"
              />
            </div>

            {form.platform === 'n8n' && (
              <>
                <div>
                  <Label htmlFor="n8n_instance_url">n8n Instance URL *</Label>
                  <Input
                    id="n8n_instance_url"
                    value={form.n8n_instance_url}
                    onChange={(e) => setForm({ ...form, n8n_instance_url: e.target.value })}
                    placeholder="https://n8n.example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="n8n_api_key">n8n API Key *</Label>
                  <Input
                    id="n8n_api_key"
                    type="password"
                    value={form.n8n_api_key}
                    onChange={(e) => setForm({ ...form, n8n_api_key: e.target.value })}
                    placeholder="Your n8n API key"
                  />
                </div>
              </>
            )}

            {form.platform === 'make' && (
              <>
                <div>
                  <Label htmlFor="make_api_key">Make.com API Key *</Label>
                  <Input
                    id="make_api_key"
                    type="password"
                    value={form.make_api_key}
                    onChange={(e) => setForm({ ...form, make_api_key: e.target.value })}
                    placeholder="Your Make.com API key"
                  />
                </div>
                <div>
                  <Label htmlFor="make_team_id">Team ID (optional)</Label>
                  <Input
                    id="make_team_id"
                    value={form.make_team_id}
                    onChange={(e) => setForm({ ...form, make_team_id: e.target.value })}
                    placeholder="Team ID if applicable"
                  />
                </div>
              </>
            )}

            {form.platform === 'zapier' && (
              <div>
                <Label htmlFor="zapier_api_key">Zapier API Key *</Label>
                <Input
                  id="zapier_api_key"
                  type="password"
                  value={form.zapier_api_key}
                  onChange={(e) => setForm({ ...form, zapier_api_key: e.target.value })}
                  placeholder="Your Zapier API key"
                />
              </div>
            )}

            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  API credentials are encrypted and stored securely. They're only used to fetch
                  workflows and monitor executions for this client.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={editingConnection ? handleUpdate : handleCreate}
              disabled={
                !form.connection_name ||
                (form.platform === 'n8n' && (!form.n8n_instance_url || !form.n8n_api_key)) ||
                (form.platform === 'make' && !form.make_api_key) ||
                (form.platform === 'zapier' && !form.zapier_api_key)
              }
            >
              {editingConnection ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Connection?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the connection "{deleteConfirm?.name}". Workflows will
              no longer be linked to this connection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}
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
