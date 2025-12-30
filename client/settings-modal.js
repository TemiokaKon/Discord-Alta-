// Alta52 - Окно настроек с вкладками

class SettingsModal {
    constructor() {
        this.currentSettings = {
            profile: {},
            voice: {
                inputDevice: 'default',
                outputDevice: 'default',
                inputVolume: 100,
                outputVolume: 100,
                noiseSuppression: true,
                echoCancellation: true,
                autoGainControl: true,
                micMonitor: true,          // ✅ слышать себя в тесте
                micMonitorVolume: 20       // ✅ безопасно по умолчанию
            },
            notifications: {
                soundEnabled: true,
                messageSound: true,
                callSound: true,
                joinSound: true,
                leaveSound: true
            },
            video: {
                device: 'default',
                quality: '720p'
            }
        };

        this.micTestInterval = null;
        this.videoPreviewStream = null;

        // ✅ for mic test loopback
        this.micStream = null;
        this.micAudioContext = null;
        this.micMonitorGain = null;
        this.micAnalyser = null;
    }

    async show() {
        const modalContent = this.createSettingsContent();

        window.modalManager.show({
            title: 'Настройки пользователя',
            content: modalContent,
            width: '800px',
            closeOnOverlayClick: false,
            onClose: () => {
                this.cleanup();
            }
        });

        await this.loadCurrentSettings();
        this.initializeHandlers();
        this.showTab('profile');
    }

    createSettingsContent() {
        const container = document.createElement('div');
        container.innerHTML = `
            <div class="modal-tabs">
                <button class="modal-tab active" data-tab="profile">
                    <i class="fas fa-user"></i> Мой профиль
                </button>
                <button class="modal-tab" data-tab="voice">
                    <i class="fas fa-microphone"></i> Голос и видео
                </button>
                <button class="modal-tab" data-tab="notifications">
                    <i class="fas fa-bell"></i> Уведомления
                </button>
            </div>

            <div class="modal-tab-content active" data-content="profile">
                ${this.createProfileTab()}
            </div>

            <div class="modal-tab-content" data-content="voice">
                ${this.createVoiceTab()}
            </div>

            <div class="modal-tab-content" data-content="notifications">
                ${this.createNotificationsTab()}
            </div>
        `;

        return container;
    }

    createProfileTab() {
    const avatar = currentUser?.avatar;
        const avatarHtml =
            avatar && (typeof avatar === 'string') && (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('/uploads/'))
                ? `<img src="${avatar}" alt="Avatar">`
                : (avatar || currentUser?.username?.charAt(0).toUpperCase() || 'U');

        return `
            <div style="padding: 20px 0;">
                <div class="avatar-upload" id="avatarUpload">
                    <div class="avatar-preview" id="avatarPreview">
                        ${avatarHtml}
                    </div>
                    <div class="avatar-upload-overlay">
                        <i class="fas fa-camera avatar-upload-icon"></i>
                    </div>
                    <input type="file" id="avatarInput" accept="image/*">
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label">Никнейм</label>
                    <input type="text" class="modal-form-input" id="usernameInput"
                        value="${currentUser?.username || ''}" placeholder="Введите никнейм">
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label">Email</label>
                    <input type="email" class="modal-form-input" id="emailInput"
                        value="${currentUser?.email || ''}" placeholder="Введите email">
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label">Изменить пароль</label>
                    <input type="password" class="modal-form-input" id="oldPasswordInput"
                        placeholder="Текущий пароль" style="margin-bottom: 10px;">
                    <input type="password" class="modal-form-input" id="newPasswordInput"
                        placeholder="Новый пароль" style="margin-bottom: 10px;">
                    <input type="password" class="modal-form-input" id="confirmPasswordInput"
                        placeholder="Подтвердите новый пароль">
                    <button class="btn btn-secondary mt-2" id="changePasswordBtn">
                        Изменить пароль
                    </button>
                </div>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(224, 17, 95, 0.2);">
                    <button class="btn btn-primary" id="saveProfileBtn">
                        <i class="fas fa-save"></i> Сохранить изменения
                    </button>
                    <button class="btn btn-danger" id="logoutBtn" style="margin-left: 10px;">
                        <i class="fas fa-sign-out-alt"></i> Выйти
                    </button>
                </div>
            </div>
        `;
    }

