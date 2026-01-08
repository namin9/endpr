# SMOKE_TEST

Merge readiness criteria: This runbook is ready to merge once it lets any Windows PowerShell user validate the deployed Worker API end to end (CORS, auth/session, posts lifecycle, deploy jobs, build feeds) against `https://<worker-subdomain>.workers.dev` with no local npm installs, while clearly stating expected statuses/headers, how to reuse the same session, and how to fetch the build token from D1 without adding new endpoints.

## Base variables (PowerShell)

```powershell
$BaseUrl = "https://<worker-subdomain>.workers.dev"
$TenantSlug = "<tenant-slug>"
$AdminEmail = "<admin-email>"
$AdminPassword = "<admin-password>"
$Origin = "https://cms.ourcompany.com"
$PagesOrigin = "https://endpr.pages.dev"
$BlockedOrigin = "https://evil.com"
$Session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
```

> Note: Because the CMS UI and the Worker API are on different sites (e.g., `cms.ourcompany.com` → `*.workers.dev` or `endpr.pages.dev`), the session cookie must use `SameSite=None; Secure` so browsers will send it on cross-site `fetch` requests with `credentials: include`.

## 1) CORS preflight

Allowed origin:

```powershell
$preflightOk = Invoke-WebRequest -Uri "$BaseUrl/cms/auth/login" -Method Options -Headers @{
  "Origin" = $Origin
  "Access-Control-Request-Method" = "POST"
  "Access-Control-Request-Headers" = "content-type"
}
$preflightOk.StatusCode
$preflightOk.Headers
```

Expected: **204** with `Access-Control-Allow-Origin: https://cms.ourcompany.com`, `Access-Control-Allow-Methods: GET,POST,OPTIONS`, `Access-Control-Allow-Headers: content-type`, `Access-Control-Allow-Credentials: true`, and `Vary: Origin`.

Allowed test origin (`endpr.pages.dev`):

```powershell
$preflightPages = Invoke-WebRequest -Uri "$BaseUrl/cms/auth/login" -Method Options -Headers @{
  "Origin" = $PagesOrigin
  "Access-Control-Request-Method" = "POST"
  "Access-Control-Request-Headers" = "content-type"
}
$preflightPages.StatusCode
$preflightPages.Headers
```

Expected: **204** with the same `Access-Control-*` headers echoing `https://endpr.pages.dev`.

Allowed test origin (`endpr.pages.dev`):

```powershell
$preflightPages = Invoke-WebRequest -Uri "$BaseUrl/cms/auth/login" -Method Options -Headers @{
  "Origin" = $PagesOrigin
  "Access-Control-Request-Method" = "POST"
  "Access-Control-Request-Headers" = "content-type"
}
$preflightPages.StatusCode
$preflightPages.Headers
```

Expected: **204** with the same `Access-Control-*` headers echoing `https://endpr.pages.dev`.

Blocked origin:

```powershell
$preflightBlocked = Invoke-WebRequest -Uri "$BaseUrl/cms/auth/login" -Method Options -Headers @{
  "Origin" = $BlockedOrigin
  "Access-Control-Request-Method" = "POST"
  "Access-Control-Request-Headers" = "content-type"
}
$preflightBlocked.StatusCode
$preflightBlocked.Content
```

Expected: **403** with JSON `{ "error": "CORS origin not allowed" }`.

## 2) Login (stores cookies via WebRequestSession)

```powershell
$loginBody = @{
  tenantSlug = $TenantSlug
  email = $AdminEmail
  password = $AdminPassword
} | ConvertTo-Json

$loginResp = Invoke-WebRequest -Uri "$BaseUrl/cms/auth/login" -Method Post -Headers @{ "Origin" = $Origin } -ContentType "application/json" -Body $loginBody -WebSession $Session
$loginResp.StatusCode
$Session.Cookies.GetCookies($BaseUrl)
```

Expected: **200**, JSON `{ user: { id, email, role }, tenant: { id, slug, name } }`, and `Set-Cookie: session=...; HttpOnly; Secure; SameSite=None`.

## 3) `/cms/auth/me` with same session

```powershell
$me = Invoke-RestMethod -Uri "$BaseUrl/cms/auth/me" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Get
$me
```

Expected: **200** with the same `user` and `tenant` fields. Missing/invalid cookie should return **401**.

## 3-a) 로그인 실패 분류 (진단)

Preflight 실패 확인:

```powershell
$preflightBlocked = Invoke-WebRequest -Uri "$BaseUrl/cms/auth/login" -Method Options -Headers @{
  "Origin" = $BlockedOrigin
  "Access-Control-Request-Method" = "POST"
  "Access-Control-Request-Headers" = "content-type"
}
$preflightBlocked.StatusCode
$preflightBlocked.Content
```

Expected: **403** with JSON `{ "error": "CORS origin not allowed", "error_code": "cors_not_allowed" }`.

Set-Cookie 미설정 확인:

```powershell
$loginResp = Invoke-WebRequest -Uri "$BaseUrl/cms/auth/login" -Method Post -Headers @{ "Origin" = $Origin } -ContentType "application/json" -Body $loginBody -WebSession $Session
$loginResp.Headers["Set-Cookie"]
```

Expected: `Set-Cookie`가 비어있으면 서버 로그에서 `set_cookie_written: false` 확인.

쿠키 미전송(`/cms/auth/me` 401) 확인:

```powershell
$meNoCookie = Invoke-WebRequest -Uri "$BaseUrl/cms/auth/me" -Headers @{ "Origin" = $Origin } -Method Get
$meNoCookie.StatusCode
$meNoCookie.Content
```

Expected: **401** with JSON including `error_code` (예: `missing_session`, `invalid_session`, `tenant_not_found`, `user_not_found`).

## 4) Post lifecycle: create → autosave → publish

Create draft (captures ID safely):

```powershell
$createBody = @{
  title = "Smoke Test Post"
  body_md = "Initial body"
} | ConvertTo-Json

$createResp = Invoke-RestMethod -Uri "$BaseUrl/cms/posts" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post -ContentType "application/json" -Body $createBody

$postId = $null
if ($createResp.PSObject.Properties.Name -contains "post") { $postId = $createResp.post.id; $slug = $createResp.post.slug }
elseif ($createResp.PSObject.Properties.Name -contains "id") { $postId = $createResp.id; $slug = $createResp.slug }
if (-not $postId) { throw "Post id not found in response" }
```

Expected: **201** with `post` object containing at least `id`, `slug`, `status: draft`.

Reserved slug blocking (create + autosave):

```powershell
$reservedCreateBody = @{
  title = "posts"
} | ConvertTo-Json
$reservedCreateResp = Invoke-WebRequest -Uri "$BaseUrl/cms/posts" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post -ContentType "application/json" -Body $reservedCreateBody
$reservedCreateResp.StatusCode
$reservedCreateResp.Content
```

Expected: **400** with JSON including `error: "reserved_slug"` and a human-readable `message`.

```powershell
$reservedAutosaveBody = @{
  slug = "api"
} | ConvertTo-Json
$reservedAutosaveResp = Invoke-WebRequest -Uri "$BaseUrl/cms/posts/$postId/autosave" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post -ContentType "application/json" -Body $reservedAutosaveBody
$reservedAutosaveResp.StatusCode
$reservedAutosaveResp.Content
```

Expected: **400** with JSON including `error: "reserved_slug"`.

Duplicate slug suffix (drafts):

```powershell
$draftASlugBody = @{
  slug = "hello"
} | ConvertTo-Json
$draftAResp = Invoke-RestMethod -Uri "$BaseUrl/cms/posts/$postId/autosave" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post -ContentType "application/json" -Body $draftASlugBody
$draftAResp.post.slug
```

Expected: **200** and slug remains `hello`.

```powershell
$draftBCreateBody = @{
  title = "Smoke Test Post B"
  body_md = "Draft B body"
} | ConvertTo-Json
$draftBResp = Invoke-RestMethod -Uri "$BaseUrl/cms/posts" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post -ContentType "application/json" -Body $draftBCreateBody
$draftBId = $draftBResp.post.id

$draftBSlugBody = @{
  slug = "hello"
} | ConvertTo-Json
$draftBSlugResp = Invoke-RestMethod -Uri "$BaseUrl/cms/posts/$draftBId/autosave" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post -ContentType "application/json" -Body $draftBSlugBody
$draftBSlugResp.post.slug
```

Expected: **200** and slug becomes `hello-2`.

```powershell
$draftCPublishBody = @{
  title = "Smoke Test Post C"
  body_md = "Draft C body"
} | ConvertTo-Json
$draftCResp = Invoke-RestMethod -Uri "$BaseUrl/cms/posts" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post -ContentType "application/json" -Body $draftCPublishBody
$draftCId = $draftCResp.post.id

$draftCSlugBody = @{
  slug = "hello"
} | ConvertTo-Json
$draftCSlugResp = Invoke-RestMethod -Uri "$BaseUrl/cms/posts/$draftCId/autosave" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post -ContentType "application/json" -Body $draftCSlugBody
$draftCSlugResp.post.slug
```

