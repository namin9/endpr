# CMS manual smoke test (Worker API)

Base URL: `https://cms.ourcompany.com`

> Make sure the Worker API is reachable. If you need a different environment, set `window.__API_BASE__` in DevTools before running steps.

1. **Login**
   - Open `/`.
   - Enter a valid tenant slug, editor email, and password.
   - Click **로그인**.
   - Expect: session panel shows tenant + email; no error text.
2. **Autosave draft**
   - Type a new title and body.
   - Wait ~2 seconds.
   - Expect: status shows “Saved at …”; preview updates.
3. **Refresh session**
   - Refresh the page.
   - Expect: UI auto-fetches `/cms/auth/me` and keeps the session visible.
4. **Publish flow**
   - Click **발행 및 배포 시작**.
   - Expect: status shows “발행 요청 중…” then “배포 상태를 확인하는 중…”.
   - Polling should update the job list; final status becomes `success` (or `failed` with a clear message).
5. **Unauthorized handling**
   - Click **세션 초기화**.
   - Try autosaving or publishing.
   - Expect: inline error telling you to log in; no requests succeed.

