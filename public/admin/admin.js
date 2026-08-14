/* ============================================================
   AOC Admin — Dashboard Logic
   Config-driven CRUD: each resource declares its table columns
   and form fields once; generic engine renders + wires both.
   ============================================================ */

function showToast(message, type = 'info') {
  const stack = document.getElementById('toastStack');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  stack.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 4000);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}
function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ============================================================
   RESOURCE CONFIG — one entry per admin-manageable collection
   ============================================================ */
const RESOURCES = {
  events: {
    label: 'Events',
    endpoint: 'events',
    columns: [
      { key: 'posterImage', label: '', type: 'thumb' },
      { key: 'title', label: 'Event' },
      { key: 'date', label: 'Date', fmt: fmtDate },
      { key: 'venue', label: 'Venue' },
      { key: 'status', label: 'Status', type: 'statusBadge' },
      { key: 'registeredCount', label: 'Registered', type: 'capacity' },
      { key: 'published', label: 'Published', type: 'boolBadge' },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'time', label: 'Time (e.g. 5:00 PM)', type: 'text' },
      { name: 'venue', label: 'Venue', type: 'text' },
      { name: 'category', label: 'Category', type: 'select', options: ['Public Speaking', 'Debate', 'Table Topics', 'Leadership', 'Interview Skills', 'Networking', 'General'] },
      { name: 'speaker', label: 'Speaker', type: 'text' },
      { name: 'agenda', label: 'Agenda', type: 'textarea' },
      { name: 'posterImage', label: 'Poster Image URL', type: 'text' },
      { name: 'registrationEnabled', label: 'Registration Enabled', type: 'checkbox', default: true },
      { name: 'registrationLimit', label: 'Registration Limit (0 = unlimited)', type: 'number', default: 0 },
      { name: 'statusOverride', label: 'Status Override', type: 'select', options: ['auto', 'upcoming', 'past'], default: 'auto' },
      { name: 'featured', label: 'Featured', type: 'checkbox' },
      { name: 'published', label: 'Published', type: 'checkbox', default: true },
    ],
  },
  sessions: {
    label: 'Sessions / Videos',
    endpoint: 'sessions',
    columns: [
      { key: 'thumbnail', label: '', type: 'thumb' },
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'date', label: 'Date', fmt: fmtDate },
      { key: 'duration', label: 'Duration' },
      { key: 'published', label: 'Published', type: 'boolBadge' },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'speaker', label: 'Speaker', type: 'text' },
      { name: 'category', label: 'Category', type: 'select', options: ['Public Speaking', 'Debate', 'Table Topics', 'Leadership', 'Interview Skills', 'Networking', 'General'] },
      { name: 'thumbnail', label: 'Thumbnail URL', type: 'text' },
      { name: 'videoUrl', label: 'Video URL (YouTube / Vimeo / MP4)', type: 'text' },
      { name: 'duration', label: 'Duration (e.g. 24 min)', type: 'text' },
      { name: 'featured', label: 'Featured', type: 'checkbox' },
      { name: 'published', label: 'Published', type: 'checkbox', default: true },
    ],
  },
  gallery: {
    label: 'Gallery',
    endpoint: 'gallery',
    columns: [
      { key: 'imageUrl', label: '', type: 'thumb' },
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'published', label: 'Published', type: 'boolBadge' },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'imageUrl', label: 'Image URL', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['Events', 'Workshops', 'Debates', 'Behind The Scenes', 'Team', 'Community'] },
      { name: 'caption', label: 'Caption', type: 'text' },
      { name: 'featured', label: 'Featured', type: 'checkbox' },
      { name: 'published', label: 'Published', type: 'checkbox', default: true },
    ],
  },
  testimonials: {
    label: 'Testimonials',
    endpoint: 'testimonials',
    columns: [
      { key: 'imageUrl', label: '', type: 'thumb' },
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role' },
      { key: 'order', label: 'Order' },
      { key: 'published', label: 'Published', type: 'boolBadge' },
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'role', label: 'Role', type: 'text' },
      { name: 'course', label: 'Course', type: 'text' },
      { name: 'quote', label: 'Quote', type: 'textarea', required: true },
      { name: 'imageUrl', label: 'Photo URL', type: 'text' },
      { name: 'order', label: 'Display Order', type: 'number', default: 0 },
      { name: 'featured', label: 'Featured', type: 'checkbox', default: true },
      { name: 'published', label: 'Published', type: 'checkbox', default: true },
    ],
  },
  team: {
    label: 'Leadership',
    endpoint: 'team',
    columns: [
      { key: 'imageUrl', label: '', type: 'thumb' },
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role' },
      { key: 'order', label: 'Order' },
      { key: 'published', label: 'Published', type: 'boolBadge' },
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'role', label: 'Role', type: 'text', required: true },
      { name: 'quote', label: 'Quote', type: 'textarea' },
      { name: 'imageUrl', label: 'Photo URL', type: 'text' },
      { name: 'instagram', label: 'Instagram URL', type: 'text' },
      { name: 'linkedin', label: 'LinkedIn URL', type: 'text' },
      { name: 'order', label: 'Display Order', type: 'number', default: 0 },
      { name: 'published', label: 'Published', type: 'checkbox', default: true },
    ],
  },
};

