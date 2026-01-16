import { readFile, rm, mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { marked } from "marked"; // NOTE: requires the `marked` dependency at runtime.

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
let searchEnabled = true;

marked.setOptions({ gfm: true, breaks: true });

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
      siteConfig: parsed.siteConfig || { config: { logo_url: null, footer_text: null, search_enabled: true }, navigations: [] },
      homeSections: parsed.homeSections || parsed.home_sections || [],
    };
  }

  const allPosts = [];
  let page = 1;
  let hasNext = true;
  while (hasNext) {
    if (page > 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    const postsResp = await fetchJson(`${apiBase}/build/posts?page=${page}&limit=100`, buildToken);
    const chunk = Array.isArray(postsResp) ? postsResp : postsResp.posts ?? [];
    if (!Array.isArray(chunk)) {
      throw new Error("Invalid /build/posts response shape");
    }
    allPosts.push(...chunk);
    hasNext = Boolean(postsResp?.meta?.has_next);
    page += 1;
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
  let siteConfig = { config: { logo_url: null, footer_text: null, search_enabled: true }, navigations: [] };
  try {
    const siteResp = await fetchJson(`${apiBase}/build/site`, buildToken);
    const config = {
      logo_url: siteResp?.logo_url ?? null,
      footer_text: siteResp?.footer_text ?? null,
      search_enabled: siteResp?.search_enabled ?? 1,
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
  return { posts: allPosts, categories: categoriesIndex, theme: themePayload, meta, siteConfig, homeSections };
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
    if (["href", "src", "action"].includes(name.toLowerCase())) {
      const sanitized = sanitizeUrl(rawValue, { allowDataImage: name.toLowerCase() === "src" });
      if (!sanitized) continue;
      attrs.push(`${name}="${escapeHtml(sanitized)}"`);
      continue;
    }
    if (["name", "type", "value", "placeholder", "required", "method"].includes(name.toLowerCase())) {
      attrs.push(`${name}="${escapeHtml(rawValue)}"`);
      continue;
    }
    if (["class", "style"].includes(name.toLowerCase())) {
      attrs.push(`${name}="${escapeHtml(rawValue)}"`);
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
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "del",
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
    "details",
    "summary",
    "section",
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

function parseShortcodeAttributes(raw = "") {
  const attributes = {};
  const attrRegex = /(\w+)=(?:"([^"]*)"|'([^']*)')/g;
  let match;
  while ((match = attrRegex.exec(raw))) {
    const key = match[1];
    const value = match[2] ?? match[3] ?? "";
    attributes[key] = value;
  }
  return attributes;
}

function processShortcodes(text = "") {
  if (!text) return "";

  const renderContent = (content) => marked.parse(processShortcodes(content || ""));

  let output = `${text}`;

  output = output.replace(/\[Hero([^\]]*)\]/gi, (_, rawAttrs) => {
    const attrs = parseShortcodeAttributes(rawAttrs);
    const image = sanitizeUrl(attrs.image || "");
    const title = escapeHtml(attrs.title || "");
    const subtitle = escapeHtml(attrs.subtitle || "");
    return `<section class="hero"${image ? ` style="background-image:url('${escapeHtml(image)}')"` : ""}>
  <div class="hero-content">
    <h1>${title}</h1>
    <p>${subtitle}</p>
  </div>
</section>`;
  });

  output = output.replace(/\[Callout([^\]]*)\]([\s\S]*?)\[\/Callout\]/gi, (_, rawAttrs, content) => {
    const attrs = parseShortcodeAttributes(rawAttrs);
    const type = attrs.type || "info";
    const title = attrs.title ? `<div class="callout-title">${escapeHtml(attrs.title)}</div>` : "";
    const body = renderContent(content);
    return `<div class="callout callout-${escapeHtml(type)}">${title}<div class="callout-body">${body}</div></div>`;
  });

  output = output.replace(/\[Grid([^\]]*)\]([\s\S]*?)\[\/Grid\]/gi, (_, rawAttrs, content) => {
    const attrs = parseShortcodeAttributes(rawAttrs);
    const columns = Number(attrs.columns || 2);
    const safeColumns = columns === 3 ? 3 : 2;
    const body = renderContent(content);
    return `<div class="grid" style="--columns:${safeColumns}">${body}</div>`;
  });

  output = output.replace(/\[Card([^\]]*)\]([\s\S]*?)\[\/Card\]/gi, (_, rawAttrs, content) => {
    const attrs = parseShortcodeAttributes(rawAttrs);
    const icon = attrs.icon ? `<div class="card-icon">${escapeHtml(attrs.icon)}</div>` : "";
    const title = attrs.title ? `<h3>${escapeHtml(attrs.title)}</h3>` : "";
    const body = renderContent(content);
    return `<div class="card">${icon}<div class="card-body">${title}${body}</div></div>`;
  });

  output = output.replace(/\[Details([^\]]*)\]([\s\S]*?)\[\/Details\]/gi, (_, rawAttrs, content) => {
    const attrs = parseShortcodeAttributes(rawAttrs);
    const summary = escapeHtml(attrs.summary || "Details");
    const body = renderContent(content);
    return `<details class="details"><summary>${summary}</summary>${body}</details>`;
  });

  output = output.replace(/\[Button([^\]]*)\]([\s\S]*?)\[\/Button\]/gi, (_, rawAttrs, content) => {
    const attrs = parseShortcodeAttributes(rawAttrs);
    const link = sanitizeUrl(attrs.link || "");
    const color = attrs.color === "primary" ? "primary" : "secondary";
    const label = escapeHtml(content.trim());
    if (!link) {
      return `<span class="btn btn-${color}">${label}</span>`;
    }
    return `<a class="btn btn-${color}" href="${escapeHtml(link)}">${label}</a>`;
  });

  output = output.replace(/\[Newsletter\]/gi, () => {
    const apiBase = analyticsConfig.apiBase ? analyticsConfig.apiBase.replace(/\/$/, "") : "";
    const actionUrl = apiBase ? `${apiBase}/public/subscribe` : "/public/subscribe";
    const tenantSlug = analyticsConfig.tenantSlug || "";
    return `<form class="newsletter" method="post" action="${escapeHtml(actionUrl)}">
  <input type="hidden" name="tenantSlug" value="${escapeHtml(tenantSlug)}" />
  <input type="email" name="email" placeholder="이메일을 입력하세요" required />
  <button type="submit" class="btn btn-primary">구독하기</button>
</form>`;
  });

  return output;
}

