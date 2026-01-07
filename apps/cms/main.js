const API_BASE = window.__API_BASE__ || window.API_BASE || 'https://endpr.ni041372.workers.dev';
const BLOG_BASE = window.__BLOG_BASE__ || window.BLOG_BASE || 'https://endpr.pages.dev';

const SESSION_KEY = 'cms-session';
const DRAFT_KEY = 'cms-draft';
const JOB_KEY = 'cms-jobs';

const loginForm = document.getElementById('loginForm');
const sessionStatus = document.getElementById('sessionStatus');
const logoutBtn = document.getElementById('logoutBtn');
const titleInput = document.getElementById('titleInput');
const bodyInput = document.getElementById('bodyInput');
const autosaveStatus = document.getElementById('autosaveStatus');
const clearDraftBtn = document.getElementById('clearDraftBtn');
const publishBtn = document.getElementById('publishBtn');
const publishMessage = document.getElementById('publishMessage');
const publishLink = document.getElementById('publishLink');
const deployJobsEl = document.getElementById('deployJobs');
const previewPane = document.getElementById('previewPane');
const manualSaveBtn = document.getElementById('manualSaveBtn');
const retrySaveBtn = document.getElementById('retrySaveBtn');
const postsListEl = document.getElementById('postsList');
const postsStatusEl = document.getElementById('postsStatus');
const refreshPostsBtn = document.getElementById('refreshPostsBtn');
const refreshJobsBtn = document.getElementById('refreshJobsBtn');
const jobDetailEl = document.getElementById('jobDetail');
const selectedPostMeta = document.getElementById('selectedPostMeta');
const printBtn = document.getElementById('printBtn');

let autosaveTimer = null;
let currentDraft = load(DRAFT_KEY, { id: null, title: '', body: '', savedAt: null, status: null });
let currentSession = load(SESSION_KEY, null);
let currentPosts = [];
let currentJobs = load(JOB_KEY, []);

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
    dateStyle: 'short',
    timeStyle: 'short',
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
    await Promise.all([fetchPosts(), fetchDeployJobs()]);
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
  renderSelectedPostMeta();
}

function renderSelectedPostMeta() {
  if (!currentDraft?.id) {
    selectedPostMeta.textContent = '선택된 게시글이 없습니다.';
    return;
  }
  const status = currentDraft.status ? ` · ${currentDraft.status}` : '';
  const savedAt = currentDraft.savedAt ? ` · ${formatTime(new Date(currentDraft.savedAt))}` : '';
  selectedPostMeta.textContent = `ID ${currentDraft.id}${status}${savedAt}`;
}

function setAutosaveState(state, message, isError = false) {
  autosaveStatus.textContent = message || '';
  autosaveStatus.classList.toggle('error', Boolean(isError));
  retrySaveBtn.classList.toggle('hidden', state !== 'error');
}

function renderAutosaveSavedAt(savedAt) {
  if (!savedAt) return;
  setAutosaveState('saved', `Saved at ${formatTime(new Date(savedAt))}`);
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
    setAutosaveState('error', '로그인 후 저장할 수 있습니다.', true);
    return;
  }

  try {
    setAutosaveState('saving', 'Saving...');
    const postId = await ensurePostId(title, body);
    const saved = await apiFetch(`/cms/posts/${postId}/autosave`, {
      method: 'POST',
      body: { title, body_md: body },
    });
    const savedAt = saved?.saved_at || saved?.post?.updated_at_iso || new Date().toISOString();
    persistDraft({ id: postId, title, body, savedAt, status: saved?.post?.status });
    renderAutosaveSavedAt(savedAt);
  } catch (error) {
    setAutosaveState('error', formatError(error), true);
  }
}

function handleAutosave() {
  setAutosaveState('saving', 'Saving...');
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

manualSaveBtn.addEventListener('click', () => {
  saveDraftToApi(titleInput.value, bodyInput.value);
});

retrySaveBtn.addEventListener('click', () => {
  saveDraftToApi(titleInput.value, bodyInput.value);
});

clearDraftBtn.addEventListener('click', () => {
  localStorage.removeItem(DRAFT_KEY);
  currentDraft = { id: null, title: '', body: '', savedAt: null, status: null };
  titleInput.value = '';
  bodyInput.value = '';
  setAutosaveState('idle', '초안이 비워졌습니다.');
  renderPreview();
  renderSelectedPostMeta();
});

function normalizePost(rawPost) {
  return {
    id: rawPost?.id,
    title: rawPost?.title || '제목 없음',
    status: rawPost?.status || rawPost?.state || 'draft',
    updatedAt: rawPost?.updated_at_iso || rawPost?.updated_at || rawPost?.saved_at || null,
    body: rawPost?.body_md || rawPost?.body || '',
  };
}

function renderPosts() {
  postsListEl.innerHTML = '';
  if (!currentPosts.length) {
    postsListEl.innerHTML = '<div class="muted">게시글이 없습니다.</div>';
    return;
  }

  currentPosts.forEach((post) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    if (currentDraft?.id === post.id) item.classList.add('active');
    item.setAttribute('role', 'option');
    item.dataset.postId = post.id;
    const updated = post.updatedAt ? formatTime(new Date(post.updatedAt)) : '업데이트 없음';
    item.innerHTML = `
      <div><strong>${post.title || '제목 없음'}</strong></div>
      <div class="meta">
        <span>${post.status || 'draft'}</span>
        <span>${updated}</span>
      </div>
    `;
    item.addEventListener('click', () => selectPost(post));
    postsListEl.appendChild(item);
  });
}

