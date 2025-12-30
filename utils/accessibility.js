// Alta52 - Accessibility Utilities (ARIA and keyboard navigation)

class AccessibilityManager {
    constructor() {
        this.focusTrap = null;
        this.lastFocusedElement = null;
        this.init();
    }

    /**
     * Инициализация
     */
    init() {
        this.setupKeyboardNavigation();
        this.setupScreenReaderAnnouncements();
    }

    /**
     * Настроить навигацию с клавиатуры
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Глобальный поиск (Ctrl+K или Cmd+K)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openGlobalSearch();
            }

            // Escape для закрытия модальных окон
            if (e.key === 'Escape') {
                this.handleEscape();
            }
        });
    }

    /**
     * Настроить объявления для screen reader
     */
    setupScreenReaderAnnouncements() {
        // Создать контейнер для live-объявлений
        if (!document.getElementById('sr-announcements')) {
            const announcer = document.createElement('div');
            announcer.id = 'sr-announcements';
            announcer.setAttribute('role', 'status');
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.className = 'sr-only';
            document.body.appendChild(announcer);
        }
    }

    /**
     * Объявить сообщение для screen reader
     * @param {string} message - Сообщение
     * @param {string} priority - 'polite' или 'assertive'
     */
    announce(message, priority = 'polite') {
        const announcer = document.getElementById('sr-announcements');
        if (announcer) {
            announcer.setAttribute('aria-live', priority);
            announcer.textContent = message;

            // Очистить через некоторое время
            setTimeout(() => {
                announcer.textContent = '';
            }, 1000);
        }
    }

    /**
     * Open global search
     */
    openGlobalSearch() {
        this.announce('Поиск открыт');
        // TODO: Implement global search
    }

    /**
     * Обработать нажатие Escape
     */
    handleEscape() {
        // Закрыть контекстное меню
        if (window.contextMenu) {
            window.contextMenu.close();
        }
    }

    /**
     * Создать ловушку фокуса для модального окна
     * @param {HTMLElement} container - Контейнер модального окна
     */
    trapFocus(container) {
        if (!container) return;

        // Сохранить последний элемент с фокусом
        this.lastFocusedElement = document.activeElement;

        // Получить все фокусируемые элементы
        const focusableElements = this.getFocusableElements(container);
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Установить фокус на первый элемент
        firstElement.focus();

        // Обработчик Tab
        const handleTab = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        container.addEventListener('keydown', handleTab);
        this.focusTrap = { container, handleTab };
    }

