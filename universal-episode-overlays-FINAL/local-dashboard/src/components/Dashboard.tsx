import React from 'react';
import PresetSelector from './presets/PresetSelector';
import { QuickActions } from './QuickActions';
import { usePreset } from '../contexts/PresetContext';
import { useOBSWebSocket } from '../hooks/useOBSWebSocket';
import { Activity, Zap, TrendingUp } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { activePreset, activatePreset } = usePreset();
  const { connected: obsConnected } = useOBSWebSocket();

  return (
    <div className="p-6 space-y-6">
      {/* Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">OBS Connection</p>
              <p className="text-white font-semibold mt-1">
                {obsConnected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
            <Activity className={`w-8 h-8 ${obsConnected ? 'text-green-500' : 'text-red-500'}`} />
          </div>
        </div>

        <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Preset</p>
              <p className="text-white font-semibold mt-1">
                {activePreset ? activePreset.name : 'None'}
              </p>
            </div>
            <Zap className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Stream Status</p>
              <p className="text-white font-semibold mt-1">Ready</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions Widget */}
      <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <QuickActions />
      </div>

      {/* Preset Selector */}
      <PresetSelector
        onPresetActivate={activatePreset}
        currentPresetId={activePreset?.id}
      />

      {/* Getting Started Guide */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg p-6 border border-blue-500/30">
        <h3 className="text-xl font-bold text-white mb-2">Getting Started</h3>
        <p className="text-gray-300 mb-4">
          New to the platform? Follow these simple steps to start streaming:
        </p>
        <ol className="space-y-2 text-gray-300">
          <li className="flex items-start gap-2">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
            <span>Choose a Quick Start Preset above that matches your content type</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
            <span>Connect to OBS in the Settings tab</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
            <span>Go to Live Control to start your broadcast</span>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default Dashboard;
