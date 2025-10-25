import React, { useState } from 'react';
import { Play, Clock, AlertCircle, Coffee, WifiOff, Sparkles, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

// Professional graphics presets
const GRAPHICS_PRESETS = [
  {
    id: 'live-badge',
    name: 'LIVE Badge',
    description: 'Animated red LIVE indicator',
    icon: Play,
    color: 'red',
    gradient: 'from-red-600 to-red-500',
    animation: 'pulse',
  },
  {
    id: 'brb-screen',
    name: 'BE RIGHT BACK',
    description: 'Full screen intermission',
    icon: Coffee,
    color: 'blue',
    gradient: 'from-blue-600 to-blue-500',
    animation: 'fade',
  },
  {
    id: 'coming-soon',
    name: 'COMING SOON',
    description: 'Teaser for next segment',
    icon: Sparkles,
    color: 'purple',
    gradient: 'from-purple-600 to-purple-500',
    animation: 'slide',
  },
  {
    id: 'tech-difficulties',
    name: 'TECHNICAL DIFFICULTIES',
    description: 'Professional error screen',
    icon: AlertCircle,
    color: 'yellow',
    gradient: 'from-yellow-600 to-orange-500',
    animation: 'fade',
  },
  {
    id: 'please-standby',
    name: 'PLEASE STAND BY',
    description: 'Temporary hold screen',
    icon: WifiOff,
    color: 'gray',
    gradient: 'from-gray-600 to-gray-500',
    animation: 'fade',
  },
  {
    id: 'starting-soon',
    name: 'STARTING SOON',
    description: 'Pre-stream countdown',
    icon: Clock,
    color: 'green',
    gradient: 'from-green-600 to-green-500',
    animation: 'scale',
  },
  {
    id: 'thanks-watching',
    name: 'THANKS FOR WATCHING',
    description: 'End screen with social links',
    icon: Heart,
    color: 'pink',
    gradient: 'from-pink-600 to-pink-500',
    animation: 'fade',
  },
];

const QuickGraphics: React.FC = () => {
  const [activeGraphic, setActiveGraphic] = useState<string | null>(null);

  // Listen to keyboard shortcut events
  React.useEffect(() => {
    const handleShowGraphic = (e: CustomEvent) => {
      const { graphicId } = e.detail;
      setActiveGraphic(graphicId);
      const graphic = GRAPHICS_PRESETS.find(g => g.id === graphicId);
      if (graphic) {
        toast.success(`${graphic.name} displayed`, {
          icon: '🎨',
          duration: 2000,
        });
        localStorage.setItem('activeQuickGraphic', graphicId);
      }
    };

    const handleHideGraphicEvent = () => {
      setActiveGraphic(null);
      localStorage.removeItem('activeQuickGraphic');
      toast.success('Graphic hidden');
    };

    window.addEventListener('showQuickGraphic', handleShowGraphic as EventListener);
    window.addEventListener('hideQuickGraphic', handleHideGraphicEvent);

    // Load active graphic on mount
    const savedGraphic = localStorage.getItem('activeQuickGraphic');
    if (savedGraphic) {
      setActiveGraphic(savedGraphic);
    }

    return () => {
      window.removeEventListener('showQuickGraphic', handleShowGraphic as EventListener);
      window.removeEventListener('hideQuickGraphic', handleHideGraphicEvent);
    };
  }, []);

  const handleShowGraphic = (graphicId: string) => {
    // Dispatch event which will be caught by the listener above
    window.dispatchEvent(new CustomEvent('showQuickGraphic', { detail: { graphicId } }));
  };

  const handleHideGraphic = () => {
    window.dispatchEvent(new CustomEvent('hideQuickGraphic'));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Quick Graphics</h2>
          <p className="text-gray-400 mt-1">
            One-click professional graphics and overlays
          </p>
        </div>
        {activeGraphic && (
          <button
            onClick={handleHideGraphic}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white rounded-lg font-medium transition-all shadow-lg"
          >
            Hide Active Graphic
          </button>
        )}
      </div>

      {/* Graphics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {GRAPHICS_PRESETS.map((graphic) => (
          <button
            key={graphic.id}
            onClick={() => handleShowGraphic(graphic.id)}
            className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
              activeGraphic === graphic.id
                ? 'border-green-500 shadow-lg shadow-green-500/50'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            {/* Gradient Header */}
            <div className={`bg-gradient-to-br ${graphic.gradient} p-6 h-24 flex items-center justify-center relative overflow-hidden`}>
              <graphic.icon className="w-10 h-10 text-white relative z-10" />
              {activeGraphic === graphic.id && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <span className="text-white text-xs font-bold bg-green-500 px-2 py-1 rounded-full">
                    ACTIVE
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="bg-[#2a2a2a] p-4">
              <h3 className="text-white font-semibold text-sm mb-1">{graphic.name}</h3>
              <p className="text-gray-400 text-xs mb-2">{graphic.description}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="capitalize">{graphic.animation} animation</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="bg-[#2a2a2a] border border-gray-700 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">Keyboard Shortcuts</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-[#1a1a1a] border border-gray-700 rounded text-xs text-gray-400">
              F1
            </kbd>
            <span className="text-sm text-gray-400">LIVE Badge</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-[#1a1a1a] border border-gray-700 rounded text-xs text-gray-400">
              F2
            </kbd>
            <span className="text-sm text-gray-400">Be Right Back</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-[#1a1a1a] border border-gray-700 rounded text-xs text-gray-400">
              F3
            </kbd>
            <span className="text-sm text-gray-400">Coming Soon</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-[#1a1a1a] border border-gray-700 rounded text-xs text-gray-400">
              F7
            </kbd>
            <span className="text-sm text-gray-400">Hide Graphic</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickGraphics;