    createVoiceTab() {
        return `
            <div style="padding: 20px 0;">
                <h3 style="margin-bottom: 16px; font-size: 18px;">Проверка микрофона</h3>
                <div class="device-preview" style="margin-bottom: 24px;">
                    <div class="modal-form-group">
                        <label class="modal-form-label">Устройство ввода</label>
                        <select class="modal-form-input" id="inputDeviceSelect">
                            <option value="default">По умолчанию</option>
                        </select>
                    </div>

                    <div class="mic-level-indicator">
                        <div class="mic-level-bar" id="micLevelBar"></div>
                    </div>

                    <div class="modal-form-group flex items-center justify-between" style="margin-top: 14px;">
                        <label class="modal-form-label" style="margin-bottom: 0;">Слышать себя (тест)</label>
                        <label class="toggle-switch">
                            <input type="checkbox" id="micMonitorToggle" checked>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <div class="slider-container" style="margin-top: 12px;">
                        <div class="slider-label">
                            <span>Громкость мониторинга</span>
                            <span class="slider-value" id="micMonitorValue">20%</span>
                        </div>
                        <input type="range" min="0" max="100" value="20" class="slider" id="micMonitorSlider">
                    </div>

                    <button class="btn btn-secondary mt-2" id="testMicBtn">
                        <i class="fas fa-microphone"></i> Тестировать микрофон
                    </button>

                    <p style="margin-top: 10px; font-size: 12px; color: rgba(255, 228, 236, 0.6);">
                        Внимание: если включены колонки, может появиться эхо. Рекомендуются наушники.
                    </p>
                </div>

                <h3 style="margin-bottom: 16px; font-size: 18px;">Проверка камеры</h3>
                <div class="device-preview" style="margin-bottom: 24px;">
                    <div class="modal-form-group">
                        <label class="modal-form-label">Устройство видео</label>
                        <select class="modal-form-input" id="videoDeviceSelect">
                            <option value="default">По умолчанию</option>
                        </select>
                    </div>

                    <div class="video-preview">
                        <video id="videoPreview" autoplay muted></video>
                        <div class="video-preview-placeholder" id="videoPlaceholder">
                            <i class="fas fa-video"></i>
                        </div>
                    </div>

                    <button class="btn btn-secondary mt-2" id="testVideoBtn">
                        <i class="fas fa-video"></i> Тестировать камеру
                    </button>
                </div>

                <h3 style="margin-bottom: 16px; font-size: 18px;">Настройки аудио</h3>

                <div class="modal-form-group flex items-center justify-between">
                    <label class="modal-form-label" style="margin-bottom: 0;">Шумоподавление</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="noiseSuppressionToggle" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>

                <div class="modal-form-group flex items-center justify-between">
                    <label class="modal-form-label" style="margin-bottom: 0;">Эхоподавление</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="echoCancellationToggle" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>

                <div class="modal-form-group flex items-center justify-between">
                    <label class="modal-form-label" style="margin-bottom: 0;">Автоусиление</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="autoGainControlToggle" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>

                <div class="slider-container">
                    <div class="slider-label">
                        <span>Громкость входа</span>
                        <span class="slider-value" id="inputVolumeValue">100%</span>
                    </div>
                    <input type="range" min="0" max="100" value="100" class="slider" id="inputVolumeSlider">
                </div>

                <div class="slider-container">
                    <div class="slider-label">
                        <span>Громкость выхода</span>
                        <span class="slider-value" id="outputVolumeValue">100%</span>
                    </div>
                    <input type="range" min="0" max="100" value="100" class="slider" id="outputVolumeSlider">
                </div>

                <h3 style="margin-top: 24px; margin-bottom: 16px; font-size: 18px;">Качество демонстрации экрана</h3>
                <div class="modal-form-group">
                    <label class="modal-form-label">Разрешение</label>
                    <select class="modal-form-input" id="screenQualitySelect">
                        <option value="720p">720p @ 60fps (HD)</option>
                        <option value="1080p">1080p @ 60fps (Full HD)</option>
                        <option value="1440p">1440p @ 60fps (2K)</option>
                    </select>
                </div>
            </div>
        `;
    }

