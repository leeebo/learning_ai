const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { before, test } = require("node:test");

const ROOT = path.resolve(__dirname, "..");
const SITE_ROOT = path.join(ROOT, "_site");
const SITE_ORIGIN = "https://leeebo.github.io";
const PATH_PREFIX = "/learning_ai/";
const courseZh = require(path.join(ROOT, "src/_data/courseZh.cjs"));
const courseEn = require(path.join(ROOT, "src/_data/courseEn.cjs"));
const courseMeta = require(path.join(ROOT, "src/_data/courseMeta.cjs"));
const courseRewards = require(path.join(ROOT, "src/_data/courseRewards.cjs"));
const i18n = require(path.join(ROOT, "src/_data/i18n.cjs"));

const dayFiles = Array.from(
  { length: courseMeta.totalDays },
  (_, index) => `day${String(index + 1).padStart(2, "0")}.html`,
);
const pageFiles = [
  "index.html",
  ...dayFiles,
  "en/index.html",
  ...dayFiles.map(filename => `en/${filename}`),
];
const syncedFiles = [...pageFiles, "app.js", "favicon.svg", "styles.css"];
const dayKeys = [
  "analogy",
  "analogyDetail",
  "code",
  "concept",
  "diagram",
  "goal",
  "history",
  "keywords",
  "lab",
  "lesson",
  "n",
  "next",
  "nextPreview",
  "pitfall",
  "questions",
  "quiz",
  "readingMinutes",
  "recap",
  "references",
  "s",
  "t",
  "visual",
].sort();
const advancedDayKeys = [...dayKeys, "infra"].sort();
const cjkPattern = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/gu;
const englishWordPattern = /[A-Za-z]+(?:['\u2019-][A-Za-z]+)*/g;
const iconPattern = /[\p{Extended_Pictographic}\p{Emoji_Presentation}\u2190-\u2bff]/u;

before(() => {
  execFileSync("npm", ["run", "build:site", "--silent"], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: "pipe",
  });
});

function assertExactKeys(value, expected, label) {
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} has schema drift`);
}

function assertText(value, label, minimum = 1) {
  assert.equal(typeof value, "string", `${label} must be a string`);
  assert.ok(value.trim().length >= minimum, `${label} must contain at least ${minimum} characters`);
}

function assertHttpsUrl(value, label) {
  assertText(value, label);
  const parsed = new URL(value);
  assert.equal(parsed.protocol, "https:", `${label} must use HTTPS`);
  assert.ok(parsed.hostname, `${label} must include a hostname`);
}

function assertIcon(value, label) {
  assertText(value, label);
  assert.doesNotMatch(value, /\s/u, `${label} must not contain whitespace`);
  assert.match(value, iconPattern, `${label} must be a visible symbol or emoji`);
  assert.ok([...value].length <= 8, `${label} should remain compact in the process UI`);
}

function validateDay(day, locale, expectedNumber) {
  const label = `${locale} Day ${expectedNumber}`;
  assertExactKeys(day, expectedNumber >= 16 ? advancedDayKeys : dayKeys, label);
  assert.equal(day.n, expectedNumber, `${label} must use contiguous numbering`);

  for (const field of ["t", "s", "goal", "analogy", "diagram", "code", "lab", "pitfall", "recap", "nextPreview"]) {
    assertText(day[field], `${label}.${field}`);
  }
  assert.ok(Number.isInteger(day.readingMinutes), `${label}.readingMinutes must be an integer`);
  if (expectedNumber <= 15) {
    assert.ok(day.readingMinutes >= 16 && day.readingMinutes <= 20, `${label} must target a 16–20 minute reading session`);
  } else {
    assert.ok(day.readingMinutes >= 25 && day.readingMinutes <= 30, `${label} must target a 25–30 minute reading session`);
  }

  assert.ok(Array.isArray(day.concept) && day.concept.length >= 4 && day.concept.length <= 5, `${label}.concept must contain 4–5 items`);
  day.concept.forEach((item, index) => assertText(item, `${label}.concept[${index}]`));

  assert.equal(day.questions.length, 3, `${label}.questions must contain exactly three prompts`);
  day.questions.forEach((item, index) => assertText(item, `${label}.questions[${index}]`));

  assert.ok(day.lesson.length >= 5 && day.lesson.length <= 7, `${label}.lesson must contain 5–7 sections`);
  day.lesson.forEach((item, index) => {
    assertExactKeys(item, ["title", "body"], `${label}.lesson[${index}]`);
    assertText(item.title, `${label}.lesson[${index}].title`);
    assertText(item.body, `${label}.lesson[${index}].body`, locale === "en" ? 180 : 70);
  });

  assert.ok(day.references.length >= 2 && day.references.length <= 3, `${label}.references must contain 2–3 primary sources`);
  day.references.forEach((reference, index) => {
    assert.ok(Array.isArray(reference), `${label}.references[${index}] must be a tuple`);
    assert.equal(reference.length, 2, `${label}.references[${index}] must contain a label and URL`);
    assertText(reference[0], `${label}.references[${index}][0]`);
    assertHttpsUrl(reference[1], `${label}.references[${index}][1]`);
  });

  assert.equal(day.quiz.length, 3, `${label}.quiz must contain exactly three questions`);
  day.quiz.forEach((question, index) => {
    const questionLabel = `${label}.quiz[${index}]`;
    assertExactKeys(question, ["prompt", "options", "answer", "explanation"], questionLabel);
    assertText(question.prompt, `${questionLabel}.prompt`);
    assert.equal(question.options.length, 4, `${questionLabel}.options must contain exactly four choices`);
    question.options.forEach((option, optionIndex) => assertText(option, `${questionLabel}.options[${optionIndex}]`));
    assert.ok(Number.isInteger(question.answer), `${questionLabel}.answer must be an integer`);
    assert.ok(question.answer >= 0 && question.answer < question.options.length, `${questionLabel}.answer must index an existing option`);
    assertText(question.explanation, `${questionLabel}.explanation`, locale === "en" ? 45 : 20);
  });

  assert.equal(day.keywords.length, 4, `${label}.keywords must contain exactly four definitions`);
  day.keywords.forEach((keyword, index) => {
    const keywordLabel = `${label}.keywords[${index}]`;
    assertExactKeys(keyword, ["term", "definition", "espAnalogy"], keywordLabel);
    assertText(keyword.term, `${keywordLabel}.term`);
    assertText(keyword.definition, `${keywordLabel}.definition`);
    assertText(keyword.espAnalogy, `${keywordLabel}.espAnalogy`);
  });

  const hasTracks = Array.isArray(day.history.tracks);
  assertExactKeys(day.history, hasTracks ? ["intro", "tracks", "bridge"] : ["intro", "milestones", "bridge"], `${label}.history`);
  assertText(day.history.intro, `${label}.history.intro`, locale === "en" ? 180 : 70);
  assertText(day.history.bridge, `${label}.history.bridge`, locale === "en" ? 140 : 55);
  const historyGroups = hasTracks ? day.history.tracks : [{ title: null, milestones: day.history.milestones }];
  if (hasTracks) {
    assert.equal(day.history.tracks.length, 2, `${label}.history.tracks must contain exactly two historical tracks`);
    day.history.tracks.forEach((track, index) => {
      assertExactKeys(track, ["title", "milestones"], `${label}.history.tracks[${index}]`);
      assertText(track.title, `${label}.history.tracks[${index}].title`);
    });
  }
  historyGroups.forEach((group, groupIndex) => {
    assert.ok(group.milestones.length >= 5 && group.milestones.length <= 6, `${label} history group ${groupIndex} must contain 5–6 sourced events`);
    group.milestones.forEach((milestone, index) => {
    const milestoneLabel = `${label}.history.milestones[${index}]`;
    assertExactKeys(milestone, ["year", "title", "body", "source"], milestoneLabel);
    assertText(milestone.year, `${milestoneLabel}.year`);
    assertText(milestone.title, `${milestoneLabel}.title`);
    assertText(milestone.body, `${milestoneLabel}.body`);
    assertExactKeys(milestone.source, ["label", "url"], `${milestoneLabel}.source`);
    assertText(milestone.source.label, `${milestoneLabel}.source.label`);
    assertHttpsUrl(milestone.source.url, `${milestoneLabel}.source.url`);
    });
  });

  assertExactKeys(day.visual, ["title", "description", "steps", "loop"], `${label}.visual`);
  assertText(day.visual.title, `${label}.visual.title`);
  assertText(day.visual.description, `${label}.visual.description`);
  assertText(day.visual.loop, `${label}.visual.loop`);
  assert.equal(day.visual.steps.length, 6, `${label}.visual.steps must contain exactly six animated stages`);
  day.visual.steps.forEach((step, index) => {
    const stepLabel = `${label}.visual.steps[${index}]`;
    assertExactKeys(step, ["icon", "label", "data", "action", "insight"], stepLabel);
    assertIcon(step.icon, `${stepLabel}.icon`);
    for (const field of ["label", "data", "action", "insight"]) assertText(step[field], `${stepLabel}.${field}`);
  });

  assertExactKeys(day.analogyDetail, ["title", "story", "illustration", "boundary"], `${label}.analogyDetail`);
  assertText(day.analogyDetail.title, `${label}.analogyDetail.title`);
  assertText(day.analogyDetail.story, `${label}.analogyDetail.story`, locale === "en" ? 130 : 50);
  assertText(day.analogyDetail.boundary, `${label}.analogyDetail.boundary`, locale === "en" ? 90 : 35);
  assert.equal(day.analogyDetail.illustration.length, 4, `${label}.analogyDetail.illustration must contain exactly four mappings`);
  day.analogyDetail.illustration.forEach((item, index) => {
    const itemLabel = `${label}.analogyDetail.illustration[${index}]`;
    assertExactKeys(item, ["icon", "label", "mapsTo"], itemLabel);
    assertIcon(item.icon, `${itemLabel}.icon`);
    assertText(item.label, `${itemLabel}.label`);
    assertText(item.mapsTo, `${itemLabel}.mapsTo`);
  });

  if (expectedNumber >= 16) {
    assertExactKeys(day.infra, ["verifiedOn", "intro", "layers", "matrix"], `${label}.infra`);
    assert.equal(day.infra.verifiedOn, courseMeta.verifiedOn, `${label}.infra.verifiedOn must use the course verification date`);
    assertText(day.infra.intro, `${label}.infra.intro`, locale === "en" ? 120 : 45);
    assert.ok(day.infra.layers.length >= 4, `${label}.infra.layers must contain at least four responsibility layers`);
    day.infra.layers.forEach((layer, layerIndex) => {
      assertExactKeys(layer, ["layer", "projects"], `${label}.infra.layers[${layerIndex}]`);
      assertText(layer.layer, `${label}.infra.layers[${layerIndex}].layer`);
      assert.ok(layer.projects.length >= 1, `${label}.infra.layers[${layerIndex}] needs at least one project`);
      layer.projects.forEach((project, projectIndex) => {
        const projectLabel = `${label}.infra.layers[${layerIndex}].projects[${projectIndex}]`;
        assertExactKeys(project, ["name", "url", "problem", "mechanism", "boundary"], projectLabel);
        assertText(project.name, `${projectLabel}.name`);
        assertHttpsUrl(project.url, `${projectLabel}.url`);
        for (const field of ["problem", "mechanism", "boundary"]) assertText(project[field], `${projectLabel}.${field}`);
      });
    });
    assert.ok(day.infra.matrix.length >= 4, `${label}.infra.matrix must contain at least four cross-scale lessons`);
    day.infra.matrix.forEach((item, index) => {
      assertExactKeys(item, ["source", "lesson", "boundary"], `${label}.infra.matrix[${index}]`);
      for (const field of ["source", "lesson", "boundary"]) assertText(item[field], `${label}.infra.matrix[${index}].${field}`);
    });
  }

  if (expectedNumber < courseMeta.totalDays) assertText(day.next, `${label}.next`);
  else assert.equal(day.next, null, `${label}.next must be null in the final chapter`);
}

function publicUrl(relativePath) {
  if (relativePath === "index.html") return PATH_PREFIX;
  if (relativePath === "en/index.html") return `${PATH_PREFIX}en/`;
  return `${PATH_PREFIX}${relativePath}`;
}

function counterpart(relativePath) {
  if (relativePath === "index.html") return "en/index.html";
  if (relativePath === "en/index.html") return "index.html";
  return relativePath.startsWith("en/") ? relativePath.slice(3) : `en/${relativePath}`;
}

function pageContext(relativePath) {
  const english = relativePath.startsWith("en/");
  const locale = english ? "en" : "zh-CN";
  const course = english ? courseEn : courseZh;
  const match = relativePath.match(/day(\d{2})\.html$/);
  const number = match ? Number(match[1]) : null;
  return { english, locale, course, number, copy: i18n[locale] };
}

function read(base, relativePath) {
  return fs.readFileSync(path.join(base, relativePath), "utf8");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function countMatches(value, pattern) {
  return [...value.matchAll(pattern)].length;
}

function listPublishedHtml(base) {
  const topLevel = fs.readdirSync(base)
    .filter(filename => filename.endsWith(".html"))
    .map(filename => filename);
  const english = fs.readdirSync(path.join(base, "en"))
    .filter(filename => filename.endsWith(".html"))
    .map(filename => `en/${filename}`);
  return [...topLevel, ...english].sort();
}

test("Chinese and English courses expose 17 chapters with a strict nested schema", () => {
  assert.equal(courseMeta.totalDays, 17);
  assert.deepEqual(courseMeta.chapterNumbers, Array.from({ length: 17 }, (_, index) => index + 1));
  assert.equal(courseZh.length, courseMeta.totalDays);
  assert.equal(courseEn.length, courseMeta.totalDays);

  courseZh.forEach((day, index) => validateDay(day, "zh-CN", index + 1));
  courseEn.forEach((day, index) => validateDay(day, "en", index + 1));
});

test("localized chapters remain structurally aligned and preserve answer indices, sources, and icons", () => {
  const mirroredArrays = [
    "concept",
    "questions",
    "lesson",
    "references",
    "quiz",
    "keywords",
  ];

  courseZh.forEach((zhDay, index) => {
    const enDay = courseEn[index];
    const label = `Day ${index + 1}`;
    assert.equal(enDay.n, zhDay.n, `${label} numbering differs across locales`);
    assert.equal(enDay.readingMinutes, zhDay.readingMinutes, `${label} reading-time metadata differs across locales`);
    mirroredArrays.forEach(field => assert.equal(enDay[field].length, zhDay[field].length, `${label}.${field} length differs across locales`));
    if (zhDay.history.tracks) {
      assert.equal(enDay.history.tracks.length, zhDay.history.tracks.length, `${label} history track length differs across locales`);
      assert.deepEqual(enDay.history.tracks.map(track => track.milestones.length), zhDay.history.tracks.map(track => track.milestones.length), `${label} milestone lengths differ across locales`);
    } else {
      assert.equal(enDay.history.milestones.length, zhDay.history.milestones.length, `${label} history length differs across locales`);
    }
    assert.equal(enDay.visual.steps.length, zhDay.visual.steps.length, `${label} process length differs across locales`);
    assert.equal(enDay.analogyDetail.illustration.length, zhDay.analogyDetail.illustration.length, `${label} illustration length differs across locales`);

    assert.deepEqual(enDay.quiz.map(question => question.answer), zhDay.quiz.map(question => question.answer), `${label} quiz answer indices differ across locales`);
    assert.deepEqual(enDay.references.map(reference => reference[1]), zhDay.references.map(reference => reference[1]), `${label} reference URLs differ across locales`);
    const historyUrls = day => (day.history.tracks ?? [{ milestones: day.history.milestones }]).flatMap(track => track.milestones.map(item => item.source.url));
    assert.deepEqual(historyUrls(enDay), historyUrls(zhDay), `${label} historical source URLs differ across locales`);
    assert.deepEqual(enDay.visual.steps.map(step => step.icon), zhDay.visual.steps.map(step => step.icon), `${label} process icons differ across locales`);
    assert.deepEqual(enDay.analogyDetail.illustration.map(item => item.icon), zhDay.analogyDetail.illustration.map(item => item.icon), `${label} analogy icons differ across locales`);
    if (zhDay.infra) {
      assert.deepEqual(enDay.infra.layers.map(layer => layer.projects.length), zhDay.infra.layers.map(layer => layer.projects.length), `${label} project map differs across locales`);
      assert.deepEqual(enDay.infra.layers.flatMap(layer => layer.projects.map(project => project.url)), zhDay.infra.layers.flatMap(layer => layer.projects.map(project => project.url)), `${label} project URLs differ across locales`);
      assert.equal(enDay.infra.matrix.length, zhDay.infra.matrix.length, `${label} infrastructure matrix differs across locales`);
    }
  });
});

test("Chinese and English chapters meet independent reading-depth and script requirements", () => {
  courseZh.forEach(day => {
    const characters = JSON.stringify(day).match(cjkPattern) ?? [];
    const minimum = day.n >= 16 ? 4000 : 2200;
    assert.ok(characters.length >= minimum, `zh-CN Day ${day.n} has only ${characters.length} CJK characters; expected at least ${minimum}`);
  });

  courseEn.forEach(day => {
    const serialized = JSON.stringify(day);
    assert.doesNotMatch(serialized, cjkPattern, `en Day ${day.n} must not contain CJK text`);
    const words = serialized.match(englishWordPattern) ?? [];
    const minimum = day.n >= 16 ? 3200 : 1800;
    assert.ok(words.length >= minimum, `en Day ${day.n} has only ${words.length} English words; expected at least ${minimum}`);
  });
});

test("the UI dictionary has complete, non-empty keys for both locales", () => {
  assert.deepEqual(Object.keys(i18n).sort(), ["en", "zh-CN"]);
  assert.deepEqual(Object.keys(i18n.en).sort(), Object.keys(i18n["zh-CN"]).sort(), "UI dictionaries must have identical keys");
  assert.ok(Object.keys(i18n.en).length >= 50, "the UI dictionary is unexpectedly small");

  for (const [locale, dictionary] of Object.entries(i18n)) {
    for (const [key, value] of Object.entries(dictionary)) assertText(value, `${locale}.${key}`);
  }
});

test("every chapter has a distinct localized pool of three completion rewards", () => {
  assert.deepEqual(Object.keys(courseRewards).sort(), ["en", "zh-CN"]);
  for (const locale of ["zh-CN", "en"]) {
    const pools = courseRewards[locale];
    assert.equal(pools.length, courseMeta.totalDays, `${locale} must provide rewards for every chapter`);
    const titles = [];
    pools.forEach((pool, dayIndex) => {
      assert.equal(pool.length, 3, `${locale} Day ${dayIndex + 1} must have three random reward variants`);
      pool.forEach((reward, rewardIndex) => {
        const label = `${locale} Day ${dayIndex + 1} reward ${rewardIndex + 1}`;
        assertExactKeys(reward, ["icon", "title", "message"], label);
        assertIcon(reward.icon, `${label}.icon`);
        assertText(reward.title, `${label}.title`);
        assertText(reward.message, `${label}.message`);
        if (locale === "en") assert.doesNotMatch(JSON.stringify(reward), cjkPattern, `${label} must not contain CJK text`);
        titles.push(reward.title);
      });
    });
    assert.equal(new Set(titles).size, titles.length, `${locale} reward titles must remain unique across the course`);
  }
});

test("Eleventy registers strict i18n, escaping, filters, passthrough assets, and the GitHub Pages prefix", async () => {
  const configureEleventy = require(path.join(ROOT, "eleventy.config.cjs"));
  const plugins = [];
  const filters = new Map();
  const passthroughCopies = [];
  const nunjucksOptions = [];
  const transforms = new Map();
  const fakeConfig = {
    addPlugin(plugin, options) { plugins.push({ plugin, options }); },
    addFilter(name, filter) { filters.set(name, filter); },
    addPassthroughCopy(value) { passthroughCopies.push(value); },
    setNunjucksEnvironmentOptions(value) { nunjucksOptions.push(value); },
    addTransform(name, transform) { transforms.set(name, transform); },
  };

  const result = await configureEleventy(fakeConfig);
  assert.equal(plugins.length, 1, "exactly one Eleventy plugin should be registered");
  assert.equal(plugins[0].plugin.name, "eleventyI18nPlugin", "the registered plugin must be Eleventy's I18nPlugin");
  assert.deepEqual(plugins[0].options, {
    defaultLanguage: "zh-CN",
    errorMode: "strict",
    filters: { url: "eleventy_locale_url", links: "locale_links" },
  });
  assert.deepEqual(nunjucksOptions, [{ autoescape: true }]);
  assert.equal(filters.get("pad2")(4), "04");
  assert.deepEqual(JSON.parse(decodeURIComponent(filters.get("encodePayload")({ locale: "中/en" }))), { locale: "中/en" });
  assert.equal(filters.get("locale_url").call({ ctx: { lang: "en" } }, "/day03.html"), "/en/day03.html");
  assert.equal(filters.get("locale_url").call({ ctx: { lang: "zh-CN" } }, "/en/day03.html"), "/day03.html");
  assert.ok(transforms.has("cleanHtmlWhitespace"), "HTML output must use the deterministic whitespace transform");
  assert.deepEqual(passthroughCopies, [{
    "src/assets/app.js": "app.js",
    "src/assets/favicon.svg": "favicon.svg",
    "src/assets/styles.css": "styles.css",
  }]);
  assert.deepEqual(result.dir, { input: "src", output: "_site", includes: "_includes", data: "_data" });
  assert.equal(result.htmlTemplateEngine, "njk");
  assert.equal(result.pathPrefix, PATH_PREFIX);

  const manifest = JSON.parse(read(ROOT, "package.json"));
  assert.match(manifest.devDependencies?.["@11ty/eleventy"] ?? "", /^3\./, "Eleventy 3 must be pinned as a development dependency");
  assert.equal(manifest.scripts?.["build:site"], "eleventy");
  assert.ok(manifest.scripts?.build?.includes("sync:pages"), "the production build must sync verified static pages");
});

test("the root publication tree and _site each contain exactly 36 bilingual HTML pages", () => {
  const expected = [...pageFiles].sort();
  assert.deepEqual(listPublishedHtml(ROOT), expected, "repository-root publication pages are incomplete or contain stale HTML");
  assert.deepEqual(listPublishedHtml(SITE_ROOT), expected, "_site pages are incomplete or contain stale HTML");
});

test("every generated page has correct language, title, canonical URL, hreflang set, and language switch", () => {
  for (const base of [ROOT, SITE_ROOT]) {
    for (const relativePath of pageFiles) {
      const html = read(base, relativePath);
      const { locale, course, number, copy } = pageContext(relativePath);
      const localizedTitle = number === null ? copy.siteTitle : `Day ${String(number).padStart(2, "0")} · ${course[number - 1].t}`;
      const canonical = `${SITE_ORIGIN}${publicUrl(relativePath)}`;
      const oppositePath = counterpart(relativePath);
      const zhPath = relativePath.startsWith("en/") ? oppositePath : relativePath;
      const enPath = relativePath.startsWith("en/") ? relativePath : oppositePath;

      assert.ok(html.includes(`<html lang="${locale}">`), `${relativePath} has the wrong html lang`);
      assert.ok(html.includes(`<title>${escapeHtml(localizedTitle)}</title>`), `${relativePath} has the wrong localized title`);
      assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`), `${relativePath} has the wrong canonical URL`);

      const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)]
        .map(match => [match[1], match[2]]);
      assert.equal(alternates.length, 3, `${relativePath} must expose exactly zh-CN, en, and x-default alternates`);
      assert.deepEqual(Object.fromEntries(alternates), {
        "zh-CN": `${SITE_ORIGIN}${publicUrl(zhPath)}`,
        en: `${SITE_ORIGIN}${publicUrl(enPath)}`,
        "x-default": `${SITE_ORIGIN}${publicUrl(zhPath)}`,
      }, `${relativePath} hreflang links must target the same chapter`);

      const switches = [...html.matchAll(/<a class="language-switch" href="([^"]+)" lang="([^"]+)" hreflang="([^"]+)"/g)];
      assert.equal(switches.length, 1, `${relativePath} must contain exactly one language switch`);
      assert.equal(switches[0][1], publicUrl(oppositePath), `${relativePath} language switch must preserve the chapter`);
      assert.equal(switches[0][2], locale === "en" ? "zh-CN" : "en");
      assert.equal(switches[0][3], locale === "en" ? "zh-CN" : "en");

      for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        if (match[1].startsWith("/")) assert.ok(match[1].startsWith(PATH_PREFIX), `${relativePath} leaks an unprefixed GitHub Pages URL: ${match[1]}`);
      }
    }
  }
});

