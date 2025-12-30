# Call Signaling Documentation

This document describes the Socket.IO signaling events used for voice/video calls and screen sharing in Alta52.

## Overview

Alta52 uses a unified call system based on the `EnhancedCallManager` class on the client side and standardized Socket.IO events for signaling. Calls are organized by channel ID, with support for:

- Voice calls (audio only)
- Video calls (audio + camera)
- Screen sharing with optional system audio
- Real-time media state updates (mute/unmute, camera on/off)

## Architecture

### Client Side

- **EnhancedCallManager** (`client/enhanced-call.js`): Single unified manager for all call operations
- **Settings Integration**: Loads user preferences from localStorage and server API
- **Audio Processing**: Optional WebAudio pipeline with gain control and compression
- **Screen Share**: Quality-based constraints with system audio support

### Server Side

- **Socket Authentication**: JWT-based authentication via `socketAuth` middleware
- **Room Management**: Calls organized by `call:{channelId}` rooms
- **Event Broadcasting**: Server relays signaling between participants

## Socket Events

### Connection Events

#### `connect`
Emitted when client successfully connects to Socket.IO server.

**Direction**: Server → Client

**No data**

---

#### `disconnect`
Emitted when client disconnects. Server automatically removes user from online users and notifies others.

**Direction**: Client → Server

**No data**

---

### Call Room Events

#### `join-call`
Join a voice/video call in a specific channel.

**Direction**: Client → Server

**Data**:
```javascript
{
  channelId: string,        // Channel ID for the call
  mediaState: {             // Optional initial media state
    audio: boolean,         // Audio enabled
    video: boolean,         // Video enabled  
    screen: boolean         // Screen sharing active
  }
}
```

**Server Response**: Broadcasts `user-joined-call` to other participants in the call room.

---

#### `user-joined-call`
Notification that a user has joined the call.

**Direction**: Server → Client

**Data**:
```javascript
{
  userId: number,           // User ID who joined
  username: string,         // Username
  avatar: string,           // Avatar URL or emoji
  mediaState: {             // User's media state
    audio: boolean,
    video: boolean,
    screen: boolean
  }
}
```

---

#### `leave-call`
Leave a voice/video call.

**Direction**: Client → Server

**Data**:
```javascript
{
  channelId: string         // Channel ID
}
```

**Server Response**: Broadcasts `user-left-call` to other participants.

---

#### `user-left-call`
Notification that a user has left the call.

**Direction**: Server → Client

**Data**:
```javascript
{
  userId: number,           // User ID who left
  username: string          // Username
}
```

---

### WebRTC Signaling Events

#### `offer`
Send a WebRTC offer to establish peer connection.

**Direction**: Client → Server → Client

**Client sends**:
```javascript
{
  targetUserId: number,     // Target user ID
  offer: RTCSessionDescriptionInit,  // WebRTC offer
  channelId: string         // Channel ID
}
```

**Server broadcasts to target**:
```javascript
{
  fromUserId: number,       // Sender user ID
  fromUsername: string,     // Sender username
  offer: RTCSessionDescriptionInit,
  channelId: string
}
```

---

#### `answer`
Send a WebRTC answer to complete peer connection.

**Direction**: Client → Server → Client

**Client sends**:
```javascript
{
  targetUserId: number,     // Target user ID
  answer: RTCSessionDescriptionInit,  // WebRTC answer
  channelId: string
}
```

**Server broadcasts to target**:
```javascript
{
  fromUserId: number,
  fromUsername: string,
  answer: RTCSessionDescriptionInit,
  channelId: string
}
```

---

#### `ice-candidate`
Exchange ICE candidates for NAT traversal.

**Direction**: Client → Server → Client

**Client sends**:
```javascript
{
  targetUserId: number,
  candidate: RTCIceCandidate
}
```

**Server broadcasts to target**:
```javascript
{
  userId: number,           // Sender user ID
  candidate: RTCIceCandidate
}
```

---

### Media State Events

#### `media-state`
Update current media state (audio/video/speaking).

**Direction**: Client → Server

**Data**:
```javascript
{
  channelId: string,
  state: {
    audio: boolean,         // Audio enabled
    video: boolean,         // Video enabled
    speaking: boolean       // Currently speaking (detected)
  }
}
```

**Server Response**: Broadcasts `user-media-state` to other participants.

---

#### `user-media-state`
Notification of another user's media state change.

**Direction**: Server → Client

**Data**:
```javascript
{
  userId: number,
  username: string,
  state: {
    audio: boolean,
    video: boolean,
    speaking: boolean
  }
}
```

---

### Screen Sharing Events

#### `screen-share-start`
Start screen sharing.

**Direction**: Client → Server

**Data**:
```javascript
{
  channelId: string
}
```

**Server Response**: Broadcasts `user-screen-share-started` to other participants.

---

#### `user-screen-share-started`
Notification that a user started screen sharing.

**Direction**: Server → Client

**Data**:
```javascript
{
  userId: number,
  username: string
}
```