function renderMarkdown(md = "") {
  if (!md) return "";
  const processed = processShortcodes(md);
  const html = marked.parse(processed);
  return sanitizeHtmlBlock(html);
}

function renderEditorList(items = [], style = "unordered") {
  const tag = style === "ordered" ? "ol" : "ul";
  const rendered = items
    .map((item) => {
      if (typeof item === "string") {
        return `<li>${sanitizeHtmlBlock(item)}</li>`;
      }
      if (item && typeof item === "object") {
        const content = sanitizeHtmlBlock(item.content || "");
        const nested = Array.isArray(item.items) && item.items.length ? renderEditorList(item.items, style) : "";
        return `<li>${content}${nested}</li>`;
      }
      return "";
    })
    .join("");
  return `<${tag}>${rendered}</${tag}>`;
}

function renderEditorBlocks(blocks = []) {
  return blocks
    .map((block) => {
      const data = block?.data || {};
      switch (block.type) {
        case "header": {
          const level = Math.min(Math.max(Number(data.level) || 2, 1), 6);
          return `<h${level}>${sanitizeHtmlBlock(data.text || "")}</h${level}>`;
        }
        case "paragraph":
          return `<p>${sanitizeHtmlBlock(data.text || "")}</p>`;
        case "list":
          return renderEditorList(data.items || [], data.style);
        case "image": {
          const url = sanitizeUrl(data.file?.url || data.url || "", { allowDataImage: true });
          if (!url) return "";
          const caption = data.caption ? `<figcaption>${sanitizeHtmlBlock(data.caption)}</figcaption>` : "";
          return `<figure><img src="${escapeHtml(url)}" alt="" />${caption}</figure>`;
        }
        case "table": {
          const rows = Array.isArray(data.content) ? data.content : [];
          const body = rows
            .map((row) => {
              const cells = Array.isArray(row)
                ? row.map((cell) => `<td>${sanitizeHtmlBlock(cell || "")}</td>`).join("")
                : "";
              return `<tr>${cells}</tr>`;
            })
            .join("");
          return `<table><tbody>${body}</tbody></table>`;
        }
        case "embed": {
          const embedUrl = sanitizeUrl(data.embed || data.source || "");
          if (!embedUrl) {
            return data.source ? `<a href="${escapeHtml(data.source)}">${escapeHtml(data.source)}</a>` : "";
          }
          return `<div class="embed"><iframe src="${escapeHtml(embedUrl)}" allowfullscreen loading="lazy"></iframe></div>`;
        }
        case "warning": {
          const title = data.title ? `<div class="callout-title">${sanitizeHtmlBlock(data.title)}</div>` : "";
          const message = data.message ? `<div class="callout-body">${sanitizeHtmlBlock(data.message)}</div>` : "";
          return `<div class="callout callout-warning">${title}${message}</div>`;
        }
        case "code":
          return `<pre><code>${escapeHtml(data.code || "")}</code></pre>`;
        default:
          return "";
      }
    })
    .join("");
}

