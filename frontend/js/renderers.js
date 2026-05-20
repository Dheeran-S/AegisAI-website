// ── Section Renderers ──────────────────────────────────────────────────

function renderHero(data) {
  const badge = data.badge && data.badge.trim().toLowerCase() !== 'none' && data.badge.trim() !== ''
    ? `<div class="hero-badge">${esc(data.badge)}</div>`
    : '';
  return `
  <section class="hero">
    <video class="hero-video-bg" autoplay loop muted playsinline>
      <source src="/images/aegis_hero.webm" type="video/webm">
    </video>
    <div class="hero-inner">
      <div class="hero-logo-row">
        <div class="snu-logo">
          <span class="sl-top">SHIV NADAR</span>
          <span class="sl-mid">UNIVERSITY</span>
          <span class="sl-bot">C H E N N A I</span>
        </div>
        ${badge}
      </div>
      <h1>${esc(data.conference_name)}</h1>
      <p class="hero-tagline">${esc(data.tagline)}</p>
      <div class="hero-meta">
        <div class="hero-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          ${esc(data.dates)}
        </div>
        <div class="hero-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          ${esc(data.institution)}, ${esc(data.location)}
        </div>
      </div>
      <div class="hero-actions">
        <a href="/cfp" class="btn btn-primary">Submit a Paper</a>
        <a href="/about" class="btn btn-outline">Learn More</a>
      </div>
    </div>
  </section>`;
}

function renderKeyDates(data) {
  const cards = (data.dates || []).map(d => `
    <div class="date-card fade-in">
      <div class="date-card-label">${esc(d.label)}</div>
      <div class="date-card-value">${esc(d.date)}</div>
    </div>`).join('');
  return `
  <section class="key-dates-strip">
    <div class="key-dates-grid">${cards}</div>
  </section>`;
}

function renderTextBlock(data) {
  return `
  <section class="section fade-in">
    <div class="container">
      <h2 class="section-title">${esc(data.heading)}</h2>
      <div class="section-line"></div>
      <div class="text-block-card">
        <p>${esc(data.body)}</p>
      </div>
    </div>
  </section>`;
}

function renderLogoBar(data) {
  const logos = (data.logos || []).map(l => {
    if (l.url && l.url.trim() !== '' && l.url.trim() !== '#') {
      return `<img src="${esc(l.url)}" alt="${esc(l.name)}" class="logo-image" title="${esc(l.name)}">`;
    }
    return `<div class="logo-placeholder">${esc(l.name)}</div>`;
  }).join('');
  return `
  <div class="logo-bar fade-in">
    <div class="logo-bar-heading">${esc(data.heading || 'Sponsors & Co-Organisers')}</div>
    <div class="logo-bar-items">${logos}</div>
  </div>`;
}

function renderUniversityInfo(data) {
  const lines = (data.logo_text || 'SHIV NADAR\nUNIVERSITY\nCHENNAI').split('\n');
  return `
  <section class="university-section">
    <div class="univ-inner">
      <div class="univ-logo-wrap fade-in">
        <div class="univ-logo-text">
          <span class="ult-top">${esc(lines[0] || 'SHIV NADAR')}</span>
          <span class="ult-mid">${esc(lines[1] || 'UNIVERSITY')}</span>
          <span class="ult-bot">${esc(lines[2] || 'CHENNAI')}</span>
        </div>
      </div>
      <div class="univ-content fade-in">
        <h2>${esc(data.heading)}</h2>
        <p>${esc(data.body)}</p>
        <div class="univ-meta">
          <div class="univ-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
            ${esc(data.location)}
          </div>
        </div>
        <a href="${esc(data.website_url || '#')}" target="_blank" class="univ-link">
          Visit University Website
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
      </div>
    </div>
  </section>`;
}

function renderTopicsList(data) {
  const items = (data.topics || []).map(t => `<div class="topic-item">${esc(t)}</div>`).join('');
  return `
  <section class="section fade-in">
    <div class="container">
      <h2 class="section-title">${esc(data.heading || 'Topics of Interest')}</h2>
      <div class="section-line"></div>
      <p class="section-intro">${esc(data.intro)}</p>
      <div class="topics-grid">${items}</div>
    </div>
  </section>`;
}

function renderDatesTable(data) {
  const rows = (data.rows || []).map(r => `
    <tr>
      <td>${esc(r.event)}</td>
      <td class="td-date">${esc(r.date)}</td>
      <td class="td-note">${esc(r.note || '')}</td>
    </tr>`).join('');
  return `
  <section class="section section-alt fade-in">
    <div class="container">
      <h2 class="section-title">${esc(data.heading || 'Important Dates')}</h2>
      <div class="section-line"></div>
      <table class="dates-table">
        <thead><tr><th>Event</th><th>Date</th><th>Note</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>`;
}

