const API_BASE = window.__API_BASE__ || window.API_BASE || 'https://endpr.ni041372.workers.dev';

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
let currentDraft = load(DRAFT_KEY, { id: null, title: '', body: '', savedAt: null });
let currentSession = load(SESSION_KEY, null);

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

function setStatus(el, message, isError = false) {
  el.textContent = message || '';
  el.classList.toggle('error', Boolean(isError));
}

function buildUrl(path) {
  if (!path.startsWith('/')) return `${API_BASE}/${path}`;
  return `${API_BASE}${path}`;
}

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(buildUrl(path), {
    credentials: 'include',
    ...options,
    headers,
    body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body,
  });

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (error) {
      console.warn('Failed to parse JSON', error);
    }
  }

  if (!response.ok) {
    const message = data?.error || data?.message || `Request failed (${response.status})`;
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

function formatError(error) {
  const statusSuffix = error?.status ? ` (HTTP ${error.status})` : '';
  return (error?.message || '요청 중 문제가 발생했습니다.') + statusSuffix;
}

function persistSession(session) {
  currentSession = session;
  save(SESSION_KEY, session);
  renderSession();
}

function renderSession() {
  if (!currentSession) {
    setStatus(sessionStatus, '로그인 필요 — 세션이 없습니다.', true);
    return;
  }

  const tenantSlug = currentSession?.tenant?.slug || currentSession?.tenantSlug || currentSession?.tenant || '-';
  const email = currentSession?.user?.email || currentSession?.email || 'unknown';
  const loggedInAt = currentSession?.loggedInAt ? formatTime(new Date(currentSession.loggedInAt)) : '알 수 없음';

  sessionStatus.innerHTML = `
    테넌트 <strong>${tenantSlug}</strong> · ${email}<br />
    로그인: ${loggedInAt}
  `;
  sessionStatus.classList.remove('error');
}

async function fetchSession() {
  try {
    const data = await apiFetch('/cms/auth/me');
    const loggedInAt = currentSession?.loggedInAt || new Date().toISOString();
    persistSession({ ...data, loggedInAt });
  } catch (error) {
    currentSession = null;
    localStorage.removeItem(SESSION_KEY);
    setStatus(sessionStatus, error.status === 401 ? '로그인이 필요합니다.' : formatError(error), true);
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const tenant = formData.get('tenant')?.toString().trim();
  const email = formData.get('email')?.toString().trim();
  const password = formData.get('password')?.toString().trim();

  if (!tenant || !email || !password) return;

  try {
    setStatus(sessionStatus, '로그인 중…');
    await apiFetch('/cms/auth/login', {
      method: 'POST',
      body: { tenantSlug: tenant, email, password },
    });
    await fetchSession();
    publishMessage.textContent = '';
  } catch (error) {
    setStatus(sessionStatus, formatError(error), true);
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  currentSession = null;
  renderSession();
});

function renderPreview() {
  const draft = currentDraft || { title: '', body: '' };
  previewPane.textContent = draft.title || draft.body
    ? `# ${draft.title || '제목 없음'}\n\n${draft.body || '본문을 입력하면 미리보기가 표시됩니다.'}`
    : '작성된 내용이 없습니다.';
}

function persistDraft(partial) {
  currentDraft = {
    ...currentDraft,
    ...partial,
  };
  save(DRAFT_KEY, currentDraft);
  renderPreview();
}

function renderAutosaveSavedAt(savedAt) {
  if (!savedAt) return;
  setStatus(autosaveStatus, `Saved at ${formatTime(new Date(savedAt))}`);
}

async function ensurePostId(title, body) {
  if (currentDraft?.id) return currentDraft.id;
  const created = await apiFetch('/cms/posts', {
    method: 'POST',
    body: { title: title || '제목 없음', body_md: body },
  });
  const postId = created?.post?.id;
  if (!postId) throw new Error('게시글 ID를 받을 수 없습니다.');
  persistDraft({ id: postId });
  return postId;
}

async function saveDraftToApi(title, body) {
  if (!currentSession) {
    setStatus(autosaveStatus, '로그인 후 저장할 수 있습니다.', true);
    return;
  }

  try {
    setStatus(autosaveStatus, 'Saving...');
    const postId = await ensurePostId(title, body);
    const saved = await apiFetch(`/cms/posts/${postId}/autosave`, {
      method: 'POST',
      body: { title, body_md: body },
    });
    const savedAt = saved?.saved_at || saved?.post?.updated_at_iso || new Date().toISOString();
    persistDraft({ id: postId, title, body, savedAt });
    renderAutosaveSavedAt(savedAt);
  } catch (error) {
    setStatus(autosaveStatus, formatError(error), true);
  }
}

function handleAutosave() {
  setStatus(autosaveStatus, 'Saving...');
  if (autosaveTimer) clearTimeout(autosaveTimer);
  const title = titleInput.value;
  const body = bodyInput.value;
  renderPreview();
  autosaveTimer = setTimeout(() => {
    saveDraftToApi(title, body);
  }, 1500);
}

titleInput.addEventListener('input', handleAutosave);
bodyInput.addEventListener('input', handleAutosave);

clearDraftBtn.addEventListener('click', () => {
  localStorage.removeItem(DRAFT_KEY);
  currentDraft = { id: null, title: '', body: '', savedAt: null };
  titleInput.value = '';
  bodyInput.value = '';
  setStatus(autosaveStatus, '초안이 비워졌습니다.');
  renderPreview();
});

function normalizeJob(rawJob, overrides = {}) {
  return {
    id: rawJob?.id || overrides.id,
    tenant: currentSession?.tenant?.slug || currentSession?.tenant || '-',
    title: currentDraft?.title || overrides.title || '제목 없음',
    status: rawJob?.status || overrides.status || 'queued',
    message: rawJob?.message || overrides.message || '상태 확인 중',
    createdAt: rawJob?.created_at_iso || rawJob?.created_at || overrides.createdAt || new Date().toISOString(),
    updatedAt: rawJob?.updated_at_iso || rawJob?.updated_at || overrides.updatedAt || new Date().toISOString(),
  };
}

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

function upsertJob(job) {
  const jobs = load(JOB_KEY, []);
  const index = jobs.findIndex((j) => j.id === job.id);
  if (index >= 0) {
    jobs[index] = { ...jobs[index], ...job, updatedAt: job.updatedAt || jobs[index].updatedAt };
  } else {
    jobs.push(job);
  }
  updateJobs(jobs);
}

function pollDeployJob(jobId, attempt = 0) {
  const MAX_ATTEMPTS = 15;
  const DELAY_MS = 2000;

  const schedule = () => {
    if (attempt + 1 >= MAX_ATTEMPTS) {
      setStatus(publishMessage, '배포 상태 확인 시간이 초과되었습니다.', true);
      return;
    }
    setTimeout(() => pollDeployJob(jobId, attempt + 1), DELAY_MS);
  };

  apiFetch(`/cms/deploy-jobs/${jobId}`)
    .then((data) => {
      const job = normalizeJob(data?.job, { id: jobId });
      upsertJob(job);
      const status = job.status;
      if (status === 'success') {
        setStatus(publishMessage, '배포가 완료되었습니다.');
      } else if (status === 'failed') {
        setStatus(publishMessage, job.message || '배포 실패', true);
      } else {
        setStatus(publishMessage, '배포 상태를 확인하는 중…');
        schedule();
      }
    })
    .catch((error) => {
      setStatus(publishMessage, formatError(error), true);
    });
}

publishBtn.addEventListener('click', async () => {
  if (!currentSession) {
    setStatus(publishMessage, '로그인 세션이 없습니다. 먼저 로그인하세요.', true);
    return;
  }

  const title = titleInput.value.trim() || '제목 없음';
  const body = bodyInput.value || '';

  try {
    setStatus(publishMessage, '발행 요청 중…');
    const postId = await ensurePostId(title, body);
    await apiFetch(`/cms/posts/${postId}/autosave`, {
      method: 'POST',
      body: { title, body_md: body },
    });
    const response = await apiFetch(`/cms/posts/${postId}/publish`, {
      method: 'POST',
      body: { title, body_md: body },
    });
    const deployJob = response?.deploy_job;
    const jobId = deployJob?.id;
    if (!jobId) throw new Error('배포 Job ID를 받을 수 없습니다.');

    upsertJob(normalizeJob(deployJob, { id: jobId, title }));
    pollDeployJob(jobId);
  } catch (error) {
    setStatus(publishMessage, formatError(error), true);
  }
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
  titleInput.value = currentDraft.title || '';
  bodyInput.value = currentDraft.body || '';
  renderAutosaveSavedAt(currentDraft.savedAt);

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
fetchSession();
