import React from 'react';
import { StreamingPreset } from '../../types/presets';
import { Play, Check, Settings } from 'lucide-react';

interface PresetCardProps {
  preset: StreamingPreset;
  isActive?: boolean;
  onActivate: (preset: StreamingPreset) => void;
  onCustomize?: (preset: StreamingPreset) => void;
}

const PresetCard: React.FC<PresetCardProps> = ({ preset, isActive, onActivate, onCustomize }) => {
  const typeColors: Record<string, string> = {
    'talk-show': 'from-blue-500 to-blue-600',
    'panel-discussion': 'from-purple-500 to-purple-600',
    'interview': 'from-green-500 to-green-600',
    'react-stream': 'from-amber-500 to-amber-600',
    'gaming-stream': 'from-red-500 to-red-600',
    'custom': 'from-gray-500 to-gray-600',
  };

  const gradientClass = typeColors[preset.type] || typeColors.custom;

  return (
    <div
      className={`relative rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
        isActive
          ? 'border-blue-500 shadow-lg shadow-blue-500/50'
          : 'border-gray-700 hover:border-gray-600'
      }`}
    >
      {/* Thumbnail/Preview */}
      <div className={`h-32 rounded-t-lg bg-gradient-to-br ${gradientClass} p-4 flex items-center justify-center`}>
        <div className="text-white text-center">
          <h3 className="text-xl font-bold mb-1">{preset.name}</h3>
          {isActive && (
            <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
              <Check className="w-3 h-3" />
              Active
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-[#2a2a2a]">
        <p className="text-sm text-gray-400 mb-4 min-h-[40px]">{preset.description}</p>

        {/* Features */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>Scene: {preset.sceneConfig.templateType}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Audio: {preset.audioConfig.voiceOptimized ? 'Voice Optimized' : 'Balanced'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span>Graphics: {preset.graphicsConfig.lowerThirdStyle}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onActivate(preset)}
            disabled={isActive}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isActive
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isActive ? (
              <>
                <Check className="w-4 h-4" />
                Active
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Activate
              </>
            )}
          </button>
          {onCustomize && (
            <button
              onClick={() => onCustomize(preset)}
              className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
              title="Customize preset"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Custom Badge */}
      {preset.isCustom && (
        <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
          Custom
        </div>
      )}
    </div>
  );
};

export default PresetCard;
