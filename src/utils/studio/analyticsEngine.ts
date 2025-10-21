// Phase 6C: Analytics Engine
// Utilities for DJ session analytics and reporting

import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type MusicLibrary = Database['public']['Tables']['music_library']['Row'];
type PlayHistory = Database['public']['Tables']['play_history']['Row'];
type DJAnalytics = Database['public']['Tables']['dj_analytics']['Row'];

export interface SessionData {
  sessionId: string;
  sessionStart: Date;
  sessionEnd?: Date;
  tracks: Array<{
    trackId: string;
    trackName: string;
    bpm: number | null;
    key: string | null;
    energy: number | null;
    timestamp: Date;
  }>;
  energyCurve: Array<{
    timestamp: number;
    energyLevel: number;
  }>;
  transitionScores: Array<{
    fromTrack: string;
    toTrack: string;
    harmonicScore: number;
    bpmScore: number;
    technique: string;
  }>;
}

export interface MixQuality {
  overallScore: number;
  harmonicScore: number;
  bpmScore: number;
  energyFlowScore: number;
  breakdown: string;
}

export interface TrackStatistics {
  trackId: string;
  trackName: string;
  playCount: number;
  lastPlayed: Date | null;
  averagePosition: number;
}

// Calculate harmonic compatibility score (0-100)
function calculateHarmonicScore(key1: string | null, key2: string | null): number {
  if (!key1 || !key2) return 50; // Neutral score if keys unknown
  
  // Camelot wheel compatibility (simplified)
  const camelotWheel: Record<string, string[]> = {
    '1A': ['1A', '12A', '2A', '1B'],
    '2A': ['2A', '1A', '3A', '2B'],
    '3A': ['3A', '2A', '4A', '3B'],
    '4A': ['4A', '3A', '5A', '4B'],
    '5A': ['5A', '4A', '6A', '5B'],
    '6A': ['6A', '5A', '7A', '6B'],
    '7A': ['7A', '6A', '8A', '7B'],
    '8A': ['8A', '7A', '9A', '8B'],
    '9A': ['9A', '8A', '10A', '9B'],
    '10A': ['10A', '9A', '11A', '10B'],
    '11A': ['11A', '10A', '12A', '11B'],
    '12A': ['12A', '11A', '1A', '12B'],
  };
  
  if (key1 === key2) return 100; // Perfect match
  if (camelotWheel[key1]?.includes(key2)) return 80; // Compatible
  return 30; // Not compatible
}

// Calculate BPM compatibility score (0-100)
function calculateBPMScore(bpm1: number | null, bpm2: number | null): number {
  if (!bpm1 || !bpm2) return 50; // Neutral score if BPM unknown
  
  const diff = Math.abs(bpm1 - bpm2);
  
  if (diff === 0) return 100; // Perfect match
  if (diff <= 2) return 90; // Very close
  if (diff <= 5) return 70; // Close
  if (diff <= 10) return 50; // Moderate
  if (diff <= 20) return 30; // Difficult
  return 10; // Very difficult
}

// Calculate energy flow score (0-100)
function calculateEnergyFlowScore(energyCurve: Array<{ timestamp: number; energyLevel: number }>): number {
  if (energyCurve.length < 2) return 50;
  
  let score = 100;
  
  // Penalize sudden energy drops (more than 2 levels)
  for (let i = 1; i < energyCurve.length; i++) {
    const energyChange = energyCurve[i].energyLevel - energyCurve[i - 1].energyLevel;
    
    if (energyChange < -2) {
      score -= 10; // Sudden drop penalty
    } else if (energyChange > 3) {
      score -= 5; // Too rapid increase penalty
    }
  }
  
  return Math.max(0, score);
}

