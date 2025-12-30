// Alta52 - Модальное окно профиля пользователя
// Показ информации о пользователе, действия и общие серверы

class ProfileModal {
    constructor() {
        this.userId = null;
        this.userData = null;
        this.modalId = null;
    }

    /**
     * Показать профиль пользователя
     * @param {string} userId - ID пользователя
     */
    async show(userId) {
        this.userId = userId;
        await this.loadUserData();

        const content = this.createContent();
        
        this.modalId = window.modalManager.show({
            title: 'Профиль пользователя',
            content: content,
            width: '500px',
            buttons: [
                {
                    text: 'Закрыть',
                    className: 'btn-secondary'
                }
            ],
            onClose: () => this.cleanup()
        });

        this.attachEventListeners();
    }

    /**
     * Загрузить данные пользователя
     */
    async loadUserData() {
        try {
            // TODO: Загрузить с сервера
            // Временные данные для демонстрации
            this.userData = {
                id: this.userId,
                username: 'JohnDoe',
                tag: '1234',
                avatar: 'JD',
                status: 'online',
                customStatus: 'Playing Alta52',
                activity: 'В игре: Alta52',
                joinedAt: '2023-01-15',
                commonServers: [
                    { id: '1', name: 'Gaming Squad', icon: 'GS' },
                    { id: '2', name: 'Study Group', icon: 'SG' }
                ],
                roles: [
                    { id: '1', name: 'Модератор', color: '#E0115F' },
                    { id: '2', name: 'VIP', color: '#FFD700' }
                ],
                isFriend: false,
                note: ''
            };
        } catch (error) {
            console.error('Error loading user data:', error);
            this.userData = null;
        }
    }

