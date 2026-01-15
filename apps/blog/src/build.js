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
      theme: parsed.theme || null,
      meta: { tenantSlug: process.env.TENANT_SLUG || null },
      siteConfig: parsed.siteConfig || { config: { logo_url: null, footer_text: null }, navigations: [] },
      homeSections: parsed.homeSections || parsed.home_sections || [],
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
  const metaResp = await fetchJson(`${apiBase}/build/meta`, buildToken);
  const metaTenant = metaResp?.tenant || {};
  const meta = { tenantSlug: metaTenant.slug || null };
  let siteConfig = { config: { logo_url: null, footer_text: null }, navigations: [] };
  try {
    const siteResp = await fetchJson(`${apiBase}/build/site`, buildToken);
    const config = {
      logo_url: siteResp?.logo_url ?? null,
      footer_text: siteResp?.footer_text ?? null,
    };
    const navigations = [
      ...(siteResp?.navigations?.header || []),
      ...(siteResp?.navigations?.footer || []),
    ];
    siteConfig = { config, navigations };
  } catch (error) {
    console.warn("Failed to load site config, falling back to defaults.", error);
  }
  let homeSections = [];
  try {
    const homeResp = await fetchJson(`${apiBase}/build/home`, buildToken);
    homeSections = Array.isArray(homeResp?.sections) ? homeResp.sections : [];
  } catch (error) {
    console.warn("Failed to load home layout, falling back to empty sections.", error);
  }
  return { posts: postsIndex, categories: categoriesIndex, theme: themePayload, meta, siteConfig, homeSections };
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
    "form",
    "input",
    "textarea",
    "button",
    "select",
    "option",
    "optgroup",
    "label",
    "fieldset",
    "legend",
    "div",
    "span",
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

function extractFirstImageUrl(post) {
  const sources = [post.body_html, post.body_md, post.body].filter(Boolean);
  const imgTagRegex = /<img[^>]*src=["']([^"']+)["']/i;
  const mdImgRegex = /!\[[^\]]*]\(([^)]+)\)/;
  for (const source of sources) {
    const htmlMatch = source.match(imgTagRegex);
    if (htmlMatch?.[1]) {
      const sanitized = sanitizeUrl(htmlMatch[1]);
      if (sanitized) return sanitized;
    }
    const mdMatch = source.match(mdImgRegex);
    if (mdMatch?.[1]) {
      const sanitized = sanitizeUrl(mdMatch[1]);
      if (sanitized) return sanitized;
    }
  }
  return null;
}

function summarizeBodyFormat(post) {
  if (post.body_html) return "body_html";
  if (post.body_md) return "body_md";
  if (post.body) return "body";
  return "empty";
}

