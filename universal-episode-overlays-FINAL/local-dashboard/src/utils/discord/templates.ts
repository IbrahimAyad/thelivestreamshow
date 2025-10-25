/**
 * Discord Notification Templates for Livestream Events
 */

import { WebhookEmbed, DISCORD_COLORS } from './types';

/**
 * Stream start notification
 */
export function createStreamStartEmbed(data: {
  title: string;
  description?: string;
  showName?: string;
  episodeInfo?: string;
  topic?: string;
  hashtag?: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
}): WebhookEmbed {
  const fields = [];

  if (data.showName) {
    fields.push({
      name: '📺 Show',
      value: data.showName,
      inline: true
    });
  }

  if (data.episodeInfo) {
    fields.push({
      name: '📝 Episode',
      value: data.episodeInfo,
      inline: true
    });
  }

  if (data.topic) {
    fields.push({
      name: '🎯 Topic',
      value: data.topic,
      inline: false
    });
  }

  if (data.hashtag) {
    fields.push({
      name: '🏷️ Hashtag',
      value: data.hashtag,
      inline: false
    });
  }

  return {
    title: `🔴 LIVE NOW: ${data.title}`,
    description: data.description || 'Join the stream now!',
    color: DISCORD_COLORS.RED,
    thumbnail: data.thumbnailUrl ? { url: data.thumbnailUrl } : undefined,
    image: data.bannerUrl ? { url: data.bannerUrl } : undefined,
    fields: fields.length > 0 ? fields : undefined,
    footer: {
      text: 'Stream Alert System'
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Stream end notification
 */
export function createStreamEndEmbed(data: {
  title: string;
  duration?: string;
  peakViewers?: number;
  highlights?: string[];
  nextStreamTime?: string;
}): WebhookEmbed {
  const fields = [];

  if (data.duration) {
    fields.push({
      name: '⏱️ Duration',
      value: data.duration,
      inline: true
    });
  }

  if (data.peakViewers) {
    fields.push({
      name: '👥 Peak Viewers',
      value: data.peakViewers.toString(),
      inline: true
    });
  }

  if (data.highlights && data.highlights.length > 0) {
    fields.push({
      name: '🎯 Highlights',
      value: data.highlights.join('\n'),
      inline: false
    });
  }

  return {
    title: '📴 Stream Ended - Thanks for Watching!',
    description: data.title,
    color: DISCORD_COLORS.BLUE,
    fields: fields.length > 0 ? fields : undefined,
    footer: data.nextStreamTime ? {
      text: `Next stream: ${data.nextStreamTime}`
    } : {
      text: 'See you next time!'
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Guest announcement
 */
export function createGuestAnnouncementEmbed(data: {
  name: string;
  bio?: string;
  role?: string;
  joinTime?: string;
  photoUrl?: string;
  topic?: string;
}): WebhookEmbed {
  const fields = [];

  if (data.role) {
    fields.push({
      name: '🎭 Role',
      value: data.role,
      inline: true
    });
  }

  if (data.joinTime) {
    fields.push({
      name: '⏰ Joining At',
      value: data.joinTime,
      inline: true
    });
  }

  if (data.topic) {
    fields.push({
      name: '💡 Topic',
      value: data.topic,
      inline: false
    });
  }

  return {
    title: `🎤 Welcome ${data.name}!`,
    description: data.bio || `Special guest ${data.name} is joining the stream!`,
    color: DISCORD_COLORS.PURPLE,
    thumbnail: data.photoUrl ? { url: data.photoUrl } : undefined,
    fields: fields.length > 0 ? fields : undefined,
    footer: {
      text: "Don't miss this special segment!"
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Topic update notification
 */
export function createTopicUpdateEmbed(data: {
  newTopic: string;
  previousTopic?: string;
  hashtags?: string[];
  duration?: string;
}): WebhookEmbed {
  const fields = [];

  if (data.previousTopic) {
    fields.push({
      name: 'Previous Topic',
      value: data.previousTopic,
      inline: false
    });
  }

  if (data.hashtags && data.hashtags.length > 0) {
    fields.push({
      name: '🏷️ Hashtags',
      value: data.hashtags.map(tag => `#${tag}`).join(' '),
      inline: false
    });
  }

  if (data.duration) {
    fields.push({
      name: '⏱️ Estimated Duration',
      value: data.duration,
      inline: true
    });
  }

  return {
    title: '📢 Topic Update',
    description: `**Now Discussing:** ${data.newTopic}`,
    color: DISCORD_COLORS.ORANGE,
    fields: fields.length > 0 ? fields : undefined,
    timestamp: new Date().toISOString()
  };
}

/**
 * Show schedule reminder
 */
export function createScheduleReminderEmbed(data: {
  title: string;
  timeUntil: string;
  dateTime: string;
  topics?: string[];
  specialFeatures?: string;
  thumbnailUrl?: string;
}): WebhookEmbed {
  const fields = [
    {
      name: '📅 Date & Time',
      value: data.dateTime,
      inline: false
    }
  ];

  if (data.topics && data.topics.length > 0) {
    fields.push({
      name: '📝 Topics Covered',
      value: data.topics.map(t => `• ${t}`).join('\n'),
      inline: false
    });
  }

  if (data.specialFeatures) {
    fields.push({
      name: '🎯 Special Features',
      value: data.specialFeatures,
      inline: false
    });
  }

  return {
    title: '🗓️ Stream Schedule Reminder',
    description: `**${data.title}** starts in ${data.timeUntil}!`,
    color: DISCORD_COLORS.GREEN,
    thumbnail: data.thumbnailUrl ? { url: data.thumbnailUrl } : undefined,
    fields,
    footer: {
      text: "Set a reminder so you don't miss it!"
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Generic notification
 */
export function createGenericNotification(data: {
  title: string;
  description: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  thumbnailUrl?: string;
}): WebhookEmbed {
  return {
    title: data.title,
    description: data.description,
    color: data.color || DISCORD_COLORS.BLURPLE,
    thumbnail: data.thumbnailUrl ? { url: data.thumbnailUrl } : undefined,
    fields: data.fields,
    timestamp: new Date().toISOString()
  };
}
