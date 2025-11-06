import React, { useRef, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Point {
  x: number;
  y: number;
  pressure?: number;
}

interface Stroke {
  type: 'pen' | 'highlighter' | 'eraser' | 'line' | 'box';
  points: Point[];
  color: string;
  size: number;
  timestamp: number;
}

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pen' | 'highlighter' | 'eraser' | 'line' | 'box'>('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentSize, setCurrentSize] = useState(3);
  const [isActive, setIsActive] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const sessionId = useRef(`session-${Date.now()}`);

  // Load whiteboard state
  useEffect(() => {
    loadWhiteboardState();
    subscribeToState();
  }, []);

  const loadWhiteboardState = async () => {
    const { data } = await supabase
      .from('whiteboard_state')
      .select('is_active')
      .single();

    if (data) {
      setIsActive(data.is_active);
    }
  };

  const subscribeToState = () => {
    const channel = supabase
      .channel('whiteboard-state-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whiteboard_state'
        },
        (payload) => {
          if (payload.new && 'is_active' in payload.new) {
            setIsActive(payload.new.is_active);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const toggleActive = async () => {
    const newState = !isActive;
    await supabase
      .from('whiteboard_state')
      .update({ is_active: newState, updated_at: new Date().toISOString() })
      .eq('id', (await supabase.from('whiteboard_state').select('id').single()).data?.id);

    setIsActive(newState);
  };

  const clearCanvas = async () => {
    // Hide all existing strokes
    await supabase
      .from('whiteboard_strokes')
      .update({ is_visible: false })
      .eq('is_visible', true);

    // Update cleared timestamp
    await supabase
      .from('whiteboard_state')
      .update({ cleared_at: new Date().toISOString() })
      .eq('id', (await supabase.from('whiteboard_state').select('id').single()).data?.id);

    // Clear local canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Scale coordinates from display size to canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsDrawing(true);
    setCurrentStroke([{ x, y }]);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Scale coordinates from display size to canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const newStroke = [...currentStroke, { x, y }];
    setCurrentStroke(newStroke);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentTool === 'highlighter') {
      ctx.globalAlpha = 0.3;
    } else if (currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = async () => {
    if (!isDrawing || currentStroke.length === 0) return;

    setIsDrawing(false);

    // Save stroke to database
    const strokeData: Stroke = {
      type: currentTool,
      points: currentStroke,
      color: currentColor,
      size: currentSize,
      timestamp: Date.now()
    };

    console.log('💾 Saving stroke to database:', strokeData);

    const { data, error } = await supabase
      .from('whiteboard_strokes')
      .insert({
        stroke_data: strokeData,
        session_id: sessionId.current,
        is_visible: true
      })
      .select();

    if (error) {
      console.error('❌ Error saving stroke:', error);
    } else {
      console.log('✅ Stroke saved successfully:', data);
    }

    setCurrentStroke([]);

    // Reset canvas context
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Match broadcast canvas size: 910x680
      canvas.width = 910;
      canvas.height = 680;
    }
  }, []);

  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FFFFFF'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-400">Live Whiteboard</h1>
          <div className="flex gap-4">
            <button
              onClick={toggleActive}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                isActive
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {isActive ? '✓ LIVE ON BROADCAST' : 'Show on Broadcast'}
            </button>
            <button
              onClick={clearCanvas}
              className="px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-all"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Tools Panel */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4 flex flex-wrap gap-4 items-center">
          {/* Tool Buttons */}
          <div className="flex gap-2">
            <span className="text-blue-400 font-bold mr-2">Tools:</span>
            {['pen', 'highlighter', 'eraser', 'line', 'box'].map((tool) => (
              <button
                key={tool}
                onClick={() => setCurrentTool(tool as any)}
                className={`px-4 py-2 rounded-lg font-bold uppercase transition-all ${
                  currentTool === tool
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {tool}
              </button>
            ))}
          </div>

          {/* Color Picker */}
          <div className="flex gap-2 items-center">
            <span className="text-blue-400 font-bold mr-2">Color:</span>
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setCurrentColor(color)}
                className={`w-10 h-10 rounded-lg transition-all ${
                  currentColor === color ? 'ring-4 ring-blue-400' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: color, border: color === '#FFFFFF' ? '2px solid #666' : 'none' }}
              />
            ))}
          </div>

          {/* Size Slider */}
          <div className="flex gap-2 items-center">
            <span className="text-blue-400 font-bold mr-2">Size:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={currentSize}
              onChange={(e) => setCurrentSize(parseInt(e.target.value))}
              className="w-32"
            />
            <span className="text-white font-bold w-8">{currentSize}</span>
          </div>
        </div>

        {/* Canvas */}
        <div className="bg-white rounded-lg shadow-2xl p-4">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="border-2 border-gray-300 rounded cursor-crosshair w-full"
          />
        </div>

        {/* Status */}
        {isActive && (
          <div className="mt-4 bg-green-500/20 border-2 border-green-500 rounded-lg p-4 text-center">
            <p className="text-green-400 font-bold text-lg">
              🔴 LIVE - Your drawings are appearing on the broadcast!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
