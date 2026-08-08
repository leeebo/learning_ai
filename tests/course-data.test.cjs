const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

function loadApp() {
  const source = `${fs.readFileSync('app.js', 'utf8')}\nglobalThis.__days = days; globalThis.__gradeQuiz = gradeQuiz;`;
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

  for (const selector of ['.quiz', '.question-card', '.quiz-option:focus-within', '.is-correct', '.is-incorrect', '.answer-explanation', '.reference-list']) {
    assert.ok(css.includes(selector), `missing ${selector} styles`);
  }
});

test('every linked chapter has a static HTML entry point for GitHub Pages', () => {
  for (let day = 1; day <= 15; day += 1) {
    const filename = `day${String(day).padStart(2, '0')}.html`;
    assert.ok(fs.existsSync(filename), `missing ${filename}`);
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

test('every chapter provides a ten-minute reading structure with a keyword table and learning bridge', () => {
  const {days} = loadApp();

  for (const day of days) {
    assert.equal(day.readingMinutes, 10, `Day ${day.n} should target ten minutes`);
    assert.ok(Array.isArray(day.keywords) && day.keywords.length >= 4, `Day ${day.n} needs keyword definitions`);
    assert.ok(typeof day.recap === 'string' && day.recap.length > 40, `Day ${day.n} needs a bridge from the previous day`);
    assert.ok(typeof day.nextPreview === 'string' && day.nextPreview.length > 40, `Day ${day.n} needs a bridge to the next day`);
    assert.ok(day.lesson.length >= 6, `Day ${day.n} needs detailed reading sections`);

    const html = fs.readFileSync(`day${String(day.n).padStart(2, '0')}.html`, 'utf8');
    assert.match(html, /<table class="keyword-table">[\s\S]+<\/table>/, `Day ${day.n} needs a keyword table`);
    assert.ok(html.includes('承上：回顾与定位'), `Day ${day.n} needs a previous-day bridge`);
    assert.ok(html.includes('启下：下一章如何使用本章能力'), `Day ${day.n} needs a next-day bridge`);
    assert.ok((html.match(/[\u4e00-\u9fff]/g) || []).length >= 1600, `Day ${day.n} needs ten-minute reading depth`);
  }
});