function renderPostContent(post) {
  if (post.body_json) {
    try {
      const parsed = JSON.parse(post.body_json);
      if (Array.isArray(parsed?.blocks)) {
        return renderEditorBlocks(parsed.blocks);
      }
    } catch (error) {
      console.warn("Failed to parse body_json, falling back to markdown.", error);
    }
  }
  if (post.body_md) return renderMarkdown(post.body_md);
  if (post.body) return renderMarkdown(post.body);
  return "<p></p>";
}

function renderPostBody(post) {
  if (post.body_html) return post.body_html;
  return renderPostContent(post);
}

function extractFirstImageUrl(post) {
  if (post.body_json) {
    try {
      const parsed = JSON.parse(post.body_json);
      const blocks = Array.isArray(parsed?.blocks) ? parsed.blocks : [];
      for (const block of blocks) {
        if (block?.type === "image") {
          const url = block?.data?.file?.url || block?.data?.url;
          const sanitized = sanitizeUrl(url, { allowDataImage: true });
          if (sanitized) return sanitized;
        }
      }
    } catch {
      // ignore parsing errors
    }
  }
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

function normalizeSlugPath(slug) {
  return `${slug}`.replace(/^\/+/, "").replace(/\/+$/, "");
}

function getPostUrl(post) {
  const slug = normalizeSlugPath(post.slug || "");
  return `/${slug}/`;
}

function summarizeBodyFormat(post) {
  if (post.body_html) return "body_html";
  if (post.body_json) return "body_json";
  if (post.body_md) return "body_md";
  if (post.body) return "body";
  return "empty";
}

function renderSearchShell() {
  if (!searchEnabled) return "";
  return `<form class="search-shell" action="/search/" method="get">
    <span aria-hidden="true">🔍</span>
    <input type="search" name="q" placeholder="검색" data-search-input />
    <button type="submit">검색</button>
  </form>`;
}

function renderBrandTitle(title, logoUrl) {
  const logo = logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(title)}" />` : escapeHtml(title);
  return `<a class="brand-logo" href="/">${logo}</a>`;
}

function renderHeaderPortal({ title, navLinks, logoUrl }) {
  return `<header class="site-header portal">
    <div class="container header-inner">
      ${renderBrandTitle(title, logoUrl)}
      <nav class="nav-links">${navLinks}</nav>
      ${renderSearchShell()}
    </div>
  </header>`;
}

function renderHeaderSimple({ title, navLinks, logoUrl }) {
  return `<header class="site-header simple">
    <div class="container header-inner">
      ${renderBrandTitle(title, logoUrl)}
      <nav class="nav-links">${navLinks}</nav>
    </div>
    <div class="container header-search">${renderSearchShell()}</div>
  </header>`;
}

function renderHeaderMinimal({ title, navLinks, logoUrl }) {
  return `<header class="site-header minimal">
    <div class="container header-inner">
      ${renderBrandTitle(title, logoUrl)}
      <nav class="nav-links">${navLinks}</nav>
    </div>
    <div class="container header-search">${renderSearchShell()}</div>
  </header>`;
}

function renderNavLinks(items = []) {
  if (!items.length) {
    return `<a href="/posts/page/1/">Posts</a>`;
  }
  const sorted = [...items].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  const itemsByParent = new Map();
  sorted.forEach((item) => {
    const parentKey = item.parent_id || "";
    if (!itemsByParent.has(parentKey)) {
      itemsByParent.set(parentKey, []);
    }
    itemsByParent.get(parentKey).push(item);
  });
  const renderGroup = (parentId = "") => {
    const groupItems = itemsByParent.get(parentId) || [];
    return groupItems
      .map((item) => {
        const url = sanitizeUrl(item.url || "");
        if (!url) return "";
        const label = escapeHtml(item.label || item.url || "");
        const children = renderGroup(item.id);
        if (children) {
          return `<div class="nav-group"><a href="${escapeHtml(url)}">${label}</a><div class="nav-sub-links">${children}</div></div>`;
        }
        return `<a href="${escapeHtml(url)}">${label}</a>`;
      })
      .filter(Boolean)
      .join("\n      ");
  };
  return renderGroup("");
}

