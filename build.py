#!/usr/bin/env python3
"""Build the Fidelity Funding static site: src/ -> docs/ (GitHub Pages root).

Each page in src/pages/ is an HTML fragment whose first line is a JSON comment:
    <!--{"title": "...", "desc": "...", "nav": "home", "light": false}-->
The fragment is wrapped with the shared head, nav, footer and assistant partials.
`{{i:name}}` expands to an inline <svg> icon reference from partials/icons.svg.
"""
import json, re, shutil, hashlib, datetime
from pathlib import Path

ROOT = Path(__file__).parent
SRC, OUT = ROOT / "src", ROOT / "docs"
SITE = "https://fidelity.fastapi.online"
DOMAIN = "fidelity.fastapi.online"

def read(p): return (SRC / p).read_text(encoding="utf-8")

def icons(html):
    return re.sub(r"\{\{i:([a-z0-9-]+)\}\}",
                  lambda m: f'<svg class="icon" aria-hidden="true"><use href="#i-{m.group(1)}"/></svg>', html)

def minify_css(s):
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"\s*([{};:,>])\s*", r"\1", s)
    return s.replace(";}", "}").strip()

def minify_js(s):
    # conservative: drop full-line comments and leading indentation only
    out = []
    for line in s.splitlines():
        t = line.strip()
        if not t or t.startswith("//"): continue
        out.append(t)
    return "\n".join(out)

def main():
    if OUT.exists(): shutil.rmtree(OUT)
    (OUT / "assets").mkdir(parents=True)
    shutil.copytree(SRC / "assets" / "img", OUT / "assets" / "img")
    shutil.copytree(SRC / "assets" / "fonts", OUT / "assets" / "fonts")

    css = minify_css(read("assets/css/site.css"))
    js = minify_js(read("assets/js/site.js"))
    ai = minify_js(read("assets/js/assistant.js"))
    ver = hashlib.sha1((css + js + ai).encode()).hexdigest()[:8]
    (OUT / "assets/site.css").write_text(css)
    (OUT / "assets/site.js").write_text(js)
    (OUT / "assets/assistant.js").write_text(ai)
    for extra in ("apply.js",):
        if (SRC / "assets/js" / extra).exists():
            (OUT / "assets" / extra).write_text(minify_js(read("assets/js/" + extra)))

    head, nav, foot, assistant, sprite = (read(f"partials/{n}") for n in
        ("head.html", "nav.html", "footer.html", "assistant.html", "icons.svg"))

    urls = []
    for page in sorted((SRC / "pages").rglob("*.html")):
        raw = page.read_text(encoding="utf-8")
        m = re.match(r"<!--(\{.*?\})-->\s*", raw, re.S)
        meta = json.loads(m.group(1)); body = raw[m.end():]
        rel = page.relative_to(SRC / "pages").as_posix()
        if rel == "index.html": route = "/"
        elif rel == "404.html": route = None
        else: route = "/" + rel.removesuffix(".html").removesuffix("/index") + "/"
        dest = OUT / ("404.html" if route is None else (route.strip("/") + "/index.html" if route != "/" else "index.html"))
        dest.parent.mkdir(parents=True, exist_ok=True)

        navh = nav
        for key in ("home", "apply", "insights", "careers", "contact"):
            navh = navh.replace(f'data-nav="{key}"', f'data-nav="{key}"' + (' aria-current="page"' if meta.get("nav") == key else ""))
        if meta.get("light"): navh = navh.replace('class="nav"', 'class="nav nav--light"')

        h = (head.replace("{{title}}", meta["title"])
                 .replace("{{desc}}", meta.get("desc", ""))
                 .replace("{{canonical}}", SITE + (route or "/"))
                 .replace("{{og_image}}", SITE + meta.get("image", "/assets/img/og.jpg"))
                 .replace("{{ver}}", ver)
                 .replace("{{extra_head}}", meta.get("head", "")))
        scripts = f'<script src="/assets/site.js?v={ver}" defer></script><script src="/assets/assistant.js?v={ver}" defer></script>'
        for s in meta.get("scripts", []):
            scripts += f'<script src="/assets/{s}?v={ver}" defer></script>'
        html = (h + "<body class=\"no-js\">" + sprite + '<a class="skip" href="#main">Skip to content</a>'
                + navh + f'<main id="main">{body}</main>' + foot + assistant + scripts + "</body></html>")
        html = icons(html).replace("{{year}}", str(datetime.date.today().year))
        dest.write_text(html, encoding="utf-8")
        if route: urls.append(route)

    today = datetime.date.today().isoformat()
    (OUT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(f"<url><loc>{SITE}{u}</loc><lastmod>{today}</lastmod></url>\n" for u in urls) + "</urlset>\n")
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n")
    (OUT / "CNAME").write_text(DOMAIN + "\n")
    (OUT / ".nojekyll").write_text("")
    (OUT / "manifest.webmanifest").write_text(json.dumps({
        "name": "Fidelity Funding", "short_name": "Fidelity", "start_url": "/", "display": "standalone",
        "background_color": "#050A2A", "theme_color": "#0329D1",
        "icons": [{"src": "/assets/img/icon-192.png", "sizes": "192x192", "type": "image/png"},
                  {"src": "/assets/img/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}]}, indent=1))
    print(f"built {len(urls)} pages + 404 -> {OUT} (v{ver})")

if __name__ == "__main__":
    main()
