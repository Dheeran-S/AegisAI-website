// Admin page editor — section CRUD and field rendering
const API = '/api';
const token = localStorage.getItem('aegis_token');
if (!token) window.location.href = 'login.html';

const params   = new URLSearchParams(location.search);
const pageSlug = params.get('page');
const pageId   = params.get('id');
let   currentPageId = pageId; // kept for Add Section

document.getElementById('admin-name').textContent = localStorage.getItem('aegis_name') || 'Admin';

// ── Auth header ──────────────────────────────────────────────────────
const authHdr = () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });

// ── Image Upload & Cropper ───────────────────────────────────────────
let cropperInstance = null;
let currentUrlInput = null;
let currentUploadBtn = null;

function initCropper(src) {
  const modal = document.getElementById('cropper-modal');
  const img = document.getElementById('cropper-image');
  img.src = src;
  modal.classList.add('open');
  
  if (cropperInstance) cropperInstance.destroy();
  
  cropperInstance = new Cropper(img, {
    aspectRatio: 1,
    viewMode: 1,
    dragMode: 'move',
    zoomable: true,
    autoCropArea: 0.9,
    guides: false,
    center: true,
    highlight: false,
    cropBoxMovable: false,
    cropBoxResizable: false,
    toggleDragModeOnDblclick: false,
    checkCrossOrigin: false
  });
}

function handleImageUpload(btn) {
  const fileInput = btn.previousElementSibling;
  currentUrlInput = btn.nextElementSibling;
  currentUploadBtn = btn;
  
  fileInput.click();
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => initCropper(event.target.result);
    reader.readAsDataURL(file);
    fileInput.value = '';
  };
}

async function openAdjuster(btn) {
  const urlInput = btn.previousElementSibling;
  const src = urlInput.value;
  if (!src) {
    alert("Please upload or enter an image URL first.");
    return;
  }
  currentUrlInput = urlInput;
  currentUploadBtn = btn.previousElementSibling.previousElementSibling;
  
  if (src.startsWith('http') && !src.includes(window.location.host)) {
    const oldText = btn.textContent;
    btn.textContent = 'Loading...';
    btn.disabled = true;
    try {
      const r = await fetch(API + '/images/proxy?url=' + encodeURIComponent(src), {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!r.ok) throw new Error('Failed to load image for cropping');
      const blob = await r.blob();
      initCropper(URL.createObjectURL(blob));
    } catch (err) {
      alert(err.message || 'Network error');
    } finally {
      btn.textContent = oldText;
      btn.disabled = false;
    }
  } else {
    initCropper(src);
  }
}

function closeCropper() {
  document.getElementById('cropper-modal').classList.remove('open');
  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }
}

function applyCrop() {
  if (!cropperInstance) return;
  
  const originalText = currentUploadBtn.textContent;
  currentUploadBtn.textContent = 'Uploading...';
  currentUploadBtn.disabled = true;
  
  const btnCrop = document.getElementById('btn-crop-upload');
  const oldCropText = btnCrop.textContent;
  btnCrop.textContent = 'Uploading...';
  btnCrop.disabled = true;
  
  cropperInstance.getCroppedCanvas({
    width: 600,
    height: 600
  }).toBlob(async (blob) => {
    if (!blob) {
      alert("Failed to crop image.");
      resetUploadState(originalText, oldCropText, btnCrop);
      return;
    }
    const formData = new FormData();
    formData.append('image', blob, 'avatar.jpg');
    try {
      const r = await fetch(API + '/images', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData
      });
      const res = await r.json();
      if (res.success) {
        currentUrlInput.value = res.url;
        closeCropper();
      } else {
        alert(res.error || 'Upload failed');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      resetUploadState(originalText, oldCropText, btnCrop);
    }
  }, 'image/jpeg', 0.9);
}

function resetUploadState(originalText, oldCropText, btnCrop) {
  if (currentUploadBtn) {
    currentUploadBtn.textContent = originalText;
    currentUploadBtn.disabled = false;
  }
  if (btnCrop) {
    btnCrop.textContent = oldCropText;
    btnCrop.disabled = false;
  }
}