function renderLayout({ title, content, navLinks, logoUrl, footerText, layoutType, postNav }) {
  const type = layoutType || "portal";
  const header =
    type === "brand"
      ? renderHeaderSimple({ title, navLinks, logoUrl })
      : type === "tech"
        ? renderHeaderMinimal({ title, navLinks, logoUrl })
        : renderHeaderPortal({ title, navLinks, logoUrl });
  const footer = footerText ? `<footer class="site-footer">${footerText}</footer>` : "";
  const mainClass = `site-main ${type}`;
  return `<div class="layout layout-${type}">
    ${header}
    <main class="${mainClass}">
      <div class="container">
        ${content}
      </div>
    </main>
    ${postNav}
    ${footer}
  </div>`;
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
  layoutType = "portal",
} = {}) {
  const headerNav = Array.isArray(siteConfig?.navigations)
    ? siteConfig.navigations
        .filter((item) => item.location === "header")
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    : [];
  const navLinks = renderNavLinks(headerNav);
  const logoUrl = siteConfig?.config?.logo_url ? sanitizeUrl(siteConfig.config.logo_url) : null;
  const footerText = siteConfig?.config?.footer_text ? escapeHtml(siteConfig.config.footer_text) : "";
  const resolvedOgImage = ogImage || logoUrl || null;
  const ogUrl = siteBaseUrl ? buildUrl(siteBaseUrl, pagePath) : null;
  const baseStyles = `<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; line-height: 1.6; }
  img { max-width: 100%; display: block; }
  .layout { min-height: 100vh; display: flex; flex-direction: column; background: transparent; }
  .container { width: min(1140px, 100% - 48px); margin: 0 auto; }
  .layout-portal .container { width: min(1200px, 100% - 48px); }
  .layout-tech .container { width: min(900px, 100% - 48px); }
  .site-header { border-bottom: 1px solid var(--border, #e5e7eb); height: var(--header-height, 72px); }
  .site-header .header-inner { height: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .site-header.simple, .site-header.minimal { height: auto; padding: 16px 0; }
  .header-search { padding-bottom: 16px; }
  .brand-logo { font-family: var(--font-title, serif); font-size: 24px; font-weight: 700; text-decoration: none; color: inherit; display: inline-flex; align-items: center; gap: 12px; }
  .brand-logo img { max-height: 40px; }
  .nav-links { display: flex; gap: 16px; flex-wrap: wrap; }
  .nav-links a { text-decoration: none; color: inherit; font-weight: 500; }
  .nav-group { display: flex; flex-direction: column; gap: 6px; }
  .nav-sub-links { display: grid; gap: 4px; padding-left: 12px; font-size: 14px; color: #6b7280; }
  .site-main { flex: 1; padding: 32px 0 48px; }
  .site-footer { padding: 32px 0; border-top: 1px solid var(--border, #e5e7eb); text-align: center; }
  .search-shell { display: flex; align-items: center; gap: 8px; position: relative; }
  .search-shell input { padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border, #e2e8f0); background: var(--bg, #fff); color: var(--fg, #111827); }
  .search-shell button { padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border, #e2e8f0); background: var(--bg, #fff); color: inherit; cursor: pointer; }
  .search-shell button:hover { background: rgba(148, 163, 184, 0.12); }
  .search-page { display: grid; gap: 16px; }
  .search-results-page { display: grid; gap: 12px; }
  .search-result-item { padding: 12px 0; border-bottom: 1px solid var(--border, #e5e7eb); }
  .search-result-item:last-child { border-bottom: 0; }
  .search-pagination { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .search-pagination a { text-decoration: none; }
  .callout { padding: 16px; border-radius: 12px; border-left: 4px solid; background: rgba(148, 163, 184, 0.15); margin: 16px 0; }
  .callout-info { border-color: #38bdf8; }
  .callout-warn { border-color: #f59e0b; }
  .callout-error { border-color: #ef4444; }
  .callout-warning { border-color: #f59e0b; }
  .callout-title { font-weight: 700; margin-bottom: 6px; }
  .post-body table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  .post-body th, .post-body td { border: 1px solid var(--border, #e5e7eb); padding: 8px 10px; text-align: left; }
  .post-body figure { margin: 16px 0; }
  .post-body figcaption { font-size: 0.85em; color: var(--muted, #6b7280); margin-top: 8px; }
  .post-body .embed { position: relative; padding-top: 56.25%; margin: 16px 0; }
  .post-body .embed iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
  .grid { display: grid; gap: 16px; grid-template-columns: repeat(var(--columns, 2), minmax(0, 1fr)); }
  .card { border-radius: var(--radius, 14px); box-shadow: var(--card-shadow, 0 10px 24px rgba(15, 23, 42, 0.08)); padding: 16px; background: var(--bg, #fff); border: 1px solid var(--border, #e5e7eb); }
  .card-icon { font-size: 24px; }
  .details { margin: 12px 0; }
  .details summary { cursor: pointer; font-weight: 600; }
  .btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 16px; border-radius: 999px; text-decoration: none; font-weight: 600; }
  .btn-primary { background: var(--accent, #111827); color: #fff; }
  .btn-secondary { background: rgba(148, 163, 184, 0.2); color: inherit; }
  .newsletter { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 16px 0; }
  .newsletter input { padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border, #e2e8f0); flex: 1; min-width: 200px; background: var(--bg, #fff); color: var(--fg, #111827); }
  .features-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin: 24px 0; }
  .feature-card { padding: 16px; border-radius: var(--radius, 12px); background: rgba(148, 163, 184, 0.12); }
  .feature-card .icon { font-size: 24px; }
  .post-section { margin: 32px 0; }
  .post-section ul { list-style: none; padding: 0; }
  .post-section li { margin-bottom: 8px; }
  .post-grid { display: grid; gap: 24px; }
  .post-grid.portal { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .post-grid.brand { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .post-grid.tech { grid-template-columns: 1fr; }
  .post-card { border-radius: var(--radius, 12px); border: 1px solid var(--border, #e5e7eb); box-shadow: var(--card-shadow, none); overflow: hidden; background: var(--bg, #fff); }
  .post-card .thumb img { width: 100%; height: 200px; object-fit: cover; }
  .post-card .post-body { padding: 16px; }
  .post-card .post-meta { font-size: 12px; color: var(--muted, #6b7280); margin-top: 8px; }
  .post-list-item { padding: 16px 0; border-bottom: 1px solid var(--border, #e5e7eb); }
  .post-list-item:last-child { border-bottom: 0; }
  .hero { border-radius: var(--radius, 16px); padding: 64px 32px; background: rgba(148, 163, 184, 0.15); margin: 24px 0; }
  .hero.portal { background: linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.7)); color: #fff; }
  .hero.brand { min-height: 360px; display: flex; align-items: flex-end; background-size: cover; background-position: center; color: #fff; position: relative; overflow: hidden; }
  .hero.brand::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.7)); }
  .hero.brand .hero-content { position: relative; z-index: 1; }
  .hero.tech { background: transparent; border: 1px solid var(--border, #e5e7eb); }
  .hero .hero-content { max-width: 720px; }
  .hero-banner { padding: 64px 24px; text-align: center; color: #fff; background-size: cover; background-position: center; border-radius: var(--radius, 16px); margin-bottom: 32px; }
  .hero-banner.sm { min-height: 200px; }
  .hero-banner.md { min-height: 320px; }
  .hero-banner.lg { min-height: 440px; }
  .hero-banner .hero-content { max-width: 720px; margin: 0 auto; backdrop-filter: blur(2px); }
  .hero-banner .hero-button { display: inline-block; margin-top: 16px; padding: 10px 18px; border-radius: 999px; background: #fff; color: #111827; text-decoration: none; font-weight: 600; }
  .post-nav { display: flex; justify-content: space-between; gap: 12px; padding: 16px 0; border-top: 1px solid var(--border, #e2e8f0); }
  .post-nav a { text-decoration: none; }
  @media (max-width: 960px) {
    .post-grid.portal { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 720px) {
    .post-grid.portal, .post-grid.brand { grid-template-columns: 1fr; }
    .site-header { height: auto; padding: 16px 0; }
    .site-header .header-inner { flex-direction: column; align-items: flex-start; }
    .search-shell { width: 100%; }
  }
  </style>`;
  const navigationLinks = [];
  if (prevPost) {
    navigationLinks.push(
      `<a href="${getPostUrl(prevPost)}" class="nav-prev">← 이전 글: ${escapeHtml(prevPost.title || prevPost.slug)}</a>`
    );
  }
  if (nextPost) {
    navigationLinks.push(
      `<a href="${getPostUrl(nextPost)}" class="nav-next">다음 글: ${escapeHtml(nextPost.title || nextPost.slug)} →</a>`
    );
  }
  const postNav = navigationLinks.length
    ? `<section class="post-nav">
      ${navigationLinks.join("")}
    </section>`
    : "";
  const layoutMarkup = renderLayout({
    title,
    content,
    navLinks,
    logoUrl,
    footerText,
    layoutType,
    postNav,
  });
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
  ${layoutMarkup}
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
  const rootTokens = toCss(tokens || {});
  return `<style id="theme-tokens">
:root {
${rootTokens}
}
body {
  background: var(--bg, #ffffff);
  color: var(--fg, #111827);
  font-family: var(--font-body, "ui-sans-serif", "system-ui");
}
a { color: var(--accent, #2563eb); }
hr, .border, .card, .post-card { border-color: var(--border, #e5e7eb); }
.card, .post-card { border-radius: var(--radius, 12px); }
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
      return `<li><a href="${getPostUrl(post)}">${escapeHtml(post.title || post.slug)}</a>${
        showDate ? ` <time datetime="${escapeHtml(formatDate(dateValue))}">${escapeHtml(dateLabel)}</time>` : ""
      }</li>`;
    })
    .join("\n");
}

function renderPostCard(post, layoutType) {
  const imageUrl = extractFirstImageUrl(post);
  const imageMarkup = imageUrl
    ? `<div class="thumb"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(post.title || post.slug)}" /></div>`
    : "";
  const excerpt = post.excerpt ? escapeHtml(post.excerpt) : "";
  const metaDate = formatDateLabel(post.published_at || post.publish_at || post.created_at);
  const meta = metaDate ? `<div class="post-meta">${escapeHtml(metaDate)}</div>` : "";
  const title = escapeHtml(post.title || post.slug);
  const link = getPostUrl(post);
  const variant = layoutType === "brand" ? "brand" : layoutType === "portal" ? "portal" : "tech";
  return `<article class="post-card ${variant}">
    ${imageMarkup}
    <div class="post-body">
      <h3><a href="${link}">${title}</a></h3>
      ${excerpt ? `<p>${excerpt}</p>` : ""}
      ${meta}
    </div>
  </article>`;
}

