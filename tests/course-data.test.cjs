const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

function loadApp() {
  const enrichmentSource = [
    'content/enrichment-01-05.js',
    'content/enrichment-06-10.js',
    'content/enrichment-11-15.js',
  ].map(filename => fs.readFileSync(filename, 'utf8')).join('\n');
  const source = `${enrichmentSource}\n${fs.readFileSync('app.js', 'utf8')}\nglobalThis.__days = days; globalThis.__gradeQuiz = gradeQuiz;`;
  const app = { innerHTML: '' };
  const context = {
    console,
    document: { querySelector: () => app },
    location: { pathname: '/index.html' },
  };

  vm.runInNewContext(source, context);
  return {days: context.__days, gradeQuiz: context.__gradeQuiz};
}

test('every course day provides sourced lessons and three complete quiz questions', () => {
  const {days} = loadApp();

  assert.equal(days.length, 15);
  for (const day of days) {
    assert.ok(Array.isArray(day.lesson) && day.lesson.length >= 2, `Day ${day.n} needs lesson sections`);
    assert.ok(typeof day.pitfall === 'string' && day.pitfall.length > 20, `Day ${day.n} needs a practical pitfall`);
    assert.ok(Array.isArray(day.references) && day.references.length >= 2, `Day ${day.n} needs first-party references`);
    assert.equal(day.quiz.length, 3, `Day ${day.n} needs three quiz questions`);

    for (const question of day.quiz) {
      assert.equal(question.options.length, 4, `Day ${day.n} questions need four options`);
      assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 4);
      assert.ok(question.explanation.length > 30, `Day ${day.n} needs an explanatory answer`);
    }
  }
});

test('quiz grading reports correct answers without revealing them before submission', () => {
  const {days, gradeQuiz} = loadApp();
  const answers = [days[0].quiz[0].answer, 0, days[0].quiz[2].answer];

  const result = gradeQuiz(days[0].quiz, answers);

  assert.equal(result.score, 2);
  assert.deepEqual([...result.correct], [true, false, true]);
});

test('quiz styles expose focus, correctness, and mobile-friendly feedback states', () => {
  const css = fs.readFileSync('styles.css', 'utf8');

  for (const selector of ['.quiz', '.question-card', '.quiz-option:focus-within', '.is-correct', '.is-incorrect', '.answer-explanation', '.reference-list', '.timeline', '.analogy-illustration', '.process-track', 'prefers-reduced-motion']) {
    assert.ok(css.includes(selector), `missing ${selector} styles`);
  }
});

test('every linked chapter has a static HTML entry point for GitHub Pages', () => {
  for (let day = 1; day <= 15; day += 1) {
    const filename = `day${String(day).padStart(2, '0')}.html`;
    assert.ok(fs.existsSync(filename), `missing ${filename}`);
  }
});

test('home and chapter pages retain useful static content without JavaScript', () => {
  const home = fs.readFileSync('index.html', 'utf8');
  assert.ok(home.includes('href="day01.html"'), 'home needs a static first-chapter link');
  assert.ok(home.includes('href="day15.html"'), 'home needs the complete static chapter directory');
  assert.ok(home.includes('<noscript>'), 'home needs a no-JavaScript notice');

  for (let day = 1; day <= 15; day += 1) {
    const html = fs.readFileSync(`day${String(day).padStart(2, '0')}.html`, 'utf8');
    assert.match(html, /<details class="static-diagram" open>/, `Day ${day} needs an expanded no-JavaScript process overview`);
    assert.ok(html.includes('当前为静态阅读模式'), `Day ${day} needs a no-JavaScript explanation`);
  }
});

