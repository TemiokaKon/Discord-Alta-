// Alta52 - Call Modal Window (Discord Style)
// Modern modal for voice/video calls with participant management

class CallModal {
    constructor() {
        this.modal = null;
        this.participants = new Map();
        this.localStream = null;
        this.isVideoEnabled = true;
        this.isAudioEnabled = true;
        this.isScreenSharing = false;
        this.callStartTime = null;
        this.timerInterval = null;
    }

    /**
     * Show call modal
     * @param {Object} options - Call options
     * @param {string} options.channelName - Channel or user name
     * @param {string} options.type - 'voice' or 'video'
     * @param {MediaStream} options.localStream - Local media stream
     */
    show(options) {
        const {
            channelName = 'Call',
            type = 'voice',
            localStream = null
        } = options;

        this.localStream = localStream;
        this.isVideoEnabled = type === 'video';

        // Create modal if it doesn't exist
        if (!this.modal) {
            this.createModal();
        }

        // Update channel name
        const channelNameEl = this.modal.querySelector('.call-modal-channel-name');
        if (channelNameEl) {
            channelNameEl.textContent = channelName;
        }

        // Set up local video
        if (localStream) {
            const localVideo = this.modal.querySelector('#callModalLocalVideo');
            if (localVideo) {
                localVideo.srcObject = localStream;
            }
        }

        // Show modal
        this.modal.classList.remove('hidden');
        this.modal.classList.add('call-modal-show');

        // Start call timer
        this.startTimer();

        // Update button states
        this.updateButtonStates();
    }

