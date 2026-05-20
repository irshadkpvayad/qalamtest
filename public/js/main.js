document.addEventListener('DOMContentLoaded', () => {
  // Navbar blur on scroll
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // Reading progress bar
  const progressBar = document.getElementById('reading-progress');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      progressBar.style.width = scrolled + "%";
    });
  }

  // Back to top button
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });

    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // View tracking (debounce with sessionStorage)
  const trackView = async () => {
    const postElement = document.querySelector('[data-post-id]');
    if (postElement) {
      const postId = postElement.getAttribute('data-post-id');
      const viewedKey = `viewed_${postId}`;
      
      if (!sessionStorage.getItem(viewedKey)) {
        try {
          await fetch(`/api/track-view/${postId}`, { method: 'POST' });
          sessionStorage.setItem(viewedKey, 'true');
        } catch (e) {
          console.error('Failed to track view', e);
        }
      }
    }
  };
  
  // Delay tracking slightly to ensure it's a real view
  setTimeout(trackView, 3000);

  // AJAX forms handling
  const ajaxForms = document.querySelectorAll('.ajax-form');
  ajaxForms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Processing...';
      btn.disabled = true;

      try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const response = await fetch(form.action, {
          method: form.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
          // Special handling for Like button
          if (form.action.includes('/like/')) {
            const icon = btn.querySelector('i');
            const countSpan = document.getElementById('likes-count');
            let count = parseInt(countSpan.innerText || '0');
            
            if (result.liked) {
              btn.classList.add('liked');
              icon.classList.remove('far');
              icon.classList.add('fas');
              count++;
            } else {
              btn.classList.remove('liked');
              icon.classList.remove('fas');
              icon.classList.add('far');
              count--;
            }
            countSpan.innerText = count;
          } else {
            showToast(result.message || 'Success!', 'success');
            form.reset();
          }
        } else {
          showToast(result.error || 'An error occurred', 'error');
        }
      } catch (err) {
        showToast('An error occurred', 'error');
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });
  });
});

// Toast notification function
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
  
  // Basic styles applied directly for toast types
  toast.style.borderLeft = `4px solid ${type === 'error' ? 'var(--error)' : 'var(--success)'}`;
  toast.innerHTML = message;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOutLeft 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);
  return container;
}
