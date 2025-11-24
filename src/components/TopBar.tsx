/**
 * TopBar Component
 *
 * Top navigation bar with user menu and credit balance
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { useBatchCredits } from '@/hooks/useBatchCredits';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Coins, LogOut, Menu } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  credits_remaining: number;
  full_name?: string;
  email: string;
}

export function TopBar() {
  const { user, signOut } = useAuth();
  const { balance, loading: creditsLoading } = useCredits();
  const { balance: batchCredits, isLoading: batchCreditsLoading } = useBatchCredits();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('credits_remaining, full_name, email')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    return profile?.full_name || user?.email || 'User';
  };

  return (
    <div className="bg-white dark:bg-[#0d0d0d] border-b border-gray-200/80 dark:border-gray-800/50">
      <div className="px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left side - Mobile menu button (future) */}
          <div className="flex items-center md:hidden">
            <Button variant="ghost" size="sm">
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Center - Page title or breadcrumb (future) */}
          <div className="flex-1 hidden md:block">
            {/* Can add breadcrumbs or page title here */}
          </div>

          {/* Right side - Credits and User Menu */}
          <div className="flex items-center gap-2">
            {/* Credit Balance - shows regular + bonus breakdown */}
            {!creditsLoading && balance && (
              <>
                <div className="group relative flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-800/60 rounded-md border border-gray-200/80 dark:border-gray-700/50 hover:bg-gray-150 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <Coins className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                  <span className="font-medium text-xs text-gray-900 dark:text-gray-100">
                    {balance.total_credits}
                  </span>

                  {/* Tooltip showing breakdown */}
                  <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-300">Regular:</span>
                        <span className="font-medium">{balance.credits_remaining}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-300">Bonus:</span>
                        <span className="font-medium text-amber-400">{balance.bonus_credits}</span>
                      </div>
                      <div className="border-t border-gray-700 mt-1 pt-1 flex items-center justify-between gap-3">
                        <span className="text-gray-300">Total:</span>
                        <span className="font-semibold">{balance.total_credits}</span>
                      </div>
                    </div>
                    {balance.bonus_credits > 0 && (
                      <div className="text-[10px] text-gray-400 mt-1 pt-1 border-t border-gray-700">
                        Bonus credits never expire
                      </div>
                    )}
                  </div>
                </div>

                {/* Batch Credits */}
                {!batchCreditsLoading && batchCredits !== undefined && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-md border border-purple-200/80 dark:border-purple-700/50">
                    <Coins className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    <span className="font-medium text-xs text-purple-900 dark:text-purple-100">
                      {batchCredits}
                    </span>
                    <span className="text-[10px] text-purple-700 dark:text-purple-300">batch</span>
                  </div>
                )}

                {/* Show Upgrade button for free tier or low credits */}
                {(balance.subscription_tier === 'free' || balance.total_credits < 5) && (
                  <Button
                    onClick={() => navigate('/pricing')}
                    className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium h-7 px-3"
                    size="sm"
                  >
                    Upgrade
                  </Button>
                )}
              </>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{getUserDisplayName()}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Future menu items */}
                {/* <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator /> */}

                <DropdownMenuItem onClick={signOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
