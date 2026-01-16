const API_BASE = window.__API_BASE__ || window.API_BASE || 'https://endpr.ni041372.workers.dev';
const BLOG_BASE = window.__BLOG_BASE__ || window.BLOG_BASE || 'https://endpr.pages.dev';

const SESSION_KEY = 'cms-session';
const DRAFT_KEY = 'cms-draft';
const JOB_KEY = 'cms-jobs';
const ACTIVE_TENANT_KEY = 'cms-active-tenant';
const RESERVED_SLUGS = new Set([
  'posts',
  'category',
  'tag',
  'search',
  'assets',
  'api',
  'cms',
  'sitemap.xml',
  'robots.txt',
]);

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
const postsHeading = document.getElementById('posts-heading');
const postsSearchInput = document.getElementById('postsSearchInput');
const postsStatusFilter = document.getElementById('postsStatusFilter');
const postsCategoryFilter = document.getElementById('postsCategoryFilter');
const postsViewPeriod = document.getElementById('postsViewPeriod');
const postsViewSort = document.getElementById('postsViewSort');
const postsFilterButtons = Array.from(document.querySelectorAll('[data-post-filter]'));
const postsPrevBtn = document.getElementById('postsPrevBtn');
const postsNextBtn = document.getElementById('postsNextBtn');
const postsPageInfo = document.getElementById('postsPageInfo');
const postsSelectAll = document.getElementById('postsSelectAll');
const postsSelectionCount = document.getElementById('postsSelectionCount');
const bulkTrashBtn = document.getElementById('bulkTrashBtn');
const bulkUnpublishBtn = document.getElementById('bulkUnpublishBtn');
const bulkRepublishBtn = document.getElementById('bulkRepublishBtn');
const bulkPublishBtn = document.getElementById('bulkPublishBtn');
const bulkRestoreBtn = document.getElementById('bulkRestoreBtn');
const bulkDraftBtn = document.getElementById('bulkDraftBtn');
const bulkPurgeBtn = document.getElementById('bulkPurgeBtn');
const bulkDefaultActions = Array.from(document.querySelectorAll('[data-bulk-actions="default"]'));
const bulkTrashedActions = Array.from(document.querySelectorAll('[data-bulk-actions="trashed"]'));
const globalLoading = document.getElementById('globalLoading');
const globalLoadingMessage = document.getElementById('globalLoadingMessage');
const refreshJobsBtn = document.getElementById('refreshJobsBtn');
const jobDetailEl = document.getElementById('jobDetail');
const selectedPostMeta = document.getElementById('selectedPostMeta');
const printBtn = document.getElementById('printBtn');
const editorCard = document.querySelector('.editor-card');
const previewToggleBtn = document.getElementById('previewToggleBtn');
const previewCloseBtn = document.getElementById('previewCloseBtn');
const scheduleBtn = document.getElementById('scheduleBtn');
const cancelScheduleBtn = document.getElementById('cancelScheduleBtn');
const scheduleModal = document.getElementById('scheduleModal');
const scheduleCloseBtn = document.getElementById('scheduleCloseBtn');
const scheduleDateInput = document.getElementById('scheduleDateInput');
const scheduleHourSelect = document.getElementById('scheduleHourSelect');
const scheduleMinuteSelect = document.getElementById('scheduleMinuteSelect');
const scheduleStatus = document.getElementById('scheduleStatus');
const scheduleBackBtn = document.getElementById('scheduleBackBtn');
const scheduleNextBtn = document.getElementById('scheduleNextBtn');
const scheduleConfirmBtn = document.getElementById('scheduleConfirmBtn');
const previewModal = document.getElementById('previewModal');
const previewModalCloseBtn = document.getElementById('previewModalCloseBtn');
const previewModalContent = document.getElementById('previewModalContent');
const viewModeButtons = Array.from(document.querySelectorAll('[data-view-mode]'));
const viewOnBlogBtn = document.getElementById('viewOnBlogBtn');
const viewOnBlogHint = document.getElementById('viewOnBlogHint');
const editorModeToggle = document.getElementById('editorModeToggle');
const customToolbar = document.getElementById('custom-toolbar');
const toolbarButtons = customToolbar ? Array.from(customToolbar.querySelectorAll('[data-tool]')) : [];
const imageUploadInput = document.getElementById('imageUploadInput');
const markdownToolbar = document.getElementById('markdown-toolbar');
const markdownButtons = markdownToolbar ? Array.from(markdownToolbar.querySelectorAll('[data-md-action]')) : [];
const deployJobsScope = document.getElementById('deployJobsScope');
const tenantSwitcher = document.querySelector('[data-tenant-switcher]');
const tenantSwitchBtn = document.getElementById('tenantSwitchBtn');
const tenantSwitchLabel = document.getElementById('tenantSwitchLabel');
const tenantSwitchMenu = document.getElementById('tenantSwitchMenu');
const tenantSearchInput = document.getElementById('tenantSearchInput');
const tenantSwitchList = document.getElementById('tenantSwitchList');
const editorJsContainer = document.getElementById('editorjs');
const categorySelect = document.getElementById('categorySelect');
const postSlugField = document.getElementById('postSlugField');
const postSlugInput = document.getElementById('postSlugInput');
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
const marketingTabButton = document.querySelector('[data-tab-target="marketing"]');
const marketingTabPanel = document.querySelector('[data-tab-panel="marketing"]');
const siteTabButton = document.querySelector('[data-tab-target="site"]');
const siteTabPanel = document.querySelector('[data-tab-panel="site"]');
const popupsStatus = document.getElementById('popupsStatus');
const popupsList = document.getElementById('popupsList');
const refreshPopupsBtn = document.getElementById('refreshPopupsBtn');
const addPopupBtn = document.getElementById('addPopupBtn');
const popupForm = document.getElementById('popupForm');
const popupTitleInput = document.getElementById('popupTitleInput');
const popupTypeInput = document.getElementById('popupTypeInput');
const popupContentInput = document.getElementById('popupContentInput');
const popupStartInput = document.getElementById('popupStartInput');
const popupEndInput = document.getElementById('popupEndInput');
const popupActiveInput = document.getElementById('popupActiveInput');
const popupResetBtn = document.getElementById('popupResetBtn');
const popupFormStatus = document.getElementById('popupFormStatus');
const bannersStatus = document.getElementById('bannersStatus');
const bannersList = document.getElementById('bannersList');
const refreshBannersBtn = document.getElementById('refreshBannersBtn');
const addBannerBtn = document.getElementById('addBannerBtn');
const bannerForm = document.getElementById('bannerForm');
const bannerLocationInput = document.getElementById('bannerLocationInput');
const bannerImageInput = document.getElementById('bannerImageInput');
const bannerLinkInput = document.getElementById('bannerLinkInput');
const bannerOrderInput = document.getElementById('bannerOrderInput');
const bannerActiveInput = document.getElementById('bannerActiveInput');
const bannerResetBtn = document.getElementById('bannerResetBtn');
const bannerFormStatus = document.getElementById('bannerFormStatus');
const siteConfigStatus = document.getElementById('siteConfigStatus');
const siteConfigForm = document.getElementById('siteConfigForm');
const siteLogoInput = document.getElementById('siteLogoInput');
const siteFooterInput = document.getElementById('siteFooterInput');
const siteSearchEnabledInput = document.getElementById('siteSearchEnabledInput');
const siteConfigSaveBtn = document.getElementById('siteConfigSaveBtn');
const siteConfigSaveStatus = document.getElementById('siteConfigSaveStatus');
const refreshSiteConfigBtn = document.getElementById('refreshSiteConfigBtn');
const navForm = document.getElementById('navForm');
const navLocationInput = document.getElementById('navLocationInput');
const navLinkTypeSelect = document.getElementById('navLinkTypeSelect');
const navLinkTargetSelect = document.getElementById('navLinkTargetSelect');
const navLabelInput = document.getElementById('navLabelInput');
const navUrlInput = document.getElementById('navUrlInput');
const navStatus = document.getElementById('navStatus');
const navList = document.getElementById('navList');
const refreshNavBtn = document.getElementById('refreshNavBtn');
const homeLayoutList = document.getElementById('homeLayoutList');
const homeLayoutStatus = document.getElementById('homeLayoutStatus');
const homeLayoutSaveBtn = document.getElementById('homeLayoutSaveBtn');
const homeLayoutSaveStatus = document.getElementById('homeLayoutSaveStatus');
const refreshHomeLayoutBtn = document.getElementById('refreshHomeLayoutBtn');
const homeLayoutTypeSelect = document.getElementById('homeLayoutTypeSelect');
const addSectionBtn = document.getElementById('addSectionBtn');
const homeLayoutSidebarSaveBtn = document.getElementById('homeLayoutSidebarSaveBtn');
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
const scrollTargetButtons = Array.from(document.querySelectorAll('[data-scroll-target]'));
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
const inquiriesStatus = document.getElementById('inquiriesStatus');
const inquiriesList = document.getElementById('inquiriesList');
const refreshInquiriesBtn = document.getElementById('refreshInquiriesBtn');
const exportSubscribersBtn = document.getElementById('exportSubscribersBtn');
const subscribersStatus = document.getElementById('subscribersStatus');

const pageMode = document.body?.dataset?.page || 'editor';
const isDashboard = pageMode === 'dashboard';
const isEditorPage = pageMode === 'editor';

let autosaveTimer = null;
let previewTimer = null;
let currentDraft = load(DRAFT_KEY, {
  id: null,
  title: '',
  body: '',
  bodyJson: null,
  editorMode: 'markdown',
  savedAt: null,
  status: null,
  categorySlug: '',
  type: 'post',
  slug: null,
  publicUrl: null,
  publishAt: null,
});
if (!currentDraft?.type) {
  currentDraft.type = 'post';
}
if (!currentDraft?.editorMode) {
  currentDraft.editorMode = currentDraft?.bodyJson ? 'rich' : 'markdown';
}
let currentSession = load(SESSION_KEY, null);
let currentPosts = [];
let allPosts = [];
let currentJobs = load(JOB_KEY, []);
let currentCategories = [];
let currentPages = [];
let currentPrCampaigns = [];
let currentPrMentions = [];
let currentPrReports = [];
let currentInquiries = [];
let selectedPrCampaignId = null;
let currentPopups = [];
let currentBanners = [];
let themePresets = [];
let currentThemeConfig = { presetId: 'minimal-clean', updatedAt: null };
let selectedThemePresetId = null;
let currentThemeTokens = null;
let themeIsSuperAdmin = false;
let siteConfig = { logo_url: '', footer_text: '', home_layout: [], search_enabled: true };
let siteNavigations = [];
let editingNavId = null;
let currentTenants = [];
let activeTenantId = load(ACTIVE_TENANT_KEY, null);
let currentUsers = [];
let selectedTenantId = null;
let activeTabId = 'content';
let editor = null;
let editorReady = false;
let editorDataCache = null;
let editorChangeTimer = null;
let editorToolsAvailable = new Set();
let editorMode = 'rich';
let initialPostRequestHandled = false;
let postsView = {
  search: '',
  status: 'all',
  category: 'all',
  viewPeriod: 'all',
  viewSort: 'recent',
  type: 'post',
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 1,
  serverMode: false,
};
const initialEditorType = (() => {
  if (!isEditorPage) return null;
  const params = new URLSearchParams(window.location.search);
  const typeParam = params.get('type');
  if (typeParam === 'page') return 'page';
  if (currentDraft?.type === 'page') return 'page';
  return null;
})();
if (initialEditorType === 'page') {
  currentDraft.type = 'page';
  postsView.type = 'page';
  activeTabId = 'pages';
}
let selectedPostIds = new Set();
let visiblePostIds = [];
let autosaveState = {
  dirty: false,
  saving: false,
  savedAt: null,
  error: null,
};
let currentViewMode = isEditorPage ? 'edit' : 'split';
let scheduleStep = 'date';

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

function setGlobalLoading(isLoading, message = '처리 중...') {
  if (!globalLoading) return;
  if (globalLoadingMessage) {
    globalLoadingMessage.textContent = message;
  }
  globalLoading.classList.toggle('hidden', !isLoading);
}

function resolveIsSuperAdmin(session) {
  const user = session?.user || {};
  if (typeof user.is_super_admin === 'boolean') return user.is_super_admin;
  if (typeof user.isSuperAdmin === 'boolean') return user.isSuperAdmin;
  if (user.role) return user.role === 'super_admin' || user.role === 'super';
  return false;
}

function resolveUserRole(session) {
  return session?.user?.role || session?.role || null;
}

function isEditorSession(session = currentSession) {
  return resolveUserRole(session) === 'editor';
}

function applyRoleUiState(role) {
  const isEditor = role === 'editor';
  if (siteTabButton) siteTabButton.style.display = isEditor ? 'none' : '';
  if (siteTabPanel) siteTabPanel.style.display = isEditor ? 'none' : '';
  if (marketingTabButton) marketingTabButton.style.display = isEditor ? 'none' : '';
  if (marketingTabPanel) marketingTabPanel.style.display = isEditor ? 'none' : '';
  if (isEditor && ['site', 'marketing', 'admin'].includes(activeTabId)) {
    setActiveTab('content');
    if (!isEditorPage) {
      window.history.replaceState(null, '', '#content');
    }
  }
}

function updatePostsViewLabels() {
  const isPage = postsView.type === 'page';
  if (postsHeading) postsHeading.textContent = isPage ? '페이지 목록' : '게시글 목록';
  if (newPostBtn) newPostBtn.textContent = isPage ? '새 페이지' : '새 글';
}

function resolveActivePostType() {
  if (isEditorPage) {
    return currentDraft?.type === 'page' ? 'page' : 'post';
  }
  return postsView.type === 'page' ? 'page' : 'post';
}

function updatePostSlugFieldVisibility() {
  if (!postSlugField) return;
  const isPage = resolveActivePostType() === 'page';
  postSlugField.classList.toggle('hidden', !isPage);
}

function setPostsViewType(type) {
  const nextType = type === 'page' ? 'page' : 'post';
  if (postsView.type !== nextType) {
    postsView.type = nextType;
    postsView.page = 1;
  }
  if (isEditorPage) {
    currentDraft.type = nextType;
  }
  updatePostsViewLabels();
  updatePostSlugFieldVisibility();
  if (currentSession) {
    fetchPosts();
  }
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
    const resolvedTabId = tabId === 'pages' ? 'content' : tabId;
    panel.classList.toggle('is-active', panelId === resolvedTabId);
  });
  if (tabId === 'content') {
    setPostsViewType('post');
  }
  if (tabId === 'pages') {
    setPostsViewType('page');
  }
}

function resolveTabFromHash() {
  const raw = window.location.hash?.replace('#', '') || '';
  if (!raw) return null;
  const match = tabButtons.find((button) => button.dataset.tabTarget === raw);
  return match ? raw : null;
}

function toggleFormDisabled(form, disabled) {
  if (!form) return;
  const elements = Array.from(form.elements || []);
  elements.forEach((element) => {
    element.disabled = disabled;
  });
}

function resolveActiveTenant() {
  if (!themeIsSuperAdmin) return currentSession?.tenant || null;
  const match = currentTenants.find((tenant) => tenant.id === activeTenantId);
  if (match) return match;
  return currentSession?.tenant || null;
}

function renderTenantSwitcherList() {
  if (!tenantSwitchList) return;
  tenantSwitchList.innerHTML = '';
  if (!currentTenants.length) {
    const empty = document.createElement('div');
    empty.className = 'muted';
    empty.textContent = '테넌트가 없습니다.';
    tenantSwitchList.appendChild(empty);
    return;
  }
  const query = tenantSearchInput?.value.trim().toLowerCase() || '';
  const filtered = currentTenants.filter((tenant) => {
    if (!query) return true;
    return (
      tenant.name?.toLowerCase().includes(query) ||
      tenant.slug?.toLowerCase().includes(query) ||
      tenant.primaryDomain?.toLowerCase().includes(query)
    );
  });
  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'muted';
    empty.textContent = '검색 결과가 없습니다.';
    tenantSwitchList.appendChild(empty);
    return;
  }
  filtered.forEach((tenant) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tenant-switcher-item';
    if (tenant.id === activeTenantId) {
      button.classList.add('is-active');
    }
    button.innerHTML = `
      <strong>${tenant.name || tenant.slug}</strong>
      <span class="muted">${tenant.slug || tenant.id}</span>
    `;
    button.addEventListener('click', () => {
      setActiveTenant(tenant.id);
      closeTenantMenu();
    });
    tenantSwitchList.appendChild(button);
  });
}

