/* ═══════════════════════════════════════════════
   TrackMind — dashboard.js
═══════════════════════════════════════════════ */

const API   = 'https://trackmind-api.onrender.com';
const token = localStorage.getItem('tm_token');
const user  = JSON.parse(localStorage.getItem('tm_user') || 'null');

if (!token || !user) { window.location.href = 'index.html'; }

/* ── INIT ── */
document.getElementById('nav-name').textContent   = user.name.split(' ')[0];
document.getElementById('sb-name').textContent    = user.name;
document.getElementById('sb-email').textContent   = user.email || '';
// FIX 1: Use IST timezone for today's date header
const todayStr = new Date().toLocaleDateString('en-IN', { weekday:'long', month:'long', day:'numeric', timeZone:'Asia/Kolkata' });
document.getElementById('today-date').textContent = todayStr;
document.getElementById('page-date').textContent  = todayStr;

const H = () => ({ 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` });

/* ══════════════════════════════════════════════
   THEME
══════════════════════════════════════════════ */
const SUN  = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
const MOON = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;

function toggleTheme() {
  const h = document.documentElement;
  const dark = h.getAttribute('data-theme') === 'dark';
  h.setAttribute('data-theme', dark ? 'light' : 'dark');
  document.getElementById('themeIcon').innerHTML = dark ? SUN : MOON;
  localStorage.setItem('tm-theme', dark ? 'light' : 'dark');
}
(function () {
  const s = localStorage.getItem('tm-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', s);
  document.getElementById('themeIcon').innerHTML = s === 'dark' ? MOON : SUN;
})();

/* ── LOGOUT ── */
function logout() {
  localStorage.removeItem('tm_token');
  localStorage.removeItem('tm_user');
  window.location.href = 'index.html';
}

/* ── MOBILE SIDEBAR ── */
function toggleSidebar() {
  document.getElementById('left-col').classList.toggle('open');
}
document.addEventListener('click', e => {
  const col = document.getElementById('left-col');
  if (col.classList.contains('open') &&
      !col.contains(e.target) &&
      !e.target.closest('.burger')) {
    col.classList.remove('open');
  }
});

function scrollToGoals() {
  document.getElementById('goals-section').scrollIntoView({ behavior:'smooth' });
  document.getElementById('left-col').classList.remove('open');
}

/* ── CHAR COUNT ── */
function updateChar() {
  document.getElementById('chars').textContent = document.getElementById('notes').value.length;
}

/* ══════════════════════════════════════════════
   RESULT CARD — VERTICAL SLIDE
══════════════════════════════════════════════ */
function showResultCard() {
  const card = document.getElementById('result-card');
  card.getBoundingClientRect(); // force reflow so transition fires
  card.classList.add('open');
  setTimeout(() => card.scrollIntoView({ behavior:'smooth', block:'nearest' }), 100);
}

function hideResultCard() {
  document.getElementById('result-card').classList.remove('open');
}

/* ══════════════════════════════════════════════
   IMAGE UPLOAD + COMPRESSION
══════════════════════════════════════════════ */
let imgDataUrl = null;

function handleImg(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const im = new Image();
    im.onload = () => {
      const MAX = 900;
      let w = im.width, h = im.height;
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(im, 0, 0, w, h);
      imgDataUrl = cv.toDataURL('image/jpeg', 0.78);
      renderImgPreview();
    };
    im.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function renderImgPreview() {
  const c     = document.getElementById('img-preview');
  const badge = document.getElementById('ai-img-badge');
  if (!imgDataUrl) {
    c.innerHTML = '';
    badge.classList.remove('show');
    return;
  }
  c.innerHTML = `
    <div class="img-preview-wrap">
      <img src="${imgDataUrl}" alt="preview"/>
      <button class="img-rm" onclick="removeImg()">✕</button>
    </div>`;
  badge.classList.add('show');
}

function removeImg() {
  imgDataUrl = null;
  document.getElementById('img-file-input').value = '';
  renderImgPreview();
}

/* ══════════════════════════════════════════════
   SUBMIT NOTE → Flask
══════════════════════════════════════════════ */
async function submitNote() {
  const ta    = document.getElementById('notes');
  const aiEl  = document.getElementById('ai-response');
  const btn   = document.getElementById('go-btn');
  const txt   = document.getElementById('go-text');
  const dots  = document.getElementById('go-dots');
  const notes = ta.value.trim();

  if (!notes && !imgDataUrl) { showToast('⚠️ Write something or attach an image'); return; }

  btn.disabled = true;
  txt.style.display  = 'none';
  dots.style.display = 'flex';

  // Vertical slide open
  showResultCard();

  document.getElementById('result-title').textContent = imgDataUrl
    ? 'AI Study Coach Feedback (with image analysis)'
    : 'AI Study Coach Feedback';

  aiEl.innerHTML = `<p style="color:var(--muted);text-align:center;padding:26px 0;font-size:13px;">
    ${imgDataUrl ? '🖼️ Analysing your image + notes…' : '✨ Groq is thinking…'}</p>`;

  try {
    const payload = { notes: notes || '(No text — please analyse the attached image)' };
    if (imgDataUrl) payload.image = imgDataUrl;

    const res  = await fetch(`${API}/api/notes`, { method:'POST', headers:H(), body:JSON.stringify(payload) });
    if (res.status === 401) { logout(); return; }
    const data = await res.json();

    if (!res.ok) {
      aiEl.innerHTML = `<p style="color:var(--err)">${data.error || 'Something went wrong'}</p>`;
      return;
    }

    aiEl.innerHTML = formatAI(data.note.aiFeedback);
    ta.value = ''; updateChar(); removeImg();
    loadNotes(); loadStats(); renderCalendar(); renderGoals();
    showToast('✅ Note saved & analysed!');

  } catch {
    aiEl.innerHTML = `<p style="color:var(--err)">Cannot reach server — is Flask running on :5000?</p>`;
  } finally {
    btn.disabled = false;
    txt.style.display  = 'inline';
    dots.style.display = 'none';
  }
}

/* ══════════════════════════════════════════════
   STATS
══════════════════════════════════════════════ */
async function loadStats() {
  try {
    const res = await fetch(`${API}/api/notes/stats`, { headers:H() });
    if (!res.ok) return;
    const d = await res.json();
    document.getElementById('s-total').textContent  = d.totalNotes ?? '—';
    document.getElementById('s-week').textContent   = d.thisWeek   ?? '—';
    document.getElementById('s-streak').textContent = d.streak != null
      ? d.streak + (d.streak === 1 ? ' day' : ' days') : '—';
  } catch(_) {}
}

/* ══════════════════════════════════════════════
   NOTES
══════════════════════════════════════════════ */
async function loadNotes() {
  try {
    const res   = await fetch(`${API}/api/notes`, { headers:H() });
    if (res.status === 401) { logout(); return; }
    const notes = await res.json();
    window._notes = notes;
    const html = renderNotesList(notes);
    document.getElementById('notes-list').innerHTML        = html || `<div class="empty-st">No notes yet. Write your first one! 📝</div>`;
    document.getElementById('notes-list-mobile').innerHTML = html || `<div class="empty-st">No notes yet. Write your first one! 📝</div>`;
  } catch(_) {
    const err = `<div class="empty-st">Failed to load notes.</div>`;
    document.getElementById('notes-list').innerHTML        = err;
    document.getElementById('notes-list-mobile').innerHTML = err;
  }
}

function renderNotesList(notes) {
  if (!notes.length) return '';
  return notes.slice(0, 25).map(n => `
    <div class="note-card" onclick="openNoteModal('${n._id}')">
      <div class="note-card-top">
        ${n.image
          ? `<img class="note-thumb" src="${esc(n.image)}" alt=""/>`
          : `<div class="note-thumb-placeholder">📝</div>`}
        <div style="min-width:0;flex:1">
          <div class="note-dt">${fmtDate(n.createdAt)}</div>
          <div class="note-prev">${esc(n.notes)}</div>
        </div>
      </div>
      <button class="note-del" onclick="delNote(event,'${n._id}')">✕</button>
    </div>`).join('');
}

async function delNote(e, id) {
  e.stopPropagation();
  if (!confirm('Delete this note?')) return;
  try {
    const res = await fetch(`${API}/api/notes/${id}`, { method:'DELETE', headers:H() });
    if (res.ok) { loadNotes(); loadStats(); renderCalendar(); showToast('🗑️ Note deleted'); }
  } catch(_) {}
}

function openNoteModal(id) {
  const n = (window._notes || []).find(x => x._id === id);
  if (!n) return;
  const img = document.getElementById('m-img');
  img.src = n.image || ''; img.style.display = n.image ? 'block' : 'none';
  document.getElementById('m-notes').textContent = n.notes;
  document.getElementById('m-ai').textContent    = n.aiFeedback || 'No AI feedback.';
  openModal('note-overlay');
}

/* ══════════════════════════════════════════════
   GOALS  (localStorage)
══════════════════════════════════════════════ */
function getGoals()  { return JSON.parse(localStorage.getItem('tm_goals') || '[]'); }
function setGoals(g) { localStorage.setItem('tm_goals', JSON.stringify(g)); }

function renderGoals() {
  const goals = getGoals();
  const strip = document.getElementById('goals-strip');
  if (!goals.length) { strip.innerHTML = ''; return; }

  strip.innerHTML = goals.map((g, i) => {
    const start    = new Date(g.start);
    const today    = new Date();
    const elapsed  = Math.max(0, Math.floor((today - start) / 86400000));
    const pct      = Math.min(100, Math.round((elapsed / g.days) * 100));
    const daysLeft = Math.max(0, g.days - elapsed);
    const meta     = elapsed === 0
      ? `Starts today · ${g.days} days total`
      : daysLeft > 0
        ? `Day ${elapsed} of ${g.days} · ${daysLeft} days left`
        : `🎉 Completed! (${g.days} days)`;
    return `
      <div class="goal-card">
        <div class="goal-ico">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
        </div>
        <div class="goal-body">
          <div class="goal-name" title="${esc(g.title)}">${esc(g.title)}</div>
          <div class="goal-bar-row">
            <div class="goal-bar"><div class="goal-fill" style="width:${pct}%"></div></div>
            <div class="goal-pct">${pct}%</div>
          </div>
          <div class="goal-meta">${meta}</div>
        </div>
        <div class="goal-actions">
          <button class="goal-btn edit" onclick="openGoalModal(${i})">Edit</button>
          <button class="goal-btn del"  onclick="confirmDeleteGoal(${i})">✕</button>
        </div>
      </div>`;
  }).join('');
}

function openGoalModal(idx) {
  const isNew = idx === null || idx === undefined;
  document.getElementById('goal-modal-title').textContent = isNew ? 'New Learning Goal' : 'Edit Goal';
  document.getElementById('g-del-btn').style.display     = isNew ? 'none' : 'block';
  document.getElementById('g-editing-id').value          = isNew ? '' : String(idx);
  if (!isNew) {
    const g = getGoals()[idx] || {};
    document.getElementById('g-title-in').value = g.title || '';
    document.getElementById('g-desc-in').value  = g.desc  || '';
    document.getElementById('g-start-in').value = g.start || '';
    document.getElementById('g-days-in').value  = g.days  || '';
    document.getElementById('g-mins-in').value  = g.mins  || '';
  } else {
    document.getElementById('g-title-in').value = '';
    document.getElementById('g-desc-in').value  = '';
    document.getElementById('g-start-in').value = new Date().toISOString().split('T')[0];
    document.getElementById('g-days-in').value  = '';
    document.getElementById('g-mins-in').value  = '60';
  }
  openModal('goal-overlay');
}

function saveGoal() {
  const title = document.getElementById('g-title-in').value.trim();
  const days  = parseInt(document.getElementById('g-days-in').value);
  const start = document.getElementById('g-start-in').value;
  if (!title)          { showToast('⚠️ Enter a goal title'); return; }
  if (!days || days<1) { showToast('⚠️ Enter valid duration'); return; }
  if (!start)          { showToast('⚠️ Pick a start date'); return; }
  const g = {
    title, start, days,
    desc: document.getElementById('g-desc-in').value.trim(),
    mins: parseInt(document.getElementById('g-mins-in').value) || 60,
    id:   Date.now()
  };
  const goals   = getGoals();
  const editIdx = document.getElementById('g-editing-id').value;
  if (editIdx !== '') { goals[parseInt(editIdx)] = g; } else { goals.push(g); }
  setGoals(goals);
  closeModal('goal-overlay');
  renderGoals();
  showToast(editIdx !== '' ? '✏️ Goal updated!' : '🎯 Goal added! You got this!');
}

function confirmDeleteGoal(idx) {
  closeModal('goal-overlay');
  const goals = getGoals();
  const name  = goals[idx]?.title || 'this goal';
  if (!confirm(`Delete "${name}"?`)) return;
  goals.splice(idx, 1);
  setGoals(goals);
  renderGoals();
  showToast('🗑️ Goal deleted');
}

function deleteGoal() {
  confirmDeleteGoal(parseInt(document.getElementById('g-editing-id').value));
}

/* ══════════════════════════════════════════════
   CALENDAR
══════════════════════════════════════════════ */
let calY = new Date().getFullYear(), calM = new Date().getMonth();

function calNav(d) {
  calM += d;
  if (calM > 11) { calM = 0; calY++; }
  if (calM < 0)  { calM = 11; calY--; }
  renderCalendar();
}

function renderCalendar() {
  const grid  = document.getElementById('cal-grid');
  const lbl   = document.getElementById('cal-month');
  const today = new Date();
  const first = new Date(calY, calM, 1);
  const last  = new Date(calY, calM + 1, 0);

  // FIX 2: Convert each note's UTC createdAt to IST before extracting date parts
  // so calendar dots appear on the correct IST day, not the UTC day
  const noteDates = new Set((window._notes || []).map(n => {
    const d = new Date(new Date(n.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }));

  // FIX 3: Show calendar month label in IST
  lbl.textContent = first.toLocaleDateString('en-IN', { month:'long', year:'numeric', timeZone:'Asia/Kolkata' });

  let html = ['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => `<div class="cal-dn">${d}</div>`).join('');
  for (let i = 0; i < first.getDay(); i++) html += `<div class="cal-d other"></div>`;
  for (let d = 1; d <= last.getDate(); d++) {
    const iT = d === today.getDate() && calM === today.getMonth() && calY === today.getFullYear();
    const hN = noteDates.has(`${calY}-${calM}-${d}`);
    html += `<div class="cal-d${iT?' today':''}${hN?' has-note':''}">${d}</div>`;
  }
  grid.innerHTML = html;
}

/* ══════════════════════════════════════════════
   MODAL HELPERS
══════════════════════════════════════════════ */
function openModal(id)     { document.getElementById(id).classList.add('open'); }
function closeModal(id)    { document.getElementById(id).classList.remove('open'); }
function maybeClose(id, e) { if (e.target.id === id) closeModal(id); }

/* ══════════════════════════════════════════════
   FORMAT HELPERS
══════════════════════════════════════════════ */
// FIX 4: Show note timestamps in IST
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    month:'short', day:'numeric', year:'numeric',
    hour:'2-digit', minute:'2-digit',
    timeZone:'Asia/Kolkata'
  });
}
function esc(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function formatAI(text) {
  if (!text) return '<p>No feedback.</p>';
  const icons = ['📋','💪','🎯','⚡'];
  let html = '', idx = 0;
  text = text.replace(/^\s*\*\s*$/gm,'').replace(/\n{3,}/g,'\n\n').trim();
  text.split(/(?=\n?\*?\*?\d+\.\s)/).forEach(sec => {
    sec = sec.trim(); if (!sec) return;
    const m = sec.match(/^\*?\*?(\d+)\.\s+\*?\*?([^\n*]+)\*?\*?/);
    if (m) {
      html += `<div class="sec"><div class="sec-title">${icons[idx]||'•'} ${m[2].trim()}</div>${parseBody(sec.replace(m[0],'').trim())}</div>`;
      idx++;
    } else {
      html += `<div class="sec"><p>${inline(sec)}</p></div>`;
    }
  });
  return html || `<p>${inline(text)}</p>`;
}
function parseBody(text) {
  const lines = text.split('\n').map(l=>l.trim()).filter(Boolean);
  if (lines.some(l=>/^[-*•]\s/.test(l)))
    return `<ul>${lines.map(l=>`<li>${inline(l.replace(/^[-*•]\s+/,''))}</li>`).join('')}</ul>`;
  return `<p>${inline(lines.join(' '))}</p>`;
}
function inline(t) {
  return t.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>');
}

/* ── TOAST ── */
let tt;
function showToast(msg) {
  const el = document.getElementById('toastEl');
  document.getElementById('toast-msg').textContent = msg;
  el.classList.add('show');
  clearTimeout(tt);
  tt = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
async function init() {
  await Promise.all([loadStats(), loadNotes()]);
  renderCalendar();
  renderGoals();
}
init();