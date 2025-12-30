# PR3 Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐         ┌──────────────────┐              │
│  │ Settings Modal  │────────>│ EnhancedCallMgr  │              │
│  │                 │         │                   │              │
│  │ - Voice Settings│         │ - Audio Pipeline │              │
│  │ - Video Quality │         │ - Screen Share   │              │
│  │ - Screen Config │         │ - Participants   │              │
│  │ - Sync on Close │         │ - Media Controls │              │
│  └────────┬────────┘         └─────────┬────────┘              │
│           │                            │                        │
│           │ saveSettings()             │ socket.emit()          │
│           v                            v                        │
│  ┌─────────────────────────────────────────────────┐           │
│  │            localStorage + API Sync                │           │
│  │  Key: userSettings_<userId>                      │           │
│  └─────────────────────────────────────────────────┘           │
│           │                            │                        │
└───────────┼────────────────────────────┼────────────────────────┘
            │                            │
            │ HTTP                       │ WebSocket
            v                            v
┌─────────────────────────────────────────────────────────────────┐
│                         Server Layer                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │ REST API         │         │ Socket.IO        │             │
│  │ /api/v1/users/   │         │                  │             │
│  │   me/settings    │         │ Authentication   │             │
│  │                  │         │ (JWT Middleware) │             │
│  │ GET - Load       │         └────────┬─────────┘             │
│  │ PUT - Save       │                  │                        │
│  └────────┬─────────┘                  │                        │
│           │                            │                        │
│           │ validate()                 │ emit to rooms          │
│           v                            v                        │
│  ┌────────────────────────────────────────────────┐            │
│  │         UserSettings Model                      │            │
│  │  - get(userId)                                  │            │
│  │  - save(userId, settings)                       │            │
│  │  - getDefaultSettings()                         │            │
│  └───────────────────┬────────────────────────────┘            │
│                      │                                           │
│                      v                                           │
│  ┌────────────────────────────────────────────────┐            │
│  │         SQLite Database                         │            │
│  │                                                  │            │
│  │  users                user_settings             │            │
│  │  ├─ id              ├─ id                       │            │
│  │  ├─ username        ├─ user_id (FK)             │            │
│  │  ├─ email           ├─ settings (JSON)          │            │
│  │  └─ ...             └─ updated_at               │            │
│  └────────────────────────────────────────────────┘            │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Call Flow Sequence

```
User A                    EnhancedCallManager           Socket.IO Server         User B
  │                              │                              │                    │
  │ joinVoiceChannel()           │                              │                    │
  ├─────────────────────────────>│                              │                    │
  │                              │                              │                    │
  │                              │ getUserMedia()               │                    │
  │                              │ + audio processing           │                    │
  │                              │                              │                    │
  │                              │ emit('join-call')            │                    │
  │                              ├─────────────────────────────>│                    │
  │                              │                              │                    │
  │                              │                              │ join room          │
  │                              │                              │ call:channelId     │
  │                              │                              │                    │
  │                              │                              │ emit('user-joined-call')
  │                              │                              ├───────────────────>│
  │                              │                              │                    │
  │                              │                         addParticipant()          │
  │                              │                              │                    │
  │ toggleAudio()                │                              │                    │
  ├─────────────────────────────>│                              │                    │
  │                              │                              │                    │
  │                              │ emit('media-state')          │                    │
  │                              ├─────────────────────────────>│                    │
  │                              │                              │                    │
  │                              │                              │ emit('user-media-state')
  │                              │                              ├───────────────────>│
  │                              │                              │                    │
  │                              │                       updateParticipantStatus()   │
  │                              │                              │                    │
  │ startScreenShare()           │                              │                    │
  ├─────────────────────────────>│                              │                    │
  │                              │                              │                    │
  │                              │ getDisplayMedia()            │                    │
  │                              │ + quality constraints        │                    │
  │                              │                              │                    │
  │                              │ replaceTrack() on peers      │                    │
  │                              │                              │                    │
  │                              │ emit('screen-share-start')   │                    │
  │                              ├─────────────────────────────>│                    │
  │                              │                              │                    │
  │                              │                              │ emit('user-screen-share-started')
  │                              │                              ├───────────────────>│
  │                              │                              │                    │
  │                              │                              │    Toast           │
  │                              │                              │    Notification    │
```

## Audio Processing Pipeline

```
Microphone
    │
    │ getUserMedia({ audio: constraints })
    │ - echoCancellation
    │ - noiseSuppression  
    │ - autoGainControl
    v
MediaStreamSource
    │
    ├──> AudioAnalyser (speaking detection)
    │
    v
GainNode
    │ gain.value = inputGain / 100
    │ Range: 0.0 to 2.0 (0% to 200%)
    v
DynamicsCompressorNode
    │ threshold: -50
    │ knee: 40
    │ ratio: 12
    │ attack: 0.003
    │ release: 0.25
    v
MediaStreamDestination
    │
    │ processedStream
    v
RTCPeerConnection
    │
    │ replaceTrack() on senders
    v
Remote Peers
```

## Settings Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     Settings Lifecycle                        │
└──────────────────────────────────────────────────────────────┘