    /**
     * Создать контент модального окна
     */
    createContent() {
        if (!this.userData) {
            return '<p style="text-align: center; padding: 40px;">Не удалось загрузить данные пользователя</p>';
        }

        const container = document.createElement('div');
        container.className = 'profile-modal-content';
        container.setAttribute('role', 'main');

        const statusColors = {
            online: '#43B581',
            idle: '#FAA61A',
            dnd: '#F04747',
            offline: '#747F8D'
        };

        container.innerHTML = `
            <!-- Баннер профиля -->
            <div class="profile-banner" style="height: 100px; background: linear-gradient(135deg, var(--ruby-primary), var(--ruby-secondary)); border-radius: 12px 12px 0 0; margin: -24px -28px 0;">
            </div>

            <!-- Аватар и основная информация -->
            <div class="profile-main" style="padding: 0 28px; margin-top: -40px; position: relative;">
                <div class="profile-avatar-large" style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--ruby-primary), var(--ruby-secondary)); display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; color: white; border: 5px solid var(--ruby-dark); position: relative;">
                    ${this.userData.avatar}
                    <div class="status-indicator" style="width: 20px; height: 20px; border-radius: 50%; background: ${statusColors[this.userData.status]}; border: 3px solid var(--ruby-dark); position: absolute; bottom: 0; right: 0;" role="status" aria-label="${this.userData.status}"></div>
                </div>

                <div class="profile-info" style="margin-top: 15px;">
                    <h2 style="font-size: 24px; font-weight: 700; color: var(--ruby-light); margin-bottom: 5px;">
                        ${this.userData.username}<span style="opacity: 0.6; font-weight: 400;">#${this.userData.tag}</span>
                    </h2>
                    ${this.userData.customStatus ? `
                        <div class="custom-status" style="font-size: 14px; opacity: 0.8; margin-bottom: 10px;">
                            <i class="fas fa-quote-left" style="font-size: 10px; opacity: 0.5;" aria-hidden="true"></i>
                            ${this.userData.customStatus}
                            <i class="fas fa-quote-right" style="font-size: 10px; opacity: 0.5;" aria-hidden="true"></i>
                        </div>
                    ` : ''}
                    ${this.userData.activity ? `
                        <div class="activity" style="font-size: 13px; opacity: 0.7;">
                            <i class="fas fa-gamepad" aria-hidden="true"></i> ${this.userData.activity}
                        </div>
                    ` : ''}
                </div>

                <!-- Кнопки действий -->
                <div class="profile-actions" style="display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap;">
                    <button id="sendMessageBtn" class="btn btn-primary" style="flex: 1;" aria-label="Написать сообщение">
                        <i class="fas fa-comment" aria-hidden="true"></i> Написать
                    </button>
                    <button id="voiceCallBtn" class="btn btn-secondary" aria-label="Голосовой звонок">
                        <i class="fas fa-phone" aria-hidden="true"></i>
                    </button>
                    <button id="videoCallBtn" class="btn btn-secondary" aria-label="Видеозвонок">
                        <i class="fas fa-video" aria-hidden="true"></i>
                    </button>
                    <button id="addFriendBtn" class="btn btn-secondary" aria-label="${this.userData.isFriend ? 'Удалить из друзей' : 'Добавить в друзья'}">
                        <i class="fas fa-user-${this.userData.isFriend ? 'minus' : 'plus'}" aria-hidden="true"></i>
                    </button>
                </div>
            </div>

            <!-- Разделитель -->
            <div style="height: 1px; background: rgba(224, 17, 95, 0.2); margin: 25px 0;"></div>

            <!-- Общие серверы -->
            <div class="common-servers-section" style="padding: 0 28px;">
                <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; opacity: 0.6; margin-bottom: 15px;">
                    Общие серверы — ${this.userData.commonServers.length}
                </h3>
                <div class="common-servers-list" role="list">
                    ${this.userData.commonServers.map(server => `
                        <div class="server-item" style="display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 8px; cursor: pointer; transition: background 0.2s;" role="listitem">
                            <div class="server-icon-small" style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--ruby-primary), var(--ruby-secondary)); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;">
                                ${server.icon}
                            </div>
                            <div class="server-name" style="flex: 1; font-weight: 500;">
                                ${server.name}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${this.userData.roles && this.userData.roles.length > 0 ? `
                <!-- Разделитель -->
                <div style="height: 1px; background: rgba(224, 17, 95, 0.2); margin: 25px 0;"></div>

                <!-- Роли на сервере -->
                <div class="server-roles-section" style="padding: 0 28px;">
                    <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; opacity: 0.6; margin-bottom: 15px;">
                        Роли на этом сервере
                    </h3>
                    <div class="roles-list" style="display: flex; flex-wrap: wrap; gap: 8px;" role="list">
                        ${this.userData.roles.map(role => `
                            <div class="role-badge" style="padding: 6px 12px; border-radius: 12px; background: ${role.color}22; border: 1px solid ${role.color}; color: ${role.color}; font-size: 13px; font-weight: 600;" role="listitem">
                                <i class="fas fa-circle" style="font-size: 8px; margin-right: 6px;" aria-hidden="true"></i>
                                ${role.name}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Разделитель -->
            <div style="height: 1px; background: rgba(224, 17, 95, 0.2); margin: 25px 0;"></div>

            <!-- Примечание пользователя -->
            <div class="user-note-section" style="padding: 0 28px 10px;">
                <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; opacity: 0.6; margin-bottom: 15px;">
                    Примечание <span style="font-size: 11px; opacity: 0.5;">(только вы видите)</span>
                </h3>
                <textarea 
                    id="userNoteInput" 
                    class="form-input" 
                    placeholder="Добавьте примечание об этом пользователе..."
                    rows="3"
                    maxlength="256"
                    aria-label="Примечание о пользователе"
                >${this.userData.note}</textarea>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                    <span style="font-size: 12px; opacity: 0.5;">
                        <span id="noteCharCount">${this.userData.note.length}</span>/256
                    </span>
                    <button id="saveNoteBtn" class="btn btn-primary btn-sm" style="display: none;" aria-label="Сохранить примечание">
                        Сохранить
                    </button>
                </div>
            </div>

            <!-- Информация о профиле -->
            <div style="padding: 20px 28px 10px; font-size: 12px; opacity: 0.5; text-align: center;">
                Участник с ${new Date(this.userData.joinedAt).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
        `;

        return container;
    }

    /**
     * Прикрепить обработчики событий
     */
    attachEventListeners() {
        setTimeout(() => {
            const sendMessageBtn = document.getElementById('sendMessageBtn');
            const voiceCallBtn = document.getElementById('voiceCallBtn');
            const videoCallBtn = document.getElementById('videoCallBtn');
            const addFriendBtn = document.getElementById('addFriendBtn');
            const userNoteInput = document.getElementById('userNoteInput');
            const saveNoteBtn = document.getElementById('saveNoteBtn');
            const noteCharCount = document.getElementById('noteCharCount');

            if (sendMessageBtn) {
                sendMessageBtn.addEventListener('click', () => this.sendMessage());
            }

            if (voiceCallBtn) {
                voiceCallBtn.addEventListener('click', () => this.startVoiceCall());
            }

            if (videoCallBtn) {
                videoCallBtn.addEventListener('click', () => this.startVideoCall());
            }

            if (addFriendBtn) {
                addFriendBtn.addEventListener('click', () => this.toggleFriend());
            }

            if (userNoteInput && saveNoteBtn && noteCharCount) {
                userNoteInput.addEventListener('input', (e) => {
                    noteCharCount.textContent = e.target.value.length;
                    saveNoteBtn.style.display = e.target.value !== this.userData.note ? 'block' : 'none';
                });

                saveNoteBtn.addEventListener('click', () => this.saveNote(userNoteInput.value));
            }
        }, 100);
    }

    /**
     * Отправить сообщение пользователю
     */
    sendMessage() {
        console.log('Send message to user:', this.userId);
        window.notificationManager.show({
            title: 'Личные сообщения',
            message: `Открываем чат с ${this.userData.username}`,
            duration: 2000
        });
        
        if (this.modalId) {
            window.modalManager.close(this.modalId);
        }

        // TODO: Открыть DM с пользователем
    }

    /**
     * Начать голосовой звонок
     */
    startVoiceCall() {
        console.log('Start voice call with user:', this.userId);
        window.notificationManager.show({
            title: 'Звонок',
            message: `Звоним ${this.userData.username}...`,
            duration: 2000,
            sound: 'incoming-call'
        });

        // TODO: Инициировать звонок
    }

    /**
     * Начать видеозвонок
     */
    startVideoCall() {
        console.log('Start video call with user:', this.userId);
        window.notificationManager.show({
            title: 'Видеозвонок',
            message: `Видеозвонок с ${this.userData.username}...`,
            duration: 2000,
            sound: 'incoming-call'
        });

        // TODO: Инициировать видеозвонок
    }

    /**
     * Добавить/удалить из друзей
     */
    async toggleFriend() {
        const addFriendBtn = document.getElementById('addFriendBtn');
        
        try {
            if (this.userData.isFriend) {
                // Удалить из друзей
                window.modalManager.confirm(
                    `Вы уверены, что хотите удалить ${this.userData.username} из друзей?`,
                    async () => {
                        // TODO: Отправить запрос на сервер
                        this.userData.isFriend = false;
                        
                        if (addFriendBtn) {
                            addFriendBtn.innerHTML = '<i class="fas fa-user-plus" aria-hidden="true"></i>';
                            addFriendBtn.setAttribute('aria-label', 'Добавить в друзья');
                        }

                        window.notificationManager.show({
                            title: 'Друзья',
                            message: `${this.userData.username} удален из друзей`,
                            duration: 2000
                        });
                    }
                );
            } else {
                // Добавить в друзья
                // TODO: Отправить запрос на сервер
                this.userData.isFriend = true;
                
                if (addFriendBtn) {
                    addFriendBtn.innerHTML = '<i class="fas fa-user-minus" aria-hidden="true"></i>';
                    addFriendBtn.setAttribute('aria-label', 'Удалить из друзей');
                }

                window.notificationManager.show({
                    title: 'Друзья',
                    message: `Запрос в друзья отправлен ${this.userData.username}`,
                    duration: 2000,
                    sound: 'notification'
                });
            }
        } catch (error) {
            console.error('Error toggling friend:', error);
            window.notificationManager.show({
                title: 'Ошибка',
                message: 'Не удалось выполнить действие',
                duration: 2000
            });
        }
    }

    /**
     * Сохранить примечание
     */
    async saveNote(note) {
        try {
            // TODO: Отправить на сервер
            this.userData.note = note;
            
            const saveNoteBtn = document.getElementById('saveNoteBtn');
            if (saveNoteBtn) {
                saveNoteBtn.style.display = 'none';
            }

            window.notificationManager.show({
                title: 'Примечание сохранено',
                message: 'Ваше примечание обновлено',
                duration: 2000
            });
        } catch (error) {
            console.error('Error saving note:', error);
            window.notificationManager.show({
                title: 'Ошибка',
                message: 'Не удалось сохранить примечание',
                duration: 2000
            });
        }
    }

    /**
     * Очистка при закрытии
     */
    cleanup() {
        this.userId = null;
        this.userData = null;
    }
}

// Глобальный экземпляр
window.profileModal = new ProfileModal();
