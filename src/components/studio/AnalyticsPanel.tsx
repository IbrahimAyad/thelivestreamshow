// Phase 6C: Advanced Analytics Dashboard
// Session analytics, energy graphs, mix quality scoring

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  calculateMixQuality,
  generateEnergyFlowGraph,
  calculateTrackStatistics,
  exportSessionReport,
  trackSessionData,
  type TrackStatistics,
  type MixQuality,
} from '@/utils/studio/analyticsEngine';
import type { Database } from '../types/database';

type DJAnalytics = Database['public']['Tables']['dj_analytics']['Row'];

export const AnalyticsPanel: React.FC = () => {
  const [sessions, setSessions] = useState<DJAnalytics[]>([]);
  const [selectedSession, setSelectedSession] = useState<DJAnalytics | null>(null);
  const [mixQuality, setMixQuality] = useState<MixQuality | null>(null);
  const [trackStats, setTrackStats] = useState<TrackStatistics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId] = useState<string>(() => {
    const stored = localStorage.getItem('current_session_id');
    if (stored) return stored;
    const newId = crypto.randomUUID();
    localStorage.setItem('current_session_id', newId);
    return newId;
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadSessions();
    loadTrackStatistics();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      setMixQuality(calculateMixQuality(selectedSession));
      drawEnergyGraph();
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('dj_analytics')
        .select('*')
        .order('session_start', { ascending: false });

      if (error) throw error;
      setSessions(data || []);

      // Select most recent session
      if (data && data.length > 0) {
        setSelectedSession(data[0]);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrackStatistics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const stats = await calculateTrackStatistics(user.id);
      setTrackStats(stats);
    } catch (error) {
      console.error('Failed to load track statistics:', error);
    }
  };

  const trackCurrentSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setIsLoading(true);
      await trackSessionData(currentSessionId, user.id);
      await loadSessions();
    } catch (error) {
      console.error('Failed to track session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const drawEnergyGraph = () => {
    if (!selectedSession || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const energyData = generateEnergyFlowGraph(selectedSession);
    if (energyData.length === 0) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up dimensions
    const padding = 40;
    const graphWidth = canvas.width - padding * 2;
    const graphHeight = canvas.height - padding * 2;
    const maxEnergy = 5;
    const pointSpacing = graphWidth / (energyData.length - 1 || 1);

    // Draw axes
    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = canvas.height - padding - (i / maxEnergy) * graphHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // Draw energy line
    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth = 3;
    ctx.beginPath();

    energyData.forEach((point, index) => {
      const x = padding + index * pointSpacing;
      const y = canvas.height - padding - (point.energy / maxEnergy) * graphHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    energyData.forEach((point, index) => {
      const x = padding + index * pointSpacing;
      const y = canvas.height - padding - (point.energy / maxEnergy) * graphHeight;

      ctx.fillStyle = '#8B5CF6';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = canvas.height - padding - (i / maxEnergy) * graphHeight;
      ctx.fillText(i.toString(), padding - 10, y + 4);
    }
  };

  const handleExport = () => {
    if (!selectedSession) return;

    const csv = exportSessionReport(selectedSession);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dj-session-${selectedSession.session_id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Analytics Dashboard</h2>
        <button
          onClick={trackCurrentSession}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          disabled={isLoading}
        >
          Update Current Session
        </button>
      </div>

      {/* Session Selector */}
      <div className="bg-gray-800 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Session
        </label>
        <select
          value={selectedSession?.id || ''}
          onChange={(e) => {
            const session = sessions.find(s => s.id === e.target.value);
            setSelectedSession(session || null);
          }}
          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
        >
          {sessions.map(session => (
            <option key={session.id} value={session.id}>
              {new Date(session.session_start).toLocaleString()} - {session.total_tracks_played} tracks
            </option>
          ))}
        </select>
      </div>

      {selectedSession && (
        <>
          {/* Session Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Total Tracks</p>
              <p className="text-2xl font-bold text-white">{selectedSession.total_tracks_played}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Duration</p>
              <p className="text-2xl font-bold text-white">
                {formatDuration(selectedSession.total_duration_seconds)}
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Mix Quality</p>
              <p className="text-2xl font-bold text-white">{mixQuality?.overallScore || 0}</p>
              <p className="text-xs text-gray-400">{mixQuality?.breakdown}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Avg BPM Match</p>
              <p className="text-2xl font-bold text-white">{mixQuality?.bpmScore || 0}</p>
            </div>
          </div>

          {/* Energy Flow Graph */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Energy Flow</h3>
            <canvas
              ref={canvasRef}
              width={800}
              height={300}
              className="w-full"
            />
          </div>

          {/* Mix Quality Breakdown */}
          {mixQuality && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Mix Quality Breakdown</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">Harmonic Compatibility</span>
                    <span className="text-white font-semibold">{mixQuality.harmonicScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${mixQuality.harmonicScore}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">BPM Matching</span>
                    <span className="text-white font-semibold">{mixQuality.bpmScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${mixQuality.bpmScore}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">Energy Flow</span>
                    <span className="text-white font-semibold">{mixQuality.energyFlowScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${mixQuality.energyFlowScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Session Report (CSV)
          </button>
        </>
      )}

      {/* Track Statistics */}
      {trackStats.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Track Statistics</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                  <th className="pb-2">Track</th>
                  <th className="pb-2">Plays</th>
                  <th className="pb-2">Last Played</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {trackStats.slice(0, 10).map(stat => (
                  <tr key={stat.trackId} className="border-b border-gray-700">
                    <td className="py-2 text-white">{stat.trackName}</td>
                    <td className="py-2 text-gray-300">{stat.playCount}</td>
                    <td className="py-2 text-gray-400">
                      {stat.lastPlayed?.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