function renderTenantSwitcher() {
  if (!tenantSwitchLabel) return;
  if (!tenantSwitcher) return;
  if (!themeIsSuperAdmin) {
    tenantSwitcher.classList.add('hidden');
    return;
  }
  tenantSwitcher.classList.remove('hidden');
  const activeTenant = resolveActiveTenant();
  const label = activeTenant ? `${activeTenant.name || activeTenant.slug} (${activeTenant.slug || activeTenant.id})` : '테넌트 선택';
  tenantSwitchLabel.textContent = label;
  renderTenantSwitcherList();
}

function syncActiveTenantFromList() {
  if (!themeIsSuperAdmin || !currentTenants.length) return;
  const preferred = currentSession?.tenant?.id;
  const exists = activeTenantId && currentTenants.some((tenant) => tenant.id === activeTenantId);
  if (!exists) {
    const next = preferred || currentTenants[0].id;
    setActiveTenant(next, { refresh: false });
    return;
  }
  if (!selectedTenantId) {
    selectedTenantId = activeTenantId;
  }
  renderTenantSwitcher();
}

async function refreshTenantScopedData() {
  const requests = [
    fetchPosts(),
    fetchCategories(),
    fetchSiteConfig(),
    fetchSiteNavigations(),
    fetchThemeConfig(),
    fetchThemePresets(),
    fetchThemeTokens(),
    fetchPopups(),
    fetchBanners(),
    fetchInquiries(),
    fetchPrCampaigns(),
    fetchDeployJobs(),
  ];
  if (themeIsSuperAdmin) {
    requests.push(fetchUsers());
  }
  await Promise.all(requests);
}

function setActiveTenant(tenantId, options = {}) {
  if (!tenantId) return;
  const { refresh = true } = options;
  activeTenantId = tenantId;
  save(ACTIVE_TENANT_KEY, tenantId);
  if (selectedTenantId !== tenantId) {
    selectedTenantId = tenantId;
    renderTenantSelect();
  }
  renderTenantSwitcher();
  renderSession();
  if (themeIsSuperAdmin && refresh) {
    refreshTenantScopedData();
  }
}

function openTenantMenu() {
  if (!tenantSwitchMenu || !tenantSwitchBtn) return;
  tenantSwitchMenu.classList.remove('hidden');
  tenantSwitchBtn.setAttribute('aria-expanded', 'true');
  if (tenantSearchInput) {
    tenantSearchInput.value = '';
    tenantSearchInput.focus();
  }
  renderTenantSwitcherList();
}

function closeTenantMenu() {
  if (!tenantSwitchMenu || !tenantSwitchBtn) return;
  tenantSwitchMenu.classList.add('hidden');
  tenantSwitchBtn.setAttribute('aria-expanded', 'false');
}

function parseDatetimeInput(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return Math.floor(parsed.getTime() / 1000);
}

function formatUnixSeconds(value) {
  if (!value) return '-';
  return formatTime(new Date(value * 1000));
}

function applyAdminUiState(isSuperAdmin) {
  if (refreshTenantsBtn) refreshTenantsBtn.disabled = !isSuperAdmin;
  if (refreshUsersBtn) refreshUsersBtn.disabled = !isSuperAdmin;
  if (usersTenantSelect) usersTenantSelect.disabled = !isSuperAdmin;
  if (tenantResetBtn) tenantResetBtn.disabled = !isSuperAdmin;
  if (userResetBtn) userResetBtn.disabled = !isSuperAdmin;
  if (tenantSwitcher) tenantSwitcher.classList.toggle('hidden', !isSuperAdmin);
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
  const rootTokens = toCss(tokens || {});
  return `${scopeSelector} {\n${rootTokens}\n}\n${scopeSelector} {\n  background: var(--bg, #ffffff);\n  color: var(--fg, #111827);\n  font-family: var(--font-body, var(--font-sans, "ui-sans-serif"));\n  border: 1px solid var(--border, #e5e7eb);\n  border-radius: var(--radius, 12px);\n}\n${scopeSelector} a {\n  color: var(--accent, var(--link, #2563eb));\n}\n${scopeSelector} hr {\n  border-color: var(--border, #e5e7eb);\n}\n${scopeSelector} .card, ${scopeSelector} .border {\n  border-color: var(--border, #e5e7eb);\n  border-radius: var(--radius, 12px);\n}`;
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

function initEditorJs() {
  if (!window.EditorJS || !editorJsContainer) return;
  const tools = {};
  if (window.Header) {
    tools.header = {
      class: window.Header,
      inlineToolbar: true,
      config: {
        levels: [1, 2, 3, 4, 5, 6],
        defaultLevel: 2,
      },
    };
  }
  const listTool = window.List || window.EditorjsList;
  if (listTool) {
    tools.list = {
      class: listTool,
      inlineToolbar: true,
    };
  }
  if (window.Table) {
    tools.table = window.Table;
  }
  if (window.Embed) {
    tools.embed = {
      class: window.Embed,
      config: {
        services: { youtube: true, twitter: true, instagram: true },
      },
    };
  }
  if (window.Marker) {
    tools.marker = window.Marker;
  }
  if (window.Warning) {
    tools.warning = {
      class: window.Warning,
      inlineToolbar: true,
      config: {
        titlePlaceholder: '콜아웃 제목',
        messagePlaceholder: '메시지를 입력하세요',
      },
    };
  }
  if (window.CodeTool) {
    tools.code = window.CodeTool;
  }
  if (window.SimpleImage) {
    tools.image = {
      class: window.SimpleImage,
      inlineToolbar: true,
    };
  }
  if (window.Checklist) {
    tools.checklist = {
      class: window.Checklist,
      inlineToolbar: true,
    };
  }
  if (window.Quote) {
    tools.quote = {
      class: window.Quote,
      inlineToolbar: true,
      config: {
        quotePlaceholder: '인용문을 입력하세요',
        captionPlaceholder: '출처',
      },
    };
  }
  if (window.Delimiter) {
    tools.delimiter = window.Delimiter;
  }
  editorToolsAvailable = new Set(Object.keys(tools));
  editor = new EditorJS({
    holder: editorJsContainer,
    placeholder: '내용을 입력하면 자동 저장됩니다',
    tools,
    onReady: () => {
      editorReady = true;
    },
    onChange: () => {
      scheduleEditorCacheUpdate();
      handleAutosave();
    },
  });
}

function normalizeEditorData(data) {
  if (!data || !Array.isArray(data.blocks)) return { blocks: [] };
  const normalizedBlocks = data.blocks
    .map((block) => {
      if (!block || typeof block !== 'object') return null;
      const type = block.type;
      const raw = block.data || {};
      if (type === 'paragraph') {
        return { ...block, data: { text: typeof raw.text === 'string' ? raw.text : '' } };
      }
      if (type === 'header') {
        return {
          ...block,
          data: {
            text: typeof raw.text === 'string' ? raw.text : '',
            level: Math.min(Math.max(Number(raw.level) || 2, 1), 6),
          },
        };
      }
      if (type === 'list') {
        const items = Array.isArray(raw.items) ? raw.items : [''];
        return { ...block, data: { style: raw.style === 'ordered' ? 'ordered' : 'unordered', items } };
      }
      if (type === 'checklist') {
        const items = Array.isArray(raw.items) && raw.items.length
          ? raw.items.map((item) => ({
              text: typeof item?.text === 'string' ? item.text : '',
              checked: Boolean(item?.checked),
            }))
          : [{ text: '', checked: false }];
        return { ...block, data: { items } };
      }
      if (type === 'quote') {
        return {
          ...block,
          data: {
            text: typeof raw.text === 'string' ? raw.text : '',
            caption: typeof raw.caption === 'string' ? raw.caption : '',
          },
        };
      }
      if (type === 'table') {
        const content = Array.isArray(raw.content) ? raw.content : [['']];
        return { ...block, data: { withHeadings: Boolean(raw.withHeadings), content } };
      }
      if (type === 'code') {
        return { ...block, data: { code: typeof raw.code === 'string' ? raw.code : '' } };
      }
      if (type === 'warning') {
        return {
          ...block,
          data: {
            title: typeof raw.title === 'string' ? raw.title : '',
            message: typeof raw.message === 'string' ? raw.message : '',
          },
        };
      }
      if (type === 'delimiter') {
        return { ...block, data: {} };
      }
      if (type === 'image') {
        const url = raw.url || raw.file?.url;
        if (!url) return null;
        return { ...block, data: { ...raw, url, file: raw.file } };
      }
      if (type === 'embed') {
        const embed = raw.embed || raw.source;
        if (!embed) return null;
        return { ...block, data: { ...raw, embed } };
      }
      if (type === 'marker') {
        return { ...block, data: { text: typeof raw.text === 'string' ? raw.text : '' } };
      }
      return block;
    })
    .filter(Boolean);
  return { ...data, blocks: normalizedBlocks };
}

function sanitizeEditorInline(html = '') {
  return `${html}`.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
}

function buildEditorDataFromMarkdown(markdown = '') {
  if (!markdown) return { blocks: [] };
  const paragraphs = `${markdown}`.split(/\n{2,}/).filter(Boolean);
  return {
    blocks: paragraphs.map((paragraph) => ({
      type: 'paragraph',
      data: { text: escapeHtml(paragraph).replace(/\n/g, '<br />') },
    })),
  };
}

function stripInlineHtml(text = '') {
  return `${text}`.replace(/<[^>]+>/g, '');
}

function editorDataToMarkdown(data) {
  const blocks = data?.blocks || [];
  return blocks
    .map((block) => {
      const payload = block?.data || {};
      switch (block?.type) {
        case 'header': {
          const level = Math.min(Math.max(Number(payload.level) || 2, 1), 6);
          const text = stripInlineHtml(payload.text || '');
          return `${'#'.repeat(level)} ${text}`.trim();
        }
        case 'paragraph':
          return stripInlineHtml(payload.text || '');
        case 'list': {
          const style = payload.style === 'ordered' ? 'ordered' : 'unordered';
          const items = Array.isArray(payload.items) ? payload.items : [];
          return items
            .map((item, index) => {
              const content = stripInlineHtml(item || '');
              return style === 'ordered' ? `${index + 1}. ${content}` : `- ${content}`;
            })
            .join('\n');
        }
        case 'checklist': {
          const items = Array.isArray(payload.items) ? payload.items : [];
          return items
            .map((item) => {
              const content = stripInlineHtml(item?.text || '');
              return `- [${item?.checked ? 'x' : ' '}] ${content}`;
            })
            .join('\n');
        }
        case 'quote': {
          const text = stripInlineHtml(payload.text || '');
          const caption = stripInlineHtml(payload.caption || '');
          return `> ${text}${caption ? `\n> — ${caption}` : ''}`;
        }
        case 'code':
          return `\`\`\`\n${payload.code || ''}\n\`\`\``;
        case 'warning': {
          const title = stripInlineHtml(payload.title || '');
          const message = stripInlineHtml(payload.message || '');
          return `> **${title}**\n> ${message}`.trim();
        }
        case 'delimiter':
          return '---';
        case 'image': {
          const url = payload.url || payload.file?.url;
          return url ? `![](${url})` : '';
        }
        case 'table': {
          const rows = Array.isArray(payload.content) ? payload.content : [];
          if (!rows.length) return '';
          const header = rows[0].map((cell) => stripInlineHtml(cell || '')).join(' | ');
          const divider = rows[0].map(() => '---').join(' | ');
          const body = rows
            .slice(1)
            .map((row) => row.map((cell) => stripInlineHtml(cell || '')).join(' | '))
            .join('\n');
          return `${header}\n${divider}${body ? `\n${body}` : ''}`;
        }
        case 'embed': {
          const url = payload.source || payload.embed;
          return url ? `${url}` : '';
        }
        default:
          return '';
      }
    })
    .filter(Boolean)
    .join('\n\n');
}

async function setEditorContent({ bodyJson, bodyMd }) {
  const nextBodyMd = bodyMd || '';
  bodyInput.value = nextBodyMd;
  if (!editor) return;
  const parsed = (() => {
    if (bodyJson) {
      try {
        return normalizeEditorData(JSON.parse(bodyJson));
      } catch (error) {
        console.warn('Failed to parse body_json', error);
      }
    }
    return buildEditorDataFromMarkdown(nextBodyMd);
  })();
  editorDataCache = parsed;
  await editor.isReady;
  await editor.render(parsed);
}

async function getEditorPayload() {
  if (!editor) {
    return { bodyJson: null, data: null };
  }
  const data = await editor.save();
  const normalized = normalizeEditorData(data);
  editorDataCache = normalized;
  return { bodyJson: JSON.stringify(normalized), data: normalized };
}

function renderEditorList(items = [], style = 'unordered') {
  const tag = style === 'ordered' ? 'ol' : 'ul';
  const rendered = items
    .map((item) => {
      if (typeof item === 'string') {
        return `<li>${sanitizeEditorInline(item)}</li>`;
      }
      if (item && typeof item === 'object') {
        const content = sanitizeEditorInline(item.content || '');
        const nested = Array.isArray(item.items) && item.items.length ? renderEditorList(item.items, style) : '';
        return `<li>${content}${nested}</li>`;
      }
      return '';
    })
    .join('');
  return `<${tag}>${rendered}</${tag}>`;
}

function renderEditorBlocks(data) {
  const blocks = data?.blocks || [];
  return blocks
    .map((block) => {
      const payload = block?.data || {};
      switch (block.type) {
        case 'header': {
          const level = Math.min(Math.max(Number(payload.level) || 2, 1), 6);
          return `<h${level}>${sanitizeEditorInline(payload.text || '')}</h${level}>`;
        }
        case 'paragraph':
          return `<p>${sanitizeEditorInline(payload.text || '')}</p>`;
        case 'list':
          return renderEditorList(payload.items || [], payload.style);
        case 'table': {
          const rows = Array.isArray(payload.content) ? payload.content : [];
          const body = rows
            .map((row) => {
              const cells = Array.isArray(row)
                ? row.map((cell) => `<td>${sanitizeEditorInline(cell || '')}</td>`).join('')
                : '';
              return `<tr>${cells}</tr>`;
            })
            .join('');
          return `<table><tbody>${body}</tbody></table>`;
        }
        case 'embed': {
          const src = sanitizeLink(payload.embed || payload.source || '');
          if (!src || src === '#') {
            return payload.source ? `<a href="${sanitizeLink(payload.source)}">${escapeHtml(payload.source)}</a>` : '';
          }
          return `<div class="embed"><iframe src="${src}" allowfullscreen loading="lazy"></iframe></div>`;
        }
        case 'image': {
          const url = sanitizeLink(payload.url || payload.file?.url || '');
          if (!url || url === '#') return '';
          const caption = payload.caption ? `<figcaption>${sanitizeEditorInline(payload.caption)}</figcaption>` : '';
          return `<figure><img src="${url}" alt="" />${caption}</figure>`;
        }
        case 'warning': {
          const title = payload.title ? `<div class="callout-title">${sanitizeEditorInline(payload.title)}</div>` : '';
          const message = payload.message ? `<div class="callout-body">${sanitizeEditorInline(payload.message)}</div>` : '';
          return `<div class="callout callout-warning">${title}${message}</div>`;
        }
        case 'code':
          return `<pre><code>${escapeHtml(payload.code || '')}</code></pre>`;
        case 'marker':
          return `<p><mark>${sanitizeEditorInline(payload.text || '')}</mark></p>`;
        default:
          return '';
      }
    })
    .join('');
}

function getBodyValue() {
  return bodyInput.value || '';
}

function isHtmlContent(value) {
  return /<\/?[a-z][\s\S]*>/i.test(value || '');
}

function setBodyValue(value) {
  if (editorMode === 'markdown') {
    bodyInput.value = value || '';
    return;
  }
  setEditorContent({ bodyJson: null, bodyMd: value || '' });
}

async function buildBodyPayload() {
  const bodyMd = getBodyValue();
  if (editorMode === 'markdown') {
    return { bodyJson: null, bodyMd };
  }
  if (!editor || !editorReady) {
    return { bodyJson: null, bodyMd };
  }
  const { bodyJson } = await getEditorPayload();
  const nextMd = bodyMd || editorDataToMarkdown(editorDataCache);
  return { bodyJson, bodyMd: nextMd };
}

function setStatus(el, message, isError = false) {
  el.textContent = message || '';
  el.classList.toggle('error', Boolean(isError));
}

function insertEditorBlock(tool, data = {}) {
  if (!editor || !editorReady) {
    setStatus(autosaveStatus, '에디터가 아직 준비되지 않았습니다.', true);
    return;
  }
  if (!editorToolsAvailable.has(tool)) {
    setStatus(autosaveStatus, '해당 블록 도구를 불러올 수 없습니다.', true);
    return;
  }
  const index = editor.blocks.getCurrentBlockIndex();
  editor.blocks.insert(tool, data);
  if (typeof index === 'number' && editor.caret?.setToBlock) {
    editor.caret.setToBlock(index + 1, 'end');
  }
  handleAutosave();
}

function convertOrInsertBlock(tool, data = {}) {
  if (!editor || !editorReady) {
    setStatus(autosaveStatus, '에디터가 아직 준비되지 않았습니다.', true);
    return;
  }
  if (!editorToolsAvailable.has(tool)) {
    setStatus(autosaveStatus, '해당 블록 도구를 불러올 수 없습니다.', true);
    return;
  }
  const index = editor.blocks.getCurrentBlockIndex();
  const block = typeof index === 'number' ? editor.blocks.getBlockByIndex(index) : null;
  if (editor.blocks.convert && block) {
    const blockText = typeof block?.data?.text === 'string' ? block.data.text : '';
    const payload = { ...data };
    if (tool === 'header' || tool === 'quote') {
      payload.text = payload.text ?? blockText;
    }
    if (tool === 'list') {
      payload.items = payload.items?.length ? payload.items : [blockText || ''];
    }
    if (tool === 'checklist') {
      payload.items = payload.items?.length ? payload.items : [{ text: blockText || '', checked: false }];
    }
    editor.blocks.convert(tool, payload);
    handleAutosave();
    return;
  }
  insertEditorBlock(tool, data);
}

function handleImageUpload(file) {
  if (!file) return;
  uploadImageAsset(file)
    .then((url) => {
      insertEditorBlock('image', { url });
    })
    .catch((error) => {
      console.error('Image upload failed', error);
      setStatus(autosaveStatus, `이미지 업로드 실패: ${error?.message || '다시 시도해 주세요.'}`, true);
    })
    .finally(() => {
      if (imageUploadInput) {
        imageUploadInput.value = '';
      }
    });
}

function initCustomToolbar() {
  if (!customToolbar || !toolbarButtons.length) return;
  customToolbar.classList.toggle('is-hidden', editorMode === 'markdown');
  toolbarButtons.forEach((button) => {
    const tool = button.dataset.tool;
    if (tool) {
      button.disabled = !editorToolsAvailable.has(tool);
    }
    button.addEventListener('click', () => {
      const selectedTool = button.dataset.tool;
      if (!selectedTool) return;
      if (!editorToolsAvailable.has(selectedTool)) {
        setStatus(autosaveStatus, '해당 블록 도구를 불러올 수 없습니다.', true);
        return;
      }
      if (selectedTool === 'header') {
        const level = Number(button.dataset.level) || 2;
        convertOrInsertBlock('header', { level, text: '' });
        return;
      }
      if (selectedTool === 'list') {
        convertOrInsertBlock('list', { style: 'unordered', items: [''] });
        return;
      }
      if (selectedTool === 'checklist') {
        convertOrInsertBlock('checklist', { items: [{ text: '', checked: false }] });
        return;
      }
      if (selectedTool === 'quote') {
        convertOrInsertBlock('quote', { text: '', caption: '' });
        return;
      }
      if (selectedTool === 'image') {
        if (imageUploadInput) {
          imageUploadInput.click();
        }
        return;
      }
      if (selectedTool === 'table') {
        insertEditorBlock('table', { withHeadings: true, content: [['']] });
        return;
      }
      if (selectedTool === 'code') {
        insertEditorBlock('code', { code: '' });
        return;
      }
      if (selectedTool === 'warning') {
        insertEditorBlock('warning', { title: '', message: '' });
        return;
      }
      if (selectedTool === 'delimiter') {
        insertEditorBlock('delimiter', {});
      }
    });
  });

  if (imageUploadInput) {
    imageUploadInput.addEventListener('change', () => {
      const file = imageUploadInput.files?.[0];
      handleImageUpload(file);
    });
  }
}

function wrapSelection(prefix, suffix = '') {
  const start = bodyInput.selectionStart ?? 0;
  const end = bodyInput.selectionEnd ?? 0;
  const value = bodyInput.value || '';
  const before = value.slice(0, start);
  const selected = value.slice(start, end);
  const after = value.slice(end);
  const next = `${before}${prefix}${selected}${suffix}${after}`;
  bodyInput.value = next;
  const cursor = start + prefix.length + (selected ? selected.length : 0);
  bodyInput.focus();
  bodyInput.setSelectionRange(cursor, cursor);
}

function prefixLine(prefix) {
  const start = bodyInput.selectionStart ?? 0;
  const end = bodyInput.selectionEnd ?? 0;
  const value = bodyInput.value || '';
  const before = value.slice(0, start);
  const selected = value.slice(start, end) || '';
  const after = value.slice(end);
  const lines = (selected || '내용을 입력하세요').split('\n').map((line) => `${prefix}${line}`);
  const block = lines.join('\n');
  bodyInput.value = `${before}${block}${after}`;
  const cursor = before.length + block.length;
  bodyInput.focus();
  bodyInput.setSelectionRange(cursor, cursor);
}

function insertAtCursor(text) {
  const start = bodyInput.selectionStart ?? 0;
  const end = bodyInput.selectionEnd ?? 0;
  const value = bodyInput.value || '';
  bodyInput.value = `${value.slice(0, start)}${text}${value.slice(end)}`;
  const cursor = start + text.length;
  bodyInput.focus();
  bodyInput.setSelectionRange(cursor, cursor);
}

function insertMarkdownTable() {
  const table = '\n| 제목 | 내용 |\n| --- | --- |\n| 값 | 값 |\n';
  insertAtCursor(table);
}

function initMarkdownToolbar() {
  if (!markdownToolbar || !markdownButtons.length || !bodyInput) return;
  markdownToolbar.classList.toggle('is-hidden', editorMode !== 'markdown');
  markdownButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.mdAction;
      if (!action) return;
      if (action === 'bold') {
        wrapSelection('**', '**');
      } else if (action === 'italic') {
        wrapSelection('*', '*');
      } else if (action === 'link') {
        wrapSelection('[', '](https://)');
      } else if (action === 'strike') {
        wrapSelection('~~', '~~');
      } else if (action === 'code') {
        wrapSelection('`', '`');
      } else if (action === 'h1') {
        prefixLine('# ');
      } else if (action === 'h2') {
        prefixLine('## ');
      } else if (action === 'h3') {
        prefixLine('### ');
      } else if (action === 'ul') {
        prefixLine('- ');
      } else if (action === 'ol') {
        prefixLine('1. ');
      } else if (action === 'quote') {
        prefixLine('> ');
      } else if (action === 'image') {
        wrapSelection('![](', ')');
      } else if (action === 'table') {
        insertMarkdownTable();
      } else if (action === 'divider') {
        insertAtCursor('\n---\n');
      }
      handleAutosave();
    });
  });
}

