import React from 'react';
// Import the LiveImpactStream component from the ui folder
import LiveImpactStream from '@/components/ui/LiveImpactStream';

export default function CommandCenterTest() {
  return (
    // This dark background mimics the Preflight aesthetic
    <div className="min-h-screen bg-[#050a08] flex items-center justify-center p-8">
      
      <div className="flex w-full max-w-6xl gap-8">
        {/* Placeholder for future Main Content */}
        <div className="flex-1 border border-white/10 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 font-mono">
          [MAIN DASHBOARD CONTENT WILL GO HERE]
        </div>

        {/* Your New Live Stream Component on the right side! */}
        <div className="w-[400px]">
          <LiveImpactStream />
        </div>
      </div>

    </div>
  );
}
