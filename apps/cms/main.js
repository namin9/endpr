const SESSION_KEY = 'cms-session';
const DRAFT_KEY = 'cms-draft';
const CATEGORY_KEY = 'cms-categories';
const SHARE_KEY = 'cms-share-token';
const JOB_KEY = 'cms-jobs';
const THEME_KEY = 'cms-theme';

const loginForm = document.getElementById('loginForm');
const sessionStatus = document.getElementById('sessionStatus');
const logoutBtn = document.getElementById('logoutBtn');
const titleInput = document.getElementById('titleInput');
const bodyInput = document.getElementById('bodyInput');
const autosaveStatus = document.getElementById('autosaveStatus');
const clearDraftBtn = document.getElementById('clearDraftBtn');
const publishBtn = document.getElementById('publishBtn');
const publishMessage = document.getElementById('publishMessage');
const deployJobsEl = document.getElementById('deployJobs');
const previewPane = document.getElementById('previewPane');
const shareBtn = document.getElementById('shareBtn');
const revokeBtn = document.getElementById('revokeBtn');
const shareLinkEl = document.getElementById('shareLink');
const categoryForm = document.getElementById('categoryForm');
const categoryList = document.getElementById('categoryList');
const themeSelect = document.getElementById('themeSelect');
const printBtn = document.getElementById('printBtn');

let autosaveTimer = null;

function load(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Failed to parse ${key}`, e);
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatTime(date) {
  return new Intl.DateTimeFormat('ko', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

function renderSession() {
  const session = load(SESSION_KEY, null);
  if (!session) {
    sessionStatus.textContent = '로그인 필요 — 세션이 없습니다.';
    return;
  }
  sessionStatus.innerHTML = `
    테넌트 <strong>${session.tenant}</strong> · ${session.email}<br />
    로그인: ${formatTime(new Date(session.loggedInAt))}
  `;
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const tenant = formData.get('tenant')?.trim();
  const email = formData.get('email')?.trim();
  const password = formData.get('password')?.trim();

  if (!tenant || !email || !password) return;

  const session = {
    tenant,
    email,
    loggedInAt: new Date().toISOString(),
  };
  save(SESSION_KEY, session);
  renderSession();
  publishMessage.textContent = '';
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  renderSession();
});

function renderPreview() {
  const draft = load(DRAFT_KEY, { title: '', body: '' });
  previewPane.textContent = draft.title || draft.body
    ? `# ${draft.title || '제목 없음'}\n\n${draft.body || '본문을 입력하면 미리보기가 표시됩니다.'}`
    : '작성된 내용이 없습니다.';
}

function handleAutosave() {
  autosaveStatus.textContent = 'Saving...';
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    const draft = {
      title: titleInput.value,
      body: bodyInput.value,
      savedAt: new Date().toISOString(),
    };
    save(DRAFT_KEY, draft);
    autosaveStatus.textContent = `Saved at ${formatTime(new Date(draft.savedAt))}`;
    renderPreview();
  }, 1500);
}

titleInput.addEventListener('input', handleAutosave);
bodyInput.addEventListener('input', handleAutosave);

clearDraftBtn.addEventListener('click', () => {
  localStorage.removeItem(DRAFT_KEY);
  titleInput.value = '';
  bodyInput.value = '';
  autosaveStatus.textContent = '초안이 비워졌습니다.';
  renderPreview();
});

function updateJobs(list) {
  save(JOB_KEY, list);
  deployJobsEl.innerHTML = '';
  list
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .forEach((job) => {
      const item = document.createElement('div');
      item.className = 'job-item';
      const statusClass = `status-${job.status}`;
      item.innerHTML = `
        <div class="row between">
          <div>
            <div class="muted">${job.id} · 테넌트 ${job.tenant}</div>
            <div><strong>${job.title || '제목 없음'}</strong></div>
          </div>
          <span class="status-chip ${statusClass}">${job.status}</span>
        </div>
        <div class="muted">${job.message}</div>
      `;
      deployJobsEl.appendChild(item);
    });
}

function stepJobStatus(jobId, nextStatus, message, delay) {
  setTimeout(() => {
    const jobs = load(JOB_KEY, []);
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    job.status = nextStatus;
    job.message = message;
    job.updatedAt = new Date().toISOString();
    updateJobs(jobs);
  }, delay);
}

