# Cast Files Tab Setup Instructions

## Overview
A new **Files** tab has been added to the Stream Enhancement Dashboard where you can manage files and resources for your cast members.

## What Was Added

### 1. Files Tab UI Component
- Located at: `src/components/FilesTab.tsx`
- Features:
  - View all cast files organized by category (forms, documents, resources)
  - Track download/view counts
  - Open files in new tab or download
  - Delete inactive files
  - Public URLs for cast member access

### 2. Year-End Review Form
- **File**: `public/year-end-review.html`
- **Description**: Personal year-end performance review form "YOU, INC. - 2025→2026"
- **Features**:
  - 12 performance blocks (Will, Skill, Mission, Plan, Dreams, Vision, Enemy, Culture, System, Capital, Competition, Supporting Cast)
  - Goal Ladder framework (1-year, 3-year, 5-year, 10-year goals)
  - Auto-calculating scorecard (out of 120 points)
  - 2026 declaration section
  - Auto-save to localStorage every 30 seconds
  - Print/Save as PDF functionality
  - Responsive design with "The Live Stream Show" branding

### 3. Database Schema
- Located at: `sql/cast_files_schema.sql`
- Tables:
  - `cast_files` - Store file metadata
  - `cast_file_access_log` - Track who views/downloads files

## Setup Steps

### Step 1: Create Database Tables
1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `sql/cast_files_schema.sql`
4. Paste into the SQL Editor and click **Run**

### Step 2: Verify Installation
1. Navigate to your Stream Enhancement Dashboard
2. Click the **Files** tab (green tab with FileText icon)
3. You should see the Year-End Review form listed

### Step 3: Share with Cast Members
The cast can access the year-end review form at:

```
https://your-domain.com/year-end-review.html
```

Or locally at:
```
http://localhost:5173/year-end-review.html
```

## How Cast Members Use the Form

1. **Open the form** via the shared URL
2. **Fill out each section**:
   - Employee information at the top
   - Goal Ladder (1-year, 3-year, 5-year, 10-year goals)
   - Rate each of the 12 performance blocks (1-10 scale)
   - Write self-assessments and 2026 challenges for each block
   - Create 2026 declaration (identity shift statement)
3. **Auto-save**: Form saves to browser every 30 seconds
4. **Print/Save PDF**: Click the bottom-right button to print or save as PDF
5. **Clear Form**: Optional clear button to start over

## Features for Admin

### Files Tab Features:
- ✅ View all cast files
- ✅ Track download/view counts
- ✅ Open files in new tab
- ✅ Download files
- ✅ Delete (archive) files
- ✅ Category organization (forms, documents, resources)
- ✅ Public URL display for sharing

### Adding More Files:
To add more files to the Files tab, insert records into the `cast_files` table:

```sql
INSERT INTO cast_files (
  file_name,
  file_type,
  file_category,
  description,
  file_url,
  public_url
) VALUES (
  'Your File Name',
  'pdf', -- or 'html', 'doc', etc.
  'documents', -- or 'forms', 'resources'
  'Description of the file',
  '/path/to/file.pdf',
  'https://your-domain.com/path/to/file.pdf'
);
```

## Technical Details

### Database Schema:
- **cast_files**: Stores file metadata, URLs, categories
- **cast_file_access_log**: Logs every view/download with timestamp
- **increment_download_count()**: Function to track usage

### Security:
- Row Level Security (RLS) enabled on both tables
- Current policy: Allow all (adjust based on your auth requirements)
- Public files are served from `/public` directory

### Performance:
- Files stored in public folder (no authentication required for cast)
- Download counts updated via database function
- Access logs for analytics

## Troubleshooting

### Files Tab is Empty
1. Verify tables were created: Check Supabase Table Editor
2. Run the SQL script again if needed
3. Check browser console for errors

### Year-End Review Form Not Loading
1. Verify file exists: Check `/public/year-end-review.html`
2. Try accessing directly: `http://localhost:5173/year-end-review.html`
3. Check Vite dev server is running: `npm run dev`

### Can't See Files Tab
1. Refresh the browser
2. Check browser console for React errors
3. Verify `FilesTab.tsx` was imported correctly in `App.tsx`

## Future Enhancements

Consider adding:
- [ ] File upload functionality (drag & drop)
- [ ] Bulk file operations
- [ ] File expiration dates
- [ ] Cast member authentication before accessing files
- [ ] Email notifications when new files are added
- [ ] File versioning
- [ ] Comments/feedback on files
- [ ] Search/filter files

---

**Created**: December 2025
**For**: The Live Stream Show - Season 4