    /**
     * Hide call modal
     */
    hide() {
        if (!this.modal) return;

        this.modal.classList.remove('call-modal-show');
        this.modal.classList.add('call-modal-hide');

        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.modal.classList.remove('call-modal-hide');
        }, 300);

        // Stop timer
        this.stopTimer();

        // Clear participants
        this.participants.clear();
        this.updateParticipantsGrid();
    }

    /**
     * Create modal DOM structure
     */
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'call-modal hidden';
        this.modal.innerHTML = `
            <div class="call-modal-container">
                <!-- Header -->
                <div class="call-modal-header">
                    <div class="call-modal-info">
                        <div class="call-modal-channel-name">Voice Call</div>
                        <div class="call-modal-timer">00:00</div>
                    </div>
                    <button class="call-modal-close" id="callModalClose" title="Leave Call">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21.1038 2.88698L19.6896 1.47276L12.0001 9.16226L4.31059 1.47276L2.89637 2.88698L10.5859 10.5765L2.89637 18.266L4.31059 19.6802L12.0001 11.9907L19.6896 19.6802L21.1038 18.266L13.4143 10.5765L21.1038 2.88698Z"/>
                        </svg>
                    </button>
                </div>

                <!-- Participants Grid -->
                <div class="call-modal-participants" id="callModalParticipants">
                    <!-- Local participant -->
                    <div class="call-participant call-participant-local">
                        <video id="callModalLocalVideo" autoplay muted playsinline></video>
                        <div class="call-participant-info">
                            <div class="call-participant-avatar">You</div>
                            <div class="call-participant-name">You</div>
                            <div class="call-participant-status"></div>
                        </div>
                    </div>
                </div>

                <!-- Controls -->
                <div class="call-modal-controls">
                    <button class="call-control-button" id="callModalMicBtn" title="Toggle Microphone">
                        <svg class="icon-mic-on" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C10.896 2 10 2.896 10 4V12C10 13.105 10.896 14 12 14C13.105 14 14 13.105 14 12V4C14 2.896 13.105 2 12 2Z"/>
                            <path d="M7 11C7 8.243 9.243 6 12 6C14.757 6 17 8.243 17 11V12C17 14.757 14.757 17 12 17C9.243 17 7 14.757 7 12V11Z" fill="none" stroke="currentColor" stroke-width="2"/>
                            <path d="M12 19V22M8 22H16" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        <svg class="icon-mic-off hidden" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C10.896 2 10 2.896 10 4V12C10 13.105 10.896 14 12 14C13.105 14 14 13.105 14 12V4C14 2.896 13.105 2 12 2Z"/>
                            <path d="M7 11C7 8.243 9.243 6 12 6C14.757 6 17 8.243 17 11V12C17 14.757 14.757 17 12 17C9.243 17 7 14.757 7 12V11Z" fill="none" stroke="currentColor" stroke-width="2"/>
                            <path d="M12 19V22M8 22H16" stroke="currentColor" stroke-width="2"/>
                            <line x1="4" y1="4" x2="20" y2="20" stroke="#f04747" stroke-width="3"/>
                        </svg>
                    </button>

                    <button class="call-control-button" id="callModalVideoBtn" title="Toggle Camera">
                        <svg class="icon-video-on" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21.526 8.149C21.231 7.966 20.862 7.951 20.553 8.105L18 9.382V7C18 5.897 17.103 5 16 5H4C2.897 5 2 5.897 2 7V17C2 18.104 2.897 19 4 19H16C17.103 19 18 18.104 18 17V14.618L20.553 15.894C20.694 15.965 20.847 16 21 16C21.183 16 21.365 15.949 21.526 15.851C21.82 15.668 22 15.347 22 15V9C22 8.653 21.82 8.332 21.526 8.149Z"/>
                        </svg>
                        <svg class="icon-video-off hidden" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21.526 8.149C21.231 7.966 20.862 7.951 20.553 8.105L18 9.382V7C18 5.897 17.103 5 16 5H4C2.897 5 2 5.897 2 7V17C2 18.104 2.897 19 4 19H16C17.103 19 18 18.104 18 17V14.618L20.553 15.894C20.694 15.965 20.847 16 21 16C21.183 16 21.365 15.949 21.526 15.851C21.82 15.668 22 15.347 22 15V9C22 8.653 21.82 8.332 21.526 8.149Z"/>
                            <line x1="2" y1="2" x2="22" y2="22" stroke="#f04747" stroke-width="3"/>
                        </svg>
                    </button>

                    <button class="call-control-button" id="callModalScreenBtn" title="Share Screen">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2 4.5C2 3.397 2.897 2.5 4 2.5H20C21.103 2.5 22 3.397 22 4.5V15.5C22 16.604 21.103 17.5 20 17.5H13V19.5H17V21.5H7V19.5H11V17.5H4C2.897 17.5 2 16.604 2 15.5V4.5ZM13.2 14.3L11 11.6L9.3 13.7L8.2 12.3L10 10L8.2 7.7L9.3 6.3L11 8.4L12.7 6.3L13.8 7.7L12 10L13.8 12.3L12.7 13.7L13.2 14.3Z"/>
                        </svg>
                    </button>

                    <button class="call-control-button call-control-settings" id="callModalSettingsBtn" title="Call Settings">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M19.738 10H22V14H19.739C19.498 14.931 19.1 15.798 18.565 16.564L20 18L18 20L16.565 18.564C15.797 19.099 14.932 19.498 14 19.738V22H10V19.738C9.069 19.498 8.203 19.099 7.436 18.564L6 20L4 18L5.436 16.564C4.901 15.799 4.502 14.932 4.262 14H2V10H4.262C4.502 9.068 4.9 8.202 5.436 7.436L4 6L6 4L7.436 5.436C8.202 4.9 9.068 4.502 10 4.262V2H14V4.261C14.932 4.502 15.797 4.9 16.565 5.435L18 3.999L20 5.999L18.564 7.436C19.099 8.202 19.498 9.069 19.738 10ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"/>
                        </svg>
                    </button>

                    <button class="call-control-button call-control-disconnect" id="callModalDisconnectBtn" title="Disconnect">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21.1038 2.88698L19.6896 1.47276L12.0001 9.16226L4.31059 1.47276L2.89637 2.88698L10.5859 10.5765L2.89637 18.266L4.31059 19.6802L12.0001 11.9907L19.6896 19.6802L21.1038 18.266L13.4143 10.5765L21.1038 2.88698Z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);

        // Add event listeners
        this.attachEventListeners();
    }

    /**
     * Attach event listeners to modal elements
     */
    attachEventListeners() {
        const closeBtn = this.modal.querySelector('#callModalClose');
        const disconnectBtn = this.modal.querySelector('#callModalDisconnectBtn');
        const micBtn = this.modal.querySelector('#callModalMicBtn');
        const videoBtn = this.modal.querySelector('#callModalVideoBtn');
        const screenBtn = this.modal.querySelector('#callModalScreenBtn');
        const settingsBtn = this.modal.querySelector('#callModalSettingsBtn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.onDisconnect());
        }

        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => this.onDisconnect());
        }

        if (micBtn) {
            micBtn.addEventListener('click', () => this.toggleMicrophone());
        }

        if (videoBtn) {
            videoBtn.addEventListener('click', () => this.toggleCamera());
        }

        if (screenBtn) {
            screenBtn.addEventListener('click', () => this.toggleScreenShare());
        }

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettings());
        }
    }

    /**
     * Toggle microphone
     */
    toggleMicrophone() {
        this.isAudioEnabled = !this.isAudioEnabled;
        
        if (this.localStream) {
            const audioTracks = this.localStream.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = this.isAudioEnabled;
            });
        }

        this.updateButtonStates();
        
        // Emit event for other participants
        if (typeof socket !== 'undefined' && socket) {
            socket.emit('audio-toggle', { enabled: this.isAudioEnabled });
        }
    }

    /**
     * Toggle camera
     */
    toggleCamera() {
        this.isVideoEnabled = !this.isVideoEnabled;
        
        if (this.localStream) {
            const videoTracks = this.localStream.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = this.isVideoEnabled;
            });
        }

        this.updateButtonStates();
        
        // Emit event for other participants
        if (typeof socket !== 'undefined' && socket) {
            socket.emit('video-toggle', { enabled: this.isVideoEnabled });
        }
    }

    /**
     * Toggle screen share
     */
    async toggleScreenShare() {
        if (!this.isScreenSharing) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        cursor: 'always',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        frameRate: { ideal: 60 }
                    }
                });

                this.isScreenSharing = true;
                
                // Replace video track
                const videoTrack = screenStream.getVideoTracks()[0];
                
                // Emit screen share start
                if (typeof socket !== 'undefined' && socket) {
                    socket.emit('screen-share-start', { track: videoTrack });
                }

                // Handle screen share stop
                videoTrack.onended = () => {
                    this.isScreenSharing = false;
                    this.updateButtonStates();
                    
                    if (typeof socket !== 'undefined' && socket) {
                        socket.emit('screen-share-stop');
                    }
                };

                this.updateButtonStates();
            } catch (error) {
                console.error('Error sharing screen:', error);
                if (typeof toast !== 'undefined') {
                    toast.error('Screen Share Failed', 'Could not start screen sharing');
                }
            }
        } else {
            this.isScreenSharing = false;
            this.updateButtonStates();
            
            if (typeof socket !== 'undefined' && socket) {
                socket.emit('screen-share-stop');
            }
        }
    }

    /**
     * Open settings
     */
    openSettings() {
        // Open settings modal
        if (typeof settingsModal !== 'undefined') {
            settingsModal.show('voice');
        }
    }

    /**
     * Handle disconnect
     */
    onDisconnect() {
        this.hide();
        
        // Stop all tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }

        // Emit disconnect event
        if (typeof socket !== 'undefined' && socket) {
            socket.emit('call-disconnect');
        }

        // Show notification
        if (typeof toast !== 'undefined') {
            toast.info('Call Ended', 'You left the call');
        }
    }

    /**
     * Update button states
     */
    updateButtonStates() {
        const micBtn = this.modal.querySelector('#callModalMicBtn');
        const videoBtn = this.modal.querySelector('#callModalVideoBtn');
        const screenBtn = this.modal.querySelector('#callModalScreenBtn');

        if (micBtn) {
            const micOnIcon = micBtn.querySelector('.icon-mic-on');
            const micOffIcon = micBtn.querySelector('.icon-mic-off');
            
            if (this.isAudioEnabled) {
                micOnIcon.classList.remove('hidden');
                micOffIcon.classList.add('hidden');
                micBtn.classList.remove('call-control-muted');
            } else {
                micOnIcon.classList.add('hidden');
                micOffIcon.classList.remove('hidden');
                micBtn.classList.add('call-control-muted');
            }
        }

        if (videoBtn) {
            const videoOnIcon = videoBtn.querySelector('.icon-video-on');
            const videoOffIcon = videoBtn.querySelector('.icon-video-off');
            
            if (this.isVideoEnabled) {
                videoOnIcon.classList.remove('hidden');
                videoOffIcon.classList.add('hidden');
                videoBtn.classList.remove('call-control-muted');
            } else {
                videoOnIcon.classList.add('hidden');
                videoOffIcon.classList.remove('hidden');
                videoBtn.classList.add('call-control-muted');
            }
        }

        if (screenBtn) {
            if (this.isScreenSharing) {
                screenBtn.classList.add('call-control-active');
            } else {
                screenBtn.classList.remove('call-control-active');
            }
        }
    }

    /**
     * Add participant to call
     * @param {Object} participant - Participant data
     */
    addParticipant(participant) {
        const { id, username, avatar, stream } = participant;
        
        if (this.participants.has(id)) {
            return; // Participant already exists
        }

        this.participants.set(id, participant);
        this.updateParticipantsGrid();
    }

    /**
     * Remove participant from call
     * @param {string} participantId - Participant ID
     */
    removeParticipant(participantId) {
        this.participants.delete(participantId);
        this.updateParticipantsGrid();
    }

    /**
     * Update participants grid
     */
    updateParticipantsGrid() {
        const grid = this.modal.querySelector('#callModalParticipants');
        if (!grid) return;

        // Clear existing remote participants (keep local)
        const remoteParticipants = grid.querySelectorAll('.call-participant:not(.call-participant-local)');
        remoteParticipants.forEach(p => p.remove());

        // Add participants
        this.participants.forEach((participant, id) => {
            const participantEl = document.createElement('div');
            participantEl.className = 'call-participant';
            participantEl.dataset.participantId = id;
            
            participantEl.innerHTML = `
                <video autoplay playsinline></video>
                <div class="call-participant-info">
                    <div class="call-participant-avatar">${participant.avatar || participant.username[0]}</div>
                    <div class="call-participant-name">${participant.username}</div>
                    <div class="call-participant-status"></div>
                </div>
            `;

            // Set video stream
            if (participant.stream) {
                const video = participantEl.querySelector('video');
                video.srcObject = participant.stream;
            }

            grid.appendChild(participantEl);
        });

        // Update grid columns based on participant count
        const totalParticipants = this.participants.size + 1; // +1 for local
        if (totalParticipants === 1) {
            grid.style.gridTemplateColumns = '1fr';
        } else if (totalParticipants === 2) {
            grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else if (totalParticipants <= 4) {
            grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else {
            grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        }
    }

    /**
     * Update participant status (speaking, muted, etc.)
     * @param {string} participantId - Participant ID
     * @param {Object} status - Status object
     */
    updateParticipantStatus(participantId, status) {
        const participantEl = this.modal.querySelector(`[data-participant-id="${participantId}"]`);
        if (!participantEl) return;

        const statusEl = participantEl.querySelector('.call-participant-status');
        if (!statusEl) return;

        statusEl.innerHTML = '';

        if (status.speaking) {
            const speakingIcon = document.createElement('span');
            speakingIcon.className = 'status-speaking';
            speakingIcon.textContent = '🔊';
            statusEl.appendChild(speakingIcon);
        }

        if (status.muted) {
            const mutedIcon = document.createElement('span');
            mutedIcon.className = 'status-muted';
            mutedIcon.textContent = '🔇';
            statusEl.appendChild(mutedIcon);
        }

        if (status.videoOff) {
            const videoOffIcon = document.createElement('span');
            videoOffIcon.className = 'status-video-off';
            videoOffIcon.textContent = '📹';
            statusEl.appendChild(videoOffIcon);
        }
    }

    /**
     * Start call timer
     */
    startTimer() {
        this.callStartTime = Date.now();
        this.updateTimer();
        
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);
    }

    /**
     * Stop call timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Update timer display
     */
    updateTimer() {
        if (!this.callStartTime) return;

        const elapsed = Math.floor((Date.now() - this.callStartTime) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;

        const timerEl = this.modal.querySelector('.call-modal-timer');
        if (timerEl) {
            if (hours > 0) {
                timerEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
                timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }
    }
}

// Create global instance
window.callModal = new CallModal();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CallModal;
}