// ── Load sections ────────────────────────────────────────────────────
async function loadSections() {
  const r = await fetch(`${API}/pages/${pageSlug}`, { headers: authHdr() });
  const page = await r.json();
  document.getElementById('page-title').textContent = page.title;
  document.getElementById('back-link').href = `dashboard.html`;
  renderSectionList(page.sections);
}

function renderSectionList(sections) {
  const container = document.getElementById('sections-container');
  container.innerHTML = '';
  sections.forEach((s, i) => {
    const card = document.createElement('div');
    card.className = 'section-card';
    card.id = 'sc-' + s.id;
    try {
      card.innerHTML = `
        <div class="section-card-header" onclick="toggleSection(${s.id})">
          <span class="section-type-badge">${s.type.replace(/_/g,' ')}</span>
          <span class="section-card-title">${sectionTitle(s)}</span>
          <div class="section-card-controls">
            ${i > 0 ? `<button class="btn-a btn-ghost-a btn-sm" onclick="event.stopPropagation();moveSection(${s.id},'up')">↑</button>` : ''}
            ${i < sections.length-1 ? `<button class="btn-a btn-ghost-a btn-sm" onclick="event.stopPropagation();moveSection(${s.id},'down')">↓</button>` : ''}
            <button class="btn-a btn-accent-a btn-sm" onclick="event.stopPropagation();toggleSection(${s.id})">Edit</button>
            <button class="btn-a btn-danger-a btn-sm" onclick="event.stopPropagation();deleteSection(${s.id},'${s.type}')">Delete</button>
          </div>
        </div>
        <div class="section-card-body" id="body-${s.id}">
          ${buildForm(s)}
          <div style="margin-top:1rem;display:flex;gap:.75rem;align-items:center">
            <button class="btn-a btn-primary-a" onclick="saveSection(${s.id})">Save Changes</button>
            <span class="alert" id="msg-${s.id}" style="display:none;margin:0"></span>
          </div>
        </div>`;
    } catch (err) {
      console.error(`Failed to render section ${s.id} (${s.type}):`, err);
      card.innerHTML = `
        <div class="section-card-header">
          <span class="section-type-badge">${s.type.replace(/_/g,' ')}</span>
          <span class="section-card-title" style="color:var(--danger)">⚠ Render error — ${err.message}</span>
          <div class="section-card-controls">
            <button class="btn-a btn-danger-a btn-sm" onclick="deleteSection(${s.id},'${s.type}')">Delete</button>
          </div>
        </div>`;
    }
    container.appendChild(card);
  });

  // Add Section panel at the bottom
  const panel = document.createElement('div');
  panel.className = 'a-card';
  panel.style.cssText = 'margin-top:1.5rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap';
  panel.innerHTML = `
    <span style="font-size:.88rem;font-weight:600;color:var(--primary)">Add New Section:</span>
    <select id="new-section-type" class="form-input-a" style="flex:1;min-width:200px;max-width:320px">
      <option value="text_block">Text Block</option>
      <option value="hero">Hero Banner</option>
      <option value="key_dates">Key Dates Strip</option>
      <option value="logo_bar">Logo / Sponsors Bar</option>
      <option value="university_info">University Info</option>
      <option value="topics_list">Topics List</option>
      <option value="dates_table">Dates Table</option>
      <option value="submit_button">Submit Button</option>
      <option value="speaker_grid">Speaker Grid</option>
      <option value="committee_group">Committee Group</option>
      <option value="map_embed">Map Embed</option>
      <option value="contact_info">Contact Info</option>
    </select>
    <button class="btn-a btn-primary-a" onclick="addSection()">+ Add Section</button>
    <span class="alert" id="add-section-msg" style="display:none;margin:0"></span>`;
  container.appendChild(panel);
}

function sectionTitle(s) {
  const d = s.data;
  return d.heading || d.conference_name || d.heading || s.type;
}

function toggleSection(id) {
  const body = document.getElementById('body-' + id);
  body.classList.toggle('open');
}

