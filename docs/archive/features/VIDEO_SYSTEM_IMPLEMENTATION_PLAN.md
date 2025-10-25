# Video System Implementation Plan - YouTube + Reddit Integration

## Project Context
Building a "Jamie pull that up" feature for BetaBot that allows smart video discovery and playback during live streams. Uses YouTube Data API v3 and Reddit API (both FREE).

## Current State (Working)
✅ Perplexity AI integration for text-based research
✅ Side-by-side overlay (60% right panel, 40% camera)
✅ Wake phrase detection ("Hey BetaBot")
✅ Visual search command detection
✅ 60-second display timer
✅ Read Aloud and Summarize buttons

## What We're Adding
YouTube + Reddit video discovery with smart search, queue management, and embedded playback.

---

## Smart Search Features

### **Channel Recognition**
Detect popular channel names in queries:
```
"Show me latest Joe Rogan videos" → Search: "JRE Clips" OR "PowerfulJRE" channel
"Show me MrBeast videos" → Search: "MrBeast" channel
"Show me MKBHD tech reviews" → Search: "Marques Brownlee" channel
```

**Implementation:**
- Maintain dictionary of common channel names → channel IDs
- Use YouTube API `search` with `channelId` filter
- Sort by `date` for "latest"

### **Content Type Detection**
```
"Show me shorts about..." → videoDuration: short
"Show me videos about..." → Regular videos
"Show me clips of..." → Short videos preferred
```

### **Trending/Discovery**
```
"What's trending?" → YouTube `/videos?chart=mostPopular`
"What's viral on Reddit?" → Reddit API top posts from video subreddits
"Show me funny videos" → YouTube search + Reddit r/funny
```

### **Smart Sorting**
```
"Latest [channel]" → sort by date
"Most popular [topic]" → sort by viewCount
"Trending [topic]" → sort by relevance + recent
```

---

## API Integration Details

### **YouTube Data API v3**

**Endpoints to Use:**
1. `/search` - Search videos, channels, shorts
2. `/videos` - Get video details, trending
3. `/channels` - Get channel info

**Key Parameters:**
```javascript
// Regular video search
{
  part: 'snippet',
  q: 'search query',
  type: 'video',
  maxResults: 12,
  order: 'relevance' | 'date' | 'viewCount',
  videoDuration: 'any' | 'short' | 'medium' | 'long'
}

// Channel videos
{
  part: 'snippet',
  channelId: 'UC...',
  type: 'video',
  order: 'date',
  maxResults: 12
}

// Trending
{
  part: 'snippet,statistics',
  chart: 'mostPopular',
  regionCode: 'US',
  maxResults: 12,
  videoCategoryId: '...' // optional
}
```

**Quota Usage:**
- Each search: ~100 units
- Daily limit: 10,000 units = ~100 searches/day
- More than enough for streams

### **Reddit API**

**Subreddits for Videos:**
- r/videos (general)
- r/PublicFreakout (viral reactions)
- r/NextFuckingLevel (impressive)
- r/Unexpected (surprising)
- r/funny (comedy)
- r/gaming (game clips)

**Endpoints:**
```javascript
// Top posts from subreddit
GET /r/{subreddit}/top.json?t=day&limit=25

// Filter for video posts
- Check: post.is_video === true
- Or: post.domain includes 'youtube.com', 'youtu.be', 'v.redd.it'
```

**Authentication:**
```javascript
// OAuth 2.0 (simple)
const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
POST https://www.reddit.com/api/v1/access_token
Headers: {
  Authorization: `Basic ${auth}`,
  Content-Type: 'application/x-www-form-urlencoded'
}
Body: grant_type=client_credentials
```

---

## Component Architecture

### **File Structure**
```
src/
├── hooks/
│   ├── useYouTubeAPI.ts          # YouTube Data API integration
│   ├── useRedditAPI.ts           # Reddit API integration
│   └── useVideoQueue.ts          # Queue management logic
├── components/
│   ├── VideoPlayer.tsx           # Embedded YouTube player
│   ├── VideoGrid.tsx             # Thumbnail grid display
│   ├── VideoQueue.tsx            # Queue sidebar
│   └── MediaBrowserOverlay.tsx   # Updated with video mode
└── lib/
    └── videoChannels.ts          # Channel name → ID mapping
```

