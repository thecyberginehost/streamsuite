/**
 * Admin Panel
 *
 * User and plan management for admin users
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllUsers,
  updateUserPlan,
  addCreditsToUser,
  getUserActivity,
  isAdmin,
  type AdminUser,
  type UserActivity,
} from '@/services/adminService';
import {
  getAllFeatureFlags,
  updateFeatureFlag,
  type FeatureFlag,
  type FeatureFlagKey
} from '@/services/featureFlagService';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  UserCog,
  Coins,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'starter' | 'pro' | 'growth' | 'agency'>('free');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditType, setCreditType] = useState<'regular' | 'bonus'>('regular');
  const [creditReason, setCreditReason] = useState('');
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Feature flags state
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const adminStatus = await isAdmin();
      if (!adminStatus) {
        toast({
          title: '🚫 Access Denied',
          description: 'You do not have admin privileges.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }
      loadUsers();
      loadFeatureFlags();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/');
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFeatureFlags = async () => {
    setFlagsLoading(true);
    try {
      const flags = await getAllFeatureFlags();
      setFeatureFlags(flags);
    } catch (error) {
      console.error('Error loading feature flags:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to load feature flags.',
        variant: 'destructive',
      });
    } finally {
      setFlagsLoading(false);
    }
  };

  const handleToggleFeatureFlag = async (flagKey: FeatureFlagKey, currentlyEnabled: boolean) => {
    try {
      await updateFeatureFlag(flagKey, !currentlyEnabled);

      // Update local state
      setFeatureFlags(featureFlags.map(flag =>
        flag.flag_key === flagKey
          ? { ...flag, is_enabled: !currentlyEnabled }
          : flag
      ));

      toast({
        title: '✅ Feature Flag Updated',
        description: `${flagKey} is now ${!currentlyEnabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      console.error('Error toggling feature flag:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to update feature flag.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      await updateUserPlan(selectedUser.id, selectedPlan);

      // Update local state immediately with new credit allocation
      const creditAllocations = {
        free: 5,
        starter: 25,
        pro: 100,
        growth: 250,
        agency: 750,
      };

      setUsers(users.map(u =>
        u.id === selectedUser.id
          ? {
              ...u,
              subscription_tier: selectedPlan,
              credits_remaining: creditAllocations[selectedPlan],
              total_credits: creditAllocations[selectedPlan] + u.bonus_credits
            }
          : u
      ));

      toast({
        title: '✅ Plan Updated',
        description: `${selectedUser.email} has been upgraded to ${selectedPlan.toUpperCase()} plan with ${creditAllocations[selectedPlan]} credits.`,
      });
      setShowPlanDialog(false);

      // Also reload from server to ensure consistency
      loadUsers();
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to update plan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCredits = async () => {
    if (!selectedUser || !creditAmount || !creditReason) {
      toast({
        title: '⚠️ Missing Information',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: '⚠️ Invalid Amount',
        description: 'Please enter a valid credit amount.',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      await addCreditsToUser(selectedUser.id, amount, creditType, creditReason);
      toast({
        title: '✅ Credits Added',
        description: `Added ${amount} ${creditType} credits to ${selectedUser.email}.`,
      });
      setShowCreditsDialog(false);
      setCreditAmount('');
      setCreditReason('');
      loadUsers();
    } catch (error) {
      console.error('Error adding credits:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to add credits. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewActivity = async (user: AdminUser) => {
    setSelectedUser(user);
    setActionLoading(true);
    setShowActivityDialog(true);
    try {
      const activity = await getUserActivity(user.id);
      setUserActivity(activity);
    } catch (error) {
      console.error('Error fetching activity:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to load user activity.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getPlanBadgeColor = (tier: string) => {
    switch (tier) {
      case 'agency':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'pro':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-md bg-purple-100 dark:bg-purple-900/30">
            <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Admin Panel
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage users, plans, and credits
            </p>
          </div>
        </div>
        <Button
          onClick={loadUsers}
          variant="outline"
          size="sm"
          className="h-8 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <UserCog className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Users</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{users.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Paid Users</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {users.filter(u => u.subscription_tier !== 'free').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Credits</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {users.reduce((sum, u) => sum + u.total_credits, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ToggleRight className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Feature Flags</h2>
          </div>
          <Button
            onClick={loadFeatureFlags}
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            disabled={flagsLoading}
          >
            <RefreshCw className={cn("h-3 w-3 mr-1", flagsLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        <div className="space-y-3">
          {featureFlags.length === 0 && !flagsLoading ? (
            <p className="text-xs text-gray-500 text-center py-4">No feature flags configured</p>
          ) : (
            featureFlags.map((flag) => (
              <div
                key={flag.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {flag.flag_name}
                    </p>
                    <Badge
                      variant={flag.is_enabled ? 'default' : 'outline'}
                      className={cn(
                        "text-[9px] px-1.5 py-0",
                        flag.is_enabled
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      )}
                    >
                      {flag.is_enabled ? 'ENABLED' : 'DISABLED'}
                    </Badge>
                  </div>
                  {flag.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {flag.description}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-mono">
                    {flag.flag_key}
                  </p>
                </div>
                <Switch
                  checked={flag.is_enabled}
                  onCheckedChange={() =>
                    handleToggleFeatureFlag(flag.flag_key as FeatureFlagKey, flag.is_enabled)
                  }
                  className="ml-4"
                />
              </div>
            ))
          )}
        </div>

        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-[10px] text-blue-700 dark:text-blue-400">
          <strong>Note:</strong> Feature flags control platform availability in the Custom Code Generator. When disabled, platforms show as "Coming Soon" with greyed-out buttons.
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search users by email or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* User Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200 dark:border-gray-800">
              <TableHead className="text-xs font-medium">Email</TableHead>
              <TableHead className="text-xs font-medium">Name</TableHead>
              <TableHead className="text-xs font-medium">Plan</TableHead>
              <TableHead className="text-xs font-medium">Regular Credits</TableHead>
              <TableHead className="text-xs font-medium">Bonus Credits</TableHead>
              <TableHead className="text-xs font-medium">Total</TableHead>
              <TableHead className="text-xs font-medium">Joined</TableHead>
              <TableHead className="text-xs font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="border-gray-200 dark:border-gray-800">
                <TableCell className="text-xs font-medium">
                  <div className="flex items-center gap-2">
                    {user.email}
                    {user.is_admin && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        ADMIN
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-gray-600 dark:text-gray-400">
                  {user.full_name || '-'}
                </TableCell>
                <TableCell>
                  <Badge className={cn('text-[10px] font-medium', getPlanBadgeColor(user.subscription_tier))}>
                    {user.subscription_tier.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{user.credits_remaining}</TableCell>
                <TableCell className="text-xs text-amber-600 dark:text-amber-400">
                  {user.bonus_credits}
                </TableCell>
                <TableCell className="text-xs font-medium">{user.total_credits}</TableCell>
                <TableCell className="text-xs text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      onClick={() => {
                        setSelectedUser(user);
                        setSelectedPlan(user.subscription_tier as any);
                        setShowPlanDialog(true);
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                    >
                      Change Plan
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedUser(user);
                        setCreditType('regular');
                        setShowCreditsDialog(true);
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                    >
                      Add Credits
                    </Button>
                    <Button
                      onClick={() => handleViewActivity(user)}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                    >
                      Activity
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredUsers.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-gray-500">No users found</p>
          </div>
        )}
      </div>

      {/* Update Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Subscription Plan</DialogTitle>
            <DialogDescription>
              Change the subscription plan for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plan">Select Plan</Label>
              <Select value={selectedPlan} onValueChange={(value: any) => setSelectedPlan(value)}>
                <SelectTrigger id="plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free (5 credits/month)</SelectItem>
                  <SelectItem value="starter">Starter (25 credits/month)</SelectItem>
                  <SelectItem value="pro">Pro (100 credits/month)</SelectItem>
                  <SelectItem value="growth">Growth (250 credits/month)</SelectItem>
                  <SelectItem value="agency">Agency (750 credits/month)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <p className="font-medium mb-1">Note:</p>
              <p>Updating the plan will immediately set the user's regular credits to the new plan's allocation.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePlan} disabled={actionLoading}>
              {actionLoading ? 'Updating...' : 'Update Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Credits Dialog */}
      <Dialog open={showCreditsDialog} onOpenChange={setShowCreditsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Credits</DialogTitle>
            <DialogDescription>
              Manually add credits to {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="credit-type">Credit Type</Label>
              <Select value={creditType} onValueChange={(value: any) => setCreditType(value)}>
                <SelectTrigger id="credit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular Credits (expire monthly)</SelectItem>
                  <SelectItem value="bonus">Bonus Credits (never expire)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter credit amount"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="e.g., Testing, compensation, promotion"
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreditsDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleAddCredits} disabled={actionLoading}>
              {actionLoading ? 'Adding...' : 'Add Credits'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Activity Dialog */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Activity</DialogTitle>
            <DialogDescription>
              Activity overview for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {actionLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : userActivity ? (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Total Workflows</p>
                    <p className="text-xl font-semibold">{userActivity.total_workflows}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Credits Used</p>
                    <p className="text-xl font-semibold">{userActivity.total_credits_used}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Last Activity</p>
                    <p className="text-sm font-medium">
                      {userActivity.last_activity
                        ? new Date(userActivity.last_activity).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Recent Transactions</h4>
                  <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Operation</TableHead>
                          <TableHead className="text-xs">Credits</TableHead>
                          <TableHead className="text-xs">Type</TableHead>
                          <TableHead className="text-xs">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userActivity.recent_transactions.length > 0 ? (
                          userActivity.recent_transactions.map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell className="text-xs">{tx.operation_type}</TableCell>
                              <TableCell className="text-xs">{tx.credits_used}</TableCell>
                              <TableCell className="text-xs">
                                <Badge variant="outline" className="text-[10px]">
                                  {tx.credit_type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs">
                                {new Date(tx.created_at).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-xs text-gray-500 py-4">
                              No transactions yet
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No activity data available</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActivityDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
