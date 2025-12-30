// Alta52 - Simple Server Creation Modal
// Simplified single-page server creation without templates/wizards

class ServerCreateModal {
  constructor() {
    this.modal = null;
  }
  
  show() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
      <div class="modal-container server-create-modal">
        <div class="modal-header">
          <h2>Создать сервер</h2>
          <button class="modal-close" aria-label="Закрыть">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="server-icon-upload">
            <div class="icon-preview" id="server-icon-preview">
              <svg width="80" height="80" viewBox="0 0 24 24">
                <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
            </div>
            <input type="file" id="server-icon-input" accept="image/*" style="display: none;">
            <button type="button" class="btn-secondary" onclick="document.getElementById('server-icon-input').click()">
              Загрузить иконку
            </button>
          </div>
          
          <div class="form-group">
            <label for="server-name">Название сервера *</label>
            <input 
              type="text" 
              id="server-name" 
              class="form-control" 
              placeholder="Мой офигенный сервер"
              maxlength="100"
              required
            >
          </div>
          
          <div class="form-group">
            <label for="server-description">Описание (опционально)</label>
            <textarea 
              id="server-description" 
              class="form-control" 
              placeholder="О чём этот сервер?"
              maxlength="500"
              rows="3"
            ></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-secondary modal-cancel">Отмена</button>
          <button class="btn-primary" id="create-server-btn">Создать</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.modal = modal;
    
    // Обработчики
    this.setupEventListeners();
    
    // Фокус на поле ввода
    setTimeout(() => {
      document.getElementById('server-name').focus();
    }, 100);
  }
  
  setupEventListeners() {
    // Закрытие
    this.modal.querySelector('.modal-close').addEventListener('click', () => this.close());
    this.modal.querySelector('.modal-cancel').addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) this.close();
    });
    
    // Превью иконки
    const iconInput = document.getElementById('server-icon-input');
    iconInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = document.getElementById('server-icon-preview');
          preview.innerHTML = `<img src="${e.target.result}" alt="Server icon">`;
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Создание сервера
    document.getElementById('create-server-btn').addEventListener('click', () => this.createServer());
    
    // Enter для отправки
    document.getElementById('server-name').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.createServer();
      }
    });
  }
  
  async createServer() {
    const name = document.getElementById('server-name').value.trim();
    const description = document.getElementById('server-description').value.trim();
    const iconInput = document.getElementById('server-icon-input');
    
    if (!name) {
      if (window.toast) {
        window.toast.error('Ошибка', 'Введите название сервера');
      } else {
        alert('Введите название сервера');
      }
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      let response;
      
      // If there's an icon file, upload it first
      if (iconInput.files[0]) {
        const formData = new FormData();
        formData.append('file', iconInput.files[0]);
        
        const uploadResponse = await fetch('/api/v1/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        const uploadData = await uploadResponse.json();
        
        if (!uploadData.success) {
          throw new Error('Failed to upload icon');
        }
        
        // Create server with icon URL
        response = await fetch('/api/servers', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            description,
            icon: uploadData.data.url
          })
        });
      } else {
        // Create server without icon
        response = await fetch('/api/servers', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            description
          })
        });
      }
      
      const data = await response.json();
      
      if (data.success) {
        this.close();
        // Обновить список серверов
        if (window.loadUserServers) window.loadUserServers();
        // Показать уведомление
        if (window.toast) {
          window.toast.success('Успех', 'Сервер создан!');
        }
      } else {
        if (window.toast) {
          window.toast.error('Ошибка', data.error.message || 'Ошибка создания сервера');
        } else {
          alert(data.error.message || 'Ошибка создания сервера');
        }
      }
    } catch (error) {
      console.error('Error creating server:', error);
      if (window.toast) {
        window.toast.error('Ошибка', 'Ошибка при создании сервера');
      } else {
        alert('Ошибка при создании сервера');
      }
    }
  }
  
  close() {
    if (this.modal) {
      this.modal.classList.remove('active');
      setTimeout(() => this.modal.remove(), 300);
    }
  }
}

// Глобальный доступ
window.serverCreateModal = new ServerCreateModal();
