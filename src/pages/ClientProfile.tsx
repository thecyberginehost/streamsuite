/**
 * Client Profile Page
 *
 * Comprehensive client management page for agencies
 * - Edit client details and logo
 * - Manage platform connections (n8n, Make, Zapier)
 * - View client's workflows
 * - Client-specific analytics
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Edit2,
  Loader2,
  Workflow,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ClientConnectionManager } from '@/components/ClientConnectionManager';
import {
  getClient,
  updateClient,
  getClientStats,
  type Client,
} from '@/services/clientService';

export default function ClientProfile() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);

  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalWorkflows: 0,
    totalConnections: 0,
    recentActivity: null as Date | null,
  });

  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    logo_url: '',
    billing_email: '',
    primary_contact_name: '',
    primary_contact_email: '',
    notes: '',
    status: 'active' as 'active' | 'inactive' | 'paused',
  });

  useEffect(() => {
    if (clientId) {
      loadClient();
      loadStats();
    }
  }, [clientId]);

  const loadClient = async () => {
    try {
      setLoading(true);
      const data = await getClient(clientId!);
      setClient(data);
      setForm({
        name: data.name,
        company: data.company || '',
        email: data.email || '',
        phone: (data as any).phone || '',
        website: (data as any).website || '',
        address: (data as any).address || '',
        logo_url: (data as any).logo_url || '',
        billing_email: (data as any).billing_email || '',
        primary_contact_name: (data as any).primary_contact_name || '',
        primary_contact_email: (data as any).primary_contact_email || '',
        notes: data.notes || '',
        status: (data as any).status || 'active',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load client',
        variant: 'destructive',
      });
      navigate('/agency');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getClientStats(clientId!);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateClient(clientId!, form);
      toast({
        title: 'Success',
        description: 'Client updated successfully',
      });
      setIsEditing(false);
      loadClient();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update client',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      paused: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/agency?tab=clients')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Clients
              </Button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-3">
                {form.logo_url ? (
                  <img
                    src={form.logo_url}
                    alt={client.name}
                    className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {client.name}
                  </h1>
                  {client.company && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{client.company}</p>
                  )}
                </div>
                <Badge className={getStatusColor(form.status)}>
                  {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      loadClient();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Client
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Workflows</p>
                      <p className="text-2xl font-bold mt-1">{stats.totalWorkflows}</p>
                    </div>
                    <Workflow className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Connections</p>
                      <p className="text-2xl font-bold mt-1">{stats.totalConnections}</p>
                    </div>
                    <Activity className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Projects</p>
                      <p className="text-2xl font-bold mt-1">{stats.totalProjects}</p>
                      <p className="text-xs text-gray-500 mt-1">{stats.activeProjects} active</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                      <p className="text-2xl font-bold mt-1">
                        {stats.totalConnections > 0 ? (
                          <CheckCircle2 className="h-8 w-8 text-green-600" />
                        ) : (
                          <AlertCircle className="h-8 w-8 text-yellow-600" />
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {client.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{client.email}</span>
                    </div>
                  )}
                  {form.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{form.phone}</span>
                    </div>
                  )}
                  {form.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <a
                        href={form.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {form.website}
                      </a>
                    </div>
                  )}
                  {form.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{form.address}</span>
                    </div>
                  )}
                  {!client.email && !form.phone && !form.website && !form.address && (
                    <p className="text-sm text-gray-500">No contact information added</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.recentActivity ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Last workflow created:
                      </p>
                      <p className="text-sm font-medium">
                        {stats.recentActivity.toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No activity yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Notes */}
            {client.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {client.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Details</CardTitle>
                <CardDescription>
                  {isEditing ? 'Edit client information' : 'View client information'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Client Name *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(value: 'active' | 'inactive' | 'paused') =>
                        setForm({ ...form, status: value })
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <Input
                      id="logo_url"
                      value={form.logo_url}
                      onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      placeholder="https://example.com"
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="primary_contact_name">Primary Contact Name</Label>
                    <Input
                      id="primary_contact_name"
                      value={form.primary_contact_name}
                      onChange={(e) => setForm({ ...form, primary_contact_name: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="primary_contact_email">Primary Contact Email</Label>
                    <Input
                      id="primary_contact_email"
                      type="email"
                      value={form.primary_contact_email}
                      onChange={(e) =>
                        setForm({ ...form, primary_contact_email: e.target.value })
                      }
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="billing_email">Billing Email</Label>
                    <Input
                      id="billing_email"
                      type="email"
                      value={form.billing_email}
                      onChange={(e) => setForm({ ...form, billing_email: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={4}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections">
            <ClientConnectionManager clientId={clientId!} clientName={client.name} />
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows">
            <Card>
              <CardHeader>
                <CardTitle>Client Workflows</CardTitle>
                <CardDescription>
                  Manage workflows across n8n, Make.com, and Zapier platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Workflow className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="text-lg font-semibold mb-2">
                    Unified Workflow Management
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    View and manage all {client.name}'s workflows in one place. Access n8n workflows,
                    Make.com scenarios, and Zapier automation with dedicated tabs for each platform.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      size="lg"
                      onClick={() => navigate(`/agency/client/${clientId}/workflows`)}
                      className="gap-2"
                    >
                      <Workflow className="h-5 w-5" />
                      View All Workflows
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => navigate('/agency/generator')}
                    >
                      Generate New Workflow
                    </Button>
                  </div>

                  {/* Quick Stats */}
                  {stats && (
                    <div className="grid grid-cols-3 gap-4 mt-8 max-w-lg mx-auto">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {stats.totalWorkflows}
                        </div>
                        <div className="text-xs text-gray-600">Total Workflows</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {stats.totalConnections}
                        </div>
                        <div className="text-xs text-gray-600">Platform Connections</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {stats.activeWorkflows}
                        </div>
                        <div className="text-xs text-gray-600">Active</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Client Analytics</CardTitle>
                <CardDescription>Performance metrics for {client.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Analytics coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