async function setEditorMode(mode) {
  editorMode = mode === 'markdown' ? 'markdown' : 'rich';
  if (editorModeToggle) {
    editorModeToggle.textContent = editorMode === 'markdown' ? '노션 에디터' : '기본 에디터';
  }
  if (customToolbar) {
    customToolbar.classList.toggle('is-hidden', editorMode === 'markdown');
  }
  if (markdownToolbar) {
    markdownToolbar.classList.toggle('is-hidden', editorMode !== 'markdown');
  }
  if (editorJsContainer) {
    editorJsContainer.classList.toggle('is-hidden', editorMode === 'markdown');
  }
  if (editorMode === 'markdown') {
    bodyInput.classList.remove('editor-textarea--hidden');
    if (editor && editorReady) {
      try {
        const data = await editor.save();
        const normalized = normalizeEditorData(data);
        editorDataCache = normalized;
        bodyInput.value = editorDataToMarkdown(normalized);
      } catch (error) {
        console.warn('Failed to extract editor data for markdown', error);
      }
    }
  } else {
    bodyInput.classList.add('editor-textarea--hidden');
    await setEditorContent({ bodyJson: currentDraft?.bodyJson, bodyMd: bodyInput.value || currentDraft?.body || '' });
  }
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
  if (themeIsSuperAdmin && activeTenantId && !path.startsWith('/cms/auth/')) {
    headers['x-tenant-id'] = activeTenantId;
  }

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
    if (response.status === 403 && isEditorSession()) {
      alert('접근 권한이 없습니다. 홈으로 이동합니다.');
      setActiveTab('content');
      if (!isEditorPage) {
        window.history.replaceState(null, '', '#content');
      }
    }
    throw err;
  }

  return data;
}

async function apiPostWithFallback(path, payload) {
  try {
    return await apiFetch(path, { method: 'POST', body: payload });
  } catch (error) {
    if (payload?.body_json && error?.status === 500) {
      const fallback = { ...payload };
      delete fallback.body_json;
      if (fallback.body_md === undefined) {
        fallback.body_md = currentDraft?.body || '';
      }
      return apiFetch(path, { method: 'POST', body: fallback });
    }
    if (error?.status === 500 && payload?.body_md !== undefined) {
      const fallback = { ...payload };
      fallback.body_md = fallback.body_md?.trim() ? fallback.body_md : ' ';
      return apiFetch(path, { method: 'POST', body: fallback });
    }
    throw error;
  }
}

async function uploadImageAsset(file) {
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
}

function formatError(error) {
  const statusSuffix = error?.status ? ` (HTTP ${error.status})` : '';
  return (error?.message || '요청 중 문제가 발생했습니다.') + statusSuffix;
}

function isReservedSlug(value) {
  if (!value) return false;
  return RESERVED_SLUGS.has(value.toLowerCase());
}

function persistSession(session) {
  currentSession = session;
  save(SESSION_KEY, session);
  themeIsSuperAdmin = resolveIsSuperAdmin(session);
  applyAdminUiState(themeIsSuperAdmin);
  applyRoleUiState(resolveUserRole(session));
  if (themeIsSuperAdmin && !activeTenantId) {
    activeTenantId = session?.tenant?.id || null;
    save(ACTIVE_TENANT_KEY, activeTenantId);
  }
  renderTenantSwitcher();
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

  const activeTenant = resolveActiveTenant();
  const tenantSlug = activeTenant?.slug || currentSession?.tenant?.slug || currentSession?.tenantSlug || currentSession?.tenant || '-';
  const tenantName = activeTenant?.name ? ` (${activeTenant.name})` : '';
  const email = currentSession?.user?.email || currentSession?.email || 'unknown';
  const loggedInAt = currentSession?.loggedInAt ? formatTime(new Date(currentSession.loggedInAt)) : '알 수 없음';

  sessionStatus.innerHTML = `
    테넌트 <strong>${tenantSlug}${tenantName}</strong> · ${email}<br />
    로그인: ${loggedInAt}
  `;
  sessionStatus.classList.remove('error');
}

