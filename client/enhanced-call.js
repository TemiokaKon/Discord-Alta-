/**
 * Enhanced WebRTC Call Manager
 * Manages voice/video calls with improved UI, audio processing, and participant tracking
 */

class EnhancedCallManager {
    constructor() {
        this.localStream = null;
        this.screenStream = null;
        this.peerConnections = new Map();
        this.participants = new Map();
        this.currentCall = null;
        
        this.isAudioEnabled = true;
        this.isVideoEnabled = false;
        this.isScreenSharing = false;
        this.isSpeaking = false;
        
        this.activeSpeaker = null;
        this.audioContext = null;
        this.audioAnalyzers = new Map();
        
        // Audio processing nodes
        this.audioProcessing = {
            sourceNode: null,
            gainNode: null,
            compressorNode: null,
            destinationNode: null,
            processedStream: null
        };
        
        this.settings = this.getDefaultSettings();
        this.loadSettings();
        
        this.config = window.appConfig?.webrtc || {
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        };
    }

    /**
     * Get default settings
     */
    getDefaultSettings() {
        return {
            voice: {
                inputDevice: 'default',
                outputDevice: 'default',
                inputVolume: 100,
                outputVolume: 100,
                inputGain: 100,
                noiseSuppression: true,
                echoCancellation: true,
                autoGainControl: true,
                micMonitor: false,
                micMonitorVolume: 20
            },
            video: {
                device: 'default',
                quality: '720p'
            },
            screen: {
                quality: '1080p',
                includeAudio: false
            }
        };
    }

