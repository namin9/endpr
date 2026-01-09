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
const previewStatus = document.getElementById('previewStatus');
const manualSaveBtn = document.getElementById('manualSaveBtn');
const retrySaveBtn = document.getElementById('retrySaveBtn');
const postsListEl = document.getElementById('postsList');
const postsStatusEl = document.getElementById('postsStatus');
const refreshPostsBtn = document.getElementById('refreshPostsBtn');
const newPostBtn = document.getElementById('newPostBtn');
const postsSearchInput = document.getElementById('postsSearchInput');
const postsStatusFilter = document.getElementById('postsStatusFilter');
const postsPrevBtn = document.getElementById('postsPrevBtn');
const postsNextBtn = document.getElementById('postsNextBtn');
const postsPageInfo = document.getElementById('postsPageInfo');
const refreshJobsBtn = document.getElementById('refreshJobsBtn');
const jobDetailEl = document.getElementById('jobDetail');
const selectedPostMeta = document.getElementById('selectedPostMeta');
const printBtn = document.getElementById('printBtn');
const editorCard = document.querySelector('.editor-card');
const viewModeButtons = Array.from(document.querySelectorAll('[data-view-mode]'));
const viewOnBlogBtn = document.getElementById('viewOnBlogBtn');
const viewOnBlogHint = document.getElementById('viewOnBlogHint');
const deployJobsScope = document.getElementById('deployJobsScope');
const quillEditorEl = document.getElementById('quillEditor');
const editorToolbar = document.getElementById('editorToolbar');

let autosaveTimer = null;
let previewTimer = null;
let currentDraft = load(DRAFT_KEY, { id: null, title: '', body: '', savedAt: null, status: null });
let currentSession = load(SESSION_KEY, null);
let currentPosts = [];
let allPosts = [];
let currentJobs = load(JOB_KEY, []);
let quill = null;
let suppressQuillChange = false;
let postsView = {
  search: '',
  status: 'all',
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 1,
  serverMode: false,
};
let autosaveState = {
  dirty: false,
  saving: false,
  savedAt: null,
  error: null,
};
let currentViewMode = 'split';

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

function formatMaybeDate(value) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return formatTime(parsed);
}

function formatClock(value) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return new Intl.DateTimeFormat('ko', { timeStyle: 'medium' }).format(parsed);
}

function initQuillEditor() {
  if (!window.Quill || !quillEditorEl) return;

  const Font = Quill.import('formats/font');
  Font.whitelist = ['inter', 'serif', 'monospace'];
  Quill.register(Font, true);

  const SizeStyle = Quill.import('attributors/style/size');
  SizeStyle.whitelist = ['12px', '14px', '16px', '18px', '24px', '32px'];
  Quill.register(SizeStyle, true);

  quill = new Quill(quillEditorEl, {
    theme: 'snow',
    modules: {
      toolbar: editorToolbar,
    },
  });

  document.querySelectorAll('.ql-toolbar button').forEach((button) => {
    button.setAttribute('type', 'button');
  });

  const toolbar = quill.getModule('toolbar');
  if (toolbar) {
    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.accept = 'image/*';
    imageInput.className = 'editor-textarea--hidden';
    document.body.appendChild(imageInput);

    toolbar.addHandler('image', () => {
      imageInput.value = '';
      imageInput.click();
    });

    imageInput.addEventListener('change', () => {
      const file = imageInput.files && imageInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const range = quill.getSelection(true);
        const index = range ? range.index : quill.getLength();
        quill.insertEmbed(index, 'image', reader.result, 'user');
        quill.setSelection(index + 1, 0);
      };
      reader.readAsDataURL(file);
    });
  }
}

function pickBlockAttributes(attributes = {}) {
  const blockAttributes = {};
  ['header', 'list', 'blockquote', 'code-block'].forEach((key) => {
    if (attributes[key]) {
      blockAttributes[key] = attributes[key];
    }
  });
  return blockAttributes;
}