function layoutHtml({
  title,
  content,
  description = "",
  scripts = "",
  siteConfig = null,
  pagePath = "/",
  ogImage = null,
  prevPost = null,
  nextPost = null,
} = {}) {
  const headerNav = Array.isArray(siteConfig?.navigations)
    ? siteConfig.navigations
        .filter((item) => item.location === "header")
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    : [];
  const navLinks = headerNav.length
    ? headerNav
        .map((item) => {
          const url = sanitizeUrl(item.url || "");
          if (!url) return "";
          const label = escapeHtml(item.label || item.url || "");
          return `<a href="${escapeHtml(url)}">${label}</a>`;
        })
        .filter(Boolean)
        .join("\n      ")
    : `<a href="/posts/page/1/">Posts</a>`;
  const logoUrl = siteConfig?.config?.logo_url ? sanitizeUrl(siteConfig.config.logo_url) : null;
  const footerText = siteConfig?.config?.footer_text
    ? escapeHtml(siteConfig.config.footer_text)
    : "";
  const resolvedOgImage = ogImage || logoUrl || null;
  const ogUrl = siteBaseUrl ? buildUrl(siteBaseUrl, pagePath) : null;
  const baseStyles = `<style>
  .search-shell { display: flex; align-items: center; gap: 8px; margin-top: 8px; position: relative; }
  .search-shell input { padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
  .search-results { position: absolute; top: 38px; left: 0; right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; display: grid; gap: 6px; z-index: 20; }
  .search-results.hidden { display: none; }
  .search-results a { text-decoration: none; color: inherit; padding: 4px 6px; border-radius: 6px; }
  .search-results a:hover { background: #f1f5f9; }
  .hero-banner { padding: 64px 24px; text-align: center; color: #fff; background-size: cover; background-position: center; border-radius: 16px; margin-bottom: 32px; }
  .hero-banner.sm { min-height: 200px; }
  .hero-banner.md { min-height: 320px; }
  .hero-banner.lg { min-height: 440px; }
  .hero-banner .hero-content { max-width: 720px; margin: 0 auto; backdrop-filter: blur(2px); }
  .hero-banner .hero-button { display: inline-block; margin-top: 16px; padding: 10px 18px; border-radius: 999px; background: #fff; color: #111827; text-decoration: none; font-weight: 600; }
  .features-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin: 24px 0; }
  .feature-card { padding: 16px; border-radius: 12px; background: #f8fafc; }
  .feature-card .icon { font-size: 24px; }
  .post-section { margin: 24px 0; }
  .post-section ul { list-style: none; padding: 0; }
  .post-section li { margin-bottom: 8px; }
  .post-nav { display: flex; justify-content: space-between; gap: 12px; padding: 16px 0; border-top: 1px solid #e2e8f0; }
  .post-nav a { text-decoration: none; }
  </style>`;
  const searchScript = `(function(){var input=document.querySelector('[data-search-input]');var results=document.querySelector('[data-search-results]');if(!input||!results){return;}var cache=null;function render(list){results.innerHTML='';if(!input.value.trim()){results.classList.add('hidden');return;}if(!list.length){results.innerHTML='<div class=\"muted\">검색 결과가 없습니다.</div>';results.classList.remove('hidden');return;}var items=list.map(function(item){return '<a href=\"/'+item.slug+'/\">'+(item.title||item.slug)+'</a>';}).join('');results.innerHTML=items;results.classList.remove('hidden');}function filter(){var q=input.value.trim().toLowerCase();if(!q){render([]);return;}if(!cache){fetch('/search.json').then(function(resp){return resp.ok?resp.json():[];}).then(function(data){cache=Array.isArray(data)?data:[];applyFilter();}).catch(function(){render([]);});return;}applyFilter();function applyFilter(){var filtered=cache.filter(function(item){return (item.title||'').toLowerCase().includes(q)||(item.slug||'').toLowerCase().includes(q)||(item.excerpt||'').toLowerCase().includes(q);}).slice(0,10);render(filtered);}}input.addEventListener('input',filter);})();`;
  const navigationLinks = [];
  if (prevPost) {
    navigationLinks.push(
      `<a href="/${prevPost.slug}/" class="nav-prev">← 이전 글: ${escapeHtml(prevPost.title || prevPost.slug)}</a>`
    );
  }
  if (nextPost) {
    navigationLinks.push(
      `<a href="/${nextPost.slug}/" class="nav-next">다음 글: ${escapeHtml(nextPost.title || nextPost.slug)} →</a>`
    );
  }
  const postNav = navigationLinks.length
    ? `<section class="post-nav">
      ${navigationLinks.join("")}
    </section>`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  ${ogUrl ? `<meta property="og:url" content="${escapeHtml(ogUrl)}" />` : ""}
  ${resolvedOgImage ? `<meta property="og:image" content="${escapeHtml(resolvedOgImage)}" />` : ""}
  <meta name="twitter:card" content="${resolvedOgImage ? "summary_large_image" : "summary"}" />
  ${baseStyles}
  ${themeStyle}
</head>
<body>
  <header>
    <h1>${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(title)}" />` : escapeHtml(title)}</h1>
    <nav>
      ${navLinks}
    </nav>
    <div class="search-shell">
      <span aria-hidden="true">🔍</span>
      <input type="search" placeholder="검색" data-search-input />
      <div class="search-results hidden" data-search-results></div>
    </div>
  </header>
  <main>
    ${content}
  </main>
  ${postNav}
  ${footerText ? `<footer>${footerText}</footer>` : ""}
  ${scripts}
  <script>${searchScript}</script>
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

function renderPostListItems(posts, { showDate = true } = {}) {
  return posts
    .map((post) => {
      const dateValue = post.published_at || post.publish_at || post.created_at;
      const dateLabel = showDate ? formatDateLabel(dateValue) : "";
      return `<li><a href="/${post.slug}/">${escapeHtml(post.title || post.slug)}</a>${
        showDate ? ` <time datetime="${escapeHtml(formatDate(dateValue))}">${escapeHtml(dateLabel)}</time>` : ""
      }</li>`;
    })
    .join("\n");
}

function renderSection(section) {
  if (!section || !section.type) return "";
  const type = section.type;
  if (type === "banner") {
    const backgroundUrl = sanitizeUrl(section.image_url || "");
    const heightClass = ["sm", "md", "lg"].includes(section.height_size) ? section.height_size : "md";
    const buttonLink = sanitizeUrl(section.button_link || "");
    return `<section class="hero-banner ${heightClass}"${
      backgroundUrl ? ` style="background-image:url('${escapeHtml(backgroundUrl)}')"` : ""
    }>
  <div class="hero-content">
    <h2>${escapeHtml(section.title || "")}</h2>
    <p>${escapeHtml(section.subtitle || "")}</p>
    ${buttonLink ? `<a class="hero-button" href="${escapeHtml(buttonLink)}">${escapeHtml(section.button_text || "자세히 보기")}</a>` : ""}
  </div>
</section>`;
  }
  if (type === "features") {
    const items = Array.isArray(section.items) ? section.items : [];
    const cards = items
      .map(
        (item) => `<div class="feature-card">
  <div class="icon">${escapeHtml(item.icon || "")}</div>
  <h3>${escapeHtml(item.title || "")}</h3>
  <p>${escapeHtml(item.description || "")}</p>
</div>`
      )
      .join("\n");
    return `<section>
  <h2>${escapeHtml(section.title || "")}</h2>
  <div class="features-grid">
    ${cards}
  </div>
</section>`;
  }
  if (type === "html") {
    return `<section>${section.raw_content || ""}</section>`;
  }

  const posts = Array.isArray(section.posts) ? section.posts : [];
  if (type === "hero") {
    const post = posts[0];
    if (!post) {
      return `<section class="post-section"><h2>${escapeHtml(section.title || "Hero")}</h2><p>게시물이 없습니다.</p></section>`;
    }
    return `<section class="post-section">
  <h2>${escapeHtml(section.title || "Hero")}</h2>
  <article>
    <h3><a href="/${post.slug}/">${escapeHtml(post.title || post.slug)}</a></h3>
    <p>${escapeHtml(post.excerpt || "")}</p>
  </article>
</section>`;
  }

  if (["latest", "popular", "pick"].includes(type)) {
    const title = section.title || (type === "latest" ? "Latest" : type === "popular" ? "Popular" : "Pick");
    const listItems = posts.length ? renderPostListItems(posts) : "<li>게시물이 없습니다.</li>";
    return `<section class="post-section">
  <h2>${escapeHtml(title)}</h2>
  <ul>
    ${listItems}
  </ul>
</section>`;
  }
  return "";
}

async function generatePostPages(posts, siteConfig) {
  for (let index = 0; index < posts.length; index += 1) {
    const post = posts[index];
    const prevPost = posts[index - 1] || null;
    const nextPost = posts[index + 1] || null;
    assertSlugAllowed(post.slug, "post");
    const html = layoutHtml({
      title: post.title || post.slug,
      description: post.excerpt || "",
      content: `<article>
  <h2>${escapeHtml(post.title || post.slug)}</h2>
  <p>${escapeHtml(post.excerpt || "")}</p>
  ${renderPostBody(post)}
</article>`,
      siteConfig,
      pagePath: `/${post.slug}/`,
      ogImage: extractFirstImageUrl(post),
      prevPost,
      nextPost,
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

async function generateStaticPages(pages, siteConfig) {
  for (const page of pages) {
    assertSlugAllowed(page.slug, "page");
    const html = layoutHtml({
      title: page.title || page.slug,
      description: page.excerpt || "",
      content: `<article>
  <h2>${escapeHtml(page.title || page.slug)}</h2>
  ${renderPostBody(page)}
</article>`,
      siteConfig,
      pagePath: `/${page.slug}/`,
      ogImage: extractFirstImageUrl(page),
      scripts: buildViewTrackingScript({
        apiBase: analyticsConfig.apiBase,
        tenantSlug: analyticsConfig.tenantSlug,
        pageKey: page.slug,
      }),
    });

    const filePath = path.join(DIST_DIR, page.slug, "index.html");
    await writeHtml(filePath, html);
  }
}

async function generatePostListPages(posts, siteConfig) {
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
      siteConfig,
      pagePath: `/posts/page/${page.page}/`,
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

async function generateHomepage(sections, siteConfig) {
  const safeSections = Array.isArray(sections) ? sections : [];
  const content = safeSections.length
    ? safeSections.map(renderSection).join("\n")
    : `<section class="post-section"><p>섹션이 없습니다.</p></section>`;

  const html = layoutHtml({
    title: "Home",
    description: "Latest posts from the blog.",
    content,
    siteConfig,
    pagePath: "/",
  });

  await writeHtml(path.join(DIST_DIR, "index.html"), html);
  console.log("Generated dist/index.html");
}

async function generateCategoryPages(posts, categories, siteConfig) {
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
        siteConfig,
        pagePath: `/category/${category.slug}/page/${page.page}/`,
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

async function generate404Page(siteConfig) {
  const html = layoutHtml({
    title: "404",
    description: "페이지를 찾을 수 없습니다.",
    content: `<section>
  <h2>페이지를 찾을 수 없습니다</h2>
  <p>요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
  <p><a href="/" class="ghost">홈으로 가기</a></p>
</section>`,
    siteConfig,
    pagePath: "/404.html",
  });
  await writeHtml(path.join(DIST_DIR, "404.html"), html);
}

async function generateSearchIndex(posts) {
  const items = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || "",
    published_at: post.published_at || post.publish_at || post.created_at || null,
  }));
  await writeFile(path.join(DIST_DIR, "search.json"), JSON.stringify(items));
}

async function generateRobots() {
  const content = `User-agent: *
Allow: /
Sitemap: ${siteBaseUrl}/sitemap.xml
`;
  await writeHtml(path.join(DIST_DIR, "robots.txt"), content);
}

async function generateSitemap(posts, categories, pages = []) {
  const urls = [];
  for (const post of [...posts, ...pages]) {
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

function resolvePostType(post) {
  return post?.type === "page" ? "page" : "post";
}

async function build() {
  const useMock = process.argv.includes("--mock") || !!process.env.MOCK_BUILD_DATA_PATH;
  const buildToken = process.env.BUILD_TOKEN;
  const apiBase = process.env.PUBLIC_API_BASE;
  const analyticsBase = process.env.ANALYTICS_API_BASE || apiBase;
  const siteBase = process.env.SITE_BASE_URL;

  if (!useMock) {
    if (!buildToken) throw new Error("BUILD_TOKEN is required for live builds.");
    if (!apiBase) throw new Error("PUBLIC_API_BASE is required for live builds.");
  }
  if (!siteBase) throw new Error("SITE_BASE_URL is required for sitemap generation.");
  siteBaseUrl = resolveSiteBaseUrl();

  const { posts: rawPosts, categories, theme, meta, siteConfig, homeSections } = await loadBuildData({
    apiBase,
    buildToken,
    useMock,
  });
  analyticsConfig = {
    apiBase: analyticsBase || "",
    tenantSlug: meta?.tenantSlug || "",
  };

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
  const postEntries = posts.filter((post) => resolvePostType(post) === "post");
  const pageEntries = posts.filter((post) => resolvePostType(post) === "page");

  await resetDist();
  await generateHomepage(homeSections, siteConfig);
  await generatePostPages(postEntries, siteConfig);
  await generatePostListPages(postEntries, siteConfig);
  await generateCategoryPages(postEntries, categories, siteConfig);
  await generateStaticPages(pageEntries, siteConfig);
  await generateSitemap(postEntries, categories, pageEntries);
  await generateSearchIndex(postEntries);
  await generateRobots();
  await generate404Page(siteConfig);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
