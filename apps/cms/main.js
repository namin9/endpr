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
const shareLinkBtn = document.getElementById('shareLinkBtn');
const revokeShareBtn = document.getElementById('revokeShareBtn');
const shareLinkStatus = document.getElementById('shareLinkStatus');
const shareLinkValue = document.getElementById('shareLinkValue');
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
const categoryForm = document.getElementById('categoryForm');
const categoryNameInput = document.getElementById('categoryNameInput');
const categorySlugInput = document.getElementById('categorySlugInput');
const categoriesStatus = document.getElementById('categoriesStatus');
const categoriesList = document.getElementById('categoriesList');
const refreshCategoriesBtn = document.getElementById('refreshCategoriesBtn');
const themeStatus = document.getElementById('themeStatus');
const themeCurrent = document.getElementById('themeCurrent');
const themePresetList = document.getElementById('themePresetList');
const themeSaveBtn = document.getElementById('themeSaveBtn');
const themeSaveStatus = document.getElementById('themeSaveStatus');
const refreshThemeBtn = document.getElementById('refreshThemeBtn');
const tenantsStatus = document.getElementById('tenantsStatus');
const tenantsList = document.getElementById('tenantsList');
const refreshTenantsBtn = document.getElementById('refreshTenantsBtn');
const tenantForm = document.getElementById('tenantForm');
const tenantSlugInput = document.getElementById('tenantSlugInput');
const tenantNameInput = document.getElementById('tenantNameInput');
const tenantDomainInput = document.getElementById('tenantDomainInput');
const tenantPagesProjectInput = document.getElementById('tenantPagesProjectInput');
const tenantDeployHookInput = document.getElementById('tenantDeployHookInput');
const tenantBuildTokenInput = document.getElementById('tenantBuildTokenInput');
const tenantFormStatus = document.getElementById('tenantFormStatus');
const tenantResetBtn = document.getElementById('tenantResetBtn');
const usersStatus = document.getElementById('usersStatus');
const usersList = document.getElementById('usersList');
const refreshUsersBtn = document.getElementById('refreshUsersBtn');
const usersTenantSelect = document.getElementById('usersTenantSelect');
const userForm = document.getElementById('userForm');
const userEmailInput = document.getElementById('userEmailInput');
const userRoleInput = document.getElementById('userRoleInput');
const userPasswordInput = document.getElementById('userPasswordInput');
const userFormStatus = document.getElementById('userFormStatus');
const userResetBtn = document.getElementById('userResetBtn');
const tabButtons = Array.from(document.querySelectorAll('[data-tab-target]'));
const tabPanels = Array.from(document.querySelectorAll('[data-tab-panel]'));
const adminTabButton = document.querySelector('[data-admin-tab]');
const adminTabPanel = document.querySelector('[data-admin-panel]');
const prCampaignForm = document.getElementById('prCampaignForm');
const prCampaignNameInput = document.getElementById('prCampaignNameInput');
const prCampaignStatusInput = document.getElementById('prCampaignStatusInput');
const prCampaignScheduledInput = document.getElementById('prCampaignScheduledInput');
const prCampaignDescriptionInput = document.getElementById('prCampaignDescriptionInput');
const prCampaignStatus = document.getElementById('prCampaignStatus');
const prCampaignList = document.getElementById('prCampaignList');
const refreshPrCampaignsBtn = document.getElementById('refreshPrCampaignsBtn');
const prSelectedCampaign = document.getElementById('prSelectedCampaign');
const prMentionForm = document.getElementById('prMentionForm');
const prMentionOutletInput = document.getElementById('prMentionOutletInput');
const prMentionUrlInput = document.getElementById('prMentionUrlInput');
const prMentionPublishedInput = document.getElementById('prMentionPublishedInput');
const prMentionMemoInput = document.getElementById('prMentionMemoInput');
const prMentionsStatus = document.getElementById('prMentionsStatus');
const prMentionsList = document.getElementById('prMentionsList');
const prReportForm = document.getElementById('prReportForm');
const prReportPeriodStartInput = document.getElementById('prReportPeriodStartInput');
const prReportPeriodEndInput = document.getElementById('prReportPeriodEndInput');
const prReportHighlightsInput = document.getElementById('prReportHighlightsInput');
const prReportsStatus = document.getElementById('prReportsStatus');
const prReportsList = document.getElementById('prReportsList');
const clearPrSelectionBtn = document.getElementById('clearPrSelectionBtn');

let autosaveTimer = null;
let previewTimer = null;
let currentDraft = load(DRAFT_KEY, { id: null, title: '', body: '', savedAt: null, status: null });
let currentSession = load(SESSION_KEY, null);
let currentPosts = [];
let allPosts = [];
let currentJobs = load(JOB_KEY, []);
let currentCategories = [];
let currentPrCampaigns = [];
let currentPrMentions = [];
let currentPrReports = [];
let selectedPrCampaignId = null;
let themePresets = [];
let currentThemeConfig = { presetId: 'minimal-clean', updatedAt: null };
let selectedThemePresetId = null;
let currentThemeTokens = null;
let themeIsSuperAdmin = false;
let currentTenants = [];
let currentUsers = [];
let selectedTenantId = null;
let activeTabId = 'content';
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

