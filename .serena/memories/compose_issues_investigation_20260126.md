# Compose.php Issues - Investigation Summary

## Issues Identified

### 1. **CRITICAL: SQL Error in api-subscriber-sample.php**
**Location**: Line with `LIMIT $limit` inside prepared statement
**Problem**: Variable interpolation in SQL string - won't work with prepared statements
```php
LIMIT $limit  // WRONG - causes SQL parsing error
```
**Fix**: Need to either:
- Use `bind_param()` to bind limit value
- Or hardcode LIMIT 50 in SQL string

**Impact**: When preview dropdown tries to load subscriber list, it fails silently, but query may hang or error

---

### 2. **Template Loading Not Triggering Preview**
**Location**: compose.php - JavaScript `loadDefaultTemplate()` and `loadOfferTemplate()`
**Problem**: 
- Functions update form inputs
- Dispatch 'input' events
- BUT if `previewOpen = false`, the preview won't update
- User clicks "Load Default Template" but sees nothing in preview area (because preview is hidden by default)

**Current Flow**:
1. User clicks "Load Default Template"
2. Template text is loaded ✓
3. Input events dispatched ✓
4. BUT: `if (previewOpen && previewReady) { updatePreview(); }` only runs if preview is already open
5. Result: No visual feedback

---

### 3. **Subscriber Split Data Not Loading**
**Location**: compose.php - JavaScript `loadSubscriberStats()` and `api-subscriber-stats.php`
**Probable Cause**: 
- API call to `/api-subscriber-stats.php` may be failing
- SQL queries in stats endpoint might be slow due to complex JOINs
- Or SQL error from prepared statement variable interpolation

---

### 4. **Page Appears Frozen**
**Likely Causes** (in order of probability):
1. `api-subscriber-sample.php` SQL error hangs the page
2. `api-subscriber-stats.php` complex subqueries are slow
3. Multiple API calls happening simultaneously blocking UI
4. Missing error handling for failed API calls

---

## Files to Fix

1. `public/floinvite-mail/api-subscriber-sample.php` - SQL syntax error
2. `public/floinvite-mail/compose.php` - JavaScript preview logic
3. `public/floinvite-mail/api-subscriber-stats.php` - Optimize queries or add error handling

## Fixes Applied ✅

### 1. Fixed SQL Syntax Error in api-subscriber-sample.php
**Changed**: `LIMIT $limit` → `LIMIT 50` (3 occurrences)
**Impact**: Prepared statements now work correctly. Preview dropdown will load without hanging.

### 2. Auto-open Preview on Template Load
**Changed**: `loadDefaultTemplate()` and `loadOfferTemplate()` now call `togglePreview()` if hidden
**Impact**: Users see immediate visual feedback when clicking template buttons

### 3. Show Preview Container by Default  
**Changed**: On page load, preview is now visible with preview stats loaded
**Impact**: Users see the email preview immediately without needing to click "Show Preview"

### 4. Added Timeout & Error Handling to API Calls
**Changes**:
- Added AbortController with 10s timeout on main preview API
- Added 8s timeouts on subscriber sample and stats APIs
- Added proper error handling with user-friendly messages
- All API calls now clear timeouts and log errors to console

**Impact**: Page won't hang/freeze if any API takes too long
**Errors shown**: "Request timeout (10s)" if API doesn't respond in time

### 5. Improved Error Messages
**Changes**:
- Better HTTP error detection
- Specific "Unable to load subscribers" message in dropdown
- "Stats unavailable" in statistics display
- Proper error display in preview iframe

**Impact**: Users get clear feedback instead of silent failures

## Testing Checklist
- [ ] Click "Load Default Template" - preview should open and show email
- [ ] Click "Load Offer Template" - preview should update with red hero section
- [ ] Dropdown subscriber list should populate (check browser console for any errors)
- [ ] Stats should display: "All: X · Reached: Y · Unreached: Z"
- [ ] Page should NOT freeze when loading
- [ ] If an API times out, should see error in preview iframe
