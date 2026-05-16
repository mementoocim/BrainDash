const QuizGame = {
  QUESTIONS_PER_ROUND: 10,
  MAX_LIVES: 5,
  BASE_POINTS: 100,
  MAX_TIME_BONUS: 50,

  questions: [],
  categoryId: null,
  categoryName: '',
  offline: false,
  difficulty: 'easy',
  TIMER_SECONDS: 20,
  scoreMultiplier: 1,

  questionIndex: 0,
  score: 0,
  lives: 3,
  streak: 0,
  maxStreak: 0,
  timerId: null,
  secondsLeft: 20,
  answering: false,
  answerHistory: [],
  isDaily: false,

  onUpdate: null,
  onEnd: null,
  onTimeout: null,

  start({
    questions,
    categoryId,
    categoryName,
    offline,
    difficulty,
    timerSeconds,
    scoreMultiplier,
    onUpdate,
    onEnd,
    onTimeout,
    isDaily,
    savedState,
  }) {
    this.questions = questions;
    this.categoryId = categoryId;
    this.categoryName = categoryName;
    this.offline = offline;
    this.difficulty = difficulty || 'easy';
    this.TIMER_SECONDS = timerSeconds || 20;
    this.scoreMultiplier = scoreMultiplier || 1;
    this.onUpdate = onUpdate;
    this.onEnd = onEnd;
    this.onTimeout = onTimeout;
    this.isDaily = isDaily || false;

    if (savedState) {
      this.questionIndex = savedState.questionIndex;
      this.score = savedState.score;
      this.lives = savedState.lives;
      this.streak = savedState.streak;
      this.maxStreak = savedState.maxStreak || 0;
      this.answerHistory = savedState.answerHistory || [];
    } else {
      this.questionIndex = 0;
      this.score = 0;
      this.lives = this.MAX_LIVES;
      this.streak = 0;
      this.maxStreak = 0;
      this.answerHistory = [];
    }

    this.answering = false;

    this.emitUpdate();
    this.showCurrentQuestion();
  },

  emitUpdate() {
    if (this.onUpdate) {
      this.onUpdate({
        questionIndex: this.questionIndex,
        total: this.QUESTIONS_PER_ROUND,
        score: this.score,
        lives: this.lives,
        maxLives: this.MAX_LIVES,
        secondsLeft: this.secondsLeft,
        maxSeconds: this.TIMER_SECONDS,
        categoryName: this.categoryName,
        difficulty: this.difficulty,
        offline: this.offline,
        question: this.questions[this.questionIndex],
      });
    }
  },

  clearTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  },

  startTimer() {
    this.clearTimer();
    this.secondsLeft = this.TIMER_SECONDS;
    this.emitUpdate();

    this.timerId = setInterval(() => {
      this.secondsLeft -= 1;
      this.emitUpdate();

      if (this.secondsLeft <= 3 && this.secondsLeft > 0) {
        if (typeof App !== 'undefined' && App.playSound) {
          App.playSound(440, 0.05, 'square');
        }
      }

      if (this.secondsLeft <= 0) {
        this.clearTimer();
        this.handleTimeout();
      }
    }, 1000);
  },

  showCurrentQuestion() {
    if (this.questionIndex >= this.QUESTIONS_PER_ROUND || this.lives <= 0) {
      this.finishRound();
      return;
    }

    this.answering = false;
    this.emitUpdate();
    this.startTimer();
  },

  calculatePoints() {
    const timeBonus = Math.round(
      (this.secondsLeft / this.TIMER_SECONDS) * this.MAX_TIME_BONUS
    );
    const streakMultiplier = Math.min(3, 1 + this.streak);
    const raw = (this.BASE_POINTS + timeBonus) * streakMultiplier;
    return Math.round(raw * this.scoreMultiplier);
  },

  handleAnswer(selectedIndex) {
    if (this.answering || this.secondsLeft <= 0) return null;

    this.answering = true;
    this.clearTimer();

    const question = this.questions[this.questionIndex];
    const correct = selectedIndex === question.correctIndex;
    const points = correct ? this.calculatePoints() : 0;

    if (correct) {
      this.streak += 1;
      if (this.streak > this.maxStreak) this.maxStreak = this.streak;
      this.score += points;
    } else {
      this.streak = 0;
      this.lives -= 1;
    }

    this.answerHistory.push({
      question: question.question,
      choices: question.choices,
      correctIndex: question.correctIndex,
      selectedIndex,
      correct,
      points,
      category: question.category,
      difficulty: question.difficulty,
      timeLeft: this.secondsLeft,
    });

    this.saveProgress();
    this.emitUpdate();

    return {
      correct,
      correctIndex: question.correctIndex,
      selectedIndex,
    };
  },

  handleTimeout() {
    if (this.answering) return;
    this.answering = true;
    this.streak = 0;
    this.lives -= 1;

    const question = this.questions[this.questionIndex];

    this.answerHistory.push({
      question: question.question,
      choices: question.choices,
      correctIndex: question.correctIndex,
      selectedIndex: -1,
      correct: false,
      points: 0,
      category: question.category,
      difficulty: question.difficulty,
      timeLeft: 0,
    });

    this.saveProgress();
    this.emitUpdate();

    const result = {
      correct: false,
      correctIndex: question.correctIndex,
      selectedIndex: -1,
    };

    if (this.onTimeout) {
      this.onTimeout(result);
    }
  },

  advanceAfterFeedback() {
    this.questionIndex += 1;

    if (this.lives <= 0) {
      this.finishRound(false);
      return;
    }

    if (this.questionIndex >= this.QUESTIONS_PER_ROUND) {
      this.finishRound(true);
      return;
    }

    this.showCurrentQuestion();
  },

  finishRound(won = null) {
    this.clearTimer();
    const didWin =
      won ?? (this.lives > 0 && this.questionIndex >= this.QUESTIONS_PER_ROUND);

    Storage.clearGameState();
    Storage.incrementRoundsPlayed();

    if (this.categoryId != null) {
      Storage.trackCategoryPlayed(this.categoryId);
    }

    const earned = this.checkAchievements(didWin);

    if (this.isDaily && didWin) {
      const todayStr = new Date().toISOString().slice(0, 10);
      Storage.setDailyDone(todayStr);
    }

    if (this.onEnd) {
      this.onEnd({
        score: this.score,
        won: didWin,
        lives: this.lives,
        categoryId: this.categoryId,
        categoryName: this.categoryName,
        difficulty: this.difficulty,
        answerHistory: this.answerHistory,
        maxStreak: this.maxStreak,
        isDaily: this.isDaily,
        achievementsEarned: earned,
      });
    }
  },

  checkAchievements(won) {
    const earned = [];

    if (won && this.lives === this.MAX_LIVES) {
      if (Storage.unlockAchievement('perfect')) earned.push('perfect');
    }

    if (this.answerHistory.length === this.QUESTIONS_PER_ROUND) {
      const allFast = this.answerHistory.every((a) => a.timeLeft >= 10);
      if (allFast && won) {
        if (Storage.unlockAchievement('speed_demon')) earned.push('speed_demon');
      }
    }

    if (this.maxStreak >= 10) {
      if (Storage.unlockAchievement('streak_master')) earned.push('streak_master');
    }

    if (won && this.difficulty === 'hard') {
      if (Storage.unlockAchievement('hard_winner')) earned.push('hard_winner');
    }

    if (this.score >= 2000) {
      if (Storage.unlockAchievement('high_scorer')) earned.push('high_scorer');
    }

    const rounds = Storage.getRoundsPlayed();
    if (rounds >= 100) {
      if (Storage.unlockAchievement('centurion')) earned.push('centurion');
    }

    const cats = this.categoryId != null ? Storage.trackCategoryPlayed(this.categoryId) : [];
    if (cats.length >= 4) {
      if (Storage.unlockAchievement('scholar')) earned.push('scholar');
    }

    const daily = Storage.getDailyDone();
    if (daily.streak >= 7) {
      if (Storage.unlockAchievement('daily_warrior')) earned.push('daily_warrior');
    }

    return earned;
  },

  saveProgress() {
    Storage.saveGameState({
      questions: this.questions,
      categoryId: this.categoryId,
      categoryName: this.categoryName,
      offline: this.offline,
      difficulty: this.difficulty,
      timerSeconds: this.TIMER_SECONDS,
      scoreMultiplier: this.scoreMultiplier,
      questionIndex: this.questionIndex,
      score: this.score,
      lives: this.lives,
      streak: this.streak,
      maxStreak: this.maxStreak,
      answerHistory: this.answerHistory,
      isDaily: this.isDaily,
    });
  },

  destroy() {
    this.clearTimer();
    this.onUpdate = null;
    this.onEnd = null;
    this.onTimeout = null;
  },
};
