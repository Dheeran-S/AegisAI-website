// main.js — shared page bootstrap

const API = '';  // same-origin

// ── Dynamic Navbar ────────────────────────────────────────────────────
// Builds the nav from the DB so new/deleted pages appear automatically
async function loadNav(activeSlug) {
  const ul = document.getElementById('nav-links');
  if (!ul) return;
  try {
    const res   = await fetch('/api/pages');
    const pages = await res.json();
    ul.innerHTML = pages.map(p => {
      const href   = p.slug === 'home' ? '/' : `/${p.slug}.html`;
      const active = p.slug === activeSlug ? ' class="active"' : '';
      return `<li><a href="${href}" data-page="${p.slug}"${active}>${p.title}</a></li>`;
    }).join('');
  } catch (e) {
    console.warn('Nav load failed', e);
  }
}

async function loadPage(slug, targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;

  try {
    target.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
    const res  = await fetch(`${API}/api/pages/${slug}`);
    if (!res.ok) throw new Error('Page not found');
    const page = await res.json();

    // Set meta
    document.title = page.title + ' — AegisAI 2027';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = page.meta_description || '';

    // Render sections
    let html = '';
    for (const section of page.sections) {
      html += renderSection(section);
    }
    target.innerHTML = html;
    initFadeIn();
    initVideoLoopTransition();
    highlightNav(slug);
  } catch (err) {
    target.innerHTML = `<div class="page-loading"><p style="color:var(--muted)">Unable to load content.</p></div>`;
  }
}


function highlightNav(slug) {
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === slug);
  });
}

function initVideoLoopTransition() {
  const video = document.querySelector('.hero-video-bg');
  if (!video) return;

  video.addEventListener('timeupdate', () => {
    // Fade out to black 0.4 seconds before the video ends to create a smooth loop transition
    if (video.duration > 0 && video.duration - video.currentTime < 0.4) {
      video.style.opacity = '0';
    } else {
      video.style.opacity = '1';
    }
  });
}

// Navbar hamburger
document.addEventListener('DOMContentLoaded', () => {
  const ham = document.getElementById('nav-hamburger');
  const links = document.getElementById('nav-links');
  if (ham && links) {
    ham.addEventListener('click', () => links.classList.toggle('open'));
  }
});