function formatDatetimeLocal(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const pad = (num) => String(num).padStart(2, '0');
  const year = parsed.getFullYear();
  const month = pad(parsed.getMonth() + 1);
  const day = pad(parsed.getDate());
  const hours = pad(parsed.getHours());
  const minutes = pad(parsed.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function resolveIsSuperAdmin(session) {
  const user = session?.user || {};
  if (typeof user.is_super_admin === 'boolean') return user.is_super_admin;
  if (typeof user.isSuperAdmin === 'boolean') return user.isSuperAdmin;
  if (user.role) return user.role === 'super';
  return false;
}

function setActiveTab(tabId) {
  activeTabId = tabId;
  tabButtons.forEach((button) => {
    const target = button.dataset.tabTarget;
    const isActive = target === tabId;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    button.setAttribute('tabindex', isActive ? '0' : '-1');
  });
  tabPanels.forEach((panel) => {
    const panelId = panel.dataset.tabPanel;
    panel.classList.toggle('is-active', panelId === tabId);
  });
}

function toggleFormDisabled(form, disabled) {
  if (!form) return;
  const elements = Array.from(form.elements || []);
  elements.forEach((element) => {
    element.disabled = disabled;
  });
}

function applyAdminUiState(isSuperAdmin) {
  if (refreshTenantsBtn) refreshTenantsBtn.disabled = !isSuperAdmin;
  if (refreshUsersBtn) refreshUsersBtn.disabled = !isSuperAdmin;
  if (usersTenantSelect) usersTenantSelect.disabled = !isSuperAdmin;
  if (tenantResetBtn) tenantResetBtn.disabled = !isSuperAdmin;
  if (userResetBtn) userResetBtn.disabled = !isSuperAdmin;
  toggleFormDisabled(tenantForm, !isSuperAdmin);
  toggleFormDisabled(userForm, !isSuperAdmin);
  if (adminTabButton) {
    adminTabButton.style.display = isSuperAdmin ? '' : 'none';
  }
  if (adminTabPanel) {
    adminTabPanel.style.display = isSuperAdmin ? '' : 'none';
  }

  if (!isSuperAdmin) {
    if (tenantsStatus) setStatus(tenantsStatus, '슈퍼 관리자만 접근할 수 있습니다.', true);
    if (usersStatus) setStatus(usersStatus, '슈퍼 관리자만 접근할 수 있습니다.', true);
    if (tenantFormStatus) setStatus(tenantFormStatus, '읽기 전용', true);
    if (userFormStatus) setStatus(userFormStatus, '읽기 전용', true);
    if (activeTabId === 'admin') {
      setActiveTab('content');
    }
  } else {
    if (tenantFormStatus) setStatus(tenantFormStatus, '');
    if (userFormStatus) setStatus(userFormStatus, '');
  }
}

function buildThemeStyle(tokens, scopeSelector) {
  if (!tokens) return '';
  const toCss = (vars) =>
    Object.entries(vars)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n');
  return `${scopeSelector} {\n${toCss(tokens.light)}\n}\n@media (prefers-color-scheme: dark) {\n  ${scopeSelector} {\n${toCss(
    tokens.dark
  )}\n  }\n}\n${scopeSelector} {\n  background: var(--bg);\n  color: var(--fg);\n  font-family: var(--font-sans);\n  border: 1px solid var(--border);\n  border-radius: var(--radius);\n}\n${scopeSelector} a {\n  color: var(--link);\n}\n${scopeSelector} hr {\n  border-color: var(--border);\n}\n${scopeSelector} .card, ${scopeSelector} .border {\n  border-color: var(--border);\n  border-radius: var(--radius);\n}`;
}

function applyPreviewTheme(tokens) {
  currentThemeTokens = tokens;
  const styleId = 'theme-tokens-preview';
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = buildThemeStyle(tokens, '.preview-scope');
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

    const uploadImage = async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(buildUrl('/cms/uploads'), {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok || !data?.url) {
        const message = data?.error || `Upload failed (${response.status})`;
        throw new Error(message);
      }
      return data.url;
    };

    toolbar.addHandler('image', () => {
      imageInput.value = '';
      imageInput.click();
    });

    imageInput.addEventListener('change', async () => {
      const file = imageInput.files && imageInput.files[0];
      if (!file) return;
      try {
        const url = await uploadImage(file);
        const range = quill.getSelection(true);
        const index = range ? range.index : quill.getLength();
        quill.insertEmbed(index, 'image', url, 'user');
        quill.setSelection(index + 1, 0);
      } catch (error) {
        console.error('Image upload failed', error);
        setStatus(autosaveStatus, `이미지 업로드 실패: ${error?.message || '다시 시도해 주세요.'}`, true);
      }
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

function isHtmlContent(value) {
  return /<\/?[a-z][\s\S]*>/i.test(value || '');
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
  const html = isHtmlContent(nextValue) ? nextValue : renderMarkdown(nextValue);
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
  themeIsSuperAdmin = resolveIsSuperAdmin(session);
  applyAdminUiState(themeIsSuperAdmin);
  renderSession();
  updateViewOnBlogButton();
  renderThemeCurrent();
  renderThemePresets();
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
    await Promise.all([fetchThemeConfig(), fetchThemePresets(), fetchThemeTokens()]);
    if (themeIsSuperAdmin) {
      await fetchTenants();
      await fetchUsers();
    } else {
      currentTenants = [];
      currentUsers = [];
      selectedTenantId = null;
      renderTenantSelect();
      renderTenants();
      renderUsers();
    }
  } catch (error) {
    currentSession = null;
    themeIsSuperAdmin = false;
    applyAdminUiState(false);
    currentTenants = [];
    currentUsers = [];
    selectedTenantId = null;
    renderTenantSelect();
    renderTenants();
    renderUsers();
    localStorage.removeItem(SESSION_KEY);
    setStatus(sessionStatus, error.status === 401 ? '로그인이 필요합니다.' : formatError(error), true);
  }
}

if (loginForm) {
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
      await Promise.all([fetchPosts(), fetchDeployJobs(), fetchCategories(), fetchPrCampaigns()]);
      publishMessage.textContent = '';
    } catch (error) {
      setStatus(sessionStatus, formatError(error), true);
    }
  });
}

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  currentSession = null;
  themeIsSuperAdmin = false;
  currentTenants = [];
  currentUsers = [];
  selectedTenantId = null;
  applyAdminUiState(false);
  renderTenantSelect();
  renderTenants();
  renderUsers();
  renderSession();
  renderThemeCurrent();
  renderThemePresets();
});

