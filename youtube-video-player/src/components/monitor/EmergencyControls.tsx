import { EyeOff, Play } from 'lucide-react';

interface EmergencyControlsProps {
  onHideAll: () => void;
  onRestore: () => void;
  hideAllActive: boolean;
}

export function EmergencyControls({ onHideAll, onRestore, hideAllActive }: EmergencyControlsProps) {
  return (
    <div className="bg-neutral-900 rounded-lg p-4 border-2 border-primary-600">
      <h2 className="text-lg font-bold text-white mb-3">Emergency Controls</h2>
      
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onHideAll}
          disabled={hideAllActive}
          className="h-14 px-8 bg-primary-600 hover:bg-primary-500 text-white rounded-md font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 border-primary-700 shadow-lg hover:shadow-xl active:scale-98"
        >
          <EyeOff className="w-6 h-6" />
          Hide All Overlays
        </button>
        
        <button
          onClick={onRestore}
          disabled={!hideAllActive}
          className="h-14 px-8 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 border-neutral-600"
        >
          <Play className="w-6 h-6" />
          Restore
        </button>
      </div>

      {hideAllActive && (
        <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-800 rounded text-sm text-yellow-400 text-center">
          All overlays are currently hidden
        </div>
      )}
    </div>
  );
}