function renderPostList(posts, layoutType) {
  if (!posts.length) {
    return `<div class="empty">게시물이 없습니다.</div>`;
  }
  if (layoutType === "tech") {
    return posts
      .map((post) => {
        const dateValue = post.published_at || post.publish_at || post.created_at;
        const dateLabel = formatDateLabel(dateValue);
        return `<div class="post-list-item">
  <a href="${getPostUrl(post)}">${escapeHtml(post.title || post.slug)}</a>
  ${dateLabel ? `<div class="post-meta">${escapeHtml(dateLabel)}</div>` : ""}
  ${post.excerpt ? `<p>${escapeHtml(post.excerpt)}</p>` : ""}
</div>`;
      })
      .join("\n");
  }
  const gridClass = layoutType === "brand" ? "brand" : "portal";
  return `<div class="post-grid ${gridClass}">
    ${posts.map((post) => renderPostCard(post, layoutType)).join("\n")}
  </div>`;
}

function renderHero(section, layoutType) {
  const posts = Array.isArray(section.posts) ? section.posts : [];
  const post = posts[0];
  const title = section.title || post?.title || "Hero";
  const subtitle = post?.excerpt || section.subtitle || "";
  const link = post ? getPostUrl(post) : null;
  const imageUrl = extractFirstImageUrl(post) || sanitizeUrl(section.image_url || "");
  if (layoutType === "brand") {
    return `<section class="hero brand"${imageUrl ? ` style="background-image:url('${escapeHtml(imageUrl)}')"` : ""}>
  <div class="hero-content">
    <h2>${escapeHtml(title)}</h2>
    ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
    ${link ? `<a class="btn btn-primary" href="${link}">읽어보기</a>` : ""}
  </div>
</section>`;
  }
  if (layoutType === "tech") {
    return `<section class="hero tech">
  <div class="hero-content">
    <h2>${escapeHtml(title)}</h2>
    ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
    ${link ? `<a class="btn btn-secondary" href="${link}">읽어보기</a>` : ""}
  </div>
</section>`;
  }
  return `<section class="hero portal"${
    imageUrl
      ? ` style="background-image:url('${escapeHtml(imageUrl)}'); background-size: cover; background-position: center;"`
      : ""
  }>
  <div class="hero-content">
    <h2>${escapeHtml(title)}</h2>
    ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
    ${link ? `<a class="btn btn-secondary" href="${link}">읽어보기</a>` : ""}
  </div>
</section>`;
}