test("home pages and all 34 chapter pages retain useful no-JavaScript content", () => {
  for (const base of [ROOT, SITE_ROOT]) {
    for (const relativePath of ["index.html", "en/index.html"]) {
      const html = read(base, relativePath);
      const { copy, english } = pageContext(relativePath);
      assert.ok(html.includes("<noscript>"), `${relativePath} needs a noscript block`);
      assert.ok(html.includes(escapeHtml(copy.noscriptHome)), `${relativePath} needs a localized no-JavaScript explanation`);
      for (const dayFile of dayFiles) {
        const expectedLink = publicUrl(english ? `en/${dayFile}` : dayFile);
        assert.ok(html.includes(`href="${expectedLink}"`), `${relativePath} is missing ${expectedLink}`);
      }
    }

    for (const relativePath of pageFiles.filter(filename => filename.includes("day"))) {
      const html = read(base, relativePath);
      const { course, number, copy } = pageContext(relativePath);
      const day = course[number - 1];
      assert.ok(html.includes("<noscript>"), `${relativePath} needs a noscript block`);
      assert.ok(html.includes(escapeHtml(copy.noscriptDay)), `${relativePath} needs a localized no-JavaScript explanation`);
      assert.match(html, /<details class="static-diagram" open>/, `${relativePath} needs an expanded static process overview`);
      assert.ok(html.includes(`<pre class="diagram">${escapeHtml(day.diagram)}</pre>`), `${relativePath} is missing its static process diagram`);
    }
  }
});

