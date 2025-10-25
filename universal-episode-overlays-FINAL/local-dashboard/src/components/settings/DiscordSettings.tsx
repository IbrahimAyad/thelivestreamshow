import { useState } from 'react';
import { useDiscord } from '../../contexts/DiscordContext';
import toast from 'react-hot-toast';
import { Bell, BellOff, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export function DiscordSettings() {
  const { 
    settings, 
    updateSettings, 
    testConnection, 
    notificationLogs,
    isEnabled 
  } = useDiscord();
  
  const [webhookUrl, setWebhookUrl] = useState(settings.webhook_url || '');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveWebhookUrl = async () => {
    if (!webhookUrl.trim()) {
      toast.error('Please enter a webhook URL');
      return;
    }

    if (!webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      toast.error('Invalid Discord webhook URL');
      return;
    }

    setSaving(true);
    try {
      await updateSettings({ webhook_url: webhookUrl });
      toast.success('Webhook URL saved');
    } catch (error) {
      toast.error('Failed to save webhook URL');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings.webhook_url) {
      toast.error('Please save a webhook URL first');
      return;
    }

    setTesting(true);
    try {
      const success = await testConnection();
      if (success) {
        toast.success('✅ Discord webhook is working!');
      } else {
        toast.error('❌ Webhook test failed');
      }
    } catch (error) {
      toast.error('Test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setTesting(false);
    }
  };

  const handleToggleEnabled = async () => {
    await updateSettings({ enabled: !settings.enabled });
    toast.success(settings.enabled ? 'Discord notifications disabled' : 'Discord notifications enabled');
  };

  const handleToggleNotification = async (key: keyof typeof settings) => {
    await updateSettings({ [key]: !settings[key] });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'sending':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-purple-500" />
            Discord Notifications
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Send real-time stream alerts to your Discord channel
          </p>
        </div>
        
        <button
          onClick={handleToggleEnabled}
          className={`px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors ${
            settings.enabled
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          {settings.enabled ? (
            <>
              <Bell className="w-4 h-4" />
              Enabled
            </>
          ) : (
            <>
              <BellOff className="w-4 h-4" />
              Disabled
            </>
          )}
        </button>
      </div>

      {/* Webhook URL Configuration */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">
          Discord Webhook URL
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            className="flex-1 bg-[#1a1a1a] border border-[#3a3a3a] rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleSaveWebhookUrl}
            disabled={saving}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleTestConnection}
            disabled={testing || !settings.webhook_url}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold disabled:opacity-50"
          >
            {testing ? 'Testing...' : 'Test'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          <a 
            href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-purple-400 hover:underline"
          >
            How to create a Discord webhook
          </a>
        </p>
      </div>

      {/* Status Indicator */}
      {isEnabled && (
        <div className="mb-6 p-3 bg-green-900/30 border border-green-700 rounded flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-green-400 font-semibold">Discord notifications are active</span>
        </div>
      )}

      {/* Notification Type Toggles */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Notification Types</h3>
        <div className="space-y-2">
          <label className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded border border-[#3a3a3a] cursor-pointer hover:border-purple-500/50">
            <div>
              <div className="font-medium">🔴 Stream Start</div>
              <div className="text-sm text-gray-400">Notify when stream goes live</div>
            </div>
            <input
              type="checkbox"
              checked={settings.notify_stream_start}
              onChange={() => handleToggleNotification('notify_stream_start')}
              className="w-5 h-5 accent-purple-600"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded border border-[#3a3a3a] cursor-pointer hover:border-purple-500/50">
            <div>
              <div className="font-medium">📴 Stream End</div>
              <div className="text-sm text-gray-400">Notify when stream ends</div>
            </div>
            <input
              type="checkbox"
              checked={settings.notify_stream_end}
              onChange={() => handleToggleNotification('notify_stream_end')}
              className="w-5 h-5 accent-purple-600"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded border border-[#3a3a3a] cursor-pointer hover:border-purple-500/50">
            <div>
              <div className="font-medium">🎤 Guest Announcements</div>
              <div className="text-sm text-gray-400">Notify when guests join</div>
            </div>
            <input
              type="checkbox"
              checked={settings.notify_guest}
              onChange={() => handleToggleNotification('notify_guest')}
              className="w-5 h-5 accent-purple-600"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded border border-[#3a3a3a] cursor-pointer hover:border-purple-500/50">
            <div>
              <div className="font-medium">📢 Topic Changes</div>
              <div className="text-sm text-gray-400">Notify on topic/hashtag updates</div>
            </div>
            <input
              type="checkbox"
              checked={settings.notify_topic_change}
              onChange={() => handleToggleNotification('notify_topic_change')}
              className="w-5 h-5 accent-purple-600"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded border border-[#3a3a3a] cursor-pointer hover:border-purple-500/50">
            <div>
              <div className="font-medium">🗓️ Schedule Reminders</div>
              <div className="text-sm text-gray-400">Notify about upcoming streams</div>
            </div>
            <input
              type="checkbox"
              checked={settings.notify_schedule}
              onChange={() => handleToggleNotification('notify_schedule')}
              className="w-5 h-5 accent-purple-600"
            />
          </label>
        </div>
      </div>

      {/* Notification Log */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Recent Notifications</h3>
        {notificationLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No notifications sent yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notificationLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-[#1a1a1a] rounded border border-[#3a3a3a] flex items-start gap-3"
              >
                {getStatusIcon(log.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{log.message}</span>
                    <span className="text-xs text-gray-500">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  {log.error && (
                    <div className="text-sm text-red-400 mt-1">{log.error}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
