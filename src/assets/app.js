(() => {
  "use strict";

  const decodePayload = value => JSON.parse(decodeURIComponent(value));
  const ui = document.body.dataset.ui ? decodePayload(document.body.dataset.ui) : {};

  function bindQuiz(form) {
    if (form.dataset.bound === "true") return;
    form.dataset.bound = "true";

    const quiz = decodePayload(form.dataset.quizPayload);
    const feedback = form.querySelector(".quiz-feedback");
    const retry = form.querySelector(".retry-quiz");
    const submit = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", event => {
      event.preventDefault();
      const selected = quiz.map((_, index) => form.querySelector(`input[name="question-${index}"]:checked`));
      const missing = selected.findIndex(choice => !choice);

      if (missing !== -1) {
        feedback.textContent = `${ui.completeQuestion} ${missing + 1}${ui.questionSuffix}`;
        form.querySelector(`input[name="question-${missing}"]`).focus();
        return;
      }

      const correct = selected.map((choice, index) => Number(choice.value) === quiz[index].answer);
      const score = correct.filter(Boolean).length;

      selected.forEach((_, index) => {
        const question = quiz[index];
        const card = form.querySelector(`[data-question="${index}"]`);
        const explanation = card.querySelector(".answer-explanation");
        const heading = document.createElement("strong");
        const detail = document.createElement("p");

        card.classList.toggle("is-correct", correct[index]);
        card.classList.toggle("is-incorrect", !correct[index]);
        heading.textContent = `${correct[index] ? ui.correct : ui.incorrect} ${ui.correctAnswer} ${question.options[question.answer]}`;
        detail.textContent = question.explanation;
        explanation.replaceChildren(heading, detail);
        explanation.hidden = false;
      });

      feedback.textContent = `${ui.quizScore} ${score} / ${quiz.length}. ${ui.quizAdvice}`;
      submit.hidden = true;
      retry.hidden = false;
    });

    retry.addEventListener("click", () => {
      form.reset();
      feedback.textContent = "";
      form.querySelectorAll(".question-card").forEach(card => {
        card.classList.remove("is-correct", "is-incorrect");
        const explanation = card.querySelector(".answer-explanation");
        explanation.hidden = true;
        explanation.replaceChildren();
      });
      submit.hidden = false;
      retry.hidden = true;
    });
  }

  function bindProcessVisual(root) {
    const steps = [...root.querySelectorAll(".process-step")];
    if (!steps.length || root.dataset.bound === "true") return;
    root.dataset.bound = "true";

    const payloads = steps.map(step => decodePayload(step.querySelector("[data-payload]").dataset.payload));
    const counter = root.querySelector("[data-process-counter]");
    const title = root.querySelector("[data-process-title]");
    const action = root.querySelector("[data-process-action]");
    const insight = root.querySelector("[data-process-insight]");
    const progress = root.querySelector("[data-process-progress]");
    const status = root.querySelector("[data-process-status]");
    const toggle = root.querySelector("[data-process-toggle]");
    const loop = root.dataset.loop !== "false";
    const motionQuery = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
    let reduceMotion = motionQuery?.matches ?? false;
    let index = 0;
    let timer = null;
    let inView = typeof IntersectionObserver !== "function";
    let autoPlaying = !reduceMotion;

    const updateToggle = () => {
      if (reduceMotion) {
        toggle.textContent = ui.reducedMotion;
        toggle.disabled = true;
        return;
      }
      toggle.disabled = false;
      const finished = !loop && index === steps.length - 1;
      toggle.textContent = autoPlaying ? ui.pausePlayback : finished ? ui.restartPlayback : ui.resumePlayback;
    };

    const render = (nextIndex, announce = false) => {
      index = (nextIndex + steps.length) % steps.length;
      steps.forEach((step, stepIndex) => {
        step.classList.toggle("is-active", stepIndex === index);
        step.classList.toggle("is-complete", stepIndex < index);
        const button = step.querySelector("[data-process-select]");
        if (stepIndex === index) button.setAttribute("aria-current", "step");
        else button.removeAttribute("aria-current");
      });

      const payload = payloads[index];
      counter.textContent = `${ui.step} ${index + 1} / ${steps.length}`;
      title.textContent = `${payload.label} · ${payload.data}`;
      action.textContent = payload.action;
      insight.textContent = payload.insight;
      progress.style.width = `${((index + 1) / steps.length) * 100}%`;
      if (announce) status.textContent = `${ui.switchedStep} ${index + 1}: ${payload.label}. ${payload.action}`;
      updateToggle();
    };

    const clearTimer = () => {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
    };

    const schedule = () => {
      clearTimer();
      if (!autoPlaying || !inView) return;
      timer = window.setInterval(() => {
        if (!loop && index === steps.length - 1) {
          autoPlaying = false;
          clearTimer();
          updateToggle();
          return;
        }
        render(index + 1);
      }, 3200);
    };

    const pauseForInspection = nextIndex => {
      autoPlaying = false;
      clearTimer();
      render(nextIndex, true);
    };

    steps.forEach((step, stepIndex) => {
      step.querySelector("[data-process-select]").addEventListener("click", () => pauseForInspection(stepIndex));
    });
    root.querySelector("[data-process-prev]").addEventListener("click", () => pauseForInspection(index - 1));
    root.querySelector("[data-process-next]").addEventListener("click", () => pauseForInspection(index + 1));
    toggle.addEventListener("click", () => {
      if (!autoPlaying && !loop && index === steps.length - 1) render(0);
      autoPlaying = !autoPlaying;
      updateToggle();
      schedule();
    });

    if (typeof IntersectionObserver === "function") {
      const observer = new IntersectionObserver(entries => {
        inView = entries[0].isIntersecting;
        schedule();
      }, { threshold: 0.2 });
      observer.observe(root);
    }

    const handleMotionPreference = event => {
      reduceMotion = event.matches;
      if (reduceMotion) {
        autoPlaying = false;
        clearTimer();
      }
      updateToggle();
    };
    if (motionQuery) {
      if (typeof motionQuery.addEventListener === "function") motionQuery.addEventListener("change", handleMotionPreference);
      else if (typeof motionQuery.addListener === "function") motionQuery.addListener(handleMotionPreference);
    }

    const staticDiagram = root.nextElementSibling;
    if (staticDiagram?.classList.contains("static-diagram")) staticDiagram.open = false;
    render(0);
    schedule();
  }

  function revealActiveNavigation() {
    const navigation = document.querySelector(".toc");
    const active = navigation?.querySelector(".active");
    if (!active) return;

    if (navigation.scrollWidth > navigation.clientWidth) {
      navigation.scrollLeft = Math.max(0, active.offsetLeft - (navigation.clientWidth - active.offsetWidth) / 2);
    }
    if (navigation.scrollHeight > navigation.clientHeight) {
      navigation.scrollTop = Math.max(0, active.offsetTop - (navigation.clientHeight - active.offsetHeight) / 2);
    }
  }

  document.querySelectorAll(".quiz-form").forEach(bindQuiz);
  document.querySelectorAll("[data-process-visual]").forEach(bindProcessVisual);
  revealActiveNavigation();
})();
