import eleventyNavigationPlugin from "@11ty/eleventy-navigation";
import markdownItAnchor from "markdown-it-anchor";
import Image from "@11ty/eleventy-img";
import { openSync, readSync, closeSync } from "node:fs";

// Width and height of a PNG, read from its header (bytes 16-24). Null for anything else.
function pngSize(file) {
  try {
    const fd = openSync(file, "r");
    const buf = Buffer.alloc(24);
    readSync(fd, buf, 0, 24, 0);
    closeSync(fd);
    if (buf.toString("ascii", 1, 4) !== "PNG") return null;
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  } catch {
    return null;
  }
}

const now = new Date();

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets/images/");
  eleventyConfig.addPassthroughCopy("src/assets/fonts/");
  eleventyConfig.ignores.add("src/demo*_report.html"); // served via passthrough, not as a template
  eleventyConfig.addPassthroughCopy({ "src/demo002_remote_aligned_deviation_report.html": "demo-report/index.html" });
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/manifest.webmanifest");
  eleventyConfig.addPassthroughCopy("src/_headers");
  eleventyConfig.addPassthroughCopy("src/_redirects");

  eleventyConfig.addWatchTarget("src");
  eleventyConfig.setServerOptions({ liveReload: true });

  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  eleventyConfig.amendLibrary("md", (mdLib) => {
    mdLib.use(markdownItAnchor);
    // Give local markdown images width/height and lazy loading so the page doesn't jump as they load.
    const defaultImage = mdLib.renderer.rules.image || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
    mdLib.renderer.rules.image = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const src = token.attrGet("src") || "";
      if (src.startsWith("/assets/images/")) {
        const size = pngSize(`src${src}`);
        if (size) {
          token.attrSet("width", String(size.width));
          token.attrSet("height", String(size.height));
        }
        token.attrSet("loading", "lazy");
        token.attrSet("decoding", "async");
      }
      return defaultImage(tokens, idx, options, env, self);
    };
  });

  eleventyConfig.addGlobalData("buildTime", now);

  // Screenshot thumbnail that opens the full-size image in the modal (see default.njk).
  // Sources live in ./screenshots; output is resized WebP in _site/assets/images/screenshots.
  eleventyConfig.addAsyncShortcode("shot", async function (file, alt, caption = "", cls = "", eager = false) {
    const meta = await Image(`screenshots/${file}`, {
      widths: [640, 1800],
      formats: ["webp"],
      outputDir: "_site/assets/images/screenshots/",
      urlPath: "/assets/images/screenshots/",
    });
    const [thumb, full = thumb] = meta.webp;
    const figcaption = caption ? `<figcaption class="mt-2 font-mono text-xs opacity-70">${caption}</figcaption>` : "";
    return `<figure class="not-prose m-0 ${cls}"><a href="${full.url}" data-modal data-caption="${caption || alt}" class="block overflow-hidden rounded-box border border-base-content/15 bg-base-100 transition-colors hover:border-primary motion-reduce:transition-none"><img src="${thumb.url}" width="${thumb.width}" height="${thumb.height}" alt="${alt}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} class="h-auto w-full object-contain"></a>${figcaption}</figure>`;
  });

  eleventyConfig.addShortcode("version", () => String(now.getTime()));
  eleventyConfig.addShortcode("year", () => now.getFullYear());

  eleventyConfig.addFilter("dateFilter", (date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split("T")[0];
  });

  return {
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    dir: {
      input: "src",
      includes: "_includes",
      layouts: "_layouts",
      output: "_site",
    },
  };
}
