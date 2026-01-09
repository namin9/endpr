# BLOG SSG Smoke Tests

## Markdown Rendering
1) CMS에서 아래 요소가 포함된 글을 작성 후 저장/발행한다.
   - 목록 (ul/ol)
   - 인용문 (blockquote)
   - 코드펜스 (```로 감싼 코드)
   - 링크 `[text](url)`
   - 이미지 `![alt](url)`
2) Pages 빌드 수행 (PUBLIC_API_BASE/BUILD_TOKEN 설정).
3) 배포된 포스트 페이지에서 아래가 정상 렌더되는지 확인한다.
   - 목록이 `<ul>/<ol>/<li>`로 렌더됨
   - 인용이 `<blockquote>`로 렌더됨
   - 코드가 `<pre><code>`로 렌더되며 escape 처리됨
   - 링크/이미지가 실제 `<a>/<img>`로 렌더됨
   - `&lt;blockquote ...&gt;` 같은 태그 문자열이 화면에 노출되지 않음

## Regression Checks
1) sitemap/목록/페이지네이션/홈 페이지가 기존대로 생성되는지 확인한다.