test("all chapter pages render complete quiz markup and six-stage interactive process visuals", () => {
  for (const base of [ROOT, SITE_ROOT]) {
    for (const relativePath of pageFiles.filter(filename => filename.includes("day"))) {
      const html = read(base, relativePath);
      const { course, number } = pageContext(relativePath);
      const day = course[number - 1];

      assert.ok(html.includes("data-process-visual"), `${relativePath} needs an interactive process region`);
      assert.ok(html.includes("data-process-toggle"), `${relativePath} needs autoplay controls`);
      assert.ok(html.includes("data-process-prev"), `${relativePath} needs a previous-step control`);
      assert.ok(html.includes("data-process-next"), `${relativePath} needs a next-step control`);
      assert.equal(countMatches(html, /class="process-step(?: is-active)?"/g), day.visual.steps.length, `${relativePath} rendered the wrong process-step count`);
      day.visual.steps.forEach(step => assert.ok(html.includes(step.icon), `${relativePath} is missing process icon ${step.icon}`));

      assert.ok(html.includes('class="quiz-form"'), `${relativePath} needs a quiz form`);
      assert.ok(html.includes("data-quiz-payload"), `${relativePath} needs static quiz payload data`);
      assert.ok(html.includes('class="chapter-reward"'), `${relativePath} needs a completion reward region`);
      assert.ok(html.includes("data-reward-payload"), `${relativePath} needs its localized reward pool`);
      assert.match(html, /class="chapter-reward"[^>]*hidden/, `${relativePath} must hide its reward before a perfect quiz`);
      assert.equal(countMatches(html, /class="question-card"/g), 3, `${relativePath} must render three quiz questions`);
      assert.equal(countMatches(html, /class="answer-explanation" hidden/g), 3, `${relativePath} answers must remain hidden before submission`);
    }
  }
});

