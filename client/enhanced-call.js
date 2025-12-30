/**
 * Enhanced WebRTC Call Manager
 * Manages voice/video calls with improved UI and participant tracking
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
        
        this.config = window.appConfig?.webrtc || {
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            },
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };
    }

    /**
     * Start a call
     * @param {Object} options - Call options
     */
    async startCall(options = {}) {
        const { channelId, channelName, type = 'voice' } = options;
        
        try {
            // Get user media
            const constraints = {
                audio: this.config.audio,
                video: type === 'video' ? this.config.video : false
            };
            
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.isVideoEnabled = type === 'video';
            
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
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioContext.createMediaStreamSource(this.localStream);
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
        
        this.emit('video-toggled', this.isVideoEnabled);
    }

    /**
     * Start screen sharing
     */
    async startScreenShare() {
        try {
            this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: this.config.screen
            });
            
            this.isScreenSharing = true;
            
            // Replace video track in peer connections
            const screenTrack = this.screenStream.getVideoTracks()[0];
            
            this.peerConnections.forEach((pc) => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    sender.replaceTrack(screenTrack);
                }
            });
            
            // Handle screen share stop
            screenTrack.onended = () => {
                this.stopScreenShare();
            };
            
            this.emit('screen-share-started');
        } catch (error) {
            console.error('Failed to start screen sharing:', error);
            this.showError(window.i18n?.t('errorPermission') || 'Screen share permission denied');
        }
    }

    /**
     * Stop screen sharing
     */
    stopScreenShare() {
        if (!this.screenStream) return;
        
        this.screenStream.getTracks().forEach(track => track.stop());
        this.screenStream = null;
        this.isScreenSharing = false;
        
        // Restore camera video track
        if (this.localStream && this.isVideoEnabled) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            
            this.peerConnections.forEach((pc) => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender && videoTrack) {
                    sender.replaceTrack(videoTrack);
                }
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
