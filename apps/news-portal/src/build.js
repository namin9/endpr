import { readFile, rm, mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const PAGE_SIZE = 10;
const RESERVED_SLUGS = [
  "posts",
  "category",
  "tag",
  "search",
  "assets",
  "api",
  "cms",
  "sitemap.xml",
  "robots.txt",
];

function resolveSiteBaseUrl() {
  const baseUrl =
    process.env.SITE_BASE_URL ||
    process.env.CF_PAGES_URL ||
    "https://endpr.pages.dev";
  return baseUrl.replace(/\/$/, "");
}

let siteBaseUrl = "";
let themeStyle = "";
let analyticsConfig = { apiBase: "", tenantSlug: "" };
let siteConfig = { logo_url: null, footer_text: null, navigations: { header: [], footer: [] } };
let homeSections = [];
let siteTitle = "News Portal";

function assertSlugAllowed(slug, entityType) {
  const normalized = `${slug}`.toLowerCase();
  if (RESERVED_SLUGS.includes(normalized)) {
    throw new Error(
      `Reserved slug "${slug}" detected for ${entityType}. ` +
        "Adjust the slug in the source data or skip this entry before building."
    );
  }
}

async function fetchJson(url, buildToken) {
  const response = await fetch(url, {
    headers: { "x-build-token": buildToken },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed for ${url}: ${response.status} ${text}`);
  }
  return response.json();
}

async function fetchOptionalJson(url, buildToken, fallback) {
  try {
    return await fetchJson(url, buildToken);
  } catch (error) {
    console.warn(`Optional request failed for ${url}. Using fallback.`, error);
    return fallback;
  }
}

async function loadBuildData({ apiBase, buildToken, useMock }) {
  if (useMock) {
    const mockPath = path.resolve(
      ROOT_DIR,
      process.env.MOCK_BUILD_DATA_PATH || "./fixtures/sample.json"
    );
    const raw = await readFile(mockPath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      posts: parsed.posts || [],
      categories: parsed.categories || [],
      site: parsed.site || siteConfig,
      home: parsed.home || { sections: [] },
      theme: parsed.theme || null,
      meta: { tenantSlug: process.env.TENANT_SLUG || null },
    };
  }

  const postsResp = await fetchJson(`${apiBase}/build/posts`, buildToken);
  const postsIndex = Array.isArray(postsResp)
    ? postsResp
    : postsResp.posts ?? [];
  if (!Array.isArray(postsIndex)) {
    throw new Error("Invalid /build/posts response shape");
  }

  const categoriesResp = await fetchJson(`${apiBase}/build/categories`, buildToken);
  const categoriesIndex = Array.isArray(categoriesResp)
    ? categoriesResp
    : categoriesResp.categories ?? [];
  if (!Array.isArray(categoriesIndex)) {
    throw new Error("Invalid /build/categories response shape");
  }

  const themeResp = await fetchJson(`${apiBase}/build/theme`, buildToken);
  const themePayload = themeResp?.tokens ? themeResp : null;
  const siteResp = await fetchOptionalJson(`${apiBase}/build/site`, buildToken, siteConfig);
  const homeResp = await fetchOptionalJson(`${apiBase}/build/home`, buildToken, { sections: [] });
  const metaResp = await fetchJson(`${apiBase}/build/meta`, buildToken);
  const metaTenant = metaResp?.tenant || {};
  const meta = { tenantSlug: metaTenant.slug || null };
  return {
    posts: postsIndex,
    categories: categoriesIndex,
    site: siteResp || siteConfig,
    home: homeResp || { sections: [] },
    theme: themePayload,
    meta,
  };
}

async function resetDist() {
  await rm(DIST_DIR, { recursive: true, force: true });
  await mkdir(DIST_DIR, { recursive: true });
}

function escapeHtml(value) {
  return `${value}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeUrl(url, { allowDataImage = false } = {}) {
  if (!url) return null;
  const trimmed = `${url}`.trim();
  if (allowDataImage && /^data:image\//i.test(trimmed)) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  return null;
}

function sanitizeHtmlAttributes(rawAttrs) {
  if (!rawAttrs) return "";
  const attrs = [];
  const attrRegex = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/gi;
  let match;
  while ((match = attrRegex.exec(rawAttrs))) {
    const name = match[1];
    const rawValue = match[2] ?? match[3] ?? match[4] ?? "";
    if (/^on/i.test(name)) continue;
    if (["href", "src"].includes(name.toLowerCase())) {
      const sanitized = sanitizeUrl(rawValue, { allowDataImage: name.toLowerCase() === "src" });
      if (!sanitized) continue;
      attrs.push(`${name}="${escapeHtml(sanitized)}"`);
      continue;
    }
    if (["alt", "title"].includes(name.toLowerCase())) {
      attrs.push(`${name}="${escapeHtml(rawValue)}"`);
    }
  }
  return attrs.length ? ` ${attrs.join(" ")}` : "";
}

function sanitizeHtmlBlock(html) {
  const withoutScripts = `${html}`.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  // Allowed HTML tags if raw HTML appears in body_md (others are escaped).
  const allowedTags = new Set([
    "br",
    "p",
    "strong",
    "em",
    "code",
    "pre",
    "blockquote",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "a",
    "img",
  ]);

  return withoutScripts.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, tagName, attrs) => {
    const tag = tagName.toLowerCase();
    if (!allowedTags.has(tag)) {
      return escapeHtml(match);
    }
    if (tag === "br") return "<br />";
    if (tag === "img") {
      const sanitized = sanitizeHtmlAttributes(attrs);
      return `<img${sanitized} />`;
    }
    const sanitizedAttrs = sanitizeHtmlAttributes(attrs);
    if (match.startsWith("</")) {
      return `</${tag}>`;
    }
    return `<${tag}${sanitizedAttrs}>`;
  });
}

function renderInlineMarkdown(text) {
  if (!text) return "";
  const replacements = [];
  let output = `${text}`;

  const store = (html) => {
    const token = `__INLINE_TOKEN_${replacements.length}__`;
    replacements.push(html);
    return token;
  };

  output = output.replace(/`([^`]+)`/g, (_, code) => {
    return store(`<code>${escapeHtml(code)}</code>`);
  });

  output = output.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
    const sanitized = sanitizeUrl(url, { allowDataImage: true });
    if (!sanitized) return store(escapeHtml(_));
    return store(`<img src="${escapeHtml(sanitized)}" alt="${escapeHtml(alt)}" />`);
  });

  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const sanitized = sanitizeUrl(url);
    if (!sanitized) return store(escapeHtml(label));
    return store(
      `<a href="${escapeHtml(sanitized)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`
    );
  });

  output = output.replace(/\*\*([^*]+)\*\*/g, (_, content) => {
    return store(`<strong>${escapeHtml(content)}</strong>`);
  });

  output = output.replace(/\*([^*]+)\*/g, (_, content) => {
    return store(`<em>${escapeHtml(content)}</em>`);
  });

  output = escapeHtml(output);
  replacements.forEach((replacement, index) => {
    output = output.replace(`__INLINE_TOKEN_${index}__`, replacement);
  });

  return output;
}