async function fetchSession() {
  try {
    const data = await apiFetch('/cms/auth/me');
    const loggedInAt = currentSession?.loggedInAt || new Date().toISOString();
    persistSession({ ...data, loggedInAt });
    const role = resolveUserRole(currentSession);
    if (themeIsSuperAdmin) {
      await fetchTenants();
    }
    if (role && role !== 'editor') {
      await refreshTenantScopedData();
    } else {
      await Promise.all([fetchThemeConfig(), fetchThemePresets(), fetchThemeTokens()]);
    }
    if (!themeIsSuperAdmin) {
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
    if (error.status === 401) {
      window.location.href = 'login.html';
      return;
    }
    setStatus(sessionStatus, formatError(error), true);
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

logoutBtn.addEventListener('click', async () => {
  try {
    await apiFetch('/cms/auth/logout', { method: 'POST' });
  } catch (error) {
    console.warn('Logout request failed', error);
  }
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

async function renderPreview() {
  const draft = currentDraft || { title: '', body: '', bodyJson: null };
  const title = draft.title || '제목 없음';
  const body = draft.body || '';
  const hasEditorData = Boolean(editor && (editorDataCache || draft.bodyJson));
  if (!title && !body && !hasEditorData) {
    previewPane.innerHTML = '<div class="preview-scope muted">작성된 내용이 없습니다.</div>';
    return;
  }

  if (hasEditorData) {
    let data = editorDataCache;
    if (!data && draft.bodyJson) {
      try {
        data = normalizeEditorData(JSON.parse(draft.bodyJson));
      } catch (error) {
        console.warn('Failed to parse draft body_json', error);
      }
    }
    if (!data && editor) {
      try {
        const saved = await editor.save();
        data = normalizeEditorData(saved);
        editorDataCache = data;
      } catch (error) {
        console.warn('Failed to save editor data for preview', error);
      }
    }
    const content = data ? renderEditorBlocks(data) : '';
    previewPane.innerHTML = `<div class="preview-scope"><h1>${escapeHtml(title)}</h1>${content}</div>`;
    previewStatus.textContent = '실시간';
    return;
  }

  if (!title && !body) {
    previewPane.innerHTML = '<div class="preview-scope muted">작성된 내용이 없습니다.</div>';
    return;
  }
  const hasHtml = isHtmlContent(body);
  const content = hasHtml
    ? body
    : renderMarkdown(`# ${title}\n\n${body || '본문을 입력하면 미리보기가 표시됩니다.'}`);
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

function scheduleEditorCacheUpdate() {
  if (!editor || !editorReady) return;
  if (editorChangeTimer) clearTimeout(editorChangeTimer);
  editorChangeTimer = setTimeout(async () => {
    try {
      const data = await editor.save();
      editorDataCache = normalizeEditorData(data);
      persistDraft({ bodyJson: JSON.stringify(editorDataCache) });
    } catch (error) {
      console.warn('Failed to cache editor data', error);
    }
  }, 400);
}

function schedulePreviewUpdate() {
  if (previewTimer) clearTimeout(previewTimer);
  previewStatus.textContent = '갱신 중...';
  previewTimer = setTimeout(() => {
    void renderPreview();
  }, 220);
}

function persistDraft(partial) {
  currentDraft = {
    ...currentDraft,
    ...partial,
  };
  if (currentDraft?.editorMode) {
    editorMode = currentDraft.editorMode;
  }
  save(DRAFT_KEY, currentDraft);
  renderPreview();
  renderSelectedPostMeta();
  updateViewOnBlogButton();
  updateScheduleButtons();
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

function updateScheduleButtons() {
  if (!scheduleBtn || !cancelScheduleBtn || !publishBtn) return;
  const isScheduled = currentDraft?.status === 'scheduled';
  scheduleBtn.textContent = isScheduled ? '예약 수정' : '예약 발행';
  cancelScheduleBtn.classList.toggle('hidden', !isScheduled);
  publishBtn.textContent = isScheduled ? '예약 발행' : '발행';
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

function buildScheduleHours() {
  return Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
}

function buildScheduleMinutes() {
  return Array.from({ length: 6 }, (_, idx) => String(idx * 10).padStart(2, '0'));
}

function buildScheduleSelectOptions(select, options) {
  if (!select) return;
  select.innerHTML = '';
  options.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function setScheduleStep(step) {
  scheduleStep = step;
  if (!scheduleModal) return;
  const dateStep = scheduleModal.querySelector('[data-schedule-step="date"]');
  const timeStep = scheduleModal.querySelector('[data-schedule-step="time"]');
  if (dateStep) dateStep.classList.toggle('hidden', step !== 'date');
  if (timeStep) timeStep.classList.toggle('hidden', step !== 'time');
  if (scheduleBackBtn) scheduleBackBtn.classList.toggle('hidden', step === 'date');
  if (scheduleNextBtn) scheduleNextBtn.classList.toggle('hidden', step !== 'date');
  if (scheduleConfirmBtn) scheduleConfirmBtn.classList.toggle('hidden', step !== 'time');
}

function openScheduleModal() {
  if (!scheduleModal || !scheduleDateInput || !scheduleHourSelect || !scheduleMinuteSelect) return;
  scheduleModal.classList.remove('hidden');
  scheduleStatus.textContent = '';
  const today = new Date();
  const todayValue = today.toISOString().slice(0, 10);
  if (currentDraft?.publishAt) {
    const publishDate = new Date(currentDraft.publishAt * 1000);
    scheduleDateInput.value = publishDate.toISOString().slice(0, 10);
  } else {
    scheduleDateInput.value = scheduleDateInput.value || todayValue;
  }
  scheduleDateInput.min = todayValue;
  const hours = buildScheduleHours();
  const minutes = buildScheduleMinutes();
  buildScheduleSelectOptions(scheduleHourSelect, hours);
  buildScheduleSelectOptions(scheduleMinuteSelect, minutes);

  let selectedHour = hours[0];
  let selectedMinute = minutes[0];
  if (currentDraft?.publishAt) {
    const publishDate = new Date(currentDraft.publishAt * 1000);
    selectedHour = String(publishDate.getHours()).padStart(2, '0');
    selectedMinute = String(Math.floor(publishDate.getMinutes() / 10) * 10).padStart(2, '0');
  }
  scheduleHourSelect.value = selectedHour;
  scheduleMinuteSelect.value = selectedMinute;

  setScheduleStep('date');
}

function closeScheduleModal() {
  if (!scheduleModal) return;
  scheduleModal.classList.add('hidden');
}

function parseScheduleDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;
  const iso = `${dateValue}T${timeValue}:00`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

async function applyScheduledPublish(publishAt, statusEl, { closeModal = false } = {}) {
  if (!currentSession) {
    setStatus(statusEl, '로그인 세션이 없습니다.', true);
    return;
  }
  if (!publishAt) {
    setStatus(statusEl, '예약 시간을 먼저 설정하세요.', true);
    return;
  }
  try {
    setStatus(statusEl, '예약 저장 중...');
    setGlobalLoading(true, '예약 발행 저장 중...');
    const payload = await buildBodyPayload();
    const postId = await ensurePostId(titleInput.value.trim() || '제목 없음', payload);
    const postType = getSelectedPostType();
    const slugValue = getPostSlugForSave();
    const bodyPayload = payload.bodyJson
      ? { body_json: payload.bodyJson, body_md: payload.bodyMd }
      : { body_md: payload.bodyMd };
    if (bodyPayload.body_md !== undefined && !bodyPayload.body_md.trim()) {
      bodyPayload.body_md = ' ';
    }
    const response = await apiPostWithFallback(`/cms/posts/${postId}/autosave`, {
      title: titleInput.value.trim() || '제목 없음',
      ...bodyPayload,
      category_slug: categorySelect?.value || undefined,
      slug: slugValue || undefined,
      type: postType,
      status: 'scheduled',
      publish_at: publishAt,
    });
    const updated = normalizePost(response?.post || response);
    persistDraft({
      id: postId,
      title: updated.title,
      body: updated.body || '',
      bodyJson: updated.bodyJson || payload.bodyJson || null,
      savedAt: updated.updatedAt || currentDraft.savedAt,
      status: updated.status,
      type: updated.type || postType,
      slug: updated.slug,
      publicUrl: updated.publicUrl,
      categorySlug: updated.categorySlug || '',
      publishAt: updated.publishAt,
    });
    setStatus(statusEl, '예약 완료');
    if (closeModal) closeScheduleModal();
    fetchPosts();
    if (isEditorPage) {
      window.location.href = 'index.html';
    }
  } catch (error) {
    setStatus(statusEl, formatError(error), true);
  } finally {
    setGlobalLoading(false);
  }
}

async function schedulePublish() {
  const dateValue = scheduleDateInput?.value;
  const hourValue = scheduleHourSelect?.value || null;
  const minuteValue = scheduleMinuteSelect?.value || null;
  const timeValue = hourValue && minuteValue ? `${hourValue}:${minuteValue}` : null;
  const scheduleDate = parseScheduleDateTime(dateValue, timeValue);
  if (!scheduleDate) {
    setStatus(scheduleStatus, '날짜와 시간을 확인해 주세요.', true);
    return;
  }
  const publishAt = Math.floor(scheduleDate.getTime() / 1000);
  await applyScheduledPublish(publishAt, scheduleStatus, { closeModal: true });
}

async function cancelSchedule() {
  if (!currentDraft?.id) return;
  try {
    await apiFetch(`/cms/posts/${currentDraft.id}/autosave`, {
      method: 'POST',
      body: { status: 'draft', publish_at: null },
    });
    persistDraft({ status: 'draft', publishAt: null });
    fetchPosts();
  } catch (error) {
    setStatus(autosaveStatus, formatError(error), true);
  }
}

function getSelectedPostType() {
  const value = resolveActivePostType();
  return value === 'page' ? 'page' : 'post';
}

function getPostSlugForSave() {
  if (getSelectedPostType() !== 'page') return undefined;
  if (!postSlugInput) return undefined;
  return postSlugInput.value.trim();
}

async function ensurePostId(title, payload = {}) {
  if (currentDraft?.id) return currentDraft.id;
  const categorySlug = categorySelect?.value || undefined;
  const postType = getSelectedPostType();
  const slugValue = getPostSlugForSave();
  const bodyPayload = payload?.bodyJson
    ? { body_json: payload.bodyJson, body_md: payload?.bodyMd || '' }
    : { body_md: payload?.bodyMd || '' };
  if (bodyPayload.body_md !== undefined && !bodyPayload.body_md.trim()) {
    bodyPayload.body_md = ' ';
  }
  const created = await apiPostWithFallback('/cms/posts', {
    title: title || '제목 없음',
    ...bodyPayload,
    category_slug: categorySlug,
    slug: slugValue || undefined,
    type: postType,
  });
  const createdPost = created?.post || created;
  const postId = createdPost?.id;
  if (!postId) throw new Error('게시글 ID를 받을 수 없습니다.');
  persistDraft({ id: postId, categorySlug: categorySlug || '', type: postType, slug: createdPost?.slug || null });
  if (postSlugInput && createdPost?.slug) {
    postSlugInput.value = createdPost.slug;
  }
  return postId;
}

async function saveDraftToApi(title) {
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
    const payload = await buildBodyPayload();
    const postId = await ensurePostId(title, payload);
    const categorySlug = categorySelect?.value || undefined;
    const postType = getSelectedPostType();
    const slugValue = getPostSlugForSave();
    const bodyPayload = payload.bodyJson
      ? { body_json: payload.bodyJson, body_md: payload.bodyMd }
      : { body_md: payload.bodyMd };
    if (bodyPayload.body_md !== undefined && !bodyPayload.body_md.trim()) {
      bodyPayload.body_md = ' ';
    }
    const saved = await apiPostWithFallback(`/cms/posts/${postId}/autosave`, {
      title,
      ...bodyPayload,
      category_slug: categorySlug,
      slug: slugValue || undefined,
      type: postType,
    });
    const savedAt = saved?.saved_at || saved?.post?.updated_at_iso || new Date().toISOString();
    const savedPost = saved?.post || saved;
    persistDraft({
      id: postId,
      title,
      body: payload.bodyMd || currentDraft.body || '',
      bodyJson: payload.bodyJson || currentDraft.bodyJson || null,
      editorMode,
      savedAt,
      status: savedPost?.status,
      categorySlug: categorySlug || '',
      type: savedPost?.type || postType,
      slug: savedPost?.slug ?? currentDraft.slug ?? null,
      publicUrl: savedPost?.public_url || savedPost?.publicUrl || currentDraft.publicUrl || null,
      publishAt: savedPost?.publish_at ?? savedPost?.publishAt ?? currentDraft.publishAt ?? null,
    });
    if (postSlugInput && savedPost?.slug) {
      postSlugInput.value = savedPost.slug;
    }
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
  autosaveState = {
    ...autosaveState,
    dirty: true,
    error: null,
  };
  updateAutosaveStatus();
  schedulePreviewUpdate();
  autosaveTimer = setTimeout(() => {
    saveDraftToApi(titleInput.value);
  }, 15000);
}

titleInput.addEventListener('input', handleAutosave);
bodyInput.addEventListener('input', handleAutosave);
if (categorySelect) {
  categorySelect.addEventListener('change', handleAutosave);
}
if (postSlugInput) {
  postSlugInput.addEventListener('input', handleAutosave);
}

if (editorJsContainer) {
  initEditorJs();
  initCustomToolbar();
}
initMarkdownToolbar();
if (editorModeToggle) {
  editorModeToggle.addEventListener('click', async () => {
    const nextMode = editorMode === 'markdown' ? 'rich' : 'markdown';
    await setEditorMode(nextMode);
    handleAutosave();
  });
}

manualSaveBtn.addEventListener('click', () => {
  saveDraftToApi(titleInput.value);
});

retrySaveBtn.addEventListener('click', () => {
  saveDraftToApi(titleInput.value);
});

clearDraftBtn.addEventListener('click', () => {
  localStorage.removeItem(DRAFT_KEY);
  currentDraft = {
    id: null,
    title: '',
    body: '',
    bodyJson: null,
    savedAt: null,
    status: null,
    categorySlug: '',
    type: 'post',
    slug: null,
    publicUrl: null,
  };
  titleInput.value = '';
  if (categorySelect) categorySelect.value = '';
  if (postSlugInput) postSlugInput.value = '';
  updatePostSlugFieldVisibility();
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
    type: rawPost?.type || 'post',
    updatedAt: rawPost?.updated_at_iso || rawPost?.updated_at || rawPost?.saved_at || null,
    publishedAt: rawPost?.published_at_iso || rawPost?.published_at || rawPost?.publishedAt || null,
    publishAt: rawPost?.publish_at ?? rawPost?.publishAt ?? null,
    slug: rawPost?.slug || rawPost?.slug_id || rawPost?.slugId || null,
    publicUrl: rawPost?.public_url || rawPost?.publicUrl || null,
    body: rawPost?.body_md || rawPost?.body || '',
    bodyJson: rawPost?.body_json || rawPost?.bodyJson || null,
    categorySlug: rawPost?.category_slug || rawPost?.categorySlug || '',
    viewCount: Number(rawPost?.view_count ?? rawPost?.viewCount ?? 0) || 0,
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

function normalizeInquiry(rawInquiry) {
  const createdAtValue = rawInquiry?.created_at_iso || rawInquiry?.createdAtIso || rawInquiry?.created_at || rawInquiry?.createdAt;
  let createdAt = null;
  if (typeof createdAtValue === 'string') {
    createdAt = createdAtValue;
  } else if (typeof createdAtValue === 'number') {
    const millis = createdAtValue > 1e12 ? createdAtValue : createdAtValue * 1000;
    createdAt = new Date(millis).toISOString();
  }
  return {
    id: rawInquiry?.id,
    type: rawInquiry?.type || 'contact',
    data: rawInquiry?.data ?? {},
    isRead: rawInquiry?.is_read === true || rawInquiry?.is_read === 1 || rawInquiry?.isRead === true,
    createdAt,
  };
}

function renderCategories() {
  if (categoriesList) {
    categoriesList.innerHTML = '';
  }
  if (!currentCategories.length) {
    if (categoriesStatus) {
      categoriesStatus.textContent = '카테고리가 없습니다.';
    }
    renderCategorySelect();
    return;
  }
  if (categoriesStatus) {
    categoriesStatus.textContent = `${currentCategories.length}개 카테고리`;
  }
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
    if (categoriesList) {
      categoriesList.appendChild(item);
    }
  });
  renderCategorySelect();
  renderPostsCategoryFilter();
}

function renderCategorySelect() {
  if (!categorySelect) return;
  categorySelect.innerHTML = '<option value="">선택 안 함</option>';
  currentCategories
    .filter((category) => category.enabled)
    .forEach((category) => {
      const option = document.createElement('option');
      option.value = category.slug || '';
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
  categorySelect.value = currentDraft?.categorySlug || '';
}

function renderPostsCategoryFilter() {
  if (!postsCategoryFilter) return;
  const selected = postsView.category;
  const sorted = currentCategories.slice().sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  postsCategoryFilter.innerHTML = '';

  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = '전체 카테고리';
  postsCategoryFilter.appendChild(allOption);

  const uncategorizedOption = document.createElement('option');
  uncategorizedOption.value = 'uncategorized';
  uncategorizedOption.textContent = '미분류';
  postsCategoryFilter.appendChild(uncategorizedOption);

  sorted.forEach((category) => {
    const option = document.createElement('option');
    option.value = category.slug || '';
    option.textContent = category.name;
    postsCategoryFilter.appendChild(option);
  });

  postsCategoryFilter.value = selected;
}

async function fetchCategories() {
  if (!categoriesStatus) return;
  try {
    setStatus(categoriesStatus, '불러오는 중...');
    const data = await apiFetch('/cms/categories');
    const categories = data?.categories || [];
    currentCategories = categories.map(normalizeCategory);
    renderCategories();
    renderPostsCategoryFilter();
    renderNavTargetOptions();
  } catch (error) {
    setStatus(categoriesStatus, formatError(error), true);
  }
}

async function fetchPagesForNav() {
  if (!navLinkTargetSelect) return;
  if (!currentSession || isEditorSession()) return;
  try {
    const data = await apiFetch('/cms/posts?type=page');
    const posts = data?.posts || data?.items || [];
    currentPages = posts.map(normalizePost).filter((post) => post.type === 'page');
    renderNavTargetOptions();
  } catch (error) {
    if (navStatus) setStatus(navStatus, formatError(error), true);
  }
}

function formatInquiryData(data) {
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.warn('Failed to stringify inquiry data', error);
    return String(data);
  }
}

function renderInquiries() {
  if (!inquiriesList) return;
  inquiriesList.innerHTML = '';

  if (!currentInquiries.length) {
    if (inquiriesStatus) setStatus(inquiriesStatus, '문의가 없습니다.');
    return;
  }

  if (inquiriesStatus) {
    setStatus(inquiriesStatus, `${currentInquiries.length}건`);
  }

  currentInquiries.forEach((inquiry) => {
    const details = document.createElement('details');
    details.className = 'inquiry-item';
    if (!inquiry.isRead) {
      details.dataset.unread = 'true';
    }

    const summary = document.createElement('summary');
    const title = document.createElement('span');
    title.textContent = inquiry.type || 'contact';
    const status = document.createElement('span');
    status.textContent = inquiry.isRead ? '읽음' : '미확인';
    summary.append(title, status);

    const meta = document.createElement('div');
    meta.className = 'inquiry-meta';
    const createdLabel = document.createElement('span');
    createdLabel.textContent = inquiry.createdAt ? formatTime(new Date(inquiry.createdAt)) : '-';
    meta.append(createdLabel);

    const pre = document.createElement('pre');
    pre.textContent = formatInquiryData(inquiry.data);

    details.append(summary, meta, pre);

    details.addEventListener('toggle', async () => {
      if (!details.open || inquiry.isRead) return;
      try {
        const updated = await apiFetch(`/cms/inquiries/${inquiry.id}/read`, { method: 'PATCH' });
        const normalized = normalizeInquiry(updated?.inquiry || updated);
        inquiry.isRead = normalized.isRead;
        status.textContent = inquiry.isRead ? '읽음' : '미확인';
        details.dataset.unread = inquiry.isRead ? 'false' : 'true';
      } catch (error) {
        console.warn('Failed to mark inquiry read', error);
      }
    });

    inquiriesList.appendChild(details);
  });
}

async function fetchInquiries() {
  try {
    if (inquiriesStatus) setStatus(inquiriesStatus, '불러오는 중...');
    const data = await apiFetch('/cms/inquiries');
    const items = data?.inquiries || data?.items || data?.data || [];
    currentInquiries = items.map(normalizeInquiry);
    renderInquiries();
  } catch (error) {
    if (inquiriesStatus) setStatus(inquiriesStatus, formatError(error), true);
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
      setActiveTenant(tenant.id);
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
    syncActiveTenantFromList();
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
  if (!selectedThemePresetId && currentThemeConfig.presetId) {
    selectedThemePresetId = currentThemeConfig.presetId;
  }
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
      <span class="muted">${preset.description || ''}</span>
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
    selectedThemePresetId = currentThemeConfig.presetId;
    renderThemeCurrent();
    renderThemePresets();
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

function normalizePopup(raw) {
  return {
    id: raw?.id || '',
    title: raw?.title || '',
    content: raw?.content || '',
    type: raw?.type || 'modal',
    startAt: raw?.start_at ?? null,
    endAt: raw?.end_at ?? null,
    isActive: Boolean(raw?.is_active),
    createdAt: raw?.created_at ?? null,
  };
}

function normalizeBanner(raw) {
  return {
    id: raw?.id || '',
    location: raw?.location || 'home_top',
    imageUrl: raw?.image_url || '',
    linkUrl: raw?.link_url || '',
    orderIndex: Number.isFinite(Number(raw?.order_index)) ? Number(raw.order_index) : null,
    isActive: Boolean(raw?.is_active),
  };
}

function popupTypeLabel(type) {
  switch (type) {
    case 'topbar':
      return 'Top Bar';
    case 'bottombar':
      return 'Bottom Bar';
    default:
      return 'Modal';
  }
}

function bannerLocationLabel(location) {
  switch (location) {
    case 'sidebar':
      return 'Sidebar';
    case 'post_bottom':
      return 'Post Bottom';
    default:
      return 'Home Top';
  }
}

function previewPopupContent(content) {
  if (!content) return '-';
  const text = String(content).replace(/<[^>]*>/g, '').trim();
  if (!text) return '-';
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

function resetPopupForm() {
  if (popupForm) popupForm.dataset.editingId = '';
  if (popupTitleInput) popupTitleInput.value = '';
  if (popupTypeInput) popupTypeInput.value = 'modal';
  if (popupContentInput) popupContentInput.value = '';
  if (popupStartInput) popupStartInput.value = '';
  if (popupEndInput) popupEndInput.value = '';
  if (popupActiveInput) popupActiveInput.checked = true;
  if (popupFormStatus) setStatus(popupFormStatus, '');
}

function resetBannerForm() {
  if (bannerForm) bannerForm.dataset.editingId = '';
  if (bannerLocationInput) bannerLocationInput.value = 'home_top';
  if (bannerImageInput) bannerImageInput.value = '';
  if (bannerLinkInput) bannerLinkInput.value = '';
  if (bannerOrderInput) bannerOrderInput.value = '';
  if (bannerActiveInput) bannerActiveInput.checked = true;
  if (bannerFormStatus) setStatus(bannerFormStatus, '');
}

function renderPopups() {
  if (!popupsList || !popupsStatus) return;
  popupsList.innerHTML = '';
  if (!currentPopups.length) {
    popupsStatus.textContent = '팝업이 없습니다.';
    return;
  }
  popupsStatus.textContent = `${currentPopups.length}개 팝업`;
  currentPopups.forEach((popup) => {
    const item = document.createElement('div');
    item.className = 'category-item';

    const info = document.createElement('div');
    info.className = 'stack';
    const title = document.createElement('strong');
    title.textContent = popup.title || '제목 없음';
    const meta = document.createElement('div');
    meta.className = 'muted';
    const periodLabel = `${formatUnixSeconds(popup.startAt)} ~ ${formatUnixSeconds(popup.endAt)}`;
    meta.textContent = `${popupTypeLabel(popup.type)} · ${periodLabel}`;
    const preview = document.createElement('div');
    preview.className = 'muted';
    preview.textContent = previewPopupContent(popup.content);
    info.appendChild(title);
    info.appendChild(meta);
    info.appendChild(preview);

    const actions = document.createElement('div');
    actions.className = 'row gap';
    const statusBadge = document.createElement('span');
    statusBadge.className = `badge ${popup.isActive ? 'badge-published' : 'badge-draft'}`;
    statusBadge.textContent = popup.isActive ? 'active' : 'inactive';
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'ghost';
    editBtn.textContent = '편집';
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'ghost danger';
    deleteBtn.textContent = '삭제';
    actions.appendChild(statusBadge);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    editBtn.addEventListener('click', () => {
      if (!popupForm) return;
      popupForm.dataset.editingId = popup.id;
      if (popupTitleInput) popupTitleInput.value = popup.title || '';
      if (popupTypeInput) popupTypeInput.value = popup.type || 'modal';
      if (popupContentInput) popupContentInput.value = popup.content || '';
      if (popupStartInput) {
        popupStartInput.value = popup.startAt ? formatDatetimeLocal(popup.startAt * 1000) : '';
      }
      if (popupEndInput) {
        popupEndInput.value = popup.endAt ? formatDatetimeLocal(popup.endAt * 1000) : '';
      }
      if (popupActiveInput) popupActiveInput.checked = Boolean(popup.isActive);
      if (popupFormStatus) setStatus(popupFormStatus, `편집 중: ${popup.title}`);
    });

    deleteBtn.addEventListener('click', async () => {
      if (!popup.id) return;
      if (!confirm('팝업을 삭제할까요?')) return;
      await deletePopup(popup.id);
    });

    item.appendChild(info);
    item.appendChild(actions);
    popupsList.appendChild(item);
  });
}

function renderBanners() {
  if (!bannersList || !bannersStatus) return;
  bannersList.innerHTML = '';
  if (!currentBanners.length) {
    bannersStatus.textContent = '배너가 없습니다.';
    return;
  }
  bannersStatus.textContent = `${currentBanners.length}개 배너`;
  currentBanners.forEach((banner) => {
    const item = document.createElement('div');
    item.className = 'category-item';

    const info = document.createElement('div');
    info.className = 'row gap';
    const thumb = document.createElement('img');
    thumb.src = banner.imageUrl || '';
    thumb.alt = '배너 이미지';
    thumb.style.width = '64px';
    thumb.style.height = '40px';
    thumb.style.objectFit = 'cover';
    thumb.style.borderRadius = '8px';
    const text = document.createElement('div');
    text.className = 'stack';
    const title = document.createElement('strong');
    title.textContent = bannerLocationLabel(banner.location);
    const meta = document.createElement('div');
    meta.className = 'muted';
    meta.textContent = `순서: ${banner.orderIndex ?? '-'}`;
    const link = document.createElement('div');
    link.className = 'muted';
    link.textContent = banner.linkUrl || '-';
    text.appendChild(title);
    text.appendChild(meta);
    text.appendChild(link);
    info.appendChild(thumb);
    info.appendChild(text);

    const actions = document.createElement('div');
    actions.className = 'row gap';
    const statusBadge = document.createElement('span');
    statusBadge.className = `badge ${banner.isActive ? 'badge-published' : 'badge-draft'}`;
    statusBadge.textContent = banner.isActive ? 'active' : 'inactive';
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'ghost';
    editBtn.textContent = '편집';
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'ghost danger';
    deleteBtn.textContent = '삭제';
    actions.appendChild(statusBadge);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    editBtn.addEventListener('click', () => {
      if (!bannerForm) return;
      bannerForm.dataset.editingId = banner.id;
      if (bannerLocationInput) bannerLocationInput.value = banner.location || 'home_top';
      if (bannerImageInput) bannerImageInput.value = banner.imageUrl || '';
      if (bannerLinkInput) bannerLinkInput.value = banner.linkUrl || '';
      if (bannerOrderInput) bannerOrderInput.value = banner.orderIndex ?? '';
      if (bannerActiveInput) bannerActiveInput.checked = Boolean(banner.isActive);
      if (bannerFormStatus) setStatus(bannerFormStatus, `편집 중: ${bannerLocationLabel(banner.location)}`);
    });

    deleteBtn.addEventListener('click', async () => {
      if (!banner.id) return;
      if (!confirm('배너를 삭제할까요?')) return;
      await deleteBanner(banner.id);
    });

    item.appendChild(info);
    item.appendChild(actions);
    bannersList.appendChild(item);
  });
}

async function fetchPopups() {
  if (!popupsStatus) return;
  if (!currentSession || isEditorSession()) return;
  try {
    setStatus(popupsStatus, '불러오는 중...');
    const data = await apiFetch('/cms/popups');
    currentPopups = (data?.popups || []).map(normalizePopup);
    renderPopups();
  } catch (error) {
    setStatus(popupsStatus, formatError(error), true);
  }
}

async function fetchBanners() {
  if (!bannersStatus) return;
  if (!currentSession || isEditorSession()) return;
  try {
    setStatus(bannersStatus, '불러오는 중...');
    const data = await apiFetch('/cms/banners');
    currentBanners = (data?.banners || []).map(normalizeBanner);
    renderBanners();
  } catch (error) {
    setStatus(bannersStatus, formatError(error), true);
  }
}

async function savePopup() {
  if (!popupForm) return;
  const title = popupTitleInput?.value.trim();
  const content = popupContentInput?.value.trim();
  const type = popupTypeInput?.value;
  if (!title || !content || !type) {
    if (popupFormStatus) setStatus(popupFormStatus, '제목/내용/유형을 입력하세요.', true);
    return;
  }
  const startAt = parseDatetimeInput(popupStartInput?.value);
  const endAt = parseDatetimeInput(popupEndInput?.value);
  if (startAt === undefined || endAt === undefined) {
    if (popupFormStatus) setStatus(popupFormStatus, '날짜 형식이 올바르지 않습니다.', true);
    return;
  }
  const payload = {
    title,
    content,
    type,
    start_at: startAt,
    end_at: endAt,
    is_active: Boolean(popupActiveInput?.checked),
  };
  try {
    if (popupFormStatus) setStatus(popupFormStatus, '저장 중...');
    const editingId = popupForm.dataset.editingId;
    if (editingId) {
      await apiFetch(`/cms/popups/${editingId}`, { method: 'PUT', body: payload });
    } else {
      await apiFetch('/cms/popups', { method: 'POST', body: payload });
    }
    resetPopupForm();
    await fetchPopups();
    if (popupFormStatus) setStatus(popupFormStatus, '저장 완료');
  } catch (error) {
    if (popupFormStatus) setStatus(popupFormStatus, formatError(error), true);
  }
}

async function deletePopup(id) {
  try {
    if (popupFormStatus) setStatus(popupFormStatus, '삭제 중...');
    await apiFetch(`/cms/popups/${id}`, { method: 'DELETE' });
    await fetchPopups();
    if (popupFormStatus) setStatus(popupFormStatus, '삭제 완료');
  } catch (error) {
    if (popupFormStatus) setStatus(popupFormStatus, formatError(error), true);
  }
}

async function saveBanner() {
  if (!bannerForm) return;
  const location = bannerLocationInput?.value;
  const imageUrl = bannerImageInput?.value.trim();
  const linkUrl = bannerLinkInput?.value.trim();
  if (!location || !imageUrl || !linkUrl) {
    if (bannerFormStatus) setStatus(bannerFormStatus, '위치/이미지/링크를 입력하세요.', true);
    return;
  }
  let orderIndex = bannerOrderInput?.value;
  if (orderIndex === '') {
    orderIndex = null;
  }
  if (orderIndex !== null && orderIndex !== undefined && Number.isNaN(Number(orderIndex))) {
    if (bannerFormStatus) setStatus(bannerFormStatus, '순서는 숫자여야 합니다.', true);
    return;
  }
  const payload = {
    location,
    image_url: imageUrl,
    link_url: linkUrl,
    order_index: orderIndex === null ? null : Number(orderIndex),
    is_active: Boolean(bannerActiveInput?.checked),
  };
  try {
    if (bannerFormStatus) setStatus(bannerFormStatus, '저장 중...');
    const editingId = bannerForm.dataset.editingId;
    if (editingId) {
      await apiFetch(`/cms/banners/${editingId}`, { method: 'PUT', body: payload });
    } else {
      await apiFetch('/cms/banners', { method: 'POST', body: payload });
    }
    resetBannerForm();
    await fetchBanners();
    if (bannerFormStatus) setStatus(bannerFormStatus, '저장 완료');
  } catch (error) {
    if (bannerFormStatus) setStatus(bannerFormStatus, formatError(error), true);
  }
}

async function deleteBanner(id) {
  try {
    if (bannerFormStatus) setStatus(bannerFormStatus, '삭제 중...');
    await apiFetch(`/cms/banners/${id}`, { method: 'DELETE' });
    await fetchBanners();
    if (bannerFormStatus) setStatus(bannerFormStatus, '삭제 완료');
  } catch (error) {
    if (bannerFormStatus) setStatus(bannerFormStatus, formatError(error), true);
  }
}

function getHomeSectionDefaults(type) {
  switch (type) {
    case 'hero':
      return { title: '주요 뉴스', limit: 1 };
    case 'latest':
      return { title: '최신글', limit: 6 };
    case 'popular':
      return { title: '인기글', limit: 6 };
    case 'pick':
      return { title: 'Pick', limit: 6 };
    case 'banner':
      return {
        title: '환영합니다',
        subtitle: '브랜드 메시지를 입력하세요.',
        image_url: '',
        button_text: '자세히 보기',
        button_link: '/',
        height_size: 'md',
      };
    case 'features':
      return {
        title: '핵심 특징',
        items: [
          { icon: '✨', title: '빠른 구축', description: '빠르게 시작할 수 있습니다.' },
          { icon: '🔒', title: '안전한 운영', description: '안정적으로 운영됩니다.' },
          { icon: '📈', title: '성장 지원', description: '성과를 높여줍니다.' },
        ],
      };
    case 'html':
      return { title: '임베드', raw_content: '<div>HTML 코드를 입력하세요.</div>' };
    default:
      return { title: '', limit: 6 };
  }
}

function createHomeSection(type) {
  const defaults = getHomeSectionDefaults(type);
  const id = (crypto && crypto.randomUUID && crypto.randomUUID()) || `section-${Date.now()}-${Math.random()}`;
  return {
    id,
    type,
    title: defaults.title,
    subtitle: defaults.subtitle,
    image_url: defaults.image_url,
    button_text: defaults.button_text,
    button_link: defaults.button_link,
    height_size: defaults.height_size,
    items: defaults.items,
    raw_content: defaults.raw_content,
    limit: defaults.limit,
    post_ids: type === 'pick' ? [] : undefined,
  };
}

function ensureHomeLayoutIds(layout) {
  return (Array.isArray(layout) ? layout : []).map((section) => {
    if (!section?.id) {
      return { ...section, id: createHomeSection(section.type || 'latest').id };
    }
    return section;
  });
}

function renderSiteConfigForm() {
  if (!siteLogoInput || !siteFooterInput) return;
  siteLogoInput.value = siteConfig.logo_url || '';
  siteFooterInput.value = siteConfig.footer_text || '';
  if (siteSearchEnabledInput) {
    siteSearchEnabledInput.checked = siteConfig.search_enabled !== false;
  }
}

function getNavLinkType() {
  return navLinkTypeSelect?.value || 'custom';
}

function renderNavTargetOptions() {
  if (!navLinkTargetSelect) return;
  const type = getNavLinkType();
  navLinkTargetSelect.innerHTML = '<option value="">선택하세요</option>';
  if (type === 'category') {
    currentCategories.forEach((category) => {
      if (!category.slug) return;
      const option = document.createElement('option');
      option.value = category.slug;
      option.textContent = category.name || category.slug;
      navLinkTargetSelect.appendChild(option);
    });
  }
  if (type === 'page') {
    currentPages.forEach((page) => {
      if (!page.slug) return;
      const option = document.createElement('option');
      option.value = page.slug;
      option.textContent = page.title || page.slug || '제목 없음';
      navLinkTargetSelect.appendChild(option);
    });
  }
  navLinkTargetSelect.disabled = type === 'custom';
}

function applyNavTargetSelection(slug, type = getNavLinkType()) {
  if (!slug) return;
  if (navUrlInput) {
    navUrlInput.value = type === 'category' ? `/category/${slug}/` : `/${slug}/`;
  }
  if (navLabelInput && !navLabelInput.value.trim()) {
    if (type === 'category') {
      const category = currentCategories.find((item) => item.slug === slug);
      if (category) navLabelInput.value = category.name || category.slug;
    }
    if (type === 'page') {
      const page = currentPages.find((item) => item.slug === slug);
      if (page) navLabelInput.value = page.title || page.slug;
    }
  }
}

function syncNavTargetSelection() {
  if (!navLinkTargetSelect) return;
  const slug = navLinkTargetSelect.value;
  if (!slug) return;
  applyNavTargetSelection(slug, getNavLinkType());
}

function inferNavLinkType(url) {
  if (!url) return { type: 'custom', slug: null };
  if (/^https?:\/\//i.test(url)) return { type: 'custom', slug: null };
  const categoryMatch = url.match(/^\/category\/([^/]+)\/?$/);
  if (categoryMatch) {
    const slug = categoryMatch[1];
    if (currentCategories.some((item) => item.slug === slug)) {
      return { type: 'category', slug };
    }
  }
  const pageMatch = url.match(/^\/([^/]+)\/?$/);
  if (pageMatch) {
    const slug = pageMatch[1];
    if (currentPages.some((item) => item.slug === slug)) {
      return { type: 'page', slug };
    }
  }
  return { type: 'custom', slug: null };
}

function syncNavTypeAndTarget(url) {
  if (!navLinkTypeSelect) return;
  const { type, slug } = inferNavLinkType(url);
  navLinkTypeSelect.value = type;
  renderNavTargetOptions();
  if (navLinkTargetSelect) {
    navLinkTargetSelect.value = slug || '';
  }
}

function renderSiteNavigations() {
  if (!navList) return;
  navList.innerHTML = '';
  if (!siteNavigations.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = '등록된 메뉴가 없습니다.';
    navList.appendChild(empty);
    return;
  }
  const sorted = [...siteNavigations].sort((a, b) => {
    if (a.location !== b.location) return a.location.localeCompare(b.location);
    if (a.order_index !== b.order_index) return a.order_index - b.order_index;
    return (a.created_at || 0) - (b.created_at || 0);
  });
  sorted.forEach((item) => {
    const container = document.createElement('div');
    container.className = 'site-nav-item';
    const meta = document.createElement('div');
    meta.className = 'site-nav-meta';
    meta.innerHTML = `
      <strong>${item.label}</strong>
      <span class="muted">${item.location === 'header' ? '헤더' : '푸터'} · 순서 ${item.order_index}</span>
    `;
    const urlEl = document.createElement('div');
    urlEl.className = 'muted';
    urlEl.textContent = item.url;
    const actions = document.createElement('div');
    actions.className = 'site-nav-actions';
    actions.innerHTML = `
      <button type="button" class="ghost" data-nav-edit="${item.id}">편집</button>
      <button type="button" class="ghost" data-nav-up="${item.id}">위로</button>
      <button type="button" class="ghost" data-nav-down="${item.id}">아래로</button>
      <button type="button" class="ghost danger" data-nav-delete="${item.id}">삭제</button>
    `;
    container.appendChild(meta);
    container.appendChild(urlEl);
    container.appendChild(actions);
    navList.appendChild(container);

    const editBtn = actions.querySelector('[data-nav-edit]');
    const deleteBtn = actions.querySelector('[data-nav-delete]');
    const upBtn = actions.querySelector('[data-nav-up]');
    const downBtn = actions.querySelector('[data-nav-down]');

    editBtn.addEventListener('click', () => {
      editingNavId = item.id;
      if (navLocationInput) navLocationInput.value = item.location;
      if (navLabelInput) navLabelInput.value = item.label;
      if (navUrlInput) navUrlInput.value = item.url;
      if (navLinkTypeSelect) {
        syncNavTypeAndTarget(item.url);
      }
      if (navStatus) setStatus(navStatus, '편집 모드입니다. 저장하면 기존 메뉴가 수정됩니다.');
    });

    deleteBtn.addEventListener('click', async () => {
      try {
        await apiFetch(`/cms/site-navigations/${item.id}`, { method: 'DELETE' });
        siteNavigations = siteNavigations.filter((entry) => entry.id !== item.id);
        renderSiteNavigations();
      } catch (error) {
        if (navStatus) setStatus(navStatus, formatError(error), true);
      }
    });

    const moveItem = async (direction) => {
      const siblings = sorted.filter((nav) => nav.location === item.location);
      const index = siblings.findIndex((nav) => nav.id === item.id);
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= siblings.length) return;
      const target = siblings[targetIndex];
      const payloads = [
        apiFetch(`/cms/site-navigations/${item.id}`, { method: 'PATCH', body: { order_index: target.order_index } }),
        apiFetch(`/cms/site-navigations/${target.id}`, { method: 'PATCH', body: { order_index: item.order_index } }),
      ];
      try {
        const [updatedItem, updatedTarget] = await Promise.all(payloads);
        siteNavigations = siteNavigations.map((nav) => {
          if (nav.id === item.id) return updatedItem.item;
          if (nav.id === target.id) return updatedTarget.item;
          return nav;
        });
        renderSiteNavigations();
      } catch (error) {
        if (navStatus) setStatus(navStatus, formatError(error), true);
      }
    };

    upBtn.addEventListener('click', () => moveItem('up'));
    downBtn.addEventListener('click', () => moveItem('down'));
  });
}

function renderHomeLayoutEditor() {
  if (!homeLayoutList) return;
  homeLayoutList.innerHTML = '';
  if (!Array.isArray(siteConfig.home_layout) || !siteConfig.home_layout.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = '섹션이 없습니다. 버튼으로 추가하세요.';
    homeLayoutList.appendChild(empty);
    return;
  }
  siteConfig.home_layout.forEach((section, index) => {
    const container = document.createElement('div');
    container.className = 'site-layout-item';
    const header = document.createElement('div');
    header.className = 'site-layout-header';
    header.innerHTML = `
      <strong>${section.type.toUpperCase()}</strong>
      <div class="site-nav-actions">
        <button type="button" class="ghost" data-layout-up="${section.id}">위로</button>
        <button type="button" class="ghost" data-layout-down="${section.id}">아래로</button>
        <button type="button" class="ghost danger" data-layout-delete="${section.id}">삭제</button>
      </div>
    `;
    const fields = document.createElement('div');
    fields.className = 'site-layout-fields';

    const createInputField = (labelText, value, onChange, options = {}) => {
      const field = document.createElement('label');
      field.className = 'field';
      const input = document.createElement('input');
      input.type = options.type || 'text';
      if (options.placeholder) input.placeholder = options.placeholder;
      if (options.min !== undefined) input.min = options.min;
      input.value = value || '';
      input.addEventListener('input', (event) => onChange(event.target.value));
      field.appendChild(document.createElement('span')).textContent = labelText;
      field.appendChild(input);
      return { field, input };
    };

    const createTextareaField = (labelText, value, onChange) => {
      const field = document.createElement('label');
      field.className = 'field';
      const textarea = document.createElement('textarea');
      textarea.rows = 4;
      textarea.value = value || '';
      textarea.addEventListener('input', (event) => onChange(event.target.value));
      field.appendChild(document.createElement('span')).textContent = labelText;
      field.appendChild(textarea);
      return { field, textarea };
    };

    const createSelectField = (labelText, value, options, onChange) => {
      const field = document.createElement('label');
      field.className = 'field';
      const select = document.createElement('select');
      options.forEach((option) => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.label;
        select.appendChild(opt);
      });
      select.value = value || options[0]?.value || '';
      select.addEventListener('change', (event) => onChange(event.target.value));
      field.appendChild(document.createElement('span')).textContent = labelText;
      field.appendChild(select);
      return { field, select };
    };

    if (['hero', 'latest', 'popular', 'pick'].includes(section.type)) {
      const { field: titleField } = createInputField('섹션 타이틀', section.title || '', (value) => {
        section.title = value;
      });
      const { field: limitField, input: limitInput } = createInputField(
        '표시 수',
        section.limit || 1,
        (value) => {
          const num = Number(value);
          section.limit = Number.isFinite(num) && num > 0 ? num : null;
        },
        { type: 'number', min: 1 }
      );
      fields.appendChild(titleField);
      fields.appendChild(limitField);

      if (section.type === 'pick') {
        const picksWrapper = document.createElement('div');
        picksWrapper.className = 'site-layout-picks';
        const pickLabel = document.createElement('span');
        pickLabel.className = 'muted';
        pickLabel.textContent = 'Pick 게시글 선택';
        const select = document.createElement('select');
        select.multiple = true;
        allPosts.forEach((post) => {
          const option = document.createElement('option');
          option.value = post.id;
          option.textContent = post.title || post.slug;
          if (Array.isArray(section.post_ids) && section.post_ids.includes(post.id)) {
            option.selected = true;
          }
          select.appendChild(option);
        });
        select.addEventListener('change', () => {
          section.post_ids = Array.from(select.selectedOptions).map((option) => option.value);
        });
        picksWrapper.appendChild(pickLabel);
        picksWrapper.appendChild(select);
        fields.appendChild(picksWrapper);
      }
    } else if (section.type === 'banner') {
      const { field: titleField } = createInputField('제목', section.title || '', (value) => {
        section.title = value;
      });
      const { field: subtitleField } = createInputField('내용', section.subtitle || '', (value) => {
        section.subtitle = value;
      });
      const { field: imageField, input: imageInput } = createInputField(
        '배경 이미지 URL',
        section.image_url || '',
        (value) => {
          section.image_url = value;
        },
        { placeholder: 'https://...' }
      );
      const uploadField = document.createElement('label');
      uploadField.className = 'field';
      uploadField.innerHTML = '<span>이미지 업로드</span>';
      const uploadInput = document.createElement('input');
      uploadInput.type = 'file';
      uploadInput.accept = 'image/*';
      uploadInput.addEventListener('change', async () => {
        const file = uploadInput.files && uploadInput.files[0];
        if (!file) return;
        try {
          const url = await uploadImageAsset(file);
          section.image_url = url;
          imageInput.value = url;
        } catch (error) {
          console.error('Banner upload failed', error);
          if (homeLayoutStatus) setStatus(homeLayoutStatus, '이미지 업로드 실패', true);
        }
      });
      uploadField.appendChild(uploadInput);
      const { field: buttonTextField } = createInputField('버튼 텍스트', section.button_text || '', (value) => {
        section.button_text = value;
      });
      const { field: buttonLinkField } = createInputField(
        '버튼 링크',
        section.button_link || '',
        (value) => {
          section.button_link = value;
        },
        { placeholder: '/contact' }
      );
      const { field: heightField, select: heightSelect } = createSelectField(
        '높이',
        section.height_size || 'md',
        [
          { value: 'sm', label: '작게' },
          { value: 'md', label: '보통' },
          { value: 'lg', label: '크게' },
        ],
        (value) => {
          section.height_size = value;
        }
      );
      fields.appendChild(titleField);
      fields.appendChild(subtitleField);
      fields.appendChild(imageField);
      fields.appendChild(uploadField);
      fields.appendChild(buttonTextField);
      fields.appendChild(buttonLinkField);
      fields.appendChild(heightField);
    } else if (section.type === 'features') {
      const { field: titleField } = createInputField('섹션 타이틀', section.title || '', (value) => {
        section.title = value;
      });
      fields.appendChild(titleField);

      if (!Array.isArray(section.items)) {
        section.items = [];
      }
      const itemsWrapper = document.createElement('div');
      itemsWrapper.className = 'site-layout-features';
      section.items.forEach((item, itemIndex) => {
        const row = document.createElement('div');
        row.className = 'site-layout-feature-row';
        const { field: iconField } = createInputField('아이콘', item.icon || '', (value) => {
          item.icon = value;
        });
        const { field: itemTitleField } = createInputField('제목', item.title || '', (value) => {
          item.title = value;
        });
        const { field: descField } = createTextareaField('설명', item.description || '', (value) => {
          item.description = value;
        });
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'ghost danger';
        removeBtn.textContent = '삭제';
        removeBtn.addEventListener('click', () => {
          section.items.splice(itemIndex, 1);
          renderHomeLayoutEditor();
        });
        row.appendChild(iconField);
        row.appendChild(itemTitleField);
        row.appendChild(descField);
        row.appendChild(removeBtn);
        itemsWrapper.appendChild(row);
      });
      const addItemBtn = document.createElement('button');
      addItemBtn.type = 'button';
      addItemBtn.className = 'ghost';
      addItemBtn.textContent = '특징 추가';
      addItemBtn.addEventListener('click', () => {
        section.items.push({ icon: '✨', title: '', description: '' });
        renderHomeLayoutEditor();
      });
      fields.appendChild(itemsWrapper);
      fields.appendChild(addItemBtn);
    } else if (section.type === 'html') {
      const { field: titleField } = createInputField('섹션 타이틀', section.title || '', (value) => {
        section.title = value;
      });
      const { field: htmlField } = createTextareaField('HTML/임베드 코드', section.raw_content || '', (value) => {
        section.raw_content = value;
      });
      fields.appendChild(titleField);
      fields.appendChild(htmlField);
    }

    container.appendChild(header);
    container.appendChild(fields);
    homeLayoutList.appendChild(container);

    const upBtn = header.querySelector('[data-layout-up]');
    const downBtn = header.querySelector('[data-layout-down]');
    const deleteBtn = header.querySelector('[data-layout-delete]');

    upBtn.addEventListener('click', () => {
      if (index === 0) return;
      const next = [...siteConfig.home_layout];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      siteConfig.home_layout = next;
      renderHomeLayoutEditor();
    });

    downBtn.addEventListener('click', () => {
      if (index === siteConfig.home_layout.length - 1) return;
      const next = [...siteConfig.home_layout];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      siteConfig.home_layout = next;
      renderHomeLayoutEditor();
    });

    deleteBtn.addEventListener('click', () => {
      siteConfig.home_layout = siteConfig.home_layout.filter((_, idx) => idx !== index);
      renderHomeLayoutEditor();
    });
  });
}

async function fetchSiteConfig() {
  if (!siteConfigStatus) return;
  if (!currentSession || isEditorSession()) return;
  try {
    setStatus(siteConfigStatus, '불러오는 중...');
    const data = await apiFetch('/cms/site-config');
    siteConfig = {
      logo_url: data?.config?.logo_url || '',
      footer_text: data?.config?.footer_text || '',
      home_layout: ensureHomeLayoutIds(Array.isArray(data?.config?.home_layout) ? data.config.home_layout : []),
      search_enabled: data?.config?.search_enabled !== false,
    };
    renderSiteConfigForm();
    renderHomeLayoutEditor();
    setStatus(siteConfigStatus, '불러오기 완료');
  } catch (error) {
    setStatus(siteConfigStatus, formatError(error), true);
  }
}

async function saveSiteConfig(payloadOverrides = {}, statusEl = siteConfigSaveStatus) {
  if (isEditorSession()) {
    if (statusEl) setStatus(statusEl, '권한이 없습니다.', true);
    return;
  }
  try {
    if (statusEl) setStatus(statusEl, '저장 중...');
    const payload = {
      logo_url: siteLogoInput ? siteLogoInput.value.trim() : siteConfig.logo_url,
      footer_text: siteFooterInput ? siteFooterInput.value.trim() : siteConfig.footer_text,
      home_layout: ensureHomeLayoutIds(siteConfig.home_layout),
      search_enabled: siteSearchEnabledInput ? siteSearchEnabledInput.checked : siteConfig.search_enabled,
      ...payloadOverrides,
    };
    const data = await apiFetch('/cms/site-config', { method: 'PUT', body: payload });
    siteConfig = {
      logo_url: data?.config?.logo_url || '',
      footer_text: data?.config?.footer_text || '',
      home_layout: ensureHomeLayoutIds(Array.isArray(data?.config?.home_layout) ? data.config.home_layout : []),
      search_enabled: data?.config?.search_enabled !== false,
    };
    renderSiteConfigForm();
    renderHomeLayoutEditor();
    if (statusEl) setStatus(statusEl, '저장 완료');
  } catch (error) {
    if (statusEl) setStatus(statusEl, formatError(error), true);
  }
}

async function fetchSiteNavigations() {
  if (!navStatus) return;
  if (!currentSession || isEditorSession()) return;
  try {
    setStatus(navStatus, '불러오는 중...');
    const data = await apiFetch('/cms/site-navigations');
    siteNavigations = data?.items || [];
    renderSiteNavigations();
    renderNavTargetOptions();
    setStatus(navStatus, '');
  } catch (error) {
    setStatus(navStatus, formatError(error), true);
  }
}

async function saveNavigationItem(payload) {
  try {
    if (navStatus) setStatus(navStatus, '저장 중...');
    if (editingNavId) {
      const data = await apiFetch(`/cms/site-navigations/${editingNavId}`, { method: 'PATCH', body: payload });
      siteNavigations = siteNavigations.map((item) => (item.id === editingNavId ? data.item : item));
      editingNavId = null;
      if (navStatus) setStatus(navStatus, '수정 완료');
    } else {
      const data = await apiFetch('/cms/site-navigations', { method: 'POST', body: payload });
      siteNavigations = [...siteNavigations, data.item];
      if (navStatus) setStatus(navStatus, '추가 완료');
    }
    renderSiteNavigations();
  } catch (error) {
    if (navStatus) setStatus(navStatus, formatError(error), true);
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
  if (postsView.type) {
    list = list.filter((post) => (post.type || 'post') === postsView.type);
  }
  if (query) {
    list = list.filter((post) => (post.title || '').toLowerCase().includes(query));
  }
  if (postsView.category && postsView.category !== 'all') {
    if (postsView.category === 'uncategorized') {
      list = list.filter((post) => !post.categorySlug);
    } else {
      list = list.filter((post) => post.categorySlug === postsView.category);
    }
  }
  if (postsView.status === 'all') {
    list = list.filter((post) => post.status !== 'trashed');
  } else {
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
  visiblePostIds = [];
  updateBulkSelectionUI();
}

function renderPostsPagination(totalPages) {
  postsView.totalPages = totalPages;
  postsPrevBtn.disabled = postsView.page <= 1;
  postsNextBtn.disabled = postsView.page >= totalPages;
  postsPageInfo.textContent = `페이지 ${postsView.page} / ${totalPages}`;
}

function syncSelectedPosts() {
  const validIds = new Set(allPosts.map((post) => post.id));
  selectedPostIds = new Set([...selectedPostIds].filter((id) => validIds.has(id)));
}

function updateBulkSelectionUI() {
  const selectedCount = selectedPostIds.size;
  const hasSelection = selectedCount > 0;
  if (postsSelectionCount) {
    postsSelectionCount.textContent = hasSelection ? `${selectedCount}개 선택됨` : '선택된 게시물 없음';
  }
  [
    bulkTrashBtn,
    bulkUnpublishBtn,
    bulkRepublishBtn,
    bulkPublishBtn,
    bulkRestoreBtn,
    bulkDraftBtn,
    bulkPurgeBtn,
  ].forEach((button) => {
    if (button) button.disabled = !hasSelection;
  });

  if (postsSelectAll) {
    if (!visiblePostIds.length) {
      postsSelectAll.checked = false;
      postsSelectAll.indeterminate = false;
      postsSelectAll.disabled = true;
    } else {
      const selectedVisible = visiblePostIds.filter((id) => selectedPostIds.has(id));
      postsSelectAll.disabled = false;
      postsSelectAll.checked = selectedVisible.length === visiblePostIds.length;
      postsSelectAll.indeterminate = selectedVisible.length > 0 && selectedVisible.length < visiblePostIds.length;
    }
  }
  updateVisibleSelectionCheckboxes();
}

function setPostSelection(postId, isSelected) {
  if (!postId) return;
  if (isSelected) {
    selectedPostIds.add(postId);
  } else {
    selectedPostIds.delete(postId);
  }
  updateVisibleSelectionCheckboxes();
  updateBulkSelectionUI();
}

function clearPostSelection() {
  selectedPostIds = new Set();
  updateVisibleSelectionCheckboxes();
  updateBulkSelectionUI();
}

function updateVisibleSelectionCheckboxes() {
  const checkboxes = Array.from(postsListEl?.querySelectorAll('.post-select') || []);
  checkboxes.forEach((checkbox) => {
    if (!(checkbox instanceof HTMLInputElement)) return;
    const postId = checkbox.dataset.postId;
    checkbox.checked = Boolean(postId && selectedPostIds.has(postId));
  });
}

function updateBulkActionsVisibility() {
  const showTrashed = postsView.status === 'trashed';
  bulkDefaultActions.forEach((section) => section.classList.toggle('hidden', showTrashed));
  bulkTrashedActions.forEach((section) => section.classList.toggle('hidden', !showTrashed));
}

function updatePostFilterButtons() {
  postsFilterButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.postFilter === postsView.status);
  });
}

function setPostFilter(status) {
  postsView.status = status;
  postsView.page = 1;
  clearPostSelection();
  updatePostFilterButtons();
  updateBulkActionsVisibility();
  if (postsView.viewPeriod !== 'all' || postsView.viewSort !== 'recent') {
    fetchPosts();
  } else {
    renderPosts();
  }
}

const postStatusLabels = {
  draft: '임시 저장',
  scheduled: '발행 예약',
  published: '발행',
  paused: '게시 중단',
  trashed: '휴지통',
};

async function trashPost(postId) {
  if (!postId) return;
  await apiFetch(`/cms/posts/${postId}`, { method: 'DELETE' });
}

async function purgePost(postId) {
  if (!postId) return;
  await apiFetch(`/cms/posts/${postId}/purge`, { method: 'DELETE' });
}

async function unpublishPost(postId) {
  if (!postId) return;
  await apiFetch(`/cms/posts/${postId}/unpublish`, { method: 'POST' });
}

async function restorePost(postId) {
  if (!postId) return;
  await apiFetch(`/cms/posts/${postId}/autosave`, { method: 'POST', body: { status: 'paused' } });
}

async function draftPost(postId) {
  if (!postId) return;
  await apiFetch(`/cms/posts/${postId}/autosave`, { method: 'POST', body: { status: 'draft', publish_at: null } });
}

function getSelectedPosts() {
  return allPosts.filter((post) => selectedPostIds.has(post.id));
}

function setSelectionForVisible(selectAll) {
  visiblePostIds.forEach((postId) => {
    if (selectAll) {
      selectedPostIds.add(postId);
    } else {
      selectedPostIds.delete(postId);
    }
  });
  updateVisibleSelectionCheckboxes();
  updateBulkSelectionUI();
}

async function runBulkAction({ key, label, filter, handler }) {
  const selectedPosts = getSelectedPosts();
  const eligible = selectedPosts.filter(filter);
  if (!eligible.length) {
    setStatus(postsStatusEl, `선택한 게시글 중 ${label}할 수 있는 항목이 없습니다.`, true);
    return;
  }
  if (!window.confirm(`${eligible.length}개 게시글을 ${label}할까요?`)) return;
  try {
    setStatus(postsStatusEl, `${label} 처리 중...`);
    setGlobalLoading(true, `${label} 처리 중...`);
    for (const post of eligible) {
      await handler(post);
    }
    selectedPostIds = new Set();
    await fetchPosts();
    setStatus(postsStatusEl, `${label} 완료`);
  } catch (error) {
    setStatus(postsStatusEl, formatError(error), true);
  } finally {
    setGlobalLoading(false);
    updateBulkSelectionUI();
  }
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
    visiblePostIds = [];
    updateBulkSelectionUI();
    updateBulkActionsVisibility();
    return;
  }

  postsStatusEl.textContent = postsView.serverMode && postsView.status === 'all' && !postsView.search
    ? `${totalCount}건의 게시글`
    : `${pageItems.length}건 표시 중`;

  visiblePostIds = pageItems.map((post) => post.id);
  pageItems.forEach((post) => {
    const item = document.createElement('div');
    item.className = 'posts-row';
    if (!isDashboard) item.classList.add('is-clickable');
    if (!isDashboard && currentDraft?.id === post.id) item.classList.add('active');
    item.setAttribute('role', 'row');
    item.dataset.postId = post.id;
    const published = formatMaybeDate(post.publishedAt);
    const statusLabel = postStatusLabels[post.status] || post.status || '임시 저장';
    const viewCount = Number.isFinite(post.viewCount) ? post.viewCount : 0;
    const actions = [];
    if (post.status !== 'trashed') {
      actions.push({ key: 'edit', label: '수정' });
      actions.push({ key: 'trash', label: '휴지통', danger: true });
      if (post.status === 'published') {
        actions.push({ key: 'unpublish', label: '게시 중단', danger: true });
      }
      if (post.status === 'paused') {
        actions.push({ key: 'republish', label: '발행 재개' });
      }
    } else {
      actions.push({ key: 'restore', label: '복원' });
      actions.push({ key: 'draft', label: '임시 저장' });
      actions.push({ key: 'purge', label: '영구 삭제', danger: true });
    }
    item.innerHTML = `
      <div class="posts-cell posts-cell--select">
        <input type="checkbox" class="post-select" data-post-id="${post.id}" aria-label="${post.title || '제목 없음'} 선택" ${
          selectedPostIds.has(post.id) ? 'checked' : ''
        } />
      </div>
      <div class="posts-cell posts-title">
        <strong>${post.title || '제목 없음'}</strong>
      </div>
      <div class="posts-cell posts-status">
        <span class="badge badge-${post.status || 'draft'}">${statusLabel}</span>
      </div>
      <div class="posts-cell">${published}</div>
      <div class="posts-cell">${viewCount.toLocaleString()}</div>
      <div class="posts-cell posts-actions">
        ${actions
          .map(
            (action) =>
              `<button type="button" class="ghost${action.danger ? ' danger' : ''}" data-action="${action.key}">${
                action.label
              }</button>`
          )
          .join('')}
      </div>
    `;
    if (!isDashboard) {
      item.addEventListener('click', () => selectPost(post));
    }
    const checkbox = item.querySelector('.post-select');
    if (checkbox) {
      checkbox.addEventListener('click', (event) => {
        event.stopPropagation();
      });
      checkbox.addEventListener('change', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        setPostSelection(post.id, target.checked);
      });
    }
    const actionsEl = item.querySelector('.posts-actions');
    if (actionsEl) {
      actionsEl.addEventListener('click', async (event) => {
        event.stopPropagation();
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const action = target.dataset.action;
        if (action === 'edit') {
          window.location.href = `editor.html?postId=${post.id}`;
          return;
        }
        if (action === 'trash') {
          if (!window.confirm('이 게시글을 휴지통으로 보낼까요?')) return;
          try {
            target.setAttribute('disabled', 'true');
            setGlobalLoading(true, '휴지통으로 이동 중...');
            await trashPost(post.id);
            await fetchPosts();
          } catch (error) {
            setStatus(postsStatusEl, formatError(error), true);
          } finally {
            setGlobalLoading(false);
            target.removeAttribute('disabled');
          }
        }
        if (action === 'purge') {
          if (!window.confirm('이 게시글을 영구 삭제할까요?')) return;
          try {
            target.setAttribute('disabled', 'true');
            setGlobalLoading(true, '삭제 중...');
            await purgePost(post.id);
            await fetchPosts();
          } catch (error) {
            setStatus(postsStatusEl, formatError(error), true);
          } finally {
            setGlobalLoading(false);
            target.removeAttribute('disabled');
          }
        }
        if (action === 'restore') {
          try {
            target.setAttribute('disabled', 'true');
            setGlobalLoading(true, '복원 중...');
            await restorePost(post.id);
            await fetchPosts();
          } catch (error) {
            setStatus(postsStatusEl, formatError(error), true);
          } finally {
            setGlobalLoading(false);
            target.removeAttribute('disabled');
          }
        }
        if (action === 'draft') {
          try {
            target.setAttribute('disabled', 'true');
            setGlobalLoading(true, '임시 저장 처리 중...');
            await draftPost(post.id);
            await fetchPosts();
          } catch (error) {
            setStatus(postsStatusEl, formatError(error), true);
          } finally {
            setGlobalLoading(false);
            target.removeAttribute('disabled');
          }
        }
        if (action === 'unpublish') {
          if (!window.confirm('게시글을 게시 중단할까요?')) return;
          try {
            target.setAttribute('disabled', 'true');
            setGlobalLoading(true, '게시 중단 중...');
            await unpublishPost(post.id);
            await fetchPosts();
          } catch (error) {
            setStatus(postsStatusEl, formatError(error), true);
          } finally {
            setGlobalLoading(false);
            target.removeAttribute('disabled');
          }
        }
        if (action === 'republish') {
          if (!window.confirm('게시글을 다시 발행할까요?')) return;
          try {
            target.setAttribute('disabled', 'true');
            setGlobalLoading(true, '발행 재개 중...');
            await apiFetch(`/cms/posts/${post.id}/publish`, { method: 'POST' });
            await fetchPosts();
          } catch (error) {
            setStatus(postsStatusEl, formatError(error), true);
          } finally {
            setGlobalLoading(false);
            target.removeAttribute('disabled');
          }
        }
      });
    }
    postsListEl.appendChild(item);
  });

  renderPostsPagination(totalPages);
  updateBulkSelectionUI();
  updateBulkActionsVisibility();
}

async function maybeOpenInitialPost() {
  if (!isEditorPage || initialPostRequestHandled) return;
  initialPostRequestHandled = true;
  const params = new URLSearchParams(window.location.search);
  const isNew = params.get('new') === '1';
  const postId = params.get('postId');
  if (isNew) {
    const typeParam = params.get('type');
    if (typeParam === 'page') {
      currentDraft.type = 'page';
      setActiveTab('pages');
    }
    await createNewPost();
    return;
  }
  if (!postId) return;
  const existing = allPosts.find((post) => post.id === postId);
  if (existing) {
    selectPost(existing);
    return;
  }
  try {
    const detail = await apiFetch(`/cms/posts/${postId}`);
    const fetched = normalizePost(detail?.post || detail);
    if (fetched?.id) {
      allPosts = [fetched, ...allPosts.filter((post) => post.id !== fetched.id)];
      currentPosts = allPosts.slice();
      renderPosts();
      selectPost(fetched);
    }
  } catch (error) {
    setStatus(postsStatusEl, formatError(error), true);
  }
}

function buildPostsQuery() {
  const query = new URLSearchParams();
  query.set('page', postsView.page);
  query.set('pageSize', postsView.pageSize);
  if (postsView.type) {
    query.set('type', postsView.type);
  }
  if (postsView.viewPeriod && postsView.viewPeriod !== 'all') {
    query.set('viewPeriod', postsView.viewPeriod);
  }
  if (postsView.viewSort && postsView.viewSort !== 'recent') {
    query.set('viewSort', postsView.viewSort);
  }
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

    syncSelectedPosts();
    currentPosts = allPosts.slice();
    if (postsView.type === 'page') {
      currentPages = allPosts.filter((post) => (post.type || 'post') === 'page');
      renderNavTargetOptions();
    }
    renderPosts();
    updatePostFilterButtons();
    renderHomeLayoutEditor();
    await maybeOpenInitialPost();
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
    bodyJson: next.bodyJson || null,
    editorMode: next.bodyJson ? 'rich' : 'markdown',
    savedAt: next.updatedAt || currentDraft.savedAt,
    status: next.status,
    type: next.type || 'post',
    slug: next.slug,
    publicUrl: next.publicUrl,
    categorySlug: next.categorySlug || '',
    publishAt: next.publishAt,
  });
  if (isEditorPage) {
    setActiveTab(next.type === 'page' ? 'pages' : 'content');
  }
  titleInput.value = next.title || '';
  if (categorySelect) {
    categorySelect.value = next.categorySlug || '';
  }
  if (postSlugInput) {
    postSlugInput.value = next.slug || '';
  }
  updatePostSlugFieldVisibility();
  await setEditorContent({ bodyJson: next.bodyJson, bodyMd: next.body || '' });
  renderAutosaveSavedAt(currentDraft.savedAt);
  renderPosts();
}

refreshPostsBtn.addEventListener('click', () => {
  fetchPosts();
});

if (postsSearchInput) {
  postsSearchInput.addEventListener('input', (event) => {
    postsView.search = event.target.value;
    postsView.page = 1;
    clearPostSelection();
    renderPosts();
  });
}

if (postsCategoryFilter) {
  postsCategoryFilter.addEventListener('change', (event) => {
    postsView.category = event.target.value;
    postsView.page = 1;
    clearPostSelection();
    renderPosts();
  });
}

if (postsViewPeriod) {
  postsViewPeriod.addEventListener('change', (event) => {
    postsView.viewPeriod = event.target.value || 'all';
    postsView.page = 1;
    clearPostSelection();
    fetchPosts();
  });
  postsViewPeriod.value = postsView.viewPeriod;
}

if (postsViewSort) {
  postsViewSort.addEventListener('change', (event) => {
    postsView.viewSort = event.target.value || 'recent';
    postsView.page = 1;
    clearPostSelection();
    fetchPosts();
  });
  postsViewSort.value = postsView.viewSort;
}

if (postsStatusFilter) {
  postsStatusFilter.addEventListener('change', (event) => {
    postsView.status = event.target.value;
    postsView.page = 1;
    clearPostSelection();
    renderPosts();
  });
}

postsFilterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const status = button.dataset.postFilter || 'all';
    setPostFilter(status);
  });
});

if (postsSelectAll) {
  postsSelectAll.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    setSelectionForVisible(target.checked);
  });
}

if (bulkTrashBtn) {
  bulkTrashBtn.addEventListener('click', () => {
    runBulkAction({
      key: 'trash',
      label: '휴지통으로 이동',
      filter: (post) => post.status !== 'trashed',
      handler: (post) => trashPost(post.id),
    });
  });
}

if (bulkUnpublishBtn) {
  bulkUnpublishBtn.addEventListener('click', () => {
    runBulkAction({
      key: 'unpublish',
      label: '게시 중단',
      filter: (post) => post.status === 'published',
      handler: (post) => unpublishPost(post.id),
    });
  });
}

if (bulkRepublishBtn) {
  bulkRepublishBtn.addEventListener('click', () => {
    runBulkAction({
      key: 'republish',
      label: '발행 재개',
      filter: (post) => post.status === 'paused',
      handler: (post) => apiFetch(`/cms/posts/${post.id}/publish`, { method: 'POST' }),
    });
  });
}

if (bulkPublishBtn) {
  bulkPublishBtn.addEventListener('click', () => {
    runBulkAction({
      key: 'publish',
      label: '발행',
      filter: (post) => ['draft', 'scheduled', 'paused'].includes(post.status),
      handler: (post) => apiFetch(`/cms/posts/${post.id}/publish`, { method: 'POST' }),
    });
  });
}

if (bulkRestoreBtn) {
  bulkRestoreBtn.addEventListener('click', () => {
    runBulkAction({
      key: 'restore',
      label: '복원',
      filter: (post) => post.status === 'trashed',
      handler: (post) => restorePost(post.id),
    });
  });
}

if (bulkDraftBtn) {
  bulkDraftBtn.addEventListener('click', () => {
    runBulkAction({
      key: 'draft',
      label: '임시 저장',
      filter: (post) => post.status === 'trashed',
      handler: (post) => draftPost(post.id),
    });
  });
}

if (bulkPurgeBtn) {
  bulkPurgeBtn.addEventListener('click', () => {
    runBulkAction({
      key: 'purge',
      label: '영구 삭제',
      filter: (post) => post.status === 'trashed',
      handler: (post) => purgePost(post.id),
    });
  });
}

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

async function createNewPost() {
  if (!currentSession) {
    renderPostsState({
      message: '세션 만료 또는 오류가 발생했습니다. 다시 로그인해 주세요.',
      isError: true,
    });
    return;
  }

  try {
    renderPostsState({ message: '새 글 생성 중...', isLoading: true });
    const postType = getSelectedPostType();
    const slugValue = getPostSlugForSave();
    const emptyBodyJson = editorMode === 'rich' ? JSON.stringify({ blocks: [{ type: 'paragraph', data: { text: '' } }] }) : null;
    const bodyPayload = emptyBodyJson
      ? { body_json: emptyBodyJson, body_md: ' ' }
      : { body_md: ' ' };
    const created = await apiPostWithFallback('/cms/posts', {
      title: '제목 없음',
      ...bodyPayload,
      category_slug: categorySelect?.value || undefined,
      slug: slugValue || undefined,
      type: postType,
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
}

newPostBtn.addEventListener('click', async () => {
  if (isDashboard) {
    const typeParam = postsView.type === 'page' ? '&type=page' : '';
    window.location.href = `editor.html?new=1${typeParam}`;
    return;
  }
  await createNewPost();
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

if (previewToggleBtn) {
  previewToggleBtn.addEventListener('click', () => {
    renderPreview();
    if (previewModalContent) {
      previewModalContent.innerHTML = previewPane.innerHTML;
    }
    previewModal?.classList.remove('hidden');
  });
}

if (previewCloseBtn) {
  previewCloseBtn.addEventListener('click', () => {
    setViewMode('edit');
  });
}

if (previewModalCloseBtn) {
  previewModalCloseBtn.addEventListener('click', () => {
    previewModal?.classList.add('hidden');
  });
}

if (scheduleBtn) {
  scheduleBtn.addEventListener('click', () => {
    openScheduleModal();
  });
}

if (cancelScheduleBtn) {
  cancelScheduleBtn.addEventListener('click', () => {
    cancelSchedule();
  });
}

if (scheduleCloseBtn) {
  scheduleCloseBtn.addEventListener('click', () => {
    closeScheduleModal();
  });
}

if (scheduleBackBtn) {
  scheduleBackBtn.addEventListener('click', () => {
    setScheduleStep('date');
  });
}

if (scheduleNextBtn) {
  scheduleNextBtn.addEventListener('click', () => {
    setScheduleStep('time');
  });
}

if (scheduleConfirmBtn) {
  scheduleConfirmBtn.addEventListener('click', () => {
    schedulePublish();
  });
}

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
  const normalized = list.slice().map((job) => normalizeJob(job));
  currentJobs = normalized
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
    updateJobs(jobs);
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
  if (currentDraft?.status === 'scheduled') {
    if (!currentDraft?.publishAt) {
      openScheduleModal();
      return;
    }
    await applyScheduledPublish(currentDraft.publishAt, publishMessage);
    return;
  }
  if (!currentSession) {
    setStatus(publishMessage, '로그인 세션이 없습니다. 먼저 로그인하세요.', true);
    return;
  }

  const title = titleInput.value.trim() || '제목 없음';
  const categorySlug = categorySelect?.value || undefined;
  const postType = getSelectedPostType();
  const slugValue = getPostSlugForSave();

  try {
    setStatus(publishMessage, '발행 요청 중…');
    setGlobalLoading(true, '발행 중...');
    const payload = await buildBodyPayload();
    const bodyPayload = payload.bodyJson
      ? { body_json: payload.bodyJson, body_md: payload.bodyMd }
      : { body_md: payload.bodyMd };
    if (bodyPayload.body_md !== undefined && !bodyPayload.body_md.trim()) {
      bodyPayload.body_md = ' ';
    }
    const postId = await ensurePostId(title, payload);
    await apiPostWithFallback(`/cms/posts/${postId}/autosave`, {
      title,
      ...bodyPayload,
      category_slug: categorySlug,
      slug: slugValue || undefined,
      type: postType,
    });
    const response = await apiPostWithFallback(`/cms/posts/${postId}/publish`, {
      title,
      ...bodyPayload,
      category_slug: categorySlug,
      slug: slugValue || undefined,
      type: postType,
    });
    const deployJob = response?.deploy_job;
    const jobId = deployJob?.id;
    if (jobId) {
      upsertJob(normalizeJob(deployJob, { id: jobId, title }));
      pollDeployJob(jobId);
    } else {
      setStatus(publishMessage, '발행 완료. 배포 작업은 확인 중입니다.');
    }

    const postPayload = response?.post || { id: postId };
    const url = buildBlogUrl(postPayload);
    if (url) {
      publishLink.innerHTML = `<a href="${url}" target="_blank" rel="noopener">블로그에서 보기 →</a>`;
    }
    if (isEditorPage) {
      window.location.href = 'index.html';
    }
  } catch (error) {
    setStatus(publishMessage, formatError(error), true);
  } finally {
    setGlobalLoading(false);
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

if (refreshInquiriesBtn) {
  refreshInquiriesBtn.addEventListener('click', () => {
    fetchInquiries();
  });
}

if (exportSubscribersBtn) {
  exportSubscribersBtn.addEventListener('click', async () => {
    try {
      if (subscribersStatus) setStatus(subscribersStatus, '다운로드 준비 중...');
      const response = await fetch(buildUrl('/cms/subscribers/export'), { credentials: 'include' });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `다운로드 실패 (${response.status})`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      if (subscribersStatus) setStatus(subscribersStatus, '다운로드 완료');
    } catch (error) {
      if (subscribersStatus) setStatus(subscribersStatus, formatError(error), true);
    }
  });
}

if (tabButtons.length) {
  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.tabTarget;
      if (!target) return;
      if (isEditorPage) {
        window.location.href = `index.html#${target}`;
        return;
      }
      setActiveTab(target);
      if (window.location.hash !== `#${target}`) {
        window.history.replaceState(null, '', `#${target}`);
      }
    });
  });
  const hashTarget = resolveTabFromHash();
  if (hashTarget) {
    activeTabId = hashTarget;
  }
  setActiveTab(activeTabId);
}

if (tenantSwitchBtn) {
  tenantSwitchBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    if (tenantSwitchMenu?.classList.contains('hidden')) {
      openTenantMenu();
    } else {
      closeTenantMenu();
    }
  });
}

if (tenantSearchInput) {
  tenantSearchInput.addEventListener('input', () => {
    renderTenantSwitcherList();
  });
}

document.addEventListener('click', (event) => {
  if (!tenantSwitchMenu || tenantSwitchMenu.classList.contains('hidden')) return;
  const target = event.target;
  if (target instanceof Node && tenantSwitcher?.contains(target)) return;
  closeTenantMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (tenantSwitchMenu && !tenantSwitchMenu.classList.contains('hidden')) {
    closeTenantMenu();
  }
});

if (scrollTargetButtons.length) {
  scrollTargetButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selector = button.dataset.scrollTarget;
      if (!selector) return;
      const panel = button.closest('.tab-panel');
      const target = panel ? panel.querySelector(selector) : document.querySelector(selector);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
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
      selectedThemePresetId = currentThemeConfig.presetId;
      renderThemeCurrent();
      renderThemePresets();
      await fetchThemeTokens();
      setStatus(themeSaveStatus, data?.deploy_job?.id ? `배포 Job: ${data.deploy_job.id}` : '저장 완료');
    } catch (error) {
      setStatus(themeSaveStatus, formatError(error), true);
    }
  });
}

