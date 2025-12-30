// Alta52 - Универсальное модальное окно подтверждения
// Для критичных действий с опциями "не спрашивать снова"

class ConfirmModal {
    constructor() {
        this.modalId = null;
        this.dontAskAgainPreferences = this.loadPreferences();
    }

    /**
     * Загрузить сохраненные предпочтения
     */
    loadPreferences() {
        try {
            const prefs = localStorage.getItem('confirmModalPreferences');
            return prefs ? JSON.parse(prefs) : {};
        } catch (error) {
            return {};
        }
    }

    /**
     * Сохранить предпочтения
     */
    savePreferences() {
        try {
            localStorage.setItem('confirmModalPreferences', JSON.stringify(this.dontAskAgainPreferences));
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }

    /**
     * Показать диалог подтверждения
     * @param {Object} options - Параметры
     * @param {string} options.action - Тип действия (delete-message, leave-server, delete-channel, remove-friend, ban-user, kick-user)
     * @param {string} options.title - Заголовок
     * @param {string} options.message - Сообщение
     * @param {string} options.confirmText - Текст кнопки подтверждения
     * @param {string} options.cancelText - Текст кнопки отмены
     * @param {boolean} options.dangerous - Опасное действие (красная кнопка)
     * @param {boolean} options.showDontAskAgain - Показать чекбокс "не спрашивать снова"
     * @param {Function} options.onConfirm - Callback при подтверждении
     * @param {Function} options.onCancel - Callback при отмене
     */
    show(options) {
        // Проверить, не отключено ли это подтверждение
        if (options.action && this.dontAskAgainPreferences[options.action]) {
            if (options.onConfirm) {
                options.onConfirm();
            }
            return;
        }

        const content = this.createContent(options);
        
        this.modalId = window.modalManager.show({
            title: options.title || 'Подтверждение действия',
            content: content,
            width: '440px',
            buttons: this.getButtons(options),
            closeOnOverlayClick: false
        });

        if (options.showDontAskAgain) {
            this.attachCheckboxListener(options);
        }
    }

    /**
     * Создать контент диалога
     */
    createContent(options) {
        const container = document.createElement('div');
        container.className = 'confirm-modal-content';
        container.setAttribute('role', 'alertdialog');
        container.setAttribute('aria-labelledby', 'modal-title');
        container.setAttribute('aria-describedby', 'confirm-message');

        const iconMap = {
            'delete-message': 'trash-alt',
            'leave-server': 'sign-out-alt',
            'delete-channel': 'trash',
            'remove-friend': 'user-times',
            'delete-server': 'server',
            'ban-user': 'ban',
            'kick-user': 'door-open'
        };

        const icon = options.action ? iconMap[options.action] || 'exclamation-triangle' : 'exclamation-triangle';
        const iconColor = options.dangerous ? '#F04747' : 'var(--ruby-primary)';

        container.innerHTML = `
            <div class="confirm-icon" style="text-align: center; margin-bottom: 20px;">
                <i class="fas fa-${icon}" style="font-size: 64px; color: ${iconColor};" aria-hidden="true"></i>
            </div>
            <div id="confirm-message" class="confirm-message" style="font-size: 15px; line-height: 1.6; color: var(--ruby-light); text-align: center; margin-bottom: 20px;">
                ${options.message || 'Вы уверены, что хотите выполнить это действие?'}
            </div>
            ${options.showDontAskAgain ? `
                <div class="dont-ask-again" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(224, 17, 95, 0.2);">
                    <label style="display: flex; align-items: center; cursor: pointer; user-select: none;">
                        <input 
                            type="checkbox" 
                            id="dontAskAgainCheckbox" 
                            class="custom-checkbox"
                            aria-label="Не спрашивать снова"
                        >
                        <span style="margin-left: 10px; font-size: 13px;">Не спрашивать снова</span>
                    </label>
                </div>
            ` : ''}
        `;

        return container;
    }

    /**
     * Получить кнопки для диалога
     */
    getButtons(options) {
        return [
            {
                text: options.cancelText || 'Отмена',
                className: 'btn-secondary',
                onClick: () => {
                    if (options.onCancel) {
                        options.onCancel();
                    }
                }
            },
            {
                text: options.confirmText || 'Подтвердить',
                className: options.dangerous ? 'btn-danger' : 'btn-primary',
                onClick: () => {
                    if (options.onConfirm) {
                        options.onConfirm();
                    }
                }
            }
        ];
    }

    /**
     * Прикрепить обработчик чекбокса
     */
    attachCheckboxListener(options) {
        setTimeout(() => {
            const checkbox = document.getElementById('dontAskAgainCheckbox');
            if (checkbox && options.action) {
                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        this.dontAskAgainPreferences[options.action] = true;
                    } else {
                        delete this.dontAskAgainPreferences[options.action];
                    }
                    this.savePreferences();
                });
            }
        }, 100);
    }

    /**
     * Сбросить все предпочтения "не спрашивать снова"
     */
    resetPreferences() {
        this.dontAskAgainPreferences = {};
        this.savePreferences();
        window.notificationManager.show({
            title: 'Настройки сброшены',
            message: 'Все подтверждения будут показываться снова',
            duration: 2000
        });
    }

    // Удобные методы для частых действий

    /**
     * Подтверждение удаления сообщения
     */
    deleteMessage(onConfirm, onCancel) {
        this.show({
            action: 'delete-message',
            title: 'Удалить сообщение',
            message: 'Вы уверены, что хотите удалить это сообщение? Это действие нельзя отменить.',
            confirmText: 'Удалить',
            cancelText: 'Отмена',
            dangerous: true,
            showDontAskAgain: true,
            onConfirm: onConfirm,
            onCancel: onCancel
        });
    }

    /**
     * Подтверждение выхода с сервера
     */
    leaveServer(serverName, onConfirm, onCancel) {
        this.show({
            action: 'leave-server',
            title: 'Покинуть сервер',
            message: `Вы уверены, что хотите покинуть сервер "${serverName}"? Вы потеряете доступ ко всем каналам.`,
            confirmText: 'Покинуть',
            cancelText: 'Остаться',
            dangerous: true,
            showDontAskAgain: false,
            onConfirm: onConfirm,
            onCancel: onCancel
        });
    }

    /**
     * Подтверждение удаления канала
     */
    deleteChannel(channelName, onConfirm, onCancel) {
        this.show({
            action: 'delete-channel',
            title: 'Удалить канал',
            message: `Вы уверены, что хотите удалить канал "${channelName}"? Все сообщения будут потеряны. Это действие нельзя отменить.`,
            confirmText: 'Удалить канал',
            cancelText: 'Отмена',
            dangerous: true,
            showDontAskAgain: false,
            onConfirm: onConfirm,
            onCancel: onCancel
        });
    }

    /**
     * Подтверждение удаления друга
     */
    removeFriend(friendName, onConfirm, onCancel) {
        this.show({
            action: 'remove-friend',
            title: 'Удалить из друзей',
            message: `Вы уверены, что хотите удалить ${friendName} из друзей?`,
            confirmText: 'Удалить',
            cancelText: 'Отмена',
            dangerous: true,
            showDontAskAgain: true,
            onConfirm: onConfirm,
            onCancel: onCancel
        });
    }

    /**
     * Подтверждение удаления сервера
     */
    deleteServer(serverName, onConfirm, onCancel) {
        this.show({
            action: 'delete-server',
            title: 'Удалить сервер',
            message: `Вы уверены, что хотите НАВСЕГДА удалить сервер "${serverName}"? Все каналы, сообщения и участники будут потеряны. Это действие НЕЛЬЗЯ отменить!`,
            confirmText: 'Удалить навсегда',
            cancelText: 'Отмена',
            dangerous: true,
            showDontAskAgain: false,
            onConfirm: onConfirm,
            onCancel: onCancel
        });
    }

    /**
     * Подтверждение бана пользователя
     */
    banUser(username, onConfirm, onCancel) {
        this.show({
            action: 'ban-user',
            title: 'Забанить пользователя',
            message: `Вы уверены, что хотите забанить ${username}? Пользователь не сможет вернуться на сервер по приглашению.`,
            confirmText: 'Забанить',
            cancelText: 'Отмена',
            dangerous: true,
            showDontAskAgain: false,
            onConfirm: onConfirm,
            onCancel: onCancel
        });
    }

    /**
     * Подтверждение кика пользователя
     */
    kickUser(username, onConfirm, onCancel) {
        this.show({
            action: 'kick-user',
            title: 'Исключить пользователя',
            message: `Вы уверены, что хотите исключить ${username} с сервера? Пользователь сможет вернуться по приглашению.`,
            confirmText: 'Исключить',
            cancelText: 'Отмена',
            dangerous: true,
            showDontAskAgain: true,
            onConfirm: onConfirm,
            onCancel: onCancel
        });
    }
}

// Глобальный экземпляр
window.confirmModal = new ConfirmModal();
