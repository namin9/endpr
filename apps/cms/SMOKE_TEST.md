# CMS manual smoke test (Worker API)

Base URL: `https://cms.ourcompany.com`

> Make sure the Worker API is reachable. If you need a different environment, set `window.__API_BASE__` and `window.__BLOG_BASE__` in DevTools before running steps.

1. **Login**
   - Open `/`.
   - Enter a valid tenant slug, editor email, and password.
   - Click **로그인**.
   - Expect: session panel shows tenant + email; no error text.
2. **Posts list + editor load**
   - In the left panel, click **새로고침** under 게시글 목록.
   - Click a post in the list.
   - Expect: editor title/body update and the meta line shows the post ID.
3. **Autosave + manual save**
   - Edit the body.
   - Wait ~2 seconds.
   - Expect: autosave status shows “Saved at …” and preview updates.
   - Click **임시저장**.
   - Expect: status briefly shows “Saving…” then “Saved at …”.
4. **Publish flow + blog link**
   - Click **발행**.
   - Expect: status shows “발행 요청 중…” then “배포 상태를 확인하는 중…”.
   - When complete, expect a “블로그에서 보기 →” link in the publish panel.
5. **Deploy jobs panel**
   - Click **새로고침** in 최근 배포 Jobs.
   - Click a job in the list.
   - Expect: Job 상세 panel shows status, message, and update time.
6. **Unauthorized handling**
   - Click **세션 초기화**.
   - Try autosaving or publishing.
   - Expect: inline error telling you to log in; no requests succeed.
