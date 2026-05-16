const UI = {
  screens: {
    menu: null,
    loading: null,
    quiz: null,
    gameover: null,
  },

  els: {},

  init() {
    this.screens.menu = document.getElementById('screen-menu');
    this.screens.loading = document.getElementById('screen-loading');
    this.screens.quiz = document.getElementById('screen-quiz');
    this.screens.gameover = document.getElementById('screen-gameover');

    this.els = {
      menuBestScore: document.getElementById('menu-best-score'),
      categoryList: document.getElementById('category-list'),
      categoryLoading: document.getElementById('category-loading'),
      difficultyPicker: document.getElementById('difficulty-picker'),
      difficultyHint: document.getElementById('difficulty-hint'),
      loadingCategory: document.getElementById('loading-category'),
      loadingDifficulty: document.getElementById('loading-difficulty'),
      quizProgress: document.getElementById('quiz-progress'),
      quizScore: document.getElementById('quiz-score'),
      quizLives: document.getElementById('quiz-lives'),
      timerFill: document.getElementById('timer-fill'),
      timerBar: document.querySelector('.timer-bar'),
      timerLabel: document.getElementById('timer-label'),
      quizCategoryLabel: document.getElementById('quiz-category-label'),
      quizDifficultyBadge: document.getElementById('quiz-difficulty-badge'),
      offlineNotice: document.getElementById('offline-notice'),
      quizQuestion: document.getElementById('quiz-question'),
      answerGrid: document.getElementById('answer-grid'),
      gameoverTitle: document.getElementById('gameover-title'),
      gameoverIcon: document.getElementById('gameover-icon'),
      finalScore: document.getElementById('final-score'),
      finalBest: document.getElementById('final-best'),
      gameoverMessage: document.getElementById('gameover-message'),
      feedbackFlash: document.getElementById('feedback-flash'),
      soundToggle: document.getElementById('sound-toggle'),
    };
  },

  showScreen(name) {
    Object.entries(this.screens).forEach(([key, el]) => {
      if (!el) return;
      const active = key === name;
      el.classList.toggle('screen--active', active);
      el.hidden = !active;
    });
    document.body.classList.toggle('body--landing', name === 'menu');
  },

  setMenuBestScore(score) {
    this.els.menuBestScore.textContent = String(score);
  },

  setDifficultyUI(level) {
    const config = Storage.getDifficultyConfig(level);
    this.els.difficultyPicker.querySelectorAll('.difficulty-btn').forEach((btn) => {
      const active = btn.dataset.difficulty === level;
      btn.classList.toggle('difficulty-btn--active', active);
    });
    this.els.difficultyHint.textContent = config.hint;
  },

  renderCategories(categories, onSelect) {
    const list = this.els.categoryList;
    list.innerHTML = '';
    this.els.categoryLoading.hidden = true;

    categories.forEach((cat) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'category-btn';
      btn.textContent = cat.name;
      btn.setAttribute('role', 'listitem');
      btn.addEventListener('click', () => onSelect(cat.id, cat.name));
      list.appendChild(btn);
    });
  },

  showCategoryLoading(show) {
    this.els.categoryLoading.hidden = !show;
  },

  setLoadingMeta({ categoryName, difficulty }) {
    const config = Storage.getDifficultyConfig(difficulty);
    this.els.loadingCategory.textContent = categoryName
      ? `Category: ${categoryName}`
      : '';
    this.els.loadingDifficulty.textContent = `Difficulty: ${config.label}`;
  },

  updateHud({ questionIndex, total, score, lives, maxLives }) {
    this.els.quizProgress.textContent = String(questionIndex + 1);
    this.els.quizScore.textContent = String(score);
    const hearts = '♥'.repeat(lives) + '♡'.repeat(Math.max(0, maxLives - lives));
    this.els.quizLives.textContent = hearts;
  },

  updateTimer(secondsLeft, maxSeconds) {
    const pct = Math.max(0, (secondsLeft / maxSeconds) * 100);
    this.els.timerFill.style.width = `${pct}%`;
    this.els.timerBar.setAttribute('aria-valuemax', String(maxSeconds));
    this.els.timerBar.setAttribute('aria-valuenow', String(Math.ceil(secondsLeft)));
    this.els.timerLabel.textContent = `${Math.ceil(secondsLeft)}s`;

    this.els.timerFill.classList.remove('timer-bar__fill--warning', 'timer-bar__fill--danger');
    const warnThreshold = Math.ceil(maxSeconds * 0.5);
    const dangerThreshold = Math.ceil(maxSeconds * 0.25);
    if (secondsLeft <= dangerThreshold) {
      this.els.timerFill.classList.add('timer-bar__fill--danger');
    } else if (secondsLeft <= warnThreshold) {
      this.els.timerFill.classList.add('timer-bar__fill--warning');
    }
  },

  setQuizMeta({ categoryName, difficulty, offline }) {
    const config = Storage.getDifficultyConfig(difficulty);
    this.els.quizCategoryLabel.textContent = categoryName;
    this.els.quizDifficultyBadge.textContent = config.label;
    this.els.quizDifficultyBadge.dataset.level = difficulty;
    this.els.offlineNotice.hidden = !offline;
  },

  renderQuestion(question, onAnswer) {
    this.els.quizQuestion.textContent = question.question;
    const grid = this.els.answerGrid;
    grid.innerHTML = '';

    question.choices.forEach((choice, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'answer-btn';
      btn.textContent = choice;
      btn.addEventListener('click', () => onAnswer(index));
      grid.appendChild(btn);
    });
  },

  lockAnswers(correctIndex, selectedIndex) {
    const buttons = this.els.answerGrid.querySelectorAll('.answer-btn');
    buttons.forEach((btn, i) => {
      btn.disabled = true;
      if (i === correctIndex) btn.classList.add('answer-btn--correct');
      if (i === selectedIndex && selectedIndex !== correctIndex) {
        btn.classList.add('answer-btn--wrong');
      }
    });
  },

  showFeedback(type) {
    const flash = this.els.feedbackFlash;
    flash.hidden = false;
    flash.className = 'feedback-flash feedback-flash--show';
    flash.classList.add(type === 'correct' ? 'feedback-flash--correct' : 'feedback-flash--wrong');

    return new Promise((resolve) => {
      setTimeout(() => {
        flash.hidden = true;
        flash.className = 'feedback-flash';
        resolve();
      }, 600);
    });
  },

  showGameOver({ title, score, best, message, won }) {
    this.els.gameoverTitle.textContent = title;
    this.els.finalScore.textContent = String(score);
    this.els.finalBest.textContent = String(best);
    this.els.gameoverMessage.textContent = message;
    this.els.gameoverIcon.textContent = won ? '★' : '✕';
    this.els.gameoverIcon.style.color = won ? 'var(--gold)' : 'var(--danger)';
    this.showScreen('gameover');
  },
};