    /**
     * Освободить ловушку фокуса
     */
    releaseFocusTrap() {
        if (this.focusTrap) {
            const { container, handleTab } = this.focusTrap;
            container.removeEventListener('keydown', handleTab);
            this.focusTrap = null;
        }

        // Вернуть фокус на последний элемент
        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
            this.lastFocusedElement = null;
        }
    }

    /**
     * Получить все фокусируемые элементы в контейнере
     * @param {HTMLElement} container - Контейнер
     * @returns {Array} Массив элементов
     */
    getFocusableElements(container) {
        const selector = [
            'a[href]',
            'button:not([disabled])',
            'textarea:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ].join(', ');

        return Array.from(container.querySelectorAll(selector))
            .filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
    }

    /**
     * Добавить ARIA-атрибуты к кнопке
     * @param {HTMLElement} button - Кнопка
     * @param {Object} options - Опции
     */
    enhanceButton(button, options = {}) {
        if (!button) return;

        if (options.label) {
            button.setAttribute('aria-label', options.label);
        }

        if (options.pressed !== undefined) {
            button.setAttribute('aria-pressed', options.pressed.toString());
        }

        if (options.expanded !== undefined) {
            button.setAttribute('aria-expanded', options.expanded.toString());
        }

        if (options.controls) {
            button.setAttribute('aria-controls', options.controls);
        }

        if (options.describedBy) {
            button.setAttribute('aria-describedby', options.describedBy);
        }
    }

    /**
     * Добавить ARIA-атрибуты к форме
     * @param {HTMLElement} form - Форма
     */
    enhanceForm(form) {
        if (!form) return;

        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            const label = form.querySelector(`label[for="${input.id}"]`);
            
            if (input.hasAttribute('required')) {
                input.setAttribute('aria-required', 'true');
            }

            if (input.type === 'email' || input.type === 'tel') {
                input.setAttribute('aria-invalid', 'false');
            }

            // Добавить описание для ошибок
            const errorId = `${input.id}-error`;
            const errorElement = document.getElementById(errorId);
            if (errorElement) {
                input.setAttribute('aria-describedby', errorId);
            }
        });
    }

    /**
     * Показать ошибку валидации
     * @param {HTMLElement} input - Поле ввода
     * @param {string} message - Сообщение об ошибке
     */
    showValidationError(input, message) {
        if (!input) return;

        input.setAttribute('aria-invalid', 'true');

        const errorId = `${input.id}-error`;
        let errorElement = document.getElementById(errorId);

        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = errorId;
            errorElement.className = 'validation-error';
            errorElement.setAttribute('role', 'alert');
            input.parentNode.insertBefore(errorElement, input.nextSibling);
        }

        errorElement.textContent = message;
        input.setAttribute('aria-describedby', errorId);

        // Объявить для screen reader
        this.announce(message, 'assertive');
    }

    /**
     * Скрыть ошибку валидации
     * @param {HTMLElement} input - Поле ввода
     */
    hideValidationError(input) {
        if (!input) return;

        input.setAttribute('aria-invalid', 'false');

        const errorId = `${input.id}-error`;
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.remove();
        }

        input.removeAttribute('aria-describedby');
    }

    /**
     * Создать skip link для быстрой навигации
     * @param {string} targetId - ID целевого элемента
     * @param {string} text - Текст ссылки
     */
    createSkipLink(targetId, text = 'Перейти к основному содержанию') {
        const skipLink = document.createElement('a');
        skipLink.href = `#${targetId}`;
        skipLink.className = 'skip-link';
        skipLink.textContent = text;
        skipLink.setAttribute('aria-label', text);

        skipLink.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById(targetId);
            if (target) {
                target.focus();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });

        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    /**
     * Настроить навигацию стрелками для списка
     * @param {HTMLElement} list - Список
     */
    setupArrowNavigation(list) {
        if (!list) return;

        const items = Array.from(list.querySelectorAll('[role="menuitem"], [role="option"]'));
        
        list.addEventListener('keydown', (e) => {
            const currentIndex = items.indexOf(document.activeElement);
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % items.length;
                items[nextIndex].focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prevIndex = (currentIndex - 1 + items.length) % items.length;
                items[prevIndex].focus();
            } else if (e.key === 'Home') {
                e.preventDefault();
                items[0].focus();
            } else if (e.key === 'End') {
                e.preventDefault();
                items[items.length - 1].focus();
            }
        });
    }

    /**
     * Обновить индикатор загрузки
     * @param {HTMLElement} element - Элемент
     * @param {boolean} loading - Идет загрузка
     */
    setLoadingState(element, loading) {
        if (!element) return;

        if (loading) {
            element.setAttribute('aria-busy', 'true');
            element.setAttribute('aria-live', 'polite');
        } else {
            element.setAttribute('aria-busy', 'false');
            element.removeAttribute('aria-live');
        }
    }

    /**
     * Объявить о новом сообщении
     * @param {string} username - Имя пользователя
     * @param {string} message - Текст сообщения
     */
    announceNewMessage(username, message) {
        const announcement = `Новое сообщение от ${username}: ${message}`;
        this.announce(announcement);
    }

    /**
     * Объявить об изменении статуса подключения
     * @param {string} status - Статус (connected, disconnected, reconnecting)
     */
    announceConnectionStatus(status) {
        const messages = {
            connected: 'Подключено к серверу',
            disconnected: 'Отключено от сервера',
            reconnecting: 'Переподключение к серверу'
        };
        this.announce(messages[status] || status, 'assertive');
    }

    /**
     * Объявить об успешном действии
     * @param {string} action - Описание действия
     */
    announceSuccess(action) {
        this.announce(`Успешно: ${action}`);
    }

    /**
     * Объявить об ошибке
     * @param {string} error - Описание ошибки
     */
    announceError(error) {
        this.announce(`Ошибка: ${error}`, 'assertive');
    }
}

// CSS для accessibility
const accessibilityStyles = `
    /* Screen reader only */
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }

    /* Skip link */
    .skip-link {
        position: absolute;
        top: -40px;
        left: 0;
        background: var(--ruby-primary);
        color: white;
        padding: 8px 16px;
        text-decoration: none;
        border-radius: 0 0 8px 0;
        z-index: 100000;
        transition: top 0.2s;
    }

    .skip-link:focus {
        top: 0;
    }

    /* Focus indicator */
    *:focus {
        outline: 2px solid var(--ruby-primary);
        outline-offset: 2px;
    }

    button:focus,
    a:focus,
    input:focus,
    textarea:focus,
    select:focus {
        outline: 2px solid var(--ruby-primary);
        outline-offset: 2px;
    }

    /* Validation error */
    .validation-error {
        color: #F04747;
        font-size: 13px;
        margin-top: 5px;
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .validation-error::before {
        content: "⚠";
    }

    input[aria-invalid="true"],
    textarea[aria-invalid="true"] {
        border-color: #F04747;
    }

    /* Loading state */
    [aria-busy="true"] {
        opacity: 0.6;
        pointer-events: none;
    }
`;

// Добавить стили на страницу
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = accessibilityStyles;
    document.head.appendChild(styleElement);
}

// Глобальный экземпляр
window.accessibilityManager = new AccessibilityManager();