function formatInlineMarkdown(text, attributes = {}) {
  if (!text) return '';
  let output = text;
  if (attributes.code) {
    return `\`${output.replace(/`/g, '\\`')}\``;
  }
  if (attributes.bold && attributes.italic) {
    output = `***${output}***`;
  } else if (attributes.bold) {
    output = `**${output}**`;
  } else if (attributes.italic) {
    output = `*${output}*`;
  }
  if (attributes.link) {
    output = `[${output}](${attributes.link})`;
  }
  return output;
}

function quillDeltaToMarkdown(delta) {
  const lines = [];
  let currentLine = [];

  const pushLine = (attributes = {}) => {
    lines.push({
      segments: currentLine.slice(),
      attrs: pickBlockAttributes(attributes),
    });
    currentLine = [];
  };

  (delta?.ops || []).forEach((op) => {
    if (typeof op.insert === 'string') {
      const parts = op.insert.split('\n');
      const attributes = op.attributes || {};
      const inlineAttributes = { ...attributes };
      delete inlineAttributes.header;
      delete inlineAttributes.list;
      delete inlineAttributes.blockquote;
      delete inlineAttributes['code-block'];
      parts.forEach((part, index) => {
        if (part) {
          currentLine.push({ text: part, attrs: inlineAttributes });
        }
        if (index < parts.length - 1) {
          pushLine(attributes);
        }
      });
    } else if (op.insert?.image) {
      currentLine.push({ text: `![image](${op.insert.image})`, attrs: {} });
    }
  });

  if (currentLine.length) {
    pushLine();
  }

  const output = [];
  let inCodeBlock = false;

  lines.forEach((line) => {
    const text = line.segments.map((segment) => formatInlineMarkdown(segment.text, segment.attrs)).join('');
    if (line.attrs['code-block']) {
      if (!inCodeBlock) {
        output.push('```');
        inCodeBlock = true;
      }
      output.push(line.segments.map((segment) => segment.text).join(''));
      return;
    }
    if (inCodeBlock) {
      output.push('```');
      inCodeBlock = false;
    }
    if (line.attrs.header) {
      output.push(`${'#'.repeat(line.attrs.header)} ${text}`);
      return;
    }
    if (line.attrs.list) {
      const bullet = line.attrs.list === 'ordered' ? '1.' : '-';
      output.push(`${bullet} ${text}`);
      return;
    }
    if (line.attrs.blockquote) {
      output.push(`> ${text}`);
      return;
    }
    output.push(text);
  });

  if (inCodeBlock) {
    output.push('```');
  }

  return output.join('\n');
}

function getBodyValue() {
  if (quill) {
    return quillDeltaToMarkdown(quill.getContents());
  }
  return bodyInput.value || '';
}