function renderPreview() {
  const draft = currentDraft || { title: '', body: '' };
  const body = draft.body || '';
  if (!draft.title && !body) {
    previewPane.innerHTML = '<div class="preview-scope muted">작성된 내용이 없습니다.</div>';
    return;
  }
  const hasHtml = isHtmlContent(body);
  let content = '';
  if (hasHtml) {
    content = body;
  } else {
    const markdown = `# ${draft.title || '제목 없음'}\n\n${body || '본문을 입력하면 미리보기가 표시됩니다.'}`;
    content = renderMarkdown(markdown);
  }
  previewPane.innerHTML = `<div class="preview-scope">${content}</div>`;
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
    const hasHtml = isHtmlContent(body);
    if (hasHtml) {
      previewPane.innerHTML = body;
    } else {
      const markdown = `# ${title}\n\n${body || '본문을 입력하면 미리보기가 표시됩니다.'}`;
      previewPane.innerHTML = renderMarkdown(markdown);
    }
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

function normalizeCategory(rawCategory) {
  return {
    id: rawCategory?.id,
    slug: rawCategory?.slug,
    name: rawCategory?.name || rawCategory?.slug || '이름 없음',
    enabled: rawCategory?.enabled === 1 || rawCategory?.enabled === true,
    orderIndex: rawCategory?.order_index ?? rawCategory?.orderIndex ?? 0,
  };
}

function normalizeTenant(rawTenant) {
  return {
    id: rawTenant?.id,
    slug: rawTenant?.slug || '',
    name: rawTenant?.name || rawTenant?.slug || '이름 없음',
    primaryDomain: rawTenant?.primary_domain || '',
    pagesProjectName: rawTenant?.pages_project_name || '',
    pagesDeployHookUrl: rawTenant?.pages_deploy_hook_url || '',
    buildToken: rawTenant?.build_token || '',
    createdAt: rawTenant?.created_at || null,
  };
}

function normalizeUser(rawUser) {
  return {
    id: rawUser?.id,
    tenantId: rawUser?.tenant_id || '',
    email: rawUser?.email || '',
    role: rawUser?.role || 'editor',
  };
}

function renderCategories() {
  categoriesList.innerHTML = '';
  if (!currentCategories.length) {
    categoriesStatus.textContent = '카테고리가 없습니다.';
    return;
  }
  categoriesStatus.textContent = `${currentCategories.length}개 카테고리`;
  currentCategories.forEach((category) => {
    const item = document.createElement('div');
    item.className = 'category-item';
    item.innerHTML = `
      <div>
        <strong>${category.name}</strong>
        <div class="muted">${category.slug || '-'}</div>
      </div>
      <button type="button" class="ghost" data-category-id="${category.id}">
        ${category.enabled ? '비활성' : '활성'}
      </button>
    `;
    const button = item.querySelector('button');
    button.addEventListener('click', async () => {
      try {
        button.disabled = true;
        await apiFetch(`/cms/categories/${category.id}`, {
          method: 'PATCH',
          body: { enabled: !category.enabled },
        });
        await fetchCategories();
      } catch (error) {
        setStatus(categoriesStatus, formatError(error), true);
      } finally {
        button.disabled = false;
      }
    });
    categoriesList.appendChild(item);
  });
}

async function fetchCategories() {
  if (!categoriesStatus) return;
  try {
    setStatus(categoriesStatus, '불러오는 중...');
    const data = await apiFetch('/cms/categories');
    const categories = data?.categories || [];
    currentCategories = categories.map(normalizeCategory);
    renderCategories();
  } catch (error) {
    setStatus(categoriesStatus, formatError(error), true);
  }
}

function resetTenantForm() {
  if (!tenantForm) return;
  tenantForm.dataset.editingId = '';
  tenantSlugInput.value = '';
  tenantNameInput.value = '';
  tenantDomainInput.value = '';
  tenantPagesProjectInput.value = '';
  tenantDeployHookInput.value = '';
  tenantBuildTokenInput.value = '';
  if (tenantFormStatus) setStatus(tenantFormStatus, '');
}

function resetUserForm() {
  if (!userForm) return;
  userForm.dataset.editingId = '';
  userEmailInput.value = '';
  userPasswordInput.value = '';
  userRoleInput.value = 'editor';
  if (userFormStatus) setStatus(userFormStatus, '');
}

function renderTenantSelect() {
  if (!usersTenantSelect) return;
  usersTenantSelect.innerHTML = '';
  if (!currentTenants.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = '테넌트 없음';
    usersTenantSelect.appendChild(option);
    usersTenantSelect.disabled = true;
    return;
  }
  currentTenants.forEach((tenant) => {
    const option = document.createElement('option');
    option.value = tenant.id;
    option.textContent = `${tenant.name} (${tenant.slug})`;
    usersTenantSelect.appendChild(option);
  });
  const match = currentTenants.find((tenant) => tenant.id === selectedTenantId);
  usersTenantSelect.value = match ? selectedTenantId : currentTenants[0].id;
}

function renderTenants() {
  if (!tenantsList || !tenantsStatus) return;
  tenantsList.innerHTML = '';
  if (!currentTenants.length) {
    tenantsStatus.textContent = '테넌트가 없습니다.';
    return;
  }
  tenantsStatus.textContent = `${currentTenants.length}개 테넌트`;
  currentTenants.forEach((tenant) => {
    const item = document.createElement('div');
    item.className = 'category-item';
    const createdLabel = tenant.createdAt ? formatMaybeDate(new Date(tenant.createdAt * 1000).toISOString()) : '-';
    item.innerHTML = `
      <div>
        <strong>${tenant.name}</strong>
        <div class="muted">${tenant.slug} · ${tenant.primaryDomain || '-'}</div>
        <div class="muted">생성: ${createdLabel}</div>
      </div>
      <div class="row gap">
        <button type="button" class="ghost" data-tenant-edit="${tenant.id}">편집</button>
        <button type="button" class="ghost" data-tenant-select="${tenant.id}">선택</button>
      </div>
    `;
    const editBtn = item.querySelector('[data-tenant-edit]');
    const selectBtn = item.querySelector('[data-tenant-select]');
    editBtn.disabled = !themeIsSuperAdmin;
    selectBtn.disabled = !themeIsSuperAdmin;
    editBtn.addEventListener('click', () => {
      if (!themeIsSuperAdmin) return;
      tenantForm.dataset.editingId = tenant.id;
      tenantSlugInput.value = tenant.slug || '';
      tenantNameInput.value = tenant.name || '';
      tenantDomainInput.value = tenant.primaryDomain || '';
      tenantPagesProjectInput.value = tenant.pagesProjectName || '';
      tenantDeployHookInput.value = tenant.pagesDeployHookUrl || '';
      tenantBuildTokenInput.value = tenant.buildToken || '';
      setStatus(tenantFormStatus, `편집 중: ${tenant.name}`);
    });
    selectBtn.addEventListener('click', async () => {
      if (!themeIsSuperAdmin) return;
      selectedTenantId = tenant.id;
      renderTenantSelect();
      await fetchUsers();
    });
    tenantsList.appendChild(item);
  });
}

function renderUsers() {
  if (!usersList || !usersStatus) return;
  usersList.innerHTML = '';
  if (!selectedTenantId) {
    usersStatus.textContent = '테넌트를 선택하세요.';
    return;
  }
  if (!currentUsers.length) {
    usersStatus.textContent = '유저가 없습니다.';
    return;
  }
  usersStatus.textContent = `${currentUsers.length}명 유저`;
  currentUsers.forEach((user) => {
    const item = document.createElement('div');
    item.className = 'category-item';
    item.innerHTML = `
      <div>
        <strong>${user.email || '-'}</strong>
        <div class="muted">권한: ${user.role}</div>
      </div>
      <button type="button" class="ghost" data-user-edit="${user.id}">편집</button>
    `;
    const editBtn = item.querySelector('[data-user-edit]');
    editBtn.disabled = !themeIsSuperAdmin;
    editBtn.addEventListener('click', () => {
      if (!themeIsSuperAdmin) return;
      userForm.dataset.editingId = user.id;
      userEmailInput.value = user.email || '';
      userRoleInput.value = user.role || 'editor';
      userPasswordInput.value = '';
      setStatus(userFormStatus, `편집 중: ${user.email}`);
    });
    usersList.appendChild(item);
  });
}

async function fetchTenants() {
  if (!tenantsStatus) return;
  try {
    setStatus(tenantsStatus, '불러오는 중...');
    const data = await apiFetch('/cms/tenants');
    const tenants = data?.tenants || [];
    currentTenants = tenants.map(normalizeTenant);
    if (!selectedTenantId && currentTenants.length) {
      selectedTenantId = currentTenants[0].id;
    }
    renderTenantSelect();
    renderTenants();
  } catch (error) {
    setStatus(tenantsStatus, formatError(error), true);
  }
}

async function fetchUsers() {
  if (!usersStatus) return;
  if (!selectedTenantId) {
    currentUsers = [];
    renderUsers();
    return;
  }
  try {
    setStatus(usersStatus, '불러오는 중...');
    const data = await apiFetch(`/cms/users?tenant_id=${selectedTenantId}`);
    const users = data?.users || [];
    currentUsers = users.map(normalizeUser);
    renderUsers();
  } catch (error) {
    setStatus(usersStatus, formatError(error), true);
  }
}

function renderThemePresets() {
  if (!themePresetList || !themeStatus) return;
  themePresetList.innerHTML = '';
  if (!themePresets.length) {
    themeStatus.textContent = '프리셋이 없습니다.';
    return;
  }
  themeStatus.textContent = `${themePresets.length}개 프리셋`;
  themePresets.forEach((preset) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-card';
    if (preset.id === selectedThemePresetId) {
      button.classList.add('is-selected');
    }
    button.disabled = !themeIsSuperAdmin;
    button.innerHTML = `
      <div class="swatch" style="background:${preset.swatch.bg}; border-color:${preset.swatch.primary}"></div>
      <strong>${preset.name}</strong>
      <span class="muted">${preset.id}</span>
    `;
    button.addEventListener('click', () => {
      if (!themeIsSuperAdmin) return;
      selectedThemePresetId = preset.id;
      renderThemePresets();
    });
    themePresetList.appendChild(button);
  });
}

