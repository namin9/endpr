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

Publish:

```powershell
$publishResp = Invoke-RestMethod -Uri "$BaseUrl/cms/posts/$postId/publish" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post
$publishResp.deploy_job.id
```

Expected: **200** with `post.status: published`, `deploy_job` containing `id`, `status` (`building` or `success`/`failed`), and `message`.

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

## 7) Upload image to R2 (authenticated session required)

Use a local image file (the browser/clients already convert to WebP). The Worker must be configured with an R2 binding; if `PUBLIC_R2_BASE_URL` is not set, the API will return a public URL on the Worker domain at `/assets/...`. The CMS flow uses a JSON request to get an upload URL, then `PUT`s the file bytes to that URL.

```powershell
$UploadPath = "C:\\path\\to\\sample.webp"
$uploadMeta = @{
  filename = "sample.webp"
  content_type = "image/webp"
  size = (Get-Item $UploadPath).Length
} | ConvertTo-Json

$uploadResp = Invoke-RestMethod -Uri "$BaseUrl/cms/uploads" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Post -ContentType "application/json" -Body $uploadMeta
$uploadResp

$uploadPut = Invoke-WebRequest -Uri $uploadResp.upload_url -Method Put -InFile $UploadPath -ContentType "image/webp"
$uploadPut.StatusCode
```

Expected: **201** with `upload_url` and a public `public_url` pointing to a tenant-prefixed key (e.g., `<tenant-slug>/YYYY-MM-DD/...`). Missing/invalid session should return **401**.

Verify the uploaded image is accessible:

```powershell
Invoke-WebRequest -Uri $uploadResp.public_url -Method Get
```

Expected: **200** and the image bytes.

## Expected results summary

- CORS allowed: 204 with `Access-Control-*` headers; blocked origin: 403 JSON error.
- Login: 200 with `Set-Cookie: session=...`.
- `/cms/auth/me`: 200 with user/tenant; 401 if cookie invalid/missing.
- Create: 201 with `post` object and stable `id`/`slug` keys.
- Autosave: 200 with updated `post` + `saved_at`.
- Publish: 200 with `post.status: published` and `deploy_job`.
- Deploy jobs list/detail: 200 with matching job status/message.
- Build endpoints: 200 when `x-build-token` is correct; 401 otherwise.
- Upload: 201 with public `url` and tenant-prefixed `key`; 401 without session.

## Troubleshooting

- **Missing `SESSION_SECRET`**: Any authenticated route may throw; set the binding in Worker environment and redeploy.
- **D1 binding mismatch**: 500s or `Tenant not found` despite valid credentials/build token; confirm the Worker uses the correct D1 binding name and database.
- **CORS headers missing**: Preflight may fail or `Access-Control-Allow-Origin` absent; verify `Origin` is exactly `https://cms.ourcompany.com` and that the Worker deployed with the current CORS middleware.
- **Deploy hook missing (`expected deploy_job failed`)**: Publish may return `deploy_job.status: failed` with message about `pages_deploy_hook_url`; set the deploy hook URL in the tenant record and retry publish.