function setBodyValue(value) {
  const nextValue = value || '';
  bodyInput.value = nextValue;
  if (!quill) return;
  suppressQuillChange = true;
  if (!nextValue) {
    quill.setText('');
    suppressQuillChange = false;
    return;
  }
  const html = renderMarkdown(nextValue);
  quill.clipboard.dangerouslyPasteHTML(html);
  suppressQuillChange = false;
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
  updateViewOnBlogButton();
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
  const body = draft.body || '';
  if (!draft.title && !body) {
    previewPane.textContent = '작성된 내용이 없습니다.';
    return;
  }
  const markdown = `# ${draft.title || '제목 없음'}\n\n${body || '본문을 입력하면 미리보기가 표시됩니다.'}`;
  previewPane.innerHTML = renderMarkdown(markdown);
  previewStatus.textContent = '실시간';
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeLink(url) {
  if (!url) return '#';
  const trimmed = url.trim();
  if (/^(https?:|mailto:|#|\/|data:image\/)/i.test(trimmed)) return trimmed;
  return '#';
}

function applyInlineMarkdown(text) {
  let output = text;
  output = output.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
    const safeUrl = sanitizeLink(url);
    return `<img src="${safeUrl}" alt="${alt}" />`;
  });
  output = output.replace(/`([^`]+)`/g, '<code>$1</code>');
  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const safeUrl = sanitizeLink(url);
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  return output;
}

function renderMarkdown(markdown) {
  if (!markdown) return '';
  const lines = escapeHtml(markdown).split('\n');
  let html = '';
  let inCode = false;
  let codeBuffer = [];
  let listBuffer = [];
  let orderedListBuffer = [];
  let paragraphBuffer = [];

  const flushParagraph = () => {
    if (!paragraphBuffer.length) return;
    html += `<p>${paragraphBuffer.join('<br />')}</p>`;
    paragraphBuffer = [];
  };

  const flushList = () => {
    if (!listBuffer.length) return;
    html += `<ul>${listBuffer.map((item) => `<li>${item}</li>`).join('')}</ul>`;
    listBuffer = [];
  };

  const flushOrderedList = () => {
    if (!orderedListBuffer.length) return;
    html += `<ol>${orderedListBuffer.map((item) => `<li>${item}</li>`).join('')}</ol>`;
    orderedListBuffer = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd();
    if (line.startsWith('```')) {
      if (inCode) {
        html += `<pre><code>${codeBuffer.join('\n')}</code></pre>`;
        codeBuffer = [];
        inCode = false;
      } else {
        flushParagraph();
        flushList();
        flushOrderedList();
        inCode = true;
      }
      return;
    }

    if (inCode) {
      codeBuffer.push(rawLine);
      return;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      flushOrderedList();
      return;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      flushOrderedList();
      const level = headingMatch[1].length;
      const content = applyInlineMarkdown(headingMatch[2]);
      html += `<h${level}>${content}</h${level}>`;
      return;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)/);
    if (orderedMatch) {
      flushParagraph();
      flushList();
      orderedListBuffer.push(applyInlineMarkdown(orderedMatch[1]));
      return;
    }

    const listMatch = line.match(/^[-*]\s+(.+)/);
    if (listMatch) {
      flushParagraph();
      flushOrderedList();
      listBuffer.push(applyInlineMarkdown(listMatch[1]));
      return;
    }

    const blockquoteMatch = line.match(/^>\s+(.+)/);
    if (blockquoteMatch) {
      flushParagraph();
      flushList();
      flushOrderedList();
      html += `<blockquote>${applyInlineMarkdown(blockquoteMatch[1])}</blockquote>`;
      return;
    }

    flushList();
    flushOrderedList();
    paragraphBuffer.push(applyInlineMarkdown(line));
  });

  flushParagraph();
  flushList();
  flushOrderedList();

  if (inCode) {
    html += `<pre><code>${codeBuffer.join('\n')}</code></pre>`;
  }

  return html;
}

function schedulePreviewUpdate() {
  if (previewTimer) clearTimeout(previewTimer);
  previewStatus.textContent = '갱신 중...';
  previewTimer = setTimeout(() => {
    const title = titleInput.value || '제목 없음';
    const body = getBodyValue();
    const markdown = `# ${title}\n\n${body || '본문을 입력하면 미리보기가 표시됩니다.'}`;
    previewPane.innerHTML = renderMarkdown(markdown);
    previewStatus.textContent = '실시간';
  }, 220);
}

