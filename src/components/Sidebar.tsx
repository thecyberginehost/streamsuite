/**
 * Sidebar Component
 *
 * Navigation sidebar for the dashboard
 */

import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Zap, Sparkles, Settings, History, Bug, RefreshCw, BookOpen, Layers, Shield, Package, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isAdmin } from '@/services/adminService';
import { useProfile } from '@/hooks/useProfile';
import { canAccessFeature, getUpgradeMessage } from '@/config/subscriptionPlans';
import UpgradeDialog from '@/components/UpgradeDialog';
import { isFeatureEnabled } from '@/services/featureFlagService';

const navigation = [
  {
    name: 'Generator',
    href: '/',
    icon: Sparkles,
    description: 'Generate workflows with AI',
    requiredFeature: 'workflow_generation'
  },
  {
    name: 'Batch Generator',
    href: '/batch',
    icon: Package,
    description: 'Generate workflow sets',
    requiredFeature: 'batch_operations',
    badge: 'Growth+'
  },
  {
    name: 'Templates',
    href: '/templates',
    icon: Layers,
    description: 'Browse ready-made workflows',
    requiredFeature: 'templates' // Requires Pro plan
  },
  {
    name: 'Debugger',
    href: '/debugger',
    icon: Bug,
    description: 'Fix broken workflows',
    requiredFeature: 'workflow_debugging'
  },
  {
    name: 'Monitoring',
    href: '/monitoring',
    icon: Zap,
    description: 'Monitor n8n workflows',
    requiredFeature: 'n8n_push',
    badge: 'Pro+'
  },
  {
    name: 'History',
    href: '/history',
    icon: History,
    description: 'View past workflows',
    requiredFeature: 'history'
  },
  {
    name: 'Prompt Guide',
    href: '/docs',
    icon: BookOpen,
    description: 'How to write great prompts',
    requiredFeature: 'workflow_generation' // Available to all
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'n8n connections & account settings',
  },
  // Future features (v2)
  // {
  //   name: 'Converter',
  //   href: '/converter',
  //   icon: RefreshCw,
  //   description: 'Convert between platforms',
  //   comingSoon: true
  // },
];

export function Sidebar() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [showEnterpriseBuilder, setShowEnterpriseBuilder] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState<{
    name: string;
    feature: string;
    requiredPlan: 'starter' | 'pro' | 'growth' | 'agency';
  } | null>(null);

  const { profile } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
    checkEnterpriseBuilderFlag();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const adminStatus = await isAdmin();
      setShowAdmin(adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const checkEnterpriseBuilderFlag = async () => {
    try {
      const isEnabled = await isFeatureEnabled('enterprise_builder');
      const adminStatus = await isAdmin();
      // Show if flag is enabled OR if user is admin (for development)
      setShowEnterpriseBuilder(isEnabled || adminStatus);
    } catch (error) {
      console.error('Error checking enterprise builder flag:', error);
    }
  };

  const handleNavigationClick = (e: React.MouseEvent, item: typeof navigation[0]) => {
    if (!profile || !item.requiredFeature) return;

    const hasAccess = canAccessFeature(profile.subscription_tier, item.requiredFeature);

    if (!hasAccess) {
      e.preventDefault();

      // Determine required plan based on feature
      const getRequiredPlan = (feature: string): 'starter' | 'pro' | 'growth' | 'agency' => {
        if (feature === 'code_generation' || feature === 'history') return 'starter';
        if (feature === 'templates' || feature === 'workflow_debugging' || feature === 'workflow_conversion') return 'pro';
        if (feature === 'api_access' || feature === 'batch_operations') return 'growth';
        return 'agency';
      };

      setBlockedFeature({
        name: item.name,
        feature: item.requiredFeature,
        requiredPlan: getRequiredPlan(item.requiredFeature)
      });
      setUpgradeDialogOpen(true);
    }
  };

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-56">
        <div className="flex flex-col flex-grow bg-white dark:bg-[#0d0d0d] border-r border-gray-200/80 dark:border-gray-800/50 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4 h-14 border-b border-gray-200/80 dark:border-gray-800/50">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded-md">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">StreamSuite</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                onClick={(e) => handleNavigationClick(e, item)}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-2 px-2 py-1.5 text-[13px] font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-gray-100 dark:bg-gray-800/60 text-gray-900 dark:text-gray-100'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/40 hover:text-gray-900 dark:hover:text-gray-200'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        isActive ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'
                      )}
                    />
                    <span className="flex-1">{item.name}</span>
                    {(item as any).comingSoon && (
                      <span className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded font-medium">
                        Soon
                      </span>
                    )}
                    {(item as any).badge && (
                      <span className="text-[9px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-medium">
                        {(item as any).badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}

            {/* Enterprise Builder - Conditional based on feature flag */}
            {showEnterpriseBuilder && (
              <NavLink
                to="/enterprise-builder"
                onClick={(e) => handleNavigationClick(e, {
                  name: 'Enterprise Builder',
                  href: '/enterprise-builder',
                  icon: Building2,
                  description: 'Complex workflows (20-100+ nodes)',
                  requiredFeature: 'batch_operations'
                })}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-2 px-2 py-1.5 text-[13px] font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-gray-100 dark:bg-gray-800/60 text-gray-900 dark:text-gray-100'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/40 hover:text-gray-900 dark:hover:text-gray-200'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Building2
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        isActive ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'
                      )}
                    />
                    <span className="flex-1">Enterprise Builder</span>
                    <span className="text-[9px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-medium">
                      Growth+
                    </span>
                  </>
                )}
              </NavLink>
            )}

            {/* Admin Link - Only visible to admin users */}
            {showAdmin && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-800 my-2" />
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-2 px-2 py-1.5 text-[13px] font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Shield
                        className={cn(
                          'h-4 w-4 flex-shrink-0',
                          isActive ? 'text-purple-600 dark:text-purple-400' : 'text-purple-500 dark:text-purple-500'
                        )}
                      />
                      <span className="flex-1">Admin</span>
                    </>
                  )}
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Upgrade Dialog */}
      {blockedFeature && (
        <UpgradeDialog
          open={upgradeDialogOpen}
          onOpenChange={setUpgradeDialogOpen}
          feature={blockedFeature.name}
          message={getUpgradeMessage(profile?.subscription_tier || 'free', blockedFeature.feature)}
          requiredPlan={blockedFeature.requiredPlan}
        />
      )}
    </div>
  );
}
