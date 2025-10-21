import { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  duration: number;
}

export function SchedulingModal({
  isOpen,
  onClose,
  videoId,
  title,
  channel,
  thumbnailUrl,
  duration
}: SchedulingModalProps) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [autoPlay, setAutoPlay] = useState(true);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSchedule = async () => {
    if (!scheduledDate || !scheduledTime) {
      alert('Please select both date and time');
      return;
    }

    setSaving(true);
    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);

      const { error } = await supabase.from('scheduled_videos').insert({
        video_id: videoId,
        title,
        channel,
        thumbnail_url: thumbnailUrl,
        duration,
        scheduled_time: scheduledDateTime.toISOString(),
        auto_play: autoPlay,
        played: false
      });

      if (error) throw error;

      alert('Video scheduled successfully!');
      onClose();
    } catch (error) {
      console.error('Scheduling error:', error);
      alert('Failed to schedule video');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-modal">
        <div className="flex items-center justify-between p-6 border-b border-neutral-300">
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Schedule Video
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <div className="text-sm font-semibold text-neutral-900 mb-2 truncate">{title}</div>
            <div className="text-xs text-neutral-600">{channel}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Time
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoPlay}
              onChange={(e) => setAutoPlay(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-neutral-800">Auto-play at scheduled time</span>
          </label>
        </div>

        <div className="flex gap-3 p-6 border-t border-neutral-300">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-md border border-neutral-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-md transition-colors disabled:opacity-50"
          >
            {saving ? 'Scheduling...' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
