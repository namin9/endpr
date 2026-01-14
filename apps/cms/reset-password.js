const API_BASE = window.__API_BASE__ || window.API_BASE || 'https://endpr.ni041372.workers.dev';

const resetForm = document.getElementById('resetForm');
const resetStatus = document.getElementById('resetStatus');

function setStatus(message, isError = false) {
  if (!resetStatus) return;
  resetStatus.textContent = message || '';
  resetStatus.classList.toggle('error', Boolean(isError));
}

function buildUrl(path) {
  if (!path.startsWith('/')) return `${API_BASE}/${path}`;
  return `${API_BASE}${path}`;
}

function getToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
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

if (resetForm) {
  resetForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const token = getToken();
    if (!token) {
      setStatus('유효한 토큰이 없습니다. 관리자에게 문의하세요.', true);
      return;
    }
    const formData = new FormData(resetForm);
    const newPassword = formData.get('new_password')?.toString().trim();
    const confirmPassword = formData.get('confirm_password')?.toString().trim();
    if (!newPassword || !confirmPassword) {
      setStatus('새 비밀번호를 입력하세요.', true);
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus('비밀번호가 일치하지 않습니다.', true);
      return;
    }

    try {
      setStatus('비밀번호 변경 중...');
      await apiFetch('/cms/auth/password-reset', {
        method: 'POST',
        body: { token, new_password: newPassword },
      });
      setStatus('비밀번호가 변경되었습니다. 관리자에게 로그인 후 확인하세요.');
      resetForm.reset();
    } catch (error) {
      setStatus(error?.message || '비밀번호 변경 실패', true);
    }
  });
}