function renderThemeCurrent() {
  if (!themeCurrent) return;
  const preset = themePresets.find((item) => item.id === currentThemeConfig.presetId);
  const label = preset ? `${preset.name} (${preset.id})` : currentThemeConfig.presetId;
  themeCurrent.textContent = `현재 테마: ${label}`;
  if (themeSaveBtn) {
    themeSaveBtn.disabled = !themeIsSuperAdmin;
  }
  if (themeSaveStatus) {
    themeSaveStatus.textContent = themeIsSuperAdmin ? '' : '읽기 전용';
  }
}

async function fetchThemePresets() {
  if (!themeStatus) return;
  try {
    setStatus(themeStatus, '불러오는 중...');
    const data = await apiFetch('/cms/theme/presets');
    themePresets = data?.presets || [];
    if (!selectedThemePresetId && currentThemeConfig.presetId) {
      selectedThemePresetId = currentThemeConfig.presetId;
    }
    renderThemePresets();
    renderThemeCurrent();
  } catch (error) {
    setStatus(themeStatus, formatError(error), true);
  }
}

async function fetchThemeConfig() {
  try {
    const data = await apiFetch('/cms/theme');
    currentThemeConfig = {
      presetId: data?.preset_id || 'minimal-clean',
      updatedAt: data?.updated_at || null,
    };
    if (!selectedThemePresetId) {
      selectedThemePresetId = currentThemeConfig.presetId;
    }
    renderThemeCurrent();
  } catch (error) {
    if (themeStatus) setStatus(themeStatus, formatError(error), true);
  }
}

