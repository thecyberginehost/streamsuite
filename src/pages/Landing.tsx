/**
 * Landing Page - Conversion-Optimized
 *
 * Main marketing page for streamsuite.io
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      window.location.href = 'https://app.streamsuite.io';
    } else {
      navigate('/login');
    }
  };

  const handleViewPricing = () => {
    navigate('/pricing');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                StreamSuite
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleViewPricing}>
                Pricing
              </Button>
              <Button onClick={handleGetStarted}>
                {user ? 'Go to App' : 'Get Started'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-purple-100 text-purple-700 border-0 px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2 inline" />
            Powered by Claude Sonnet 4.5
          </Badge>

          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Build Workflow Automations<br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              in 30 Seconds
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Generate production-ready n8n workflows with AI. No templates, no guessing—just describe what you need and get battle-tested automation instantly.
          </p>

          <div className="flex items-center justify-center gap-4 mb-12">
            <Button size="lg" onClick={handleGetStarted} className="bg-blue-600 hover:bg-blue-700">
              Start Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={handleViewPricing}>
              View Pricing
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 border-2 border-white" />
                ))}
              </div>
              <span>Trusted by 500+ teams</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2">4.9/5 from users</span>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video / Screenshot Placeholder */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-xl border-4 border-gray-200 shadow-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="aspect-video flex items-center justify-center">
              <div className="text-center">
                <Zap className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Product Demo / Screenshot Goes Here</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Value Props - 3 Cards */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Stop Wrestling with Workflow Builders
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Traditional workflow builders force you to click through endless menus. StreamSuite generates complete, production-ready workflows from a simple description.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Value Prop 1: Generate */}
            <Card className="border-2 border-gray-200 hover:border-blue-500 transition-all hover:shadow-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Generate</h3>
                <p className="text-gray-600 mb-4">
                  Describe your automation in plain English. Get production-ready n8n workflows with proper error handling, best practices, and proven patterns.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>95%+ accuracy rate</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Battle-tested patterns</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Import directly to n8n</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Value Prop 2: Convert */}
            <Card className="border-2 border-gray-200 hover:border-purple-500 transition-all hover:shadow-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                  <RefreshCw className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Convert</h3>
                <p className="text-gray-600 mb-4">
                  Switching platforms? Convert workflows between n8n, Make.com, and Zapier. No manual rebuilding, no guessing—just upload and convert.
                </p>
                <Badge className="bg-orange-100 text-orange-700 border-0 mb-4">
                  Coming Soon
                </Badge>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>n8n ↔ Make ↔ Zapier</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Preserves logic & structure</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Platform migration made easy</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Value Prop 3: Debug */}
            <Card className="border-2 border-gray-200 hover:border-green-500 transition-all hover:shadow-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                  <Bug className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Debug</h3>
                <p className="text-gray-600 mb-4">
                  Broken workflows? Upload your JSON and error logs. AI analyzes the issue and generates a fixed version with explanations.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Instant error detection</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Detailed fix explanations</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Learn from mistakes</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              3 Steps to Production-Ready Workflows
            </h2>
            <p className="text-xl text-gray-600">
              No drag-and-drop. No templates. Just describe what you need.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Describe Your Goal</h3>
              <p className="text-gray-600">
                "Send new Typeform submissions to Notion and email the team"
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-purple-600">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">AI Generates Workflow</h3>
              <p className="text-gray-600">
                Claude Sonnet 4.5 creates production-ready n8n JSON in 30 seconds
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Import & Deploy</h3>
              <p className="text-gray-600">
                Download JSON and import to n8n. Done. No manual configuration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Claude Sonnet 4.5 */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Badge className="mb-6 bg-purple-100 text-purple-700 border-0 px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2 inline" />
            Why We're Different
          </Badge>

          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Built on the Best AI Model for Reasoning
          </h2>

          <p className="text-xl text-gray-600 mb-8">
            We use <span className="font-semibold">Claude Sonnet 4.5</span>, Anthropic's most advanced reasoning model. Unlike competitors using basic AI (GPT-3.5 or generic models), we deliver workflows with proper error handling, best practices, and proven patterns every time.
          </p>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <TrendingUp className="h-8 w-8 text-green-600 mb-3" />
              <h4 className="font-bold mb-2">95%+ Accuracy</h4>
              <p className="text-sm text-gray-600">
                Production-ready workflows on first try. No endless debugging.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <Code2 className="h-8 w-8 text-blue-600 mb-3" />
              <h4 className="font-bold mb-2">Best Practices Built-In</h4>
              <p className="text-sm text-gray-600">
                Proper error handling, retry logic, and proven patterns automatically.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <Clock className="h-8 w-8 text-purple-600 mb-3" />
              <h4 className="font-bold mb-2">30-Second Generation</h4>
              <p className="text-sm text-gray-600">
                What takes hours manually takes seconds with AI reasoning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Support Timeline */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Platform Support Roadmap
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            We're starting with n8n and expanding to all major platforms
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 border-green-500 shadow-lg">
              <CardContent className="p-6 text-center">
                <Badge className="bg-green-100 text-green-700 border-0 mb-4">
                  ✅ Available Now
                </Badge>
                <div className="text-4xl font-bold mb-2">n8n</div>
                <p className="text-gray-600">
                  Full workflow generation, debugging, and batch operations
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-300">
              <CardContent className="p-6 text-center">
                <Badge className="bg-orange-100 text-orange-700 border-0 mb-4">
                  Coming December 2025
                </Badge>
                <div className="text-4xl font-bold mb-2">Make.com</div>
                <p className="text-gray-600">
                  Generate Make blueprints + convert between n8n and Make
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-300">
              <CardContent className="p-6 text-center">
                <Badge className="bg-blue-100 text-blue-700 border-0 mb-4">
                  Coming January 2026
                </Badge>
                <div className="text-4xl font-bold mb-2">Zapier</div>
                <p className="text-gray-600">
                  Generate Zapier Code + convert from n8n/Make to Zapier
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Teaser + CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Start Free. Upgrade When You're Ready.
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            5 free credits to try it out. No credit card required.
          </p>

          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-8 mb-8">
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">$0</div>
                <div className="text-sm text-gray-600">Free Plan</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">$19</div>
                <div className="text-sm text-gray-600">Starter Plan</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-1">$49</div>
                <div className="text-sm text-gray-600">Pro Plan ⭐</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">$99</div>
                <div className="text-sm text-gray-600">Growth Plan</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button size="lg" onClick={handleGetStarted} className="bg-blue-600 hover:bg-blue-700">
              Start Free Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={handleViewPricing}>
              See All Plans & Features
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                StreamSuite
              </span>
              <p className="text-sm text-gray-500 mt-1">
                AI-powered workflow automation for n8n
              </p>
            </div>

            <div className="flex items-center gap-8">
              <button onClick={handleViewPricing} className="text-sm text-gray-600 hover:text-gray-900">
                Pricing
              </button>
              <a href="https://docs.n8n.io" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900">
                Docs
              </a>
              <a href="mailto:support@streamsuite.io" className="text-sm text-gray-600 hover:text-gray-900">
                Support
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            © 2025 StreamSuite. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
