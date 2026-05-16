const UI = {
  screens: {
    menu: null,
    loading: null,
    quiz: null,
    gameover: null,
    review: null,
    achievements: null,
  },

  els: {},

  init() {
    this.screens.menu = document.getElementById('screen-menu');
    this.screens.loading = document.getElementById('screen-loading');
    this.screens.quiz = document.getElementById('screen-quiz');
    this.screens.gameover = document.getElementById('screen-gameover');
    this.screens.review = document.getElementById('screen-review');
    this.screens.achievements = document.getElementById('screen-achievements');

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
      resumeBanner: document.getElementById('resume-banner'),
      btnResume: document.getElementById('btn-resume'),
      btnDismissResume: document.getElementById('btn-dismiss-resume'),
      btnReview: document.getElementById('btn-review'),
      btnAchievements: document.getElementById('btn-achievements'),
      reviewList: document.getElementById('review-list'),
      reviewSummary: document.getElementById('review-summary'),
      btnReviewBack: document.getElementById('btn-review-back'),
      achievementList: document.getElementById('achievement-list'),
      btnAchievementsBack: document.getElementById('btn-achievements-back'),
      dailyStreak: document.getElementById('daily-streak'),
      achievementToast: document.getElementById('achievement-toast'),
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
    const totalEl = document.getElementById('quiz-total');
    if (totalEl) totalEl.textContent = String(total);
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

    if (selectedIndex !== correctIndex && selectedIndex >= 0) {
      const wrongBtn = buttons[selectedIndex];
      if (wrongBtn) {
        wrongBtn.classList.add('shake');
        setTimeout(() => wrongBtn.classList.remove('shake'), 500);
      }
    }
  },

  showFeedback(type) {
    if (type === 'correct') {
      this.spawnConfetti();
    }

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

  spawnConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#a78bfa', '#fbbf24'];
    const particles = [];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 14 - 4,
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        life: 1,
      });
    }

    let frame = 0;
    const maxFrames = 60;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4;
        p.rotation += p.rotSpeed;
        p.life = Math.max(0, 1 - frame / maxFrames);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      if (frame < maxFrames) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    requestAnimationFrame(animate);
  },

  showGameOver({ title, score, best, message, won, achievementsEarned }) {
    this.els.gameoverTitle.textContent = title;
    this.els.finalScore.textContent = String(score);
    this.els.finalBest.textContent = String(best);
    this.els.gameoverMessage.textContent = message;
    this.els.gameoverIcon.textContent = won ? '★' : '✕';
    this.els.gameoverIcon.style.color = won ? 'var(--gold)' : 'var(--danger)';

    if (achievementsEarned && achievementsEarned.length > 0) {
      achievementsEarned.forEach((id, i) => {
        setTimeout(() => this.showAchievementToast(id), 800 + i * 1500);
      });
    }

    this.showScreen('gameover');
  },

  showAchievementToast(achievementId) {
    const def = ACHIEVEMENT_DEFS.find((a) => a.id === achievementId);
    if (!def) return;

    const toast = this.els.achievementToast;
    toast.querySelector('.achievement-toast__icon').textContent = def.icon;
    toast.querySelector('.achievement-toast__name').textContent = def.name;
    toast.classList.add('achievement-toast--show');

    setTimeout(() => {
      toast.classList.remove('achievement-toast--show');
    }, 3000);
  },

  showResumeBanner(show) {
    if (this.els.resumeBanner) {
      this.els.resumeBanner.hidden = !show;
    }
  },

  renderReview(answerHistory, score, maxStreak) {
    const list = this.els.reviewList;
    list.innerHTML = '';

    const correct = answerHistory.filter((a) => a.correct).length;
    const total = answerHistory.length;
    this.els.reviewSummary.textContent = `${correct}/${total} correct · Max streak: ${maxStreak} · Score: ${score}`;

    answerHistory.forEach((a, i) => {
      const item = document.createElement('div');
      item.className = 'review-item' + (a.correct ? ' review-item--correct' : ' review-item--wrong');

      const num = document.createElement('span');
      num.className = 'review-num';
      num.textContent = String(i + 1);

      const body = document.createElement('div');
      body.className = 'review-body';

      const q = document.createElement('p');
      q.className = 'review-question';
      q.textContent = a.question;

      const answers = document.createElement('div');
      answers.className = 'review-answers';

      a.choices.forEach((choice, ci) => {
        const ans = document.createElement('span');
        ans.className = 'review-answer';
        if (ci === a.correctIndex) ans.classList.add('review-answer--correct');
        if (ci === a.selectedIndex && !a.correct) ans.classList.add('review-answer--selected');
        ans.textContent = choice;
        answers.appendChild(ans);
      });

      const meta = document.createElement('p');
      meta.className = 'review-meta';
      if (a.correct) {
        meta.textContent = `+${a.points} pts · ${a.timeLeft}s left`;
      } else if (a.selectedIndex === -1) {
        meta.textContent = 'Timed out';
      } else {
        meta.textContent = 'Incorrect';
      }

      body.appendChild(q);
      body.appendChild(answers);
      body.appendChild(meta);
      item.appendChild(num);
      item.appendChild(body);
      list.appendChild(item);
    });

    this.showScreen('review');
  },

  renderAchievements() {
    const list = this.els.achievementList;
    list.innerHTML = '';
    const unlocked = Storage.getAchievements();

    ACHIEVEMENT_DEFS.forEach((def) => {
      const item = document.createElement('div');
      item.className = 'achievement-item' + (unlocked[def.id] ? ' achievement-item--unlocked' : '');

      const icon = document.createElement('span');
      icon.className = 'achievement-icon';
      icon.textContent = unlocked[def.id] ? def.icon : '🔒';

      const info = document.createElement('div');
      info.className = 'achievement-info';

      const name = document.createElement('span');
      name.className = 'achievement-name';
      name.textContent = def.name;

      const desc = document.createElement('span');
      desc.className = 'achievement-desc';
      desc.textContent = def.desc;

      info.appendChild(name);
      info.appendChild(desc);
      item.appendChild(icon);
      item.appendChild(info);
      list.appendChild(item);
    });

    this.showScreen('achievements');
  },

  updateDailyStreak(streak) {
    if (this.els.dailyStreak) {
      this.els.dailyStreak.textContent = streak > 0 ? `${streak}-day streak` : '';
    }
  },
};