---

#### `screen-share-stop`
Stop screen sharing.

**Direction**: Client → Server

**Data**:
```javascript
{
  channelId: string
}
```

**Server Response**: Broadcasts `user-screen-share-stopped` to other participants.

---

#### `user-screen-share-stopped`
Notification that a user stopped screen sharing.

**Direction**: Server → Client

**Data**:
```javascript
{
  userId: number,
  username: string
}
```

---

## Legacy Events (Deprecated)

The following events are legacy one-to-one call events. They still work but should not be used for new code:

- `call-user` (use `join-call` + `offer`)
- `incoming-call` (replaced by `user-joined-call`)
- `call-answer` (use `answer`)
- `call-answered` (handled via `answer` event)
- `end-call` (use `leave-call`)
- `call-ended` (replaced by `user-left-call`)

---

## Audio Processing Pipeline

The `EnhancedCallManager` includes an optional WebAudio processing pipeline:

1. **Source**: MediaStreamSource from getUserMedia
2. **Gain Node**: Adjustable input gain (0-200%, default 100%)
3. **Compressor Node**: Light dynamic range compression
4. **Destination**: Processed audio sent to peer connections

### Settings

Audio processing settings are controlled via user settings:

```javascript
{
  voice: {
    inputGain: 100,              // 0-200, percentage
    echoCancellation: true,      // Browser echo cancellation
    noiseSuppression: true,      // Browser noise suppression
    autoGainControl: true        // Browser auto gain control
  }
}
```

**Live Updates**: Gain can be updated during a call. Constraint changes (echo/noise/agc) require stream reacquisition.

---

## Screen Sharing

### Quality Settings

Screen share quality is configurable:

```javascript
{
  screen: {
    quality: '1080p',           // '720p', '1080p', or '4k'
    includeAudio: false         // Capture system audio if supported
  }
}
```

### Quality Constraints

- **720p**: 1280x720
- **1080p**: 1920x1080 (default)
- **4K**: 3840x2160

### System Audio

When `includeAudio` is enabled, the client attempts to capture system audio using `getDisplayMedia({ audio: true })`. This is browser-dependent and may not be supported in all environments.

---

## Testing Instructions

### Testing Voice Calls

1. **Setup**: Open two browser tabs/windows logged in as different users
2. **Join Channel**: Both users join the same voice channel
3. **Verify Audio**: Check that audio flows between users
4. **Test Controls**: 
   - Toggle mute/unmute
   - Adjust input gain in settings
   - Verify speaking indicator appears when talking

### Testing Video Calls

1. **Enable Video**: Start call with video enabled
2. **Verify Video**: Check video streams display for all participants
3. **Toggle Camera**: Turn camera on/off and verify updates
4. **Test Quality**: Change video quality in settings and rejoin call

### Testing Screen Sharing

1. **Start Screen Share**: Click screen share button during a call
2. **Select Screen**: Choose window/screen in browser dialog
3. **Verify**: Other participants should see your screen
4. **Quality Test**: Try different quality settings (720p/1080p/4K)
5. **System Audio**: Enable system audio capture (if supported)
6. **Stop Sharing**: Click stop button or use browser's stop sharing button

### Testing Settings Sync

1. **Change Settings**: Modify voice/video/screen settings
2. **Close Modal**: Settings should save to localStorage
3. **Refresh Page**: Settings should persist
4. **Check Server**: Verify settings saved via API (`GET /api/v1/users/me/settings`)
5. **Different Device**: Login on another device, settings should sync

### Testing Audio Processing

1. **Adjust Gain**: Change input gain slider (0-200%)
2. **Live Test**: Gain should update immediately during a call
3. **Toggle Constraints**: Change echo/noise suppression
4. **Verify Reacquisition**: Stream should be reacquired with new constraints

---

## Error Handling

### Permission Denied

If user denies microphone/camera/screen access:
- Display user-friendly error message
- Fall back gracefully (e.g., join without video if camera denied)

### Connection Issues

If peer connection fails:
- Retry ICE gathering
- Check STUN/TURN server availability
- Log detailed error for debugging

### Server Disconnect

If Socket.IO disconnects:
- Attempt automatic reconnection
- Preserve call state if possible
- Notify user of connection status

---

## Security Considerations

1. **Authentication**: All socket connections require valid JWT token
2. **Channel Access**: Verify user has permission to join channel (server-side)
3. **Input Validation**: Sanitize all socket event data
4. **Rate Limiting**: Prevent spam of signaling events
5. **Secure Transport**: Use WSS (WebSocket over TLS) in production

---

## Future Enhancements

Potential improvements for the call system:

- [ ] Noise gate implementation (AudioWorklet)
- [ ] Spatial audio positioning
- [ ] Recording capabilities
- [ ] Bandwidth adaptation
- [ ] End-to-end encryption
- [ ] Multiple screen share streams
- [ ] Picture-in-picture mode
- [ ] Virtual backgrounds
