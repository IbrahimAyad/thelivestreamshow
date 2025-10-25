/**
 * Discord Webhook Type Definitions
 */

export interface WebhookAuthor {
  name: string;
  url?: string;
  icon_url?: string;
}

export interface WebhookField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface WebhookImage {
  url: string;
}

export interface WebhookFooter {
  text: string;
  icon_url?: string;
}

export interface WebhookEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  author?: WebhookAuthor;
  thumbnail?: WebhookImage;
  image?: WebhookImage;
  fields?: WebhookField[];
  footer?: WebhookFooter;
  timestamp?: string;
}

export interface AllowedMentions {
  parse?: ('everyone' | 'users' | 'roles')[];
  users?: string[];
  roles?: string[];
}

export interface WebhookPayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  tts?: boolean;
  embeds?: WebhookEmbed[];
  allowed_mentions?: AllowedMentions;
}

export interface WebhookResponse {
  ok: boolean;
  status: number;
  statusText: string;
  rateLimitRemaining?: number;
  rateLimitReset?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface NotificationLog {
  id: string;
  type: string;
  status: 'sent' | 'failed' | 'sending';
  message: string;
  timestamp: Date;
  error?: string;
}

// Discord color constants
export const DISCORD_COLORS = {
  RED: 15158332,      // #E74C3C - Stream live, urgent alerts
  GREEN: 3066993,     // #2ECC71 - Success, go-live
  BLUE: 3447003,      // #3498DB - Information, schedule
  ORANGE: 15105570,   // #E67E22 - Warnings, reminders
  PURPLE: 10181046,   // #9B59B6 - Special events, guests
  GOLD: 15844367,     // #F1C40F - Highlights, achievements
  BLURPLE: 5793266,   // #5865F2 - Discord brand color
  DARK_RED: 10038562, // #992D22 - Stream ended, errors
};