// Track session data from play history
export async function trackSessionData(sessionId: string, userId: string): Promise<void> {
  try {
    // Get play history for session
    const { data: history } = await supabase
      .from('play_history')
      .select('*')
      .eq('user_id', userId)
      .order('played_at', { ascending: true });
    
    if (!history || history.length === 0) return;
    
    // Get track details
    const trackIds = [...new Set(history.map(h => h.track_id))];
    const { data: tracks } = await supabase
      .from('music_library')
      .select('*')
      .in('id', trackIds);
    
    if (!tracks) return;
    
    const trackMap = new Map(tracks.map(t => [t.id, t]));
    
    // Build track history
    const trackHistory = history.map(h => {
      const track = trackMap.get(h.track_id);
      return {
        track_id: h.track_id,
        track_name: track?.name || 'Unknown',
        bpm: track?.bpm || null,
        key: track?.musical_key || null,
        energy: track?.energy_level || null,
        timestamp: h.played_at,
      };
    });
    
    // Build energy curve
    const energyCurve = history.map((h, i) => {
      const track = trackMap.get(h.track_id);
      return {
        timestamp: i,
        energy_level: track?.energy_level || 3,
      };
    });
    
    // Calculate transition scores
    const transitionScores = [];
    for (let i = 1; i < history.length; i++) {
      const prevTrack = trackMap.get(history[i - 1].track_id);
      const currentTrack = trackMap.get(history[i].track_id);
      
      transitionScores.push({
        from_track: prevTrack?.name || 'Unknown',
        to_track: currentTrack?.name || 'Unknown',
        harmonic_score: calculateHarmonicScore(prevTrack?.musical_key || null, currentTrack?.musical_key || null),
        bpm_score: calculateBPMScore(prevTrack?.bpm || null, currentTrack?.bpm || null),
        technique: 'auto',
      });
    }
    
    // Calculate genre breakdown
    const genreBreakdown: Record<string, number> = {};
    tracks.forEach(track => {
      const genre = track.genre || 'Unknown';
      genreBreakdown[genre] = (genreBreakdown[genre] || 0) + 1;
    });
    
    // Calculate total duration
    const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
    
    // Insert or update analytics
    const sessionStart = history[0].played_at;
    const sessionEnd = history[history.length - 1].played_at;
    
    await supabase
      .from('dj_analytics')
      .upsert({
        user_id: userId,
        session_id: sessionId,
        session_start: sessionStart,
        session_end: sessionEnd,
        total_tracks_played: history.length,
        total_duration_seconds: totalDuration,
        energy_curve: energyCurve,
        track_history: trackHistory,
        transition_scores: transitionScores,
        genre_breakdown: genreBreakdown,
      });
  } catch (error) {
    console.error('Error tracking session data:', error);
  }
}

// Calculate overall mix quality
export function calculateMixQuality(analytics: DJAnalytics): MixQuality {
  const transitionScores = (analytics.transition_scores as any[]) || [];
  
  if (transitionScores.length === 0) {
    return {
      overallScore: 0,
      harmonicScore: 0,
      bpmScore: 0,
      energyFlowScore: 0,
      breakdown: 'No transitions recorded',
    };
  }
  
  // Calculate average harmonic score
  const avgHarmonic = transitionScores.reduce((sum, t) => sum + (t.harmonic_score || 50), 0) / transitionScores.length;
  
  // Calculate average BPM score
  const avgBPM = transitionScores.reduce((sum, t) => sum + (t.bpm_score || 50), 0) / transitionScores.length;
  
  // Calculate energy flow score
  const energyCurve = (analytics.energy_curve as any[]) || [];
  const energyFlow = calculateEnergyFlowScore(energyCurve);
  
  // Overall score (weighted average)
  const overall = (avgHarmonic * 0.3) + (avgBPM * 0.3) + (energyFlow * 0.4);
  
  let breakdown = '';
  if (overall >= 80) breakdown = 'Excellent mix quality';
  else if (overall >= 60) breakdown = 'Good mix quality';
  else if (overall >= 40) breakdown = 'Fair mix quality';
  else breakdown = 'Needs improvement';
  
  return {
    overallScore: Math.round(overall),
    harmonicScore: Math.round(avgHarmonic),
    bpmScore: Math.round(avgBPM),
    energyFlowScore: Math.round(energyFlow),
    breakdown,
  };
}

