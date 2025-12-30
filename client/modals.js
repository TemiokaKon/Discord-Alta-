// Alta52 - Система модальных окон и уведомлений

class ModalManager {
    constructor() {
        this.modals = new Map();
    }

    /**
     * Создать и показать модальное окно
     * @param {Object} options - Параметры модального окна
     * @param {string} options.title - Заголовок
     * @param {string} options.content - HTML контент или текст
     * @param {Array} options.buttons - Массив кнопок
     * @param {Function} options.onClose - Callback при закрытии
     * @param {boolean} options.closeOnOverlayClick - Закрывать при клике вне окна
     * @returns {string} ID модального окна
     */
    show(options) {
        const modalId = 'modal-' + Date.now();
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = modalId;

        const container = document.createElement('div');
        container.className = 'modal-container';
        container.style.width = options.width || '500px';

        // Заголовок
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.innerHTML = `
            <h2 class="modal-title">${options.title || 'Модальное окно'}</h2>
            <button class="modal-close" data-action="close">&times;</button>
        `;

        // Тело
        const body = document.createElement('div');
        body.className = 'modal-body';
        if (typeof options.content === 'string') {
            body.innerHTML = options.content;
        } else if (options.content instanceof HTMLElement) {
            body.appendChild(options.content);
        }

        // Подвал с кнопками
        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        
        if (options.buttons && options.buttons.length > 0) {
            options.buttons.forEach(btn => {
                const button = document.createElement('button');
                button.className = `btn ${btn.className || 'btn-secondary'}`;
                button.textContent = btn.text;
                button.onclick = () => {
                    if (btn.onClick) {
                        btn.onClick();
                    }
                    if (btn.close !== false) {
                        this.close(modalId);
                    }
                };
                footer.appendChild(button);
            });
        }

        container.appendChild(header);
        container.appendChild(body);
        if (options.buttons && options.buttons.length > 0) {
            container.appendChild(footer);
        }
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        // Обработчики событий
        const closeBtn = header.querySelector('[data-action="close"]');
        closeBtn.onclick = () => this.close(modalId);

        if (options.closeOnOverlayClick !== false) {
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    this.close(modalId);
                }
            };
        }

        // Закрытие по Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.close(modalId);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        this.modals.set(modalId, {
            overlay,
            onClose: options.onClose,
            escapeHandler
        });

        // Воспроизвести звук открытия (если доступен)
        this.playSound('notification');

        return modalId;
    }

    /**
     * Закрыть модальное окно
     * @param {string} modalId - ID модального окна
     */
    close(modalId) {
        const modal = this.modals.get(modalId);
        if (!modal) return;

        const { overlay, onClose, escapeHandler } = modal;
        
        overlay.classList.add('closing');
        overlay.querySelector('.modal-container').classList.add('closing');

        setTimeout(() => {
            overlay.remove();
            this.modals.delete(modalId);
            document.removeEventListener('keydown', escapeHandler);
            
            if (onClose) {
                onClose();
            }
        }, 300);
    }

    /**
     * Закрыть все модальные окна
     */
    closeAll() {
        this.modals.forEach((_, modalId) => {
            this.close(modalId);
        });
    }

    /**
     * Показать подтверждение
     * @param {string} message - Сообщение
     * @param {Function} onConfirm - Callback при подтверждении
     * @param {Function} onCancel - Callback при отмене
     */
    confirm(message, onConfirm, onCancel) {
        return this.show({
            title: 'Подтверждение',
            content: `<p style="font-size: 15px; line-height: 1.6;">${message}</p>`,
            width: '400px',
            buttons: [
                {
                    text: 'Отмена',
                    className: 'btn-secondary',
                    onClick: onCancel
                },
                {
                    text: 'Подтвердить',
                    className: 'btn-primary',
                    onClick: onConfirm
                }
            ]
        });
    }

    /**
     * Показать алерт
     * @param {string} message - Сообщение
     * @param {string} title - Заголовок (опционально)
     */
    alert(message, title = 'Внимание') {
        return this.show({
            title: title,
            content: `<p style="font-size: 15px; line-height: 1.6;">${message}</p>`,
            width: '400px',
            buttons: [
                {
                    text: 'OK',
                    className: 'btn-primary'
                }
            ]
        });
    }

    /**
     * Воспроизвести звук
     * @param {string} soundName - Имя звукового файла (без расширения)
     */
    playSound(soundName) {
        try {
            const audio = new Audio(`/public/sounds/${soundName}.mp3`);
            audio.volume = 0.3;
            audio.play().catch(() => {
                // Игнорировать ошибки воспроизведения
            });
        } catch (e) {
            // Звуковые файлы опциональны
        }
    }
}

