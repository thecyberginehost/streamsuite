/**
 * Sign-Up Page - Multi-Step Flow
 *
 * Step 1: Email + Password
 * Step 2: Choose Plan (Free skips to dashboard, Paid goes to Step 3)
 * Step 3: Payment (Stripe checkout for paid plans)
 * Step 4: Redirect to appropriate dashboard
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Zap, Mail, Lock, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';
import { toast } from 'sonner';

type SignUpStep = 'credentials' | 'plan' | 'payment' | 'complete';

export default function SignUp() {
  const [step, setStep] = useState<SignUpStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  /**
   * Get the appropriate domain URL based on environment
   */
  const getDomainUrl = (domain: 'marketing' | 'app' | 'agency'): string => {
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isDev) {
      return window.location.origin; // Use localhost for development
    }

    // Production domains from env vars
    const domains = {
      marketing: import.meta.env.VITE_MARKETING_DOMAIN || 'https://streamsuite.io',
      app: import.meta.env.VITE_APP_DOMAIN || 'https://app.streamsuite.io',
      agency: import.meta.env.VITE_AGENCY_DOMAIN || 'https://agency.streamsuite.io'
    };

    return domains[domain];
  };

  // Step 1: Handle Credentials
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For now, just move to plan selection
      // In production, we'll validate email availability here
      setStep('plan');
    } catch (error: any) {
      toast.error(error.message || 'Failed to validate credentials');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle Plan Selection
  const handlePlanSelection = async (planId: string) => {
    setSelectedPlan(planId);

    if (planId === 'free') {
      // Free plan: Create account immediately and go to app
      setLoading(true);
      try {
        const { error } = await signUp(email, password);
        if (error) {
          toast.error(error.message);
          return;
        }

        // TODO: Create profile, add 5 free credits
        toast.success('Welcome to StreamSuite! You have 5 free credits.');

        // Redirect to app domain after successful signup
        window.location.href = `${getDomainUrl('app')}/app`;
      } catch (error: any) {
        toast.error(error.message || 'Failed to create account');
      } finally {
        setLoading(false);
      }
    } else if (planId === 'agency') {
      // Agency plan: Show contact sales message
      toast.info('Please contact sales@streamsuite.io for Agency plans');
    } else {
      // Paid plan: Go to payment step
      setStep('payment');
    }
  };

  // Step 3: Handle Payment (Stripe integration)
  const handlePayment = async () => {
    setLoading(true);

    try {
      // TODO: Integrate with Stripe
      // 1. Create Stripe checkout session
      // 2. Redirect to Stripe
      // 3. On success, create account + subscription
      // 4. Add credits and redirect to app

      toast.info('Stripe payment integration coming soon!');

      // For now, just create the account
      const { error } = await signUp(email, password);
      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Account created! Payment integration coming soon.');

      // Redirect to app domain after successful signup
      window.location.href = `${getDomainUrl('app')}/app`;
    } catch (error: any) {
      toast.error(error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const availablePlans = [
    {
      ...SUBSCRIPTION_PLANS.free,
      popular: false,
      badge: 'Start Free',
      badgeColor: 'bg-gray-100 text-gray-700'
    },
    {
      ...SUBSCRIPTION_PLANS.starter,
      popular: false,
      badge: 'Best for Individuals',
      badgeColor: 'bg-green-100 text-green-700'
    },
    {
      ...SUBSCRIPTION_PLANS.pro,
      popular: true,
      badge: 'Most Popular',
      badgeColor: 'bg-blue-100 text-blue-700'
    },
    {
      ...SUBSCRIPTION_PLANS.growth,
      popular: false,
      badge: 'For Power Users',
      badgeColor: 'bg-purple-100 text-purple-700'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4">
      {/* Step Indicator */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2 bg-white rounded-full px-6 py-3 shadow-sm border">
          <div className={`flex items-center gap-2 ${step === 'credentials' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold">1</div>
            <span className="text-sm font-medium">Account</span>
          </div>
          <div className="w-8 h-px bg-gray-300" />
          <div className={`flex items-center gap-2 ${step === 'plan' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold">2</div>
            <span className="text-sm font-medium">Plan</span>
          </div>
          <div className="w-8 h-px bg-gray-300" />
          <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold">3</div>
            <span className="text-sm font-medium">Payment</span>
          </div>
        </div>
      </div>

      {/* Step 1: Credentials */}
      {step === 'credentials' && (
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-3 text-center pb-6">
            <div className="flex justify-center">
              <img
                src="https://ai-stream-solutions.s3.us-east-1.amazonaws.com/StreamSuite.png"
                alt="StreamSuite"
                className="h-16 w-auto"
              />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Create Your Account
            </CardTitle>
            <CardDescription className="text-base">
              Get started with 5 free credits. No credit card required.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleCredentialsSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Must be at least 6 characters long
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Processing...' : 'Continue'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </form>

          <CardFooter className="flex flex-col border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                // Redirect to login on the same domain (works for both localhost and app.streamsuite.io)
                window.location.href = `${window.location.origin}/login`;
              }}
              className="w-full"
            >
              Already have an account? <strong className="ml-1">Sign in</strong>
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Plan Selection */}
      {step === 'plan' && (
        <Card className="w-full max-w-5xl shadow-xl">
          <CardHeader className="space-y-3 text-center pb-6">
            <CardTitle className="text-3xl font-bold">Choose Your Plan</CardTitle>
            <CardDescription className="text-base">
              Select the plan that fits your needs. You can upgrade anytime.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {availablePlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative cursor-pointer transition-all hover:shadow-lg ${
                    plan.popular ? 'border-blue-500 border-2' : 'border-gray-200'
                  }`}
                  onClick={() => !loading && handlePlanSelection(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white px-3 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardContent className="p-6 text-center">
                    <h3 className="text-xl font-bold mb-2">{plan.displayName}</h3>
                    <div className="text-3xl font-bold mb-4">
                      {plan.price.monthly === 0 ? 'Free' : `$${plan.price.monthly}`}
                      {plan.price.monthly > 0 && (
                        <span className="text-base font-normal text-gray-500">/mo</span>
                      )}
                    </div>

                    <Badge className={`mb-4 ${plan.badgeColor}`}>
                      {plan.badge}
                    </Badge>

                    <p className="text-sm text-gray-600 mb-4">
                      {plan.credits.monthly} credits/month
                    </p>

                    <ul className="space-y-2 text-left text-sm mb-4">
                      {plan.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                      disabled={loading}
                    >
                      {plan.id === 'free' ? 'Start Free' : `Select ${plan.displayName}`}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Button variant="ghost" onClick={() => setStep('credentials')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Payment */}
      {step === 'payment' && (
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-3 text-center pb-6">
            <CardTitle className="text-3xl font-bold">Complete Payment</CardTitle>
            <CardDescription className="text-base">
              Subscribe to {SUBSCRIPTION_PLANS[selectedPlan as keyof typeof SUBSCRIPTION_PLANS]?.displayName} plan
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold">
                  {SUBSCRIPTION_PLANS[selectedPlan as keyof typeof SUBSCRIPTION_PLANS]?.displayName}
                </span>
                <span className="text-2xl font-bold">
                  ${SUBSCRIPTION_PLANS[selectedPlan as keyof typeof SUBSCRIPTION_PLANS]?.price.monthly}/mo
                </span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  {SUBSCRIPTION_PLANS[selectedPlan as keyof typeof SUBSCRIPTION_PLANS]?.credits.monthly} credits per month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Credits refresh monthly
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  7-day refund policy (if zero credits used)
                </li>
              </ul>
            </div>

            {/* Stripe Payment Form Will Go Here */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Stripe Payment Form</p>
              <p className="text-sm text-gray-500 mt-2">Integration coming soon</p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? 'Processing Payment...' : 'Complete Payment'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button variant="ghost" onClick={() => setStep('plan')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Plans
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
