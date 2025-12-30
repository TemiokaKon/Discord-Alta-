/**
 * Application Configuration
 * Centralized configuration for API, WebSocket, and other settings
 */

const config = {
    // API Configuration
    api: {
        baseURL: '/api/v1',
        timeout: 30000, // 30 seconds
        retryAttempts: 3,
        retryDelay: 1000 // 1 second
    },

    // WebSocket Configuration
    socket: {
        url: window.location.origin,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
    },

    // WebRTC Configuration
    webrtc: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ],
        
        // Audio constraints
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
            channelCount: 1
        },
        
        // Video constraints
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30, max: 60 },
            facingMode: 'user'
        },
        
        // Screen share constraints
        screen: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
        }
    },

    // UI Configuration
    ui: {
        theme: 'ruby', // 'ruby' | 'dark' | 'light'
        animationDuration: 300,
        toastDuration: 3000,
        typingIndicatorTimeout: 3000,
        messageLoadCount: 50,
        searchDebounceDelay: 300
    },

    // File Upload Configuration
    upload: {
        maxFileSize: 10 * 1024 * 1024, // 10 MB
        allowedTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'video/mp4',
            'video/webm',
            'audio/mpeg',
            'audio/wav',
            'application/pdf',
            'text/plain'
        ],
        maxFiles: 10
    },

    // Notification Configuration
    notifications: {
        enabled: true,
        sound: true,
        desktop: true,
        requestPermission: true
    },

    // Feature Flags
    features: {
        voiceChannels: true,
        videoChat: true,
        screenShare: true,
        reactions: true,
        threads: false, // Future feature
        polls: false // Future feature
    },

    // Development Mode
    dev: {
        enabled: window.location.hostname === 'localhost',
        logLevel: 'debug',
        mockData: false
    },

    /**
     * Get configuration value
     * @param {string} path - Dot notation path (e.g., 'api.baseURL')
     * @returns {*}
     */
    get(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this);
    },

    /**
     * Set configuration value
     * @param {string} path - Dot notation path
     * @param {*} value - Value to set
     */
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => obj[key], this);
        target[lastKey] = value;
    },

    /**
     * Load user preferences from localStorage
     */
    loadPreferences() {
        try {
            const prefs = localStorage.getItem('userPreferences');
            if (prefs) {
                const parsed = JSON.parse(prefs);
                
                // Merge preferences
                if (parsed.ui) {
                    this.ui = { ...this.ui, ...parsed.ui };
                }
                if (parsed.notifications) {
                    this.notifications = { ...this.notifications, ...parsed.notifications };
                }
                if (parsed.webrtc) {
                    this.webrtc.audio = { ...this.webrtc.audio, ...parsed.webrtc.audio };
                    this.webrtc.video = { ...this.webrtc.video, ...parsed.webrtc.video };
                }
            }
        } catch (error) {
            console.error('Failed to load user preferences:', error);
        }
    },

    /**
     * Save user preferences to localStorage
     */
    savePreferences() {
        try {
            const prefs = {
                ui: this.ui,
                notifications: this.notifications,
                webrtc: {
                    audio: this.webrtc.audio,
                    video: this.webrtc.video
                }
            };
            localStorage.setItem('userPreferences', JSON.stringify(prefs));
        } catch (error) {
            console.error('Failed to save user preferences:', error);
        }
    }
};

// Load preferences on initialization
config.loadPreferences();

// Make available globally
window.appConfig = config;
