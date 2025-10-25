import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { DiscordWebhookClient } from '../utils/discord/client';
import { NotificationLog } from '../utils/discord/types';
import * as templates from '../utils/discord/templates';

interface DiscordSettings {
  webhook_url: string | null;
  enabled: boolean;
  notify_stream_start: boolean;
  notify_stream_end: boolean;
  notify_guest: boolean;
  notify_topic_change: boolean;
  notify_schedule: boolean;
}

interface DiscordContextType {
  settings: DiscordSettings;
  updateSettings: (newSettings: Partial<DiscordSettings>) => Promise<void>;
  testConnection: () => Promise<boolean>;
  sendStreamStart: (data: any) => Promise<void>;
  sendStreamEnd: (data: any) => Promise<void>;
  sendGuestAnnouncement: (data: any) => Promise<void>;
  sendTopicUpdate: (data: any) => Promise<void>;
  sendScheduleReminder: (data: any) => Promise<void>;
  notificationLogs: NotificationLog[];
  isEnabled: boolean;
}

const DEFAULT_SETTINGS: DiscordSettings = {
  webhook_url: null,
  enabled: false,
  notify_stream_start: true,
  notify_stream_end: true,
  notify_guest: true,
  notify_topic_change: true,
  notify_schedule: true,
};

const DiscordContext = createContext<DiscordContextType | undefined>(undefined);

export function DiscordProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<DiscordSettings>(DEFAULT_SETTINGS);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [client, setClient] = useState<DiscordWebhookClient | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Update client when webhook URL changes
  useEffect(() => {
    if (settings.webhook_url) {
      setClient(new DiscordWebhookClient(
        settings.webhook_url,
        'Livestream Bot'
      ));
    } else {
      setClient(null);
    }
  }, [settings.webhook_url]);

  const loadSettings = async () => {
    try {
      // Try to load from Supabase
      const { data } = await supabase
        .from('discord_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (data) {
        setSettings(data as DiscordSettings);
      } else {
        // Try localStorage as fallback
        const stored = localStorage.getItem('discordSettings');
        if (stored) {
          setSettings(JSON.parse(stored));
        }
      }
    } catch (error) {
      // Fallback to localStorage if Supabase fails
      const stored = localStorage.getItem('discordSettings');
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    }
  };

  const updateSettings = async (newSettings: Partial<DiscordSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    // Save to localStorage
    localStorage.setItem('discordSettings', JSON.stringify(updated));

    // Try to save to Supabase
    try {
      const { data: existing } = await supabase
        .from('discord_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('discord_settings')
          .update(updated)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('discord_settings')
          .insert([updated]);
      }
    } catch (error) {
      console.warn('Failed to save to Supabase, using localStorage only:', error);
    }
  };

  const addLog = (log: Omit<NotificationLog, 'id' | 'timestamp'>) => {
    const newLog: NotificationLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    setNotificationLogs(prev => [newLog, ...prev].slice(0, 10)); // Keep last 10
  };

  const sendNotification = async (
    type: string,
    embedCreator: () => any,
    content?: string
  ): Promise<void> => {
    if (!client || !settings.enabled) {
      return;
    }

    const logMessage = `${type} notification`;
    addLog({ type, status: 'sending', message: logMessage });

    try {
      const embed = embedCreator();
      await client.sendEmbed(embed, content);
      
      addLog({ type, status: 'sent', message: logMessage });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog({ 
        type, 
        status: 'failed', 
        message: logMessage,
        error: errorMessage
      });
      console.error(`Discord notification failed (${type}):`, error);
    }
  };

  const testConnection = async (): Promise<boolean> => {
    if (!client) return false;
    
    addLog({ type: 'test', status: 'sending', message: 'Testing connection' });
    
    try {
      const success = await client.test();
      addLog({ 
        type: 'test', 
        status: success ? 'sent' : 'failed', 
        message: 'Connection test',
        error: success ? undefined : 'Test failed'
      });
      return success;
    } catch (error) {
      addLog({ 
        type: 'test', 
        status: 'failed', 
        message: 'Connection test',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  };

  const sendStreamStart = async (data: any) => {
    if (!settings.notify_stream_start) return;
    await sendNotification(
      'stream_start',
      () => templates.createStreamStartEmbed(data),
      '🔴 **Stream is LIVE!**'
    );
  };

  const sendStreamEnd = async (data: any) => {
    if (!settings.notify_stream_end) return;
    await sendNotification(
      'stream_end',
      () => templates.createStreamEndEmbed(data)
    );
  };

  const sendGuestAnnouncement = async (data: any) => {
    if (!settings.notify_guest) return;
    await sendNotification(
      'guest',
      () => templates.createGuestAnnouncementEmbed(data),
      '🎤 **Special Guest Alert!**'
    );
  };

  const sendTopicUpdate = async (data: any) => {
    if (!settings.notify_topic_change) return;
    await sendNotification(
      'topic_update',
      () => templates.createTopicUpdateEmbed(data)
    );
  };

  const sendScheduleReminder = async (data: any) => {
    if (!settings.notify_schedule) return;
    await sendNotification(
      'schedule',
      () => templates.createScheduleReminderEmbed(data)
    );
  };

  return (
    <DiscordContext.Provider value={{
      settings,
      updateSettings,
      testConnection,
      sendStreamStart,
      sendStreamEnd,
      sendGuestAnnouncement,
      sendTopicUpdate,
      sendScheduleReminder,
      notificationLogs,
      isEnabled: settings.enabled && !!settings.webhook_url
    }}>
      {children}
    </DiscordContext.Provider>
  );
}

export function useDiscord() {
  const context = useContext(DiscordContext);
  if (context === undefined) {
    throw new Error('useDiscord must be used within a DiscordProvider');
  }
  return context;
}
