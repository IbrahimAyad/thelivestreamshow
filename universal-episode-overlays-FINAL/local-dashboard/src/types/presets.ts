export type PresetType = 'talk-show' | 'panel-discussion' | 'interview' | 'react-stream' | 'gaming-stream' | 'custom';

export interface SceneConfig {
  templateType: string;
  customPositions?: Record<string, any>;
}

export interface AudioConfig {
  voiceOptimized: boolean;
  duckingEnabled: boolean;
  multiMicBalance?: boolean;
  gameAudioBalance?: number;
}

export interface GraphicsConfig {
  lowerThirdStyle: string;
  defaultColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  animationSpeed?: 'slow' | 'normal' | 'fast';
}

export interface QuickAction {
  id: string;
  label: string;
  action: string;
  params?: Record<string, any>;
}

export interface StreamingPreset {
  id: string;
  name: string;
  description: string;
  type: PresetType;
  thumbnail?: string;
  sceneConfig: SceneConfig;
  audioConfig: AudioConfig;
  graphicsConfig: GraphicsConfig;
  quickActions: QuickAction[];
  isDefault?: boolean;
  isCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_PRESETS: StreamingPreset[] = [
  {
    id: 'preset-talk-show',
    name: 'Talk Show',
    description: 'Single host with occasional guests - Perfect for podcasts and solo commentary',
    type: 'talk-show',
    sceneConfig: {
      templateType: 'pip',
    },
    audioConfig: {
      voiceOptimized: true,
      duckingEnabled: true,
    },
    graphicsConfig: {
      lowerThirdStyle: 'modern',
      defaultColors: {
        primary: '#3b82f6',
        secondary: '#1e40af',
        accent: '#60a5fa',
      },
      animationSpeed: 'normal',
    },
    quickActions: [
      {
        id: 'introduce-guest',
        label: 'Introduce Guest',
        action: 'showLowerThird',
        params: { type: 'guest' },
      },
    ],
    isDefault: true,
  },
  {
    id: 'preset-panel-discussion',
    name: 'Panel Discussion',
    description: 'Multiple participants in grid layout - Ideal for debates and roundtables',
    type: 'panel-discussion',
    sceneConfig: {
      templateType: 'panel',
    },
    audioConfig: {
      voiceOptimized: true,
      duckingEnabled: false,
      multiMicBalance: true,
    },
    graphicsConfig: {
      lowerThirdStyle: 'classic',
      defaultColors: {
        primary: '#8b5cf6',
        secondary: '#6d28d9',
        accent: '#a78bfa',
      },
      animationSpeed: 'normal',
    },
    quickActions: [
      {
        id: 'spotlight-speaker',
        label: 'Spotlight Speaker',
        action: 'switchScene',
        params: { type: 'fullscreen' },
      },
    ],
    isDefault: true,
  },
  {
    id: 'preset-interview',
    name: 'Interview',
    description: 'One-on-one conversation in split screen - Great for focused discussions',
    type: 'interview',
    sceneConfig: {
      templateType: 'split',
    },
    audioConfig: {
      voiceOptimized: true,
      duckingEnabled: false,
      multiMicBalance: true,
    },
    graphicsConfig: {
      lowerThirdStyle: 'minimal',
      defaultColors: {
        primary: '#10b981',
        secondary: '#059669',
        accent: '#34d399',
      },
      animationSpeed: 'normal',
    },
    quickActions: [
      {
        id: 'switch-focus',
        label: 'Switch Focus',
        action: 'toggleSplitFocus',
      },
    ],
    isDefault: true,
  },
  {
    id: 'preset-react-stream',
    name: 'React Stream',
    description: 'Large content area with small reactor cam - Perfect for reaction videos',
    type: 'react-stream',
    sceneConfig: {
      templateType: 'reaction',
    },
    audioConfig: {
      voiceOptimized: true,
      duckingEnabled: true,
    },
    graphicsConfig: {
      lowerThirdStyle: 'bold',
      defaultColors: {
        primary: '#f59e0b',
        secondary: '#d97706',
        accent: '#fbbf24',
      },
      animationSpeed: 'fast',
    },
    quickActions: [
      {
        id: 'pause-content',
        label: 'Pause/Resume Content',
        action: 'toggleMediaPlayback',
      },
    ],
    isDefault: true,
  },
  {
    id: 'preset-gaming-stream',
    name: 'Gaming Stream',
    description: 'Fullscreen gameplay with small facecam - Optimized for gaming content',
    type: 'gaming-stream',
    sceneConfig: {
      templateType: 'fullscreen',
    },
    audioConfig: {
      voiceOptimized: false,
      duckingEnabled: false,
      gameAudioBalance: 0.7,
    },
    graphicsConfig: {
      lowerThirdStyle: 'bold',
      defaultColors: {
        primary: '#ef4444',
        secondary: '#dc2626',
        accent: '#f87171',
      },
      animationSpeed: 'fast',
    },
    quickActions: [
      {
        id: 'toggle-facecam',
        label: 'Show/Hide Facecam',
        action: 'toggleSource',
        params: { sourceType: 'camera' },
      },
    ],
    isDefault: true,
  },
];