    /**
     * Load settings from localStorage and server
     */
    async loadSettings() {
        try {
            // Load from localStorage first
            const userId = currentUser?.id;
            if (userId) {
                const localKey = `userSettings_${userId}`;
                const localSettings = localStorage.getItem(localKey);
                if (localSettings) {
                    this.settings = { ...this.settings, ...JSON.parse(localSettings) };
                }
            }

            // Sync with server if authenticated
            const token = localStorage.getItem('token');
            if (token) {
                const response = await fetch('/api/v1/users/me/settings', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data.settings) {
                        this.settings = { ...this.settings, ...data.data.settings };
                        this.saveSettingsLocal();
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettingsLocal() {
        try {
            const userId = currentUser?.id;
            if (userId) {
                const localKey = `userSettings_${userId}`;
                localStorage.setItem(localKey, JSON.stringify(this.settings));
            }
        } catch (error) {
            console.error('Failed to save settings locally:', error);
        }
    }

    /**
     * Save settings to server
     */
    async saveSettings(newSettings) {
        try {
            this.settings = { ...this.settings, ...newSettings };
            this.saveSettingsLocal();

            const token = localStorage.getItem('token');
            if (token) {
                await fetch('/api/v1/users/me/settings', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.settings)
                });
            }
        } catch (error) {
            console.error('Failed to save settings to server:', error);
        }
    }

    /**
     * Get audio constraints based on settings
     */
    getAudioConstraints() {
        return {
            deviceId: this.settings.voice.inputDevice !== 'default' 
                ? { exact: this.settings.voice.inputDevice } 
                : undefined,
            echoCancellation: this.settings.voice.echoCancellation,
            noiseSuppression: this.settings.voice.noiseSuppression,
            autoGainControl: this.settings.voice.autoGainControl
        };
    }

    /**
     * Get video constraints based on settings
     */
    getVideoConstraints() {
        const quality = this.settings.video.quality || '720p';
        const constraints = {
            deviceId: this.settings.video.device !== 'default'
                ? { exact: this.settings.video.device }
                : undefined
        };

        switch (quality) {
            case '1080p':
                constraints.width = { ideal: 1920 };
                constraints.height = { ideal: 1080 };
                break;
            case '720p':
                constraints.width = { ideal: 1280 };
                constraints.height = { ideal: 720 };
                break;
            case '480p':
                constraints.width = { ideal: 854 };
                constraints.height = { ideal: 480 };
                break;
            default:
                constraints.width = { ideal: 1280 };
                constraints.height = { ideal: 720 };
        }

        return constraints;
    }

    /**
     * Setup audio processing pipeline
     */
    setupAudioProcessing() {
        if (!this.localStream || !this.isAudioEnabled) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            const audioTrack = this.localStream.getAudioTracks()[0];
            const tempStream = new MediaStream([audioTrack]);
            
            // Create nodes
            this.audioProcessing.sourceNode = this.audioContext.createMediaStreamSource(tempStream);
            this.audioProcessing.gainNode = this.audioContext.createGain();
            this.audioProcessing.compressorNode = this.audioContext.createDynamicsCompressor();
            this.audioProcessing.destinationNode = this.audioContext.createMediaStreamDestination();

            // Configure gain
            const gainValue = (this.settings.voice.inputGain || 100) / 100;
            this.audioProcessing.gainNode.gain.value = gainValue;

            // Configure compressor for light compression
            this.audioProcessing.compressorNode.threshold.value = -50;
            this.audioProcessing.compressorNode.knee.value = 40;
            this.audioProcessing.compressorNode.ratio.value = 12;
            this.audioProcessing.compressorNode.attack.value = 0.003;
            this.audioProcessing.compressorNode.release.value = 0.25;

            // Connect nodes
            this.audioProcessing.sourceNode
                .connect(this.audioProcessing.gainNode)
                .connect(this.audioProcessing.compressorNode)
                .connect(this.audioProcessing.destinationNode);

            // Replace audio track in local stream
            const processedAudioTrack = this.audioProcessing.destinationNode.stream.getAudioTracks()[0];
            
            // Update all peer connections with processed audio
            this.peerConnections.forEach((pc) => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'audio');
                if (sender) {
                    sender.replaceTrack(processedAudioTrack);
                }
            });

            this.audioProcessing.processedStream = this.audioProcessing.destinationNode.stream;
            
        } catch (error) {
            console.error('Failed to setup audio processing:', error);
        }
    }

    /**
     * Update audio settings live
     */
    updateAudioSettings(settings) {
        if (!this.audioProcessing.gainNode) {
            this.saveSettings({ voice: { ...this.settings.voice, ...settings } });
            return;
        }

        // Update gain
        if (settings.inputGain !== undefined) {
            const gainValue = settings.inputGain / 100;
            this.audioProcessing.gainNode.gain.value = gainValue;
            this.settings.voice.inputGain = settings.inputGain;
        }

        // For constraint changes, need to reacquire stream
        const constraintChanged = settings.echoCancellation !== undefined ||
                                 settings.noiseSuppression !== undefined ||
                                 settings.autoGainControl !== undefined;

        if (constraintChanged) {
            this.saveSettings({ voice: { ...this.settings.voice, ...settings } });
            this.reacquireAudioStream();
        } else {
            this.saveSettings({ voice: { ...this.settings.voice, ...settings } });
        }
    }

    /**
     * Reacquire audio stream with new constraints
     */
    async reacquireAudioStream() {
        if (!this.currentCall) return;

        try {
            // Stop old audio tracks
            if (this.localStream) {
                this.localStream.getAudioTracks().forEach(track => track.stop());
            }

            // Get new audio stream with updated constraints
            const constraints = {
                audio: this.getAudioConstraints(),
                video: false
            };

            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            const newAudioTrack = newStream.getAudioTracks()[0];

            // Update local stream
            const oldAudioTrack = this.localStream.getAudioTracks()[0];
            if (oldAudioTrack) {
                this.localStream.removeTrack(oldAudioTrack);
            }
            this.localStream.addTrack(newAudioTrack);

            // Recreate audio processing
            if (this.audioProcessing.sourceNode) {
                this.audioProcessing.sourceNode.disconnect();
            }
            this.setupAudioProcessing();

        } catch (error) {
            console.error('Failed to reacquire audio stream:', error);
            this.showError('Failed to update audio settings');
        }
    }

    /**
     * Start a call
     * @param {Object} options - Call options
     */
    async startCall(options = {}) {
        const { channelId, channelName, type = 'voice' } = options;
        
        try {
            // Get user media with settings-based constraints
            const constraints = {
                audio: this.getAudioConstraints(),
                video: type === 'video' ? this.getVideoConstraints() : false
            };
            
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.isVideoEnabled = type === 'video';
            this.isAudioEnabled = true;
            
            // Setup audio processing pipeline
            this.setupAudioProcessing();
            
            // Setup audio analysis for speaking detection
            this.setupAudioAnalysis();
            
            // Update UI
            this.updateCallInterface({
                channelId,
                channelName: channelName || window.i18n?.t('calling') || 'Voice Call',
                type
            });
            
            this.currentCall = { channelId, channelName, type };
            
            // Notify listeners
            this.emit('call-started', this.currentCall);
            
            return this.localStream;
        } catch (error) {
            console.error('Failed to start call:', error);
            this.showError(window.i18n?.t('errorPermission') || 'Permission denied');
            throw error;
        }
    }

    /**
     * Setup audio analysis for speaking detection
     */
    setupAudioAnalysis() {
        if (!this.localStream) return;
        
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (!audioTrack) return;
            
            const tempStream = new MediaStream([audioTrack]);
            const source = this.audioContext.createMediaStreamSource(tempStream);
            const analyzer = this.audioContext.createAnalyser();
            
            analyzer.fftSize = 256;
            source.connect(analyzer);
            
            const dataArray = new Uint8Array(analyzer.frequencyBinCount);
            
            const detectSpeaking = () => {
                if (!this.localStream) return;
                
                analyzer.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                
                const wasSpeaking = this.isSpeaking;
                this.isSpeaking = average > 30; // Threshold for speaking detection
                
                if (wasSpeaking !== this.isSpeaking) {
                    this.updateParticipantStatus('local', {
                        speaking: this.isSpeaking
                    });
                    
                    // Notify via socket if in a call
                    if (this.currentCall && socket) {
                        socket.emit('media-state', {
                            channelId: this.currentCall.channelId,
                            state: {
                                audio: this.isAudioEnabled,
                                video: this.isVideoEnabled,
                                speaking: this.isSpeaking
                            }
                        });
                    }
                }
                
                requestAnimationFrame(detectSpeaking);
            };
            
            detectSpeaking();
        } catch (error) {
            console.error('Failed to setup audio analysis:', error);
        }
    }

    /**
     * Toggle audio
     */
    toggleAudio() {
        if (!this.localStream) return;
        
        this.isAudioEnabled = !this.isAudioEnabled;
        this.localStream.getAudioTracks().forEach(track => {
            track.enabled = this.isAudioEnabled;
        });
        
        this.updateParticipantStatus('local', {
            audioEnabled: this.isAudioEnabled
        });
        
        // Notify via socket
        if (this.currentCall && socket) {
            socket.emit('media-state', {
                channelId: this.currentCall.channelId,
                state: {
                    audio: this.isAudioEnabled,
                    video: this.isVideoEnabled,
                    screen: this.isScreenSharing
                }
            });
        }
        
        this.emit('audio-toggled', this.isAudioEnabled);
    }

    /**
     * Toggle video
     */
    toggleVideo() {
        if (!this.localStream) return;
        
        this.isVideoEnabled = !this.isVideoEnabled;
        this.localStream.getVideoTracks().forEach(track => {
            track.enabled = this.isVideoEnabled;
        });
        
        this.updateParticipantStatus('local', {
            videoEnabled: this.isVideoEnabled
        });
        
        // Notify via socket
        if (this.currentCall && socket) {
            socket.emit('media-state', {
                channelId: this.currentCall.channelId,
                state: {
                    audio: this.isAudioEnabled,
                    video: this.isVideoEnabled,
                    screen: this.isScreenSharing
                }
            });
        }
        
        this.emit('video-toggled', this.isVideoEnabled);
    }

    /**
     * Start screen sharing with quality settings
     */
    async startScreenShare() {
        try {
            const quality = this.settings.screen.quality || '1080p';
            const includeAudio = this.settings.screen.includeAudio || false;
            
            const constraints = {
                video: {
                    cursor: 'always'
                }
            };

            // Set quality constraints
            switch (quality) {
                case '4k':
                    constraints.video.width = { ideal: 3840 };
                    constraints.video.height = { ideal: 2160 };
                    break;
                case '1080p':
                    constraints.video.width = { ideal: 1920 };
                    constraints.video.height = { ideal: 1080 };
                    break;
                case '720p':
                    constraints.video.width = { ideal: 1280 };
                    constraints.video.height = { ideal: 720 };
                    break;
                default:
                    constraints.video.width = { ideal: 1920 };
                    constraints.video.height = { ideal: 1080 };
            }

            // Try to include system audio if supported and enabled
            if (includeAudio) {
                constraints.audio = true;
            }
            
            this.screenStream = await navigator.mediaDevices.getDisplayMedia(constraints);
            
            // Check if audio was actually captured
            const audioTracks = this.screenStream.getAudioTracks();
            if (includeAudio && audioTracks.length === 0) {
                console.log('System audio was requested but not captured - browser may not support it');
            }
            
            this.isScreenSharing = true;
            
            // Replace video track in peer connections
            const screenTrack = this.screenStream.getVideoTracks()[0];
            
            // Use async replaceTrack to handle potential errors
            const replacePromises = [];
            this.peerConnections.forEach((pc) => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    const promise = sender.replaceTrack(screenTrack).catch(err => {
                        console.error('Failed to replace video track:', err);
                    });
                    replacePromises.push(promise);
                }
            });
            
            await Promise.all(replacePromises);
            
            // Handle screen share stop (when user clicks "Stop sharing" in browser UI)
            screenTrack.onended = () => {
                this.stopScreenShare();
            };
            
            // Notify via socket
            if (this.currentCall && socket) {
                socket.emit('screen-share-start', {
                    channelId: this.currentCall.channelId
                });
            }
            
            this.emit('screen-share-started');
        } catch (error) {
            console.error('Failed to start screen sharing:', error);
            this.showError(window.i18n?.t('errorPermission') || 'Screen share permission denied');
        }
    }

    /**
     * Stop screen sharing and restore camera
     */
    async stopScreenShare() {
        if (!this.screenStream) return;
        
        // Stop screen tracks
        this.screenStream.getTracks().forEach(track => track.stop());
        this.screenStream = null;
        this.isScreenSharing = false;
        
        // Restore camera video track if video was enabled
        const replacePromises = [];
        if (this.localStream && this.isVideoEnabled) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            
            this.peerConnections.forEach((pc) => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender && videoTrack) {
                    const promise = sender.replaceTrack(videoTrack).catch(err => {
                        console.error('Failed to restore camera track:', err);
                    });
                    replacePromises.push(promise);
                }
            });
        } else {
            // If video was disabled, replace with null to stop sending video
            this.peerConnections.forEach((pc) => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    const promise = sender.replaceTrack(null).catch(err => {
                        console.error('Failed to stop video track:', err);
                    });
                    replacePromises.push(promise);
                }
            });
        }
        
        await Promise.all(replacePromises);
        
        // Notify via socket
        if (this.currentCall && socket) {
            socket.emit('screen-share-stop', {
                channelId: this.currentCall.channelId
            });
        }
        
        this.emit('screen-share-stopped');
    }

    /**
     * Add participant
     * @param {string} userId - User ID
     * @param {Object} userData - User data
     */
    addParticipant(userId, userData) {
        this.participants.set(userId, {
            id: userId,
            name: userData.name || 'User',
            avatar: userData.avatar || '',
            audioEnabled: true,
            videoEnabled: false,
            speaking: false,
            ...userData
        });
        
        this.updateParticipantsUI();
        this.emit('participant-added', userId);
    }

    /**
     * Remove participant
     */
    removeParticipant(userId) {
        this.participants.delete(userId);
        this.peerConnections.delete(userId);
        
        this.updateParticipantsUI();
        this.emit('participant-removed', userId);
    }

    /**
     * Update participant status
     */
    updateParticipantStatus(userId, status) {
        const participant = userId === 'local' 
            ? { audioEnabled: this.isAudioEnabled, videoEnabled: this.isVideoEnabled, speaking: this.isSpeaking }
            : this.participants.get(userId);
        
        if (userId === 'local') {
            Object.assign(participant, status);
        } else if (participant) {
            Object.assign(participant, status);
            this.participants.set(userId, participant);
        }
        
        this.updateParticipantUI(userId);
        
        // Update active speaker
        if (status.speaking) {
            this.activeSpeaker = userId;
        } else if (this.activeSpeaker === userId) {
            this.activeSpeaker = null;
        }
    }

    /**
     * Update call interface
     */
    updateCallInterface(callData) {
        const callInterface = document.getElementById('callInterface');
        if (!callInterface) return;
        
        callInterface.classList.remove('hidden');
        
        const channelName = callInterface.querySelector('.call-channel-name');
        if (channelName) {
            channelName.textContent = callData.channelName;
        }
        
        // Setup local video
        const localVideo = document.getElementById('localVideo');
        if (localVideo && this.localStream) {
            localVideo.srcObject = this.localStream;
        }
    }

    /**
     * Update participants UI
     */
    updateParticipantsUI() {
        const container = document.getElementById('remoteParticipants');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.participants.forEach((participant, userId) => {
            const participantEl = this.createParticipantElement(userId, participant);
            container.appendChild(participantEl);
        });
    }

    /**
     * Create participant element
     */
    createParticipantElement(userId, participant) {
        const div = document.createElement('div');
        div.className = 'participant';
        div.id = `participant-${userId}`;
        
        if (participant.speaking) {
            div.classList.add('speaking');
        }
        
        div.innerHTML = `
            <video id="remote-${userId}" autoplay playsinline ${participant.videoEnabled ? '' : 'style="display:none"'}></video>
            <div class="participant-avatar ${participant.videoEnabled ? 'hidden' : ''}">${participant.avatar || participant.name.charAt(0)}</div>
            <div class="participant-info">
                <div class="participant-name">${participant.name}</div>
                <div class="participant-status">
                    ${participant.audioEnabled ? '' : '<span class="muted-indicator">🔇</span>'}
                    ${participant.speaking ? '<span class="speaking-indicator">🎤</span>' : ''}
                </div>
            </div>
        `;
        
        return div;
    }

    /**
     * Update single participant UI
     */
    updateParticipantUI(userId) {
        const participant = userId === 'local' ? null : this.participants.get(userId);
        const element = document.getElementById(`participant-${userId}`);
        
        if (!element) return;
        
        if (participant?.speaking) {
            element.classList.add('speaking');
        } else {
            element.classList.remove('speaking');
        }
    }

    /**
     * End call
     */
    endCall() {
        // Stop all tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
            this.screenStream = null;
        }
        
        // Close peer connections
        this.peerConnections.forEach(pc => pc.close());
        this.peerConnections.clear();
        
        // Clear participants
        this.participants.clear();
        
        // Stop audio context
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        // Hide UI
        const callInterface = document.getElementById('callInterface');
        if (callInterface) {
            callInterface.classList.add('hidden');
        }
        
        this.currentCall = null;
        this.emit('call-ended');
    }

    /**
     * Show error
     */
    showError(message) {
        if (window.toast) {
            window.toast.error(window.i18n?.t('error') || 'Error', message);
        } else {
            console.error(message);
        }
    }

    /**
     * Event system
     */
    listeners = new Map();
    
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }
}

// Initialize global instance
window.enhancedCallManager = new EnhancedCallManager();