function renderMarkdown(md = "") {
  if (!md) return "";
  const lines = `${md}`.split("\n");
  const blocks = [];
  let currentParagraph = [];
  let currentList = null;
  let inCodeBlock = false;
  let codeBuffer = [];

  const flushParagraph = () => {
    if (!currentParagraph.length) return;
    blocks.push(`<p>${currentParagraph.join("<br />")}</p>`);
    currentParagraph = [];
  };

  const flushList = () => {
    if (!currentList || !currentList.items.length) return;
    const tag = currentList.type === "ol" ? "ol" : "ul";
    blocks.push(`<${tag}>${currentList.items.map((item) => `<li>${item}</li>`).join("")}</${tag}>`);
    currentList = null;
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd();
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        blocks.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        flushParagraph();
        flushList();
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      return;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      return;
    }

    if (/^<\/?[a-z][\s\S]*>/i.test(line.trim())) {
      flushParagraph();
      flushList();
      blocks.push(sanitizeHtmlBlock(line));
      return;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      blocks.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`);
      return;
    }

    const blockquoteMatch = line.match(/^>\s+(.+)/);
    if (blockquoteMatch) {
      flushParagraph();
      flushList();
      blocks.push(`<blockquote>${renderInlineMarkdown(blockquoteMatch[1])}</blockquote>`);
      return;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)/);
    if (orderedMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(renderInlineMarkdown(orderedMatch[1]));
      return;
    }

    const listMatch = line.match(/^[-*]\s+(.+)/);
    if (listMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(renderInlineMarkdown(listMatch[1]));
      return;
    }

    currentParagraph.push(renderInlineMarkdown(line));
  });

  flushParagraph();
  flushList();

  if (inCodeBlock) {
    blocks.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
  }

  return blocks.join("\n");
}

function renderPostBody(post) {
  if (post.body_html) return post.body_html;
  if (post.body_md) return renderMarkdown(post.body_md);
  if (post.body) return renderMarkdown(post.body);
  return "<p></p>";
}

function extractFirstImage(post) {
  const sources = [post.body_html, post.body_md, post.body].filter(Boolean).join("\n");
  if (!sources) return null;
  const htmlMatch = sources.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (htmlMatch) {
    return sanitizeUrl(htmlMatch[1], { allowDataImage: true });
  }
  const mdMatch = sources.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (mdMatch) {
    return sanitizeUrl(mdMatch[1], { allowDataImage: true });
  }
  return null;
}

function summarizeBodyFormat(post) {
  if (post.body_html) return "body_html";
  if (post.body_md) return "body_md";
  if (post.body) return "body";
  return "empty";
}

function renderNavItems(items = []) {
  if (!items.length) return "";
  return items
    .map((item) => `<a href="${escapeHtml(item.url)}">${escapeHtml(item.label)}</a>`)
    .join("");
}

function layoutHtml({ title, content, description = "", scripts = "" }) {
  const headerNav = renderNavItems(siteConfig.navigations?.header || []);
  const footerNav = renderNavItems(siteConfig.navigations?.footer || []);
  const logoMarkup = siteConfig.logo_url
    ? `<img src="${escapeHtml(siteConfig.logo_url)}" alt="${escapeHtml(siteTitle)}" />`
    : `<span>${escapeHtml(siteTitle)}</span>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  ${themeStyle}
  <style>
    :root { color-scheme: light; }
    body { margin: 0; font-family: "Source Serif 4", "Times New Roman", serif; background: #f7f7f4; color: #111; }
    a { color: inherit; text-decoration: none; }
    img { max-width: 100%; display: block; }
    .site-shell { max-width: 1200px; margin: 0 auto; padding: 24px; }
    .site-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 3px solid #111; padding-bottom: 16px; }
    .logo { display: flex; align-items: center; gap: 12px; font-size: 26px; font-weight: 700; }
    .logo img { height: 40px; width: auto; }
    .nav { display: flex; flex-wrap: wrap; gap: 16px; font-weight: 600; letter-spacing: 0.02em; }
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 24px; margin-top: 24px; }
    .hero { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr); gap: 20px; border-bottom: 2px solid #111; padding-bottom: 24px; }
    .hero h2 { font-size: 32px; margin: 0 0 8px; }
    .hero .meta { font-size: 14px; color: #555; }
    .section { border-top: 2px solid #111; padding-top: 20px; margin-top: 20px; }
    .section h3 { margin: 0 0 12px; font-size: 20px; letter-spacing: 0.04em; text-transform: uppercase; }
    .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
    .card { border: 1px solid #ddd; padding: 12px; background: #fff; }
    .card h4 { margin: 8px 0; font-size: 18px; }
    .sidebar { position: sticky; top: 24px; align-self: start; border-left: 2px solid #111; padding-left: 16px; }
    .sidebar h4 { margin-top: 0; text-transform: uppercase; font-size: 16px; letter-spacing: 0.08em; }
    .sidebar ol { padding-left: 18px; }
    footer { margin-top: 40px; border-top: 3px solid #111; padding: 24px 0; font-size: 14px; color: #555; }
    footer .nav { margin-bottom: 8px; }
    @media (max-width: 900px) {
      .layout { grid-template-columns: minmax(0, 1fr); }
      .hero { grid-template-columns: minmax(0, 1fr); }
      .sidebar { border-left: none; padding-left: 0; border-top: 2px solid #111; padding-top: 16px; }
    }
  </style>
</head>
<body>
  <div class="site-shell">
    <header class="site-header">
      <div class="logo"><a href="/">${logoMarkup}</a></div>
      <nav class="nav">${headerNav}</nav>
    </header>
    <main>
      ${content}
    </main>
    <footer>
      ${footerNav ? `<nav class="nav">${footerNav}</nav>` : ""}
      <div>${escapeHtml(siteConfig.footer_text || "")}</div>
    </footer>
  </div>
  ${scripts}
</body>
</html>`;
}

function buildViewTrackingScript({ apiBase, tenantSlug, pageKey }) {
  if (!apiBase || !tenantSlug || !pageKey) return "";
  const endpoint = `${apiBase.replace(/\/$/, "")}/public/view`;
  const payload = { tenantSlug, pageKey };
  return `<script>
(function() {
  var url = ${JSON.stringify(endpoint)};
  var payload = ${JSON.stringify(payload)};
  try {
    if (navigator.sendBeacon) {
      var blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }
  } catch (e) {}
  fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(function() {});
})();
</script>`;
}

function buildThemeStyle(tokens) {
  if (!tokens) return "";
  const toCss = (vars) =>
    Object.entries(vars)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join("\n");
  const light = toCss(tokens.light || {});
  const dark = toCss(tokens.dark || {});
  return `<style id="theme-tokens">
:root {
${light}
}
@media (prefers-color-scheme: dark) {
  :root {
${dark}
  }
}
body { background: var(--bg); color: var(--fg); font-family: var(--font-sans); }
a { color: var(--link); }
hr, .border, .card, .post-card { border-color: var(--border); }
.card, .post-card { border-radius: var(--radius); }
</style>`;
}

async function writeHtml(filePath, html) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, html, "utf8");
}

function paginate(items, pageSize) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  return Array.from({ length: totalPages }, (_, index) => {
    const start = index * pageSize;
    const end = start + pageSize;
    return {
      page: index + 1,
      totalPages,
      items: items.slice(start, end),
    };
  });
}

function normalizeTimestamp(value) {
  if (!Number.isFinite(value)) return null;
  const normalized = value < 1e12 ? value * 1000 : value;
  return new Date(normalized);
}

function formatDate(value) {
  if (!value) return "";
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  }

  if (typeof value === "number") {
    const date = normalizeTimestamp(value);
    return date && !Number.isNaN(date.getTime()) ? date.toISOString() : "";
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      const numeric = normalizeTimestamp(Number(trimmed));
      return numeric && !Number.isNaN(numeric.getTime())
        ? numeric.toISOString()
        : "";
    }
    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function formatDateLabel(value) {
  const iso = formatDate(value);
  if (!iso) return "";
  return iso.split("T")[0];
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

function buildUrl(baseUrl, urlPath) {
  const normalizedBase = normalizeBaseUrl(baseUrl);
  const normalizedPath = urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
  return `${normalizedBase}${normalizedPath}`;
}

function formatSitemapLastmod(value) {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    if (value >= 1e12) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }
    if (value >= 1e9) {
      const date = new Date(value * 1000);
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      return formatSitemapLastmod(Number(trimmed));
    }
    const parsed = Date.parse(trimmed);
    if (Number.isNaN(parsed)) return null;
    const date = new Date(parsed);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function generatePostPages(posts) {
  for (const post of posts) {
    assertSlugAllowed(post.slug, "post");
    const html = layoutHtml({
      title: post.title || post.slug,
      description: post.excerpt || "",
      content: `<article>
  <h2>${escapeHtml(post.title || post.slug)}</h2>
  <p>${escapeHtml(post.excerpt || "")}</p>
  ${renderPostBody(post)}
</article>`,
      scripts: buildViewTrackingScript({
        apiBase: analyticsConfig.apiBase,
        tenantSlug: analyticsConfig.tenantSlug,
        pageKey: post.slug,
      }),
    });

    const filePath = path.join(DIST_DIR, post.slug, "index.html");
    await writeHtml(filePath, html);
  }
}

async function generatePostListPages(posts) {
  const pages = paginate(posts, PAGE_SIZE);
  for (const page of pages) {
    const entries = page.items
      .map(
        (post) =>
          `<li><a href="/${post.slug}/">${escapeHtml(
            post.title || post.slug
          )}</a> <small>${escapeHtml(post.excerpt || "")}</small></li>`
      )
      .join("\n");

    const html = layoutHtml({
      title: `Posts — Page ${page.page}`,
      content: `<ol start="${(page.page - 1) * PAGE_SIZE + 1}">
${entries}
</ol>
<p>Page ${page.page} of ${page.totalPages}</p>`,
    });

    const filePath = path.join(
      DIST_DIR,
      "posts",
      "page",
      String(page.page),
      "index.html"
    );
    await writeHtml(filePath, html);
  }
}

async function generateHomepage(posts) {
  const sections = Array.isArray(homeSections) && homeSections.length ? homeSections : [];
  const fallbackSection = { type: "latest", title: "최신글", posts: posts.slice(0, PAGE_SIZE) };
  const heroSection = sections[0] || fallbackSection;
  const heroPost = heroSection?.posts?.[0] || posts[0];

  const renderCard = (post) => {
    const image = extractFirstImage(post);
    return `<article class="card">
      ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(post.title || post.slug)}" />` : ""}
      <h4><a href="/${post.slug}/">${escapeHtml(post.title || post.slug)}</a></h4>
      <p class="muted">${escapeHtml(post.excerpt || "")}</p>
    </article>`;
  };

  const heroMarkup = heroPost
    ? `<section class="hero">
      ${extractFirstImage(heroPost) ? `<img src="${escapeHtml(extractFirstImage(heroPost))}" alt="${escapeHtml(heroPost.title || heroPost.slug)}" />` : ""}
      <div>
        <p class="meta">${escapeHtml(heroSection.title || "Top Story")}</p>
        <h2><a href="/${heroPost.slug}/">${escapeHtml(heroPost.title || heroPost.slug)}</a></h2>
        <p>${escapeHtml(heroPost.excerpt || "")}</p>
      </div>
    </section>`
    : `<p>게시물이 없습니다.</p>`;

  const gridSections = (sections.length ? sections.slice(1) : [fallbackSection]).map((section) => {
    const items = section.posts && section.posts.length ? section.posts : posts.slice(0, PAGE_SIZE);
    const cards = items.map(renderCard).join("");
    return `<section class="section">
      <h3>${escapeHtml(section.title || "Section")}</h3>
      <div class="grid">${cards}</div>
    </section>`;
  });

  const sidebarSection =
    sections.find((section) => section.type === "popular" && section.posts?.length) || sections[1];
  const sidebarPosts = sidebarSection?.posts?.length ? sidebarSection.posts.slice(0, 6) : posts.slice(0, 6);
  const sidebarList = sidebarPosts
    .map((post) => `<li><a href="/${post.slug}/">${escapeHtml(post.title || post.slug)}</a></li>`)
    .join("");

  const content = `
    ${heroMarkup}
    <div class="layout">
      <div>
        ${gridSections.join("")}
      </div>
      <aside class="sidebar">
        <h4>${escapeHtml(sidebarSection?.title || "Popular")}</h4>
        <ol>${sidebarList}</ol>
      </aside>
    </div>
  `;

  const html = layoutHtml({
    title: siteTitle,
    description: "News highlights and latest coverage.",
    content,
  });

  await writeHtml(path.join(DIST_DIR, "index.html"), html);
  console.log("Generated dist/index.html");
}

async function generateCategoryPages(posts, categories) {
  const enabledCategories = categories.filter(
    (category) => category.enabled !== false
  );

  for (const category of enabledCategories) {
    assertSlugAllowed(category.slug, "category");
    const filtered = posts.filter(
      (post) => post.category_slug === category.slug
    );
    const pages = paginate(filtered, PAGE_SIZE);
    for (const page of pages) {
      const entries = page.items
        .map(
          (post) =>
            `<li><a href="/${post.slug}/">${escapeHtml(
              post.title || post.slug
            )}</a></li>`
        )
        .join("\n");

      const html = layoutHtml({
        title: `${escapeHtml(category.name || category.slug)} — Page ${
          page.page
        }`,
        content: `<h2>${escapeHtml(category.name || category.slug)}</h2>
<ul>
${entries}
</ul>
<p>Page ${page.page} of ${page.totalPages}</p>`,
      });

      const filePath = path.join(
        DIST_DIR,
        "category",
        category.slug,
        "page",
        String(page.page),
        "index.html"
      );
      await writeHtml(filePath, html);
    }
  }
}

async function generateRobots() {
  const content = `User-agent: *
Allow: /
Sitemap: ${siteBaseUrl}/sitemap.xml
`;
  await writeHtml(path.join(DIST_DIR, "robots.txt"), content);
}

async function generateSitemap(posts, categories) {
  const urls = [];
  for (const post of posts) {
    const lastmodValue =
      post.published_at || post.updated_at || post.created_at || null;
    const lastmod = formatSitemapLastmod(lastmodValue);
    if (!lastmod) {
      console.warn(
        `Skipping lastmod for post "${post.slug}" due to invalid date value.`
      );
    }
    urls.push({
      loc: buildUrl(siteBaseUrl, `/${post.slug}/`),
      lastmod,
    });
  }

  const postPages = paginate(posts, PAGE_SIZE);
  for (const page of postPages) {
    urls.push({
      loc: buildUrl(siteBaseUrl, `/posts/page/${page.page}/`),
    });
  }

  const enabledCategories = categories.filter(
    (category) => category.enabled !== false
  );
  for (const category of enabledCategories) {
    const filtered = posts.filter(
      (post) => post.category_slug === category.slug
    );
    const categoryPages = paginate(filtered, PAGE_SIZE);
    for (const page of categoryPages) {
      urls.push({
        loc: buildUrl(
          siteBaseUrl,
          `/category/${category.slug}/page/${page.page}/`
        ),
      });
    }
  }

  const xmlEntries = urls
    .map(
      (entry) => `<url>
  <loc>${escapeHtml(entry.loc)}</loc>
  ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}
</url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>
`;
  await writeHtml(path.join(DIST_DIR, "sitemap.xml"), xml);
  console.log(`Generated dist/sitemap.xml (${urls.length} urls)`);
}

function sortPosts(posts) {
  return [...posts].sort((a, b) => {
    const aDate = new Date(a.published_at || a.publish_at || a.created_at || 0);
    const bDate = new Date(b.published_at || b.publish_at || b.created_at || 0);
    return bDate.getTime() - aDate.getTime();
  });
}

async function build() {
  const useMock = process.argv.includes("--mock") || !!process.env.MOCK_BUILD_DATA_PATH;
  const buildToken = process.env.BUILD_TOKEN;
  const apiBase = process.env.PUBLIC_API_BASE;
  const analyticsBase = process.env.ANALYTICS_API_BASE || apiBase;
  const siteBase = process.env.SITE_BASE_URL;

  const shouldUseMock = useMock || !buildToken || !apiBase;
  if (!useMock && shouldUseMock) {
    console.warn("BUILD_TOKEN or PUBLIC_API_BASE missing. Falling back to mock build.");
  }
  if (!siteBase) throw new Error("SITE_BASE_URL is required for sitemap generation.");
  siteBaseUrl = resolveSiteBaseUrl();

  const { posts: rawPosts, categories, site, home, theme, meta } = await loadBuildData({
    apiBase,
    buildToken,
    useMock: shouldUseMock,
  });
  analyticsConfig = {
    apiBase: analyticsBase || "",
    tenantSlug: meta?.tenantSlug || "",
  };
  siteConfig = site || siteConfig;
  homeSections = home?.sections || [];
  siteTitle = process.env.SITE_TITLE || meta?.tenantSlug || "News Portal";

  if (theme?.tokens) {
    themeStyle = buildThemeStyle(theme.tokens);
  }

  const bodySummary = rawPosts.reduce(
    (acc, post) => {
      const key = summarizeBodyFormat(post);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {}
  );
  console.log("Post body format summary:", bodySummary);

  const htmlTagCount = rawPosts.reduce((acc, post) => {
    if (!post.body_md) return acc;
    return acc + (/<\/?[a-z][\s\S]*>/i.test(post.body_md) ? 1 : 0);
  }, 0);
  if (htmlTagCount) {
    console.log(`Post body markdown contains HTML tags: ${htmlTagCount}`);
  }

  const posts = sortPosts(rawPosts);

  await resetDist();
  await generateHomepage(posts);
  await generatePostPages(posts);
  await generatePostListPages(posts);
  await generateCategoryPages(posts, categories);
  await generateSitemap(posts, categories);
  await generateRobots();
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
