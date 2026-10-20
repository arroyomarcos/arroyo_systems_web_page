// Run after `yarn build`: node scripts/generate-route-html.js build
//
// GitHub Pages has no server-side routing, so every clean URL needs its own physical
// index.html for crawlers and for direct navigation, each with its own <title>, meta
// description, robots, canonical and hreflang tags. Skipping this step makes those routes
// fall back to the homepage shell (a real 404 status with the wrong meta) - it already
// happened once, which is why this script lives in the repo and `yarn build:pages` chains it.
//
// SEO copy is read from src/i18n/content.js so the page text and the baked tags can't drift.
//
// Every replacement is anchored to its own attribute context (rel="canonical" href="...",
// hreflang="en" href="...", property="og:url" content="...") rather than a bare
// href="OLD_URL" match: the homepage's hreflang="en" URL equals its canonical URL, so a
// bare match can re-match and clobber a value another replacement already set.
const fs = require("fs");
const path = require("path");

const BUILD_DIR = process.argv[2] || "build";
const SITE_URL = "https://arroyo-systems.com";

const loadContent = () => {
  const file = path.join(__dirname, "..", "src", "i18n", "content.js");
  const source = fs.readFileSync(file, "utf8").replace(/^export /gm, "");
  return new Function(`${source}\nreturn content;`)();
};
const content = loadContent();

const PAGES = [
  { key: "home", basePath: "/" },
  { key: "privacyPolicy", basePath: "/privacy-policy" },
  { key: "legalNotice", basePath: "/legal-notice" },
  { key: "cookiesPolicy", basePath: "/cookies-policy" },
];

const ADMIN_PAGES = [
  { outPath: "admin", title: "Admin Login | Arroyo Systems", description: "Arroyo Systems admin login." },
  {
    outPath: "admin/messages",
    title: "Admin Dashboard | Arroyo Systems",
    description: "Arroyo Systems admin dashboard.",
  },
];

const template = fs.readFileSync(path.join(BUILD_DIR, "index.html"), "utf8");

const escapeAttr = (value) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

function replaceTag(html, anchor, attr, newValue) {
  const re = new RegExp(`(${anchor}[^>]*?\\s${attr}=")[^"]*(")`);
  if (!re.test(html)) throw new Error(`Anchor not found while replacing ${attr} near ${anchor}`);
  return html.replace(re, (_, pre, post) => `${pre}${escapeAttr(newValue)}${post}`);
}

function bakePage(html, { title, description, robots, canonical, alternates, lang }) {
  let out = html;
  out = out.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);
  out = out.replace(/<title>[^<]*<\/title>/, () => `<title>${title}</title>`);
  out = replaceTag(out, 'name="description"', "content", description);
  out = replaceTag(out, 'name="robots"', "content", robots);
  out = replaceTag(out, 'rel="canonical"', "href", canonical);
  out = replaceTag(out, 'property="og:title"', "content", title);
  out = replaceTag(out, 'property="og:description"', "content", description);
  out = replaceTag(out, 'property="og:url"', "content", canonical);
  out = replaceTag(out, 'name="twitter:title"', "content", title);
  out = replaceTag(out, 'name="twitter:description"', "content", description);

  if (alternates) {
    out = replaceTag(out, 'hreflang="en"', "href", alternates.en);
    out = replaceTag(out, 'hreflang="es"', "href", alternates.es);
    out = replaceTag(out, 'hreflang="x-default"', "href", alternates.en);
  } else {
    out = out.replace(/<link rel="alternate" hreflang="[^"]*"[^>]*>/g, "");
  }
  return out;
}

const write = (file, contents) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
};

const generated = [];

for (const { key, basePath } of PAGES) {
  const esPath = basePath === "/" ? "/es" : `/es${basePath}`;
  const robots = key === "home" ? "index,follow" : "noindex,follow";
  // GitHub Pages serves every route as a directory, so the slash-less URL only 301s to the
  // slash one: canonical and hreflang must point at the final (trailing-slash) URL.
  const slash = (p) => (p.endsWith("/") ? p : `${p}/`);
  const alternates = { en: `${SITE_URL}${slash(basePath)}`, es: `${SITE_URL}${slash(esPath)}` };

  for (const lang of ["en", "es"]) {
    const seo = content[lang].seo[key];
    const html = bakePage(template, {
      title: seo.title,
      description: seo.description,
      robots,
      canonical: lang === "en" ? alternates.en : alternates.es,
      alternates,
      lang,
    });
    const dir = lang === "en" ? [] : ["es"];
    const route = basePath === "/" ? [] : [basePath.slice(1)];
    write(path.join(BUILD_DIR, ...dir, ...route, "index.html"), html);
    generated.push([...dir, ...route, "index.html"].join("/"));
  }
}

for (const admin of ADMIN_PAGES) {
  const html = bakePage(template, {
    title: admin.title,
    description: admin.description,
    robots: "noindex,nofollow",
    canonical: `${SITE_URL}/${admin.outPath}`,
    alternates: null,
    lang: "en",
  });
  write(path.join(BUILD_DIR, admin.outPath, "index.html"), html);
  generated.push(`${admin.outPath}/index.html`);
}

// 404.html is GitHub Pages' fallback for URLs without their own file (client-side routes such
// as /quote/:token or /checkout/*). It must be the homepage shell so React Router takes over.
// Copied from the pristine template, before index.html itself gets rewritten above.
write(path.join(BUILD_DIR, "404.html"), template);
generated.push("404.html");

console.log(`Generated ${generated.length} files:\n - ${generated.join("\n - ")}`);