/* ============================================================
   READ-ONLY INBOX RESOURCES (registrations, join, contact)
   These are view/status-update/delete only — no "Add" form.
   ============================================================ */
const INBOX_RESOURCES = {
  registrations: {
    label: 'Registrations',
    endpoint: 'registrations',
    columns: ['name', 'email', 'phone', 'event', 'status', 'createdAt'],
    statusOptions: ['registered', 'attended', 'cancelled'],
  },
  join: {
    label: 'Join Requests',
    endpoint: 'join',
    columns: ['name', 'email', 'phone', 'branch', 'year', 'introVideoUrl', 'status', 'createdAt'],
    statusOptions: ['new', 'reviewed', 'accepted', 'rejected'],
  },
  contact: {
    label: 'Contact Messages',
    endpoint: 'contact',
    columns: ['name', 'email', 'subject', 'message', 'status', 'createdAt'],
    statusOptions: ['new', 'read', 'replied'],
  },
};

/* ---------------- AUTH ----------------
   Auth is cookie-only: the httpOnly cookie set by the server on login is the
   sole source of truth. There is no token to inspect client-side, so on load
   we simply ask the server "am I logged in?" via /auth/me (which succeeds or
   fails based on the cookie sent automatically via credentials:'include'). */
async function tryAutoLogin() {
  try {
    await AOC_API.me();
    showDashboard();
  } catch (err) {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('loginScreen').hidden = false;
  document.getElementById('dashboard').hidden = true;
}
function showDashboard() {
  document.getElementById('loginScreen').hidden = true;
  document.getElementById('dashboard').hidden = false;
  navigateTo('overview');
}

function initLogin() {
  const form = document.getElementById('loginForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    const status = document.getElementById('loginStatus');
    const { email, password } = Object.fromEntries(new FormData(form).entries());
    btn.disabled = true; btn.textContent = 'Logging in...'; status.textContent = ''; status.className = 'form-status';
    try {
      // The server sets the httpOnly auth cookie itself; the response body
      // intentionally carries no token to keep out of reach of any script.
      await AOC_API.login(email, password);
      showDashboard();
    } catch (err) {
      status.textContent = err.message;
      status.classList.add('error');
    } finally {
      btn.disabled = false; btn.textContent = 'Login';
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try { await AOC_API.logout(); } catch (err) { /* best-effort — still show the login screen either way */ }
    showLogin();
  });
}

/* ---------------- NAVIGATION ---------------- */
function initNav() {
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.view));
  });
}
function navigateTo(view) {
  document.querySelectorAll('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  const titles = { overview: 'Overview', settings: 'Website Settings' };
  document.getElementById('viewTitle').textContent = titles[view] || RESOURCES[view]?.label || INBOX_RESOURCES[view]?.label || view;

  if (view === 'overview') return renderOverview();
  if (view === 'settings') return renderSettings();
  if (RESOURCES[view]) return renderResourceView(view);
  if (INBOX_RESOURCES[view]) return renderInboxView(view);
}

/* ---------------- OVERVIEW ---------------- */
async function renderOverview() {
  const root = document.getElementById('viewContent');
  root.innerHTML = `
    <div class="stat-grid" id="statGrid"><div class="stat-card"><div class="label">Loading</div><div class="value">…</div></div></div>
    <div class="quick-actions" id="quickActions" style="display:flex;gap:12px;flex-wrap:wrap;margin:28px 0;"></div>
    <div class="recent-activity" id="recentActivity"></div>
  `;

  // Quick actions — the handful of things an admin does most often.
  document.getElementById('quickActions').innerHTML = [
    ['+ Create Event', 'events', true],
    ['+ Add Session', 'sessions', true],
    ['View Registrations', 'registrations', false],
    ['View Join Requests', 'join', false],
  ].map(([label, view, openForm]) => `<button class="btn-secondary qa-btn" data-view="${view}" data-open-form="${openForm}">${label}</button>`).join('');
  document.getElementById('quickActions').querySelectorAll('.qa-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const view = btn.dataset.view;
      navigateTo(view);
      if (btn.dataset.openForm === 'true') {
        // Wait a tick for the view (and its "+Add" button) to finish rendering.
        setTimeout(() => openCrudForm(view, null), 150);
      }
    });
  });

  try {
    const { data } = await AOC_API.adminOverview();
    const cards = [
      ['Total Events', data.totalEvents],
      ['Upcoming', data.upcomingEvents],
      ['Sessions', data.totalSessions],
      ['Registrations', data.totalRegistrations],
      ['New Join Requests', data.newJoinRequests],
      ['New Messages', data.newContactMessages],
    ];
    document.getElementById('statGrid').innerHTML = cards
      .map(([label, value]) => `<div class="stat-card"><div class="label">${label}</div><div class="value">${value}</div></div>`)
      .join('');
  } catch (err) {
    document.getElementById('statGrid').innerHTML = `<div class="empty-row" style="padding:40px;">Couldn't load overview — ${esc(err.message)}</div>`;
  }

  await renderRecentActivity();
}