    createNotificationsTab() {
        return `
            <div style="padding: 20px 0;">
                <h3 style="margin-bottom: 16px; font-size: 18px;">Звуковые уведомления</h3>

                <div class="modal-form-group flex items-center justify-between">
                    <label class="modal-form-label" style="margin-bottom: 0;">Включить звуки</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="soundEnabledToggle" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>

                <div class="modal-form-group flex items-center justify-between">
                    <label class="modal-form-label" style="margin-bottom: 0;">Звук новых сообщений</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="messageSoundToggle" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>

                <div class="modal-form-group flex items-center justify-between">
                    <label class="modal-form-label" style="margin-bottom: 0;">Звук входящих звонков</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="callSoundToggle" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>

                <div class="modal-form-group flex items-center justify-between">
                    <label class="modal-form-label" style="margin-bottom: 0;">Звук присоединения к звонку</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="joinSoundToggle" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>

                <div class="modal-form-group flex items-center justify-between">
                    <label class="modal-form-label" style="margin-bottom: 0;">Звук выхода из звонка</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="leaveSoundToggle" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>

                <h3 style="margin-top: 24px; margin-bottom: 16px; font-size: 18px;">Браузерные уведомления</h3>

                <div class="modal-form-group">
                    <button class="btn btn-secondary" id="requestNotificationBtn">
                        <i class="fas fa-bell"></i> Разрешить уведомления
                    </button>
                    <p style="margin-top: 10px; font-size: 13px; color: rgba(255, 228, 236, 0.6);">
                        Браузерные уведомления позволят вам получать оповещения, даже когда вкладка неактивна.
                    </p>
                </div>
            </div>
        `;
    }

    initializeHandlers() {
        document.querySelectorAll('.modal-tab').forEach(tab => {
            tab.addEventListener('click', () => this.showTab(tab.dataset.tab));
        });

        const saveProfileBtn = document.getElementById('saveProfileBtn');
        saveProfileBtn?.addEventListener('click', () => this.saveProfile());

        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn?.addEventListener('click', () => this.logout());

        const changePasswordBtn = document.getElementById('changePasswordBtn');
        changePasswordBtn?.addEventListener('click', () => this.changePassword());

        const avatarUpload = document.getElementById('avatarUpload');
        const avatarInput = document.getElementById('avatarInput');
        if (avatarUpload && avatarInput) {
            avatarUpload.addEventListener('click', () => avatarInput.click());
            avatarInput.addEventListener('change', (e) => this.handleAvatarUpload(e));
        }

        const testMicBtn = document.getElementById('testMicBtn');
        testMicBtn?.addEventListener('click', () => this.toggleMicTest());

        const testVideoBtn = document.getElementById('testVideoBtn');
        testVideoBtn?.addEventListener('click', () => this.toggleVideoTest());

        // voice sliders/toggles
        const inputVolumeSlider = document.getElementById('inputVolumeSlider');
        inputVolumeSlider?.addEventListener('input', (e) => {
            const v = parseInt(e.target.value, 10);
            document.getElementById('inputVolumeValue').textContent = v + '%';
            this.currentSettings.voice.inputVolume = v;
        });

        const outputVolumeSlider = document.getElementById('outputVolumeSlider');
        outputVolumeSlider?.addEventListener('input', (e) => {
            const v = parseInt(e.target.value, 10);
            document.getElementById('outputVolumeValue').textContent = v + '%';
            this.currentSettings.voice.outputVolume = v;
        });

        const micMonitorToggle = document.getElementById('micMonitorToggle');
        micMonitorToggle?.addEventListener('change', (e) => {
            this.currentSettings.voice.micMonitor = !!e.target.checked;
            this._applyMicMonitorState();
        });

        const micMonitorSlider = document.getElementById('micMonitorSlider');
        micMonitorSlider?.addEventListener('input', (e) => {
            const v = parseInt(e.target.value, 10);
            document.getElementById('micMonitorValue').textContent = v + '%';
            this.currentSettings.voice.micMonitorVolume = v;
            this._applyMicMonitorGain();
        });

        const noiseSuppressionToggle = document.getElementById('noiseSuppressionToggle');
        noiseSuppressionToggle?.addEventListener('change', (e) => {
            this.currentSettings.voice.noiseSuppression = !!e.target.checked;
        });

        const echoCancellationToggle = document.getElementById('echoCancellationToggle');
        echoCancellationToggle?.addEventListener('change', (e) => {
            this.currentSettings.voice.echoCancellation = !!e.target.checked;
        });

        const autoGainControlToggle = document.getElementById('autoGainControlToggle');
        autoGainControlToggle?.addEventListener('change', (e) => {
            this.currentSettings.voice.autoGainControl = !!e.target.checked;
        });

        // Notifications
        const requestNotificationBtn = document.getElementById('requestNotificationBtn');
        requestNotificationBtn?.addEventListener('click', () => this.requestNotificationPermission());

        this.loadDevices();
    }

