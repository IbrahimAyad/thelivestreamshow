import React, { useRef, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Point {
  x: number;
  y: number;
  pressure: number;
}

interface Stroke {
  type: 'pen' | 'highlighter' | 'eraser' | 'line' | 'box' | 'circle' | 'arrow' | 'text';
  points: Point[];
  color: string;
  size: number;
  timestamp: number;
  text?: string; // For text tool
}

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pen' | 'highlighter' | 'eraser' | 'line' | 'box' | 'circle' | 'arrow' | 'text'>('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentSize, setCurrentSize] = useState(3);
  const [isActive, setIsActive] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [strokeHistory, setStrokeHistory] = useState<string[]>([]); // IDs of strokes for undo
  const [undoneStrokes, setUndoneStrokes] = useState<string[]>([]); // IDs for redo
  const [showGrid, setShowGrid] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [toolsPanelCollapsed, setToolsPanelCollapsed] = useState(false);
  const [canvasSize, setCanvasSize] = useState<'small' | 'large'>('small'); // Size when tools are collapsed
  const sessionId = useRef(`session-${Date.now()}`);
  const lastPressure = useRef(1);
  const isPressureSupported = useRef(false);
  const isUsingPencil = useRef(false);
  const lastStrokeId = useRef<string | null>(null);
  const startPoint = useRef<Point | null>(null);
  const lastPoint = useRef<Point | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Load whiteboard state
  useEffect(() => {
    loadWhiteboardState();
    subscribeToState();

    // Cleanup animation frame on unmount
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Y or Cmd+Y or Ctrl+Shift+Z for redo
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [strokeHistory, undoneStrokes]);

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

  // Get pressure from touch/pointer event
  const getPressure = (e: any): number => {
    // Check for PointerEvent pressure (Apple Pencil, stylus)
    if (e.pressure !== undefined && e.pressure > 0) {
      isPressureSupported.current = true;
      return e.pressure;
    }

    // Check for Touch force (iPad/iPhone)
    if (e.touches && e.touches[0]) {
      const touch = e.touches[0];
      if (touch.force !== undefined) {
        isPressureSupported.current = true;
        return Math.max(0.1, Math.min(1, touch.force));
      }
    }

    return 1; // Default pressure
  };

  // Calculate dynamic size with pressure
  const getDynamicSize = (baseSize: number, pressure: number): number => {
    const minMultiplier = 0.3;
    const maxMultiplier = 1.5;

    // Smooth pressure transitions
    const smoothPressure = lastPressure.current * 0.3 + pressure * 0.7;
    lastPressure.current = smoothPressure;

    const sizeMultiplier = minMultiplier + (maxMultiplier - minMultiplier) * smoothPressure;
    return baseSize * sizeMultiplier;
  };

  // Smooth stroke points for better curves
  const smoothPoints = (points: Point[]): Point[] => {
    if (points.length < 3) return points;

    const smoothed: Point[] = [points[0]];

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];

      // Average the points for smoothing
      smoothed.push({
        x: (prev.x + curr.x + next.x) / 3,
        y: (prev.y + curr.y + next.y) / 3,
        pressure: curr.pressure
      });
    }

    smoothed.push(points[points.length - 1]);
    return smoothed;
  };

  // Undo last stroke
  const undo = async () => {
    if (strokeHistory.length === 0) return;

    const lastStrokeId = strokeHistory[strokeHistory.length - 1];

    // Hide the stroke in database
    const { error } = await supabase
      .from('whiteboard_strokes')
      .update({ is_visible: false })
      .eq('id', lastStrokeId);

    if (!error) {
      // Move to undone stack
      setStrokeHistory(prev => prev.slice(0, -1));
      setUndoneStrokes(prev => [...prev, lastStrokeId]);

      // Reload canvas
      reloadCanvas();
    }
  };

  // Redo last undone stroke
  const redo = async () => {
    if (undoneStrokes.length === 0) return;

    const strokeId = undoneStrokes[undoneStrokes.length - 1];

    // Make stroke visible again
    const { error } = await supabase
      .from('whiteboard_strokes')
      .update({ is_visible: true })
      .eq('id', strokeId);

    if (!error) {
      // Move back to history
      setUndoneStrokes(prev => prev.slice(0, -1));
      setStrokeHistory(prev => [...prev, strokeId]);

      // Reload canvas
      reloadCanvas();
    }
  };

  // Reload canvas from database
  const reloadCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Reload all visible strokes
    const { data: strokes } = await supabase
      .from('whiteboard_strokes')
      .select('stroke_data')
      .eq('is_visible', true)
      .eq('session_id', sessionId.current)
      .order('timestamp', { ascending: true });

    // Redraw all strokes
    strokes?.forEach(({ stroke_data }) => {
      drawStrokeLocally(stroke_data);
    });
  };

  // Draw stroke on local canvas (not to database)
  const drawStrokeLocally = (strokeData: Stroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { type, points, color, size } = strokeData;

    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = size;

    const hasPressure = points.length > 0 && points[0].pressure !== undefined;

    if (type === 'highlighter') {
      ctx.globalAlpha = 0.3;
    } else if (type === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // Handle shape tools
    if (type === 'line' && points.length >= 2) {
      const start = points[0];
      const end = points[points.length - 1];
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    } else if (type === 'box' && points.length >= 2) {
      const start = points[0];
      const end = points[points.length - 1];
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (type === 'circle' && points.length >= 2) {
      const start = points[0];
      const end = points[points.length - 1];
      const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (type === 'arrow' && points.length >= 2) {
      const start = points[0];
      const end = points[points.length - 1];
      drawArrow(ctx, start.x, start.y, end.x, end.y, size * 3);
    } else if (hasPressure && type !== 'eraser') {
      // Draw with pressure using smooth curves
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        const pressure = curr.pressure || 1;
        const minMultiplier = 0.3;
        const maxMultiplier = 1.5;
        const sizeMultiplier = minMultiplier + (maxMultiplier - minMultiplier) * pressure;
        ctx.lineWidth = type === 'highlighter' ? size * 3 * sizeMultiplier : size * sizeMultiplier;

        // Use quadratic curve for smoothness
        const controlX = (curr.x + next.x) / 2;
        const controlY = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, controlX, controlY);
      }

      // Draw final segment
      if (points.length > 1) {
        const lastPoint = points[points.length - 1];
        ctx.lineTo(lastPoint.x, lastPoint.y);
      }
      ctx.stroke();
    } else {
      // Draw without pressure using smooth curves
      ctx.lineWidth = type === 'highlighter' ? size * 3 : type === 'eraser' ? size * 2 : size;

      if (points.length < 2) {
        // Single point - just draw a dot
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Multiple points - use smooth curves
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length - 1; i++) {
          const controlX = (points[i].x + points[i + 1].x) / 2;
          const controlY = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, controlX, controlY);
        }

        // Draw final segment
        const lastPoint = points[points.length - 1];
        ctx.lineTo(lastPoint.x, lastPoint.y);
        ctx.stroke();
      }
    }

    // Reset
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
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

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // PALM REJECTION: Check if this is Apple Pencil or stylus
    if (e.touches && e.touches[0]) {
      const touch = e.touches[0];

      // Apple Pencil has touchType 'stylus' or has force property
      if (touch.touchType === 'stylus' || touch.force !== undefined) {
        isUsingPencil.current = true;
      }

      // If we're using pencil and this touch is not a stylus, ignore it (palm rejection)
      if (isUsingPencil.current && touch.touchType !== 'stylus' && touch.touchType !== undefined) {
        console.log('🚫 Palm detected - ignoring touch');
        return;
      }
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Get coordinates from mouse or touch
    let clientX, clientY;
    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const pressure = getPressure(e);

    setIsDrawing(true);
    setCurrentStroke([{ x, y, pressure }]);
    lastPoint.current = { x, y, pressure }; // Reset for new stroke

    // For shape tools, save the start point
    if (currentTool === 'line' || currentTool === 'box' || currentTool === 'circle' || currentTool === 'arrow') {
      startPoint.current = { x, y, pressure };
    }

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = isPressureSupported.current ? getDynamicSize(currentSize, pressure) : currentSize;

      // Save canvas state for shape preview
      if (currentTool === 'line' || currentTool === 'box' || currentTool === 'circle' || currentTool === 'arrow') {
        ctx.save();
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | any) => {
    if (!isDrawing) return;

    // PALM REJECTION: Ignore non-stylus touches when using pencil
    if (e.touches && e.touches[0]) {
      const touch = e.touches[0];
      if (isUsingPencil.current && touch.touchType !== 'stylus' && touch.touchType !== undefined) {
        return;
      }
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Get coordinates from mouse or touch
    let clientX, clientY;
    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const pressure = getPressure(e);

    const newPoint = { x, y, pressure };

    // Interpolate points if moving fast for smoother lines
    let pointsToAdd = [newPoint];
    if (lastPoint.current) {
      const distance = Math.sqrt(
        Math.pow(newPoint.x - lastPoint.current.x, 2) +
        Math.pow(newPoint.y - lastPoint.current.y, 2)
      );

      // If moving fast (>5 pixels), add interpolated points
      if (distance > 5) {
        pointsToAdd = interpolatePoints(lastPoint.current, newPoint);
      }
    }
    lastPoint.current = newPoint;

    const newStroke = [...currentStroke, ...pointsToAdd];
    setCurrentStroke(newStroke);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = currentColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Apply pressure-sensitive line width
    if (isPressureSupported.current && currentTool !== 'eraser') {
      ctx.lineWidth = getDynamicSize(currentSize, pressure);
    } else {
      ctx.lineWidth = currentSize;
    }

    // Handle shape tools with live preview
    if (currentTool === 'line' || currentTool === 'box' || currentTool === 'circle' || currentTool === 'arrow') {
      if (!startPoint.current) return;

      // Clear canvas and redraw everything
      ctx.restore();
      ctx.save();

      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const startX = startPoint.current.x;
      const startY = startPoint.current.y;

      if (currentTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (currentTool === 'box') {
        ctx.strokeRect(startX, startY, x - startX, y - startY);
      } else if (currentTool === 'circle') {
        const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
        ctx.beginPath();
        ctx.arc(startX, startY, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (currentTool === 'arrow') {
        drawArrow(ctx, startX, startY, x, y, currentSize * 3);
      }
    } else {
      // Regular drawing tools - use smooth curves
      if (currentTool === 'highlighter') {
        ctx.globalAlpha = 0.3;
        if (isPressureSupported.current) {
          ctx.lineWidth = getDynamicSize(currentSize * 3, pressure);
        } else {
          ctx.lineWidth = currentSize * 3;
        }
      } else if (currentTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = currentSize * 2;
      } else {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }

      // Use smooth quadratic curves instead of straight lines
      if (newStroke.length >= 2) {
        const lastIdx = newStroke.length - 1;
        const prevPoint = newStroke[lastIdx - 1];
        const currPoint = newStroke[lastIdx];

        // Calculate control point (average of previous and current)
        const controlX = (prevPoint.x + currPoint.x) / 2;
        const controlY = (prevPoint.y + currPoint.y) / 2;

        ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, controlX, controlY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(controlX, controlY);
      } else {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  // Draw arrow helper function
  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, headLength: number) => {
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const stopDrawing = async () => {
    if (!isDrawing || currentStroke.length === 0) return;

    setIsDrawing(false);

    // Smooth the stroke for better curves (only for pen/highlighter)
    const strokeToSave = (currentTool === 'pen' || currentTool === 'highlighter')
      ? smoothPoints(currentStroke)
      : [...currentStroke];

    // Save stroke to database
    const strokeData: Stroke = {
      type: currentTool,
      points: strokeToSave,
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
      // Save the ID of the last stroke and add to history
      if (data && data[0]) {
        lastStrokeId.current = data[0].id;
        setStrokeHistory(prev => [...prev, data[0].id]);
        setUndoneStrokes([]); // Clear redo stack on new stroke
      }
    }

    // Only clear stroke after successful save
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
      // Three modes:
      // Normal (tools visible): 910x680
      // Compact (tools hidden, small): 910x680
      // Maximized (tools hidden, large): 1400x900
      let width: number;
      let height: number;
      let mode: string;

      if (!toolsPanelCollapsed) {
        // Normal mode - tools visible
        width = 910;
        height = 680;
        mode = 'normal';
      } else if (canvasSize === 'small') {
        // Compact mode - tools hidden, small canvas
        width = 910;
        height = 680;
        mode = 'compact';
      } else {
        // Maximized mode - tools hidden, large canvas
        width = 1400;
        height = 900;
        mode = 'maximized';
      }

      canvas.width = width;
      canvas.height = height;

      // Update canvas mode in database so broadcast can resize
      updateCanvasMode(mode);

      // Reload canvas content after resize
      reloadCanvas();
    }
  }, [toolsPanelCollapsed, canvasSize]);

  // Update canvas mode in database
  const updateCanvasMode = async (mode: string) => {
    const { data: stateRecord } = await supabase
      .from('whiteboard_state')
      .select('id')
      .single();

    if (stateRecord) {
      await supabase
        .from('whiteboard_state')
        .update({ canvas_mode: mode })
        .eq('id', stateRecord.id);

      console.log(`📐 Canvas mode updated to: ${mode}`);
    }
  };

  // Redraw canvas when background or grid changes
  useEffect(() => {
    if (canvasRef.current) {
      reloadCanvas();
    }
  }, [backgroundColor, showGrid]);

  // SMOOTHING HELPERS: Bezier curve interpolation for smoother lines
  const getAveragePoint = (p1: Point, p2: Point): Point => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
      pressure: (p1.pressure + p2.pressure) / 2
    };
  };

  const drawSmoothLine = (ctx: CanvasRenderingContext2D, points: Point[]) => {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    // Use quadratic curves for smoothing
    for (let i = 1; i < points.length - 1; i++) {
      const avgPoint = getAveragePoint(points[i], points[i + 1]);
      ctx.quadraticCurveTo(points[i].x, points[i].y, avgPoint.x, avgPoint.y);
    }

    // Draw last segment
    if (points.length > 1) {
      const lastPoint = points[points.length - 1];
      ctx.lineTo(lastPoint.x, lastPoint.y);
    }

    ctx.stroke();
  };

  // Point interpolation: Add points between fast movements for smoother drawing
  const interpolatePoints = (p1: Point, p2: Point): Point[] => {
    const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    const steps = Math.max(Math.floor(distance / 2), 1); // Add point every 2 pixels
    const interpolated: Point[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      interpolated.push({
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t,
        pressure: p1.pressure + (p2.pressure - p1.pressure) * t
      });
    }

    return interpolated;
  };

  // Expanded professional color palette (24 colors)
  const colors = [
    // First row - Primary colors
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    // Second row - Secondary colors
    '#FF6B00', '#9C27B0', '#00BCD4', '#4CAF50', '#FF9800', '#E91E63',
    // Third row - Pastels
    '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFDFBA', '#E0BBE4',
    // Fourth row - Dark tones
    '#1A1A1A', '#8B4513', '#2F4F4F', '#4B0082', '#800000', '#2C3E50'
  ];

  // Stroke width presets
  const widthPresets = [
    { label: 'Thin', value: 2 },
    { label: 'Medium', value: 4 },
    { label: 'Thick', value: 8 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-400">Live Whiteboard Pro</h1>
          <div className="flex gap-3">
            <button
              onClick={undo}
              disabled={strokeHistory.length === 0}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              ↶ Undo
            </button>
            <button
              onClick={redo}
              disabled={undoneStrokes.length === 0}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              ↷ Redo
            </button>
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
              🗑️ Clear All
            </button>
          </div>
        </div>

        {/* Tools Panel Toggle */}
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={() => setToolsPanelCollapsed(!toolsPanelCollapsed)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all"
          >
            {toolsPanelCollapsed ? '🔽 Show Tools' : '🔼 Hide Tools'}
          </button>
          {toolsPanelCollapsed && (
            <div className="flex items-center gap-4">
              {/* Canvas Size Toggle */}
              <button
                onClick={() => setCanvasSize(canvasSize === 'small' ? 'large' : 'small')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-all"
              >
                {canvasSize === 'small' ? '📐 Switch to Large Canvas (1400x900)' : '📐 Switch to Small Canvas (910x680)'}
              </button>
              {/* Status Bar */}
              <div className="text-gray-400 text-sm">
                Canvas: <span className="text-purple-400 font-bold">{canvasSize === 'small' ? '910x680px' : '1400x900px'}</span> |
                Current: <span className="text-blue-400 font-bold">{currentTool}</span> |
                Color: <span className="inline-block w-4 h-4 rounded ml-1" style={{ backgroundColor: currentColor, border: '1px solid #666' }}></span> |
                Size: <span className="text-blue-400 font-bold">{currentSize}px</span>
              </div>
            </div>
          )}
        </div>

        {/* Tools Panel */}
        {!toolsPanelCollapsed && (
        <div className="bg-gray-800 rounded-lg p-4 mb-4 space-y-4">
          {/* Tool Buttons */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-blue-400 font-bold mr-2">Tools:</span>
            {['pen', 'highlighter', 'eraser', 'line', 'box', 'circle', 'arrow'].map((tool) => (
              <button
                key={tool}
                onClick={() => setCurrentTool(tool as any)}
                className={`px-4 py-2 rounded-lg font-bold uppercase text-sm transition-all ${
                  currentTool === tool
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {tool === 'pen' && '✏️'} {tool === 'highlighter' && '🖍️'} {tool === 'eraser' && '🧹'}
                {tool === 'line' && '📏'} {tool === 'box' && '⬜'} {tool === 'circle' && '⭕'}
                {tool === 'arrow' && '➡️'} {tool}
              </button>
            ))}
          </div>

          {/* Width Presets */}
          <div className="flex gap-2 items-center">
            <span className="text-blue-400 font-bold mr-2">Size:</span>
            {widthPresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setCurrentSize(preset.value)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  currentSize === preset.value
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {preset.label}
              </button>
            ))}
            <input
              type="range"
              min="1"
              max="20"
              value={currentSize}
              onChange={(e) => setCurrentSize(parseInt(e.target.value))}
              className="w-32 ml-2"
            />
            <span className="text-white font-bold w-8">{currentSize}px</span>
          </div>

          {/* Color Picker - 24 colors in 4 rows */}
          <div className="space-y-2">
            <span className="text-blue-400 font-bold">Colors:</span>
            <div className="grid grid-cols-6 gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setCurrentColor(color)}
                  className={`w-12 h-12 rounded-lg transition-all ${
                    currentColor === color ? 'ring-4 ring-blue-400 scale-110' : 'hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: color,
                    border: (color === '#FFFFFF' || color === '#FFFFBA') ? '2px solid #666' : 'none'
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Background Options */}
          <div className="flex gap-4 items-center pt-2 border-t border-gray-700">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                showGrid
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              📊 {showGrid ? 'Grid ON' : 'Grid OFF'}
            </button>
            <span className="text-blue-400 font-bold">Background:</span>
            {['#FFFFFF', '#F5F5DC', '#000000', '#2C3E50'].map((bg) => (
              <button
                key={bg}
                onClick={() => setBackgroundColor(bg)}
                className={`w-10 h-10 rounded-lg transition-all ${
                  backgroundColor === bg ? 'ring-4 ring-blue-400' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: bg, border: bg === '#FFFFFF' ? '2px solid #666' : 'none' }}
                title={bg === '#FFFFFF' ? 'White' : bg === '#F5F5DC' ? 'Beige' : bg === '#000000' ? 'Black' : 'Dark'}
              />
            ))}
          </div>
        </div>
        )}

        {/* Canvas */}
        <div className="rounded-lg shadow-2xl p-4" style={{ backgroundColor: backgroundColor }}>
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={(e) => {
              e.preventDefault();
              startDrawing(e);
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              draw(e);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              stopDrawing();
            }}
            style={{
              touchAction: 'none',
              backgroundColor: 'transparent',
              backgroundImage: showGrid
                ? 'linear-gradient(rgba(128,128,128,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.3) 1px, transparent 1px)'
                : 'none',
              backgroundSize: showGrid ? '30px 30px' : 'auto'
            }}
            className="border-2 border-gray-400 rounded cursor-crosshair w-full"
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
