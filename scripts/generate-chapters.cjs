const fs = require('node:fs');
const vm = require('node:vm');

const source = `${fs.readFileSync('app.js', 'utf8')}\nglobalThis.__days = days;`;
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
  <header class="top"><div class="brand">端侧 AI · 15 天工程路线</div><a href="index.html">目录首页</a></header>
  <main class="wrap day-layout">
    <aside class="toc panel"><span class="eyebrow">学习导航</span>${context.__days.map(item => `<a class="${item.n === day.n ? 'active' : ''}" href="day${String(item.n).padStart(2, '0')}.html">Day ${String(item.n).padStart(2, '0')} · ${escapeHtml(item.t)}</a>`).join('')}</aside>
    <article class="content" data-day="${day.n}">
      <div class="eyebrow">DAY ${String(day.n).padStart(2, '0')}</div>
      <h1>${escapeHtml(day.t)}</h1>
      <p class="hero-sub">${escapeHtml(day.s)}</p>
      <p class="reading-time">建议阅读：约 ${day.readingMinutes} 分钟</p>
      <section><h2>学习目标</h2><div class="callout">${escapeHtml(day.goal)}</div></section>
      <section><h2>本章关键词</h2><table class="keyword-table"><thead><tr><th>关键词</th><th>解释</th><th>ESP32 工程类比</th></tr></thead><tbody>${day.keywords.map(item => `<tr><th scope="row">${escapeHtml(item.term)}</th><td>${escapeHtml(item.definition)}</td><td>${escapeHtml(item.espAnalogy)}</td></tr>`).join('')}</tbody></table></section>
      <section><h2>承上：回顾与定位</h2><p>${escapeHtml(day.recap)}</p></section>
      <section><h2>嵌入式类比</h2><p>${escapeHtml(day.analogy)}</p></section>
      <section><h2>本章讲解</h2>${day.lesson.map(item => `<h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p>`).join('')}</section>
      <section><h2>流程图</h2><pre class="diagram">${escapeHtml(day.diagram)}</pre></section>
      <section><h2>代码或命令示例</h2><pre class="code"><code>${escapeHtml(day.code)}</code></pre></section>
      <section><h2>动手实验</h2><div class="callout">${escapeHtml(day.lab)}</div></section>
      <section><h2>工程陷阱</h2><div class="pitfall"><strong>避免误判：</strong>${escapeHtml(day.pitfall)}</div></section>
      <section class="quiz" aria-labelledby="quiz-title"><h2 id="quiz-title">核心测试</h2><p>完成 3 道单选题后提交；提交前不会显示答案。</p><form id="quiz-form" novalidate>${day.quiz.map((item, index) => `<fieldset class="question-card" data-question="${index}"><legend>${index + 1}. ${escapeHtml(item.prompt)}</legend>${item.options.map((option, optionIndex) => `<label class="quiz-option"><input type="radio" name="question-${index}" value="${optionIndex}"> <span>${escapeHtml(option)}</span></label>`).join('')}<div class="answer-explanation" hidden></div></fieldset>`).join('')}<p class="quiz-feedback" id="quiz-feedback" role="status" aria-live="polite"></p><button class="button" type="submit">提交本章测试</button><button class="button secondary" id="retry-quiz" type="button" hidden>重新作答</button></form></section>
      <section><h2>延伸阅读</h2><ul class="reference-list">${day.references.map(ref => `<li><a href="${escapeHtml(ref[1])}" target="_blank" rel="noopener noreferrer">${escapeHtml(ref[0])}（官方/原始资料）</a></li>`).join('')}</ul></section>
      <section><h2>启下：下一章如何使用本章能力</h2><p>${escapeHtml(day.nextPreview)}</p>${day.next ? `<p>下一天：<a href="day${String(day.n + 1).padStart(2, '0')}.html">Day ${day.n + 1} · ${escapeHtml(day.next)}</a></p>` : ''}</section>
      <div class="nav">${day.n > 1 ? `<a class="button secondary" href="day${String(day.n - 1).padStart(2, '0')}.html">← Day ${day.n - 1}</a>` : '<span></span>'}${day.n < context.__days.length ? `<a class="button" href="day${String(day.n + 1).padStart(2, '0')}.html">Day ${day.n + 1} →</a>` : '<a class="button" href="index.html">回到首页</a>'}</div>
    </article>
  </main>
  <footer><div class="wrap">离线可用 · 面向熟悉 ESP32、USB 与网络协议栈的嵌入式工程师</div></footer>
  <script src="app.js"></script>
</body>
</html>
`;

context.__days.forEach(day => {
  fs.writeFileSync(`day${String(day.n).padStart(2, '0')}.html`, page(day), 'utf8');
});
