const StorageKeys = {
  BEST: 'brainDash_best',
  SOUND: 'brainDash_sound',
  DIFFICULTY: 'brainDash_difficulty',
  GAME_STATE: 'brainDash_gameState',
  ACHIEVEMENTS: 'brainDash_achievements',
  DAILY_DONE: 'brainDash_dailyDone',
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

const ACHIEVEMENT_DEFS = [
  { id: 'perfect', name: 'Perfect Round', icon: '🏆', desc: 'Complete a round without losing any lives' },
  { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', desc: 'Answer all questions with 10+ seconds remaining' },
  { id: 'streak_master', name: 'Streak Master', icon: '🔥', desc: 'Get a 10-answer streak in a single round' },
  { id: 'daily_warrior', name: 'Daily Warrior', icon: '📅', desc: 'Complete 7 daily challenges' },
  { id: 'scholar', name: 'Scholar', icon: '📚', desc: 'Play all 4 categories' },
  { id: 'hard_winner', name: 'Unstoppable', icon: '💎', desc: 'Win a round on Hard difficulty' },
  { id: 'high_scorer', name: 'High Scorer', icon: '⭐', desc: 'Score 2000+ points in a single round' },
  { id: 'centurion', name: 'Centurion', icon: '🛡️', desc: 'Play 100 total rounds' },
];

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

  saveGameState(state) {
    try {
      localStorage.setItem(StorageKeys.GAME_STATE, JSON.stringify(state));
    } catch { /* quota exceeded */ }
  },

  getGameState() {
    try {
      const raw = localStorage.getItem(StorageKeys.GAME_STATE);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  clearGameState() {
    localStorage.removeItem(StorageKeys.GAME_STATE);
  },

  getAchievements() {
    try {
      const raw = localStorage.getItem(StorageKeys.ACHIEVEMENTS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  unlockAchievement(id) {
    const ach = this.getAchievements();
    if (ach[id]) return false;
    ach[id] = Date.now();
    localStorage.setItem(StorageKeys.ACHIEVEMENTS, JSON.stringify(ach));
    return true;
  },

  getDailyDone() {
    try {
      const raw = localStorage.getItem(StorageKeys.DAILY_DONE);
      return raw ? JSON.parse(raw) : { date: null, streak: 0 };
    } catch {
      return { date: null, streak: 0 };
    }
  },

  setDailyDone(dateStr) {
    const data = this.getDailyDone();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);

    if (data.date === yStr) {
      data.streak += 1;
    } else if (data.date !== dateStr) {
      data.streak = 1;
    }
    data.date = dateStr;
    localStorage.setItem(StorageKeys.DAILY_DONE, JSON.stringify(data));
    return data.streak;
  },

  incrementRoundsPlayed() {
    const key = 'brainDash_roundsPlayed';
    const val = Number(localStorage.getItem(key)) || 0;
    localStorage.setItem(key, String(val + 1));
    return val + 1;
  },

  getRoundsPlayed() {
    return Number(localStorage.getItem('brainDash_roundsPlayed')) || 0;
  },

  trackCategoryPlayed(categoryId) {
    const key = 'brainDash_categoriesPlayed';
    try {
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      if (!arr.includes(categoryId)) {
        arr.push(categoryId);
        localStorage.setItem(key, JSON.stringify(arr));
      }
      return arr;
    } catch {
      return [];
    }
  },
};
