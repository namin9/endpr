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
   - Expect: toolbar shows **새 글**, 검색 input, 상태 필터.
   - Type a keyword in 검색 input.
   - Expect: list filters by 제목 substring (case-insensitive).
   - Change 상태 필터 to **draft** and **published**.
   - Expect: list updates and 배지 색상이 바뀐다.
   - Use **이전/다음** to move pages (20개 단위).
   - Expect: 페이지 표기가 업데이트된다.
   - Click a post in the list.
   - Expect: editor title/body update and the meta line shows the post ID.
3. **Split view + preview**
   - In the editor toolbar, confirm **Split** is active by default.
   - Expect: Markdown 입력/Preview 패널이 좌우로 나란히 보인다 (모바일에서는 상하 스택).
   - Click **Edit Only** and **Preview Only**.
   - Expect: 해당 패널만 표시된다.
   - Type in the editor and wait ~0.2s.
   - Expect: Preview가 지연 후 갱신된다.
4. **Autosave + manual save**
   - Edit the body.
   - Wait ~2 seconds.
   - Expect: 상태가 “변경됨” → “저장 중…” → “저장됨 HH:MM:SS”로 변한다.
   - Click **임시저장**.
   - Expect: 상태가 “저장 중…” 후 “저장됨 HH:MM:SS”.
5. **Publish flow + blog link**
   - Click **발행**.
   - Expect: status shows “발행 요청 중…” then “배포 상태를 확인하는 중…”.
   - When complete, expect a “블로그에서 보기 →” link in the publish panel.
6. **Deploy jobs panel**
   - Click **새로고침** in 최근 배포 Jobs.
   - Click a job in the list.
   - Expect: Job 상세 panel shows status, message, and update time.
7. **Unauthorized handling**
   - Click **세션 초기화**.
   - Try autosaving or publishing.
   - Expect: inline error telling you to log in; no requests succeed.