publishBtn.addEventListener('click', () => {
  const session = load(SESSION_KEY, null);
  if (!session) {
    publishMessage.textContent = '로그인 세션이 없습니다. 먼저 로그인하세요.';
    return;
  }

  const draft = load(DRAFT_KEY, { title: '', body: '' });
  const id = `JOB-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const jobs = load(JOB_KEY, []);
  const newJob = {
    id,
    tenant: session.tenant,
    title: draft.title,
    status: 'queued',
    message: 'Deploy hook 대기 중',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  jobs.push(newJob);
  updateJobs(jobs);
  publishMessage.textContent = `deploy_job 생성: ${id}`;

  stepJobStatus(id, 'building', '빌드 중… (예: Cloudflare Pages)', 1200);
  stepJobStatus(id, 'success', '배포 완료 — 새 HTML이 생성되었습니다.', 3200);
});

function generateShareToken() {
  return Math.random().toString(36).slice(2, 10);
}

shareBtn.addEventListener('click', () => {
  const token = generateShareToken();
  const payload = { token, createdAt: new Date().toISOString() };
  save(SHARE_KEY, payload);
  shareLinkEl.textContent = `공유 링크: https://preview.local/share?token=${token}`;
});

revokeBtn.addEventListener('click', () => {
  localStorage.removeItem(SHARE_KEY);
  shareLinkEl.textContent = '공유 링크가 폐기되었습니다.';
});

function renderShare() {
  const share = load(SHARE_KEY, null);
  if (!share) {
    shareLinkEl.textContent = '공유 링크가 없습니다. 생성 후 토큰 기반 접근이 가능합니다.';
    return;
  }
  shareLinkEl.textContent = `공유 링크: https://preview.local/share?token=${share.token} (생성 ${formatTime(new Date(share.createdAt))})`;
}

const RESERVED = new Set(['posts', 'category', 'tag', 'search', 'assets', 'api', 'cms', 'sitemap.xml', 'robots.txt']);

function renderCategories() {
  const categories = load(CATEGORY_KEY, []);
  categoryList.innerHTML = '';
  categories.forEach((cat, index) => {
    const item = document.createElement('div');
    item.className = 'category-item';
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `<strong>${cat.name}</strong><span class="muted">/${cat.slug}</span>`;

    const controls = document.createElement('div');
    controls.className = 'row gap';

    const toggleLabel = document.createElement('label');
    toggleLabel.className = 'toggle';
    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = cat.enabled;
    toggle.addEventListener('change', () => {
      cat.enabled = toggle.checked;
      save(CATEGORY_KEY, categories);
    });
    toggleLabel.append(toggle, document.createTextNode('ON/OFF'));

    const up = document.createElement('button');
    up.className = 'ghost';
    up.textContent = '▲';
    up.addEventListener('click', () => {
      if (index === 0) return;
      const swapped = categories[index - 1];
      categories[index - 1] = cat;
      categories[index] = swapped;
      save(CATEGORY_KEY, categories);
      renderCategories();
    });

    const down = document.createElement('button');
    down.className = 'ghost';
    down.textContent = '▼';
    down.addEventListener('click', () => {
      if (index === categories.length - 1) return;
      const swapped = categories[index + 1];
      categories[index + 1] = cat;
      categories[index] = swapped;
      save(CATEGORY_KEY, categories);
      renderCategories();
    });

    controls.append(toggleLabel, up, down);
    item.append(meta, controls);
    categoryList.appendChild(item);
  });
}

categoryForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(categoryForm);
  const name = formData.get('name')?.toString().trim();
  const slug = formData.get('slug')?.toString().trim();
  if (!name || !slug) return;
  if (RESERVED.has(slug)) {
    alert('예약어(slug)로 사용할 수 없습니다. 다른 값을 입력하세요.');
    return;
  }
  const categories = load(CATEGORY_KEY, []);
  categories.push({ name, slug, enabled: true });
  save(CATEGORY_KEY, categories);
  categoryForm.reset();
  renderCategories();
});

function initCategories() {
  if (load(CATEGORY_KEY, null)) return renderCategories();
  const defaults = [
    { name: 'Announcements', slug: 'announcements', enabled: true },
    { name: 'Product', slug: 'product', enabled: true },
    { name: 'Culture', slug: 'culture', enabled: false },
  ];
  save(CATEGORY_KEY, defaults);
  renderCategories();
}

function applyTheme(value) {
  document.documentElement.setAttribute('data-theme', value);
  save(THEME_KEY, value);
}

themeSelect.addEventListener('change', () => {
  applyTheme(themeSelect.value);
});

printBtn.addEventListener('click', () => {
  window.print();
});

function hydrateFromStorage() {
  const draft = load(DRAFT_KEY, { title: '', body: '' });
  titleInput.value = draft.title || '';
  bodyInput.value = draft.body || '';
  if (draft.savedAt) {
    autosaveStatus.textContent = `Saved at ${formatTime(new Date(draft.savedAt))}`;
  }

  const theme = load(THEME_KEY, 'light');
  themeSelect.value = theme;
  applyTheme(theme);

  updateJobs(load(JOB_KEY, []));
  renderPreview();
  renderShare();
  renderSession();
  initCategories();
}

hydrateFromStorage();
