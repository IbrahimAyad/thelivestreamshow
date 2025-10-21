// Phase 6E: Scheduled Automation System
// Timeline-based scheduler with recurring events

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type ScheduledEvent = Database['public']['Tables']['scheduled_events']['Row'];
type ScheduledEventInsert = Database['public']['Tables']['scheduled_events']['Insert'];

interface EventFormData {
  eventName: string;
  eventType: 'play_track' | 'trigger_mix' | 'trigger_sound' | 'change_preset';
  scheduledTime: string;
  recurrence: 'once' | 'daily' | 'weekly';
  payload: any;
}

export const SchedulerPanel: React.FC = () => {
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    eventName: '',
    eventType: 'trigger_sound',
    scheduledTime: '',
    recurrence: 'once',
    payload: {},
  });
  const [tracks, setTracks] = useState<any[]>([]);
  const [mixes, setMixes] = useState<any[]>([]);
  const [sounds, setSounds] = useState<any[]>([]);

  useEffect(() => {
    loadEvents();
    loadResources();

    // Subscribe to events table changes
    const channel = supabase
      .channel('scheduled_events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_events',
        },
        () => {
          loadEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_events')
        .select('*')
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const loadResources = async () => {
    try {
      // Load tracks
      const { data: tracksData } = await supabase
        .from('music_library')
        .select('id, name')
        .order('name');
      setTracks(tracksData || []);

      // Load mixes
      const { data: mixesData } = await supabase
        .from('saved_mixes')
        .select('id, name')
        .order('name');
      setMixes(mixesData || []);

      // Load sounds
      const { data: soundsData } = await supabase
        .from('music_library')
        .select('id, name, friendly_name')
        .not('friendly_name', 'is', null)
        .order('name');
      setSounds(soundsData || []);
    } catch (error) {
      console.error('Failed to load resources:', error);
    }
  };

  const handleAddEvent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let payload = {};

      switch (formData.eventType) {
        case 'play_track':
          payload = { track_id: formData.payload.track_id };
          break;
        case 'trigger_mix':
          payload = { mix_id: formData.payload.mix_id };
          break;
        case 'trigger_sound':
          payload = { sound_name: formData.payload.sound_name };
          break;
        case 'change_preset':
          payload = { preset_mode: formData.payload.preset_mode };
          break;
      }

      const eventData: ScheduledEventInsert = {
        user_id: user.id,
        event_name: formData.eventName,
        event_type: formData.eventType,
        scheduled_time: new Date(formData.scheduledTime).toISOString(),
        recurrence: formData.recurrence,
        payload,
        enabled: true,
      };

      const { error } = await supabase
        .from('scheduled_events')
        .insert(eventData);

      if (error) throw error;

      setShowAddModal(false);
      setFormData({
        eventName: '',
        eventType: 'trigger_sound',
        scheduledTime: '',
        recurrence: 'once',
        payload: {},
      });
    } catch (error) {
      console.error('Failed to add event:', error);
    }
  };

  const handleToggleEvent = async (event: ScheduledEvent) => {
    try {
      const { error } = await supabase
        .from('scheduled_events')
        .update({ enabled: !event.enabled })
        .eq('id', event.id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to toggle event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('scheduled_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const handleManualTrigger = async (event: ScheduledEvent) => {
    try {
      // Call scheduled-automation edge function manually
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scheduled-automation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to trigger event');

      alert('Event triggered successfully');
    } catch (error) {
      console.error('Failed to trigger event:', error);
      alert('Failed to trigger event');
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'play_track':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        );
      case 'trigger_mix':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        );
      case 'trigger_sound':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        );
      case 'change_preset':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderPayloadInput = () => {
    switch (formData.eventType) {
      case 'play_track':
        return (
          <select
            value={formData.payload.track_id || ''}
            onChange={(e) => setFormData({ ...formData, payload: { track_id: e.target.value } })}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="">Select Track</option>
            {tracks.map(track => (
              <option key={track.id} value={track.id}>{track.name}</option>
            ))}
          </select>
        );
      case 'trigger_mix':
        return (
          <select
            value={formData.payload.mix_id || ''}
            onChange={(e) => setFormData({ ...formData, payload: { mix_id: e.target.value } })}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="">Select Mix</option>
            {mixes.map(mix => (
              <option key={mix.id} value={mix.id}>{mix.name}</option>
            ))}
          </select>
        );
      case 'trigger_sound':
        return (
          <select
            value={formData.payload.sound_name || ''}
            onChange={(e) => setFormData({ ...formData, payload: { sound_name: e.target.value } })}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="">Select Sound</option>
            {sounds.map(sound => (
              <option key={sound.id} value={sound.friendly_name}>
                {sound.name}
              </option>
            ))}
          </select>
        );
      case 'change_preset':
        return (
          <select
            value={formData.payload.preset_mode || ''}
            onChange={(e) => setFormData({ ...formData, payload: { preset_mode: e.target.value } })}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="">Select Preset</option>
            <option value="morning_calm">Morning Calm</option>
            <option value="work_focus">Work Focus</option>
            <option value="party_time">Party Time</option>
            <option value="chill_evening">Chill Evening</option>
          </select>
        );
    }
  };

  // Timeline visualization
  const renderTimeline = () => {
    const now = new Date();
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">24-Hour Timeline</h3>
        <div className="relative h-20 bg-gray-900 rounded-lg overflow-hidden">
          {/* Hour markers */}
          <div className="absolute inset-0 flex">
            {hours.map(hour => (
              <div
                key={hour}
                className="flex-1 border-r border-gray-700 flex items-end justify-center pb-1"
              >
                <span className="text-xs text-gray-500">{hour}</span>
              </div>
            ))}
          </div>

          {/* Current time marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-purple-600"
            style={{ left: `${(now.getHours() + now.getMinutes() / 60) / 24 * 100}%` }}
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-purple-600" />
          </div>

          {/* Event markers */}
          {events.filter(e => e.enabled).map(event => {
            const eventTime = new Date(event.scheduled_time);
            const position = (eventTime.getHours() + eventTime.getMinutes() / 60) / 24 * 100;

            return (
              <div
                key={event.id}
                className="absolute top-2 w-3 h-3 rounded-full bg-blue-500"
                style={{ left: `${position}%` }}
                title={event.event_name}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Scheduled Events</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Event
        </button>
      </div>

      {renderTimeline()}

      {/* Events List */}
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">No scheduled events yet</p>
          </div>
        ) : (
          events.map(event => (
            <div
              key={event.id}
              className={`bg-gray-800 rounded-lg p-4 flex items-center justify-between ${
                !event.enabled ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={`p-2 rounded-lg ${event.enabled ? 'bg-purple-600' : 'bg-gray-700'}`}>
                  {getEventIcon(event.event_type)}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{event.event_name}</h3>
                  <p className="text-sm text-gray-400">
                    {new Date(event.scheduled_time).toLocaleString()} - {event.recurrence}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleManualTrigger(event)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                  title="Trigger Now"
                >
                  Run
                </button>
                <button
                  onClick={() => handleToggleEvent(event)}
                  className={`px-3 py-1 rounded text-sm ${
                    event.enabled
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {event.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Add Scheduled Event</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Name
                </label>
                <input
                  type="text"
                  value={formData.eventName}
                  onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="Morning Wake-up"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Type
                </label>
                <select
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value as any, payload: {} })}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="play_track">Play Track</option>
                  <option value="trigger_mix">Trigger Mix</option>
                  <option value="trigger_sound">Trigger Sound</option>
                  <option value="change_preset">Change Preset</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payload
                </label>
                {renderPayloadInput()}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Scheduled Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Recurrence
                </label>
                <select
                  value={formData.recurrence}
                  onChange={(e) => setFormData({ ...formData, recurrence: e.target.value as any })}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="once">Once</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                disabled={!formData.eventName || !formData.scheduledTime}
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