    showTab(tabName) {
        document.querySelectorAll('.modal-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        document.querySelectorAll('.modal-tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.content === tabName);
        });
    }

    async loadCurrentSettings() {
        try {
            const savedSettings = localStorage.getItem('alta52Settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                Object.assign(this.currentSettings, settings);
            }
            this.applySettingsToUI();
        } catch (error) {
            console.error('Ошибка загрузки настроек:', error);
        }
    }

    applySettingsToUI() {
        // voice toggles
        const noiseSuppressionToggle = document.getElementById('noiseSuppressionToggle');
        if (noiseSuppressionToggle) noiseSuppressionToggle.checked = !!this.currentSettings.voice.noiseSuppression;

        const echoCancellationToggle = document.getElementById('echoCancellationToggle');
        if (echoCancellationToggle) echoCancellationToggle.checked = !!this.currentSettings.voice.echoCancellation;

        const autoGainControlToggle = document.getElementById('autoGainControlToggle');
        if (autoGainControlToggle) autoGainControlToggle.checked = !!this.currentSettings.voice.autoGainControl;

        const inputVolumeSlider = document.getElementById('inputVolumeSlider');
        if (inputVolumeSlider) {
            inputVolumeSlider.value = this.currentSettings.voice.inputVolume ?? 100;
            document.getElementById('inputVolumeValue').textContent = inputVolumeSlider.value + '%';
        }

        const outputVolumeSlider = document.getElementById('outputVolumeSlider');
        if (outputVolumeSlider) {
            outputVolumeSlider.value = this.currentSettings.voice.outputVolume ?? 100;
            document.getElementById('outputVolumeValue').textContent = outputVolumeSlider.value + '%';
        }

        const micMonitorToggle = document.getElementById('micMonitorToggle');
        if (micMonitorToggle) micMonitorToggle.checked = this.currentSettings.voice.micMonitor !== false;

        const micMonitorSlider = document.getElementById('micMonitorSlider');
        if (micMonitorSlider) {
            micMonitorSlider.value = this.currentSettings.voice.micMonitorVolume ?? 20;
            document.getElementById('micMonitorValue').textContent = micMonitorSlider.value + '%';
        }

        // notifications
        const soundEnabledToggle = document.getElementById('soundEnabledToggle');
        if (soundEnabledToggle) soundEnabledToggle.checked = !!this.currentSettings.notifications.soundEnabled;

        const messageSoundToggle = document.getElementById('messageSoundToggle');
        if (messageSoundToggle) messageSoundToggle.checked = !!this.currentSettings.notifications.messageSound;

        const callSoundToggle = document.getElementById('callSoundToggle');
        if (callSoundToggle) callSoundToggle.checked = !!this.currentSettings.notifications.callSound;
    }

    async loadDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();

            const inputDeviceSelect = document.getElementById('inputDeviceSelect');
            const videoDeviceSelect = document.getElementById('videoDeviceSelect');

            if (inputDeviceSelect) {
                devices.filter(d => d.kind === 'audioinput').forEach(device => {
                    const option = document.createElement('option');
                    option.value = device.deviceId;
                    option.textContent = device.label || `Микрофон ${inputDeviceSelect.options.length}`;
                    inputDeviceSelect.appendChild(option);
                });
            }

            if (videoDeviceSelect) {
                devices.filter(d => d.kind === 'videoinput').forEach(device => {
                    const option = document.createElement('option');
                    option.value = device.deviceId;
                    option.textContent = device.label || `Камера ${videoDeviceSelect.options.length}`;
                    videoDeviceSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Ошибка загрузки устройств:', error);
        }
    }

    _applyMicMonitorGain() {
        if (!this.micMonitorGain) return;
        const v = (this.currentSettings.voice.micMonitorVolume ?? 20) / 100;
        this.micMonitorGain.gain.value = v;
    }

    _applyMicMonitorState() {
        if (!this.micAudioContext || !this.micMonitorGain) return;
        const enabled = this.currentSettings.voice.micMonitor !== false;
        this.micMonitorGain.gain.value = enabled ? ((this.currentSettings.voice.micMonitorVolume ?? 20) / 100) : 0;
    }

    async toggleMicTest() {
        const testMicBtn = document.getElementById('testMicBtn');
        const micLevelBar = document.getElementById('micLevelBar');

        if (this.micTestInterval) {
            clearInterval(this.micTestInterval);
            this.micTestInterval = null;

            if (this.micStream) {
                this.micStream.getTracks().forEach(track => track.stop());
                this.micStream = null;
            }

            if (this.micAudioContext) {
                try { await this.micAudioContext.close(); } catch {}
                this.micAudioContext = null;
                this.micMonitorGain = null;
                this.micAnalyser = null;
            }

            if (micLevelBar) micLevelBar.style.width = '0%';
            if (testMicBtn) testMicBtn.innerHTML = '<i class="fas fa-microphone"></i> Тестировать микрофон';
            return;
        }

        try {
            const audioConstraints = {
                echoCancellation: !!this.currentSettings.voice.echoCancellation,
                noiseSuppression: !!this.currentSettings.voice.noiseSuppression,
                autoGainControl: !!this.currentSettings.voice.autoGainControl
            };

            const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });

            this.micStream = stream;

            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioCtx();
            this.micAudioContext = audioContext;

            const microphone = audioContext.createMediaStreamSource(stream);

            // analyser for bar
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            this.micAnalyser = analyser;

            // loopback gain
            const gain = audioContext.createGain();
            this.micMonitorGain = gain;

            microphone.connect(analyser);
            microphone.connect(gain);
            gain.connect(audioContext.destination);

            // apply initial monitor state/volume
            this._applyMicMonitorState();

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            this.micTestInterval = setInterval(() => {
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                const level = Math.min(100, (average / 128) * 100);
                if (micLevelBar) micLevelBar.style.width = level + '%';
            }, 100);

            if (testMicBtn) testMicBtn.innerHTML = '<i class="fas fa-stop"></i> Остановить тест';
        } catch (error) {
            console.error('Ошибка доступа к микрофону:', error);
            window.modalManager.alert('Не удалось получить доступ к микрофону. Проверьте разрешения.', 'Ошибка');
        }
    }

    async toggleVideoTest() {
        const testVideoBtn = document.getElementById('testVideoBtn');
        const videoPreview = document.getElementById('videoPreview');
        const videoPlaceholder = document.getElementById('videoPlaceholder');

        if (this.videoPreviewStream) {
            this.videoPreviewStream.getTracks().forEach(track => track.stop());
            this.videoPreviewStream = null;
            if (videoPreview) {
                videoPreview.srcObject = null;
                videoPreview.style.display = 'none';
            }
            if (videoPlaceholder) videoPlaceholder.style.display = 'flex';
            if (testVideoBtn) testVideoBtn.innerHTML = '<i class="fas fa-video"></i> Тестировать камеру';
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: this.currentSettings.video.device }
            });

            this.videoPreviewStream = stream;
            if (videoPreview) {
                videoPreview.srcObject = stream;
                videoPreview.style.display = 'block';
            }
            if (videoPlaceholder) videoPlaceholder.style.display = 'none';
            if (testVideoBtn) testVideoBtn.innerHTML = '<i class="fas fa-stop"></i> Остановить тест';
        } catch (error) {
            console.error('Ошибка доступа к камере:', error);
            window.modalManager.alert('Не удалось получить доступ к камере. Проверьте разрешения.', 'Ошибка');
        }
    }

    async saveProfile() {
        const usernameInput = document.getElementById('usernameInput');
        const emailInput = document.getElementById('emailInput');
        const saveProfileBtn = document.getElementById('saveProfileBtn');

        const username = usernameInput?.value?.trim();
        const email = emailInput?.value?.trim();

        if (!username || !email) {
            window.modalManager.alert('Пожалуйста, заполните все поля', 'Ошибка');
            return;
        }

        saveProfileBtn?.classList.add('btn-loading');
        if (saveProfileBtn) saveProfileBtn.disabled = true;

        try {
            const response = await fetch('/api/v1/users/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username, email })
            });

            const payload = await response.json();

            if (!response.ok || !payload?.success) {
                const msg = payload?.error?.message || 'Не удалось сохранить профиль';
                throw new Error(msg);
            }

            const updatedUser = payload.data.user;
            currentUser = updatedUser;
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));

            window.notificationManager.show({
                title: 'Успешно',
                message: 'Профиль обновлён',
                avatar: updatedUser.avatar || updatedUser.username?.charAt(0),
                duration: 3000
            });

            if (typeof updateUserInfo === 'function') updateUserInfo();
        } catch (error) {
            console.error('Ошибка сохранения профиля:', error);
            window.modalManager.alert(error.message, 'Ошибка');
        } finally {
            saveProfileBtn?.classList.remove('btn-loading');
            if (saveProfileBtn) saveProfileBtn.disabled = false;
        }
    }

    async changePassword() {
        const oldPasswordInput = document.getElementById('oldPasswordInput');
        const newPasswordInput = document.getElementById('newPasswordInput');
        const confirmPasswordInput = document.getElementById('confirmPasswordInput');
        const changePasswordBtn = document.getElementById('changePasswordBtn');

        const oldPassword = oldPasswordInput?.value || '';
        const newPassword = newPasswordInput?.value || '';
        const confirmPassword = confirmPasswordInput?.value || '';

        if (!oldPassword || !newPassword || !confirmPassword) {
            window.modalManager.alert('Пожалуйста, заполните все поля', 'Ошибка');
            return;
        }
        if (newPassword !== confirmPassword) {
            window.modalManager.alert('Новые пароли не совпадают', 'Ошибка');
            return;
        }
        if (newPassword.length < 6) {
            window.modalManager.alert('Пароль должен быть не менее 6 символов', 'Ошибка');
            return;
        }

        changePasswordBtn?.classList.add('btn-loading');
        if (changePasswordBtn) changePasswordBtn.disabled = true;

        try {
            // ⚠️ В текущем backend репо роут смены пароля не найден.
            // Если ты добавишь: PUT /api/v1/users/me/password — поменяй URL здесь.
            const response = await fetch('/api/v1/users/me/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            const payload = await response.json().catch(() => ({}));

            if (!response.ok || !payload?.success) {
                const msg = payload?.error?.message || `Не удалось изменить пароль (HTTP ${response.status})`;
                throw new Error(msg);
            }

            window.notificationManager.show({
                title: 'Успешно',
                message: 'Пароль успешно изменён',
                avatar: currentUser?.avatar || currentUser?.username?.charAt(0),
                duration: 3000
            });

            oldPasswordInput.value = '';
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';
        } catch (error) {
            console.error('Ошибка изменения пароля:', error);
            window.modalManager.alert(error.message, 'Ошибка');
        } finally {
            changePasswordBtn?.classList.remove('btn-loading');
            if (changePasswordBtn) changePasswordBtn.disabled = false;
        }
    }

    async handleAvatarUpload(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            window.modalManager.alert('Пожалуйста, выберите изображение', 'Ошибка');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            window.modalManager.alert('Размер файла не должен превышать 5 МБ', 'Ошибка');
            return;
        }

        // preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const avatarPreview = document.getElementById('avatarPreview');
            if (avatarPreview) avatarPreview.innerHTML = `<img src="${updatedUser.avatar}" alt="Avatar">`;
        };
        reader.readAsDataURL(file);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // ✅ correct upload endpoint
            const uploadRes = await fetch('/api/v1/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const uploadPayload = await uploadRes.json();

            if (!uploadRes.ok || !uploadPayload?.success) {
                const msg = uploadPayload?.error?.message || 'Ошибка загрузки аватара';
                throw new Error(msg);
            }

            const avatarPath = uploadPayload.data.url; // "/uploads/...."
            const avatarUrl = new URL(avatarPath, window.location.origin).toString();

            const profileRes = await fetch('/api/v1/users/me', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                username: currentUser?.username,
                email: currentUser?.email,
                avatar: avatarUrl
            })
            });

            const profilePayload = await profileRes.json();

            if (!profileRes.ok || !profilePayload?.success) {
                const msg = profilePayload?.error?.message || 'Не удалось сохранить аватар';
                throw new Error(msg);
            }

            const updatedUser = profilePayload.data.user;
            currentUser = updatedUser;
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));

            window.notificationManager.show({
                title: 'Успешно',
                message: 'Аватар обновлён',
                avatar: updatedUser.avatar || updatedUser.username?.charAt(0),
                duration: 3000
            });

            if (typeof updateUserInfo === 'function') updateUserInfo();
        } catch (error) {
            console.error('Ошибка загрузки аватара:', error);
            window.modalManager.alert(error.message || 'Не удалось загрузить аватар', 'Ошибка');
        } finally {
            // allow re-selecting same file
            event.target.value = '';
        }
    }

    logout() {
        window.modalManager.confirm(
            'Вы уверены, что хотите выйти?',
            () => {
                localStorage.removeItem('token');
                localStorage.removeItem('currentUser');
                window.location.href = '/login.html';
            }
        );
    }

    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            window.modalManager.alert('Ваш браузер не поддерживает уведомления', 'Ошибка');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                window.notificationManager.show({
                    title: 'Успешно',
                    message: 'Уведомления разрешены',
                    avatar: '✓',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Ошибка запроса разрешения:', error);
        }
    }

    cleanup() {
        if (this.micTestInterval) {
            clearInterval(this.micTestInterval);
            this.micTestInterval = null;
        }

        if (this.micStream) {
            this.micStream.getTracks().forEach(track => track.stop());
            this.micStream = null;
        }

        if (this.micAudioContext) {
            try { this.micAudioContext.close(); } catch {}
            this.micAudioContext = null;
            this.micMonitorGain = null;
            this.micAnalyser = null;
        }

        if (this.videoPreviewStream) {
            this.videoPreviewStream.getTracks().forEach(track => track.stop());
            this.videoPreviewStream = null;
        }

        this.saveSettings();
    }

    saveSettings() {
        try {
            // sync toggles if present
            const noiseSuppressionToggle = document.getElementById('noiseSuppressionToggle');
            if (noiseSuppressionToggle) this.currentSettings.voice.noiseSuppression = noiseSuppressionToggle.checked;

            const echoCancellationToggle = document.getElementById('echoCancellationToggle');
            if (echoCancellationToggle) this.currentSettings.voice.echoCancellation = echoCancellationToggle.checked;

            const autoGainControlToggle = document.getElementById('autoGainControlToggle');
            if (autoGainControlToggle) this.currentSettings.voice.autoGainControl = autoGainControlToggle.checked;

            const soundEnabledToggle = document.getElementById('soundEnabledToggle');
            if (soundEnabledToggle) this.currentSettings.notifications.soundEnabled = soundEnabledToggle.checked;

            const messageSoundToggle = document.getElementById('messageSoundToggle');
            if (messageSoundToggle) this.currentSettings.notifications.messageSound = messageSoundToggle.checked;

            const callSoundToggle = document.getElementById('callSoundToggle');
            if (callSoundToggle) this.currentSettings.notifications.callSound = callSoundToggle.checked;

            const screenQualitySelect = document.getElementById('screenQualitySelect');
            if (screenQualitySelect) this.currentSettings.video.quality = screenQualitySelect.value;

            localStorage.setItem('alta52Settings', JSON.stringify(this.currentSettings));
        } catch (error) {
            console.error('Ошибка сохранения настроек:', error);
        }
    }

    getSettings() {
        return this.currentSettings;
    }
}

window.settingsModal = new SettingsModal();