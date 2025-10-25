# Backend Integration Guide

## Overview
This guide covers the backend integration of the unified overlay system with your existing BetaBot application.

## Database Schema

### Tables Created
The system creates 4 main tables in Supabase:

1. **overlays** - Stores overlay metadata and configurations
2. **overlay_content** - Stores dynamic text content for overlays
3. **chat_messages** - Stores customizable chat notifications
4. **overlay_widgets** - Stores additional widget configurations (future use)

### Table Structures

```sql
-- Overlays table
CREATE TABLE overlays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Overlay content table
CREATE TABLE overlay_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    overlay_id UUID NOT NULL,
    field_name VARCHAR(255) NOT NULL,
    field_value TEXT,
    field_type VARCHAR(50) DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    overlay_id UUID NOT NULL,
    message_type VARCHAR(100) NOT NULL,
    message_text TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    animation_type VARCHAR(100) DEFAULT 'slideInRight',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Overlay widgets table
CREATE TABLE overlay_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    overlay_id UUID NOT NULL,
    widget_type VARCHAR(100) NOT NULL,
    config JSONB DEFAULT '{}',
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### Edge Functions Deployed
Three edge functions have been deployed to your Supabase project:

1. **get-overlays** - Fetches all overlays with content and chat messages
2. **update-overlay** - Updates overlay content and chat messages
3. **create-overlay-template** - Creates new overlay templates

### API Usage

#### Get All Overlays
```typescript
const { data, error } = await supabase.functions.invoke('get-overlays');
```

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Main Stream Overlay",
      "type": "main_stream",
      "description": "Primary streaming overlay",
      "content": {
        "season": "Season 4",
        "episode": "Episode 31",
        "show_name": "THE LIVE STREAM SHOW",
        "episode_title": "Purposeful Illusion",
        "social_handle": "@abelivestream"
      },
      "chatMessages": [
        {
          "message_type": "follower",
          "message_text": "Rattlesnake just followed!",
          "display_order": 0,
          "is_active": true,
          "animation_type": "slideInRight"
        }
      ]
    }
  ]
}
```

#### Update Overlay Content
```typescript
const { error } = await supabase.functions.invoke('update-overlay', {
  body: {
    overlayId: "overlay-uuid",
    content: {
      "season": "Season 5",
      "episode": "Episode 1",
      "episode_title": "New Beginning"
    },
    chatMessages: [
      {
        "message_type": "chat",
        "message_text": "Welcome to Season 5!",
        "display_order": 0,
        "is_active": true,
        "animation_type": "slideInRight"
      }
    ]
  }
});
```

#### Create New Overlay Template
```typescript
const { error } = await supabase.functions.invoke('create-overlay-template', {
  body: {
    name: "Starting Soon",
    type: "starting_soon",
    description: "Overlay for pre-stream countdown"
  }
});
```

## Environment Configuration

### Required Environment Variables
Ensure these are set in your Supabase project:

```bash
SUPABASE_URL=https://vcniezwtltraqramjlux.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

### Frontend Configuration
Update your frontend configuration:

```typescript
// In your supabase client setup
const supabaseUrl = 'https://vcniezwtltraqramjlux.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ1MTgsImV4cCI6MjA3NTkwMDUxOH0.5PDpv3-DVZzjOVFLdsWibzOk5A3-4PI1OthU1EQNhTQ';
```

## Integration with Existing Code

### Update Existing Supabase Client
Ensure your existing Supabase client includes the new functions:

```typescript
// Add this to your existing supabase.ts or similar file
export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!,
  {
    functions: {
      getOverlays: 'get-overlays',
      updateOverlay: 'update-overlay', 
      createOverlayTemplate: 'create-overlay-template'
    }
  }
);
```

### Database Permissions
The edge functions use the service role key to access the database. Ensure Row Level Security (RLS) policies allow anonymous access for read operations if needed:

```sql
-- Example RLS policy for overlays table
CREATE POLICY "Allow anonymous read access" ON overlays
  FOR SELECT USING (is_active = true);

-- Example RLS policy for overlay_content
CREATE POLICY "Allow anonymous read access" ON overlay_content
  FOR SELECT USING (true);
```

## Data Migration

### Creating Default Overlays
Run this SQL to create initial overlay templates:

```sql
-- Insert main stream overlay
INSERT INTO overlays (name, type, description) VALUES
('Main Stream', 'main_stream', 'Primary streaming overlay with full features');

-- Insert starting soon overlay  
INSERT INTO overlays (name, type, description) VALUES
('Starting Soon', 'starting_soon', 'Pre-stream countdown overlay');

-- Insert BRB overlay
INSERT INTO overlays (name, type, description) VALUES
('Be Right Back', 'brb', 'Temporary break overlay');
```

## Error Handling

### Common Error Responses
```json
{
  "error": {
    "code": "OVERLAY_FETCH_ERROR",
    "message": "Service role key not found"
  }
}
```

### Debugging Tips
1. Check function logs in Supabase dashboard
2. Verify environment variables are set
3. Ensure proper CORS headers for frontend calls
4. Test edge functions individually before integration

## Monitoring

### Function Logs
Monitor edge function execution:
- Go to Supabase Dashboard → Edge Functions → Select function → Logs
- Check for runtime errors and performance metrics

### Database Monitoring
Monitor table usage:
- Check row counts and growth patterns
- Monitor query performance
- Set up alerts for unusual activity

## Security Considerations

### API Keys
- Keep service role keys secure (server-side only)
- Use anonymous keys for frontend client operations
- Rotate keys periodically

### Data Validation
- Validate all input data before database operations
- Sanitize text content to prevent XSS
- Use parameterized queries (handled by Supabase)

### Access Control
- Implement proper RLS policies for sensitive data
- Restrict write operations to authenticated users
- Monitor for unauthorized access attempts

## Performance Optimization

### Caching Strategy
- Cache overlay data on frontend for better performance
- Implement client-side debouncing for frequent updates
- Use connection pooling for database operations

### Indexing
Ensure proper database indexes:
```sql
-- Add indexes for better query performance
CREATE INDEX idx_overlay_content_overlay_id ON overlay_content(overlay_id);
CREATE INDEX idx_chat_messages_overlay_id ON chat_messages(overlay_id);
CREATE INDEX idx_overlay_widgets_overlay_id ON overlay_widgets(overlay_id);
```

## Next Steps
1. Test all edge functions with sample data
2. Integrate with existing frontend components
3. Implement real-time subscriptions if needed
4. Set up monitoring and alerting
5. Plan for scaling and backup strategies