1. INITIALIZATION (on page load)
   ┌─────────────────────────────────────────────────┐
   │ localStorage (userSettings_<userId>)            │
   │              ↓                                   │
   │ SettingsModal.loadCurrentSettings()             │
   │              ↓                                   │
   │ GET /api/v1/users/me/settings                   │
   │              ↓                                   │
   │ Merge server settings                           │
   │              ↓                                   │
   │ applySettingsToUI()                             │
   │              ↓                                   │
   │ syncSettingsWithCallManager()                   │
   └─────────────────────────────────────────────────┘

2. USER CHANGES SETTING
   ┌─────────────────────────────────────────────────┐
   │ User adjusts slider/toggle                      │
   │              ↓                                   │
   │ Event handler updates currentSettings           │
   │              ↓                                   │
   │ syncSettingsWithCallManager()                   │
   │              ↓                                   │
   │ EnhancedCallManager.saveSettings()              │
   │              ↓                                   │
   │ Update audio processing (if in call)            │
   └─────────────────────────────────────────────────┘

3. SAVE ON CLOSE
   ┌─────────────────────────────────────────────────┐
   │ Modal closes                                     │
   │              ↓                                   │
   │ cleanup()                                        │
   │              ↓                                   │
   │ saveSettings() → localStorage                   │
   │              ↓                                   │
   │ saveSettingsToServer()                          │
   │              ↓                                   │
   │ PUT /api/v1/users/me/settings                   │
   │              ↓                                   │
   │ Validation (ranges, allowed values)             │
   │              ↓                                   │
   │ UserSettingsModel.save()                        │
   │              ↓                                   │
   │ SQLite INSERT/UPDATE                            │
   └─────────────────────────────────────────────────┘
```

## Screen Share Quality Resolution

```
Setting     Resolution    Ideal Use Case
───────────────────────────────────────────
720p        1280 x 720    - Light documents
                          - Web browsing
                          - Low bandwidth

1080p       1920 x 1080   - HD presentations
  ⬆                       - Detailed content
DEFAULT                   - Balanced quality/bandwidth

4K          3840 x 2160   - High detail work
                          - Design/graphics
                          - Requires high bandwidth
```

## Socket Event Types

```
┌─────────────────────────────────────────────────┐
│             Call Lifecycle Events                │
├─────────────────────────────────────────────────┤
│ join-call          → User joins channel call     │
│ user-joined-call   ← Other user joined           │
│ leave-call         → User leaves call            │
│ user-left-call     ← Other user left             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│          WebRTC Signaling Events                 │
├─────────────────────────────────────────────────┤
│ offer              → Send SDP offer              │
│ answer             → Send SDP answer             │
│ ice-candidate      → Exchange ICE candidates     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│            Media State Events                    │
├─────────────────────────────────────────────────┤
│ media-state        → Update my state             │
│ user-media-state   ← Other user's state changed  │
│                      (audio/video/speaking)      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│          Screen Share Events                     │
├─────────────────────────────────────────────────┤
│ screen-share-start → I started sharing          │
│ screen-share-stop  → I stopped sharing          │
│ user-screen-share-started ← Other started       │
│ user-screen-share-stopped ← Other stopped       │
└─────────────────────────────────────────────────┘
```

## Technology Stack

```
Frontend:
  - Vanilla JavaScript (ES6+)
  - WebRTC (RTCPeerConnection)
  - WebAudio API (AudioContext, Nodes)
  - Socket.IO Client
  - MediaDevices API (getUserMedia, getDisplayMedia)

Backend:
  - Node.js
  - Express.js
  - Socket.IO Server
  - SQLite3
  - JWT Authentication

Key APIs:
  - getUserMedia - Capture audio/video
  - getDisplayMedia - Screen capture
  - RTCPeerConnection - Peer connections
  - AudioContext - Audio processing
  - fetch - Settings sync
  - localStorage - Client-side cache
```

## File Organization

```
Discord-Alta-/
├── client/
│   ├── enhanced-call.js      ← Unified call manager
│   ├── settings-modal.js     ← Settings UI + sync
│   ├── script.js             ← Main app, delegates to manager
│   └── call-modal.js         ← Call UI (can integrate)
│
├── server/
│   ├── server.js             ← Socket events + HTTP server
│   ├── models/
│   │   └── user-settings.model.js  ← Settings CRUD
│   └── routes/
│       └── user.routes.js    ← Settings API endpoints
│
├── docs/
│   ├── CALL_SIGNALING.md     ← Event reference
│   └── PR3_TESTING_GUIDE.md  ← Testing instructions
│
└── data/
    └── alta52.db             ← SQLite database
```

## Key Design Decisions

1. **Unified Manager Pattern**
   - Single source of truth for call state
   - Encapsulates WebRTC complexity
   - Easy to maintain and extend

2. **Settings Architecture**
   - Client-first (localStorage cache)
   - Server sync for persistence
   - Merge on load for consistency

3. **Audio Processing**
   - WebAudio for quality enhancement
   - Live updates without restart
   - Stream reacquisition for constraints

4. **Screen Share**
   - Quality-based constraints
   - Browser capability detection
   - Graceful fallback

5. **Backward Compatibility**
   - Legacy events still supported
   - Fallback to old code paths
   - Clean migration strategy
