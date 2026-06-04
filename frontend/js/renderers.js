// ── Section Renderers ──────────────────────────────────────────────────

function renderHero(data) {
  return `
  <section class="hero">
    <img class="hero-video-bg" src="/images/Gemini_Generated_Image_3oej803oej803oej.png" alt="University Gate">
    
    <div class="hero-content-wrapper">
      <div class="hero-center-content">
        <h1>${allowSafeHtml(data.conference_name)}</h1>
        <h2 class="hero-fullname">${allowSafeHtml(data.tagline).replace('Secure and Intelligent', '<br>Secure & Intelligent')}</h2>
        <div class="hero-center-actions-stacked">
          <a href="/cfp" class="btn btn-pill btn-primary">Call for Papers</a>
        </div>
      </div>
    </div>
  </section>`;
}

function renderKeyDates(data) {
  const cards = (data.dates || []).map(d => `
    <div class="date-card fade-in">
      <div class="date-card-label">${allowSafeHtml(d.label)}</div>
      <div class="date-card-value">${allowSafeHtml(d.date)}</div>
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
      <h2 class="section-title">${allowSafeHtml(data.heading)}</h2>
      <div class="section-line"></div>
      <div class="text-block-card">
        <p>${allowSafeHtml(data.body)}</p>
      </div>
    </div>
  </section>`;
}

function renderLogoBar(data) {
  const logos = (data.logos || []).map(l => {
    if (l.url && l.url.trim() !== '' && l.url.trim() !== '#') {
      return `<img src="${esc(l.url)}" alt="${esc(l.name)}" class="logo-image" title="${esc(l.name)}">`;
    }
    return `<div class="logo-placeholder">${allowSafeHtml(l.name)}</div>`;
  }).join('');
  return `
  <div class="logo-bar fade-in">
    <div class="logo-bar-heading">${allowSafeHtml(data.heading || 'Sponsors & Co-Organisers')}</div>
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
          <span class="ult-top">${allowSafeHtml(lines[0] || 'SHIV NADAR')}</span>
          <span class="ult-mid">${allowSafeHtml(lines[1] || 'UNIVERSITY')}</span>
          <span class="ult-bot">${allowSafeHtml(lines[2] || 'CHENNAI')}</span>
        </div>
      </div>
      <div class="univ-content fade-in">
        <h2>${allowSafeHtml(data.heading)}</h2>
        <p>${allowSafeHtml(data.body)}</p>
        <div class="univ-meta">
          <div class="univ-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
            ${allowSafeHtml(data.location)}
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
  const items = (data.topics || []).map(t => `<div class="topic-item">${allowSafeHtml(t)}</div>`).join('');
  return `
  <section class="section fade-in">
    <div class="container">
      <h2 class="section-title">${allowSafeHtml(data.heading || 'Topics of Interest')}</h2>
      <div class="section-line"></div>
      <p class="section-intro">${allowSafeHtml(data.intro)}</p>
      <div class="topics-grid">${items}</div>
    </div>
  </section>`;
}

function renderDatesTable(data) {
  const rows = (data.rows || []).map(r => `
    <tr>
      <td>${allowSafeHtml(r.event)}</td>
      <td class="td-date">${allowSafeHtml(r.date)}</td>
      <td class="td-note">${allowSafeHtml(r.note || '')}</td>
    </tr>`).join('');
  return `
  <section class="section section-alt fade-in">
    <div class="container">
      <h2 class="section-title">${allowSafeHtml(data.heading || 'Important Dates')}</h2>
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
        <h3>${allowSafeHtml(data.heading || 'Submit Your Paper')}</h3>
        <p>${allowSafeHtml(data.note)}</p>
        <a href="${esc(data.url || '#')}" class="btn btn-primary" target="_blank">${allowSafeHtml(data.label || 'Submit Paper')}</a>
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
        <div class="speaker-name">${allowSafeHtml(s.name)}</div>
        <div class="speaker-affil">${allowSafeHtml(s.affiliation)}</div>
      </div>
    </div>`;
  }).join('');
  return `
  <section class="section fade-in">
    <div class="container">
      <h2 class="section-title">${allowSafeHtml(data.heading || 'Keynote Speakers')}</h2>
      <div class="section-line"></div>
      <div class="speakers-grid">${cards}</div>
    </div>
  </section>`;
}

function renderCommitteeGroup(data) {
  const groups = (data.groups || []).map(g => {
    const members = (g.members || []).map(m => `
      <div class="committee-member">
        <div class="member-name">${allowSafeHtml(m.name)}</div>
        <div class="member-affil">${allowSafeHtml(m.affiliation)}</div>
      </div>`).join('');
    return `
    <div class="fade-in">
      <div class="committee-role-title">${allowSafeHtml(g.role)}</div>
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
        <pre>${allowSafeHtml(data.address)}</pre>
      </div>
      ${mapHtml}
      ${data.travel_info ? `<div class="text-block-card" style="margin-top:1.5rem"><h2>Getting Here</h2><p>${allowSafeHtml(data.travel_info)}</p></div>` : ''}
    </div>
  </section>`;
}

function renderContactInfo(data) {
  const socials = (data.socials || []).map(s => `
    <div class="contact-detail">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
      <div>
        <div class="contact-detail-label">${allowSafeHtml(s.platform)}</div>
        <div class="contact-detail-value"><a href="${esc(s.url)}" target="_blank">${allowSafeHtml(s.handle)}</a></div>
      </div>
    </div>`).join('');
  return `
    <div class="contact-info-card">
      <h3>Get in Touch</h3>
      <div class="contact-detail">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        <div>
          <div class="contact-detail-label">Email</div>
          <div class="contact-detail-value"><a href="mailto:${esc(data.email)}">${allowSafeHtml(data.email)}</a></div>
        </div>
      </div>
      ${data.phone && data.phone !== 'To Be Announced' ? `
      <div class="contact-detail">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
        <div>
          <div class="contact-detail-label">Phone</div>
          <div class="contact-detail-value">${allowSafeHtml(data.phone)}</div>
        </div>
      </div>` : ''}
      <div class="contact-detail">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
        <div>
          <div class="contact-detail-label">Address</div>
          <div class="contact-detail-value">${allowSafeHtml(data.address)}</div>
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

function allowSafeHtml(str) {
  if (!str) return '';
  return String(str);
}

// ── Intersection observer for fade-in ─────────────────────────────────
function initFadeIn() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}
