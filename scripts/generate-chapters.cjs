const fs = require('node:fs');
const vm = require('node:vm');

const enrichmentFiles = [
  'content/enrichment-01-05.js',
  'content/enrichment-06-10.js',
  'content/enrichment-11-15.js',
];
const enrichmentSource = enrichmentFiles
  .filter(filename => fs.existsSync(filename))
  .map(filename => fs.readFileSync(filename, 'utf8'))
  .join('\n');
const source = `${enrichmentSource}\n${fs.readFileSync('app.js', 'utf8')}\nglobalThis.__days = days; globalThis.__historyMarkup = historyMarkup; globalThis.__analogyMarkup = analogyMarkup; globalThis.__processVisualMarkup = processVisualMarkup; globalThis.__quizMarkup = quizMarkup; globalThis.__homeMarkup = homeMarkup;`;
const app = {innerHTML: ''};
const context = {
  document: {querySelector: () => app},
  location: {pathname: '/index.html'},
};
vm.runInNewContext(source, context);

const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const page = day => `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Day ${String(day.n).padStart(2, '0')} · ${escapeHtml(day.t)}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <noscript>
    <style>.visual-toggle,.process-controls,.quiz .button{display:none!important}.process-node{pointer-events:none;cursor:default}</style>
    <div class="noscript-banner">当前为静态阅读模式：历史、类比、正文与展开的流程全景图仍可阅读；动态演示和测试评分需要启用 JavaScript。</div>
  </noscript>
  <header class="top"><div class="brand">端侧 AI · 15 天工程路线</div><a href="index.html">目录首页</a></header>
  <main class="wrap day-layout">
    <aside class="toc panel"><span class="eyebrow">学习导航</span>${context.__days.map(item => `<a class="${item.n === day.n ? 'active' : ''}" href="day${String(item.n).padStart(2, '0')}.html">Day ${String(item.n).padStart(2, '0')} · ${escapeHtml(item.t)}</a>`).join('')}</aside>
    <article class="content" data-day="${day.n}">
      <div class="eyebrow">DAY ${String(day.n).padStart(2, '0')}</div>
      <h1>${escapeHtml(day.t)}</h1>
      <p class="hero-sub">${escapeHtml(day.s)}</p>
      <p class="reading-time">建议阅读：约 ${day.readingMinutes} 分钟</p>
      <section><h2>学习目标</h2><div class="callout">${escapeHtml(day.goal)}</div></section>
      <section><h2>本章关键词</h2><div class="table-scroll"><table class="keyword-table"><thead><tr><th>关键词</th><th>解释</th><th>ESP32 工程类比</th></tr></thead><tbody>${day.keywords.map(item => `<tr><th scope="row">${escapeHtml(item.term)}</th><td>${escapeHtml(item.definition)}</td><td>${escapeHtml(item.espAnalogy)}</td></tr>`).join('')}</tbody></table></div></section>
      <section><h2>承上：回顾与定位</h2><p>${escapeHtml(day.recap)}</p></section>
      ${context.__historyMarkup(day)}
      ${context.__analogyMarkup(day)}
      <section><h2>本章讲解</h2>${day.lesson.map(item => `<h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p>`).join('')}</section>
      ${context.__processVisualMarkup(day)}
      <section><h2>代码或命令示例</h2><pre class="code"><code>${escapeHtml(day.code)}</code></pre></section>
      <section><h2>动手实验</h2><div class="callout">${escapeHtml(day.lab)}</div></section>
      <section><h2>工程陷阱</h2><div class="pitfall"><strong>避免误判：</strong>${escapeHtml(day.pitfall)}</div></section>
      ${context.__quizMarkup(day)}
      <section><h2>延伸阅读</h2><ul class="reference-list">${day.references.map(ref => `<li><a href="${escapeHtml(ref[1])}" target="_blank" rel="noopener noreferrer">${escapeHtml(ref[0])}（官方/原始资料）</a></li>`).join('')}</ul></section>
      <section><h2>启下：下一章如何使用本章能力</h2><p>${escapeHtml(day.nextPreview)}</p>${day.next ? `<p>下一天：<a href="day${String(day.n + 1).padStart(2, '0')}.html">Day ${day.n + 1} · ${escapeHtml(day.next)}</a></p>` : ''}</section>
      <div class="nav">${day.n > 1 ? `<a class="button secondary" href="day${String(day.n - 1).padStart(2, '0')}.html">← Day ${day.n - 1}</a>` : '<span></span>'}${day.n < context.__days.length ? `<a class="button" href="day${String(day.n + 1).padStart(2, '0')}.html">Day ${day.n + 1} →</a>` : '<a class="button" href="index.html">回到首页</a>'}</div>
    </article>
  </main>
  <footer><div class="wrap">离线可用 · 面向熟悉 ESP32、USB 与网络协议栈的嵌入式工程师</div></footer>
  ${enrichmentFiles.map(filename => `<script src="${filename}"></script>`).join('\n  ')}
  <script src="app.js"></script>
</body>
</html>
`;

context.__days.forEach(day => {
  fs.writeFileSync(`day${String(day.n).padStart(2, '0')}.html`, page(day), 'utf8');
});

const homePage = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>端侧 AI · 15 天工程路线</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <noscript><div class="noscript-banner">当前为静态阅读模式；章节目录仍可使用，进入章节后可阅读展开的流程全景图。动态演示和测试评分需要启用 JavaScript。</div></noscript>
  <div id="app">${context.__homeMarkup()}</div>
  ${enrichmentFiles.map(filename => `<script src="${filename}"></script>`).join('\n  ')}
  <script src="app.js"></script>
</body>
</html>
`;

fs.writeFileSync('index.html', homePage, 'utf8');
