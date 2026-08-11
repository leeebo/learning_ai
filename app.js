(() => {
  "use strict";

  const decodePayload = value => JSON.parse(decodeURIComponent(value));
  const ui = document.body.dataset.ui ? decodePayload(document.body.dataset.ui) : {};
  const STORAGE_KEY = "learning-ai-progress-v1";
  const ARCHIVE_FORMAT = "learning-ai-progress";
  const MAX_ARCHIVE_BYTES = 6_000_000;
  const TOTAL_DAYS = Number(document.body.dataset.totalDays) || 15;

  const emptyLearningState = () => ({ version: 1, profileName: "", lastDay: null, streak: { count: 0, lastDate: null }, days: {} });
  const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const validDay = value => Number.isInteger(value) && value >= 1 && value <= TOTAL_DAYS;

  const normalizeLearningState = input => {
    if (!isObject(input) || input.version !== 1 || !isObject(input.days) || !isObject(input.streak)) {
      throw new TypeError("Invalid learning state");
    }

    const normalized = emptyLearningState();
    if (input.profileName !== undefined && typeof input.profileName !== "string") throw new TypeError("Invalid profile name");
    normalized.profileName = String(input.profileName || "").slice(0, 80);
    if (input.lastDay !== null && input.lastDay !== undefined && !validDay(input.lastDay)) throw new TypeError("Invalid last day");
    normalized.lastDay = validDay(input.lastDay) ? input.lastDay : null;

    const streakCount = input.streak.count ?? 0;
    if (typeof streakCount !== "number" || !Number.isInteger(streakCount) || streakCount < 0) throw new TypeError("Invalid streak");
    if (input.streak.lastDate !== null && input.streak.lastDate !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(input.streak.lastDate)) {
      throw new TypeError("Invalid streak date");
    }
    normalized.streak = { count: streakCount, lastDate: input.streak.lastDate || null };

    Object.entries(input.days).forEach(([key, value]) => {
      const dayNumber = Number(key);
      if (!/^\d+$/.test(key) || !validDay(dayNumber) || !isObject(value)) throw new TypeError("Invalid chapter state");
      const scroll = value.scroll ?? 0;
      const bestScore = value.bestScore ?? 0;
      const completed = value.completed ?? false;
      if (typeof scroll !== "number" || !Number.isFinite(scroll) || scroll < 0 || scroll > 1) throw new TypeError("Invalid reading position");
      if (typeof bestScore !== "number" || !Number.isInteger(bestScore) || bestScore < 0 || bestScore > 3) throw new TypeError("Invalid quiz score");
      if (typeof completed !== "boolean" || (completed && bestScore !== 3)) throw new TypeError("Invalid completion state");
      if (value.wrong !== undefined && (!Array.isArray(value.wrong) || value.wrong.some(index => !Number.isInteger(index) || index < 0 || index > 2))) {
        throw new TypeError("Invalid mistake list");
      }
      if (value.notes !== undefined && typeof value.notes !== "string") throw new TypeError("Invalid notes");
      for (const field of ["visitedAt", "completedAt"]) {
        if (value[field] !== undefined && value[field] !== null && typeof value[field] !== "string") throw new TypeError(`Invalid ${field}`);
      }
      normalized.days[key] = {
        visitedAt: value.visitedAt || null,
        completedAt: value.completedAt || null,
        scroll,
        completed,
        bestScore,
        wrong: [...new Set(value.wrong || [])],
        notes: String(value.notes || "").slice(0, 200000),
      };
    });
    return normalized;
  };

  const loadLearningState = () => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? normalizeLearningState(JSON.parse(stored)) : emptyLearningState();
    } catch {
      return emptyLearningState();
    }
  };

  let learningState = loadLearningState();

  const saveLearningState = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(learningState));
      return true;
    } catch {
      return false;
    }
  };

  const ensureDayState = dayNumber => {
    const key = String(dayNumber);
    learningState.days[key] ??= { visitedAt: null, completedAt: null, scroll: 0, completed: false, bestScore: 0, wrong: [], notes: "" };
    const dayState = learningState.days[key];
    dayState.visitedAt ??= null;
    dayState.completedAt ??= null;
    dayState.scroll = Number(dayState.scroll) || 0;
    dayState.completed = Boolean(dayState.completed);
    dayState.bestScore = Number(dayState.bestScore) || 0;
    if (!Array.isArray(dayState.wrong)) dayState.wrong = [];
    if (typeof dayState.notes !== "string") dayState.notes = "";
    return dayState;
  };

  const localDateKey = date => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");

  const updateStreak = () => {
    const today = localDateKey(new Date());
    if (learningState.streak.lastDate === today) return;
    const previous = learningState.streak.lastDate ? new Date(`${learningState.streak.lastDate}T00:00:00`) : null;
    const elapsedDays = previous ? Math.round((new Date(`${today}T00:00:00`) - previous) / 86400000) : null;
    learningState.streak.count = elapsedDays === 1 ? learningState.streak.count + 1 : 1;
    learningState.streak.lastDate = today;
  };

  const recordVisit = dayNumber => {
    const dayState = ensureDayState(dayNumber);
    dayState.visitedAt = new Date().toISOString();
    learningState.lastDay = dayNumber;
    updateStreak();
    saveLearningState();
  };

  const recordQuiz = (dayNumber, score, correct) => {
    const dayState = ensureDayState(dayNumber);
    dayState.bestScore = Math.max(dayState.bestScore || 0, score);
    dayState.wrong = correct.map((isCorrect, index) => isCorrect ? null : index).filter(index => index !== null);
    if (correct.every(Boolean)) {
      dayState.completed = true;
      dayState.completedAt ||= new Date().toISOString();
    }
    saveLearningState();
  };

  const downloadFile = (content, type, filename) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const download = document.createElement("a");
    download.href = url;
    download.download = filename;
    document.body.append(download);
    download.click();
    download.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  function bindQuiz(form) {
    if (form.dataset.bound === "true") return;
    form.dataset.bound = "true";

    const quiz = decodePayload(form.dataset.quizPayload);
    const feedback = form.querySelector(".quiz-feedback");
    const retry = form.querySelector(".retry-quiz");
    const submit = form.querySelector('button[type="submit"]');
    const rewardRoot = form.querySelector("[data-chapter-reward]");
    const rewardPool = rewardRoot ? decodePayload(rewardRoot.dataset.rewardPayload) : [];
    const dayNumber = Number(form.closest("[data-day]")?.dataset.day);
    let previousRewardIndex = -1;

    const hideReward = () => {
      if (!rewardRoot) return;
      rewardRoot.hidden = true;
      rewardRoot.classList.remove("is-visible");
    };

    const showReward = () => {
      if (!rewardRoot || !rewardPool.length) return;
      let rewardIndex = Math.floor(Math.random() * rewardPool.length);
      if (rewardPool.length > 1 && rewardIndex === previousRewardIndex) {
        rewardIndex = (rewardIndex + 1 + Math.floor(Math.random() * (rewardPool.length - 1))) % rewardPool.length;
      }
      previousRewardIndex = rewardIndex;
      const reward = rewardPool[rewardIndex];
      rewardRoot.querySelector("[data-reward-icon]").textContent = reward.icon;
      rewardRoot.querySelector("[data-reward-title]").textContent = reward.title;
      rewardRoot.querySelector("[data-reward-message]").textContent = reward.message;
      rewardRoot.dataset.variant = String(rewardIndex + 1);
      rewardRoot.hidden = false;
      rewardRoot.classList.add("is-visible");
      rewardRoot.focus({ preventScroll: true });
    };

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
      if (dayNumber) recordQuiz(dayNumber, score, correct);
      if (score === quiz.length) showReward();
      else hideReward();
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
      hideReward();
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

  function bindLearningArchive(root) {
    const archiveRoot = root.querySelector("[data-learning-archive]");
    if (!archiveRoot) return;
    const status = archiveRoot.querySelector("[data-archive-status]");
    const importInput = archiveRoot.querySelector("[data-import-progress]");

    archiveRoot.querySelector("[data-export-progress]").addEventListener("click", () => {
      const archive = {
        format: ARCHIVE_FORMAT,
        formatVersion: 1,
        courseDays: TOTAL_DAYS,
        exportedAt: new Date().toISOString(),
        state: learningState,
      };
      downloadFile(`${JSON.stringify(archive, null, 2)}\n`, "application/json;charset=utf-8", `learning-ai-progress-${localDateKey(new Date())}.json`);
      status.textContent = ui.progressExported;
    });

    importInput.addEventListener("change", async () => {
      const file = importInput.files?.[0];
      if (!file) return;
      try {
        if (file.size > MAX_ARCHIVE_BYTES) throw new TypeError("Archive is too large");
        const archive = JSON.parse(await file.text());
        if (!isObject(archive) || archive.format !== ARCHIVE_FORMAT || archive.formatVersion !== 1 || archive.courseDays !== TOTAL_DAYS) {
          throw new TypeError("Invalid archive envelope");
        }
        const imported = normalizeLearningState(archive.state);
        learningState = imported;
        if (!saveLearningState()) throw new TypeError("Storage is unavailable");
        status.textContent = ui.progressImported;
        window.setTimeout(() => window.location.reload(), 700);
      } catch {
        status.textContent = ui.progressImportError;
        importInput.value = "";
      }
    });

    archiveRoot.querySelector("[data-reset-progress]").addEventListener("click", () => {
      if (!window.confirm(ui.resetProgressConfirm)) return;
      try {
        window.localStorage.removeItem(STORAGE_KEY);
        learningState = emptyLearningState();
        window.location.reload();
      } catch {
        status.textContent = ui.progressImportError;
      }
    });
  }

  function bindLearningDashboard(root) {
    const cards = [...document.querySelectorAll("[data-course-card]")];
    const searchRoot = document.querySelector("[data-course-search]");
    if (!cards.length) return;

    root.hidden = false;
    if (searchRoot) searchRoot.hidden = false;

    const completedDays = cards
      .map(card => Number(card.dataset.day))
      .filter(dayNumber => ensureDayState(dayNumber).completed);
    const wrongCount = Object.values(learningState.days)
      .reduce((total, dayState) => total + (Array.isArray(dayState.wrong) ? dayState.wrong.length : 0), 0);

    root.querySelector("[data-completed-count]").textContent = `${completedDays.length} / ${cards.length}`;
    root.querySelector("[data-streak-count]").textContent = String(learningState.streak.count || 0);
    root.querySelector("[data-mistake-count]").textContent = String(wrongCount);
    root.querySelector("[data-review-count-badge]").textContent = wrongCount ? `(${wrongCount})` : "";

    const progress = root.querySelector("[data-course-progress]");
    progress.setAttribute("aria-valuenow", String(completedDays.length));
    progress.querySelector("span").style.width = `${(completedDays.length / cards.length) * 100}%`;

    cards.forEach(card => {
      const dayState = ensureDayState(Number(card.dataset.day));
      const status = card.querySelector("[data-card-status]");
      const value = dayState.completed ? ui.completedStatus : dayState.visitedAt ? ui.inProgressStatus : ui.notStartedStatus;
      card.dataset.learningStatus = dayState.completed ? "completed" : dayState.visitedAt ? "started" : "new";
      status.textContent = value;
    });

    const lastDay = Number(learningState.lastDay);
    const lastState = lastDay ? ensureDayState(lastDay) : null;
    const nextIncomplete = cards.find(card => !ensureDayState(Number(card.dataset.day)).completed);
    const continueDay = lastDay && lastState && !lastState.completed
      ? lastDay
      : Number(nextIncomplete?.dataset.day || cards.at(-1).dataset.day);
    const continueCard = cards.find(card => Number(card.dataset.day) === continueDay) || cards[0];
    const continueLink = root.querySelector("[data-continue-learning]");
    continueLink.href = `${continueCard.href}${continueCard.href.includes("?") ? "&" : "?"}resume=1`;
    continueLink.textContent = `${ui.continueLearning} · ${continueCard.querySelector(".tag").textContent}`;

    root.querySelectorAll("[data-badge-days]").forEach(badge => {
      const [start, end] = badge.dataset.badgeDays.split("-").map(Number);
      const earned = Array.from({ length: end - start + 1 }, (_, index) => start + index).every(dayNumber => ensureDayState(dayNumber).completed);
      badge.classList.toggle("is-earned", earned);
      badge.setAttribute("aria-label", `${badge.querySelector("strong").textContent}: ${earned ? ui.completedStatus : ui.notStartedStatus}`);
    });
    root.querySelectorAll("[data-badge-streak]").forEach(badge => {
      const earned = learningState.streak.count >= Number(badge.dataset.badgeStreak);
      badge.classList.toggle("is-earned", earned);
      badge.setAttribute("aria-label", `${badge.querySelector("strong").textContent}: ${earned ? ui.completedStatus : ui.notStartedStatus}`);
    });

    if (searchRoot) {
      const input = searchRoot.querySelector("[data-course-search-input]");
      const status = searchRoot.querySelector("[data-search-status]");
      const renderSearch = () => {
        const terms = input.value.normalize("NFKC").trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
        let visible = 0;
        cards.forEach(card => {
          const haystack = card.textContent.normalize("NFKC").toLocaleLowerCase();
          const match = terms.every(term => haystack.includes(term));
          card.hidden = !match;
          if (match) visible += 1;
        });
        status.textContent = ui.searchResults.replace("{count}", String(visible));
      };
      input.addEventListener("input", renderSearch);
      searchRoot.querySelector("[data-clear-search]").addEventListener("click", () => {
        input.value = "";
        renderSearch();
        input.focus();
      });
      renderSearch();
    }
    bindLearningArchive(root);
  }

  function bindChapterProgress(article) {
    const dayNumber = Number(article.dataset.day);
    if (!dayNumber) return;
    const dayState = ensureDayState(dayNumber);
    const savedScroll = Math.max(0, Math.min(1, Number(dayState.scroll) || 0));
    const progress = document.querySelector("[data-reading-progress]");
    const resume = article.querySelector("[data-resume-reading]");
    const sectionLinks = [...article.querySelectorAll('.section-nav a[href^="#"]')];
    let persistTimer = null;

    recordVisit(dayNumber);
    document.querySelectorAll(".toc a").forEach(link => {
      const match = link.getAttribute("href")?.match(/day(\d{2})\.html/);
      if (match && ensureDayState(Number(match[1])).completed) link.classList.add("is-completed");
    });

    const scrollRange = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const scrollToSaved = () => {
      const reduceMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: savedScroll * scrollRange(), behavior: reduceMotion ? "auto" : "smooth" });
      resume.hidden = true;
    };

    if (savedScroll > 0.08 && savedScroll < 0.95) {
      resume.querySelector("[data-resume-label]").textContent = ui.resumeAt.replace("{percent}", String(Math.round(savedScroll * 100)));
      resume.hidden = false;
      resume.querySelector("[data-resume-button]").addEventListener("click", scrollToSaved);
      resume.querySelector("[data-resume-dismiss]").addEventListener("click", () => { resume.hidden = true; });
    }

    if (new URLSearchParams(window.location.search).get("resume") === "1" && savedScroll > 0.02) {
      window.requestAnimationFrame(scrollToSaved);
    }

    const updateProgress = (persist = false) => {
      const ratio = Math.max(0, Math.min(1, window.scrollY / scrollRange()));
      const percent = Math.round(ratio * 100);
      progress?.setAttribute("aria-valuenow", String(percent));
      if (progress) progress.querySelector("span").style.width = `${percent}%`;
      if (persist) {
        window.clearTimeout(persistTimer);
        persistTimer = window.setTimeout(() => {
          ensureDayState(dayNumber).scroll = ratio;
          saveLearningState();
        }, 250);
      }
    };
    window.addEventListener("scroll", () => updateProgress(true), { passive: true });
    window.addEventListener("resize", () => updateProgress(false));
    updateProgress();

    if (typeof IntersectionObserver === "function" && sectionLinks.length) {
      const byId = new Map(sectionLinks.map(link => [link.hash.slice(1), link]));
      const observer = new IntersectionObserver(entries => {
        const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!visible) return;
        sectionLinks.forEach(link => link.classList.toggle("is-current", link === byId.get(visible.target.id)));
      }, { rootMargin: "-15% 0px -72%", threshold: 0 });
      byId.forEach((_, id) => {
        const section = document.getElementById(id);
        if (section) observer.observe(section);
      });
    }
  }

  function bindLabNotes(root) {
    const payload = decodePayload(root.dataset.labPayload);
    const dayState = ensureDayState(payload.n);
    const input = root.querySelector("[data-lab-notes-input]");
    const status = root.querySelector("[data-notes-status]");
    input.value = dayState.notes || ui.notesTemplate;

    root.querySelector("[data-save-notes]").addEventListener("click", () => {
      ensureDayState(payload.n).notes = input.value;
      status.textContent = saveLearningState() ? ui.notesSaved : ui.notesError;
    });

    root.querySelector("[data-export-notes]").addEventListener("click", () => {
      try {
        ensureDayState(payload.n).notes = input.value;
        saveLearningState();
        const dayLabel = document.querySelector(".content > .eyebrow")?.textContent.trim() || String(payload.n);
        const markdown = `# ${dayLabel} · ${payload.title} — ${ui.notesMarkdownTitle}\n\n## ${ui.notesMarkdownLab}\n\n${payload.lab}\n\n## ${ui.notesMarkdownNotes}\n\n${input.value || "—"}\n\n---\n${ui.notesMarkdownSaved}: ${new Date().toISOString()}\n`;
        downloadFile(markdown, "text/markdown;charset=utf-8", `learning-ai-day${String(payload.n).padStart(2, "0")}-notes.md`);
        status.textContent = ui.notesExported;
      } catch {
        status.textContent = ui.notesError;
      }
    });
  }

  function bindReviewPage(root) {
    const form = root.querySelector("[data-review-form]");
    const empty = root.querySelector("[data-review-empty]");
    const items = [...root.querySelectorAll("[data-review-item]")];
    const visible = items.filter(item => ensureDayState(Number(item.dataset.day)).wrong.includes(Number(item.dataset.questionIndex)));
    items.forEach(item => { item.hidden = !visible.includes(item); });

    if (!visible.length) {
      empty.hidden = false;
      form.hidden = true;
      return;
    }

    empty.hidden = true;
    form.hidden = false;
    form.querySelector("[data-review-total]").textContent = ui.reviewCount.replace("{count}", String(visible.length));
    const feedback = form.querySelector("[data-review-feedback]");

    form.addEventListener("submit", event => {
      event.preventDefault();
      const choices = visible.map(item => item.querySelector("input:checked"));
      const missing = choices.findIndex(choice => !choice);
      if (missing !== -1) {
        feedback.textContent = ui.reviewIncomplete;
        visible[missing].querySelector("input").focus();
        return;
      }

      let score = 0;
      visible.forEach((item, index) => {
        const question = decodePayload(item.dataset.reviewPayload);
        const correct = Number(choices[index].value) === question.answer;
        const explanation = item.querySelector(".answer-explanation");
        const heading = document.createElement("strong");
        const detail = document.createElement("p");
        item.classList.toggle("is-correct", correct);
        item.classList.toggle("is-incorrect", !correct);
        heading.textContent = `${correct ? ui.correct : ui.incorrect} ${ui.correctAnswer} ${question.options[question.answer]}`;
        detail.textContent = question.explanation;
        explanation.replaceChildren(heading, detail);
        explanation.hidden = false;
        if (correct) {
          score += 1;
          const dayState = ensureDayState(Number(item.dataset.day));
          dayState.wrong = dayState.wrong.filter(questionIndex => questionIndex !== Number(item.dataset.questionIndex));
        }
      });
      saveLearningState();
      feedback.textContent = ui.reviewScore.replace("{score}", String(score)).replace("{count}", String(visible.length));
    });
  }

  function bindCertificatePage(root) {
    const locked = root.querySelector("[data-certificate-locked]");
    const unlocked = root.querySelector("[data-certificate-unlocked]");
    const completed = Array.from({ length: TOTAL_DAYS }, (_, index) => index + 1)
      .filter(dayNumber => ensureDayState(dayNumber).completed);

    if (completed.length !== TOTAL_DAYS) {
      locked.hidden = false;
      unlocked.hidden = true;
      locked.querySelector("[data-certificate-progress]").textContent = ui.certificateProgress
        .replace("{count}", String(completed.length))
        .replace("{total}", String(TOTAL_DAYS));
      return;
    }

    locked.hidden = true;
    unlocked.hidden = false;
    const input = unlocked.querySelector("[data-certificate-name-input]");
    const name = unlocked.querySelector("[data-certificate-name]");
    const completionDates = completed
      .map(dayNumber => ensureDayState(dayNumber).completedAt)
      .filter(Boolean)
      .map(value => new Date(value))
      .filter(value => !Number.isNaN(value.getTime()));
    const completionDate = completionDates.length
      ? new Date(Math.max(...completionDates.map(value => value.getTime())))
      : new Date();
    const locale = document.body.dataset.locale === "zh-CN" ? "zh-CN" : "en";
    unlocked.querySelector("[data-certificate-date]").textContent = new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(completionDate);

    const renderName = () => {
      learningState.profileName = input.value.trim().slice(0, 80);
      name.textContent = learningState.profileName || ui.certificateAnonymous;
      saveLearningState();
    };
    input.value = learningState.profileName || "";
    renderName();
    input.addEventListener("input", renderName);
    unlocked.querySelector("[data-print-certificate]").addEventListener("click", () => window.print());
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
  document.querySelectorAll("[data-learning-dashboard]").forEach(bindLearningDashboard);
  document.querySelectorAll(".content[data-day]").forEach(bindChapterProgress);
  document.querySelectorAll("[data-lab-notes]").forEach(bindLabNotes);
  document.querySelectorAll("[data-review-page]").forEach(bindReviewPage);
  document.querySelectorAll("[data-certificate-page]").forEach(bindCertificatePage);
  revealActiveNavigation();
})();
