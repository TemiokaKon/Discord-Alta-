# PR3 Testing Guide

This guide provides step-by-step instructions for testing all features implemented in PR3.

## Prerequisites

1. Two browser tabs/windows (or two different browsers) for testing calls
2. Microphone and camera permissions granted
3. Two different user accounts created
4. Server running on `http://localhost:3000`

## Feature 1: User Settings Persistence

### Test Settings Sync on Login

1. **Login as User A**
   - Open browser, navigate to `http://localhost:3000`
   - Login with User A credentials

2. **Open Settings Modal**
   - Click on user profile/settings icon
   - Navigate to "Голос и видео" (Voice and Video) tab

3. **Change Settings**
   - Adjust Input Gain slider to 150%
   - Change Video Quality to 1080p
   - Change Screen Quality to 4K
   - Enable "Захват системного звука" (System Audio)
   - Toggle Noise Suppression off

4. **Close Settings Modal**
   - Settings should auto-save

5. **Verify localStorage**
   - Open browser DevTools (F12)
   - Go to Application > Local Storage
   - Look for key `userSettings_<userId>`
   - Verify settings are stored

6. **Verify Server Sync**
   - Open Network tab in DevTools
   - Look for PUT request to `/api/v1/users/me/settings`
   - Verify 200 OK response

7. **Refresh Page**
   - Press F5 to reload
   - Open Settings Modal again
   - Verify all settings persisted (Input Gain = 150%, etc.)

8. **Test Cross-Device Sync**
   - Login as same user on different browser/device
   - Open Settings Modal
   - Verify settings loaded from server

### Test Settings Validation

1. **Open DevTools Console**

2. **Test Invalid Settings via API**
   ```javascript
   fetch('/api/v1/users/me/settings', {
     method: 'PUT',
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('token'),
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       voice: { inputGain: 300 } // Invalid - should be 0-200
     })
   }).then(r => r.json()).then(console.log);
   ```

3. **Expected Result**
   - Should return 400 error
   - Error message: "inputGain must be between 0 and 200"

## Feature 2: Enhanced Call System

### Test Basic Voice Call

1. **User A - Join Voice Channel**
   - Login as User A
   - Navigate to a server with voice channels
   - Click on a voice channel to join

2. **Verify Call Started**
   - Call interface should appear
   - Local video element should show (even if just audio)
   - Channel name should display correctly

3. **User B - Join Same Channel**
   - Open second browser tab/window
   - Login as User B
   - Join the same voice channel

4. **Verify Connection**
   - Both users should see each other in participant list
   - Audio should flow between users
   - Speaking indicator should light up when talking

5. **Test Audio Toggle**
   - User A: Click microphone button to mute
   - User B: Should see mute indicator on User A
   - User A: Click microphone button to unmute
   - Verify audio resumes

### Test Video Call

1. **User A - Enable Video**
   - Click camera button in call interface
   - Grant camera permission if prompted
   - Video should start

2. **User B - See Video**
   - User A's video should appear in participant grid
   - Video quality should match settings (720p/1080p)

3. **Test Video Toggle**
   - User A: Click camera button to disable video
   - User B: Video should stop, avatar should show
   - User A: Enable video again
   - Video should resume

## Feature 3: Audio Processing Pipeline

### Test Input Gain

1. **User A - Adjust Gain During Call**
   - While in an active call
   - Open Settings Modal
   - Go to Voice tab
   - Move Input Gain slider

2. **Verify Live Update**
   - Gain should apply immediately
   - No need to restart call
   - User B should hear volume change

3. **Test Extreme Values**
   - Set gain to 0% - should be very quiet/silent
   - Set gain to 200% - should be louder
   - Set gain back to 100% - normal volume

### Test Audio Constraints

1. **Change Noise Suppression**
   - Open Settings
   - Toggle Noise Suppression off
   - **Expected**: Stream should reacquire (brief interruption)
   - Make background noise (keyboard, paper)
   - Toggle Noise Suppression on
   - Background noise should be reduced

2. **Test Echo Cancellation**
   - Similar test for Echo Cancellation
   - Play audio through speakers while in call
   - Toggle setting and verify echo behavior

## Feature 4: Screen Sharing

### Test Basic Screen Share

1. **User A - Start Screen Share**
   - Click screen share button in call
   - Select window/screen to share
   - Click "Share" in browser dialog

2. **Verify Quality Setting**
   - Before sharing, set Screen Quality to 1080p in settings
   - After sharing, check resolution being sent
   - User B should see screen at appropriate quality

3. **User B - View Shared Screen**
   - Shared screen should appear in video element
   - Should be smooth and clear

4. **User A - Stop Screen Share**
   - Click screen share button again OR
   - Click "Stop Sharing" in browser UI
   - Camera video should restore (if video was enabled)

### Test Screen Quality Settings

1. **Test 720p**
   - Set Screen Quality to 720p
   - Start screen sharing
   - Check resolution (should be ~1280x720)

2. **Test 1080p**
   - Set to 1080p
   - Verify ~1920x1080 resolution

3. **Test 4K**
   - Set to 4K
   - Verify ~3840x2160 resolution
   - Note: Actual resolution may be limited by display

### Test System Audio Capture

1. **Enable System Audio**
   - Open Settings
   - Enable "Захват системного звука"
   - Start screen sharing
   - Check "Also share audio" in browser dialog (if available)

