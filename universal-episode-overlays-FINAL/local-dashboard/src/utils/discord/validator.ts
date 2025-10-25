/**
 * Discord Webhook Payload Validation
 */

import { WebhookPayload, ValidationError } from './types';

export function validateWebhookPayload(payload: WebhookPayload): ValidationError[] {
  const errors: ValidationError[] = [];

  // Must have content or embeds
  if (!payload.content && !payload.embeds?.length) {
    errors.push({
      field: 'payload',
      message: 'Must contain either content or embeds'
    });
  }

  // Content length check
  if (payload.content && payload.content.length > 2000) {
    errors.push({
      field: 'content',
      message: `Content exceeds 2000 characters (${payload.content.length})`
    });
  }

  // Embeds validation
  if (payload.embeds) {
    if (payload.embeds.length > 10) {
      errors.push({
        field: 'embeds',
        message: `Too many embeds: ${payload.embeds.length} (max 10)`
      });
    }

    payload.embeds.forEach((embed, index) => {
      // Title length
      if (embed.title && embed.title.length > 256) {
        errors.push({
          field: `embeds[${index}].title`,
          message: `Title exceeds 256 characters (${embed.title.length})`
        });
      }

      // Description length
      if (embed.description && embed.description.length > 2048) {
        errors.push({
          field: `embeds[${index}].description`,
          message: `Description exceeds 2048 characters (${embed.description.length})`
        });
      }

      // Fields validation
      if (embed.fields) {
        if (embed.fields.length > 25) {
          errors.push({
            field: `embeds[${index}].fields`,
            message: `Too many fields: ${embed.fields.length} (max 25)`
          });
        }

        embed.fields.forEach((field, fieldIndex) => {
          if (field.name.length > 256) {
            errors.push({
              field: `embeds[${index}].fields[${fieldIndex}].name`,
              message: `Field name exceeds 256 characters`
            });
          }
          if (field.value.length > 1024) {
            errors.push({
              field: `embeds[${index}].fields[${fieldIndex}].value`,
              message: `Field value exceeds 1024 characters`
            });
          }
        });
      }

      // Footer text length
      if (embed.footer?.text && embed.footer.text.length > 2048) {
        errors.push({
          field: `embeds[${index}].footer.text`,
          message: `Footer text exceeds 2048 characters`
        });
      }

      // Author name length
      if (embed.author?.name && embed.author.name.length > 256) {
        errors.push({
          field: `embeds[${index}].author.name`,
          message: `Author name exceeds 256 characters`
        });
      }

      // Total character count
      const totalChars = 
        (embed.title?.length || 0) +
        (embed.description?.length || 0) +
        (embed.footer?.text.length || 0) +
        (embed.author?.name.length || 0) +
        (embed.fields?.reduce((sum, f) => sum + f.name.length + f.value.length, 0) || 0);

      if (totalChars > 6000) {
        errors.push({
          field: `embeds[${index}]`,
          message: `Total characters exceed 6000 (${totalChars})`
        });
      }
    });
  }

  return errors;
}
