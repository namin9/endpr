# Cloudflare Pages Deployment Runbook — Blog Template

This runbook documents how to deploy the **apps/blog** template to Cloudflare Pages with one Pages project per tenant.

## 1) Cloudflare Pages project settings

- **Git repository path / Root directory**: `apps/blog`
- **Build command (production)**: `npm run build`  
  - Cloudflare Pages will install dependencies automatically; do **not** use `npm run build:mock` in production.
- **Output directory**: `dist`

## 2) Required environment variables

Set these in the Pages project for each tenant:

- `PUBLIC_API_BASE` — e.g. `https://endpr.ni041372.workers.dev`
- `BUILD_TOKEN` — per-tenant build credential. Retrieve from D1 by querying the `tenants.build_token` column, for example:  
  ```sh
  wrangler d1 execute <DB_NAME> \
    --command "SELECT build_token FROM tenants WHERE slug='<tenant_slug>';"
  ```
  Use the returned value in the Pages environment variable.

## 3) Verification checklist (pre-deploy)

1. **Confirm build endpoints are reachable with the token**
   - From your local shell or a CI step, run:
     ```sh
    curl -I -H "x-build-token: $BUILD_TOKEN" "$PUBLIC_API_BASE/build/posts"
    curl -I -H "x-build-token: $BUILD_TOKEN" "$PUBLIC_API_BASE/build/categories"
     ```
   - Expect HTTP 200 responses.
2. **Confirm `dist` contains required assets after build**
   - Run `npm run build` locally with the tenant variables.
   - Verify these paths exist under `dist/`:
     - `sitemap.xml`
     - `robots.txt`
     - `posts/page/1/index.html`
     - `category/<category-slug>/page/1/index.html` (for at least one enabled category)
     - `<post-slug>/index.html` for recent posts.

## 4) Post-deploy smoke test (per tenant)

- Open the homepage and `/posts/page/1/` in the deployed Pages URL.
- Open a known post permalink by slug (e.g., `/<post-slug>/`).
- Confirm `/<post-slug>/` renders content and excerpts.
- Load `/sitemap.xml` to ensure the sitemap is served.

## 5) Common failure modes & fixes

- **401 from `/build/*`**  
  - Cause: `BUILD_TOKEN` missing or incorrect.  
  - Fix: Re-fetch the token from `tenants.build_token` and update the Pages environment variable.
- **5xx from `/build/*`**  
  - Cause: API downtime or tenant misconfiguration.  
  - Fix: Check the API Worker logs for the tenant; retry once the API is healthy.
- **`dist` not found**  
  - Cause: Output directory mis-set in Pages.  
  - Fix: Set Pages output directory to `dist` (relative to `apps/blog` root).
- **`build:mock` used in production**  
  - Cause: Mock build command configured.  
  - Fix: Ensure the Pages build command is `npm run build` and that `BUILD_TOKEN`/`PUBLIC_API_BASE` are set. Remove any `MOCK_BUILD_DATA_PATH` override.
