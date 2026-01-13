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

## 3.5) Theme endpoints (CMS + build)

Fetch current theme:

```powershell
$theme = Invoke-RestMethod -Uri "$BaseUrl/cms/theme" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Get
$theme
```

Expected: **200** with `{ ok: true, preset_id, updated_at }`.

Fetch preset list:

```powershell
$themePresets = Invoke-RestMethod -Uri "$BaseUrl/cms/theme/presets" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Get
$themePresets
```

Expected: **200** with `{ ok: true, presets: [ { id, name, swatch } ] }`.

Try updating theme (super admin only):

```powershell
$themeUpdateBody = @{ preset_id = "minimal-clean" } | ConvertTo-Json
$themeUpdate = Invoke-RestMethod -Uri "$BaseUrl/cms/theme" -Headers @{ "Origin" = $Origin } -WebSession $Session -Method Put -ContentType "application/json" -Body $themeUpdateBody
$themeUpdate
```

Expected: **200** for super admins; **403** `{ ok:false, error:"forbidden" }` for non-super admins.

Build theme (requires build token):

```powershell
$buildTheme = Invoke-RestMethod -Uri "$BaseUrl/build/theme" -Headers @{ "x-build-token" = $BuildToken }
$buildTheme
```

Expected: **200** with `{ ok: true, preset_id, tokens }`.

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

### 5.1) Pages deploy webhook (optional, if configured)
If you have configured `PAGES_WEBHOOK_SECRET`, you can simulate a deploy completion webhook to move an active job to `success` or `failed`.

```powershell
$WebhookSecret = "<PAGES_WEBHOOK_SECRET>"
$ProjectName = "<pages_project_name>"
$payload = @{
  project_name = $ProjectName
  status = "success"
  message = "Pages build completed"
  deployment_id = "example-deployment-id"
}
Invoke-RestMethod -Uri "$BaseUrl/public/deploy-jobs/webhook" -Method Post -Headers @{ "x-pages-webhook-secret" = $WebhookSecret } -Body ($payload | ConvertTo-Json) -ContentType "application/json"
```

Expected: **200** with `{ ok: true, deploy_job: { status: "success" } }`.

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
- **Missing auth tables**: login now creates `auth_login_attempts`/`auth_audit_logs` if absent; if creation fails, apply `0001_init.sql` migrations and redeploy.
- **D1 binding mismatch**: 500s or `Tenant not found` despite valid credentials/build token; confirm the Worker uses the correct D1 binding name and database.
- **CORS headers missing**: Preflight may fail or `Access-Control-Allow-Origin` absent; verify `Origin` is exactly `https://cms.ourcompany.com` and that the Worker deployed with the current CORS middleware.
- **Deploy hook missing (`expected deploy_job failed`)**: Publish may return `deploy_job.status: failed` with message about `pages_deploy_hook_url`; set the deploy hook URL in the tenant record and retry publish.