### **useYouTubeAPI.ts Interface**
```typescript
interface YouTubeVideo {
  id: string
  title: string
  channelTitle: string
  thumbnail: string
  duration: string
  viewCount: string
  publishedAt: string
  description: string
}

interface UseYouTubeAPI {
  searchVideos: (query: string, options?: SearchOptions) => Promise<YouTubeVideo[]>
  getTrending: (category?: string) => Promise<YouTubeVideo[]>
  getChannelVideos: (channelId: string, maxResults?: number) => Promise<YouTubeVideo[]>
  isLoading: boolean
  error: string | null
}

interface SearchOptions {
  type?: 'video' | 'short'
  sortBy?: 'relevance' | 'date' | 'viewCount'
  maxResults?: number
  channelId?: string
}
```

### **useRedditAPI.ts Interface**
```typescript
interface RedditVideo {
  id: string
  title: string
  author: string
  subreddit: string
  videoUrl: string
  thumbnail: string
  score: number
  numComments: number
  created: string
  permalink: string
}

interface UseRedditAPI {
  getTopVideos: (subreddit: string, timeframe?: 'day' | 'week' | 'month') => Promise<RedditVideo[]>
  getMultiSubredditVideos: (subreddits: string[]) => Promise<RedditVideo[]>
  isLoading: boolean
  error: string | null
}
```

---

## Smart Query Processing

### **Query Analysis Pipeline**

```typescript
// 1. Detect content type
const detectContentType = (query: string): 'short' | 'video' | 'trending' => {
  if (query.match(/\b(shorts?|clips?)\b/i)) return 'short'
  if (query.match(/\b(trending|viral|popular)\b/i)) return 'trending'
  return 'video'
}

// 2. Extract channel name
const channelPatterns = {
  'joe rogan': ['UC...JRE', 'UC...PowerfulJRE'],
  'mrbeast': ['UCX...MrBeast'],
  'mkbhd': ['UCB...MarquesBrownlee'],
  // ... more channels
}

const detectChannel = (query: string): string | null => {
  const normalized = query.toLowerCase()
  for (const [name, ids] of Object.entries(channelPatterns)) {
    if (normalized.includes(name)) return ids[0]
  }
  return null
}

// 3. Determine sort order
const detectSortOrder = (query: string): 'date' | 'viewCount' | 'relevance' => {
  if (query.match(/\b(latest|recent|new)\b/i)) return 'date'
  if (query.match(/\b(popular|most viewed|top)\b/i)) return 'viewCount'
  return 'relevance'
}

// 4. Process query
const processVideoQuery = (query: string) => {
  const type = detectContentType(query)
  const channelId = detectChannel(query)
  const sortBy = detectSortOrder(query)
  const cleanQuery = query.replace(/\b(show|me|latest|videos?|shorts?)\b/gi, '').trim()

  return { type, channelId, sortBy, query: cleanQuery }
}
```

### **Example Queries:**

```
Input: "Show me latest Joe Rogan videos"
Output: {
  type: 'video',
  channelId: 'UCzQUP1qoWDoEbmsQxvdjxgQ',
  sortBy: 'date',
  query: 'joe rogan'
}

Input: "Show me funny shorts"
Output: {
  type: 'short',
  channelId: null,
  sortBy: 'relevance',
  query: 'funny'
}

Input: "What's trending on YouTube"
Output: {
  type: 'trending',
  channelId: null,
  sortBy: 'viewCount',
  query: ''
}
```

---

## UI/UX Design

### **Layout Modes**

**1. Grid Mode (Default)**
```
┌─────────────────────────────────┐
│ 🎬 YouTube Videos - "funny"     │
├─────────────────────────────────┤
│ [thumb] [thumb] [thumb]         │
│ Title   Title   Title           │
│ 1.2M    850K    2.3M            │
│                                 │
│ [thumb] [thumb] [thumb]         │
│ Title   Title   Title           │
│ 500K    3.1M    1.8M            │
│                                 │
│ [▶ Play All] [🎲 Shuffle]      │
└─────────────────────────────────┘
```

**2. Player Mode (After selecting video)**
```
┌─────────────────────────────────┐
│ 🎬 Now Playing                  │
├─────────────────────────────────┤
│                                 │
│     [YouTube Video Player]      │
│                                 │
│ Title: Funny Cat Compilation    │
│ Channel: FunnyCats • 1.2M views │
│                                 │
│ Queue (3):                      │
│ ▶ 1. Current video              │
│   2. Next video                 │
│   3. Another video              │
│                                 │
│ [⏮ Prev] [⏸ Pause] [⏭ Next]    │
└─────────────────────────────────┘
```

**3. Queue Mode**
```
┌─────────────────────────────────┐
│ 🎬 Video Queue (5 videos)       │
├─────────────────────────────────┤
│ ▶ [Playing] Funny cat fails     │
│   [thumb] 1.2M • 5:23           │
│                                 │
│   [Next] Epic skateboard trick  │
│   [thumb] 850K • 3:15           │
│                                 │
│   Gaming fails compilation      │
│   [thumb] 2.3M • 8:45           │
│                                 │
│ [🔀 Shuffle] [🗑️ Clear Queue]   │
└─────────────────────────────────┘
```