test('every static chapter page contains its learning content and flow diagram', () => {
  const {days} = loadApp();

  for (const day of days) {
    const filename = `day${String(day.n).padStart(2, '0')}.html`;
    const html = fs.readFileSync(filename, 'utf8');

    for (const requiredText of [day.t, '本章讲解', '工程陷阱', '核心测试', '延伸阅读']) {
      assert.ok(html.includes(requiredText), `${filename} is missing ${requiredText}`);
    }
    assert.match(html, /<pre class="diagram">[\s\S]+<\/pre>/, `${filename} is missing a flow diagram`);
  }
});

test('every chapter provides expanded history, analogy, and animated process content', () => {
  const {days} = loadApp();

  for (const day of days) {
    assert.ok(day.readingMinutes >= 16 && day.readingMinutes <= 20, `Day ${day.n} should target an expanded reading session`);
    assert.ok(Array.isArray(day.keywords) && day.keywords.length >= 4, `Day ${day.n} needs keyword definitions`);
    assert.ok(typeof day.recap === 'string' && day.recap.length > 40, `Day ${day.n} needs a bridge from the previous day`);
    assert.ok(typeof day.nextPreview === 'string' && day.nextPreview.length > 40, `Day ${day.n} needs a bridge to the next day`);
    assert.ok(day.lesson.length >= 5, `Day ${day.n} needs detailed, chapter-specific reading sections`);
    assert.ok(day.history && day.history.intro.length > 40, `Day ${day.n} needs historical context`);
    assert.ok(day.history.milestones.length >= 4, `Day ${day.n} needs at least four historical milestones`);
    assert.ok(day.history.bridge.length > 30, `Day ${day.n} needs a history-to-practice bridge`);
    assert.ok(day.analogyDetail && day.analogyDetail.story.length > 50, `Day ${day.n} needs a vivid analogy`);
    assert.ok(day.analogyDetail.illustration.length >= 3, `Day ${day.n} needs an illustrated analogy map`);
    assert.ok(day.analogyDetail.boundary.length > 20, `Day ${day.n} needs an explicit analogy boundary`);
    assert.ok(day.visual && day.visual.steps.length >= 4, `Day ${day.n} needs an animated process`);

    for (const milestone of day.history.milestones) {
      assert.match(milestone.source.url, /^https:\/\//, `Day ${day.n} history sources must be linked`);
    }
    for (const step of day.visual.steps) {
      for (const field of ['icon', 'label', 'data', 'action', 'insight']) {
        assert.ok(typeof step[field] === 'string' && step[field].length > 0, `Day ${day.n} visual step needs ${field}`);
      }
    }

    const html = fs.readFileSync(`day${String(day.n).padStart(2, '0')}.html`, 'utf8');
    assert.match(html, /<table class="keyword-table">[\s\S]+<\/table>/, `Day ${day.n} needs a keyword table`);
    assert.ok(html.includes('承上：回顾与定位'), `Day ${day.n} needs a previous-day bridge`);
    assert.ok(html.includes('启下：下一章如何使用本章能力'), `Day ${day.n} needs a next-day bridge`);
    assert.ok(html.includes('历史发展脉络'), `Day ${day.n} needs a visible history timeline`);
    assert.ok(html.includes('类比图解'), `Day ${day.n} needs a visible analogy illustration`);
    assert.ok(html.includes('data-process-visual'), `Day ${day.n} needs an interactive process visual`);
    assert.ok(html.includes('data-process-toggle'), `Day ${day.n} process visual needs playback controls`);
    assert.ok((html.match(/[\u4e00-\u9fff]/g) || []).length >= 2300, `Day ${day.n} needs expanded reading depth`);
  }
});

test('process playback follows runtime motion preferences and mobile navigation reveals the active day', () => {
  const source = fs.readFileSync('app.js', 'utf8');
  assert.ok(source.includes("motionQuery.addEventListener('change'"), 'playback should observe motion preference changes');
  assert.ok(source.includes('revealActiveNavigation()'), 'chapter navigation should reveal the active day');
  assert.ok(!source.includes("toggle.setAttribute('aria-pressed'"), 'playback action labels should not conflict with toggle state');
});
