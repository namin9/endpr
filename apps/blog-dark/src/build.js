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
const baseThemeStyle = `<style>
:root {
  color-scheme: dark;
  --bg: #1a1a1a;
  --fg: #e0e0e0;
  --muted: #9c9c9c;
  --accent: #00ff9d;
  --card: #202020;
  --border: #2d2d2d;
  --mono: "Fira Code", "JetBrains Mono", "SFMono-Regular", monospace;
  --sans: "Inter", "Segoe UI", sans-serif;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--sans);
  line-height: 1.65;
}
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
.page {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 24px 80px;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}
header h1 {
  margin: 0;
  font-size: 2rem;
  letter-spacing: -0.02em;
}
.post-list {
  list-style: none;
  padding: 0;
  margin: 24px 0 0;
  display: grid;
  gap: 20px;
}
.post-card {
  background: var(--card);
  padding: 20px 24px;
  border: 1px solid var(--border);
  border-radius: 12px;
}
.post-card h2 { margin: 0 0 8px; font-size: 1.4rem; }
.post-card p { margin: 0; color: var(--muted); }
article h2 { margin-top: 0; font-size: 2.2rem; }
article time { color: var(--muted); font-size: 0.9rem; }
pre {
  background: #0f0f0f;
  color: var(--accent);
  border: 1px solid rgba(0, 255, 157, 0.25);
  padding: 20px;
  border-radius: 12px;
  overflow-x: auto;
  box-shadow: 0 0 0 1px rgba(0, 255, 157, 0.05);
}
code { font-family: var(--mono); }
blockquote {
  border-left: 3px solid var(--accent);
  padding-left: 16px;
  color: var(--muted);
}
</style>`;
let themeStyle = baseThemeStyle;

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
  return { posts: postsIndex, categories: categoriesIndex, theme: themePayload };
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

function summarizeBodyFormat(post) {
  if (post.body_html) return "body_html";
  if (post.body_md) return "body_md";
  if (post.body) return "body";
  return "empty";
}

function layoutHtml({ title, content, description = "" }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  ${themeStyle}
</head>
<body>
  <div class="page">
    <header>
      <h1>${escapeHtml(title)}</h1>
      <nav>
        <a href="/posts/page/1/">Posts</a>
      </nav>
    </header>
    <main>
      ${content}
    </main>
  </div>
</body>
</html>`;
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
  <time datetime="${escapeHtml(
    formatDate(post.published_at || post.publish_at || post.created_at)
  )}">${escapeHtml(
    formatDateLabel(post.published_at || post.publish_at || post.created_at)
  )}</time>
  <p>${escapeHtml(post.excerpt || "")}</p>
  ${renderPostBody(post)}
</article>`,
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
          `<li class="post-card">
  <h2><a href="/${post.slug}/">${escapeHtml(post.title || post.slug)}</a></h2>
  <p>${escapeHtml(post.excerpt || "")}</p>
</li>`
      )
      .join("\n");

    const html = layoutHtml({
      title: `Posts — Page ${page.page}`,
      content: `<ol class="post-list" start="${(page.page - 1) * PAGE_SIZE + 1}">
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
  const hasPosts = posts.length > 0;
  const latestPosts = posts.slice(0, PAGE_SIZE);
  const latestList = latestPosts
    .map(
      (post) =>
        `<li class="post-card">
  <h2><a href="/${post.slug}/">${escapeHtml(post.title || post.slug)}</a></h2>
  <time datetime="${escapeHtml(
    formatDate(post.published_at || post.publish_at || post.created_at)
  )}">${escapeHtml(
    formatDateLabel(post.published_at || post.publish_at || post.created_at)
  )}</time>
  <p>${escapeHtml(post.excerpt || "")}</p>
</li>`
    )
    .join("\n");

  const content = `<section>
  <p><a href="/posts/page/1/">View all posts →</a></p>
  ${
    hasPosts
      ? `<h2>Latest posts</h2>
  <ul class="post-list">
${latestList}
  </ul>`
      : `<p>게시물이 없습니다.</p>`
  }
</section>`;

  const html = layoutHtml({
    title: "Home",
    description: "Latest posts from the blog.",
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
            `<li class="post-card">
  <h2><a href="/${post.slug}/">${escapeHtml(post.title || post.slug)}</a></h2>
  <p>${escapeHtml(post.excerpt || "")}</p>
</li>`
        )
        .join("\n");

      const html = layoutHtml({
        title: `${escapeHtml(category.name || category.slug)} — Page ${
          page.page
        }`,
        content: `<h2>${escapeHtml(category.name || category.slug)}</h2>
<ul class="post-list">
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
  const siteBase = process.env.SITE_BASE_URL;

  if (!useMock) {
    if (!buildToken) throw new Error("BUILD_TOKEN is required for live builds.");
    if (!apiBase) throw new Error("PUBLIC_API_BASE is required for live builds.");
  }
  if (!siteBase) throw new Error("SITE_BASE_URL is required for sitemap generation.");
  siteBaseUrl = resolveSiteBaseUrl();

  const { posts: rawPosts, categories, theme } = await loadBuildData({
    apiBase,
    buildToken,
    useMock,
  });

  if (theme?.tokens) {
    themeStyle = `${baseThemeStyle}\n${buildThemeStyle(theme.tokens)}`;
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