function persistDraft(partial) {
  currentDraft = {
    ...currentDraft,
    ...partial,
  };
  save(DRAFT_KEY, currentDraft);
  renderPreview();
  renderSelectedPostMeta();
  updateViewOnBlogButton();
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

function updateAutosaveStatus() {
  if (autosaveState.error) {
    setAutosaveState('error', `저장 실패: ${autosaveState.error}`, true);
    return;
  }
  if (autosaveState.saving) {
    setAutosaveState('saving', '저장 중...');
    return;
  }
  if (autosaveState.dirty) {
    setAutosaveState('dirty', '변경됨');
    return;
  }
  if (autosaveState.savedAt) {
    setAutosaveState('saved', `저장됨 ${formatClock(autosaveState.savedAt)}`);
    return;
  }
  setAutosaveState('idle', '대기 중');
}

function renderAutosaveSavedAt(savedAt) {
  if (!savedAt) return;
  autosaveState = {
    dirty: false,
    saving: false,
    savedAt,
    error: null,
  };
  updateAutosaveStatus();
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
    autosaveState = {
      ...autosaveState,
      saving: false,
      error: '세션 만료, 다시 로그인하세요.',
      dirty: true,
    };
    updateAutosaveStatus();
    return;
  }

  try {
    autosaveState = {
      ...autosaveState,
      saving: true,
      error: null,
    };
    updateAutosaveStatus();
    const postId = await ensurePostId(title, body);
    const saved = await apiFetch(`/cms/posts/${postId}/autosave`, {
      method: 'POST',
      body: { title, body_md: body },
    });
    const savedAt = saved?.saved_at || saved?.post?.updated_at_iso || new Date().toISOString();
    persistDraft({ id: postId, title, body, savedAt, status: saved?.post?.status });
    autosaveState = {
      dirty: false,
      saving: false,
      savedAt,
      error: null,
    };
    updateAutosaveStatus();
  } catch (error) {
    autosaveState = {
      ...autosaveState,
      saving: false,
      error: error?.status === 401 ? '세션 만료, 다시 로그인하세요.' : formatError(error),
      dirty: true,
    };
    updateAutosaveStatus();
  }
}

function handleAutosave() {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  const title = titleInput.value;
  const body = getBodyValue();
  autosaveState = {
    ...autosaveState,
    dirty: true,
    error: null,
  };
  updateAutosaveStatus();
  schedulePreviewUpdate();
  autosaveTimer = setTimeout(() => {
    saveDraftToApi(title, body);
  }, 1500);
}

titleInput.addEventListener('input', handleAutosave);
bodyInput.addEventListener('input', handleAutosave);

if (quillEditorEl) {
  initQuillEditor();
  if (quill) {
    quill.on('text-change', () => {
      if (suppressQuillChange) return;
      bodyInput.value = getBodyValue();
      handleAutosave();
    });
  }
}

manualSaveBtn.addEventListener('click', () => {
  saveDraftToApi(titleInput.value, getBodyValue());
});

retrySaveBtn.addEventListener('click', () => {
  saveDraftToApi(titleInput.value, getBodyValue());
});

clearDraftBtn.addEventListener('click', () => {
  localStorage.removeItem(DRAFT_KEY);
  currentDraft = { id: null, title: '', body: '', savedAt: null, status: null };
  titleInput.value = '';
  setBodyValue('');
  autosaveState = {
    dirty: false,
    saving: false,
    savedAt: null,
    error: null,
  };
  updateAutosaveStatus();
  renderPreview();
  renderSelectedPostMeta();
});

function normalizePost(rawPost) {
  return {
    id: rawPost?.id,
    title: rawPost?.title || '제목 없음',
    status: rawPost?.status || rawPost?.state || 'draft',
    updatedAt: rawPost?.updated_at_iso || rawPost?.updated_at || rawPost?.saved_at || null,
    publishedAt: rawPost?.published_at_iso || rawPost?.published_at || rawPost?.publishedAt || null,
    slug: rawPost?.slug || rawPost?.slug_id || rawPost?.slugId || null,
    publicUrl: rawPost?.public_url || rawPost?.publicUrl || null,
    body: rawPost?.body_md || rawPost?.body || '',
  };
}

function getFilteredPosts() {
  const query = postsView.search.trim().toLowerCase();
  let list = allPosts.slice();
  if (query) {
    list = list.filter((post) => (post.title || '').toLowerCase().includes(query));
  }
  if (postsView.status !== 'all') {
    list = list.filter((post) => (post.status || 'draft') === postsView.status);
  }
  return list;
}

function renderPostsState({ message, isError = false, isLoading = false } = {}) {
  postsStatusEl.textContent = message || '';
  postsStatusEl.classList.toggle('error', Boolean(isError));
  postsListEl.innerHTML = '';

  const state = document.createElement('div');
  state.className = 'posts-state';
  if (isLoading) {
    state.innerHTML = '<span class="spinner" aria-hidden="true"></span> 불러오는 중...';
  } else {
    state.textContent = message || '';
  }
  postsListEl.appendChild(state);
}

