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
   - Click **새로고침** in Deploy Job 이력.
   - Click a job in the list.
   - Expect: Job 상세 panel shows status, message, and update time.
7. **Unauthorized handling**
   - Click **세션 초기화**.
   - Try autosaving or publishing.
   - Expect: inline error telling you to log in; no requests succeed.
8. **View on blog**
   - In the editor, locate **View on blog**.
   - If base URL exists: click and confirm a new tab opens `{base}/{slug}`.
   - If base URL is missing: button is disabled and 안내 문구가 표시된다.
9. **Deploy job history panel**
   - In Deploy Job 이력, confirm recent items show status badges and timestamps.
   - Click a job; confirm 상세 영역에 상태/메시지/시간이 표시된다.
   - Force an error (network off) and confirm 에러 메시지가 표시된다.
10. **Preview/Share 링크 생성**
   - 비공개 게시글을 선택한다.
   - **공유 링크 생성** 버튼을 클릭한다.
   - Expect: 공유 링크가 표시되고 복사 버튼이 활성화된다.
   - **링크 복사**를 눌러 클립보드에 복사되었는지 확인한다.
   - **새 탭에서 열기**를 눌러 새 탭에서 링크가 열린다.
11. **Preview 링크 noindex/nofollow**
   - 생성된 Preview 링크로 접속한다.
   - Expect: `<meta name="robots" content="noindex, nofollow">`가 head에 포함된다.
12. **공개 게시글 noindex 제외**
   - 공개 게시글의 기본 링크(share_token 없는 링크)로 접속한다.
   - Expect: robots meta가 존재하지 않는다.
13. **토큰 만료**
   - 만료된 Preview 링크(30일 이후 또는 만료 처리된 링크)로 접속한다.
   - Expect: 404 또는 유효하지 않다는 메시지가 표시된다.
14. **텍스트 스타일링**
   - 에디터에서 텍스트 크기/색상/정렬/굵기/기울임을 변경한다.
   - 저장 후 미리보기 및 게시글 렌더링에 반영되는지 확인한다.
15. **이미지 업로드**
   - 이미지 업로드 버튼으로 파일을 선택한다.
   - Expect: 이미지가 R2에 업로드되고 에디터와 미리보기에 표시된다.
16. **하이퍼링크 추가**
   - 텍스트를 선택하고 링크 버튼으로 URL을 삽입한다.
   - Expect: 링크 클릭 시 새 탭에서 열리며 rel="noopener noreferrer"가 설정된다.
17. **리스트/인용/코드 블록**
   - 순서/비순서 리스트, 인용, 코드 블록을 추가한다.
   - Expect: 미리보기에서 서식이 유지된다.
18. **이미지 미리보기**
   - 업로드된 이미지가 **업로드 미리보기** 영역에 표시되는지 확인한다.
