/**
 * Pricing Page
 *
 * Display subscription tiers with features and pricing
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Zap, Building2, ArrowRight, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { useNavigate } from 'react-router-dom';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { user } = useAuth();
  const { balance } = useCredits();
  const navigate = useNavigate();

  const currentTier = balance?.subscription_tier || 'free';

  // Standard tier configurations (Free, Starter, Pro, Growth)
  const standardPlans = [
    {
      ...SUBSCRIPTION_PLANS.free,
      icon: Sparkles,
      iconColor: 'text-gray-500',
      badgeColor: 'bg-gray-100 text-gray-700',
      buttonVariant: 'outline' as const,
      popular: false
    },
    {
      ...SUBSCRIPTION_PLANS.starter,
      icon: Zap,
      iconColor: 'text-green-500',
      badgeColor: 'bg-green-100 text-green-700',
      buttonVariant: 'outline' as const,
      popular: false
    },
    {
      ...SUBSCRIPTION_PLANS.pro,
      icon: Zap,
      iconColor: 'text-blue-500',
      badgeColor: 'bg-blue-100 text-blue-700',
      buttonVariant: 'default' as const,
      popular: true
    },
    {
      ...SUBSCRIPTION_PLANS.growth,
      icon: TrendingUp,
      iconColor: 'text-orange-500',
      badgeColor: 'bg-orange-100 text-orange-700',
      buttonVariant: 'outline' as const,
      popular: false
    }
  ];

  // Agency plan (displayed separately as horizontal card)
  const agencyPlan = {
    ...SUBSCRIPTION_PLANS.agency,
    icon: Building2,
    iconColor: 'text-purple-500',
    badgeColor: 'bg-purple-100 text-purple-700',
    buttonVariant: 'outline' as const,
    popular: false
  };

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (planId === 'free') {
      // Already on free tier
      return;
    }

    // For all paid plans - will implement Stripe checkout later
    // For now, show coming soon message
    alert('🚀 Payment integration coming soon! Check back in a few days.');
  };

  const getPriceDisplay = (plan: typeof plans[0]) => {
    if (plan.price.monthly === 0) {
      return 'Free';
    }

    const monthlyPrice = plan.price.monthly;
    const yearlyPrice = plan.price.yearly;
    const price = billingCycle === 'monthly' ? monthlyPrice : yearlyPrice;
    const perMonth = billingCycle === 'yearly' ? (yearlyPrice / 12).toFixed(0) : price;

    return (
      <>
        <span className="text-4xl font-bold">${perMonth}</span>
        <span className="text-gray-500">/month</span>
        {billingCycle === 'yearly' && (
          <div className="text-sm text-green-600 font-medium mt-1">
            Save ${(monthlyPrice * 12 - yearlyPrice).toFixed(0)} per year
          </div>
        )}
      </>
    );
  };

  const isCurrentPlan = (planId: string) => {
    return planId === currentTier;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Choose the plan that fits your workflow automation needs
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <Badge className="ml-2 bg-green-100 text-green-700 border-0">
                Save 20%
              </Badge>
            </button>
          </div>
        </div>

        {/* Standard Pricing Cards (Free, Starter, Pro, Growth) */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {standardPlans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = isCurrentPlan(plan.id);

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  plan.popular
                    ? 'border-blue-500 border-2 shadow-xl scale-105'
                    : 'border-gray-200'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-4 py-1 text-sm">
                      Most Popular
                    </Badge>
                  </div>
                )}

                {/* Coming Soon Badge */}
                {plan.comingSoon && (
                  <div className="absolute -top-4 right-4">
                    <Badge className="bg-purple-500 text-white px-3 py-1 text-xs">
                      Coming Soon
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  {/* Icon */}
                  <div className="mx-auto mb-4">
                    <div className={`inline-flex p-3 rounded-full ${plan.badgeColor}`}>
                      <Icon className={`h-8 w-8 ${plan.iconColor}`} />
                    </div>
                  </div>

                  {/* Plan Name */}
                  <CardTitle className="text-2xl mb-2">{plan.displayName}</CardTitle>

                  {/* Price */}
                  <div className="mt-4">
                    {getPriceDisplay(plan)}
                  </div>

                  {/* Credits */}
                  <CardDescription className="mt-4 text-base">
                    <span className="font-semibold text-gray-900">
                      {plan.credits.monthly} credits
                    </span>
                    {' '}per month
                    {plan.credits.rolloverMax > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        + {plan.credits.rolloverMax} rollover credits
                      </div>
                    )}
                  </CardDescription>

                </CardHeader>

                <CardContent className="flex-1">
                  {/* Features List */}
                  <ul className="space-y-3">
                    {/* Current Features */}
                    {plan.features.map((feature, index) => (
                      <li key={`current-${index}`} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                      </li>
                    ))}

                    {/* Coming Soon Features */}
                    {plan.comingSoonFeatures && plan.comingSoonFeatures.map((feature, index) => (
                      <li key={`coming-${index}`} className="flex items-start gap-3 opacity-50">
                        <Check className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-400 dark:text-gray-500">
                          {feature} <span className="text-xs italic">(Coming Soon)</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  {isCurrent ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant={plan.buttonVariant}
                      className={`w-full ${
                        plan.popular
                          ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                          : ''
                      }`}
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={plan.comingSoon}
                    >
                      {plan.comingSoon ? (
                        'Notify Me'
                      ) : plan.id === 'free' ? (
                        'Get Started'
                      ) : (
                        <>
                          Upgrade to {plan.displayName}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Agency Plan - Horizontal Card (Coming Soon) */}
        <div className="mt-12 max-w-7xl mx-auto">
          <Card className="relative border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
            <div className="absolute -top-3 left-8 flex gap-2">
              <Badge className="bg-purple-500 text-white px-4 py-1">
                For Teams & Agencies
              </Badge>
              <Badge className="bg-orange-500 text-white px-4 py-1">
                Coming Soon
              </Badge>
            </div>

            <CardContent className="p-8">
              <div className="grid md:grid-cols-[2fr_3fr_1fr] gap-8 items-start">
                {/* Left: Plan Info */}
                <div>
                  <div className="inline-flex p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                    <Building2 className="h-8 w-8 text-purple-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{agencyPlan.displayName}</h3>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                    ${billingCycle === 'monthly' ? agencyPlan.price.monthly : (agencyPlan.price.yearly / 12).toFixed(0)}
                    <span className="text-base font-normal text-gray-500">/month</span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Save ${(agencyPlan.price.monthly * 12 - agencyPlan.price.yearly).toFixed(0)}/year
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {agencyPlan.credits.monthly} credits/month • 2 seats included
                  </p>
                </div>

                {/* Middle: Features */}
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                  {/* Current Features */}
                  {agencyPlan.features.map((feature, index) => (
                    <div key={`agency-current-${index}`} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}

                  {/* Coming Soon Features */}
                  {agencyPlan.comingSoonFeatures && agencyPlan.comingSoonFeatures.map((feature, index) => (
                    <div key={`agency-coming-${index}`} className="flex items-start gap-2 opacity-50">
                      <Check className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-400 dark:text-gray-500">
                        {feature} <span className="text-xs italic">(Soon)</span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Right: CTA */}
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled
                  >
                    Coming Soon
                  </Button>
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    Perfect for agencies & teams
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Why StreamSuite is Better */}
        <div className="mt-16 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              Why StreamSuite Generates Better Workflows
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We use Claude Sonnet 4.5, Anthropic's most advanced reasoning model,
              to analyze proven automation patterns and generate production-ready
              workflows with best practices built-in.
            </p>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 px-4 py-2">
                <Sparkles className="h-4 w-4 mr-2 inline" />
                Powered by Claude Sonnet 4.5
              </Badge>
              <Badge variant="outline" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 px-4 py-2">
                <Check className="h-4 w-4 mr-2 inline" />
                95%+ Accuracy Rate
              </Badge>
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 px-4 py-2">
                <Zap className="h-4 w-4 mr-2 inline" />
                Production-Ready Output
              </Badge>
            </div>
          </div>
        </div>

        {/* FAQ / Additional Info */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What are credits?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Credits are used to generate and debug workflows. Simple workflows cost 1 credit,
                complex workflows cost 2 credits, and debugging costs 1 credit. Templates are always free!
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 dark:text-gray-400">
                Yes! You can upgrade or downgrade at any time. When upgrading, you'll get immediate
                access to all features and your new credit allocation.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens to unused credits?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 dark:text-gray-400">
                Credits refresh monthly on your billing date. Unused credits do not roll over, so make sure
                to use them before your next billing cycle!
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What are batch credits?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 dark:text-gray-400">
                Batch credits (Growth & Agency plans) let you generate complete "Workflow Sets" - orchestration
                packages with up to 10 interconnected workflows designed to work together as a system.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Which platforms do you support?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 dark:text-gray-400">
                Currently we support n8n with full features. Make.com support is coming in December 2025,
                and Zapier support is coming in January 2026.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I get a refund?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 dark:text-gray-400">
                Yes! We offer a 7-day refund policy, but only if you haven't used any credits. If you've used
                any credits, your subscription is non-refundable.
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 border-0 text-white max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-white">
                Not sure which plan is right for you?
              </CardTitle>
              <CardDescription className="text-blue-50 text-base mt-2">
                Start with the free plan and upgrade anytime. No credit card required to get started!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => navigate(user ? '/' : '/login')}
              >
                {user ? 'Start Generating' : 'Sign Up Free'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
