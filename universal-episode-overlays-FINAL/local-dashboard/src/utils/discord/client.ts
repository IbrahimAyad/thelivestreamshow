/**
 * Discord Webhook Client with Rate Limiting and Error Handling
 */

import { WebhookPayload, WebhookResponse, WebhookEmbed } from './types';
import { validateWebhookPayload } from './validator';

export class WebhookError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'WebhookError';
  }
}

export class RateLimitError extends WebhookError {
  constructor(
    message: string,
    public retryAfter: number,
    public resetTime: number
  ) {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  shouldRetry: (error: any) => boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 32000,
  shouldRetry: (error) => {
    if (error instanceof RateLimitError) return true;
    if (error instanceof WebhookError) {
      return error.statusCode! >= 500;
    }
    return false;
  }
};

export class DiscordWebhookClient {
  private webhookUrl: string;
  private defaultUsername?: string;
  private defaultAvatarUrl?: string;
  private requestsInCurrentWindow = 0;
  private windowResetTime = Date.now() + 2000;
  private readonly MAX_REQUESTS_PER_WINDOW = 5;

  constructor(webhookUrl: string, defaultUsername?: string, defaultAvatarUrl?: string) {
    this.webhookUrl = webhookUrl;
    this.defaultUsername = defaultUsername;
    this.defaultAvatarUrl = defaultAvatarUrl;
  }

  /**
   * Update webhook URL
   */
  setWebhookUrl(url: string) {
    this.webhookUrl = url;
  }

  /**
   * Send a message to the Discord webhook with automatic retry
   */
  async send(payload: WebhookPayload): Promise<WebhookResponse> {
    // Validate payload
    const errors = validateWebhookPayload(payload);
    if (errors.length > 0) {
      throw new WebhookError(
        `Validation failed: ${errors.map(e => `${e.field}: ${e.message}`).join(', ')}`,
        400
      );
    }

    // Apply defaults
    const finalPayload: WebhookPayload = {
      ...payload,
      username: payload.username || this.defaultUsername,
      avatar_url: payload.avatar_url || this.defaultAvatarUrl
    };

    return this.sendWithRetry(finalPayload);
  }

  /**
   * Send with retry logic and rate limiting
   */
  private async sendWithRetry(
    payload: WebhookPayload,
    config: Partial<RetryConfig> = {}
  ): Promise<WebhookResponse> {
    const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: Error;

    for (let attempt = 0; attempt < finalConfig.maxAttempts; attempt++) {
      try {
        // Rate limiting check
        await this.checkRateLimit();

        const response = await fetch(this.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        // Extract rate limit info
        const rateLimitRemaining = parseInt(
          response.headers.get('X-RateLimit-Remaining') || '0'
        );
        const rateLimitReset = parseInt(
          response.headers.get('X-RateLimit-Reset') || '0'
        );
        const retryAfter = parseFloat(
          response.headers.get('X-RateLimit-Reset-After') || '0'
        );

        // Update rate limit tracking
        this.requestsInCurrentWindow++;

        // Handle errors
        if (response.status === 429) {
          throw new RateLimitError(
            'Rate limit exceeded',
            retryAfter,
            rateLimitReset
          );
        }

        if (response.status === 400) {
          const errorBody = await response.json().catch(() => ({}));
          throw new WebhookError(
            `Invalid payload: ${JSON.stringify(errorBody)}`,
            400,
            errorBody
          );
        }

        if (response.status === 404) {
          throw new WebhookError(
            'Webhook not found. It may have been deleted.',
            404
          );
        }

        if (response.status >= 500) {
          throw new WebhookError(
            `Discord server error: ${response.status} ${response.statusText}`,
            response.status
          );
        }

        if (!response.ok) {
          const errorBody = await response.text();
          throw new WebhookError(
            `Webhook failed: ${response.status} ${response.statusText} - ${errorBody}`,
            response.status
          );
        }

        return {
          ok: true,
          status: response.status,
          statusText: response.statusText,
          rateLimitRemaining,
          rateLimitReset
        };

      } catch (error) {
        lastError = error as Error;

        // Check if we should retry
        if (!finalConfig.shouldRetry(error)) {
          throw error;
        }

        // Don't wait after the last attempt
        if (attempt === finalConfig.maxAttempts - 1) {
          break;
        }

        // Calculate delay
        let delay: number;
        if (error instanceof RateLimitError) {
          delay = error.retryAfter * 1000;
        } else {
          delay = Math.min(
            this.calculateRetryDelay(attempt, finalConfig.baseDelay),
            finalConfig.maxDelay
          );
        }

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Check rate limit and wait if necessary
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();

    // Reset window if expired
    if (now >= this.windowResetTime) {
      this.requestsInCurrentWindow = 0;
      this.windowResetTime = now + 2000;
    }

    // Wait if at limit
    if (this.requestsInCurrentWindow >= this.MAX_REQUESTS_PER_WINDOW) {
      const waitTime = this.windowResetTime - now;
      await this.sleep(waitTime);
      this.requestsInCurrentWindow = 0;
      this.windowResetTime = Date.now() + 2000;
    }
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(attemptNumber: number, baseDelay: number = 1000): number {
    const exponentialDelay = baseDelay * Math.pow(2, attemptNumber);
    const jitter = Math.random() * 0.3 * exponentialDelay;
    return Math.floor(exponentialDelay + jitter);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Send a simple text message
   */
  async sendMessage(content: string, username?: string): Promise<WebhookResponse> {
    return this.send({ content, username });
  }

  /**
   * Send an embed message
   */
  async sendEmbed(embed: WebhookEmbed, content?: string): Promise<WebhookResponse> {
    return this.send({
      content,
      embeds: [embed]
    });
  }

  /**
   * Send multiple embeds
   */
  async sendEmbeds(embeds: WebhookEmbed[], content?: string): Promise<WebhookResponse> {
    if (embeds.length > 10) {
      throw new Error('Maximum 10 embeds allowed per message');
    }
    return this.send({ content, embeds });
  }

  /**
   * Test webhook connection
   */
  async test(): Promise<boolean> {
    try {
      await this.sendEmbed({
        title: '✅ Webhook Connection Test',
        description: 'Discord webhook is configured correctly!',
        color: 3066993, // Green
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Webhook test failed:', error);
      return false;
    }
  }
}
