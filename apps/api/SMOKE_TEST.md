# SMOKE_TEST

Merge readiness criteria: This runbook is ready to merge once it lets any Windows PowerShell user validate the deployed Worker API end to end (CORS, auth/session, posts lifecycle, deploy jobs, build feeds) against `https://<worker-subdomain>.workers.dev` with no local npm installs, while clearly stating expected statuses/headers, how to reuse the same session, and how to fetch the build token from D1 without adding new endpoints.

## Base variables (PowerShell)

```powershell
$BaseUrl = "https://<worker-subdomain>.workers.dev"
$TenantSlug = "<tenant-slug>"
$AdminEmail = "<admin-email>"
$AdminPassword = "<admin-password>"
$Origin = "https://cms.ourcompany.com"
$BlockedOrigin = "https://evil.com"
$Session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
```

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

Expected: **204** with `Access-Control-Allow-Origin: https://cms.ourcompany.com`, `Access-Control-Allow-Methods: GET,POST,OPTIONS`, `Access-Control-Allow-Headers: Content-Type,x-build-token`, `Access-Control-Allow-Credentials: true`, and `Vary: Origin`.

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

Expected: **200**, JSON `{ user: { id, email, role }, tenant: { id, slug, name } }`, and `Set-Cookie: session=...; HttpOnly; Secure; SameSite=Lax`.

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
