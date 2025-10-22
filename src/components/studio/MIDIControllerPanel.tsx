/**
 * MIDI Controller Panel
 * Setup and manage MIDI hardware controller mappings
 */

import { Gamepad2, Radio, Download, Upload, Trash2 } from 'lucide-react';
import { MIDIMapping } from '@/utils/studio/midiController';

interface MIDIControllerPanelProps {
  isConnected: boolean;
  devices: MIDIInput[];
  mappings: MIDIMapping[];
  isLearning: boolean;
  onStartLearn: () => void;
  onStopLearn: () => void;
  onRemoveMapping: (mappingId: string) => void;
  onExport: () => void;
  onImport: (json: string) => void;
  className?: string;
}

export function MIDIControllerPanel({
  isConnected,
  devices,
  mappings,
  isLearning,
  onStartLearn,
  onStopLearn,
  onRemoveMapping,
  onExport,
  onImport,
  className = '',
}: MIDIControllerPanelProps) {
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const json = event.target?.result as string;
          onImport(json);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className={className}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-200 mb-1 flex items-center gap-2">
          <Gamepad2 className="w-4 h-4" />
          MIDI Controller
        </h3>
        <p className="text-xs text-gray-500">
          Map hardware controllers to DJ controls
        </p>
      </div>

      {/* Connection Status */}
      <div className={`mb-4 p-3 rounded-lg border ${
        isConnected
          ? 'bg-green-900/20 border-green-500'
          : 'bg-red-900/20 border-red-500'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? 'MIDI Connected' : 'MIDI Not Available'}
          </span>
        </div>
      </div>

      {isConnected && (
        <>
          {/* Connected Devices */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Connected Devices ({devices.length})
            </label>
            <div className="space-y-1">
              {devices.length === 0 ? (
                <div className="p-2 bg-gray-800 rounded text-xs text-gray-500 text-center">
                  No MIDI devices detected
                </div>
              ) : (
                devices.map((device, i) => (
                  <div key={i} className="p-2 bg-gray-800 rounded text-xs text-gray-300">
                    {device.name || 'Unknown Device'}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* MIDI Learn */}
          <div className="mb-4">
            <button
              onClick={isLearning ? onStopLearn : onStartLearn}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                isLearning
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30 animate-pulse'
                  : 'bg-cyan-600 hover:bg-cyan-700 text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Radio className="w-4 h-4" />
                <span>{isLearning ? 'Stop Learning' : 'Start MIDI Learn'}</span>
              </div>
            </button>
            {isLearning && (
              <div className="mt-2 p-2 bg-cyan-900/20 border border-cyan-500 rounded text-xs text-cyan-400 text-center">
                Move a control on your MIDI device...
              </div>
            )}
          </div>

          {/* Mappings List */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-400 mb-2">
              MIDI Mappings ({mappings.length})
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {mappings.length === 0 ? (
                <div className="p-3 bg-gray-800 rounded text-xs text-gray-500 text-center">
                  No mappings configured
                </div>
              ) : (
                mappings.map((mapping) => (
                  <div key={mapping.id} className="p-2 bg-gray-800 rounded flex items-center justify-between group">
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-300">{mapping.action}</div>
                      <div className="text-[10px] text-gray-500">
                        Channel {mapping.channel} • Note {mapping.note}
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveMapping(mapping.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/30 rounded transition-all"
                      title="Remove mapping"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Import/Export */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={handleImport}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-medium"
            >
              <Upload className="w-3 h-3" />
              <span>Import</span>
            </button>
            <button
              onClick={onExport}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-medium"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>
          </div>

          {/* Info */}
          <div className="p-3 bg-gray-800 rounded-lg text-xs text-gray-400 space-y-2">
            <div className="font-medium text-gray-300">💡 MIDI Setup:</div>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Connect your MIDI controller</li>
              <li>Click "Start MIDI Learn"</li>
              <li>Move a control on your device</li>
              <li>Assign it to a DJ function</li>
              <li>Repeat for all controls</li>
            </ol>
          </div>
        </>
      )}

      {!isConnected && (
        <div className="p-3 bg-yellow-900/20 border border-yellow-800 rounded text-xs text-yellow-400">
          ⚠️ Web MIDI API not available in this browser. Try Chrome, Edge, or Opera.
        </div>
      )}
    </div>
  );
}
