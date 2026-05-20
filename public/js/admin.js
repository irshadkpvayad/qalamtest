document.addEventListener('DOMContentLoaded', () => {
  // Initialize Quill if present
  const quillContainer = document.getElementById('quill-editor');
  if (quillContainer) {
    const quill = new Quill('#quill-editor', {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'align': [] }],
          ['blockquote', 'code-block'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['link', 'image', 'video'],
          ['clean']
        ]
      }
    });

    const contentTextarea = document.getElementById('content');
    
    // Sync Quill to textarea on change
    quill.on('text-change', function() {
      contentTextarea.value = quill.root.innerHTML;
      updateWordCount(quill.getText());
    });
    
    // Auto-save logic reference
    window.quillEditor = quill;
  }

  // Word count & read time estimator
  function updateWordCount(text = '') {
    if (!text) {
      const contentEl = document.getElementById('content');
      if (contentEl) {
        text = contentEl.value.replace(/(<([^>]+)>)/ig, "");
      }
    }
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const wordCountEl = document.getElementById('word-count');
    const readTimeEl = document.getElementById('read-time');
    
    if (wordCountEl) wordCountEl.textContent = words;
    if (readTimeEl) readTimeEl.textContent = Math.ceil(words / 150); // 150 words per minute for Malayalam approx
  }
  
  // Initial word count
  updateWordCount();

  // Auto-save draft
  const postForm = document.getElementById('post-form');
  if (postForm) {
    let timeoutId;
    postForm.addEventListener('input', () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Sync quill again just in case
        if (window.quillEditor && document.getElementById('content')) {
          document.getElementById('content').value = window.quillEditor.root.innerHTML;
        }
        
        // Only autosave if it's not a new unsaved post yet
        // OR we can save it as draft. We'll do a simple fetch
        const formData = new FormData(postForm);
        formData.append('action', 'autosave');
        
        fetch(postForm.action, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new URLSearchParams(formData)
        })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.id) {
            showAdminToast('Draft auto-saved', 'success');
            // If it was new, update form action so next save updates it
            if (postForm.action.endsWith('/new')) {
              postForm.action = `/admin/posts/edit/${data.id}`;
              window.history.replaceState({}, '', `/admin/posts/edit/${data.id}`);
            }
          }
        })
        .catch(err => console.error('Auto-save failed', err));
      }, 60000); // 60 seconds debounce
    });
  }

  // Copy to clipboard for media URLs
  const copyBtns = document.querySelectorAll('.copy-url-btn');
  copyBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const url = e.target.dataset.url;
      navigator.clipboard.writeText(url).then(() => {
        showAdminToast('URL copied to clipboard!', 'success');
      });
    });
  });
});

function showAdminToast(message, type = 'success') {
  alert(message); // Simplified for admin panel if no toast container exists
}

document.addEventListener('DOMContentLoaded', () => {
  // AJAX Delete Post with Loading Animation
  const deleteBtns = document.querySelectorAll('.delete-post-btn');
  
  deleteBtns.forEach(btn => {
    btn.addEventListener('click', async function() {
      const postId = this.dataset.id;
      const row = this.closest('tr');
      
      if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) {
        return;
      }
      
      // Store original content to restore on error
      const originalHTML = this.innerHTML;
      const originalWidth = this.offsetWidth;
      
      // Show loading state
      this.style.width = originalWidth + 'px';
      this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      this.disabled = true;
      this.classList.add('loading');
      
      try {
        const response = await fetch(`/admin/posts/delete/${postId}`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete post');
        }
        
        if (data.success) {
          // Success! Fade out the row and remove it
          row.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          row.style.opacity = '0';
          row.style.transform = 'translateX(-20px)';
          
          setTimeout(() => {
            row.remove();
            
            // Check if table is empty
            const tbody = document.querySelector('.admin-table tbody');
            if (tbody && tbody.children.length === 0) {
              tbody.innerHTML = '<tr><td colspan="5" class="text-center">No posts found.</td></tr>';
            }
          }, 400);
          
          showAdminToast('Post deleted successfully', 'success');
        }
      } catch (err) {
        console.error(err);
        showAdminToast('Error: ' + err.message, 'error');
        
        // Restore button
        this.innerHTML = originalHTML;
        this.disabled = false;
        this.classList.remove('loading');
      }
    });
  });
});
