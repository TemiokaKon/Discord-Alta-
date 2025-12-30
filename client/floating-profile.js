document.addEventListener('DOMContentLoaded', () => {
  const fp = document.getElementById('floatingProfile');
  const trigger = document.getElementById('userPanelTrigger');

  if (!fp || !trigger) return;

  const avatarEl = document.getElementById('fpAvatar');
  const usernameEl = document.getElementById('fpUsername');
  const statusEl = document.getElementById('fpStatusText');

  function loadUser() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  function hydrate() {
    const user = loadUser();
    const username = user?.username || 'Пользователь';
    const avatar = user?.avatar;

    // Handle avatar rendering
    if (avatarEl) {
      if (avatar && (avatar.startsWith('http') || avatar.startsWith('/'))) {
        // Render as image
        avatarEl.innerHTML = '';
        const img = document.createElement('img');
        img.src = avatar;
        img.alt = username;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 50%;';
        img.onerror = () => {
          // Fallback to letter if image fails to load
          avatarEl.innerHTML = username?.[0]?.toUpperCase() || 'U';
        };
        avatarEl.appendChild(img);
      } else {
        // Render as letter
        avatarEl.textContent = avatar || username?.[0]?.toUpperCase() || 'U';
      }
    }
    
    if (usernameEl) usernameEl.textContent = username;
    if (statusEl) statusEl.textContent = 'Онлайн';
  }

  function open() {
    hydrate();
    fp.classList.add('show');
    fp.setAttribute('aria-hidden', 'false');
  }

  function close() {
    fp.classList.remove('show');
    fp.setAttribute('aria-hidden', 'true');
  }

  function toggle() {
    if (fp.classList.contains('show')) close();
    else open();
  }

  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  });

  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  document.addEventListener('click', (e) => {
    if (!fp.classList.contains('show')) return;
    if (fp.contains(e.target)) return;
    if (trigger.contains(e.target)) return;
    close();
  });
});