async function fetchThemeTokens() {
  try {
    const data = await apiFetch('/cms/theme/tokens');
    if (data?.tokens) {
      applyPreviewTheme(data.tokens);
    }
  } catch (error) {
    if (themeStatus) setStatus(themeStatus, formatError(error), true);
  }
}

function normalizePrCampaign(rawCampaign) {
  const scheduledValue = rawCampaign?.scheduled_at_iso || rawCampaign?.scheduled_at || null;
  const scheduledAt =
    typeof scheduledValue === 'number' ? new Date(scheduledValue * 1000).toISOString() : scheduledValue;
  return {
    id: rawCampaign?.id,
    name: rawCampaign?.name || '이름 없음',
    status: rawCampaign?.status || 'draft',
    scheduledAt,
    description: rawCampaign?.description || '',
  };
}

function normalizePrMention(rawMention) {
  const publishedValue = rawMention?.published_at_iso || rawMention?.published_at || null;
  const publishedAt =
    typeof publishedValue === 'number' ? new Date(publishedValue * 1000).toISOString() : publishedValue;
  return {
    id: rawMention?.id,
    outletName: rawMention?.outlet_name || rawMention?.outletName || '매체명 없음',
    url: rawMention?.url || '',
    publishedAt,
    memo: rawMention?.memo || '',
  };
}

function normalizePrReport(rawReport) {
  return {
    id: rawReport?.id,
    periodStart: rawReport?.period_start || rawReport?.periodStart || '',
    periodEnd: rawReport?.period_end || rawReport?.periodEnd || '',
    highlights: rawReport?.highlights || '',
  };
}

function renderPrCampaigns() {
  if (!prCampaignList || !prCampaignStatus) return;
  prCampaignList.innerHTML = '';
  if (!currentPrCampaigns.length) {
    prCampaignStatus.textContent = '캠페인이 없습니다.';
    return;
  }
  prCampaignStatus.textContent = `${currentPrCampaigns.length}개 캠페인`;
  currentPrCampaigns.forEach((campaign) => {
    const item = document.createElement('div');
    item.className = 'category-item';
    const scheduledLabel = campaign.scheduledAt ? formatMaybeDate(campaign.scheduledAt) : '-';
    item.innerHTML = `
      <div>
        <strong>${campaign.name}</strong>
        <div class="muted">${campaign.status} · 예약: ${scheduledLabel}</div>
      </div>
      <div class="row gap">
        <button type="button" class="ghost" data-pr-select="${campaign.id}">선택</button>
        <button type="button" class="ghost" data-pr-delete="${campaign.id}">삭제</button>
      </div>
    `;
    const selectBtn = item.querySelector('[data-pr-select]');
    const deleteBtn = item.querySelector('[data-pr-delete]');
    selectBtn.addEventListener('click', async () => {
      await selectPrCampaign(campaign.id);
    });
    deleteBtn.addEventListener('click', async () => {
      try {
        deleteBtn.disabled = true;
        await apiFetch(`/cms/pr-campaigns/${campaign.id}`, { method: 'DELETE' });
        if (selectedPrCampaignId === campaign.id) {
          selectedPrCampaignId = null;
          currentPrMentions = [];
          currentPrReports = [];
          if (prCampaignForm) {
            prCampaignForm.dataset.editingId = '';
          }
          prCampaignNameInput.value = '';
          prCampaignDescriptionInput.value = '';
          prCampaignScheduledInput.value = '';
          prCampaignStatusInput.value = 'draft';
          renderSelectedPrCampaign();
          renderPrMentions();
          renderPrReports();
        }
        await fetchPrCampaigns();
      } catch (error) {
        setStatus(prCampaignStatus, formatError(error), true);
      } finally {
        deleteBtn.disabled = false;
      }
    });
    prCampaignList.appendChild(item);
  });
}

function renderSelectedPrCampaign() {
  if (!prSelectedCampaign) return;
  if (!selectedPrCampaignId) {
    prSelectedCampaign.textContent = '선택된 캠페인이 없습니다.';
    if (prCampaignForm) {
      prCampaignForm.dataset.editingId = '';
    }
    return;
  }
  const campaign = currentPrCampaigns.find((item) => item.id === selectedPrCampaignId);
  if (!campaign) {
    prSelectedCampaign.textContent = '선택된 캠페인이 없습니다.';
    if (prCampaignForm) {
      prCampaignForm.dataset.editingId = '';
    }
    return;
  }
  const scheduledLabel = campaign.scheduledAt ? formatMaybeDate(campaign.scheduledAt) : '-';
  prSelectedCampaign.innerHTML = `
    <strong>${campaign.name}</strong><br />
    상태: ${campaign.status} · 예약: ${scheduledLabel}
  `;
}

