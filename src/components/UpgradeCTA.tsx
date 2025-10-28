/**
 * Upgrade CTA Component
 *
 * Professional call-to-action for locked features
 */

import { Lock, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface UpgradeCTAProps {
  feature: string;
  message: string;
  requiredPlan: 'pro' | 'agency';
  variant?: 'inline' | 'overlay' | 'banner';
  className?: string;
}

export default function UpgradeCTA({
  feature,
  message,
  requiredPlan,
  variant = 'inline',
  className,
}: UpgradeCTAProps) {
  const navigate = useNavigate();

  const planDetails = {
    pro: {
      name: 'Pro',
      price: '$79',
      color: 'from-blue-500 to-cyan-500',
      badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    },
    agency: {
      name: 'Agency',
      price: '$499',
      color: 'from-purple-500 to-pink-500',
      badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    },
  };

  const plan = planDetails[requiredPlan];

  // Inline variant - compact CTA for sidebar or small spaces
  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 bg-gradient-to-r rounded-lg border border-gray-200 dark:border-gray-700',
          plan.color,
          className
        )}
      >
        <div className="flex-shrink-0 w-10 h-10 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
          <Lock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{message}</p>
          <p className="text-xs text-white/80">Starting at {plan.price}/mo</p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate('/settings?tab=billing')}
          className="flex-shrink-0 bg-white text-gray-900 hover:bg-gray-100"
        >
          Upgrade
        </Button>
      </div>
    );
  }

  // Banner variant - full width banner at top of page
  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'w-full bg-gradient-to-r p-4 border-b border-gray-200 dark:border-gray-700',
          plan.color,
          className
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center">
              <Lock className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-white">{message}</p>
              <p className="text-sm text-white/90">
                Unlock this feature with {plan.name} - Starting at {plan.price}/month
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/settings?tab=billing')}
            className="flex-shrink-0 bg-white text-gray-900 hover:bg-gray-100 gap-2"
          >
            View Plans
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Overlay variant - centered card that overlays content
  return (
    <div
      className={cn(
        'absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 overflow-y-auto',
        className
      )}
    >
      <Card className="max-w-md w-full mx-auto p-6 shadow-2xl border-2 my-auto flex-shrink-0">
        <div className="text-center space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div
              className={cn(
                'w-20 h-20 rounded-full bg-gradient-to-r flex items-center justify-center',
                plan.color
              )}
            >
              <Lock className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Badge */}
          <Badge className={cn('text-sm px-3 py-1', plan.badge)}>
            {plan.name} Feature
          </Badge>

          {/* Title */}
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Unlock {feature}
            </h3>
            <p className="text-base text-gray-600 dark:text-gray-400">{message}</p>
          </div>

          {/* Features preview */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 text-left">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-gray-700 dark:text-gray-300">
                100+ workflows per month
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-gray-700 dark:text-gray-300">
                AI-powered debugging
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-gray-700 dark:text-gray-300">
                Priority support
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/settings?tab=billing')}
              className={cn(
                'w-full bg-gradient-to-r text-white hover:opacity-90 gap-2',
                plan.color
              )}
              size="lg"
            >
              Upgrade to {plan.name}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Starting at <span className="font-semibold">{plan.price}/month</span>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