async function renderRecentActivity() {
  const root = document.getElementById('recentActivity');
  root.innerHTML = `<h3 style="font-family:'Fraunces',serif;font-weight:400;font-size:20px;margin-bottom:14px;">Recent Activity</h3><div id="recentList" style="color:var(--muted,#8a8a90);font-size:13px;">Loading…</div>`;
  try {
    const [regs, joins, msgs] = await Promise.all([
      AOC_API.adminList('registrations', '?limit=3&page=1'),
      AOC_API.adminList('join', '?limit=3&page=1'),
      AOC_API.adminList('contact', '?limit=3&page=1'),
    ]);
    const items = [
      ...regs.data.map((r) => ({ ts: r.createdAt, text: `${r.name} registered for "${r.event?.title || 'an event'}"`, view: 'registrations' })),
      ...joins.data.map((j) => ({ ts: j.createdAt, text: `${j.name} applied to join AOC`, view: 'join' })),
      ...msgs.data.map((m) => ({ ts: m.createdAt, text: `${m.name} sent a message: "${(m.subject || m.message || '').slice(0, 40)}${(m.subject || m.message || '').length > 40 ? '…' : ''}"`, view: 'contact' })),
    ]
      .sort((a, b) => new Date(b.ts) - new Date(a.ts))
      .slice(0, 8);

    if (!items.length) {
      document.getElementById('recentList').innerHTML = 'Nothing yet — new registrations, join requests, and messages will show up here.';
      return;
    }
    document.getElementById('recentList').innerHTML = `<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px;">
      ${items
        .map(
          (i) => `<li style="display:flex;justify-content:space-between;gap:16px;padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:10px;">
            <span style="color:var(--ivory);">${esc(i.text)}</span>
            <span style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--muted,#8a8a90);white-space:nowrap;">${fmtDate(i.ts)}</span>
          </li>`
        )
        .join('')}
    </ul>`;
  } catch (err) {
    document.getElementById('recentList').innerHTML = `Couldn't load recent activity — ${esc(err.message)}`;
  }
}