---

## Environment Variables Needed

```env
# YouTube Data API v3
VITE_YOUTUBE_API_KEY=AIza...

# Reddit API OAuth
VITE_REDDIT_CLIENT_ID=abc123...
VITE_REDDIT_CLIENT_SECRET=xyz789...

# Existing keys (keep these)
VITE_OPENAI_API_KEY=sk-...
VITE_PERPLEXITY_API_KEY=pplx-...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## Implementation Steps (Next Session)

### **Phase 1: YouTube API Hook** (30 mins)
1. Create `useYouTubeAPI.ts`
2. Implement search, trending, channel methods
3. Add smart query processing
4. Test with console logs

### **Phase 2: Reddit API Hook** (20 mins)
1. Create `useRedditAPI.ts`
2. Implement OAuth authentication
3. Implement video post fetching
4. Filter and normalize data

### **Phase 3: Video Components** (45 mins)
1. Create `VideoGrid.tsx` - Thumbnail grid
2. Create `VideoPlayer.tsx` - YouTube embed
3. Create `VideoQueue.tsx` - Queue management
4. Add controls and metadata

### **Phase 4: Integration** (30 mins)
1. Update `MediaBrowserOverlay.tsx`
2. Add video mode alongside Perplexity mode
3. Update `BetaBotControlPanel.tsx` detection logic
4. Test complete flow

### **Phase 5: Testing** (15 mins)
1. Test various queries
2. Test queue management
3. Test playback controls
4. Fix any bugs

**Total Time: ~2.5 hours**

---

## Testing Checklist

### **YouTube API Tests:**
- [ ] Search regular videos
- [ ] Search shorts
- [ ] Get trending videos
- [ ] Get channel videos by ID
- [ ] Sort by date
- [ ] Sort by views
- [ ] Handle no results
- [ ] Handle API errors

### **Reddit API Tests:**
- [ ] Get top videos from r/videos
- [ ] Get top videos from multiple subreddits
- [ ] Filter video posts correctly
- [ ] Handle authentication
- [ ] Handle rate limits
- [ ] Handle no results

### **Smart Query Tests:**
- [ ] "Show me latest Joe Rogan videos"
- [ ] "Show me funny shorts"
- [ ] "What's trending"
- [ ] "Show me MrBeast videos"
- [ ] "Show me viral Reddit videos"
- [ ] "Show me gaming videos"

### **UI Tests:**
- [ ] Grid displays thumbnails correctly
- [ ] Click video → plays in player
- [ ] Queue management works
- [ ] Next/Previous navigation
- [ ] Auto-play next in queue
- [ ] Close overlay works

---

## Channel ID Reference (Popular Channels)

```typescript
export const POPULAR_CHANNELS = {
  // Podcasts
  'joe rogan': 'UCzQUP1qoWDoEbmsQxvdjxgQ',
  'lex fridman': 'UCSHZKyawb77ixDdsGog4iWA',

  // Tech
  'mkbhd': 'UCBJycsmduvYEL83R_U4JriQ',
  'linus tech tips': 'UCXuqSBlHAE6Xw-yeJA0Tunw',
  'mrwhosetheboss': 'UCMiJRAwDNSNzuYeN2uWa0pA',

  // Entertainment
  'mrbeast': 'UCX6OQ3DkcsbYNE6H8uQQuVA',
  'pewdiepie': 'UC-lHJZR3Gqxm24_Vd_AJ5Yw',

  // Gaming
  'ninja': 'UCAW-NpUFkMyCNrvRSSGIvDQ',

  // Sports
  'espn': 'UCiWLfSweyRNmLpgEHekhoAg',

  // News
  'cnn': 'UCupvZG-5ko_eiXAupbDfxWw',

  // Add more as needed...
}
```

---

## Next Session Quick Start

1. **Check API keys are ready:**
   - YouTube API key in .env
   - Reddit client_id + secret in .env

2. **Start coding:**
   - Follow TODO list in order
   - Reference this plan for details
   - Test each component before moving on

3. **Key files to create:**
   - `hooks/useYouTubeAPI.ts`
   - `hooks/useRedditAPI.ts`
   - `components/VideoPlayer.tsx`
   - `components/VideoGrid.tsx`
   - `components/VideoQueue.tsx`

4. **Key files to modify:**
   - `components/MediaBrowserOverlay.tsx`
   - `components/BetaBotControlPanel.tsx`

**Ready to build the "Jamie pull that up" feature! 🚀**
