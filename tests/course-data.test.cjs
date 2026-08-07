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