/* ---------------- GENERIC RESOURCE CRUD VIEW ---------------- */
async function renderResourceView(view) {
  const cfg = RESOURCES[view];
  const root = document.getElementById('viewContent');
  root.innerHTML = `
    <div class="table-toolbar">
      <input type="search" id="resourceSearch" placeholder="Search ${esc(cfg.label.toLowerCase())}..." style="background:rgba(255,255,255,0.03);border:1px solid var(--border);color:var(--ivory);border-radius:8px;padding:9px 14px;font-size:13px;width:240px;max-width:60vw;">
      <button class="btn-secondary" id="addBtn">+ Add ${cfg.label.replace(/s$/, '')}</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>${cfg.columns.map((c) => `<th>${c.label}</th>`).join('')}<th>Actions</th></tr></thead>
        <tbody id="tableBody"><tr class="loading-row"><td colspan="${cfg.columns.length + 1}">Loading…</td></tr></tbody>
      </table>
    </div>
  `;
  document.getElementById('addBtn').addEventListener('click', () => openCrudForm(view, null));
  await refreshTable(view);
  document.getElementById('resourceSearch').addEventListener('input', (e) => renderTableRows(view, filterResourceData(view, e.target.value)));
}

let resourceDataCache = {};
function filterResourceData(view, query) {
  const all = resourceDataCache[view] || [];
  const q = query.trim().toLowerCase();
  if (!q) return all;
  return all.filter((item) =>
    Object.values(item).some((v) => typeof v === 'string' && v.toLowerCase().includes(q))
  );
}

async function refreshTable(view) {
  const cfg = RESOURCES[view];
  const tbody = document.getElementById('tableBody');
  try {
    const { data } = await AOC_API.adminList(cfg.endpoint);
    resourceDataCache[view] = data;
    renderTableRows(view, data);
  } catch (err) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="${cfg.columns.length + 1}">Something interrupted the signal — ${esc(err.message)}</td></tr>`;
  }
}

function renderTableRows(view, data) {
  const cfg = RESOURCES[view];
  const tbody = document.getElementById('tableBody');
  if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="${cfg.columns.length + 1}">Nothing here yet. Add the first one.</td></tr>`;
    return;
  }
  tbody.innerHTML = data
      .map((item) => {
        const cells = cfg.columns
          .map((c) => {
            const raw = item[c.key];
            if (c.type === 'thumb') return `<td>${raw ? `<img class="cell-thumb" src="${esc(raw)}" onerror="this.style.opacity=0.2">` : '—'}</td>`;
            if (c.type === 'statusBadge') return `<td><span class="badge ${esc(raw)}">${esc(raw)}</span></td>`;
            if (c.type === 'boolBadge') return `<td><span class="badge ${raw ? 'upcoming' : 'past'}">${raw ? 'Yes' : 'No'}</span></td>`;
            if (c.type === 'capacity') {
              const count = item.registeredCount || 0;
              const limit = item.registrationLimit || 0;
              if (!limit) return `<td>${count} registered</td>`;
              const pct = Math.min(100, Math.round((count / limit) * 100));
              const left = Math.max(limit - count, 0);
              const full = left === 0;
              return `<td style="min-width:150px;">
                <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;${full ? 'color:#e08a7a;' : ''}">${count} / ${limit} · ${full ? 'FULL' : left + ' left'}</div>
                <div style="height:3px;border-radius:3px;background:rgba(255,255,255,0.08);margin-top:4px;overflow:hidden;">
                  <div style="height:100%;width:${pct}%;background:${full ? '#e08a7a' : 'var(--champagne,#E7D9B0)'};"></div>
                </div>
              </td>`;
            }
            const val = c.fmt ? c.fmt(raw) : raw;
            return `<td>${esc(val ?? '—')}</td>`;
          })
          .join('');
        return `<tr>
          ${cells}
          <td><div class="row-actions">
            <button class="btn-secondary edit-btn" data-id="${item._id}">Edit</button>
            <button class="btn-danger del-btn" data-id="${item._id}">Delete</button>
          </div></td>
        </tr>`;
      })
      .join('');

    tbody.querySelectorAll('.edit-btn').forEach((btn) =>
      btn.addEventListener('click', () => {
        const item = data.find((d) => d._id === btn.dataset.id);
        openCrudForm(view, item);
      })
    );
    tbody.querySelectorAll('.del-btn').forEach((btn) =>
      btn.addEventListener('click', () => confirmDelete(view, btn.dataset.id))
    );
}

