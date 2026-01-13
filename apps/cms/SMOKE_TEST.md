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
   - Expect: 본문 입력/Preview 패널이 좌우로 나란히 보인다 (모바일에서는 상하 스택).
   - Click **Edit Only** and **Preview Only**.
   - Expect: 해당 패널만 표시된다.
   - Type in the editor and wait ~0.2s.
   - Expect: Preview가 지연 후 갱신된다.
4. **Quill toolbar formatting**
   - 입력한 텍스트 일부를 드래그로 선택한다.
   - 툴바에서 폰트/크기/색상/정렬 드롭다운을 각각 열고 옵션을 선택한다.
   - Expect: 선택한 포맷이 본문에 즉시 반영되고 드롭다운이 가려지지 않는다.
   - Expect: 클릭 시 폼 submit/페이지 리로드 없이 포커스가 유지된다.
5. **Image upload**
   - 툴바에서 이미지 버튼을 클릭한다.
   - 파일 선택 창에서 이미지 파일을 선택한다.
   - Expect: 본문에 이미지가 삽입되고 포커스가 유지된다.
6. **Autosave + manual save**
   - Edit the body.
   - Wait ~2 seconds.
   - Expect: 상태가 “변경됨” → “저장 중…” → “저장됨 HH:MM:SS”로 변한다.
   - Click **임시저장**.
   - Expect: 상태가 “저장 중…” 후 “저장됨 HH:MM:SS”.
7. **Publish flow + blog link**
   - Click **발행**.
   - Expect: status shows “발행 요청 중…” then “배포 상태를 확인하는 중…”.
   - When complete, expect a “블로그에서 보기 →” link in the publish panel.
8. **Deploy jobs panel**
   - Click **새로고침** in Deploy Job 이력.
   - Click a job in the list.
   - Expect: Job 상세 panel shows status, message, and update time.
9. **Unauthorized handling**
   - Click **세션 초기화**.
   - Try autosaving or publishing.
   - Expect: inline error telling you to log in; no requests succeed.
10. **View on blog**
   - In the editor, locate **View on blog**.
   - If base URL exists: click and confirm a new tab opens `{base}/{slug}`.
   - If base URL is missing: button is disabled and 안내 문구가 표시된다.
11. **Deploy job history panel**
   - In Deploy Job 이력, confirm recent items show status badges and timestamps.
   - Click a job; confirm 상세 영역에 상태/메시지/시간이 표시된다.
   - Force an error (network off) and confirm 에러 메시지가 표시된다.