if (refreshPopupsBtn) {
  refreshPopupsBtn.addEventListener('click', () => {
    fetchPopups();
  });
}

if (addPopupBtn) {
  addPopupBtn.addEventListener('click', () => {
    resetPopupForm();
  });
}

if (popupResetBtn) {
  popupResetBtn.addEventListener('click', () => {
    resetPopupForm();
  });
}

if (popupForm) {
  popupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await savePopup();
  });
}

if (refreshBannersBtn) {
  refreshBannersBtn.addEventListener('click', () => {
    fetchBanners();
  });
}

if (addBannerBtn) {
  addBannerBtn.addEventListener('click', () => {
    resetBannerForm();
  });
}

if (bannerResetBtn) {
  bannerResetBtn.addEventListener('click', () => {
    resetBannerForm();
  });
}

if (bannerForm) {
  bannerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await saveBanner();
  });
}

if (refreshSiteConfigBtn) {
  refreshSiteConfigBtn.addEventListener('click', () => {
    fetchSiteConfig();
  });
}

if (siteConfigForm) {
  siteConfigForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await saveSiteConfig({}, siteConfigSaveStatus);
  });
}

if (refreshNavBtn) {
  refreshNavBtn.addEventListener('click', () => {
    fetchSiteNavigations();
  });
}

