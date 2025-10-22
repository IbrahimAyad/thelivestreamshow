/**
 * OBS Studio Browser Source API types
 */

declare global {
  interface Window {
    obsstudio?: {
      getCurrentScene: () => string;
      getScenes: () => string[];
      getCurrentTransition: () => string;
      getTransitions: () => string[];
      setCurrentScene: (scene: string) => void;
      setCurrentTransition: (transition: string) => void;
      getVersion: () => string;
      getRecordingStatus: () => { isRecording: boolean; isPaused: boolean };
      getStreamingStatus: () => { isStreaming: boolean; isPaused: boolean };
      startRecording: () => void;
      stopRecording: () => void;
      pauseRecording: () => void;
      resumeRecording: () => void;
      startStreaming: () => void;
      stopStreaming: () => void;
      pauseStreaming: () => void;
      resumeStreaming: () => void;
      getBrowserSourceProperties: () => any;
      setBrowserSourceProperties: (properties: any) => void;
    };
  }
}

export {};