function renderPrMentions() {
  if (!prMentionsList || !prMentionsStatus) return;
  prMentionsList.innerHTML = '';
  if (!selectedPrCampaignId) {
    prMentionsStatus.textContent = '캠페인을 선택하세요.';
    return;
  }
  if (!currentPrMentions.length) {
    prMentionsStatus.textContent = '멘션이 없습니다.';
    return;
  }
  prMentionsStatus.textContent = `${currentPrMentions.length}개 멘션`;
  currentPrMentions.forEach((mention) => {
    const item = document.createElement('div');
    item.className = 'category-item';
    const publishedLabel = mention.publishedAt ? formatMaybeDate(mention.publishedAt) : '-';
    item.innerHTML = `
      <div>
        <strong>${mention.outletName}</strong>
        <div class="muted">${publishedLabel}</div>
        <div class="muted">${mention.url}</div>
        ${mention.memo ? `<div class="muted">${mention.memo}</div>` : ''}
      </div>
      <button type="button" class="ghost" data-pr-mention-delete="${mention.id}">삭제</button>
    `;
    const deleteBtn = item.querySelector('[data-pr-mention-delete]');
    deleteBtn.addEventListener('click', async () => {
      try {
        deleteBtn.disabled = true;
        await apiFetch(`/cms/pr-mentions/${mention.id}`, { method: 'DELETE' });
        await fetchPrMentions();
      } catch (error) {
        setStatus(prMentionsStatus, formatError(error), true);
      } finally {
        deleteBtn.disabled = false;
      }
    });
    prMentionsList.appendChild(item);
  });
}

function renderPrReports() {
  if (!prReportsList || !prReportsStatus) return;
  prReportsList.innerHTML = '';
  if (!selectedPrCampaignId) {
    prReportsStatus.textContent = '캠페인을 선택하세요.';
    return;
  }
  if (!currentPrReports.length) {
    prReportsStatus.textContent = '리포트가 없습니다.';
    return;
  }
  prReportsStatus.textContent = `${currentPrReports.length}개 리포트`;
  currentPrReports.forEach((report) => {
    const item = document.createElement('div');
    item.className = 'category-item';
    const period = report.periodStart || report.periodEnd ? `${report.periodStart || '-'} ~ ${report.periodEnd || '-'}` : '-';
    item.innerHTML = `
      <div>
        <strong>${period}</strong>
        ${report.highlights ? `<div class="muted">${report.highlights}</div>` : ''}
      </div>
      <button type="button" class="ghost" data-pr-report-delete="${report.id}">삭제</button>
    `;
    const deleteBtn = item.querySelector('[data-pr-report-delete]');
    deleteBtn.addEventListener('click', async () => {
      try {
        deleteBtn.disabled = true;
        await apiFetch(`/cms/pr-reports/${report.id}`, { method: 'DELETE' });
        await fetchPrReports();
      } catch (error) {
        setStatus(prReportsStatus, formatError(error), true);
      } finally {
        deleteBtn.disabled = false;
      }
    });
    prReportsList.appendChild(item);
  });
}

async function fetchPrCampaigns() {
  if (!prCampaignStatus) return;
  try {
    setStatus(prCampaignStatus, '불러오는 중...');
    const data = await apiFetch('/cms/pr-campaigns');
    const campaigns = data?.campaigns || [];
    currentPrCampaigns = campaigns.map(normalizePrCampaign);
    renderPrCampaigns();
    renderSelectedPrCampaign();
  } catch (error) {
    setStatus(prCampaignStatus, formatError(error), true);
  }
}

async function fetchPrMentions() {
  if (!prMentionsStatus || !selectedPrCampaignId) {
    renderPrMentions();
    return;
  }
  try {
    setStatus(prMentionsStatus, '불러오는 중...');
    const data = await apiFetch(`/cms/pr-mentions?campaign_id=${selectedPrCampaignId}`);
    const mentions = data?.mentions || [];
    currentPrMentions = mentions.map(normalizePrMention);
    renderPrMentions();
  } catch (error) {
    setStatus(prMentionsStatus, formatError(error), true);
  }
}

async function fetchPrReports() {
  if (!prReportsStatus || !selectedPrCampaignId) {
    renderPrReports();
    return;
  }
  try {
    setStatus(prReportsStatus, '불러오는 중...');
    const data = await apiFetch(`/cms/pr-reports?campaign_id=${selectedPrCampaignId}`);
    const reports = data?.reports || [];
    currentPrReports = reports.map(normalizePrReport);
    renderPrReports();
  } catch (error) {
    setStatus(prReportsStatus, formatError(error), true);
  }
}

