const App = {
  lastCategoryId: null,
  lastCategoryName: 'Mixed',
  lastRenderedIndex: -1,
  audioCtx: null,

  init() {
    UI.init();
    document.body.classList.add('body--landing');
    this.bindEvents();
    this.initDifficulty();
    this.refreshMenu();
    this.loadCategories();
    OpenTDB.requestToken();
    this.checkResume();
    this.updateDailyStreak();
  },

  getDifficulty() {
    return Storage.getDifficulty();
  },

  getDifficultyConfig() {
    return Storage.getDifficultyConfig(this.getDifficulty());
  },

  initDifficulty() {
    const level = this.getDifficulty();
    UI.setDifficultyUI(level);

    UI.els.difficultyPicker.querySelectorAll('.difficulty-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const diff = btn.dataset.difficulty;
        Storage.setDifficulty(diff);
        UI.setDifficultyUI(diff);
      });
    });
  },

  bindEvents() {
    document.getElementById('btn-start-playing').addEventListener('click', () => {
      this.showBrowseScreen();
    });

    document.getElementById('btn-back-hero').addEventListener('click', () => {
      this.showHeroScreen();
    });

    document.getElementById('btn-play-mixed').addEventListener('click', () => {
      this.startRound(null, 'Mixed');
    });

    document.getElementById('btn-play-again').addEventListener('click', () => {
      this.startRound(this.lastCategoryId, this.lastCategoryName);
    });

    document.getElementById('btn-back-menu').addEventListener('click', () => {
      QuizGame.destroy();
      this.lastRenderedIndex = -1;
      this.refreshMenu();
      this.setLandingMode(true);
      this.showBrowseScreen();
      UI.showScreen('menu');
    });

    document.getElementById('btn-daily').addEventListener('click', () => {
      this.startDailyChallenge();
    });

    if (UI.els.btnResume) {
      UI.els.btnResume.addEventListener('click', () => this.resumeGame());
    }
    if (UI.els.btnDismissResume) {
      UI.els.btnDismissResume.addEventListener('click', () => {
        Storage.clearGameState();
        UI.showResumeBanner(false);
      });
    }
    if (UI.els.btnReview) {
      UI.els.btnReview.addEventListener('click', () => {
        if (this._lastAnswerHistory) {
          UI.renderReview(this._lastAnswerHistory, this._lastScore, this._lastMaxStreak);
        }
      });
    }
    if (UI.els.btnReviewBack) {
      UI.els.btnReviewBack.addEventListener('click', () => UI.showScreen('gameover'));
    }
    if (UI.els.btnAchievements) {
      UI.els.btnAchievements.addEventListener('click', () => UI.renderAchievements());
    }
    if (UI.els.btnAchievementsBack) {
      UI.els.btnAchievementsBack.addEventListener('click', () => {
        this.setLandingMode(true);
        this.showBrowseScreen();
        UI.showScreen('menu');
      });
    }

    const btnAchMain = document.getElementById('btn-achievements-main');
    if (btnAchMain) {
      btnAchMain.addEventListener('click', () => UI.renderAchievements());
    }

    UI.els.soundToggle.checked = Storage.getSoundEnabled();
    UI.els.soundToggle.addEventListener('change', (e) => {
      Storage.setSoundEnabled(e.target.checked);
    });
  },

  checkResume() {
    const saved = Storage.getGameState();
    if (saved && saved.questionIndex < saved.questions.length && saved.lives > 0) {
      UI.showResumeBanner(true);
    }
  },

  resumeGame() {
    const saved = Storage.getGameState();
    if (!saved) return;

    UI.showResumeBanner(false);
    const config = Storage.getDifficultyConfig(saved.difficulty);

    this.lastCategoryId = saved.categoryId;
    this.lastCategoryName = saved.categoryName;
    this.lastRenderedIndex = -1;

    QuizGame.destroy();
    this.setLandingMode(false);
    UI.setLoadingMeta({ categoryName: saved.categoryName, difficulty: saved.difficulty });
    UI.showScreen('loading');

    UI.showScreen('quiz');
    UI.setQuizMeta({
      categoryName: saved.categoryName,
      difficulty: saved.difficulty,
      offline: saved.offline,
    });

    QuizGame.start({
      questions: saved.questions,
      categoryId: saved.categoryId,
      categoryName: saved.categoryName,
      offline: saved.offline,
      difficulty: saved.difficulty,
      timerSeconds: config.timer,
      scoreMultiplier: config.scoreMultiplier,
      savedState: saved,
      onUpdate: (state) => this.onQuizUpdate(state),
      onEnd: (result) => this.onQuizEnd(result),
      onTimeout: (result) => this.processResult(result),
    });
  },

  updateDailyStreak() {
    const daily = Storage.getDailyDone();
    UI.updateDailyStreak(daily.streak);
  },

  showBrowseScreen() {
    const menu = document.getElementById('screen-menu');
    const panel = document.getElementById('landing-options');
    menu.classList.add('menu-step--browse');
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  showHeroScreen() {
    const menu = document.getElementById('screen-menu');
    const panel = document.getElementById('landing-options');
    menu.classList.remove('menu-step--browse');
    panel.hidden = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  setLandingMode(on) {
    document.body.classList.toggle('body--landing', on);
  },

  refreshMenu() {
    UI.setMenuBestScore(Storage.getBestScore());
  },

  async loadCategories() {
    UI.showCategoryLoading(true);
    try {
      const categories = await OpenTDB.fetchCategories();
      if (categories.length === 0) throw new Error('No categories');
      UI.renderCategories(categories, (id, name) => this.startRound(id, name));
    } catch {
      const fallback = [
        { id: 9, name: 'General Knowledge' },
        { id: 17, name: 'Science & Nature' },
        { id: 18, name: 'Computers' },
        { id: 23, name: 'History' },
      ];
      UI.renderCategories(fallback, (id, name) => this.startRound(id, name));
      UI.els.categoryLoading.hidden = true;
    }
  },

  async startRound(categoryId, categoryName) {
    const difficulty = this.getDifficulty();
    const config = Storage.getDifficultyConfig(difficulty);

    this.lastCategoryId = categoryId;
    this.lastCategoryName = categoryName;
    this.lastRenderedIndex = -1;

    QuizGame.destroy();
    Storage.clearGameState();
    this.setLandingMode(false);
    UI.setLoadingMeta({ categoryName, difficulty });
    UI.showScreen('loading');

    const { questions, offline } = await OpenTDB.loadRound(
      categoryId,
      categoryName,
      difficulty
    );

    UI.showScreen('quiz');
    UI.setQuizMeta({ categoryName, difficulty, offline });

    QuizGame.start({
      questions,
      categoryId,
      categoryName,
      offline,
      difficulty,
      timerSeconds: config.timer,
      scoreMultiplier: config.scoreMultiplier,
      onUpdate: (state) => this.onQuizUpdate(state),
      onEnd: (result) => this.onQuizEnd(result),
      onTimeout: (result) => this.processResult(result),
    });
  },

  async startDailyChallenge() {
    const difficulty = 'medium';
    const config = Storage.getDifficultyConfig(difficulty);

    this.lastCategoryId = null;
    this.lastCategoryName = 'Daily Challenge';
    this.lastRenderedIndex = -1;

    QuizGame.destroy();
    Storage.clearGameState();
    this.setLandingMode(false);
    UI.setLoadingMeta({ categoryName: 'Daily Challenge', difficulty });
    UI.showScreen('loading');

    const { questions, offline, categoryName } = await OpenTDB.fetchDailyQuestion();

    UI.showScreen('quiz');
    UI.setQuizMeta({ categoryName, difficulty, offline });

    QuizGame.start({
      questions,
      categoryId: null,
      categoryName,
      offline,
      difficulty,
      timerSeconds: config.timer,
      scoreMultiplier: config.scoreMultiplier,
      isDaily: true,
      onUpdate: (state) => this.onQuizUpdate(state),
      onEnd: (result) => this.onQuizEnd(result),
      onTimeout: (result) => this.processResult(result),
    });
  },

  onQuizUpdate(state) {
    UI.updateHud({
      questionIndex: state.questionIndex,
      total: state.total,
      score: state.score,
      lives: state.lives,
      maxLives: QuizGame.MAX_LIVES,
    });
    UI.updateTimer(state.secondsLeft, state.maxSeconds);

    if (state.question && state.questionIndex !== this.lastRenderedIndex) {
      this.lastRenderedIndex = state.questionIndex;
      UI.renderQuestion(state.question, (index) => this.onAnswer(index));
    }
  },

  async onAnswer(selectedIndex) {
    const result = QuizGame.handleAnswer(selectedIndex);
    if (!result) return;
    await this.processResult(result);
  },

  async processResult(result) {
    if (result.correct) {
      const streak = QuizGame.streak;
      if (streak >= 3 && streak % 3 === 0) {
        this.playSound(1047, 0.15, 'triangle');
      } else {
        this.playSound(880, 0.08, 'sine');
      }
    } else {
      this.playSound(220, 0.12, 'sawtooth');
    }

    UI.lockAnswers(result.correctIndex, result.selectedIndex);
    await UI.showFeedback(result.correct ? 'correct' : 'wrong');
    QuizGame.advanceAfterFeedback();
  },

  onQuizEnd({ score, won, lives, answerHistory, maxStreak, achievementsEarned, isDaily }) {
    const best = Storage.setBestScore(score);

    this._lastAnswerHistory = answerHistory;
    this._lastScore = score;
    this._lastMaxStreak = maxStreak;

    this.refreshMenu();

    let title = 'Round Complete';
    let message = 'You finished all 10 questions!';

    if (!won) {
      title = 'Game Over';
      message = lives <= 0 ? 'You ran out of lives.' : 'Better luck next time!';
    } else if (score === best && score > 0) {
      message = 'New best score!';
    }

    if (isDaily && won) {
      this.playSound(1047, 0.3, 'triangle');
      this.updateDailyStreak();
    }

    if (won) {
      this.playSound(523, 0.1, 'sine');
      setTimeout(() => this.playSound(659, 0.1, 'sine'), 100);
      setTimeout(() => this.playSound(784, 0.15, 'sine'), 200);
    } else {
      this.playSound(220, 0.2, 'sawtooth');
      setTimeout(() => this.playSound(196, 0.3, 'sawtooth'), 150);
    }

    UI.showGameOver({
      title,
      score,
      best,
      message,
      won,
      achievementsEarned: achievementsEarned || [],
    });
  },

  playSound(freq, duration, type = 'sine') {
    if (!Storage.getSoundEnabled()) return;

    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      /* audio optional */
    }
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
