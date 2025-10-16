import React, { useState } from 'react';
import { SkipForward, Pause, Play, RotateCcw, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EmergencyControlsProps {
  showId?: string;
  currentSegmentIndex?: number;
  isPaused?: boolean;
  onSkipSegment?: () => void;
  onTogglePause?: () => void;
  onReset?: () => void;
}

export const EmergencyControls: React.FC<EmergencyControlsProps> = ({
  showId,
  currentSegmentIndex = 0,
  isPaused = false,
  onSkipSegment,
  onTogglePause,
  onReset,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSkipSegment = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (showId) {
        const { error } = await supabase
          .from('shows')
          .update({ 
            current_segment_index: currentSegmentIndex + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', showId);

        if (error) throw error;
      }
      
      onSkipSegment?.();
    } catch (error) {
      console.error('Error skipping segment:', error);
      alert('Failed to skip segment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePause = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (showId) {
        const { error } = await supabase
          .from('shows')
          .update({ 
            is_paused: !isPaused,
            updated_at: new Date().toISOString()
          })
          .eq('id', showId);

        if (error) throw error;
      }
      
      onTogglePause?.();
    } catch (error) {
      console.error('Error toggling pause:', error);
      alert('Failed to toggle pause. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (showId) {
        const { error } = await supabase
          .from('shows')
          .update({ 
            current_segment_index: 0,
            is_paused: false,
            status: 'draft',
            updated_at: new Date().toISOString()
          })
          .eq('id', showId);

        if (error) throw error;
      }
      
      onReset?.();
      setShowResetConfirm(false);
    } catch (error) {
      console.error('Error resetting show:', error);
      alert('Failed to reset show. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <AlertTriangle size={20} color="#ff6b35" />
        <span style={styles.title}>Emergency Controls</span>
      </div>
      
      <div style={styles.buttonGrid}>
        <button
          onClick={handleSkipSegment}
          disabled={isLoading}
          style={{
            ...styles.button,
            ...styles.skipButton,
            ...(isLoading && styles.buttonDisabled)
          }}
          title="Skip to next segment (N)"
        >
          <SkipForward size={24} />
          <span>Skip Segment</span>
        </button>

        <button
          onClick={handleTogglePause}
          disabled={isLoading}
          style={{
            ...styles.button,
            ...styles.pauseButton,
            ...(isLoading && styles.buttonDisabled)
          }}
          title="Pause/Resume timer (P)"
        >
          {isPaused ? <Play size={24} /> : <Pause size={24} />}
          <span>{isPaused ? 'Resume' : 'Pause'} Timer</span>
        </button>

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={isLoading}
            style={{
              ...styles.button,
              ...styles.resetButton,
              ...(isLoading && styles.buttonDisabled)
            }}
            title="Reset show to beginning"
          >
            <RotateCcw size={24} />
            <span>Reset Show</span>
          </button>
        ) : (
          <div style={styles.confirmContainer}>
            <button
              onClick={handleReset}
              disabled={isLoading}
              style={{
                ...styles.confirmButton,
                ...styles.confirmYes,
                ...(isLoading && styles.buttonDisabled)
              }}
            >
              Confirm Reset
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              disabled={isLoading}
              style={{
                ...styles.confirmButton,
                ...styles.confirmNo
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#0a1628',
    border: '2px solid #00d9ff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 0 20px rgba(0, 217, 255, 0.3)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(0, 217, 255, 0.3)',
  },
  title: {
    color: '#00d9ff',
    fontSize: '18px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  buttonGrid: {
    display: 'grid',
    gap: '12px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '16px 24px',
    fontSize: '16px',
    fontWeight: '700',
    border: '2px solid',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  skipButton: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff8c61',
    color: '#fff',
  },
  pauseButton: {
    backgroundColor: '#ffa500',
    borderColor: '#ffb833',
    color: '#fff',
  },
  resetButton: {
    backgroundColor: '#dc143c',
    borderColor: '#ff1744',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  confirmContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  confirmButton: {
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '700',
    border: '2px solid',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
  },
  confirmYes: {
    backgroundColor: '#dc143c',
    borderColor: '#ff1744',
    color: '#fff',
  },
  confirmNo: {
    backgroundColor: '#0a1628',
    borderColor: '#00d9ff',
    color: '#00d9ff',
  },
};