async function selectPrCampaign(campaignId) {
  selectedPrCampaignId = campaignId;
  const campaign = currentPrCampaigns.find((item) => item.id === campaignId);
  if (campaign) {
    prCampaignNameInput.value = campaign.name;
    prCampaignStatusInput.value = campaign.status;
    prCampaignScheduledInput.value = formatDatetimeLocal(campaign.scheduledAt);
    prCampaignDescriptionInput.value = campaign.description || '';
    prCampaignForm.dataset.editingId = campaign.id;
  }
  renderSelectedPrCampaign();
  await Promise.all([fetchPrMentions(), fetchPrReports()]);
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

function clearShareLink() {
  if (shareLinkValue) shareLinkValue.innerHTML = '';
  if (shareLinkStatus) shareLinkStatus.textContent = '';
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

if (shareLinkBtn) {
  shareLinkBtn.addEventListener('click', async () => {
    if (!currentDraft?.id) {
      setStatus(shareLinkStatus, '공유 링크를 만들 게시글을 선택하세요.', true);
      return;
    }
    try {
      setStatus(shareLinkStatus, '링크 생성 중...');
      const data = await apiFetch(`/cms/posts/${currentDraft.id}/share-link`, { method: 'POST' });
      const url = data?.url;
      if (url) {
        shareLinkValue.innerHTML = `<a href="${url}" target="_blank" rel="noopener">공유 링크 열기 →</a>`;
        const expiresAt = data?.expires_at ? formatMaybeDate(new Date(data.expires_at * 1000)) : '-';
        setStatus(shareLinkStatus, `만료: ${expiresAt}`);
      } else {
        setStatus(shareLinkStatus, '링크 생성 실패', true);
      }
    } catch (error) {
      setStatus(shareLinkStatus, formatError(error), true);
    }
  });
}

if (revokeShareBtn) {
  revokeShareBtn.addEventListener('click', async () => {
    if (!currentDraft?.id) {
      setStatus(shareLinkStatus, '공유 링크를 폐기할 게시글을 선택하세요.', true);
      return;
    }
    try {
      setStatus(shareLinkStatus, '링크 폐기 중...');
      await apiFetch(`/cms/posts/${currentDraft.id}/share-link`, { method: 'DELETE' });
      clearShareLink();
      setStatus(shareLinkStatus, '공유 링크가 폐기되었습니다.');
    } catch (error) {
      setStatus(shareLinkStatus, formatError(error), true);
    }
  });
}

if (refreshCategoriesBtn) {
  refreshCategoriesBtn.addEventListener('click', () => {
    fetchCategories();
  });
}

if (tabButtons.length) {
  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.tabTarget;
      if (!target) return;
      setActiveTab(target);
    });
  });
  setActiveTab(activeTabId);
}

if (refreshThemeBtn) {
  refreshThemeBtn.addEventListener('click', () => {
    fetchThemeConfig();
    fetchThemePresets();
    fetchThemeTokens();
  });
}

if (themeSaveBtn) {
  themeSaveBtn.addEventListener('click', async () => {
    if (!themeIsSuperAdmin) return;
    if (!selectedThemePresetId) return;
    try {
      setStatus(themeSaveStatus, '저장 중...');
      const data = await apiFetch('/cms/theme', {
        method: 'PUT',
        body: { preset_id: selectedThemePresetId },
      });
      currentThemeConfig = {
        presetId: data?.preset_id || selectedThemePresetId,
        updatedAt: data?.updated_at || Date.now(),
      };
      renderThemeCurrent();
      await fetchThemeTokens();
      setStatus(themeSaveStatus, data?.deploy_job?.id ? `배포 Job: ${data.deploy_job.id}` : '저장 완료');
    } catch (error) {
      setStatus(themeSaveStatus, formatError(error), true);
    }
  });
}

if (refreshTenantsBtn) {
  refreshTenantsBtn.addEventListener('click', () => {
    if (!themeIsSuperAdmin) return;
    fetchTenants();
  });
}

if (refreshUsersBtn) {
  refreshUsersBtn.addEventListener('click', () => {
    if (!themeIsSuperAdmin) return;
    fetchUsers();
  });
}

if (usersTenantSelect) {
  usersTenantSelect.addEventListener('change', async () => {
    if (!themeIsSuperAdmin) return;
    selectedTenantId = usersTenantSelect.value || null;
    resetUserForm();
    await fetchUsers();
  });
}

if (tenantResetBtn) {
  tenantResetBtn.addEventListener('click', () => {
    resetTenantForm();
  });
}

if (userResetBtn) {
  userResetBtn.addEventListener('click', () => {
    resetUserForm();
  });
}

if (tenantForm) {
  tenantForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!themeIsSuperAdmin) return;
    const slug = tenantSlugInput.value.trim();
    const name = tenantNameInput.value.trim();
    const primaryDomain = tenantDomainInput.value.trim();
    const pagesProjectName = tenantPagesProjectInput.value.trim();
    const pagesDeployHookUrl = tenantDeployHookInput.value.trim();
    const buildToken = tenantBuildTokenInput.value.trim();
    const editingId = tenantForm.dataset.editingId;

    if (!slug || !name || !primaryDomain || !buildToken) {
      setStatus(tenantFormStatus, '필수 항목을 입력하세요.', true);
      return;
    }

    try {
      setStatus(tenantFormStatus, editingId ? '수정 중...' : '생성 중...');
      if (editingId) {
        await apiFetch(`/cms/tenants/${editingId}`, {
          method: 'PATCH',
          body: {
            slug,
            name,
            primary_domain: primaryDomain,
            pages_project_name: pagesProjectName,
            pages_deploy_hook_url: pagesDeployHookUrl,
            build_token: buildToken,
          },
        });
      } else {
        await apiFetch('/cms/tenants', {
          method: 'POST',
          body: {
            slug,
            name,
            primary_domain: primaryDomain,
            pages_project_name: pagesProjectName,
            pages_deploy_hook_url: pagesDeployHookUrl,
            build_token: buildToken,
          },
        });
      }
      resetTenantForm();
      await fetchTenants();
      setStatus(tenantFormStatus, '저장 완료');
    } catch (error) {
      setStatus(tenantFormStatus, formatError(error), true);
    }
  });
}

