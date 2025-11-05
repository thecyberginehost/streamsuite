/**
 * Landing Page - Killer Conversion-Optimized Page
 *
 * Main marketing page for streamsuite.io
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Zap,
  ArrowRight,
  Check,
  Sparkles,
  Code2,
  RefreshCw,
  Bug,
  Star,
  TrendingUp,
  Clock,
  Play,
  X,
  Shield,
  Rocket,
  Users,
  Crown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { createCheckoutSession, redirectToCheckout } from '@/services/stripeService';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const handleGetStarted = () => {
    if (user) {
      navigate('/app');
    } else {
      navigate('/login');
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setLoading(planId);
      const session = await createCheckoutSession(planId, billingInterval);
      await redirectToCheckout(session.url);
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start checkout',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const getPlanPrice = (planId: string) => {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) return 0;
    return billingInterval === 'monthly' ? plan.price.monthly : Math.floor(plan.price.yearly / 12);
  };

  const getSavings = (planId: string) => {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan || !plan.price.yearly) return null;
    const monthlyCost = plan.price.monthly * 12;
    const yearlyCost = plan.price.yearly;
    const savings = monthlyCost - yearlyCost;
    const percentage = Math.round((savings / monthlyCost) * 100);
    return { amount: savings, percentage };
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img
                src="https://ai-stream-solutions.s3.us-east-1.amazonaws.com/StreamSuite.png"
                alt="StreamSuite"
                className="h-12 w-auto mr-3"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                StreamSuite
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium">
                Pricing
              </a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium">
                How It Works
              </a>
              <Button onClick={handleGetStarted} className="bg-blue-600 hover:bg-blue-700">
                {user ? 'Go to App' : 'Start Free'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-purple-100 text-purple-700 border-0 px-4 py-2 text-sm">
              <Sparkles className="h-4 w-4 mr-2 inline" />
              Powered by Claude Sonnet 4.5 - The smartest AI model
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Build n8n Workflows<br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                in 30 Seconds with AI
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              No drag-and-drop. No templates. Just describe what you need in plain English and get production-ready automation workflows instantly.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" onClick={handleGetStarted} className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6 shadow-lg">
                Start Free - 5 Credits
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6">
                <a href="#demo">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </a>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 border-2 border-white" />
                  ))}
                </div>
                <span className="font-medium">500+ teams building faster</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2 font-medium">4.9/5 from 200+ reviews</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video / Screenshot Placeholder */}
      <section id="demo" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border-4 border-blue-200 shadow-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 relative group cursor-pointer">
            <div className="aspect-video flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Play className="h-10 w-10 text-white ml-1" />
                </div>
                <p className="text-2xl font-bold mb-2">Watch How It Works</p>
                <p className="text-gray-300">2-minute demo showing real workflow generation</p>
              </div>
            </div>
            {/* Placeholder: Replace with actual video embed or screenshot */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center pb-8">
              <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 px-4 py-2">
                📸 Screenshot / Demo Video Goes Here
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Core Value Props - 3 Cards */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Developers & Ops Teams Love StreamSuite
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stop wrestling with workflow builders. Let AI do the heavy lifting while you focus on what matters.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Value Prop 1: Generate */}
            <Card className="border-2 border-transparent hover:border-blue-500 transition-all hover:shadow-xl group">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Generate Workflows</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Describe your automation in plain English. Get production-ready n8n workflows with error handling, retries, and best practices built-in.
                </p>
                <ul className="space-y-3">
                  {[
                    '95% accuracy on first try',
                    'Battle-tested patterns',
                    'Import directly to n8n',
                    'Custom code generation'
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Value Prop 2: Debug */}
            <Card className="border-2 border-transparent hover:border-green-500 transition-all hover:shadow-xl group">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Bug className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Debug & Fix</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Upload broken workflows and error logs. AI analyzes the issue and generates a fixed version with detailed explanations.
                </p>
                <ul className="space-y-3">
                  {[
                    'Instant error detection',
                    'Detailed fix explanations',
                    'Learn from mistakes',
                    'Save hours of debugging'
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Value Prop 3: Batch */}
            <Card className="border-2 border-transparent hover:border-purple-500 transition-all hover:shadow-xl group">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Rocket className="h-7 w-7 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Batch Operations</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Generate up to 5 related workflows at once. Perfect for building complete automation systems in minutes.
                </p>
                <ul className="space-y-3">
                  {[
                    'Generate workflow sets',
                    'Shared context optimization',
                    'Export as packages',
                    'Save 10x time on projects'
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              From Idea to Production in 30 Seconds
            </h2>
            <p className="text-xl text-gray-600">
              No templates. No drag-and-drop. Just pure AI-powered generation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {[
              {
                step: 1,
                title: 'Describe Your Goal',
                description: '"Send new Typeform submissions to Notion database and email the team via SendGrid"',
                color: 'blue',
              },
              {
                step: 2,
                title: 'AI Generates Workflow',
                description: 'Claude Sonnet 4.5 creates production-ready n8n JSON with error handling in 30 seconds',
                color: 'purple',
              },
              {
                step: 3,
                title: 'Import & Deploy',
                description: 'Download JSON, import to n8n, add credentials, activate. Done.',
                color: 'green',
              },
            ].map(({ step, title, description, color }) => (
              <div key={step} className="text-center">
                <div className={`w-16 h-16 bg-${color}-100 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-${color}-600 shadow-lg`}>
                  {step}
                </div>
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why We're Better Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-purple-100 text-purple-700 border-0 px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2 inline" />
              Why We're Different
            </Badge>

            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powered by Advanced AI Reasoning
            </h2>

            <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-12 leading-relaxed">
              Unlike competitors using GPT-4o mini or generic models, we built a <span className="font-bold text-purple-600">custom AI system on Claude Sonnet 4.5</span>—specifically trained for workflow automation with advanced reasoning capabilities. This means workflows with proper error handling, best practices, and proven patterns—every single time.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: '95%+ Accuracy',
                description: 'Production-ready workflows on first try. No endless debugging cycles.',
                color: 'green',
              },
              {
                icon: Code2,
                title: 'Best Practices Built-In',
                description: 'Error handling, retry logic, and proven patterns automatically included.',
                color: 'blue',
              },
              {
                icon: Clock,
                title: '30-Second Generation',
                description: 'What takes hours manually takes seconds with advanced AI reasoning.',
                color: 'purple',
              },
            ].map(({ icon: Icon, title, description, color }) => (
              <Card key={title} className="bg-white shadow-lg border-0">
                <CardContent className="p-8">
                  <Icon className={`h-12 w-12 text-${color}-600 mb-4`} />
                  <h4 className="font-bold text-xl mb-3">{title}</h4>
                  <p className="text-gray-600 leading-relaxed">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Start free. Upgrade when you're ready. No credit card required.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  billingInterval === 'monthly'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('yearly')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  billingInterval === 'yearly'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <Badge className="ml-2 bg-green-100 text-green-700 border-0">Save 20%</Badge>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Free Plan */}
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-2xl">Free</CardTitle>
                <CardDescription>Try it out</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <Button onClick={handleGetStarted} variant="outline" className="w-full mb-6">
                  Get Started
                </Button>
                <ul className="space-y-3 text-sm">
                  {SUBSCRIPTION_PLANS.free.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Starter Plan */}
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-2xl">Starter</CardTitle>
                <CardDescription>For individuals</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${getPlanPrice('starter')}</span>
                  <span className="text-gray-600">/month</span>
                </div>
                {billingInterval === 'yearly' && (
                  <p className="text-sm text-green-600 font-medium">Save ${getSavings('starter')?.amount}/year</p>
                )}
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleSubscribe('starter')}
                  variant="outline"
                  className="w-full mb-6"
                  disabled={loading === 'starter'}
                >
                  {loading === 'starter' ? 'Loading...' : 'Subscribe'}
                </Button>
                <ul className="space-y-3 text-sm">
                  {SUBSCRIPTION_PLANS.starter.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Pro Plan - POPULAR */}
            <Card className="border-2 border-blue-500 shadow-xl relative">
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <Badge className="bg-blue-600 text-white px-4 py-1">MOST POPULAR</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Pro</CardTitle>
                <CardDescription>For power users</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${getPlanPrice('pro')}</span>
                  <span className="text-gray-600">/month</span>
                </div>
                {billingInterval === 'yearly' && (
                  <p className="text-sm text-green-600 font-medium">Save ${getSavings('pro')?.amount}/year</p>
                )}
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleSubscribe('pro')}
                  className="w-full mb-6 bg-blue-600 hover:bg-blue-700"
                  disabled={loading === 'pro'}
                >
                  {loading === 'pro' ? 'Loading...' : 'Subscribe'}
                </Button>
                <ul className="space-y-3 text-sm">
                  {SUBSCRIPTION_PLANS.pro.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Growth Plan */}
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-2xl">Growth</CardTitle>
                <CardDescription>For teams</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${getPlanPrice('growth')}</span>
                  <span className="text-gray-600">/month</span>
                </div>
                {billingInterval === 'yearly' && (
                  <p className="text-sm text-green-600 font-medium">Save ${getSavings('growth')?.amount}/year</p>
                )}
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleSubscribe('growth')}
                  variant="outline"
                  className="w-full mb-6"
                  disabled={loading === 'growth'}
                >
                  {loading === 'growth' ? 'Loading...' : 'Subscribe'}
                </Button>
                <ul className="space-y-3 text-sm">
                  {SUBSCRIPTION_PLANS.growth.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Agency Plan Teaser */}
          <div className="mt-12 text-center">
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 max-w-4xl mx-auto">
              <CardContent className="p-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Crown className="h-8 w-8 text-purple-600" />
                  <h3 className="text-2xl font-bold">Agency Plan</h3>
                  <Badge className="bg-purple-100 text-purple-700 border-0">Coming Soon</Badge>
                </div>
                <p className="text-gray-700 mb-6">
                  750 credits/month • 50 batch credits • Client management • Team access • White-label exports • Starting at $499/month
                </p>
                <Button variant="outline" size="lg">
                  Join Waitlist
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to 10x Your Workflow Automation?
          </h2>
          <p className="text-xl mb-10 opacity-90">
            Join 500+ teams using AI to build better automations faster.
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-10 py-6"
          >
            Start Free - No Credit Card Required
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="mt-6 text-sm opacity-75">
            5 free credits • Cancel anytime • No commitment
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <Zap className="h-6 w-6 text-blue-600" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  StreamSuite
                </span>
              </div>
              <p className="text-sm text-gray-500">
                AI-powered workflow automation for n8n
              </p>
            </div>

            <div className="flex items-center gap-8">
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                Pricing
              </a>
              <a href="https://docs.n8n.io" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                n8n Docs
              </a>
              <a href="mailto:support@streamsuite.io" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                Support
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>© 2025 StreamSuite. All rights reserved. Built with Claude Sonnet 4.5.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