function renderPostsPagination(totalPages) {
  postsView.totalPages = totalPages;
  postsPrevBtn.disabled = postsView.page <= 1;
  postsNextBtn.disabled = postsView.page >= totalPages;
  postsPageInfo.textContent = `페이지 ${postsView.page} / ${totalPages}`;
}

function renderPosts() {
  postsListEl.innerHTML = '';
  const filtered = getFilteredPosts();
  let pageItems = filtered;
  let totalCount = filtered.length;
  let totalPages = 1;

  if (!postsView.serverMode) {
    totalPages = Math.max(1, Math.ceil(filtered.length / postsView.pageSize));
    postsView.page = Math.min(Math.max(1, postsView.page), totalPages);
    const start = (postsView.page - 1) * postsView.pageSize;
    pageItems = filtered.slice(start, start + postsView.pageSize);
    totalCount = filtered.length;
  } else {
    totalCount = postsView.total || filtered.length;
    totalPages = postsView.totalPages || Math.max(1, Math.ceil(totalCount / postsView.pageSize));
  }

  if (!pageItems.length) {
    renderPostsState({
      message: '게시물이 없습니다. 새 글을 작성하세요.',
    });
    renderPostsPagination(totalPages);
    return;
  }

  postsStatusEl.textContent = postsView.serverMode && postsView.status === 'all' && !postsView.search
    ? `${totalCount}건의 게시글`
    : `${pageItems.length}건 표시 중`;

  pageItems.forEach((post) => {
    const item = document.createElement('div');
    item.className = 'posts-row';
    if (currentDraft?.id === post.id) item.classList.add('active');
    item.setAttribute('role', 'row');
    item.dataset.postId = post.id;
    const updated = formatMaybeDate(post.updatedAt);
    const published = formatMaybeDate(post.publishedAt);
    const status = post.status || 'draft';
    item.innerHTML = `
      <div class="posts-cell posts-title">
        <strong>${post.title || '제목 없음'}</strong>
        <span class="posts-id muted">#${post.id || '-'}</span>
      </div>
      <div class="posts-cell">
        <span class="badge badge-${status}">${status}</span>
      </div>
      <div class="posts-cell">${updated}</div>
      <div class="posts-cell">${published}</div>
    `;
    item.addEventListener('click', () => selectPost(post));
    postsListEl.appendChild(item);
  });

  renderPostsPagination(totalPages);
}

function buildPostsQuery() {
  if (!postsView.serverMode) return '';
  const query = new URLSearchParams();
  query.set('page', postsView.page);
  query.set('pageSize', postsView.pageSize);
  return `?${query.toString()}`;
}

async function fetchPosts() {
  try {
    renderPostsState({ message: '불러오는 중...', isLoading: true });
    const data = await apiFetch(`/cms/posts${buildPostsQuery()}`);
    const hasServerPagination = Array.isArray(data?.items)
      && typeof data?.total === 'number'
      && typeof data?.page === 'number'
      && typeof data?.pageSize === 'number';

    if (hasServerPagination) {
      postsView.serverMode = true;
      postsView.page = data.page;
      postsView.pageSize = data.pageSize;
      postsView.total = data.total;
      postsView.totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
      allPosts = data.items.map(normalizePost);
    } else {
      postsView.serverMode = false;
      const posts = data?.posts || data?.data || data?.items || [];
      allPosts = posts.map(normalizePost);
      postsView.total = allPosts.length;
      postsView.totalPages = Math.max(1, Math.ceil(postsView.total / postsView.pageSize));
      postsView.page = Math.min(postsView.page, postsView.totalPages);
    }

    currentPosts = allPosts.slice();
    renderPosts();
  } catch (error) {
    renderPostsState({
      message: '세션 만료 또는 오류가 발생했습니다. 다시 로그인해 주세요.',
      isError: true,
    });
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
    slug: next.slug,
    publicUrl: next.publicUrl,
  });
  titleInput.value = next.title || '';
  setBodyValue(next.body || '');
  renderAutosaveSavedAt(currentDraft.savedAt);
  renderPosts();
}

