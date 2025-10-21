import { useState } from 'react';
import Draggable from 'react-draggable';
import { GripVertical, Minimize2, Maximize2, ExternalLink } from 'lucide-react';

// Type assertion for react-draggable to fix TypeScript JSX issues
const DraggableComponent = Draggable as any;

interface PiPBroadcastMonitorProps {
  broadcastUrl: string;
}

export function PiPBroadcastMonitor({ broadcastUrl }: PiPBroadcastMonitorProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [size, setSize] = useState({ width: 480, height: 270 });

  const handlePopout = () => {
    window.open(broadcastUrl, '_blank', 'width=1920,height=1080');
  };

  const handleToggleSize = () => {
    if (size.width === 480) {
      setSize({ width: 960, height: 540 });
    } else {
      setSize({ width: 480, height: 270 });
    }
  };

  return (
    <DraggableComponent handle=".drag-handle" bounds="parent">
      <div
        className="absolute top-4 right-4 bg-neutral-900 rounded-lg border-2 border-neutral-700 shadow-lg overflow-hidden z-50 transition-all duration-300"
        style={{
          width: isMinimized ? '200px' : `${size.width}px`,
          height: isMinimized ? '36px' : `${size.height + 36}px`,
        }}
      >
        {/* Header Bar */}
        <div className="drag-handle h-9 bg-black border-b border-neutral-700 flex items-center justify-between px-3 cursor-move">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-neutral-500" />
            <span className="text-xs font-medium text-white">Broadcast Monitor</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="w-8 h-8 flex items-center justify-center hover:bg-neutral-800 rounded transition-colors"
              title={isMinimized ? 'Restore' : 'Minimize'}
            >
              <Minimize2 className="w-4 h-4 text-neutral-400" />
            </button>
            <button
              onClick={handleToggleSize}
              className="w-8 h-8 flex items-center justify-center hover:bg-neutral-800 rounded transition-colors"
              title={size.width === 480 ? 'Maximize' : 'Restore Size'}
            >
              <Maximize2 className="w-4 h-4 text-neutral-400" />
            </button>
            <button
              onClick={handlePopout}
              className="w-8 h-8 flex items-center justify-center hover:bg-neutral-800 rounded transition-colors"
              title="Pop-out"
            >
              <ExternalLink className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {!isMinimized && (
          <div className="w-full h-full bg-black">
            <iframe
              src={broadcastUrl}
              className="w-full h-full border-0"
              title="Broadcast Preview"
            />
          </div>
        )}
      </div>
    </DraggableComponent>
  );
}
