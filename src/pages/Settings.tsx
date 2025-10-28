/**
 * Settings Page - Coming Soon (v2)
 */

import { Card } from '@/components/ui/card';
import { Settings as SettingsIcon, Rocket } from 'lucide-react';

export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-gray-100 to-slate-100 p-6 rounded-full">
            <SettingsIcon className="h-16 w-16 text-gray-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Settings
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Manage your account, API keys, and billing settings.
        </p>
        <div className="inline-flex items-center gap-2 bg-gray-50 text-gray-700 px-4 py-2 rounded-full">
          <Rocket className="h-5 w-5" />
          <span className="font-semibold">Coming Soon in v2</span>
        </div>
      </Card>
    </div>
  );
}