refreshPostsBtn.addEventListener('click', () => {
  fetchPosts();
});

postsSearchInput.addEventListener('input', (event) => {
  postsView.search = event.target.value;
  postsView.page = 1;
  renderPosts();
});

postsStatusFilter.addEventListener('change', (event) => {
  postsView.status = event.target.value;
  postsView.page = 1;
  renderPosts();
});

postsPrevBtn.addEventListener('click', () => {
  if (postsView.page <= 1) return;
  postsView.page -= 1;
  if (postsView.serverMode) {
    fetchPosts();
  } else {
    renderPosts();
  }
});

postsNextBtn.addEventListener('click', () => {
  if (postsView.page >= postsView.totalPages) return;
  postsView.page += 1;
  if (postsView.serverMode) {
    fetchPosts();
  } else {
    renderPosts();
  }
});

newPostBtn.addEventListener('click', async () => {
  if (!currentSession) {
    renderPostsState({
      message: '세션 만료 또는 오류가 발생했습니다. 다시 로그인해 주세요.',
      isError: true,
    });
    return;
  }

  try {
    renderPostsState({ message: '새 글 생성 중...', isLoading: true });
    const created = await apiFetch('/cms/posts', {
      method: 'POST',
      body: { title: '제목 없음', body_md: '' },
    });
    const newPost = normalizePost(created?.post || created);
    if (!newPost?.id) throw new Error('게시글 ID를 받을 수 없습니다.');
    allPosts = [newPost, ...allPosts.filter((post) => post.id !== newPost.id)];
    currentPosts = allPosts.slice();
    postsView.page = 1;
    renderPosts();
    selectPost(newPost);
  } catch (error) {
    renderPostsState({
      message: '세션 만료 또는 오류가 발생했습니다. 다시 로그인해 주세요.',
      isError: true,
    });
  }
});

function setViewMode(mode) {
  currentViewMode = mode;
  if (editorCard) {
    editorCard.dataset.viewMode = mode;
  }
  viewModeButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.viewMode === mode);
  });
}

viewModeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setViewMode(button.dataset.viewMode);
  });
});

function normalizeJob(rawJob, overrides = {}) {
  return {
    id: rawJob?.id || overrides.id,
    postId: rawJob?.post_id || rawJob?.postId || overrides.postId,
    tenant: currentSession?.tenant?.slug || currentSession?.tenant || '-',
    title: rawJob?.title || overrides.title || currentDraft?.title || '제목 없음',
    status: rawJob?.status || overrides.status || 'queued',
    message: rawJob?.message || overrides.message || '상태 확인 중',
    createdAt: rawJob?.created_at_iso || rawJob?.created_at || overrides.createdAt || new Date().toISOString(),
    finishedAt: rawJob?.finished_at_iso || rawJob?.finished_at || overrides.finishedAt || null,
    updatedAt: rawJob?.updated_at_iso || rawJob?.updated_at || overrides.updatedAt || new Date().toISOString(),
  };
}

