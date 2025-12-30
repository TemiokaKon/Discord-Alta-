// Alta52 - Модальное окно создания сервера
// Многошаговый визард с выбором шаблона, загрузкой иконки и настройками

class ServerCreateModal {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.serverData = {
            template: null,
            icon: null,
            name: '',
            description: ''
        };
        this.modalId = null;
    }

    /**
     * Показать модальное окно создания сервера
     */
    show() {
        this.currentStep = 1;
        this.serverData = {
            template: null,
            icon: null,
            name: '',
            description: ''
        };

        const content = this.createStepContent();
        
        this.modalId = window.modalManager.show({
            title: 'Создать сервер',
            content: content,
            width: '600px',
            buttons: this.getButtons(),
            closeOnOverlayClick: false,
            onClose: () => this.cleanup()
        });

        this.attachEventListeners();
    }

    /**
     * Создать контент для текущего шага
     */
    createStepContent() {
        const container = document.createElement('div');
        container.className = 'server-create-wizard';
        container.setAttribute('role', 'dialog');
        container.setAttribute('aria-labelledby', 'modal-title');

        // Индикатор шагов
        const stepsIndicator = document.createElement('div');
        stepsIndicator.className = 'wizard-steps';
        stepsIndicator.setAttribute('role', 'navigation');
        stepsIndicator.setAttribute('aria-label', 'Шаги создания сервера');
        
        for (let i = 1; i <= this.totalSteps; i++) {
            const step = document.createElement('div');
            step.className = `wizard-step ${i === this.currentStep ? 'active' : ''} ${i < this.currentStep ? 'completed' : ''}`;
            step.innerHTML = `<span>${i}</span>`;
            step.setAttribute('aria-current', i === this.currentStep ? 'step' : 'false');
            stepsIndicator.appendChild(step);
        }

        // Контент шага
        const stepContent = document.createElement('div');
        stepContent.className = 'wizard-content';
        stepContent.id = 'wizardContent';
        stepContent.setAttribute('role', 'main');

        switch (this.currentStep) {
            case 1:
                stepContent.innerHTML = this.getStep1Content();
                break;
            case 2:
                stepContent.innerHTML = this.getStep2Content();
                break;
            case 3:
                stepContent.innerHTML = this.getStep3Content();
                break;
        }

        container.appendChild(stepsIndicator);
        container.appendChild(stepContent);

        return container;
    }

    /**
     * Шаг 1: Выбор шаблона
     */
    getStep1Content() {
        return `
            <h3 style="margin-bottom: 20px; color: var(--ruby-light);">Выберите шаблон сервера</h3>
            <div class="template-grid" role="radiogroup" aria-label="Выбор шаблона сервера">
                <div class="template-card" data-template="gaming" role="radio" aria-checked="false" tabindex="0">
                    <i class="fas fa-gamepad" aria-hidden="true"></i>
                    <h4>Gaming</h4>
                    <p>Для игровых сообществ</p>
                </div>
                <div class="template-card" data-template="school" role="radio" aria-checked="false" tabindex="0">
                    <i class="fas fa-graduation-cap" aria-hidden="true"></i>
                    <h4>School Club</h4>
                    <p>Для учебных групп</p>
                </div>
                <div class="template-card" data-template="study" role="radio" aria-checked="false" tabindex="0">
                    <i class="fas fa-book" aria-hidden="true"></i>
                    <h4>Study Group</h4>
                    <p>Для совместного обучения</p>
                </div>
                <div class="template-card" data-template="friends" role="radio" aria-checked="false" tabindex="0">
                    <i class="fas fa-users" aria-hidden="true"></i>
                    <h4>Friends</h4>
                    <p>Для друзей</p>
                </div>
                <div class="template-card" data-template="custom" role="radio" aria-checked="false" tabindex="0">
                    <i class="fas fa-cog" aria-hidden="true"></i>
                    <h4>Custom</h4>
                    <p>Настроить самостоятельно</p>
                </div>
            </div>
        `;
    }

    /**
     * Шаг 2: Загрузка иконки
     */
    getStep2Content() {
        return `
            <h3 style="margin-bottom: 20px; color: var(--ruby-light);">Загрузите иконку сервера</h3>
            <div class="icon-upload-area" id="iconUploadArea" role="button" tabindex="0" aria-label="Загрузить иконку сервера">
                <div class="icon-preview" id="iconPreview" aria-live="polite">
                    <i class="fas fa-cloud-upload-alt" style="font-size: 48px; color: var(--ruby-primary);" aria-hidden="true"></i>
                    <p>Перетащите изображение сюда<br>или нажмите для выбора</p>
                    <p style="font-size: 12px; opacity: 0.7; margin-top: 10px;">Рекомендуемый размер: 512x512px</p>
                </div>
                <input type="file" id="serverIconInput" accept="image/*" style="display: none;" aria-label="Выбор файла иконки">
            </div>
            <p style="text-align: center; margin-top: 15px; opacity: 0.6; font-size: 13px;">
                Вы можете пропустить этот шаг и добавить иконку позже
            </p>
        `;
    }

    /**
     * Шаг 3: Название и описание
     */
    getStep3Content() {
        return `
            <h3 style="margin-bottom: 20px; color: var(--ruby-light);">Настройте сервер</h3>
            <div class="form-group">
                <label for="serverName" style="display: block; margin-bottom: 8px; font-weight: 600;">
                    Название сервера <span style="color: var(--ruby-primary);">*</span>
                </label>
                <input 
                    type="text" 
                    id="serverName" 
                    class="form-input" 
                    placeholder="Мой классный сервер" 
                    maxlength="100"
                    value="${this.serverData.name}"
                    required
                    aria-required="true"
                    aria-invalid="false"
                >
            </div>
            <div class="form-group" style="margin-top: 20px;">
                <label for="serverDescription" style="display: block; margin-bottom: 8px; font-weight: 600;">
                    Описание (опционально)
                </label>
                <textarea 
                    id="serverDescription" 
                    class="form-input" 
                    placeholder="Расскажите о вашем сервере..."
                    rows="4"
                    maxlength="500"
                    aria-label="Описание сервера"
                >${this.serverData.description}</textarea>
                <div style="text-align: right; font-size: 12px; opacity: 0.6; margin-top: 5px;">
                    <span id="descCharCount">0</span>/500
                </div>
            </div>
            ${this.serverData.icon ? `
                <div class="selected-icon-preview" style="margin-top: 20px; text-align: center;">
                    <p style="margin-bottom: 10px; opacity: 0.8;">Выбранная иконка:</p>
                    <img src="${this.serverData.icon}" alt="Иконка сервера" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid var(--ruby-primary);">
                </div>
            ` : ''}
        `;
    }

    /**
     * Получить кнопки для текущего шага
     */
    getButtons() {
        const buttons = [];

        // Кнопка "Назад"
        if (this.currentStep > 1) {
            buttons.push({
                text: 'Назад',
                className: 'btn-secondary',
                onClick: () => this.previousStep(),
                close: false
            });
        }

        // Кнопка "Отмена"
        buttons.push({
            text: 'Отмена',
            className: 'btn-secondary',
            onClick: () => this.cancel()
        });

        // Кнопка "Далее" или "Создать"
        if (this.currentStep < this.totalSteps) {
            buttons.push({
                text: 'Далее',
                className: 'btn-primary',
                onClick: () => this.nextStep(),
                close: false
            });
        } else {
            buttons.push({
                text: 'Создать',
                className: 'btn-primary',
                onClick: () => this.createServer(),
                close: false
            });
        }

        return buttons;
    }

    /**
     * Прикрепить обработчики событий
     */
    attachEventListeners() {
        setTimeout(() => {
            if (this.currentStep === 1) {
                this.attachStep1Listeners();
            } else if (this.currentStep === 2) {
                this.attachStep2Listeners();
            } else if (this.currentStep === 3) {
                this.attachStep3Listeners();
            }
        }, 100);
    }

    /**
     * Обработчики для шага 1
     */
    attachStep1Listeners() {
        const templates = document.querySelectorAll('.template-card');
        templates.forEach(card => {
            card.addEventListener('click', () => this.selectTemplate(card));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectTemplate(card);
                }
            });
        });
    }

    /**
     * Обработчики для шага 2
     */
    attachStep2Listeners() {
        const uploadArea = document.getElementById('iconUploadArea');
        const fileInput = document.getElementById('serverIconInput');

        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInput.click();
                }
            });

            fileInput.addEventListener('change', (e) => this.handleIconUpload(e));

            // Drag and drop
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = 'var(--ruby-primary)';
                uploadArea.style.background = 'rgba(224, 17, 95, 0.1)';
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.borderColor = 'rgba(224, 17, 95, 0.3)';
                uploadArea.style.background = 'rgba(26, 11, 15, 0.5)';
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = 'rgba(224, 17, 95, 0.3)';
                uploadArea.style.background = 'rgba(26, 11, 15, 0.5)';
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.processIconFile(files[0]);
                }
            });
        }
    }

    /**
     * Обработчики для шага 3
     */
    attachStep3Listeners() {
        const nameInput = document.getElementById('serverName');
        const descInput = document.getElementById('serverDescription');
        const charCount = document.getElementById('descCharCount');

        if (nameInput) {
            nameInput.focus();
            nameInput.addEventListener('input', (e) => {
                this.serverData.name = e.target.value;
            });
        }

        if (descInput && charCount) {
            charCount.textContent = descInput.value.length;
            descInput.addEventListener('input', (e) => {
                this.serverData.description = e.target.value;
                charCount.textContent = e.target.value.length;
            });
        }
    }

    /**
     * Выбрать шаблон
     */
    selectTemplate(card) {
        document.querySelectorAll('.template-card').forEach(c => {
            c.classList.remove('selected');
            c.setAttribute('aria-checked', 'false');
        });
        card.classList.add('selected');
        card.setAttribute('aria-checked', 'true');
        this.serverData.template = card.dataset.template;
    }

    /**
     * Обработка загрузки иконки
     */
    handleIconUpload(e) {
        const file = e.target.files[0];
        if (file) {
            this.processIconFile(file);
        }
    }

    /**
     * Обработка файла иконки
     */
    processIconFile(file) {
        if (!file.type.startsWith('image/')) {
            window.notificationManager.show({
                title: 'Ошибка',
                message: 'Пожалуйста, выберите изображение',
                duration: 3000
            });
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.serverData.icon = e.target.result;
            this.updateIconPreview(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    /**
     * Обновить превью иконки
     */
    updateIconPreview(imageUrl) {
        const preview = document.getElementById('iconPreview');
        if (preview) {
            preview.innerHTML = `
                <img src="${imageUrl}" alt="Превью иконки" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 3px solid var(--ruby-primary);">
                <p style="margin-top: 15px; color: var(--ruby-primary);">
                    <i class="fas fa-check-circle" aria-hidden="true"></i> Иконка загружена
                </p>
            `;
        }
    }

    /**
     * Следующий шаг
     */
    nextStep() {
        if (!this.validateStep()) {
            return;
        }

        this.currentStep++;
        this.updateModal();
    }

    /**
     * Предыдущий шаг
     */
    previousStep() {
        this.currentStep--;
        this.updateModal();
    }

    /**
     * Валидация текущего шага
     */
    validateStep() {
        if (this.currentStep === 1 && !this.serverData.template) {
            window.notificationManager.show({
                title: 'Выберите шаблон',
                message: 'Пожалуйста, выберите один из шаблонов',
                duration: 3000
            });
            return false;
        }
        return true;
    }

    /**
     * Обновить модальное окно
     */
    updateModal() {
        if (this.modalId) {
            window.modalManager.close(this.modalId);
        }
        this.show();
    }

    /**
     * Создать сервер
     */
    async createServer() {
        const nameInput = document.getElementById('serverName');
        const descInput = document.getElementById('serverDescription');

        if (nameInput) {
            this.serverData.name = nameInput.value.trim();
        }
        if (descInput) {
            this.serverData.description = descInput.value.trim();
        }

        if (!this.serverData.name) {
            const input = document.getElementById('serverName');
            if (input) {
                input.setAttribute('aria-invalid', 'true');
                input.focus();
            }
            window.notificationManager.show({
                title: 'Ошибка',
                message: 'Введите название сервера',
                duration: 3000
            });
            return;
        }

        try {
            // TODO: Отправить запрос на сервер для создания
            console.log('Creating server:', this.serverData);
            
            window.notificationManager.show({
                title: 'Успех',
                message: `Сервер "${this.serverData.name}" создан!`,
                duration: 3000,
                sound: 'notification'
            });

            if (this.modalId) {
                window.modalManager.close(this.modalId);
            }

            // Вызвать callback если есть
            if (typeof window.onServerCreated === 'function') {
                window.onServerCreated(this.serverData);
            }
        } catch (error) {
            console.error('Error creating server:', error);
            window.notificationManager.show({
                title: 'Ошибка',
                message: 'Не удалось создать сервер',
                duration: 3000
            });
        }
    }

    /**
     * Отменить создание
     */
    cancel() {
        if (this.modalId) {
            window.modalManager.close(this.modalId);
        }
    }

    /**
     * Очистка при закрытии
     */
    cleanup() {
        this.currentStep = 1;
        this.serverData = {
            template: null,
            icon: null,
            name: '',
            description: ''
        };
    }
}

// Глобальный экземпляр
window.serverCreateModal = new ServerCreateModal();
