import React, { createContext, useContext, useState, useCallback } from 'react';
import { StreamingPreset } from '../types/presets';
import toast from 'react-hot-toast';

interface PresetContextType {
  activePreset: StreamingPreset | null;
  activatePreset: (preset: StreamingPreset) => Promise<void>;
  isApplying: boolean;
}

const PresetContext = createContext<PresetContextType | undefined>(undefined);

export const usePreset = () => {
  const context = useContext(PresetContext);
  if (!context) {
    throw new Error('usePreset must be used within PresetProvider');
  }
  return context;
};

interface PresetProviderProps {
  children: React.ReactNode;
}

export const PresetProvider: React.FC<PresetProviderProps> = ({ children }) => {
  const [activePreset, setActivePreset] = useState<StreamingPreset | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const applySceneConfig = async (preset: StreamingPreset) => {
    // Store scene template preference for components to read
    const templateType = preset.sceneConfig.templateType;
    localStorage.setItem('sceneTemplatePreference', templateType);
    
    // Dispatch event to trigger scene template application
    window.dispatchEvent(new CustomEvent('applySceneTemplate', { detail: { templateType } }));
  };

  const applyAudioConfig = async (preset: StreamingPreset) => {
    // Store audio preferences in localStorage for the audio mixer to read
    const audioPrefs = {
      voiceOptimized: preset.audioConfig.voiceOptimized,
      duckingEnabled: preset.audioConfig.duckingEnabled,
      multiMicBalance: preset.audioConfig.multiMicBalance,
      gameAudioBalance: preset.audioConfig.gameAudioBalance,
    };
    localStorage.setItem('audioPreferences', JSON.stringify(audioPrefs));
    
    // Dispatch event for audio mixer to pick up changes
    window.dispatchEvent(new CustomEvent('audioPreferencesChanged', { detail: audioPrefs }));
  };

  const applyGraphicsConfig = async (preset: StreamingPreset) => {
    // Store graphics preferences in localStorage
    const graphicsPrefs = {
      lowerThirdStyle: preset.graphicsConfig.lowerThirdStyle,
      defaultColors: preset.graphicsConfig.defaultColors,
      animationSpeed: preset.graphicsConfig.animationSpeed,
    };
    localStorage.setItem('graphicsPreferences', JSON.stringify(graphicsPrefs));
    
    // Dispatch event for graphics components to pick up changes
    window.dispatchEvent(new CustomEvent('graphicsPreferencesChanged', { detail: graphicsPrefs }));
  };

  const activatePreset = useCallback(
    async (preset: StreamingPreset) => {
      setIsApplying(true);
      
      try {
        // Apply configurations in sequence
        await applySceneConfig(preset);
        await applyAudioConfig(preset);
        await applyGraphicsConfig(preset);
        
        // Store the active preset
        setActivePreset(preset);
        localStorage.setItem('activePresetId', preset.id);
        
        // Store quick actions for easy access
        localStorage.setItem('quickActions', JSON.stringify(preset.quickActions));
        window.dispatchEvent(new CustomEvent('quickActionsChanged', { detail: preset.quickActions }));
        
      } catch (error) {
        console.error('Failed to activate preset:', error);
        toast.error('Failed to activate preset. Please try again.');
        throw error;
      } finally {
        setIsApplying(false);
      }
    },
    []
  );

  // Load active preset on mount
  React.useEffect(() => {
    const activePresetId = localStorage.getItem('activePresetId');
    if (activePresetId) {
      // We'll need to fetch this from the presets list
      // For now, just store the ID
    }
  }, []);

  return (
    <PresetContext.Provider value={{ activePreset, activatePreset, isApplying }}>
      {children}
    </PresetContext.Provider>
  );
};