function renderJobs() {
  deployJobsEl.innerHTML = '';
  const hasPostId = currentJobs.some((job) => job.postId);
  let jobsToRender = currentJobs.slice();
  if (hasPostId && currentDraft?.id) {
    jobsToRender = currentJobs.filter((job) => job.postId === currentDraft.id);
    deployJobsScope.textContent = '현재 글 기준 배포 이력';
  } else {
    deployJobsScope.textContent = '테넌트 전체 최근 배포 이력';
  }

  if (!jobsToRender.length) {
    deployJobsEl.innerHTML = '<div class="muted">배포 작업이 없습니다.</div>';
    return;
  }

  jobsToRender
    .slice(0, 10)
    .forEach((job) => {
      const item = document.createElement('div');
      item.className = 'job-item';
      const statusClass = `status-${job.status}`;
      const createdAt = formatMaybeDate(job.createdAt);
      item.innerHTML = `
        <div class="row between">
          <div>
            <div class="muted">${job.id} · 테넌트 ${job.tenant}</div>
            <div><strong>${job.title || '제목 없음'}</strong></div>
            <div class="muted">${createdAt}</div>
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
    deployJobsScope.textContent = '배포 이력 로드 실패';
    deployJobsEl.innerHTML = `<div class="muted error">${formatError(error)}</div>`;
    jobDetailEl.textContent = formatError(error);
  }
}

async function selectJob(job) {
  if (!job?.id) return;
  try {
    const data = await apiFetch(`/cms/deploy-jobs/${job.id}`);
    const detail = data?.job || data || job;
    const normalized = normalizeJob(detail, { id: job.id });
    const startedAt = formatMaybeDate(normalized.createdAt);
    const finishedAt = formatMaybeDate(normalized.finishedAt);
    jobDetailEl.innerHTML = `
      <div><strong>${normalized.title}</strong></div>
      <div class="muted">상태: ${normalized.status}</div>
      <div class="muted">메시지: ${normalized.message}</div>
      <div class="muted">시작: ${startedAt}</div>
      <div class="muted">완료: ${finishedAt}</div>
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
        fetchDeployJobs();
      } else if (status === 'failed') {
        setStatus(publishMessage, job.message || '배포 실패', true);
        fetchDeployJobs();
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

function resolveBlogBaseUrl() {
  const tenant = currentSession?.tenant || {};
  const candidates = [
    tenant.blog_base_url,
    tenant.site_base_url,
    tenant.public_base_url,
    tenant.blogBaseUrl,
    tenant.siteBaseUrl,
    tenant.publicBaseUrl,
    currentSession?.blog_base_url,
    currentSession?.site_base_url,
    currentSession?.public_base_url,
    currentSession?.blogBaseUrl,
    currentSession?.siteBaseUrl,
    currentSession?.publicBaseUrl,
  ];
  return candidates.find((value) => typeof value === 'string' && value.trim().length > 0) || null;
}

function buildViewOnBlogUrl() {
  if (currentDraft?.publicUrl) {
    return currentDraft.publicUrl;
  }
  const base = resolveBlogBaseUrl();
  const slug = currentDraft?.slug;
  if (!base || !slug) return null;
  return `${base.replace(/\/$/, '')}/${slug.replace(/^\//, '')}`;
}

function updateViewOnBlogButton() {
  if (!viewOnBlogBtn || !viewOnBlogHint) return;
  const url = buildViewOnBlogUrl();
  if (!url) {
    viewOnBlogBtn.disabled = true;
    viewOnBlogBtn.dataset.url = '';
    viewOnBlogBtn.title = '블로그 도메인 정보를 확인할 수 없습니다.';
    viewOnBlogHint.textContent = '블로그 도메인 정보가 설정되지 않아 링크를 만들 수 없습니다.';
    return;
  }
  viewOnBlogBtn.disabled = false;
  viewOnBlogBtn.dataset.url = url;
  viewOnBlogBtn.title = '블로그에서 게시글 열기';
  viewOnBlogHint.textContent = '';
}

if (viewOnBlogBtn) {
  viewOnBlogBtn.addEventListener('click', () => {
    const url = viewOnBlogBtn.dataset.url;
    if (!url) return;
    window.open(url, '_blank', 'noopener');
  });
}

publishBtn.addEventListener('click', async () => {
  if (!currentSession) {
    setStatus(publishMessage, '로그인 세션이 없습니다. 먼저 로그인하세요.', true);
    return;
  }

  const title = titleInput.value.trim() || '제목 없음';
  const body = getBodyValue();

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
  setBodyValue(currentDraft.body || '');
  renderAutosaveSavedAt(currentDraft.savedAt);
  renderPreview();
  renderSelectedPostMeta();
  updateJobs(currentJobs);
  setViewMode(currentViewMode);
  updateViewOnBlogButton();
}

hydrateFromStorage();
fetchSession();
fetchPosts();
fetchDeployJobs();

window.addEventListener('beforeunload', (event) => {
  if (!autosaveState.dirty) return;
  event.preventDefault();
  event.returnValue = '';
});