// ── Save section ─────────────────────────────────────────────────────
async function saveSection(id) {
  const data = collectFormData(id);
  const msg  = document.getElementById('msg-' + id);
  try {
    const r = await fetch(`${API}/sections/${id}`, {
      method: 'PATCH', headers: authHdr(), body: JSON.stringify({ data })
    });
    if (r.ok) { showMsg(msg, 'Saved!', 'success'); }
    else      { const e = await r.json(); showMsg(msg, e.error || 'Error', 'error'); }
  } catch { showMsg(msg, 'Network error', 'error'); }
}

async function moveSection(id, direction) {
  await fetch(`${API}/sections/${id}/move`, {
    method: 'PATCH', headers: authHdr(), body: JSON.stringify({ direction })
  });
  loadSections();
}

async function deleteSection(id, type) {
  if (!confirm(`Delete this "${type.replace(/_/g,' ')}" section? This cannot be undone.`)) return;
  try {
    const r = await fetch(`${API}/sections/${id}`, { method: 'DELETE', headers: authHdr() });
    if (r.ok) { loadSections(); }
  } catch(e) { console.error(e); }
}

async function addSection() {
  const type = document.getElementById('new-section-type').value;
  const msg  = document.getElementById('add-section-msg');
  try {
    const r = await fetch(`${API}/sections`, {
      method: 'POST', headers: authHdr(),
      body: JSON.stringify({ page_id: currentPageId, type })
    });
    if (r.ok) {
      loadSections();
    } else {
      const e = await r.json();
      showMsg(msg, e.error || 'Error adding section', 'error');
    }
  } catch { showMsg(msg, 'Network error', 'error'); }
}

function showMsg(el, text, type) {
  el.textContent = text;
  el.className = 'alert alert-' + (type === 'success' ? 'success' : 'error');
  el.style.display = 'inline-block';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}

// ── Form builder ─────────────────────────────────────────────────────
function buildForm(s) {
  const d = s.data;
  const id = s.id;
  switch (s.type) {
    case 'hero':            return heroForm(d, id);
    case 'key_dates':       return keyDatesForm(d, id);
    case 'text_block':      return textBlockForm(d, id);
    case 'logo_bar':        return logoBarForm(d, id);
    case 'university_info': return universityForm(d, id);
    case 'topics_list':     return topicsForm(d, id);
    case 'dates_table':     return datesTableForm(d, id);
    case 'submit_button':   return submitBtnForm(d, id);
    case 'speaker_grid':    return speakerGridForm(d, id);
    case 'committee_group': return committeeForm(d, id);
    case 'map_embed':       return mapForm(d, id);
    case 'contact_info':    return contactInfoForm(d, id);
    default:                return `<textarea class="form-textarea-a" style="height:200px;font-family:monospace;font-size:.8rem" data-field="__raw">${JSON.stringify(d,null,2)}</textarea>`;
  }
}