async function fetchPosts() {
  try {
    postsStatusEl.textContent = '게시글 불러오는 중…';
    const data = await apiFetch('/cms/posts');
    const posts = data?.posts || data?.data || [];
    currentPosts = posts.map(normalizePost);
    postsStatusEl.textContent = `${currentPosts.length}건의 게시글`;
    renderPosts();
  } catch (error) {
    postsStatusEl.textContent = formatError(error);
  }
}

async function selectPost(post) {
  if (!post?.id) return;
  let next = { ...post };

  if (!post.body) {
    try {
      const detail = await apiFetch(`/cms/posts/${post.id}`);
      const detailedPost = normalizePost(detail?.post || detail);
      next = { ...next, ...detailedPost };
    } catch (error) {
      setAutosaveState('error', formatError(error), true);
    }
  }

  persistDraft({
    id: next.id,
    title: next.title,
    body: next.body || '',
    savedAt: next.updatedAt || currentDraft.savedAt,
    status: next.status,
  });
  titleInput.value = next.title || '';
  bodyInput.value = next.body || '';
  renderAutosaveSavedAt(currentDraft.savedAt);
  renderPosts();
}

refreshPostsBtn.addEventListener('click', () => {
  fetchPosts();
});

function normalizeJob(rawJob, overrides = {}) {
  return {
    id: rawJob?.id || overrides.id,
    tenant: currentSession?.tenant?.slug || currentSession?.tenant || '-',
    title: rawJob?.title || overrides.title || currentDraft?.title || '제목 없음',
    status: rawJob?.status || overrides.status || 'queued',
    message: rawJob?.message || overrides.message || '상태 확인 중',
    createdAt: rawJob?.created_at_iso || rawJob?.created_at || overrides.createdAt || new Date().toISOString(),
    updatedAt: rawJob?.updated_at_iso || rawJob?.updated_at || overrides.updatedAt || new Date().toISOString(),
  };
}

function renderJobs() {
  deployJobsEl.innerHTML = '';
  if (!currentJobs.length) {
    deployJobsEl.innerHTML = '<div class="muted">배포 작업이 없습니다.</div>';
    return;
  }

  currentJobs
    .slice(0, 10)
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
      item.addEventListener('click', () => selectJob(job));
      deployJobsEl.appendChild(item);
    });
}

function updateJobs(list) {
  currentJobs = list
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);
  save(JOB_KEY, currentJobs);
  renderJobs();
}

async function fetchDeployJobs() {
  try {
    const data = await apiFetch('/cms/deploy-jobs');
    const jobs = data?.jobs || data?.data || [];
    updateJobs(jobs.map((job) => normalizeJob(job)));
  } catch (error) {
    jobDetailEl.textContent = formatError(error);
  }
}

async function selectJob(job) {
  if (!job?.id) return;
  try {
    const data = await apiFetch(`/cms/deploy-jobs/${job.id}`);
    const detail = data?.job || data || job;
    const normalized = normalizeJob(detail, { id: job.id });
    jobDetailEl.innerHTML = `
      <div><strong>${normalized.title}</strong></div>
      <div class="muted">상태: ${normalized.status}</div>
      <div class="muted">메시지: ${normalized.message}</div>
      <div class="muted">업데이트: ${formatTime(new Date(normalized.updatedAt))}</div>
    `;
  } catch (error) {
    jobDetailEl.textContent = formatError(error);
  }
}

function upsertJob(job) {
  const jobs = currentJobs.slice();
  const index = jobs.findIndex((j) => j.id === job.id);
  if (index >= 0) {
    jobs[index] = { ...jobs[index], ...job, updatedAt: job.updatedAt || jobs[index].updatedAt };
  } else {
    jobs.unshift(job);
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

function buildBlogUrl(post) {
  if (!BLOG_BASE) return null;
  const base = BLOG_BASE.replace(/\/$/, '');
  const slug = post?.slug || post?.id;
  if (!slug) return base;
  return `${base}/${slug}`;
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

    const postPayload = response?.post || { id: postId };
    const url = buildBlogUrl(postPayload);
    if (url) {
      publishLink.innerHTML = `<a href="${url}" target="_blank" rel="noopener">블로그에서 보기 →</a>`;
    }
  } catch (error) {
    setStatus(publishMessage, formatError(error), true);
  }
});

refreshJobsBtn.addEventListener('click', () => {
  fetchDeployJobs();
});

printBtn.addEventListener('click', () => {
  window.print();
});

function hydrateFromStorage() {
  titleInput.value = currentDraft.title || '';
  bodyInput.value = currentDraft.body || '';
  renderAutosaveSavedAt(currentDraft.savedAt);
  renderPreview();
  renderSelectedPostMeta();
  updateJobs(currentJobs);
}

hydrateFromStorage();
fetchSession();
fetchPosts();
fetchDeployJobs();
