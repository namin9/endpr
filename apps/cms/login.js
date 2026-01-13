const API_BASE = window.__API_BASE__ || window.API_BASE || 'https://endpr.ni041372.workers.dev';

const loginForm = document.getElementById('loginForm');
const sessionStatus = document.getElementById('sessionStatus');

function setStatus(message, isError = false) {
  if (!sessionStatus) return;
  sessionStatus.textContent = message || '';
  sessionStatus.classList.toggle('error', Boolean(isError));
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
    throw err;
  }

  return data;
}

async function checkSession() {
  try {
    await apiFetch('/cms/auth/me');
    window.location.href = 'index.html';
  } catch (error) {
    if (error?.status === 401) {
      setStatus('로그인이 필요합니다.');
      return;
    }
    setStatus(error?.message || '세션 확인 실패', true);
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
      setStatus('로그인 중…');
      await apiFetch('/cms/auth/login', {
        method: 'POST',
        body: { tenantSlug: tenant, email, password },
      });
      window.location.href = 'index.html';
    } catch (error) {
      const statusSuffix = error?.status ? ` (HTTP ${error.status})` : '';
      setStatus((error?.message || '로그인 실패') + statusSuffix, true);
    }
  });
}

checkSession();