test("Day 16 and Day 17 render dual history tracks, layered project maps, and verification metadata", () => {
  for (const base of [ROOT, SITE_ROOT]) {
    for (const relativePath of ["day16.html", "day17.html", "en/day16.html", "en/day17.html"]) {
      const html = read(base, relativePath);
      const { course, number } = pageContext(relativePath);
      const day = course[number - 1];
      const projectCount = day.infra.layers.reduce((total, layer) => total + layer.projects.length, 0);

      assert.equal(countMatches(html, /class="history-track"/g), 2, `${relativePath} must render two historical tracks`);
      assert.equal(countMatches(html, /class="infra-layer"/g), day.infra.layers.length, `${relativePath} rendered the wrong infrastructure-layer count`);
      assert.equal(countMatches(html, /class="project-card"/g), projectCount, `${relativePath} rendered the wrong project-card count`);
      assert.equal(countMatches(html, /<tr>/g) >= day.infra.matrix.length + 2, true, `${relativePath} must render the cross-scale matrix rows`);
      assert.ok(html.includes(`<time datetime="${courseMeta.verifiedOn}">${courseMeta.verifiedOn}</time>`), `${relativePath} must expose the verification date semantically`);
    }
  }
});

test("repository-root deployment artifacts are byte-for-byte synchronized with _site", () => {
  for (const relativePath of syncedFiles) {
    const rootArtifact = fs.readFileSync(path.join(ROOT, relativePath));
    const siteArtifact = fs.readFileSync(path.join(SITE_ROOT, relativePath));
    assert.deepEqual(rootArtifact, siteArtifact, `${relativePath} has drifted from the Eleventy output; run npm run build`);
  }
});