if (navLinkTypeSelect) {
  navLinkTypeSelect.addEventListener('change', () => {
    renderNavTargetOptions();
    if (navLinkTypeSelect.value === 'custom') {
      if (navLinkTargetSelect) navLinkTargetSelect.value = '';
      return;
    }
    syncNavTargetSelection();
  });
}

if (navLinkTargetSelect) {
  navLinkTargetSelect.addEventListener('change', () => {
    syncNavTargetSelection();
  });
}

if (navForm) {
  navForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const location = navLocationInput?.value || 'header';
    const label = navLabelInput?.value.trim();
    const url = navUrlInput?.value.trim();
    const linkType = getNavLinkType();
    if (linkType !== 'custom' && navLinkTargetSelect && !navLinkTargetSelect.value) {
      if (navStatus) setStatus(navStatus, '대상을 선택하세요.', true);
      return;
    }
    if (!label || !url) {
      if (navStatus) setStatus(navStatus, '라벨과 URL을 입력하세요.', true);
      return;
    }
    await saveNavigationItem({ location, label, url });
    if (!editingNavId) {
      navLabelInput.value = '';
      navUrlInput.value = '';
      if (navLinkTypeSelect) navLinkTypeSelect.value = 'custom';
      if (navLinkTargetSelect) navLinkTargetSelect.value = '';
      renderNavTargetOptions();
    }
  });
}

