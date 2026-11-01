import eleventyNavigationPlugin from "@11ty/eleventy-navigation";
import markdownItAnchor from "markdown-it-anchor";
import Image from "@11ty/eleventy-img";

const now = new Date();

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets/images/");
  eleventyConfig.ignores.add("src/demo*_report.html"); // served via passthrough, not as a template
  eleventyConfig.addPassthroughCopy({ "src/demo002_remote_aligned_deviation_report.html": "demo-report/index.html" });
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/manifest.webmanifest");
  eleventyConfig.addPassthroughCopy("src/_headers");

  eleventyConfig.addWatchTarget("src");
  eleventyConfig.setServerOptions({ liveReload: true });

  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  eleventyConfig.amendLibrary("md", (mdLib) => mdLib.use(markdownItAnchor));

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
    const [thumb, full] = meta.webp;
    const figcaption = caption ? `<figcaption class="text-sm opacity-70 mt-2 px-1">${caption}</figcaption>` : "";
    return `<figure class="not-prose m-0 ${cls}"><a href="${full.url}" data-modal data-caption="${caption || alt}" class="block rounded-lg overflow-hidden border border-base-300 shadow-lg hover:border-primary hover:shadow-primary/20 transition"><img src="${thumb.url}" width="${thumb.width}" height="${thumb.height}" alt="${alt}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} class="w-full h-auto"></a>${figcaption}</figure>`;
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