function renderSubmitButton(data) {
  return `
  <section class="section fade-in">
    <div class="container">
      <div class="submit-section">
        <h3>${esc(data.heading || 'Submit Your Paper')}</h3>
        <p>${esc(data.note)}</p>
        <a href="${esc(data.url || '#')}" class="btn btn-primary" target="_blank">${esc(data.label || 'Submit Paper')}</a>
      </div>
    </div>
  </section>`;
}

function renderSpeakerGrid(data) {
  const cards = (data.speakers || []).map(s => {
    const initials = s.name === 'To Be Announced' ? '?' : s.name.split(' ').map(w=>w[0]).join('').slice(0,2);
    const avatar = s.photo_url
      ? `<img src="${esc(s.photo_url)}" alt="${esc(s.name)}">`
      : `<div class="speaker-avatar-initials">${esc(initials)}</div>`;
    return `
    <div class="speaker-card fade-in">
      <div class="speaker-avatar">${avatar}</div>
      <div class="speaker-body">
        <div class="speaker-name">${esc(s.name)}</div>
        <div class="speaker-affil">${esc(s.affiliation)}</div>
      </div>
    </div>`;
  }).join('');
  return `
  <section class="section fade-in">
    <div class="container">
      <h2 class="section-title">${esc(data.heading || 'Keynote Speakers')}</h2>
      <div class="section-line"></div>
      <div class="speakers-grid">${cards}</div>
    </div>
  </section>`;
}

function renderCommitteeGroup(data) {
  const groups = (data.groups || []).map(g => {
    const members = (g.members || []).map(m => `
      <div class="committee-member">
        <div class="member-name">${esc(m.name)}</div>
        <div class="member-affil">${esc(m.affiliation)}</div>
      </div>`).join('');
    return `
    <div class="fade-in">
      <div class="committee-role-title">${esc(g.role)}</div>
      <div class="committee-members">${members}</div>
    </div>`;
  }).join('');
  return `
  <section class="section">
    <div class="container">
      <div class="committee-groups">${groups}</div>
    </div>
  </section>`;
}

function renderMapEmbed(data) {
  const mapHtml = data.map_url
    ? `<div class="map-wrapper"><iframe src="${esc(data.map_url)}" allowfullscreen loading="lazy"></iframe></div>`
    : '';
  return `
  <section class="section section-alt fade-in">
    <div class="container">
      <div class="venue-address">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
        <pre>${esc(data.address)}</pre>
      </div>
      ${mapHtml}
      ${data.travel_info ? `<div class="text-block-card" style="margin-top:1.5rem"><h2>Getting Here</h2><p>${esc(data.travel_info)}</p></div>` : ''}
    </div>
  </section>`;
}

function renderContactInfo(data) {
  const socials = (data.socials || []).map(s => `
    <div class="contact-detail">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
      <div>
        <div class="contact-detail-label">${esc(s.platform)}</div>
        <div class="contact-detail-value"><a href="${esc(s.url)}" target="_blank">${esc(s.handle)}</a></div>
      </div>
    </div>`).join('');
  return `
    <div class="contact-info-card">
      <h3>Get in Touch</h3>
      <div class="contact-detail">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        <div>
          <div class="contact-detail-label">Email</div>
          <div class="contact-detail-value"><a href="mailto:${esc(data.email)}">${esc(data.email)}</a></div>
        </div>
      </div>
      ${data.phone && data.phone !== 'To Be Announced' ? `
      <div class="contact-detail">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
        <div>
          <div class="contact-detail-label">Phone</div>
          <div class="contact-detail-value">${esc(data.phone)}</div>
        </div>
      </div>` : ''}
      <div class="contact-detail">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
        <div>
          <div class="contact-detail-label">Address</div>
          <div class="contact-detail-value">${esc(data.address)}</div>
        </div>
      </div>
      ${socials}
    </div>`;
}

// ── Dispatcher ────────────────────────────────────────────────────────
function renderSection(section) {
  const d = section.data;
  switch (section.type) {
    case 'hero':            return renderHero(d);
    case 'key_dates':       return renderKeyDates(d);
    case 'text_block':      return renderTextBlock(d);
    case 'logo_bar':        return renderLogoBar(d);
    case 'university_info': return renderUniversityInfo(d);
    case 'topics_list':     return renderTopicsList(d);
    case 'dates_table':     return renderDatesTable(d);
    case 'submit_button':   return renderSubmitButton(d);
    case 'speaker_grid':    return renderSpeakerGrid(d);
    case 'committee_group': return renderCommitteeGroup(d);
    case 'map_embed':       return renderMapEmbed(d);
    case 'contact_info':    return renderContactInfo(d);
    default:                return '';
  }
}

// ── Helpers ───────────────────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ── Intersection observer for fade-in ─────────────────────────────────
function initFadeIn() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}