if (refreshHomeLayoutBtn) {
  refreshHomeLayoutBtn.addEventListener('click', () => {
    fetchSiteConfig();
  });
}

if (addSectionBtn) {
  addSectionBtn.addEventListener('click', () => {
    const type = homeLayoutTypeSelect?.value || 'banner';
    siteConfig.home_layout = [...(siteConfig.home_layout || []), createHomeSection(type)];
    renderHomeLayoutEditor();
  });
}

if (homeLayoutSaveBtn) {
  homeLayoutSaveBtn.addEventListener('click', async () => {
    await saveSiteConfig({ home_layout: siteConfig.home_layout }, homeLayoutSaveStatus);
  });
}

if (homeLayoutSidebarSaveBtn) {
  homeLayoutSidebarSaveBtn.addEventListener('click', async () => {
    await saveSiteConfig({ home_layout: siteConfig.home_layout }, homeLayoutSaveStatus);
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
    const nextTenantId = usersTenantSelect.value || null;
    if (nextTenantId) {
      setActiveTenant(nextTenantId);
    }
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
    if (isReservedSlug(slug)) {
      setStatus(categoriesStatus, '예약어 slug는 사용할 수 없습니다.', true);
      return;
    }
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

if (printBtn) {
  printBtn.addEventListener('click', () => {
    window.print();
  });
}

function hydrateFromStorage() {
  titleInput.value = currentDraft.title || '';
  void setEditorContent({ bodyJson: currentDraft.bodyJson, bodyMd: currentDraft.body || '' });
  void setEditorMode(currentDraft?.editorMode || (currentDraft?.bodyJson ? 'rich' : 'markdown'));
  if (categorySelect) {
    categorySelect.value = currentDraft.categorySlug || '';
  }
  if (postSlugInput) {
    postSlugInput.value = currentDraft.slug || '';
  }
  updatePostSlugFieldVisibility();
  renderAutosaveSavedAt(currentDraft.savedAt);
  renderPreview();
  renderSelectedPostMeta();
  updateJobs(currentJobs);
  setViewMode(currentViewMode);
  updateViewOnBlogButton();
  clearShareLink();
  updateScheduleButtons();
  closeScheduleModal();
}

hydrateFromStorage();
fetchSession();
fetchPosts();
fetchDeployJobs();
fetchCategories();
fetchPagesForNav();
fetchInquiries();
fetchPrCampaigns();
fetchSiteConfig();
fetchSiteNavigations();

window.addEventListener('beforeunload', (event) => {
  if (!autosaveState.dirty) return;
  event.preventDefault();
  event.returnValue = '';
});