Expected: **200** and slug becomes `hello-3`.

```powershell
$draftBPublishResp = Invoke-RestMethod -Uri "$BaseUrl/cms/posts/$draftBId/publish" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post
$draftBPublishResp.post.slug
```

Expected: **200** and slug remains `hello-2`.

Unicode slug normalization:

```powershell
$unicodeSlugBody = @{
  slug = "안녕하세요 세계"
} | ConvertTo-Json
$unicodeSlugResp = Invoke-RestMethod -Uri "$BaseUrl/cms/posts/$postId/autosave" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post -ContentType "application/json" -Body $unicodeSlugBody
$unicodeSlugResp.post.slug
```

Expected: **200** and slug becomes `안녕하세요-세계`.

```powershell
$unicodeSlugBody2 = @{
  slug = "테스트!! 123"
} | ConvertTo-Json
$unicodeSlugResp2 = Invoke-RestMethod -Uri "$BaseUrl/cms/posts/$postId/autosave" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post -ContentType "application/json" -Body $unicodeSlugBody2
$unicodeSlugResp2.post.slug
```

Expected: **200** and slug becomes `테스트-123`.

```powershell
$unicodeSlugBody3 = @{
  slug = "Hello 안녕"
} | ConvertTo-Json
$unicodeSlugResp3 = Invoke-RestMethod -Uri "$BaseUrl/cms/posts/$postId/autosave" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post -ContentType "application/json" -Body $unicodeSlugBody3
$unicodeSlugResp3.post.slug
```

Expected: **200** and slug becomes `hello-안녕`.

Published slug immutability:

```powershell
$draftSlugUpdateBody = @{
  slug = "draft-slug-update"
} | ConvertTo-Json
$draftSlugUpdateResp = Invoke-RestMethod -Uri "$BaseUrl/cms/posts/$postId/autosave" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post -ContentType "application/json" -Body $draftSlugUpdateBody
$draftSlugUpdateResp.post.slug
```

Expected: **200** and `post.slug` updates to the new value while still draft.

Autosave update:

```powershell
$autosaveBody = @{
  title = "Smoke Test Post (autosaved)"
  excerpt = "Smoke test excerpt"
} | ConvertTo-Json
$autosaveResp = Invoke-RestMethod -Uri "$BaseUrl/cms/posts/$postId/autosave" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post -ContentType "application/json" -Body $autosaveBody
$autosaveResp.saved_at
```

Expected: **200** with updated `post` fields and `saved_at` ISO timestamp.

Draft title → slug auto sync (WP-API-06):

```powershell
$autoSlugBody1 = @{
  title = "한글 제목"
} | ConvertTo-Json
$autoSlugResp1 = Invoke-RestMethod -Uri "$BaseUrl/cms/posts/$postId/autosave" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post -ContentType "application/json" -Body $autoSlugBody1
$autoSlugResp1.post.slug

$autoSlugBody2 = @{
  title = "한글 제목2"
} | ConvertTo-Json
$autoSlugResp2 = Invoke-RestMethod -Uri "$BaseUrl/cms/posts/$postId/autosave" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post -ContentType "application/json" -Body $autoSlugBody2
$autoSlugResp2.post.slug
```

Expected: slugs auto-update to `한글-제목`, then `한글-제목2`.

Manual slug override protection:

```powershell
$manualSlugBody = @{
  slug = "manual-slug"
} | ConvertTo-Json
$manualSlugResp = Invoke-RestMethod -Uri "$BaseUrl/cms/posts/$postId/autosave" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post -ContentType "application/json" -Body $manualSlugBody
$manualSlugResp.post.slug

$manualTitleBody = @{
  title = "수동 슬러그 유지"
} | ConvertTo-Json
$manualTitleResp = Invoke-RestMethod -Uri "$BaseUrl/cms/posts/$postId/autosave" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post -ContentType "application/json" -Body $manualTitleBody
$manualTitleResp.post.slug
```

Expected: slug remains `manual-slug` after title change.

Publish:

```powershell
$publishResp = Invoke-RestMethod -Uri "$BaseUrl/cms/posts/$postId/publish" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post
$publishResp.deploy_job.id
```

Expected: **200** with `post.status: published`, `deploy_job` containing `id`, `status` (`building` or `success`/`failed`), and `message`.

Published slug immutability (after publish):

