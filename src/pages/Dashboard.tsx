/**
 * Dashboard Layout
 *
 * Main layout wrapper with sidebar and top bar navigation
 */

import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { GenerationBanner } from '@/components/GenerationBanner';

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-white dark:bg-[#0d0d0d] overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <TopBar />

        {/* Generation Status Banner */}
        <GenerationBanner />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#fafafa] dark:bg-[#111111]">
          <div className="p-6 max-w-[1600px] mx-auto min-h-[calc(100vh-180px)]">
            <Outlet />
          </div>

          {/* Footer */}
          <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0d0d0d]">
            <div className="max-w-[1600px] mx-auto px-6 py-4">
              <div className="flex items-center justify-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  © 2025 StreamSuite. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