if (userForm) {
  userForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!themeIsSuperAdmin) return;
    const tenantId = usersTenantSelect?.value || selectedTenantId;
    if (!tenantId) {
      setStatus(userFormStatus, '테넌트를 선택하세요.', true);
      return;
    }
    const email = userEmailInput.value.trim();
    const role = userRoleInput.value;
    const password = userPasswordInput.value.trim();
    const editingId = userForm.dataset.editingId;

    if (!email || !role) {
      setStatus(userFormStatus, '이메일과 권한을 입력하세요.', true);
      return;
    }
    if (!editingId && !password) {
      setStatus(userFormStatus, '신규 유저는 비밀번호가 필요합니다.', true);
      return;
    }

    try {
      setStatus(userFormStatus, editingId ? '수정 중...' : '생성 중...');
      if (editingId) {
        await apiFetch(`/cms/users/${editingId}`, {
          method: 'PATCH',
          body: {
            tenant_id: tenantId,
            email,
            role,
            password: password || undefined,
          },
        });
      } else {
        await apiFetch('/cms/users', {
          method: 'POST',
          body: {
            tenant_id: tenantId,
            email,
            password,
            role,
          },
        });
      }
      resetUserForm();
      await fetchUsers();
      setStatus(userFormStatus, '저장 완료');
    } catch (error) {
      setStatus(userFormStatus, formatError(error), true);
    }
  });
}

if (refreshPrCampaignsBtn) {
  refreshPrCampaignsBtn.addEventListener('click', () => {
    fetchPrCampaigns();
  });
}

if (clearPrSelectionBtn) {
  clearPrSelectionBtn.addEventListener('click', () => {
    selectedPrCampaignId = null;
    currentPrMentions = [];
    currentPrReports = [];
    if (prCampaignForm) {
      prCampaignForm.dataset.editingId = '';
    }
    prCampaignNameInput.value = '';
    prCampaignStatusInput.value = 'draft';
    prCampaignScheduledInput.value = '';
    prCampaignDescriptionInput.value = '';
    renderSelectedPrCampaign();
    renderPrMentions();
    renderPrReports();
  });
}

if (categoryForm) {
  categoryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = categoryNameInput.value.trim();
    const slug = categorySlugInput.value.trim();
    if (!name) return;
    try {
      setStatus(categoriesStatus, '추가 중...');
      await apiFetch('/cms/categories', {
        method: 'POST',
        body: { name, slug: slug || undefined },
      });
      categoryNameInput.value = '';
      categorySlugInput.value = '';
      await fetchCategories();
    } catch (error) {
      setStatus(categoriesStatus, formatError(error), true);
    }
  });
}

if (prCampaignForm) {
  prCampaignForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = prCampaignNameInput.value.trim();
    if (!name) return;
    try {
      setStatus(prCampaignStatus, '추가 중...');
      const editingId = prCampaignForm.dataset.editingId;
      const scheduledValue = prCampaignScheduledInput.value;
      const scheduledAt = scheduledValue ? Math.floor(new Date(scheduledValue).getTime() / 1000) : undefined;
      const payload = {
        name,
        status: prCampaignStatusInput.value,
        scheduled_at: scheduledAt,
        description: prCampaignDescriptionInput.value.trim() || undefined,
      };
      if (editingId) {
        await apiFetch(`/cms/pr-campaigns/${editingId}`, {
          method: 'PATCH',
          body: payload,
        });
      } else {
        await apiFetch('/cms/pr-campaigns', {
          method: 'POST',
          body: payload,
        });
      }
      prCampaignNameInput.value = '';
      prCampaignDescriptionInput.value = '';
      prCampaignScheduledInput.value = '';
      prCampaignStatusInput.value = 'draft';
      prCampaignForm.dataset.editingId = '';
      selectedPrCampaignId = null;
      currentPrMentions = [];
      currentPrReports = [];
      await fetchPrCampaigns();
      renderPrMentions();
      renderPrReports();
    } catch (error) {
      setStatus(prCampaignStatus, formatError(error), true);
    }
  });
}

if (prMentionForm) {
  prMentionForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!selectedPrCampaignId) {
      setStatus(prMentionsStatus, '캠페인을 먼저 선택하세요.', true);
      return;
    }
    const outletName = prMentionOutletInput.value.trim();
    const url = prMentionUrlInput.value.trim();
    if (!outletName || !url) return;
    try {
      setStatus(prMentionsStatus, '추가 중...');
      const publishedValue = prMentionPublishedInput.value;
      const publishedAt = publishedValue ? Math.floor(new Date(publishedValue).getTime() / 1000) : undefined;
      await apiFetch('/cms/pr-mentions', {
        method: 'POST',
        body: {
          campaign_id: selectedPrCampaignId,
          outlet_name: outletName,
          url,
          published_at: publishedAt,
          memo: prMentionMemoInput.value.trim() || undefined,
        },
      });
      prMentionOutletInput.value = '';
      prMentionUrlInput.value = '';
      prMentionPublishedInput.value = '';
      prMentionMemoInput.value = '';
      await fetchPrMentions();
    } catch (error) {
      setStatus(prMentionsStatus, formatError(error), true);
    }
  });
}

if (prReportForm) {
  prReportForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!selectedPrCampaignId) {
      setStatus(prReportsStatus, '캠페인을 먼저 선택하세요.', true);
      return;
    }
    try {
      setStatus(prReportsStatus, '저장 중...');
      await apiFetch('/cms/pr-reports', {
        method: 'POST',
        body: {
          campaign_id: selectedPrCampaignId,
          period_start: prReportPeriodStartInput.value || undefined,
          period_end: prReportPeriodEndInput.value || undefined,
          highlights: prReportHighlightsInput.value.trim() || undefined,
        },
      });
      prReportPeriodStartInput.value = '';
      prReportPeriodEndInput.value = '';
      prReportHighlightsInput.value = '';
      await fetchPrReports();
    } catch (error) {
      setStatus(prReportsStatus, formatError(error), true);
    }
  });
}

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
  clearShareLink();
}

hydrateFromStorage();
fetchSession();
fetchPosts();
fetchDeployJobs();
fetchCategories();
fetchPrCampaigns();

window.addEventListener('beforeunload', (event) => {
  if (!autosaveState.dirty) return;
  event.preventDefault();
  event.returnValue = '';
});
