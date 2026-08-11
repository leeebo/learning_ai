# Repository maintenance guide

This file applies to the whole repository. The site is a bilingual Eleventy 3 project that publishes a 15-day edge-AI course to GitHub Project Pages at `/learning_ai/`.

## Source of truth

- Edit course content under `src/_data/course/`:
  - `zh-15.cjs` and `en-15.cjs` define the published 15-day plan, merged chapters, numbering, transitions, and the standalone LLM-foundations and Attention chapters.
  - `zh-CN.json`, `zh-16-17.cjs`, `en-01-07.cjs`, `en-08-15.cjs`, and `en-16-17.cjs` retain the detailed source material reused by that plan. Keep source edits paired across locales.
- Edit chapter count, ordered chapter numbers, and volatile-technology verification date in `src/_data/courseMeta.cjs`; loaders, synchronization, and tests must consume it instead of scattering numeric totals.
- Edit shared UI copy in `src/_data/i18n.cjs`.
- Edit localized per-chapter perfect-quiz rewards in `src/_data/courseRewards.cjs`; every chapter keeps three unique variants in each locale.
- Edit page structure in `src/_includes/` and locale entry templates in `src/zh-CN/` and `src/en/`. Keep paired `review.njk` and `certificate.njk` entries for the browser-local mistake notebook and completion keepsake.
- Edit browser behavior and styling in `src/assets/app.js` and `src/assets/styles.css`.
- Treat root `index.html`, `review.html`, `certificate.html`, `dayNN.html`, `en/`, `app.js`, and `styles.css` as generated deployment artifacts. Never edit them directly.
- `_site/` is disposable Eleventy output and must not be committed.

## Commands

Use Node.js 18 or newer.

```bash
npm ci
npm run serve
npm run build
npm test
npm run check
```

`npm run build` first writes `_site/`, validates the expected bilingual output, and then synchronizes the deployable files to the repository root. Run it after every source or template change. `npm run check` is the required pre-handoff validation.

## Locale and routing invariants

- `zh-CN` is the default locale. Its public URLs stay at `/index.html` and `/dayNN.html` for backward compatibility.
- English public URLs live at `/en/index.html` and `/en/dayNN.html`.
- Keep the paired source templates under `src/zh-CN/` and `src/en/`; Eleventy's bundled `I18nPlugin` matches equivalent pages by their locale directories and identical entry filenames (`day01.njk` through `day15.njk`).
- The repository is deployed below `/learning_ai/`. Route every internal URL through the configured Eleventy URL filters; do not hard-code domain-root `/en/...` links.
- Every page must keep a normal anchor-based same-page language switch, the correct `<html lang>`, an absolute canonical URL, and reciprocal `hreflang` links including `x-default`.
- Do not auto-redirect from browser language. Users and crawlers must be able to choose stable, cacheable URLs.

## Translation parity

- Both locales must contain exactly Day 1 through Day 15 with the same top-level schema for each chapter generation; Day 14–15 add the optional `infra` structure and dual-track history in both languages.
- Preserve chapter numbers, reading-time bounds, array lengths, history source URLs, icons, reference URLs, and quiz answer indexes across translations.
- Translate every user-facing string, including diagram labels, code comments, source labels, quiz explanations, animation steps, analogy boundaries, and next-chapter text.
- Do not shorten translated lessons. Each chapter must retain its historical development, engineering analogy, process visualization, lab, pitfall, references, and three-question quiz.
- When changing quiz options, verify that `answer` still points to the intended option in both locales.
- Historical links should remain HTTPS links to official documentation or primary sources whenever possible.
- Fast-moving framework, runtime, and hardware claims must include the shared `verifiedOn` date. Use papers, official documentation, or project repositories; do not present vendor benchmark numbers as workload-independent rankings.

## Templates, interaction, and accessibility

- Keep substantive chapter content pre-rendered. JavaScript may enhance a page but must not be required to read it.
- The static process diagram stays open in generated HTML and may only collapse after the interactive player binds successfully.
- Preserve keyboard-operable controls, visible focus styles, `aria-live` quiz/process feedback, and the active chapter's mobile navigation reveal.
- Respect `prefers-reduced-motion` both at initial load and when the preference changes at runtime. Never start autoplay for a visitor requesting reduced motion.
- Put localized runtime labels in `i18n.cjs` and pass them through the page payload; do not add Chinese or English UI literals to the shared client script.
- Prefer `textContent` and DOM construction for dynamic feedback. Do not inject translated content with unsafe `innerHTML`.
- Store progress, mistakes, streaks, reading positions, and lab notes only under the versioned `learning-ai-progress-v1` localStorage key. Loading failures must fall back to an empty in-memory state without blocking course reading.
- Validate imported learning archives by format version, exact course length, day range, quiz indexes, field types, and file size before replacing local state. Never merge arbitrary archive fields into runtime objects.
- Keep completion explicit: only a perfect submitted quiz marks a chapter complete. Merely visiting or scrolling a page may mark it started but never mastered.
- Treat the printable certificate as a local keepsake, not an independently verifiable credential. It unlocks only when every chapter is complete.
- Search, dashboards, archive controls, review filtering, certificates, and note export are enhancements. Home cards, chapter lessons, and ordinary locale links must remain useful without JavaScript.
- When adding images that contain text, provide locale-specific assets and localized alternative text.

## Adding another locale

1. Add a complete course data module and UI dictionary entry.
2. Add a locale directory with `index.njk`, `review.njk`, `certificate.njk`, `day01.njk` through `day15.njk`, and directory data matching the existing English structure.
3. Extend the sync manifest so every generated locale file is deployed.
4. Extend canonical, alternate-link, and language-switch coverage; update the sitemap too if one is added.
5. Add parity and generated-page assertions to the test suite.
6. Build and visually inspect at least one desktop page, one narrow mobile page, Day 1, Day 14, and Day 15 in the new locale.

## Definition of done

- `npm run check` passes from a clean install.
- Generated root files match `_site/` byte-for-byte.
- Both locales contain 15 working chapter pages with no broken in-locale navigation.
- Quiz grading, local progress, archive validation, mistake review, certificate gating/printing, note export, process controls, reduced-motion behavior, no-JavaScript reading, canonical links, and language switches are verified in the generated pages.
- `git diff --check` reports no whitespace errors, and unrelated user changes remain untouched.