test("the client honors runtime reduced-motion changes and reveals the active mobile chapter", () => {
  const source = read(ROOT, "src/assets/app.js");
  const css = read(ROOT, "src/assets/styles.css");

  assert.ok(source.includes('matchMedia("(prefers-reduced-motion: reduce)")'), "process playback must query the user's motion preference");
  assert.ok(source.includes('motionQuery.addEventListener("change", handleMotionPreference)'), "process playback must observe runtime motion-preference changes");
  assert.ok(source.includes("motionQuery.addListener(handleMotionPreference)"), "process playback needs the legacy MediaQueryList fallback");
  assert.ok(source.includes("autoPlaying = false"), "reduced motion must stop autoplay");
  assert.ok(source.includes("revealActiveNavigation()"), "the active chapter must be revealed after binding");
  assert.ok(source.includes("navigation.scrollWidth > navigation.clientWidth"), "horizontal navigation should scroll only when it overflows");
  assert.ok(source.includes("navigation.scrollHeight > navigation.clientHeight"), "desktop navigation should scroll only when it overflows vertically");
  assert.ok(source.includes("navigation.scrollLeft = Math.max"), "mobile navigation must center the active chapter");
  assert.ok(source.includes("navigation.scrollTop = Math.max"), "desktop navigation must reveal the active chapter");
  assert.ok(!source.includes("toggle.setAttribute(\"aria-pressed\""), "the playback action must not expose a conflicting toggle state");
  assert.ok(source.includes("Math.random()"), "perfect chapter completion must choose a random reward variant");
  assert.ok(source.includes('rewardRoot.querySelector("[data-reward-title]").textContent'), "reward titles must be inserted with textContent");
  assert.ok(source.includes('rewardRoot.querySelector("[data-reward-message]").textContent'), "reward messages must be inserted with textContent");

  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*?\.toc\s*\{[\s\S]*?overflow-x:\s*auto;/, "mobile chapter navigation must be horizontally scrollable");
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*?\.toc\s*\{[\s\S]*?position:\s*sticky;/, "mobile chapter navigation must remain available on long pages");
  assert.match(css, /@media\s*\(max-width:\s*460px\)[\s\S]*?\.keyword-table\s+thead,[\s\S]*?display:\s*none;/, "mobile keyword tables must switch to labeled cards");
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/, "CSS must disable non-essential motion when requested");
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?animation-duration:\s*0\.01ms/, "reduced-motion CSS must collapse animation duration");
});