async function confirmDelete(view, id) {
  if (!confirm('Delete this item? This cannot be undone.')) return;
  const cfg = RESOURCES[view] || INBOX_RESOURCES[view];
  try {
    await AOC_API.adminDelete(cfg.endpoint, id);
    showToast('Deleted.', 'success');
    if (RESOURCES[view]) refreshTable(view); else renderInboxView(view);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ---------------- CRUD MODAL FORM (Add / Edit) ---------------- */
function openCrudForm(view, item) {
  const cfg = RESOURCES[view];
  const isEdit = !!item;
  document.getElementById('crudModalTitle').textContent = `${isEdit ? 'Edit' : 'Add'} ${cfg.label.replace(/s$/, '')}`;

  const form = document.getElementById('crudForm');
  form.innerHTML =
    cfg.fields
      .map((f) => {
        const val = isEdit ? item[f.name] : f.default;
        if (f.type === 'textarea') {
          return `<div class="form-field"><label>${f.label}</label><textarea name="${f.name}" rows="3">${esc(val || '')}</textarea></div>`;
        }
        if (f.type === 'select') {
          return `<div class="form-field"><label>${f.label}</label><select name="${f.name}">${f.options
            .map((o) => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`)
            .join('')}</select></div>`;
        }
        if (f.type === 'checkbox') {
          return `<div class="checkbox-row"><input type="checkbox" name="${f.name}" id="cb_${f.name}" ${val ? 'checked' : ''}><label for="cb_${f.name}">${f.label}</label></div>`;
        }
        if (f.type === 'date') {
          const dateVal = val ? new Date(val).toISOString().slice(0, 10) : '';
          return `<div class="form-field"><label>${f.label}</label><input type="date" name="${f.name}" value="${dateVal}" ${f.required ? 'required' : ''}></div>`;
        }
        return `<div class="form-field"><label>${f.label}</label><input type="${f.type}" name="${f.name}" value="${esc(val ?? '')}" ${f.required ? 'required' : ''}></div>`;
      })
      .join('') + `<button type="submit" class="btn-primary">${isEdit ? 'Save Changes' : 'Create'}</button><div class="form-status" id="crudStatus"></div>`;

  form.onsubmit = async (e) => {
    e.preventDefault();
    const status = document.getElementById('crudStatus');
    const submitBtn = form.querySelector('button[type="submit"]');
    const fd = new FormData(form);
    const payload = {};
    cfg.fields.forEach((f) => {
      if (f.type === 'checkbox') {
        payload[f.name] = fd.has(f.name);
      } else if (f.type === 'number') {
        payload[f.name] = fd.get(f.name) === '' ? 0 : Number(fd.get(f.name));
      } else {
        payload[f.name] = fd.get(f.name) || '';
      }
    });
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    status.textContent = '';
    status.className = 'form-status';
    try {
      if (isEdit) await AOC_API.adminUpdate(cfg.endpoint, item._id, payload);
      else await AOC_API.adminCreate(cfg.endpoint, payload);
      showToast(isEdit ? 'Updated.' : 'Created.', 'success');
      closeCrudModal();
      refreshTable(view);
    } catch (err) {
      status.textContent = err.message;
      status.classList.add('error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = isEdit ? 'Save Changes' : 'Create';
    }
  };

  document.getElementById('crudModal').classList.add('open');
}
function closeCrudModal() {
  document.getElementById('crudModal').classList.remove('open');
}
function initCrudModal() {
  document.getElementById('crudModalClose').addEventListener('click', closeCrudModal);
  document.getElementById('crudModal').addEventListener('click', (e) => {
    if (e.target.id === 'crudModal') closeCrudModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCrudModal();
  });
}

/* ---------------- INBOX VIEWS (registrations / join / contact) ---------------- */
let inboxPage = {};
async function renderInboxView(view) {
  const cfg = INBOX_RESOURCES[view];
  const root = document.getElementById('viewContent');
  const exportBtn = view === 'registrations' ? `<a class="btn-secondary" href="/api/registrations/export" target="_blank" style="text-decoration:none;display:inline-block;">Export CSV</a>` : '';
  inboxPage[view] = 1;
  root.innerHTML = `
    <div class="table-toolbar">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <input type="search" id="inboxSearch" placeholder="Search ${esc(cfg.label.toLowerCase())}..." style="background:rgba(255,255,255,0.03);border:1px solid var(--border);color:var(--ivory);border-radius:8px;padding:9px 14px;font-size:13px;width:220px;max-width:50vw;">
        <select id="inboxStatusFilter" style="background:rgba(255,255,255,0.03);border:1px solid var(--border);color:var(--ivory);border-radius:8px;padding:9px 10px;font-size:12px;">
          <option value="">All statuses</option>
          ${cfg.statusOptions.map((s) => `<option value="${s}">${s}</option>`).join('')}
        </select>
      </div>
      ${exportBtn}
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>${cfg.columns.map((c) => `<th>${c === 'createdAt' ? 'Date' : c === 'introVideoUrl' ? 'Intro Video' : c}</th>`).join('')}<th>Actions</th></tr></thead>
        <tbody id="tableBody"><tr class="loading-row"><td colspan="${cfg.columns.length + 1}">Loading…</td></tr></tbody>
      </table>
    </div>
    <div id="inboxPager" style="display:flex;justify-content:center;align-items:center;gap:14px;margin-top:18px;font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:var(--muted,#8a8a90);"></div>
  `;
  let searchDebounce;
  document.getElementById('inboxSearch').addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => { inboxPage[view] = 1; refreshInboxTable(view); }, 300);
  });
  document.getElementById('inboxStatusFilter').addEventListener('change', () => { inboxPage[view] = 1; refreshInboxTable(view); });
  await refreshInboxTable(view);
}

async function refreshInboxTable(view) {
  const cfg = INBOX_RESOURCES[view];
  const tbody = document.getElementById('tableBody');
  const search = document.getElementById('inboxSearch')?.value.trim() || '';
  const status = document.getElementById('inboxStatusFilter')?.value || '';
  const page = inboxPage[view] || 1;
  const params = new URLSearchParams({ page, limit: 25 });
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  try {
    const { data, total, pages } = await AOC_API.adminList(cfg.endpoint, `?${params.toString()}`);
    if (!data.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="${cfg.columns.length + 1}">${search || status ? 'No matches for this search/filter.' : 'Nothing here yet.'}</td></tr>`;
      document.getElementById('inboxPager').innerHTML = '';
      return;
    }
    tbody.innerHTML = data
      .map((item) => {
        const cells = cfg.columns
          .map((c) => {
            if (c === 'createdAt') return `<td>${fmtDate(item.createdAt)}</td>`;
            if (c === 'event') return `<td>${esc(item.event?.title || '—')}</td>`;
            if (c === 'status') {
              return `<td><select class="status-select" data-id="${item._id}" style="background:transparent;border:1px solid var(--border);color:var(--ivory);border-radius:6px;padding:4px 8px;font-size:11px;">
                ${cfg.statusOptions.map((s) => `<option value="${s}" ${item.status === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select></td>`;
            }
            if (c === 'message') return `<td style="max-width:280px;">${esc((item.message || '').slice(0, 90))}${(item.message || '').length > 90 ? '…' : ''}</td>`;
            if (c === 'introVideoUrl') {
              const url = item.introVideoUrl;
              if (!url) return `<td><span style="color:var(--text-dim);">—</span></td>`;
              return `<td><a href="${esc(url)}" target="_blank" rel="noopener noreferrer" style="color:var(--champagne);font-size:12px;font-weight:500;text-decoration:underline;">▶ Watch Video</a></td>`;
            }
            return `<td>${esc(item[c] ?? '—')}</td>`;
          })
          .join('');
        const actions = `<div style="display:flex;gap:6px;align-items:center;">
          ${view === 'join' ? `<button class="btn-secondary view-detail-btn" data-id="${item._id}" style="padding:6px 10px;font-size:10.5px;">View Details</button>` : ''}
          <button class="btn-danger del-btn" data-id="${item._id}">Delete</button>
        </div>`;
        return `<tr>${cells}<td>${actions}</td></tr>`;
      })
      .join('');

    tbody.querySelectorAll('.status-select').forEach((sel) =>
      sel.addEventListener('change', async () => {
        try {
          await AOC_API.adminUpdate(cfg.endpoint, sel.dataset.id, { status: sel.value });
          showToast('Status updated.', 'success');
        } catch (err) {
          showToast(err.message, 'error');
        }
      })
    );
    tbody.querySelectorAll('.view-detail-btn').forEach((btn) =>
      btn.addEventListener('click', () => {
        const item = data.find((d) => d._id === btn.dataset.id);
        if (item) openInboxDetailModal(view, item);
      })
    );
    tbody.querySelectorAll('.del-btn').forEach((btn) =>
      btn.addEventListener('click', () => confirmDelete(view, btn.dataset.id))
    );

    const pager = document.getElementById('inboxPager');
    if (pages > 1) {
      pager.innerHTML = `
        <button class="btn-secondary" id="pagerPrev" ${page <= 1 ? 'disabled' : ''}>&larr; Prev</button>
        <span>Page ${page} of ${pages} · ${total} total</span>
        <button class="btn-secondary" id="pagerNext" ${page >= pages ? 'disabled' : ''}>Next &rarr;</button>`;
      document.getElementById('pagerPrev')?.addEventListener('click', () => { inboxPage[view] = page - 1; refreshInboxTable(view); });
      document.getElementById('pagerNext')?.addEventListener('click', () => { inboxPage[view] = page + 1; refreshInboxTable(view); });
    } else {
      pager.innerHTML = total ? `<span>${total} total</span>` : '';
    }
  } catch (err) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="${cfg.columns.length + 1}">Something interrupted the signal — ${esc(err.message)}</td></tr>`;
  }
}
async function renderSettings() {
  const root = document.getElementById('viewContent');
  root.innerHTML = `<div class="table-wrap" style="padding:32px;"><div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--text-dim);">Loading…</div></div>`;
  try {
    const { data } = await AOC_API.getSettings();
    root.innerHTML = `
      <div class="table-wrap" style="padding:32px;max-width:640px;">
        <form id="settingsForm">
          <div class="form-field"><label>Instagram URL</label><input name="social.instagram" value="${esc(data.social?.instagram)}"></div>
          <div class="form-field"><label>LinkedIn URL</label><input name="social.linkedin" value="${esc(data.social?.linkedin)}"></div>
          <div class="form-field"><label>YouTube URL</label><input name="social.youtube" value="${esc(data.social?.youtube)}"></div>
          <div class="form-field"><label>Contact Email</label><input name="social.email" value="${esc(data.social?.email)}"></div>
          <div class="form-field"><label>MITS Website</label><input name="social.mits" value="${esc(data.social?.mits)}"></div>
          <div class="form-row">
            <div class="form-field"><label>Voices Trained</label><input type="number" name="stats.voicesTrained" value="${data.stats?.voicesTrained || 0}"></div>
            <div class="form-field"><label>Sessions Held</label><input type="number" name="stats.sessionsHeld" value="${data.stats?.sessionsHeld || 0}"></div>
          </div>
          <div class="form-row">
            <div class="form-field"><label>Years Running</label><input type="number" name="stats.yearsRunning" value="${data.stats?.yearsRunning || 0}"></div>
            <div class="form-field"><label>Events Hosted</label><input type="number" name="stats.eventsHosted" value="${data.stats?.eventsHosted || 0}"></div>
          </div>
          <div class="form-field"><label>Members Count</label><input type="number" name="stats.membersCount" value="${data.stats?.membersCount || 0}"></div>
          <div class="form-field"><label>Hero Background Video URL (optional, mp4/webm)</label><input name="heroVideoUrl" value="${esc(data.heroVideoUrl)}"></div>
          <button type="submit" class="btn-primary">Save Settings</button>
          <div class="form-status" id="settingsStatus"></div>
        </form>
      </div>
    `;
    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = document.getElementById('settingsStatus');
      const fd = new FormData(e.target);
      const payload = { social: {}, stats: {} };
      for (const [key, value] of fd.entries()) {
        if (key.startsWith('social.')) payload.social[key.split('.')[1]] = value;
        else if (key.startsWith('stats.')) payload.stats[key.split('.')[1]] = Number(value) || 0;
        else payload[key] = value;
      }
      try {
        await AOC_API.adminUpdateSettings(payload);
        status.textContent = 'Settings saved.';
        status.className = 'form-status success';
        showToast('Settings saved.', 'success');
      } catch (err) {
        status.textContent = err.message;
        status.className = 'form-status error';
      }
    });
  } catch (err) {
    root.innerHTML = `<div class="table-wrap" style="padding:32px;">Couldn't load settings — ${esc(err.message)}</div>`;
  }
}

function openInboxDetailModal(view, item) {
  document.getElementById('crudModalTitle').textContent = `Join Request: ${item.name || 'Details'}`;
  const form = document.getElementById('crudForm');
  form.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px;font-size:13px;line-height:1.6;">
      <div><strong style="color:var(--text-dim);font-size:10px;font-family:'IBM Plex Mono',monospace;text-transform:uppercase;display:block;margin-bottom:4px;">Full Name</strong><div style="font-size:15px;font-weight:500;">${esc(item.name)}</div></div>
      <div class="form-row">
        <div><strong style="color:var(--text-dim);font-size:10px;font-family:'IBM Plex Mono',monospace;text-transform:uppercase;display:block;margin-bottom:4px;">Email</strong><div><a href="mailto:${esc(item.email)}" style="color:var(--champagne);">${esc(item.email)}</a></div></div>
        <div><strong style="color:var(--text-dim);font-size:10px;font-family:'IBM Plex Mono',monospace;text-transform:uppercase;display:block;margin-bottom:4px;">Phone</strong><div>${esc(item.phone)}</div></div>
      </div>
      <div class="form-row">
        <div><strong style="color:var(--text-dim);font-size:10px;font-family:'IBM Plex Mono',monospace;text-transform:uppercase;display:block;margin-bottom:4px;">Branch</strong><div>${esc(item.branch || '—')}</div></div>
        <div><strong style="color:var(--text-dim);font-size:10px;font-family:'IBM Plex Mono',monospace;text-transform:uppercase;display:block;margin-bottom:4px;">Year</strong><div>${esc(item.year || '—')}</div></div>
      </div>
      <div>
        <strong style="color:var(--text-dim);font-size:10px;font-family:'IBM Plex Mono',monospace;text-transform:uppercase;display:block;margin-bottom:6px;">Intro Video Link (YouTube / Drive)</strong>
        <div>
          ${item.introVideoUrl ? `<a href="${esc(item.introVideoUrl)}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="display:inline-block;width:auto;padding:10px 18px;text-decoration:none;">▶ Watch Intro Video</a>` : '<span style="color:var(--text-dim);font-style:italic;">No intro video provided</span>'}
        </div>
      </div>
      <div>
        <strong style="color:var(--text-dim);font-size:10px;font-family:'IBM Plex Mono',monospace;text-transform:uppercase;display:block;margin-bottom:4px;">Why do you want to join?</strong>
        <div style="background:rgba(255,255,255,0.03);padding:12px;border-radius:8px;border:1px solid var(--border);white-space:pre-wrap;">${esc(item.reason || '—')}</div>
      </div>
      <div>
        <strong style="color:var(--text-dim);font-size:10px;font-family:'IBM Plex Mono',monospace;text-transform:uppercase;display:block;margin-bottom:4px;">Previous Experience</strong>
        <div style="background:rgba(255,255,255,0.03);padding:12px;border-radius:8px;border:1px solid var(--border);white-space:pre-wrap;">${esc(item.experience || '—')}</div>
      </div>
      <div class="form-row">
        <div><strong style="color:var(--text-dim);font-size:10px;font-family:'IBM Plex Mono',monospace;text-transform:uppercase;display:block;margin-bottom:4px;">Instagram</strong><div>${item.instagram ? `<a href="${esc(item.instagram)}" target="_blank" rel="noopener noreferrer" style="color:var(--champagne);">${esc(item.instagram)}</a>` : '—'}</div></div>
        <div><strong style="color:var(--text-dim);font-size:10px;font-family:'IBM Plex Mono',monospace;text-transform:uppercase;display:block;margin-bottom:4px;">LinkedIn</strong><div>${item.linkedin ? `<a href="${esc(item.linkedin)}" target="_blank" rel="noopener noreferrer" style="color:var(--champagne);">${esc(item.linkedin)}</a>` : '—'}</div></div>
      </div>
      <div style="margin-top:10px;text-align:right;">
        <button type="button" class="btn-secondary" id="closeDetailModalBtn">Close</button>
      </div>
    </div>
  `;
  document.getElementById('crudModal').classList.add('open');
  document.getElementById('closeDetailModalBtn')?.addEventListener('click', closeCrudModal);
}

/* ---------------- BOOT ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  initNav();
  initCrudModal();
  tryAutoLogin();
});
