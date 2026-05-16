const StorageKeys = {
  BEST: 'brainDash_best',
  SOUND: 'brainDash_sound',
  DIFFICULTY: 'brainDash_difficulty',
};

const DIFFICULTY_CONFIG = {
  easy: {
    label: 'Easy',
    timer: 20,
    scoreMultiplier: 1,
    hint: '20 sec per question · standard scoring',
  },
  medium: {
    label: 'Medium',
    timer: 15,
    scoreMultiplier: 1.25,
    hint: '15 sec per question · 1.25× score bonus',
  },
  hard: {
    label: 'Hard',
    timer: 12,
    scoreMultiplier: 1.5,
    hint: '12 sec per question · 1.5× score bonus',
  },
};

const Storage = {
  getBestScore() {
    const value = localStorage.getItem(StorageKeys.BEST);
    const num = Number(value);
    return Number.isFinite(num) && num >= 0 ? num : 0;
  },

  setBestScore(score) {
    const current = this.getBestScore();
    if (score > current) {
      localStorage.setItem(StorageKeys.BEST, String(score));
      return score;
    }
    return current;
  },

  getSoundEnabled() {
    const value = localStorage.getItem(StorageKeys.SOUND);
    if (value === null) return true;
    return value === 'true';
  },

  setSoundEnabled(enabled) {
    localStorage.setItem(StorageKeys.SOUND, enabled ? 'true' : 'false');
  },

  getDifficulty() {
    const value = localStorage.getItem(StorageKeys.DIFFICULTY);
    if (value && DIFFICULTY_CONFIG[value]) return value;
    return 'easy';
  },

  setDifficulty(level) {
    if (DIFFICULTY_CONFIG[level]) {
      localStorage.setItem(StorageKeys.DIFFICULTY, level);
    }
  },

  getDifficultyConfig(level) {
    return DIFFICULTY_CONFIG[level] || DIFFICULTY_CONFIG.easy;
  },
};