// ── Field helpers ─────────────────────────────────────────────────────
function fi(label, field, val, hint='') {
  return `<div class="form-group-a">
    <label class="form-label-a">${label}</label>
    <input class="form-input-a" data-field="${field}" value="${escAttr(val)}">
    ${hint ? `<div class="form-hint">${hint}</div>` : ''}
  </div>`;
}
function ta(label, field, val, hint='') {
  return `<div class="form-group-a">
    <label class="form-label-a">${label}</label>
    <textarea class="form-textarea-a" data-field="${field}">${escVal(val)}</textarea>
    ${hint ? `<div class="form-hint">${hint}</div>` : ''}
  </div>`;
}
function escAttr(s) { return String(s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
function escVal(s)  { return String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── Form types ────────────────────────────────────────────────────────
function heroForm(d, id) {
  return fi('Conference Name','conference_name',d.conference_name)
    + fi('Tagline','tagline',d.tagline)
    + fi('Dates','dates',d.dates)
    + fi('Institution','institution',d.institution)
    + fi('Location','location',d.location)
    + fi('Badge Text','badge',d.badge);
}

function textBlockForm(d, id) {
  return fi('Heading','heading',d.heading) + ta('Body Text','body',d.body);
}

function universityForm(d, id) {
  return fi('Section Heading','heading',d.heading)
    + ta('Body Text','body',d.body)
    + ta('Logo Text (one line per row)','logo_text',d.logo_text,'Example: SHIV NADAR / UNIVERSITY / CHENNAI — each on its own line')
    + fi('Location','location',d.location)
    + fi('Website URL','website_url',d.website_url);
}

function keyDatesForm(d, id) {
  const items = (d.dates||[]).map((item,i)=>`
    <div class="array-item">
      <div class="array-item-fields">
        <div class="array-item-row">
          <input class="form-input-a" placeholder="Label" data-arr="dates" data-idx="${i}" data-key="label" value="${escAttr(item.label)}">
          <input class="form-input-a" placeholder="Date / TBA" data-arr="dates" data-idx="${i}" data-key="date" value="${escAttr(item.date)}">
        </div>
      </div>
      <button class="btn-a btn-danger-a btn-sm" onclick="removeArrItem(this)">✕</button>
    </div>`).join('');
  return fi('Section Heading','heading',d.heading)
    + `<div class="form-group-a"><label class="form-label-a">Key Dates</label>
       <div class="array-editor" id="arr-dates-${id}">${items}</div>
       <button class="array-add-btn" onclick="addDateItem(${id})">+ Add Date</button></div>`;
}

function logoBarForm(d, id) {
  const items = (d.logos||[]).map((l,i)=>`
    <div class="array-item">
      <div class="array-item-fields">
        <div class="array-item-row">
          <input class="form-input-a" placeholder="Name" data-arr="logos" data-idx="${i}" data-key="name" value="${escAttr(l.name)}">
          <input class="form-input-a" placeholder="URL (optional)" data-arr="logos" data-idx="${i}" data-key="url" value="${escAttr(l.url||'')}">
        </div>
      </div>
      <button class="btn-a btn-danger-a btn-sm" onclick="removeArrItem(this)">✕</button>
    </div>`).join('');
  return fi('Section Heading','heading',d.heading)
    + `<div class="form-group-a"><label class="form-label-a">Logos / Sponsors</label>
       <div class="array-editor" id="arr-logos-${id}">${items}</div>
       <button class="array-add-btn" onclick="addLogoItem(${id})">+ Add Sponsor</button></div>`;
}

function topicsForm(d, id) {
  const items = (d.topics||[]).map((t,i)=>`
    <div class="array-item">
      <div class="array-item-fields">
        <input class="form-input-a" placeholder="Topic" data-arr="topics" data-idx="${i}" data-key="__str" value="${escAttr(t)}">
      </div>
      <button class="btn-a btn-danger-a btn-sm" onclick="removeArrItem(this)">✕</button>
    </div>`).join('');
  return fi('Section Heading','heading',d.heading)
    + ta('Intro Paragraph','intro',d.intro)
    + `<div class="form-group-a"><label class="form-label-a">Topics</label>
       <div class="array-editor" id="arr-topics-${id}">${items}</div>
       <button class="array-add-btn" onclick="addTopicItem(${id})">+ Add Topic</button></div>`;
}

function datesTableForm(d, id) {
  const col1 = d.col1_heading || (Array.isArray(d.headers) ? d.headers[0] : null) || 'Event';
  const col2 = d.col2_heading || (Array.isArray(d.headers) ? d.headers[1] : null) || 'Date';
  const col3 = d.col3_heading || (Array.isArray(d.headers) ? d.headers[2] : null) || 'Note';

  const items = (d.rows||[]).map((r,i)=>`
    <div class="array-item">
      <div class="array-item-fields">
        <div class="array-item-row">
          <input class="form-input-a" placeholder="Event" data-arr="rows" data-idx="${i}" data-key="event" value="${escAttr(r.event)}">
          <input class="form-input-a" placeholder="Date / TBA" data-arr="rows" data-idx="${i}" data-key="date" value="${escAttr(r.date)}">
          <input class="form-input-a" placeholder="Note (optional)" data-arr="rows" data-idx="${i}" data-key="note" value="${escAttr(r.note||'')}">
        </div>
      </div>
      <button class="btn-a btn-danger-a btn-sm" onclick="removeArrItem(this)">✕</button>
    </div>`).join('');
  return fi('Section Heading','heading',d.heading)
    + `<div class="form-group-a">
        <label class="form-label-a">Column Headings</label>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <input class="form-input-a" style="flex:1; min-width:120px;" placeholder="Column 1 (e.g. Event)" data-field="col1_heading" value="${escAttr(col1)}">
          <input class="form-input-a" style="flex:1; min-width:120px;" placeholder="Column 2 (e.g. Date)" data-field="col2_heading" value="${escAttr(col2)}">
          <input class="form-input-a" style="flex:1; min-width:120px;" placeholder="Column 3 (e.g. Note)" data-field="col3_heading" value="${escAttr(col3)}">
        </div>
       </div>`
    + `<div class="form-group-a"><label class="form-label-a">Date Rows</label>
       <div class="array-editor" id="arr-rows-${id}">${items}</div>
       <button class="array-add-btn" onclick="addDateRow(${id})">+ Add Row</button></div>`;
}

function submitBtnForm(d) {
  return fi('Heading','heading',d.heading)
    + ta('Note / Description','note',d.note)
    + fi('Button Label','label',d.label)
    + fi('Submission URL','url',d.url,'Set to # until submission portal is ready');
}

function speakerGridForm(d, id) {
  const items = (d.speakers||[]).map((s,i)=>`
    <div class="array-item">
      <div class="array-item-fields">
        <div class="array-item-row">
          <input class="form-input-a" placeholder="Name" data-arr="speakers" data-idx="${i}" data-key="name" value="${escAttr(s.name)}">
          <input class="form-input-a" placeholder="Affiliation" data-arr="speakers" data-idx="${i}" data-key="affiliation" value="${escAttr(s.affiliation)}">
        </div>
        <div style="display:flex;gap:.5rem;align-items:center;margin-top:.4rem;margin-bottom:.4rem">
          <input type="file" style="display:none" accept="image/*">
          <button type="button" class="btn-a btn-secondary-a btn-sm" onclick="handleImageUpload(this)">Upload Photo</button>
          <input class="form-input-a" style="flex:1;" placeholder="Photo URL (leave blank for placeholder)" data-arr="speakers" data-idx="${i}" data-key="photo_url" value="${escAttr(s.photo_url||'')}">
          <button type="button" class="btn-a btn-accent-a btn-sm" onclick="openAdjuster(this)">Adjust</button>
        </div>
        <textarea class="form-textarea-a" style="min-height:60px" placeholder="Short bio" data-arr="speakers" data-idx="${i}" data-key="bio">${escVal(s.bio||'')}</textarea>
      </div>
      <button class="btn-a btn-danger-a btn-sm" onclick="removeArrItem(this)">✕</button>
    </div>`).join('');
  return fi('Section Heading','heading',d.heading)
    + `<div class="form-group-a"><label class="form-label-a">Speakers</label>
       <div class="array-editor" id="arr-speakers-${id}">${items}</div>
       <button class="array-add-btn" onclick="addSpeaker(${id})">+ Add Speaker</button></div>`;
}

function committeeForm(d, id) {
  const groups = (d.groups||[]).filter(Boolean).map((g,gi)=>{
    const safeMembers = (Array.isArray(g.members) ? g.members : []).filter(Boolean);
    const memberHtml = safeMembers.map((m,mi)=>`
          <div style="display:flex;gap:.5rem;margin-bottom:.4rem;flex-wrap:wrap;align-items:center;">
            <input class="form-input-a" style="flex:1;min-width:150px;" placeholder="Name" data-arr="groups" data-idx="${gi}" data-sub="members" data-sidx="${mi}" data-key="name" value="${escAttr(m.name||'')}">
            <input class="form-input-a" style="flex:1;min-width:150px;" placeholder="Affiliation" data-arr="groups" data-idx="${gi}" data-sub="members" data-sidx="${mi}" data-key="affiliation" value="${escAttr(m.affiliation||'')}">
            <div style="display:flex;gap:.5rem;flex:2;min-width:250px;">
              <input type="file" style="display:none" accept="image/*">
              <button type="button" class="btn-a btn-secondary-a btn-sm" onclick="handleImageUpload(this)" style="padding:.2rem .5rem">Upload</button>
              <input class="form-input-a" style="flex:1;" placeholder="Photo URL (optional)" data-arr="groups" data-idx="${gi}" data-sub="members" data-sidx="${mi}" data-key="photo_url" value="${escAttr(m.photo_url||'')}">
              <button type="button" class="btn-a btn-accent-a btn-sm" onclick="openAdjuster(this)">Adjust</button>
            </div>
            <button class="btn-a btn-danger-a btn-sm" onclick="removeMember(this)">✕</button>
          </div>`).join('');
    return `
    <div class="array-item" style="flex-direction:column;gap:.75rem">
      <div style="display:flex;gap:.5rem;align-items:center">
        <input class="form-input-a" placeholder="Role (e.g. General Chair)" data-arr="groups" data-idx="${gi}" data-key="role" value="${escAttr(g.role||'')}" style="flex:1">
        <label style="font-size:0.85rem;display:flex;align-items:center;gap:.25rem">
          <input type="checkbox" data-arr="groups" data-idx="${gi}" data-key="hide_avatar" ${g.hide_avatar ? 'checked' : ''}> Hide Profile Pictures
        </label>
        <button class="btn-a btn-danger-a btn-sm" onclick="removeArrItem(this)">✕ Role</button>
      </div>
      <div style="padding-left:1rem">
        ${memberHtml}
        <button class="array-add-btn" style="border-top:1px dashed var(--border)" onclick="addMember(this,${gi},${id})">+ Add Member</button>
      </div>
    </div>`;
  }).join('');
  return `<div class="form-group-a"><label class="form-label-a">Committee Groups</label>
    <div class="array-editor" id="arr-groups-${id}">${groups}</div>
    <button class="array-add-btn" onclick="addGroup(${id})">+ Add Group</button></div>`;
}

function mapForm(d) {
  return ta('Address','address',d.address)
    + fi('Google Maps Embed URL','map_url',d.map_url,'Paste the src URL from the Google Maps embed code')
    + ta('Travel Information','travel_info',d.travel_info);
}

function contactInfoForm(d, id) {
  const socials = (d.socials||[]).map((s,i)=>`
    <div class="array-item">
      <div class="array-item-fields">
        <div class="array-item-row">
          <input class="form-input-a" placeholder="Platform" data-arr="socials" data-idx="${i}" data-key="platform" value="${escAttr(s.platform)}">
          <input class="form-input-a" placeholder="Handle / Display" data-arr="socials" data-idx="${i}" data-key="handle" value="${escAttr(s.handle)}">
          <input class="form-input-a" placeholder="URL" data-arr="socials" data-idx="${i}" data-key="url" value="${escAttr(s.url)}">
        </div>
      </div>
      <button class="btn-a btn-danger-a btn-sm" onclick="removeArrItem(this)">✕</button>
    </div>`).join('');
  return fi('Email','email',d.email)
    + fi('Phone','phone',d.phone||'')
    + fi('Address','address',d.address)
    + `<div class="form-group-a"><label class="form-label-a">Social Links</label>
       <div class="array-editor" id="arr-socials-${id}">${socials}</div>
       <button class="array-add-btn" onclick="addSocial(${id})">+ Add Link</button></div>`;
}

// ── Array item add/remove ─────────────────────────────────────────────
function removeArrItem(btn) { btn.closest('.array-item').remove(); }
function removeMember(btn)  { btn.closest('div[style*="margin-bottom"]').remove(); }

function addDateItem(id)  { addStrItem(`arr-dates-${id}`, 'dates', {label:'New Date', date:'TBA'}); }
function addLogoItem(id)  { addStrItem(`arr-logos-${id}`, 'logos', {name:'Sponsor', url:'#'}); }
function addTopicItem(id) { addStrItem(`arr-topics-${id}`, 'topics', {__str:'New Topic'}); }
function addDateRow(id)   { addStrItem(`arr-rows-${id}`, 'rows', {event:'New Event', date:'TBA', note:''}); }
function addSpeaker(id) {
  const container = document.getElementById(`arr-speakers-${id}`);
  let maxIdx = -1;
  container.querySelectorAll(`[data-arr="speakers"]`).forEach(el => {
    const idx = parseInt(el.dataset.idx, 10);
    if (!isNaN(idx) && idx > maxIdx) maxIdx = idx;
  });
  const i = maxIdx + 1;
  const div = document.createElement('div');
  div.className = 'array-item';
  div.innerHTML = `
      <div class="array-item-fields">
        <div class="array-item-row">
          <input class="form-input-a" placeholder="Name" data-arr="speakers" data-idx="${i}" data-key="name" value="Speaker Name">
          <input class="form-input-a" placeholder="Affiliation" data-arr="speakers" data-idx="${i}" data-key="affiliation" value="University">
        </div>
        <div style="display:flex;gap:.5rem;align-items:center;margin-top:.4rem;margin-bottom:.4rem">
          <input type="file" style="display:none" accept="image/*">
          <button type="button" class="btn-a btn-secondary-a btn-sm" onclick="handleImageUpload(this)">Upload Photo</button>
          <input class="form-input-a" style="flex:1;" placeholder="Photo URL" data-arr="speakers" data-idx="${i}" data-key="photo_url" value="">
          <button type="button" class="btn-a btn-accent-a btn-sm" onclick="openAdjuster(this)">Adjust</button>
        </div>
        <textarea class="form-textarea-a" style="min-height:60px" placeholder="Short bio" data-arr="speakers" data-idx="${i}" data-key="bio"></textarea>
      </div>
      <button class="btn-a btn-danger-a btn-sm" onclick="removeArrItem(this)">✕</button>`;
  container.appendChild(div);
}
function addSocial(id)    { addStrItem(`arr-socials-${id}`, 'socials', {platform:'Twitter/X', handle:'@handle', url:'#'}); }

function addStrItem(containerId, arrKey, defaults) {
  const container = document.getElementById(containerId);
  let maxIdx = -1;
  container.querySelectorAll(`[data-arr="${arrKey}"]`).forEach(el => {
    const idx = parseInt(el.dataset.idx, 10);
    if (!isNaN(idx) && idx > maxIdx) maxIdx = idx;
  });
  const i = maxIdx + 1;
  const div = document.createElement('div');
  div.className = 'array-item';
  const fields = Object.entries(defaults).map(([k,v])=>`
    <input class="form-input-a" placeholder="${k}" data-arr="${arrKey}" data-idx="${i}" data-key="${k}" value="${escAttr(v)}">`).join('');
  div.innerHTML = `<div class="array-item-fields"><div class="array-item-row">${fields}</div></div>
    <button class="btn-a btn-danger-a btn-sm" onclick="removeArrItem(this)">✕</button>`;
  container.appendChild(div);
}

function addGroup(id) {
  const container = document.getElementById(`arr-groups-${id}`);
  let maxIdx = -1;
  container.querySelectorAll(`[data-arr="groups"]`).forEach(el => {
    const idx = parseInt(el.dataset.idx, 10);
    if (!isNaN(idx) && idx > maxIdx) maxIdx = idx;
  });
  const gi = maxIdx + 1;
  const div = document.createElement('div');
  div.className = 'array-item'; div.style.flexDirection = 'column'; div.style.gap = '.75rem';
  div.innerHTML = `
    <div style="display:flex;gap:.5rem;align-items:center">
      <input class="form-input-a" placeholder="Role" data-arr="groups" data-idx="${gi}" data-key="role" value="New Role" style="flex:1">
      <label style="font-size:0.85rem;display:flex;align-items:center;gap:.25rem">
        <input type="checkbox" data-arr="groups" data-idx="${gi}" data-key="hide_avatar"> Hide Profile Pictures
      </label>
      <button class="btn-a btn-danger-a btn-sm" onclick="removeArrItem(this)">✕ Role</button>
    </div>
    <div style="padding-left:1rem">
      <button class="array-add-btn" style="border-top:1px dashed var(--border)" onclick="addMember(this,${gi},${id})">+ Add Member</button>
    </div>`;
  container.appendChild(div);
}

function addMember(btn, gi, id) {
  const wrap = btn.parentElement;
  let maxSidx = -1;
  wrap.querySelectorAll(`[data-sub="members"]`).forEach(el => {
    const sidx = parseInt(el.dataset.sidx, 10);
    if (!isNaN(sidx) && sidx > maxSidx) maxSidx = sidx;
  });
  const mi = maxSidx + 1;
  const div  = document.createElement('div');
  div.style.cssText = 'display:flex;gap:.5rem;margin-bottom:.4rem;flex-wrap:wrap;align-items:center;';
  div.innerHTML = `
    <input class="form-input-a" style="flex:1;min-width:150px;" placeholder="Name" data-arr="groups" data-idx="${gi}" data-sub="members" data-sidx="${mi}" data-key="name" value="To Be Announced">
    <input class="form-input-a" style="flex:1;min-width:150px;" placeholder="Affiliation" data-arr="groups" data-idx="${gi}" data-sub="members" data-sidx="${mi}" data-key="affiliation" value="TBA">
    <div style="display:flex;gap:.5rem;flex:2;min-width:250px;">
      <input type="file" style="display:none" accept="image/*">
      <button type="button" class="btn-a btn-secondary-a btn-sm" onclick="handleImageUpload(this)" style="padding:.2rem .5rem">Upload</button>
      <input class="form-input-a" style="flex:1;" placeholder="Photo URL (optional)" data-arr="groups" data-idx="${gi}" data-sub="members" data-sidx="${mi}" data-key="photo_url" value="">
      <button type="button" class="btn-a btn-accent-a btn-sm" onclick="openAdjuster(this)">Adjust</button>
    </div>
    <button class="btn-a btn-danger-a btn-sm" onclick="removeMember(this)">✕</button>`;
  wrap.insertBefore(div, btn);
}

// ── Collect form data ─────────────────────────────────────────────────
function collectFormData(sectionId) {
  const card  = document.getElementById('sc-' + sectionId);
  const data  = {};

  // Simple fields
  card.querySelectorAll('[data-field]').forEach(el => {
    const key = el.dataset.field;
    let val = el.type === 'checkbox' ? el.checked : el.value;
    if (key === '__raw') { try { Object.assign(data, JSON.parse(el.value)); } catch {} }
    else data[key] = val;
  });

  // Array fields — group by arr key
  const arrays = {};
  card.querySelectorAll('[data-arr]').forEach(el => {
    const arr  = el.dataset.arr;
    const idx  = parseInt(el.dataset.idx);
    const key  = el.dataset.key;
    const sub  = el.dataset.sub;
    const sidx = el.dataset.sidx !== undefined ? parseInt(el.dataset.sidx) : null;
    let val = el.type === 'checkbox' ? el.checked : el.value;

    if (!arrays[arr]) arrays[arr] = [];
    if (!arrays[arr][idx]) arrays[arr][idx] = {};

    if (sub && sidx !== null) {
      if (!arrays[arr][idx][sub]) arrays[arr][idx][sub] = [];
      if (!arrays[arr][idx][sub][sidx]) arrays[arr][idx][sub][sidx] = {};
      arrays[arr][idx][sub][sidx][key] = val;
    } else if (key === '__str') {
      arrays[arr][idx] = val;
    } else {
      arrays[arr][idx][key] = val;
    }
  });

  // Filter nulls from arrays
  Object.entries(arrays).forEach(([k,v]) => { 
    data[k] = v.filter(Boolean); 
    data[k].forEach(item => {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach(subK => {
          if (Array.isArray(item[subK])) {
            item[subK] = item[subK].filter(Boolean);
          }
        });
      }
    });
  });
  return data;
}

// Boot
loadSections();
