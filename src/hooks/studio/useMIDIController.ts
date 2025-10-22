/**
 * MIDI Controller Hook
 * Manages MIDI device connections and mappings
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MIDIControllerManager,
  MIDIMapping,
  createMIDIController,
} from '@/utils/studio/midiController';

interface UseMIDIControllerResult {
  isConnected: boolean;
  devices: MIDIInput[];
  mappings: MIDIMapping[];
  isLearning: boolean;
  startLearn: (callback: (mapping: Partial<MIDIMapping>) => void) => void;
  stopLearn: () => void;
  addMapping: (mapping: MIDIMapping) => void;
  removeMapping: (mappingId: string) => void;
  onMIDIAction: (mappingId: string, callback: (value: number) => void) => void;
  exportMappings: () => string;
  importMappings: (json: string) => boolean;
}

export function useMIDIController(): UseMIDIControllerResult {
  const [isConnected, setIsConnected] = useState(false);
  const [devices, setDevices] = useState<MIDIInput[]>([]);
  const [mappings, setMappings] = useState<MIDIMapping[]>([]);
  const [isLearning, setIsLearning] = useState(false);

  const managerRef = useRef<MIDIControllerManager | null>(null);

  // Initialize MIDI controller
  useEffect(() => {
    const init = async () => {
      const manager = await createMIDIController();
      if (manager) {
        managerRef.current = manager;
        setIsConnected(true);
        setDevices(manager.getDevices());
        setMappings(manager.getMappings());
      }
    };

    init();

    return () => {
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
      }
    };
  }, []);

  const startLearn = useCallback((callback: (mapping: Partial<MIDIMapping>) => void) => {
    if (!managerRef.current) return;
    managerRef.current.startLearn((mapping) => {
      callback(mapping);
      setIsLearning(true);
    });
  }, []);

  const stopLearn = useCallback(() => {
    if (!managerRef.current) return;
    managerRef.current.stopLearn();
    setIsLearning(false);
  }, []);

  const addMapping = useCallback((mapping: MIDIMapping) => {
    if (!managerRef.current) return;
    managerRef.current.addMapping(mapping);
    setMappings(managerRef.current.getMappings());
  }, []);

  const removeMapping = useCallback((mappingId: string) => {
    if (!managerRef.current) return;
    managerRef.current.removeMapping(mappingId);
    setMappings(managerRef.current.getMappings());
  }, []);

  const onMIDIAction = useCallback((mappingId: string, callback: (value: number) => void) => {
    if (!managerRef.current) return;
    managerRef.current.onAction(mappingId, callback);
  }, []);

  const exportMappings = useCallback((): string => {
    if (!managerRef.current) return '[]';
    return managerRef.current.exportMappings();
  }, []);

  const importMappings = useCallback((json: string): boolean => {
    if (!managerRef.current) return false;
    const success = managerRef.current.importMappings(json);
    if (success) {
      setMappings(managerRef.current.getMappings());
    }
    return success;
  }, []);

  return {
    isConnected,
    devices,
    mappings,
    isLearning,
    startLearn,
    stopLearn,
    addMapping,
    removeMapping,
    onMIDIAction,
    exportMappings,
    importMappings,
  };
}
