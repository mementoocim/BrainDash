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
  timerId: null,
  secondsLeft: 20,
  answering: false,

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

    this.questionIndex = 0;
    this.score = 0;
    this.lives = this.MAX_LIVES;
    this.streak = 0;
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

    if (correct) {
      this.streak += 1;
      this.score += this.calculatePoints();
    } else {
      this.streak = 0;
      this.lives -= 1;
    }

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

    if (this.onEnd) {
      this.onEnd({
        score: this.score,
        won: didWin,
        lives: this.lives,
        categoryId: this.categoryId,
        categoryName: this.categoryName,
        difficulty: this.difficulty,
      });
    }
  },

  destroy() {
    this.clearTimer();
    this.onUpdate = null;
    this.onEnd = null;
    this.onTimeout = null;
  },
};