// Система уведомлений
class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.init();
    }

    init() {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }

    /**
     * Показать уведомление
     * @param {Object} options - Параметры уведомления
     * @param {string} options.title - Заголовок
     * @param {string} options.message - Сообщение
     * @param {string} options.avatar - Текст или URL аватара
     * @param {number} options.duration - Длительность в мс (0 = не закрывать автоматически)
     * @param {string} options.sound - Название звука для воспроизведения
     * @returns {string} ID уведомления
     */
    show(options) {
        const notifId = 'notif-' + Date.now();
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.id = notifId;

        const avatar = document.createElement('div');
        avatar.className = 'notification-avatar';
        if (options.avatar && options.avatar.startsWith('http')) {
            avatar.style.backgroundImage = `url(${options.avatar})`;
            avatar.style.backgroundSize = 'cover';
        } else {
            avatar.textContent = options.avatar || '!';
        }

        const content = document.createElement('div');
        content.className = 'notification-content';
        content.innerHTML = `
            <div class="notification-title">${options.title || 'Уведомление'}</div>
            <div class="notification-message">${options.message || ''}</div>
        `;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => this.close(notifId);

        notification.appendChild(avatar);
        notification.appendChild(content);
        notification.appendChild(closeBtn);

        this.container.appendChild(notification);
        this.notifications.set(notifId, notification);

        // Воспроизвести звук
        if (options.sound) {
            this.playSound(options.sound);
        }

        // Автозакрытие
        const duration = options.duration !== undefined ? options.duration : 5000;
        if (duration > 0) {
            setTimeout(() => {
                this.close(notifId);
            }, duration);
        }

        // Браузерное уведомление (если разрешено)
        if (options.browserNotification && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(options.title || 'Alta52', {
                body: options.message,
                icon: '/favicon.ico'
            });
        }

        return notifId;
    }

    /**
     * Закрыть уведомление
     * @param {string} notifId - ID уведомления
     */
    close(notifId) {
        const notification = this.notifications.get(notifId);
        if (!notification) return;

        notification.classList.add('closing');
        
        setTimeout(() => {
            notification.remove();
            this.notifications.delete(notifId);
        }, 300);
    }

    /**
     * Показать уведомление о новом сообщении
     * @param {string} username - Имя пользователя
     * @param {string} message - Текст сообщения
     * @param {string} avatar - Аватар пользователя
     */
    newMessage(username, message, avatar) {
        return this.show({
            title: username,
            message: message.length > 100 ? message.substring(0, 100) + '...' : message,
            avatar: avatar,
            sound: 'message',
            browserNotification: true
        });
    }

    /**
     * Показать уведомление о звонке
     * @param {string} username - Имя звонящего
     * @param {string} avatar - Аватар звонящего
     */
    incomingCall(username, avatar) {
        return this.show({
            title: 'Входящий звонок',
            message: `${username} звонит вам`,
            avatar: avatar,
            sound: 'incoming-call',
            duration: 0,
            browserNotification: true
        });
    }

    /**
     * Воспроизвести звук
     * @param {string} soundName - Имя звукового файла
     */
    playSound(soundName) {
        try {
            const audio = new Audio(`/public/sounds/${soundName}.mp3`);
            audio.volume = 0.5;
            audio.play().catch(() => {});
        } catch (e) {}
    }
}

// Контекстное меню
class ContextMenu {
    constructor() {
        this.currentMenu = null;
        this.init();
    }

    init() {
        document.addEventListener('click', () => {
            this.close();
        });
    }

    /**
     * Показать контекстное меню
     * @param {number} x - Координата X
     * @param {number} y - Координата Y
     * @param {Array} items - Элементы меню
     */
    show(x, y, items) {
        this.close();

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        items.forEach((item, index) => {
            if (item.separator) {
                const separator = document.createElement('div');
                separator.className = 'context-menu-separator';
                menu.appendChild(separator);
            } else {
                const menuItem = document.createElement('div');
                menuItem.className = 'context-menu-item' + (item.danger ? ' danger' : '');
                menuItem.innerHTML = `
                    ${item.icon ? `<i class="fas fa-${item.icon}"></i>` : ''}
                    <span>${item.text}</span>
                `;
                menuItem.onclick = (e) => {
                    e.stopPropagation();
                    if (item.onClick) {
                        item.onClick();
                    }
                    this.close();
                };
                menu.appendChild(menuItem);
            }
        });

        document.body.appendChild(menu);
        this.currentMenu = menu;

        // Убедиться, что меню в пределах экрана
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = (x - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = (y - rect.height) + 'px';
        }
    }

    /**
     * Закрыть контекстное меню
     */
    close() {
        if (this.currentMenu) {
            this.currentMenu.remove();
            this.currentMenu = null;
        }
    }
}

// Глобальные экземпляры
window.modalManager = new ModalManager();
window.notificationManager = new NotificationManager();
window.contextMenu = new ContextMenu();
