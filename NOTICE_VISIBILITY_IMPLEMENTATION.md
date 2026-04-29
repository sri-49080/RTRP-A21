# Notice Visibility & Dynamic Color Coding Implementation

## Overview
Implemented automatic notice expiration filtering and dynamic color coding based on remaining visibility duration. Expired notices are now automatically hidden, and notice colors update in real-time to indicate urgency.

## Changes Made

### 1. Backend: MongoDB Schema Updates
**File:** `server/server.js`

**Changes:**
- Updated Notice schema to include `visibilityEndDate` field in the `photos` array:
  ```javascript
  photos: [{
    photoUrl: String,
    visibilityDate: Date,         // Start date when photo becomes visible
    visibilityEndDate: Date,      // End date when photo expires
    hyperlink: String
  }]
  ```
- Added legacy `visibilityEndDate` field for backward compatibility

### 2. Backend: POST Endpoint Updates
**File:** `server/server.js` - POST `/api/notices`

**Changes:**
- Added support for `visibilityEndDate`, `visibilityEndTime`, `visibilityEndDate2`, and `visibilityEndTime2` parameters
- Both photos (primary and secondary) now store end date information
- End dates are parsed with optional time components

### 3. Backend: GET Endpoint - Expiration Filtering & Color Calculation
**File:** `server/server.js` - GET `/api/notices`

**Key Features:**

#### Expiration Filtering:
- Photos with `visibilityEndDate <= now` are automatically skipped
- Only photos within their visibility window are returned
- If no valid photo remains, the entire notice is hidden

#### Dynamic Color Coding:
Colors are calculated based on remaining visibility duration:
- **🟢 GREEN (#4CAF50)**: More than 50% of total visibility duration remaining
- **🟠 ORANGE (#FFA500)**: 50% or less of total visibility duration remaining
- **🔴 RED (#FF5252)**: 2 days or fewer remaining until expiration

#### Calculation Formula:
```javascript
totalDuration = visibilityEndDate - visibilityStartDate
timeRemaining = visibilityEndDate - currentTime
colorThreshold1 = totalDuration * 0.5  (50% mark)
colorThreshold2 = 2 days in milliseconds (red threshold)
```

#### Example Scenario:
- Start Date: January 1, 2025
- End Date: January 11, 2025 (10 days duration)
- January 5: 5 days remaining = 50% → GREEN
- January 8: 3 days remaining = 30% → ORANGE
- January 9: 2 days remaining → RED

### 4. Frontend: Form Updates
**File:** `src/components/AddNoticeEvent.js`

**Changes:**
- Added form state for `visibilityEndDate1`, `visibilityEndTime1`, `visibilityEndDate2`, `visibilityEndTime2`
- Updated form validation to:
  - Require `visibilityEndDate1` for all notices
  - Verify end date is after start date
- Updated form submission to send end date fields to backend
- Updated form UI labels from "visibility date" to "visibility start date" and added "visibility end date" fields

### 5. Frontend: Dashboard Updates
**File:** `src/components/Dashboard.js`

**Changes:**
- Applied `backgroundColor` style to all notice displays using the `color` field from API
- Ensures color coding is visible in:
  - Home tab (Urgent & New Notices sections)
  - Academics tab
  - Events tab
- Increased refresh interval from 30 seconds to 10 seconds for real-time color updates
- Added comment explaining the refresh purpose

## How It Works

### Creating a Notice:
1. Admin fills out the form with:
   - Notice title
   - Photo(s)
   - **Visibility Start Date & Time**
   - **Visibility End Date & Time** (NEW)
   - Hyperlink
   - Target year levels
2. Form validates that end date > start date
3. Data sent to server with both date fields

### Displaying a Notice:
1. Dashboard requests notices from `/api/notices?year={userYear}`
2. Server filters photos based on:
   - Current time vs. start date
   - Current time vs. end date
3. Server calculates color based on time remaining
4. Frontend applies backgroundColor from the color field
5. Notice automatically disappears after end date passes

### Real-Time Updates:
- Dashboard refreshes every 10 seconds
- Colors transition automatically based on remaining time
- Expired notices disappear immediately after expiration

## Testing Checklist

### Test 1: Expired Notice Hiding
1. Create a notice with end date = today
2. Verify notice appears
3. Wait for server refresh (10 seconds)
4. Verify notice disappears after expiration

### Test 2: Color Transitions
1. Create a notice with:
   - Start: Today
   - End: 15 days from now (>50% duration) → Should be GREEN
2. Create a notice with:
   - Start: 10 days ago
   - End: Today +3 days (30% remaining) → Should be ORANGE
3. Create a notice with:
   - Start: 10 days ago
   - End: Today +1 day (1 day remaining) → Should be RED

### Test 3: Multiple Photos
1. Create notice with Photo 1:
   - Start: Today
   - End: Tomorrow
2. Add Photo 2 with future dates
3. Verify Photo 1 displays with appropriate color
4. After Photo 1 end date, verify Photo 2 displays
5. After Photo 2 end date, verify notice disappears

### Test 4: Form Validation
1. Try to create notice with end date before start date
2. Verify error message appears
3. Try to create notice without end date
4. Verify required field validation

## Database Migration Notes

### For Existing Data:
- Old notices without `visibilityEndDate` will still work (legacy compatibility)
- Recomm recommendation: Set end dates on existing notices to continue displaying them
- Can be updated via MongoDB client:
  ```javascript
  db.notices.updateMany(
    { visibilityEndDate: { $exists: false } },
    { $set: { visibilityEndDate: new Date('2025-12-31') } }
  )
  ```

## Performance Considerations

- **Refresh Rate**: 10 seconds provides a good balance between real-time updates and server load
- **Color Calculation**: Done server-side to ensure consistency
- **Database Queries**: Notices are filtered by year, then by date ranges in memory
- **Scalability**: For large datasets, consider adding MongoDB aggregation pipeline for date filtering

## Future Enhancements

1. Add scheduled notifications when notices transition to RED status
2. Implement notice scheduling (auto-publish/unpublish)
3. Add analytics for notice visibility duration
4. Allow users to customize color thresholds
5. Add visual countdown indicator for RED notices

## Troubleshooting

### Issue: Notices not disappearing after end date
- **Solution**: Check server logs for date parsing errors
- Verify MongoDB stores dates in ISO format
- Ensure client system time is synchronized

### Issue: Colors not updating
- **Solution**: Check browser console for API errors
- Verify 10-second refresh is running
- Clear browser cache and reload

### Issue: Form validation error for end date
- **Solution**: Ensure end date is selected AND is after start date
- Try using time fields to ensure proper date-time comparison

## References

- Server changes: `server/server.js` (lines 32-52 schema, 208-296 POST endpoint, 375-509 GET endpoint)
- Form changes: `src/components/AddNoticeEvent.js` (state initialization, validation, form UI)
- Dashboard changes: `src/components/Dashboard.js` (color styling, refresh interval)
