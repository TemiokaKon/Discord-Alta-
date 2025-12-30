// Alta52 - Модальное окно приглашений на сервер
// Генерация ссылок, настройки срока действия и лимитов

class InviteModal {
    constructor() {
        this.serverId = null;
        this.serverName = '';
        this.activeInvites = [];
        this.modalId = null;
    }

    /**
     * Показать модальное окно приглашений
     * @param {string} serverId - ID сервера
     * @param {string} serverName - Название сервера
     */
    show(serverId, serverName) {
        this.serverId = serverId;
        this.serverName = serverName;
        this.loadActiveInvites();

        const content = this.createContent();
        
        this.modalId = window.modalManager.show({
            title: `Пригласить на сервер "${serverName}"`,
            content: content,
            width: '550px',
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
     * Создать контент модального окна
     */
    createContent() {
        const container = document.createElement('div');
        container.className = 'invite-modal-content';
        container.setAttribute('role', 'main');

        container.innerHTML = `
            <div class="invite-generator">
                <h3 style="margin-bottom: 15px; color: var(--ruby-light);">Создать приглашение</h3>
                
                <div class="form-group">
                    <label for="inviteExpire" style="display: block; margin-bottom: 8px; font-weight: 600;">
                        Срок действия
                    </label>
                    <select id="inviteExpire" class="form-input" aria-label="Выбор срока действия приглашения">
                        <option value="1800">30 минут</option>
                        <option value="3600">1 час</option>
                        <option value="21600">6 часов</option>
                        <option value="43200">12 часов</option>
                        <option value="86400" selected>1 день</option>
                        <option value="604800">7 дней</option>
                        <option value="0">Никогда</option>
                    </select>
                </div>

                <div class="form-group" style="margin-top: 15px;">
                    <label for="inviteMaxUses" style="display: block; margin-bottom: 8px; font-weight: 600;">
                        Максимум использований
                    </label>
                    <select id="inviteMaxUses" class="form-input" aria-label="Выбор лимита использований">
                        <option value="1">1 использование</option>
                        <option value="5">5 использований</option>
                        <option value="10">10 использований</option>
                        <option value="25">25 использований</option>
                        <option value="50">50 использований</option>
                        <option value="100">100 использований</option>
                        <option value="0" selected>Без ограничений</option>
                    </select>
                </div>

                <button id="generateInviteBtn" class="btn btn-primary" style="width: 100%; margin-top: 20px;" aria-label="Сгенерировать приглашение">
                    <i class="fas fa-plus-circle" aria-hidden="true"></i> Сгенерировать приглашение
                </button>
            </div>

            <div id="inviteLinkArea" class="invite-link-area" style="display: none; margin-top: 25px;" role="region" aria-label="Сгенерированная ссылка приглашения">
                <h3 style="margin-bottom: 15px; color: var(--ruby-light);">Ваше приглашение</h3>
                <div class="invite-link-wrapper">
                    <input 
                        type="text" 
                        id="inviteLinkInput" 
                        class="form-input" 
                        readonly 
                        aria-label="Ссылка приглашения"
                        aria-readonly="true"
                    >
                    <button id="copyInviteBtn" class="btn btn-primary" aria-label="Копировать ссылку">
                        <i class="fas fa-copy" aria-hidden="true"></i> Копировать
                    </button>
                </div>
                <div id="qrCodeArea" class="qr-code-area" style="margin-top: 20px; text-align: center; display: none;">
                    <p style="margin-bottom: 10px; opacity: 0.8;">QR-код приглашения</p>
                    <div id="qrCodeCanvas" style="display: inline-block; padding: 15px; background: white; border-radius: 10px;"></div>
                </div>
            </div>

            <div class="active-invites-section" style="margin-top: 30px;">
                <h3 style="margin-bottom: 15px; color: var(--ruby-light);">Активные приглашения</h3>
                <div id="activeInvitesList" class="active-invites-list" role="list">
                    ${this.renderActiveInvites()}
                </div>
            </div>
        `;

        return container;
    }

    /**
     * Отрисовать список активных приглашений
     */
    renderActiveInvites() {
        if (this.activeInvites.length === 0) {
            return `
                <div class="empty-state" style="text-align: center; padding: 30px; opacity: 0.6;">
                    <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 10px;" aria-hidden="true"></i>
                    <p>Нет активных приглашений</p>
                </div>
            `;
        }

        return this.activeInvites.map(invite => `
            <div class="invite-item" data-invite-code="${invite.code}" role="listitem">
                <div class="invite-info">
                    <div class="invite-code" style="font-weight: 600; color: var(--ruby-primary);">
                        ${window.location.origin}/invite/${invite.code}
                    </div>
                    <div class="invite-details" style="font-size: 12px; opacity: 0.7; margin-top: 5px;">
                        <span>
                            <i class="fas fa-clock" aria-hidden="true"></i> 
                            ${this.formatExpiry(invite.expiresAt)}
                        </span>
                        <span style="margin-left: 15px;">
                            <i class="fas fa-user" aria-hidden="true"></i> 
                            ${invite.uses}/${invite.maxUses === 0 ? '∞' : invite.maxUses} использований
                        </span>
                    </div>
                </div>
                <div class="invite-actions">
                    <button 
                        class="btn-icon copy-invite-btn" 
                        data-invite-code="${invite.code}"
                        title="Копировать"
                        aria-label="Копировать ссылку приглашения"
                    >
                        <i class="fas fa-copy" aria-hidden="true"></i>
                    </button>
                    <button 
                        class="btn-icon revoke-invite-btn" 
                        data-invite-code="${invite.code}"
                        title="Отозвать"
                        aria-label="Отозвать приглашение"
                    >
                        <i class="fas fa-trash" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Форматировать срок действия
     */
    formatExpiry(expiresAt) {
        if (!expiresAt || expiresAt === 0) {
            return 'Никогда не истекает';
        }

        const now = Date.now();
        const expiry = new Date(expiresAt).getTime();
        const diff = expiry - now;

        if (diff < 0) {
            return 'Истекло';
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `Истекает через ${days} дн.`;
        } else if (hours > 0) {
            return `Истекает через ${hours} ч.`;
        } else {
            const minutes = Math.floor(diff / (1000 * 60));
            return `Истекает через ${minutes} мин.`;
        }
    }

    /**
     * Прикрепить обработчики событий
     */
    attachEventListeners() {
        setTimeout(() => {
            const generateBtn = document.getElementById('generateInviteBtn');
            const copyBtn = document.getElementById('copyInviteBtn');

            if (generateBtn) {
                generateBtn.addEventListener('click', () => this.generateInvite());
            }

            if (copyBtn) {
                copyBtn.addEventListener('click', () => this.copyInviteLink());
            }

            // Обработчики для активных приглашений
            document.querySelectorAll('.copy-invite-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const code = e.currentTarget.dataset.inviteCode;
                    this.copyInviteCode(code);
                });
            });

            document.querySelectorAll('.revoke-invite-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const code = e.currentTarget.dataset.inviteCode;
                    this.revokeInvite(code);
                });
            });
        }, 100);
    }

    /**
     * Загрузить активные приглашения
     */
    async loadActiveInvites() {
        try {
            // TODO: Загрузить с сервера
            // Временные данные для демонстрации
            this.activeInvites = [
                {
                    code: 'abc123xyz',
                    expiresAt: Date.now() + 86400000, // 1 день
                    maxUses: 10,
                    uses: 3
                },
                {
                    code: 'def456uvw',
                    expiresAt: 0, // Никогда
                    maxUses: 0,
                    uses: 15
                }
            ];
        } catch (error) {
            console.error('Error loading invites:', error);
            this.activeInvites = [];
        }
    }

    /**
     * Сгенерировать новое приглашение
     */
    async generateInvite() {
        const expireSelect = document.getElementById('inviteExpire');
        const maxUsesSelect = document.getElementById('inviteMaxUses');

        const expiresIn = parseInt(expireSelect.value);
        const maxUses = parseInt(maxUsesSelect.value);

        try {
            // TODO: Отправить запрос на сервер
            const inviteCode = this.generateCode();
            const inviteUrl = `${window.location.origin}/invite/${inviteCode}`;

            // Обновить интерфейс
            const linkArea = document.getElementById('inviteLinkArea');
            const linkInput = document.getElementById('inviteLinkInput');

            if (linkArea && linkInput) {
                linkInput.value = inviteUrl;
                linkArea.style.display = 'block';
                linkArea.setAttribute('aria-hidden', 'false');
            }

            // Добавить в список активных
            const newInvite = {
                code: inviteCode,
                expiresAt: expiresIn === 0 ? 0 : Date.now() + (expiresIn * 1000),
                maxUses: maxUses,
                uses: 0
            };
            this.activeInvites.unshift(newInvite);

            // Обновить список
            this.updateActiveInvitesList();

            window.notificationManager.show({
                title: 'Приглашение создано',
                message: 'Ссылка готова к использованию',
                duration: 3000,
                sound: 'notification'
            });

            // Генерировать QR-код (упрощенная версия без библиотеки)
            this.showQRPlaceholder(inviteUrl);

        } catch (error) {
            console.error('Error generating invite:', error);
            window.notificationManager.show({
                title: 'Ошибка',
                message: 'Не удалось создать приглашение',
                duration: 3000
            });
        }
    }

    /**
     * Сгенерировать код приглашения
     */
    generateCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Показать плейсхолдер QR-кода
     */
    showQRPlaceholder(url) {
        const qrArea = document.getElementById('qrCodeArea');
        const qrCanvas = document.getElementById('qrCodeCanvas');
        
        if (qrArea && qrCanvas) {
            qrCanvas.innerHTML = `
                <div style="width: 200px; height: 200px; background: linear-gradient(135deg, #f0f0f0, #e0e0e0); display: flex; align-items: center; justify-content: center; border-radius: 10px;">
                    <p style="color: #666; text-align: center; font-size: 14px; padding: 20px;">
                        QR-код<br>
                        <small style="font-size: 10px; opacity: 0.7;">${url}</small>
                    </p>
                </div>
            `;
            qrArea.style.display = 'block';
        }
    }

    /**
     * Копировать ссылку приглашения
     */
    async copyInviteLink() {
        const linkInput = document.getElementById('inviteLinkInput');
        if (!linkInput) return;

        try {
            await navigator.clipboard.writeText(linkInput.value);
            
            const copyBtn = document.getElementById('copyInviteBtn');
            if (copyBtn) {
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> Скопировано!';
                copyBtn.classList.add('success');
                copyBtn.setAttribute('aria-label', 'Ссылка скопирована');

                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                    copyBtn.classList.remove('success');
                    copyBtn.setAttribute('aria-label', 'Копировать ссылку');
                }, 2000);
            }

            window.notificationManager.show({
                title: 'Скопировано',
                message: 'Ссылка приглашения скопирована в буфер обмена',
                duration: 2000
            });
        } catch (error) {
            console.error('Error copying:', error);
            linkInput.select();
            document.execCommand('copy');
        }
    }

    /**
     * Копировать код приглашения
     */
    async copyInviteCode(code) {
        const url = `${window.location.origin}/invite/${code}`;
        
        try {
            await navigator.clipboard.writeText(url);
            window.notificationManager.show({
                title: 'Скопировано',
                message: 'Ссылка приглашения скопирована',
                duration: 2000
            });
        } catch (error) {
            console.error('Error copying:', error);
        }
    }

    /**
     * Отозвать приглашение
     */
    async revokeInvite(code) {
        window.modalManager.confirm(
            'Вы уверены, что хотите отозвать это приглашение? Эту ссылку больше нельзя будет использовать.',
            async () => {
                try {
                    // TODO: Отправить запрос на сервер
                    this.activeInvites = this.activeInvites.filter(inv => inv.code !== code);
                    this.updateActiveInvitesList();

                    window.notificationManager.show({
                        title: 'Приглашение отозвано',
                        message: 'Ссылка больше не действительна',
                        duration: 3000
                    });
                } catch (error) {
                    console.error('Error revoking invite:', error);
                    window.notificationManager.show({
                        title: 'Ошибка',
                        message: 'Не удалось отозвать приглашение',
                        duration: 3000
                    });
                }
            }
        );
    }

    /**
     * Обновить список активных приглашений
     */
    updateActiveInvitesList() {
        const listElement = document.getElementById('activeInvitesList');
        if (listElement) {
            listElement.innerHTML = this.renderActiveInvites();
            
            // Переприкрепить обработчики
            document.querySelectorAll('.copy-invite-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const code = e.currentTarget.dataset.inviteCode;
                    this.copyInviteCode(code);
                });
            });

            document.querySelectorAll('.revoke-invite-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const code = e.currentTarget.dataset.inviteCode;
                    this.revokeInvite(code);
                });
            });
        }
    }

    /**
     * Очистка при закрытии
     */
    cleanup() {
        this.serverId = null;
        this.serverName = '';
    }
}

// Глобальный экземпляр
window.inviteModal = new InviteModal();
