function openPhotoSidebar() {
  if (document.getElementById('photo-sidebar-wrap')) {
    document.getElementById('photo-sidebar-wrap').classList.add('open');
    return;
  }
  
  const wrap = document.createElement('div');
  wrap.id = 'photo-sidebar-wrap';
  wrap.className = 'photo-sidebar-overlay';
  
  const sidebar = document.createElement('div');
  sidebar.className = 'photo-sidebar';
  
  const iframe = document.createElement('iframe');
  iframe.src = 'images.html';
  
  sidebar.appendChild(iframe);
  wrap.appendChild(sidebar);
  
  // Close on overlay click
  wrap.addEventListener('click', e => {
    if (e.target === wrap) closePhotoSidebar();
  });
  
  document.body.appendChild(wrap);
  
  // Trigger transition
  setTimeout(() => wrap.classList.add('open'), 10);
  
  // Allow iframe to call this to close itself
  window.closePhotoSidebar = closePhotoSidebar;
}

function closePhotoSidebar() {
  const wrap = document.getElementById('photo-sidebar-wrap');
  if (wrap) {
    wrap.classList.remove('open');
  }
}