function renderGridSection(section, layoutType) {
  const posts = Array.isArray(section.posts) ? section.posts : [];
  return `<section class="post-section">
  <h2>${escapeHtml(section.title || "")}</h2>
  ${renderPostList(posts, layoutType)}
</section>`;
}

function renderCardSection(section, layoutType) {
  const posts = Array.isArray(section.posts) ? section.posts : [];
  return `<section class="post-section">
  <h2>${escapeHtml(section.title || "")}</h2>
  ${renderPostList(posts, layoutType)}
</section>`;
}

function renderListSection(section, layoutType) {
  const posts = Array.isArray(section.posts) ? section.posts : [];
  return `<section class="post-section">
  <h2>${escapeHtml(section.title || "")}</h2>
  ${renderPostList(posts, layoutType)}
</section>`;
}

function renderSection(section, layoutType) {
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

  const sectionTitle = section.title || (type === "latest" ? "Latest" : type === "popular" ? "Popular" : "Pick");
  if (type === "hero") {
    return renderHero({ ...section, title: sectionTitle }, layoutType);
  }

  if (["latest", "popular", "pick"].includes(type)) {
    const normalizedType = layoutType || "portal";
    if (normalizedType === "brand") {
      return renderCardSection({ ...section, title: sectionTitle }, normalizedType);
    }
    if (normalizedType === "tech") {
      return renderListSection({ ...section, title: sectionTitle }, normalizedType);
    }
    return renderGridSection({ ...section, title: sectionTitle }, normalizedType);
  }
  return "";
}

