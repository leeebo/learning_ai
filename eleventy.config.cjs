function impliedDefaultLocaleUrl(url, language = "zh-CN") {
  const input = String(url || "/");
  const match = input.match(/^([^?#]*)([?#].*)?$/);
  let pathname = match[1] || "/";
  const suffix = match[2] || "";

  pathname = pathname.replace(/^\/(?:en|zh-CN)(?=\/|$)/, "") || "/";
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;

  if (language === "en") {
    return `${pathname === "/" ? "/en/" : `/en${pathname}`}${suffix}`;
  }
  return `${pathname}${suffix}`;
}

async function configureEleventy(eleventyConfig) {
  const { I18nPlugin } = await import("@11ty/eleventy");

  eleventyConfig.addPlugin(I18nPlugin, {
    defaultLanguage: "zh-CN",
    errorMode: "strict",
    filters: {
      url: "eleventy_locale_url",
      links: "locale_links",
    },
  });

  eleventyConfig.setNunjucksEnvironmentOptions({ autoescape: true });
  eleventyConfig.addFilter("locale_url", function localeUrl(url, language) {
    const currentLanguage = language || this.ctx?.lang || (this.page?.url?.startsWith("/en/") ? "en" : "zh-CN");
    return impliedDefaultLocaleUrl(url, currentLanguage);
  });
  eleventyConfig.addFilter("pad2", value => String(value).padStart(2, "0"));
  eleventyConfig.addFilter("encodePayload", value => encodeURIComponent(JSON.stringify(value)));
  eleventyConfig.addTransform("cleanHtmlWhitespace", function cleanHtmlWhitespace(content) {
    if (!this.page?.outputPath?.endsWith(".html")) return content;
    return `${content.replace(/[ \t]+$/gm, "").trim()}\n`;
  });
  eleventyConfig.addPassthroughCopy({
    "src/assets/app.js": "app.js",
    "src/assets/favicon.svg": "favicon.svg",
    "src/assets/styles.css": "styles.css",
    "src/.nojekyll": ".nojekyll",
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    pathPrefix: "/learning_ai/",
  };
}

module.exports = configureEleventy;
module.exports.impliedDefaultLocaleUrl = impliedDefaultLocaleUrl;
