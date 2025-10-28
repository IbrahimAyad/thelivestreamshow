# Force Danny Voice

The popup is using a different voice because localStorage has a different preference saved.

## Quick Fix - Run in Browser Console:

1. Open browser console (F12)
2. Paste this and press Enter:

```javascript
localStorage.setItem('f5tts_preferred_voice', 'danny-low')
console.log('✅ Set voice to danny-low')
```

3. Refresh the page (Cmd+R or F5)

## Verify it worked:

In console, run:
```javascript
localStorage.getItem('f5tts_preferred_voice')
```

Should show: `"danny-low"`

---

## Alternative: Clear All Voice Preferences

If the above doesn't work:

```javascript
localStorage.removeItem('f5tts_preferred_voice')
localStorage.removeItem('betabot_preferred_voice')
console.log('✅ Cleared all voice preferences - will use default danny-low')
```

Then refresh the page.

---

The hook automatically prefers danny-low when no preference is saved, so clearing it should also work!