// Generate energy flow graph data
export function generateEnergyFlowGraph(analytics: DJAnalytics): Array<{ time: string; energy: number }> {
  const energyCurve = (analytics.energy_curve as any[]) || [];
  const sessionStart = new Date(analytics.session_start);
  
  return energyCurve.map((point, index) => {
    const time = new Date(sessionStart.getTime() + (point.timestamp * 60000)); // Assuming minutes
    return {
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      energy: point.energy_level,
    };
  });
}

// Calculate track statistics
export async function calculateTrackStatistics(userId: string): Promise<TrackStatistics[]> {
  try {
    const { data: history } = await supabase
      .from('play_history')
      .select('*')
      .eq('user_id', userId)
      .order('played_at', { ascending: false });
    
    if (!history || history.length === 0) return [];
    
    // Get track details
    const trackIds = [...new Set(history.map(h => h.track_id))];
    const { data: tracks } = await supabase
      .from('music_library')
      .select('*')
      .in('id', trackIds);
    
    if (!tracks) return [];
    
    const trackMap = new Map(tracks.map(t => [t.id, t]));
    
    // Calculate statistics per track
    const stats = new Map<string, { count: number; lastPlayed: Date | null; positions: number[] }>();
    
    history.forEach((h, index) => {
      const trackId = h.track_id;
      const existing = stats.get(trackId) || { count: 0, lastPlayed: null, positions: [] };
      
      existing.count++;
      if (!existing.lastPlayed || new Date(h.played_at) > existing.lastPlayed) {
        existing.lastPlayed = new Date(h.played_at);
      }
      existing.positions.push(index);
      
      stats.set(trackId, existing);
    });
    
    // Build statistics array
    const statistics: TrackStatistics[] = [];
    stats.forEach((value, trackId) => {
      const track = trackMap.get(trackId);
      if (track) {
        statistics.push({
          trackId,
          trackName: track.name,
          playCount: value.count,
          lastPlayed: value.lastPlayed,
          averagePosition: value.positions.reduce((sum, p) => sum + p, 0) / value.positions.length,
        });
      }
    });
    
    return statistics.sort((a, b) => b.playCount - a.playCount);
  } catch (error) {
    console.error('Error calculating track statistics:', error);
    return [];
  }
}

// Export session report as CSV
export function exportSessionReport(analytics: DJAnalytics): string {
  const trackHistory = (analytics.track_history as any[]) || [];
  const transitionScores = (analytics.transition_scores as any[]) || [];
  
  let csv = 'DJ Session Report\n\n';
  csv += `Session ID,${analytics.session_id}\n`;
  csv += `Session Start,${new Date(analytics.session_start).toLocaleString()}\n`;
  csv += `Session End,${analytics.session_end ? new Date(analytics.session_end).toLocaleString() : 'Ongoing'}\n`;
  csv += `Total Tracks,${analytics.total_tracks_played}\n`;
  csv += `Total Duration,${Math.floor(analytics.total_duration_seconds / 60)} minutes\n\n`;
  
  csv += 'Track History\n';
  csv += 'Track Name,BPM,Key,Energy,Timestamp\n';
  trackHistory.forEach(track => {
    csv += `"${track.track_name}",${track.bpm || 'N/A'},${track.key || 'N/A'},${track.energy || 'N/A'},${new Date(track.timestamp).toLocaleString()}\n`;
  });
  
  csv += '\nTransition Scores\n';
  csv += 'From Track,To Track,Harmonic Score,BPM Score,Technique\n';
  transitionScores.forEach(score => {
    csv += `"${score.from_track}","${score.to_track}",${score.harmonic_score},${score.bpm_score},${score.technique}\n`;
  });
  
  return csv;
}