async function generatePostPages(posts, siteConfig, layoutType) {
  for (let index = 0; index < posts.length; index += 1) {
    const post = posts[index];
    const prevPost = posts[index - 1] || null;
    const nextPost = posts[index + 1] || null;
    const postSlug = normalizeSlugPath(post.slug || "");
    assertSlugAllowed(postSlug, "post");
    const html = layoutHtml({
      title: post.title || post.slug,
      description: post.excerpt || "",
      content: `<article>
  <h2>${escapeHtml(post.title || post.slug)}</h2>
  <p>${escapeHtml(post.excerpt || "")}</p>
  <div class="post-body">
    ${renderPostBody(post)}
  </div>
</article>`,
      siteConfig,
      pagePath: `/${postSlug}/`,
      ogImage: extractFirstImageUrl(post),
      prevPost,
      nextPost,
      layoutType,
      scripts: buildViewTrackingScript({
        apiBase: analyticsConfig.apiBase,
        tenantSlug: analyticsConfig.tenantSlug,
        pageKey: postSlug,
      }),
    });

    const filePath = path.join(DIST_DIR, postSlug, "index.html");
    await writeHtml(filePath, html);
  }
}

async function generateStaticPages(pages, siteConfig, layoutType) {
  for (const page of pages) {
    const pageSlug = normalizeSlugPath(page.slug || "");
    assertSlugAllowed(pageSlug, "page");
    const html = layoutHtml({
      title: page.title || page.slug,
      description: page.excerpt || "",
      content: `<article>
  <h2>${escapeHtml(page.title || page.slug)}</h2>
  <div class="post-body">
    ${renderPostBody(page)}
  </div>
</article>`,
      siteConfig,
      pagePath: `/${pageSlug}/`,
      ogImage: extractFirstImageUrl(page),
      layoutType,
      scripts: buildViewTrackingScript({
        apiBase: analyticsConfig.apiBase,
        tenantSlug: analyticsConfig.tenantSlug,
        pageKey: pageSlug,
      }),
    });

    const filePath = path.join(DIST_DIR, pageSlug, "index.html");
    await writeHtml(filePath, html);
  }
}