2. **Test Audio**
   - Play video/music on shared screen
   - User B should hear system audio
   - Note: Browser support varies

3. **Verify Fallback**
   - If browser doesn't support system audio
   - Should continue without error
   - Console should log: "System audio was requested but not captured"

## Feature 5: Socket Signaling Events

### Test Join/Leave Events

1. **Monitor Console**
   - Open DevTools Console on both users
   - Filter for socket messages

2. **User A Joins Call**
   - Should see outgoing: `join-call`
   - Should see channel ID in payload

3. **User B Sees Join**
   - Should receive: `user-joined-call`
   - Should show User A's info (username, avatar)
   - Participant should be added to list

4. **User A Leaves**
   - Should emit: `leave-call`
   - User B should receive: `user-left-call`
   - User A should be removed from participant list

### Test Media State Events

1. **Toggle Audio**
   - User A mutes microphone
   - Should emit: `media-state` with `audio: false`
   - User B should receive: `user-media-state`
   - Mute indicator should update

2. **Toggle Video**
   - Same test for video
   - Verify `video: true/false` in state

3. **Speaking Indicator**
   - User A speaks
   - Should emit: `media-state` with `speaking: true`
   - User B should see speaking indicator light up

### Test Screen Share Events

1. **Start Sharing**
   - User A starts screen share
   - Should emit: `screen-share-start`
   - User B should receive: `user-screen-share-started`
   - Toast notification should appear

2. **Stop Sharing**
   - User A stops screen share
   - Should emit: `screen-share-stop`
   - User B should receive: `user-screen-share-stopped`
   - Toast notification should appear

## Edge Cases & Error Handling

### Test Permission Denied

1. **Deny Microphone**
   - Join voice channel
   - Deny microphone permission in browser
   - Should show error message
   - Call interface should not open

2. **Deny Camera**
   - Try to enable video
   - Deny camera permission
   - Should show error
   - Audio-only call should continue

3. **Deny Screen Share**
   - Try to share screen
   - Click "Cancel" in dialog
   - Error message should show
   - Call should continue normally

### Test Network Issues

1. **Disconnect Socket**
   - During call, disable network briefly
   - Socket should disconnect
   - Should attempt reconnection
   - Call state should be preserved if possible

2. **Reconnect**
   - Re-enable network
   - Socket should reconnect
   - May need to rejoin call

### Test Multiple Participants

1. **3+ Users Join**
   - Have 3 or more users join same channel
   - All should see all participants
   - Audio should mix from all sources

2. **User Leaves**
   - One user leaves
   - Others should see participant removed
   - Remaining audio should continue

## API Testing

### Test GET Settings Endpoint

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3000/api/v1/users/me/settings
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "settings": {
      "voice": { ... },
      "video": { ... },
      "screen": { ... },
      "notifications": { ... }
    }
  },
  "timestamp": "..."
}
```

### Test PUT Settings Endpoint

```bash
curl -X PUT \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"voice":{"inputGain":150},"screen":{"quality":"4k"}}' \
  http://localhost:3000/api/v1/users/me/settings
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "settings": { ... }
  },
  "timestamp": "..."
}
```

### Test Validation Errors

```bash
# Invalid input gain (> 200)
curl -X PUT \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"voice":{"inputGain":300}}' \
  http://localhost:3000/api/v1/users/me/settings
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_SETTINGS",
    "message": "inputGain must be between 0 and 200",
    "timestamp": "..."
  }
}
```

## Performance Testing

### Monitor Resource Usage

1. **Before Call**
   - Open Chrome Task Manager (Shift+Esc)
   - Note baseline memory/CPU

2. **During Voice Call**
   - Join voice channel
   - Monitor CPU usage (should be low, <5%)
   - Monitor memory (should be stable)

3. **During Video Call**
   - Enable video
   - CPU may increase (10-20% is normal)
   - Memory should remain stable

4. **During Screen Share**
   - Start screen sharing
   - CPU usage will increase (depends on content)
   - Monitor for memory leaks

5. **After Leaving Call**
   - Leave channel
   - Resources should be released
   - Memory should return close to baseline

## Known Limitations

1. **Browser Support**
   - System audio capture: Chrome/Edge only
   - Some features may not work in Firefox/Safari

2. **Network Requirements**
   - WebRTC requires good network connection
   - Poor connection = degraded quality

3. **Device Limitations**
   - Screen share quality limited by display resolution
   - Audio processing quality depends on microphone

## Troubleshooting

### No Audio
- Check microphone permissions
- Verify device selected in settings
- Check browser audio output settings
- Verify not muted in call interface

### No Video
- Check camera permissions
- Verify camera not in use by other app
- Check video quality settings
- Try disabling/re-enabling video

### Screen Share Not Working
- Check browser supports screen sharing
- Verify permissions granted
- Try different window/screen selection
- Check quality settings aren't too high

### Settings Not Saving
- Check localStorage not disabled
- Verify server is running
- Check network tab for API errors
- Check console for JavaScript errors

## Success Criteria

All tests should pass with:
- ✅ Settings persist across sessions
- ✅ Settings sync between devices
- ✅ Audio quality processing works
- ✅ Screen sharing with quality selection
- ✅ All socket events fire correctly
- ✅ Error handling works gracefully
- ✅ No JavaScript errors in console
- ✅ No memory leaks after ending call
