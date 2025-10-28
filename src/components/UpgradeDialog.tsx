/**
 * Upgrade Dialog Component
 *
 * Modal popup for upgrade prompts when free users try to access locked features
 */

import { Lock, Zap, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  message: string;
  requiredPlan: 'starter' | 'pro' | 'growth' | 'agency';
}

export default function UpgradeDialog({
  open,
  onOpenChange,
  feature,
  message,
  requiredPlan,
}: UpgradeDialogProps) {
  const navigate = useNavigate();

  const planDetails = {
    starter: {
      name: 'Starter',
      price: '$19',
      color: 'from-green-500 to-emerald-500',
      badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    },
    pro: {
      name: 'Pro',
      price: '$49',
      color: 'from-blue-500 to-cyan-500',
      badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    },
    growth: {
      name: 'Growth',
      price: '$99',
      color: 'from-orange-500 to-red-500',
      badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    },
    agency: {
      name: 'Agency',
      price: '$499',
      color: 'from-purple-500 to-pink-500',
      badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    },
  };

  const plan = planDetails[requiredPlan];

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/pricing');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div
              className={cn(
                'w-16 h-16 rounded-full bg-gradient-to-r flex items-center justify-center',
                plan.color
              )}
            >
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>

          <div className="flex justify-center mb-2">
            <Badge className={cn('text-sm px-3 py-1', plan.badge)}>
              {plan.name} Feature
            </Badge>
          </div>

          <DialogTitle className="text-center text-2xl">
            Unlock {feature}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {message}
          </DialogDescription>
        </DialogHeader>

        {/* Features preview */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 my-4">
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">
              100+ workflows per month
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">
              AI-powered debugging
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">
              Priority support
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleUpgrade}
            className={cn(
              'w-full bg-gradient-to-r text-white hover:opacity-90 gap-2',
              plan.color
            )}
            size="lg"
          >
            Upgrade to {plan.name}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Starting at <span className="font-semibold">{plan.price}/month</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
