/**
 * Waveform Display Component
 * Shows professional waveform with beat markers, cue points, and playback position
 */

import React, { useRef, useEffect, useState } from 'react';
import { WaveformData, WaveformRenderOptions } from '../utils/waveformRenderer';
import { HotCue } from '../utils/hotCues';
import { Loop } from '../utils/loopControls';

interface WaveformDisplayProps {
  waveformData: WaveformData | null;
  beatTimes?: number[];
  cues?: HotCue[];
  loop?: Loop | null;
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
  isGenerating?: boolean;
  className?: string;
}

export function WaveformDisplay({
  waveformData,
  beatTimes = [],
  cues = [],
  loop = null,
  currentTime,
  duration,
  onSeek,
  isGenerating = false,
  className = '',
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(800);

  // Update canvas width on resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      setCanvasWidth(width);
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Render waveform
  useEffect(() => {
    if (!canvasRef.current || !waveformData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixelRatio = window.devicePixelRatio || 1;
    const height = 128;

    // Set canvas size
    canvas.width = canvasWidth * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(pixelRatio, pixelRatio);

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasWidth, height);

    // Draw waveform
    const centerY = height / 2;
    const barWidth = canvasWidth / waveformData.samples.length;

    for (let i = 0; i < waveformData.samples.length; i++) {
      const amplitude = waveformData.samples[i];
      const barHeight = amplitude * (height / 2) * 0.9;
      const x = i * barWidth;

      // Color based on frequency content
      if (waveformData.frequencies[i]) {
        const [low, mid, high] = waveformData.frequencies[i];
        ctx.fillStyle = `rgb(${high}, ${mid}, ${low})`;
      } else {
        ctx.fillStyle = '#00d4ff';
      }

      ctx.fillRect(x, centerY - barHeight / 2, Math.max(1, barWidth), barHeight);
    }

    // Draw loop region
    if (loop && loop.isActive) {
      const loopStartX = (loop.startTime / duration) * canvasWidth;
      const loopEndX = (loop.endTime / duration) * canvasWidth;
      ctx.fillStyle = 'rgba(0, 212, 255, 0.2)';
      ctx.fillRect(loopStartX, 0, loopEndX - loopStartX, height);
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(loopStartX, 0, loopEndX - loopStartX, height);
    }

    // Draw beat markers
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    beatTimes.forEach((beatTime) => {
      const x = (beatTime / duration) * canvasWidth;
      ctx.fillRect(x - 0.5, 0, 1, height);
    });

    // Draw cue points
    cues.forEach((cue) => {
      const x = (cue.time / duration) * canvasWidth;
      ctx.fillStyle = cue.color;
      ctx.fillRect(x - 2, 0, 4, height);

      // Draw cue label
      ctx.font = '10px monospace';
      ctx.fillText(cue.label || `${cue.id + 1}`, x + 5, 12);
    });

    // Draw playback position
    const playheadX = (currentTime / duration) * canvasWidth;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
  }, [waveformData, beatTimes, cues, loop, currentTime, duration, canvasWidth]);

  // Handle click to seek
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const seekTime = (x / rect.width) * duration;
    onSeek(seekTime);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-2" />
            <div className="text-sm text-gray-400">Analyzing waveform...</div>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="w-full cursor-pointer rounded border border-gray-700 hover:border-gray-600 transition-colors"
      />

      {/* Time indicators */}
      <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