async function generatePostListPages(posts, siteConfig, layoutType) {
  const pages = paginate(posts, PAGE_SIZE);
  for (const page of pages) {
    const entries = page.items
      .map(
        (post) =>
          `<li><a href="${getPostUrl(post)}">${escapeHtml(
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
      layoutType,
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

async function generateHomepage(sections, siteConfig, layoutType) {
  const safeSections = Array.isArray(sections) ? sections : [];
  const content = safeSections.length
    ? safeSections.map((section) => renderSection(section, layoutType)).join("\n")
    : `<section class="post-section"><p>섹션이 없습니다.</p></section>`;

  const html = layoutHtml({
    title: "Home",
    description: "Latest posts from the blog.",
    content,
    siteConfig,
    pagePath: "/",
    layoutType,
  });

  await writeHtml(path.join(DIST_DIR, "index.html"), html);
  console.log("Generated dist/index.html");
}

async function generateCategoryPages(posts, categories, siteConfig, layoutType) {
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
        layoutType,
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

async function generate404Page(siteConfig, layoutType) {
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
    layoutType,
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

async function generateSearchPage(siteConfig, layoutType) {
  const searchScript = `(function(){var input=document.querySelector('[data-search-input]');var status=document.querySelector('[data-search-status]');var list=document.querySelector('[data-search-results]');var pagination=document.querySelector('[data-search-pagination]');if(!status||!list||!pagination){return;}var params=new URLSearchParams(window.location.search);var query=(params.get('q')||'').trim();var pageNumber=parseInt(params.get('page')||'1',10);if(!Number.isFinite(pageNumber)||pageNumber<1){pageNumber=1;}if(input){input.value=query;}function escapeHtml(value){return String(value||'').replace(/[&<>\"']/g,function(match){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;','\\'':'&#39;'}[match];});}function renderEmpty(message){status.textContent=message;list.innerHTML='';pagination.innerHTML='';}if(!query){renderEmpty('검색어를 입력해 주세요.');return;}fetch('/search.json').then(function(resp){return resp.ok?resp.json():[];}).then(function(data){var items=Array.isArray(data)?data:[];var lowered=query.toLowerCase();var filtered=items.filter(function(item){var title=(item.title||'').toLowerCase();var slug=(item.slug||'').toLowerCase();var excerpt=(item.excerpt||'').toLowerCase();return title.includes(lowered)||slug.includes(lowered)||excerpt.includes(lowered);});var pageSize=10;var total=filtered.length;var totalPages=Math.max(1,Math.ceil(total/pageSize));if(pageNumber>totalPages){pageNumber=totalPages;}var start=(pageNumber-1)*pageSize;var pageItems=filtered.slice(start,start+pageSize);status.textContent='총 '+total+'개 결과';if(!pageItems.length){list.innerHTML='<p class=\"muted\">검색 결과가 없습니다.</p>';pagination.innerHTML='';return;}list.innerHTML=pageItems.map(function(item){var title=escapeHtml(item.title||item.slug||'');var excerpt=escapeHtml(item.excerpt||'');var slug=escapeHtml(item.slug||'');return '<article class=\"search-result-item\"><h3><a href=\"/'+slug+'/\">'+title+'</a></h3>'+(excerpt?'<p class=\"muted\">'+excerpt+'</p>':'')+'</article>';}).join('');var prevLink=pageNumber>1?'<a href=\"/search/?q='+encodeURIComponent(query)+'&page='+(pageNumber-1)+'\">이전</a>':'';var nextLink=pageNumber<totalPages?'<a href=\"/search/?q='+encodeURIComponent(query)+'&page='+(pageNumber+1)+'\">다음</a>':'';pagination.innerHTML='<span>페이지 '+pageNumber+' / '+totalPages+'</span>'+(prevLink?' '+prevLink:'')+(nextLink?' '+nextLink:'');}).catch(function(){renderEmpty('검색 데이터를 불러오지 못했습니다.');});})();`;
  const html = layoutHtml({
    title: "검색",
    description: "검색 결과",
    content: `<section class="search-page">
  <h2>검색 결과</h2>
  <p class="muted" data-search-status></p>
  <div class="search-results-page" data-search-results></div>
  <div class="search-pagination" data-search-pagination></div>
</section>`,
    siteConfig,
    pagePath: "/search/",
    layoutType,
    scripts: `<script>${searchScript}</script>`,
  });
  await writeHtml(path.join(DIST_DIR, "search", "index.html"), html);
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
  searchEnabled = siteConfig?.config?.search_enabled !== false && siteConfig?.config?.search_enabled !== 0;

  const layoutType = theme?.layout_type || "portal";
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
  await generateHomepage(homeSections, siteConfig, layoutType);
  await generatePostPages(postEntries, siteConfig, layoutType);
  await generatePostListPages(postEntries, siteConfig, layoutType);
  await generateCategoryPages(postEntries, categories, siteConfig, layoutType);
  await generateStaticPages(pageEntries, siteConfig, layoutType);
  await generateSitemap(postEntries, categories, pageEntries);
  await generateSearchIndex(postEntries);
  await generateSearchPage(siteConfig, layoutType);
  await generateRobots();
  await generate404Page(siteConfig, layoutType);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
