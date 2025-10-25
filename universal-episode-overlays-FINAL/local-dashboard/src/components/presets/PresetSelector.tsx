import React, { useState, useEffect } from 'react';
import { StreamingPreset, DEFAULT_PRESETS } from '../../types/presets';
import PresetCard from './PresetCard';
import { Plus, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface PresetSelectorProps {
  onPresetActivate: (preset: StreamingPreset) => void;
  currentPresetId?: string;
}

const PresetSelector: React.FC<PresetSelectorProps> = ({ onPresetActivate, currentPresetId }) => {
  const [presets, setPresets] = useState<StreamingPreset[]>(DEFAULT_PRESETS);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<StreamingPreset | null>(null);

  // Load custom presets from localStorage on mount
  useEffect(() => {
    const loadCustomPresets = () => {
      try {
        const stored = localStorage.getItem('customPresets');
        if (stored) {
          const customPresets = JSON.parse(stored);
          setPresets([...DEFAULT_PRESETS, ...customPresets]);
        }
      } catch (error) {
        console.error('Failed to load custom presets:', error);
      }
    };
    loadCustomPresets();
  }, []);

  const handleActivate = (preset: StreamingPreset) => {
    toast.loading('Activating preset...', { id: 'preset-activate' });
    
    // Simulate activation delay
    setTimeout(() => {
      onPresetActivate(preset);
      toast.success(`${preset.name} preset activated!`, { id: 'preset-activate' });
    }, 500);
  };

  const handleCustomize = (preset: StreamingPreset) => {
    setSelectedPreset(preset);
    setShowCustomizeModal(true);
  };

  const handleSaveCustomPreset = () => {
    if (!selectedPreset) return;

    const customPreset: StreamingPreset = {
      ...selectedPreset,
      id: `custom-${Date.now()}`,
      type: 'custom',
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    const customPresets = presets.filter(p => p.isCustom);
    customPresets.push(customPreset);

    try {
      localStorage.setItem('customPresets', JSON.stringify(customPresets));
      setPresets([...DEFAULT_PRESETS, ...customPresets]);
      toast.success('Custom preset saved!');
      setShowCustomizeModal(false);
      setSelectedPreset(null);
    } catch (error) {
      toast.error('Failed to save custom preset');
      console.error('Save error:', error);
    }
  };

  const handleSaveCurrentAsPreset = () => {
    // This would capture the current dashboard configuration
    toast('Feature coming soon: Save current setup as preset', {
      icon: '💡',
      duration: 3000,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Quick Start Presets</h2>
          <p className="text-gray-400 mt-1">Choose a preset to configure your entire streaming setup with one click</p>
        </div>
        <button
          onClick={handleSaveCurrentAsPreset}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="w-4 h-4" />
          Save Current Setup
        </button>
      </div>

      {/* Default Presets */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Professional Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {presets
            .filter(p => p.isDefault)
            .map(preset => (
              <PresetCard
                key={preset.id}
                preset={preset}
                isActive={currentPresetId === preset.id}
                onActivate={handleActivate}
                onCustomize={handleCustomize}
              />
            ))}
        </div>
      </div>

      {/* Custom Presets */}
      {presets.some(p => p.isCustom) && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">My Custom Presets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {presets
              .filter(p => p.isCustom)
              .map(preset => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  isActive={currentPresetId === preset.id}
                  onActivate={handleActivate}
                  onCustomize={handleCustomize}
                />
              ))}
          </div>
        </div>
      )}

      {/* Customize Modal */}
      {showCustomizeModal && selectedPreset && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] rounded-lg border border-gray-700 p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Customize Preset</h3>
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Preset Name</label>
                <input
                  type="text"
                  value={selectedPreset.name}
                  onChange={(e) =>
                    setSelectedPreset({ ...selectedPreset, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={selectedPreset.description}
                  onChange={(e) =>
                    setSelectedPreset({ ...selectedPreset, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="text-sm text-gray-400">
                <p className="mb-2 font-medium">Current Configuration:</p>
                <ul className="space-y-1 ml-4">
                  <li>Scene Template: {selectedPreset.sceneConfig.templateType}</li>
                  <li>Lower Third Style: {selectedPreset.graphicsConfig.lowerThirdStyle}</li>
                  <li>Audio: {selectedPreset.audioConfig.voiceOptimized ? 'Voice Optimized' : 'Balanced'}</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveCustomPreset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
              >
                <Save className="w-4 h-4" />
                Save as Custom Preset
              </button>
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresetSelector;
