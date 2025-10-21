# Monitor Tab - API Credentials Setup Guide

## Overview

The Monitor tab requires API credentials for Twitch and YouTube to fetch real-time streaming statistics. This guide provides complete step-by-step instructions for obtaining and configuring these credentials.

## Required Credentials

1. **Twitch**: Client ID and OAuth Token
2. **YouTube**: Channel ID (API key already configured)

## Part 1: Twitch API Setup

### Step 1: Create a Twitch Application

1. **Navigate to Twitch Developer Console**
   - Go to: https://dev.twitch.tv/console
   - Log in with your Twitch account
   - Username: AbeNasty
   - Email: ibrahimayad13@gmail.com

2. **Register Your Application**
   - Click the "Register Your Application" button
   - Fill in the application details:

   | Field | Value |
   |-------|-------|
   | Name | Livestream Dashboard Monitor |
   | OAuth Redirect URLs | `https://localhost` |
   | Category | Broadcasting Suite |

   - Click "Create"

3. **Get Client ID**
   - Click "Manage" on your newly created application
   - Copy the **Client ID** (long string of characters)
   - Save this - you'll need it as `TWITCH_CLIENT_ID`

### Step 2: Generate Client Secret

1. In the application management page, click **"New Secret"**
2. Copy the generated **Client Secret** immediately (it won't be shown again)
3. Store it securely - you'll need it for generating the OAuth token

### Step 3: Generate OAuth Access Token

#### Method 1: Using OAuth Authorization URL (Recommended)

1. **Construct the Authorization URL**

   Replace `YOUR_CLIENT_ID` with your actual Client ID:

   ```
   https://id.twitch.tv/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=https://localhost&response_type=token&scope=channel:read:subscriptions+user:read:email
   ```

   **Required Scopes:**
   - `channel:read:subscriptions` - Read subscription data
   - `user:read:email` - Read user email (for identification)

2. **Visit the URL in Your Browser**
   - Paste the URL in your browser
   - You'll see a Twitch authorization page
   - Click **"Authorize"**

3. **Extract the Access Token**
   - You'll be redirected to: `https://localhost#access_token=...&scope=...&token_type=bearer`
   - Your browser will show a "connection refused" error - **this is expected**
   - Look at the URL in the address bar
   - Copy the value after `access_token=` and before `&scope`
   - This is your `TWITCH_OAUTH_TOKEN`

   **Example:**
   ```
   https://localhost#access_token=ABC123XYZ456&scope=channel:read:subscriptions+user:read:email&token_type=bearer
   ```
   Your token is: `ABC123XYZ456`

#### Method 2: Using Twitch CLI (Alternative)

1. **Install Twitch CLI**

   **macOS:**
   ```bash
   brew install twitchdev/twitch/twitch-cli
   ```

   **Windows (using Scoop):**
   ```bash
   scoop bucket add twitch https://github.com/twitchdev/scoop-bucket.git
   scoop install twitch-cli
   ```

   **Linux:**
   ```bash
   # Download from GitHub releases
   wget https://github.com/twitchdev/twitch-cli/releases/latest/download/twitch-cli_Linux_x86_64.tar.gz
   tar -xvf twitch-cli_Linux_x86_64.tar.gz
   sudo mv twitch /usr/local/bin/
   ```

2. **Configure the CLI**
   ```bash
   twitch configure
   ```
   - Enter your Client ID
   - Enter your Client Secret

3. **Generate Token**
   ```bash
   twitch token
   ```
   - This will open a browser window for authorization
   - After authorizing, the token will be displayed in the terminal
   - Copy the `User Access Token` value

#### Method 3: Using Postman (Advanced)

1. **Get Authorization Code**

   Visit in browser:
   ```
   https://id.twitch.tv/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=https://localhost&response_type=code&scope=channel:read:subscriptions+user:read:email
   ```

2. **Extract Code from Redirect**
   - After authorizing, you'll be redirected to `https://localhost?code=...&scope=...`
   - Copy the code value

3. **Exchange Code for Token**

   Use Postman or curl:
   ```bash
   curl -X POST 'https://id.twitch.tv/oauth2/token' \
     -H 'Content-Type: application/x-www-form-urlencoded' \
     -d 'client_id=YOUR_CLIENT_ID' \
     -d 'client_secret=YOUR_CLIENT_SECRET' \
     -d 'code=AUTHORIZATION_CODE' \
     -d 'grant_type=authorization_code' \
     -d 'redirect_uri=https://localhost'
   ```

   Response:
   ```json
   {
     "access_token": "your_token_here",
     "expires_in": 14523,
     "refresh_token": "refresh_token_here",
     "token_type": "bearer"
   }
   ```

   Save the `access_token` value.

### Step 4: Verify Twitch Credentials

Test your credentials using curl:

```bash
curl -X GET 'https://api.twitch.tv/helix/users?login=AbeNasty' \
  -H 'Authorization: Bearer YOUR_OAUTH_TOKEN' \
  -H 'Client-Id: YOUR_CLIENT_ID'
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": "user_id_here",
      "login": "abenasty",
      "display_name": "AbeNasty",
      "type": "",
      "broadcaster_type": "",
      "description": "...",
      "profile_image_url": "...",
      "offline_image_url": "...",
      "view_count": 0,
      "created_at": "..."
    }
  ]
}
```

If you receive a 401 error, your credentials are invalid.

### OAuth Token Maintenance

**Important Notes:**
- Twitch OAuth tokens expire after approximately 60 days
- You'll need to regenerate the token when it expires
- Consider implementing a refresh token flow for production use

**Signs Your Token Has Expired:**
- Monitor tab shows "Twitch API credentials not configured"
- Edge function logs show 401 Unauthorized errors
- Twitch stats display all zeros

**To Refresh:**
1. Repeat Step 3 to generate a new token
2. Update the `TWITCH_OAUTH_TOKEN` environment variable in Supabase
3. Wait 30 seconds for stats to refresh

## Part 2: YouTube API Setup

### Step 1: Verify API Key

The YouTube API key is already configured:
- **API Key**: `AIzaSyAx49jehLQgehTn7VKMvktzOMcuhqfOyTw`

This key has the YouTube Data API v3 enabled.

### Step 2: Find Your YouTube Channel ID

#### Method 1: YouTube Studio (Recommended)

1. **Go to YouTube Studio**
   - Navigate to: https://studio.youtube.com
   - Sign in with your YouTube account

2. **Access Settings**
   - Click **Settings** (gear icon in bottom left)
   - Click **Channel**
   - Click **Advanced settings**

3. **Copy Channel ID**
   - Your Channel ID is displayed at the top
   - Format: `UC...` (24 characters starting with UC)
   - Example: `UCXuqSBlHAE6Xw-yeJA0Tunw`

#### Method 2: From Your Channel URL

1. **Visit Your Channel**
   - Go to your YouTube channel
   - Look at the URL

2. **Extract Channel ID**
   - If URL is `https://www.youtube.com/channel/UC...`, the part after `/channel/` is your ID
   - If URL is `https://www.youtube.com/@YourCustomName`, use Method 1 instead

#### Method 3: Using YouTube API (Advanced)

If you know your channel username:

```bash
curl 'https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=YourUsername&key=AIzaSyAx49jehLQgehTn7VKMvktzOMcuhqfOyTw'
```

Or if you have a custom URL:

```bash
curl 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=YourChannelName&type=channel&key=AIzaSyAx49jehLQgehTn7VKMvktzOMcuhqfOyTw'
```

### Step 3: Verify YouTube Credentials

Test your channel ID:

```bash
curl 'https://www.googleapis.com/youtube/v3/channels?part=statistics&id=YOUR_CHANNEL_ID&key=AIzaSyAx49jehLQgehTn7VKMvktzOMcuhqfOyTw'
```

**Expected Response:**
```json
{
  "items": [
    {
      "kind": "youtube#channel",
      "etag": "...",
      "id": "YOUR_CHANNEL_ID",
      "statistics": {
        "viewCount": "12345",
        "subscriberCount": "67890",
        "hiddenSubscriberCount": false,
        "videoCount": "42"
      }
    }
  ]
}
```

## Part 3: Configure Supabase Environment Variables

### Step 1: Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: `vcniezwtltraqramjlux`

### Step 2: Navigate to Edge Functions Secrets

1. Click **Settings** in the left sidebar
2. Click **Edge Functions**
3. Scroll to the **Secrets** section

### Step 3: Add Environment Variables

Add each of the following secrets:

#### TWITCH_CLIENT_ID
- **Name**: `TWITCH_CLIENT_ID`
- **Value**: Your Twitch application Client ID from Part 1, Step 1
- Click **Add Secret**

#### TWITCH_OAUTH_TOKEN
- **Name**: `TWITCH_OAUTH_TOKEN`
- **Value**: Your OAuth access token from Part 1, Step 3
- Click **Add Secret**

#### TWITCH_USERNAME
- **Name**: `TWITCH_USERNAME`
- **Value**: `AbeNasty` (or your Twitch username)
- Click **Add Secret**
- **Note**: This is optional - defaults to 'AbeNasty' if not set

#### YOUTUBE_CHANNEL_ID
- **Name**: `YOUTUBE_CHANNEL_ID`
- **Value**: Your YouTube channel ID from Part 2, Step 2
- Click **Add Secret**

### Step 4: Verify Configuration

All secrets should now be listed in the Secrets section:

| Secret Name | Set |
|-------------|-----|
| TWITCH_CLIENT_ID | ✓ |
| TWITCH_OAUTH_TOKEN | ✓ |
| TWITCH_USERNAME | ✓ |
| YOUTUBE_API_KEY | ✓ (pre-configured) |
| YOUTUBE_CHANNEL_ID | ✓ |

**Note**: You cannot view secret values after they're set. To change a value, delete the secret and create it again.

## Part 4: Testing the Integration

### Test Edge Functions Directly

#### Test Twitch Stats Function

```bash
curl https://vcniezwtltraqramjlux.supabase.co/functions/v1/fetch-twitch-stats
```

**Expected Response (if configured correctly):**
```json
{
  "data": {
    "viewerCount": 0,
    "chatRate": 0,
    "followerCount": 123,
    "streamStatus": "offline",
    "platform": "twitch",
    "timestamp": "2025-10-21T12:31:16.000Z"
  }
}
```

**Error Response (if credentials missing):**
```json
{
  "error": "Twitch API credentials not configured",
  "configured": false,
  "data": {
    "viewerCount": 0,
    "chatRate": 0,
    "followerCount": 0,
    "streamStatus": "offline",
    "error": "API credentials missing"
  }
}
```

#### Test YouTube Stats Function

```bash
curl https://vcniezwtltraqramjlux.supabase.co/functions/v1/fetch-youtube-stats
```

**Expected Response:**
```json
{
  "data": {
    "viewerCount": 0,
    "chatRate": 0,
    "subscriberCount": 456,
    "streamStatus": "offline",
    "platform": "youtube",
    "timestamp": "2025-10-21T12:31:16.000Z"
  }
}
```

### Test in Monitor Tab

1. Navigate to: https://gy77m7pjul0f.space.minimax.io/video-player
2. Click the **Monitor** tab
3. Wait 5-10 seconds for stats to load
4. Verify:
   - Twitch stats show real follower count (not error message)
   - YouTube stats show real subscriber count (not error message)
   - Stats display "offline" if you're not currently streaming

## Troubleshooting

### Twitch Stats Show Error

**Problem**: "Twitch API credentials not configured" or all zeros

**Solutions**:
1. Verify `TWITCH_CLIENT_ID` is set correctly
2. Verify `TWITCH_OAUTH_TOKEN` is set correctly
3. Check if OAuth token has expired (regenerate if needed)
4. Test credentials using the curl command in Part 1, Step 4
5. Check Supabase edge function logs:
   - Supabase Dashboard → Edge Functions → fetch-twitch-stats → Logs

### YouTube Stats Show Error

**Problem**: "YouTube channel ID not configured" or all zeros

**Solutions**:
1. Verify `YOUTUBE_CHANNEL_ID` is set correctly
2. Ensure Channel ID starts with "UC" and is 24 characters
3. Verify YouTube API key is working (already configured)
4. Test using curl command in Part 2, Step 3

### Stats Show Offline When Streaming

**Twitch:**
- Ensure you're actually live on Twitch
- Twitch API updates can take 1-2 minutes
- Check your stream dashboard to confirm live status

**YouTube:**
- Ensure you've started a live broadcast (not just scheduled)
- YouTube live status can take 2-3 minutes to update
- Verify broadcast is set to "Public" or "Unlisted"

### 401 Unauthorized Errors

**Problem**: Edge function logs show 401 errors

**Solutions**:
1. **Twitch**: Regenerate OAuth token (likely expired)
2. **YouTube**: Verify API key hasn't been revoked
3. Check API quotas haven't been exceeded

## Security Best Practices

1. **Never Commit Credentials to Git**
   - Keep all API keys and tokens in Supabase secrets only
   - Add `.env` to `.gitignore`

2. **Rotate Credentials Periodically**
   - Regenerate Twitch OAuth token every 30-60 days
   - Monitor for any unauthorized API usage

3. **Restrict API Permissions**
   - Only use required OAuth scopes
   - Enable IP restrictions if possible

4. **Monitor API Usage**
   - Check Twitch Developer Console for unusual activity
   - Monitor YouTube API quota usage

## API Rate Limits

### Twitch
- **Rate Limit**: 800 requests per minute (per Client ID)
- **Monitor Tab Usage**: ~2 requests every 30 seconds = 4 requests/minute
- **Well Within Limits**: ✓

### YouTube
- **Daily Quota**: 10,000 units per day
- **Cost Per Request**:
  - Channel statistics: 1 unit
  - Live broadcasts list: 1 unit
  - Video details: 1 unit
- **Monitor Tab Usage**: ~3 units every 30 seconds = 360 units/hour = ~8,640 units/day
- **Quota Status**: Within limits if used 24/7, but close to limit

**Recommendation**: Consider increasing refresh interval to 60 seconds if quota becomes an issue.

## Additional Resources

- **Twitch API Documentation**: https://dev.twitch.tv/docs/api/
- **Twitch Authentication Guide**: https://dev.twitch.tv/docs/authentication/
- **YouTube Data API**: https://developers.google.com/youtube/v3
- **YouTube Live Streaming API**: https://developers.google.com/youtube/v3/live/
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