```powershell
$publishedSlugUpdateBody = @{
  slug = "published-slug-update"
} | ConvertTo-Json
$publishedSlugUpdateResp = Invoke-WebRequest -Uri "$BaseUrl/cms/posts/$postId/autosave" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post -ContentType "application/json" -Body $publishedSlugUpdateBody
$publishedSlugUpdateResp.StatusCode
$publishedSlugUpdateResp.Content
```

Expected: **400** with JSON including `error: "slug_immutable"`.

```powershell
$publishedNoSlugBody = @{
  title = "Smoke Test Post (published update)"
} | ConvertTo-Json
$publishedNoSlugResp = Invoke-RestMethod -Uri "$BaseUrl/cms/posts/$postId/autosave" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post -ContentType "application/json" -Body $publishedNoSlugBody
$publishedNoSlugResp.post.title
```

Expected: **200** and title updated.

```powershell
$publishedSameSlugBody = @{
  slug = $draftSlugUpdateResp.post.slug
} | ConvertTo-Json
$publishedSameSlugResp = Invoke-RestMethod -Uri "$BaseUrl/cms/posts/$postId/autosave" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post -ContentType "application/json" -Body $publishedSameSlugBody
$publishedSameSlugResp.post.slug
```

Expected: **200** with the same slug returned.

Published title change no auto slug:

```powershell
$publishedTitleBody = @{
  title = "Published title update"
} | ConvertTo-Json
$publishedTitleResp = Invoke-RestMethod -Uri "$BaseUrl/cms/posts/$postId/autosave" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post -ContentType "application/json" -Body $publishedTitleBody
$publishedTitleResp.post.slug
```

Expected: **200** with slug unchanged after publish.

```powershell
$republishResp = Invoke-RestMethod -Uri "$BaseUrl/cms/posts/$postId/publish" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post
$republishResp.post.slug
```

Expected: **200** and slug remains unchanged.

## 5) Deploy jobs: list and detail

```powershell
$jobs = Invoke-RestMethod -Uri "$BaseUrl/cms/deploy-jobs" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Get
$jobId = $publishResp.deploy_job.id
$jobDetail = Invoke-RestMethod -Uri "$BaseUrl/cms/deploy-jobs/$jobId" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Get
```

Expected: **200** for both. List returns `jobs` array including the publish-triggered job. Detail returns `job` with `status`, `message`, `updated_at_iso`.

## 6) Build endpoints (`x-build-token` required)

If the build token is unknown, retrieve it from Cloudflare D1 Console (Dashboard → Workers & KV → D1 → Database → Query):

```sql
SELECT id, slug, build_token FROM tenants WHERE slug = '<tenant-slug>' LIMIT 1;
```

Copy `build_token` (do not modify data). Then:

```powershell
$BuildToken = "<build-token-from-D1>"

$buildPosts = Invoke-RestMethod -Uri "$BaseUrl/build/posts" -Headers @{ "x-build-token" = $BuildToken }
$buildPost = Invoke-RestMethod -Uri "$BaseUrl/build/post/$slug" -Headers @{ "x-build-token" = $BuildToken }
$buildCategories = Invoke-RestMethod -Uri "$BaseUrl/build/categories" -Headers @{ "x-build-token" = $BuildToken }
```

Expected: **200** each with `posts` (published only), `post`, and `categories`. Missing/invalid token should return **401**.

## Expected results summary

- CORS allowed: 204 with `Access-Control-*` headers; blocked origin: 403 JSON error.
- Login: 200 with `Set-Cookie: session=...`.
- `/cms/auth/me`: 200 with user/tenant; 401 if cookie invalid/missing.
- Create: 201 with `post` object and stable `id`/`slug` keys.
- Autosave: 200 with updated `post` + `saved_at`.
- Publish: 200 with `post.status: published` and `deploy_job`.
- Deploy jobs list/detail: 200 with matching job status/message.
- Build endpoints: 200 when `x-build-token` is correct; 401 otherwise.

## Troubleshooting

- **Missing `SESSION_SECRET`**: Any authenticated route may throw; set the binding in Worker environment and redeploy.
- **D1 binding mismatch**: 500s or `Tenant not found` despite valid credentials/build token; confirm the Worker uses the correct D1 binding name and database.
- **CORS headers missing**: Preflight may fail or `Access-Control-Allow-Origin` absent; verify `Origin` is exactly `https://cms.ourcompany.com` and that the Worker deployed with the current CORS middleware.
- **Deploy hook missing (`expected deploy_job failed`)**: Publish may return `deploy_job.status: failed` with message about `pages_deploy_hook_url`; set the deploy hook URL in the tenant record and retry publish.
