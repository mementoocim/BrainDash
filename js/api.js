const OpenTDB = {
  BASE: 'https://opentdb.com',
  token: null,

  CURATED_IDS: [9, 17, 18, 21, 22, 23],

  async requestToken() {
    const res = await fetch(`${this.BASE}/api_token.php?command=request`);
    const data = await res.json();
    if (data.response_code === 0) {
      this.token = data.token;
    }
    return this.token;
  },

  async resetToken() {
    if (!this.token) return;
    await fetch(`${this.BASE}/api_token.php?command=reset&token=${this.token}`);
    await this.requestToken();
  },

  async fetchCategories() {
    const res = await fetch(`${this.BASE}/api_category.php`);
    const data = await res.json();
    if (!data.trivia_categories) return [];

    return data.trivia_categories.filter((cat) =>
      this.CURATED_IDS.includes(cat.id)
    );
  },

  decode(value) {
    try {
      return decodeURIComponent(value.replace(/\+/g, ' '));
    } catch {
      return value;
    }
  },

  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  seededShuffle(array, seed) {
    const arr = [...array];
    let s = seed;
    for (let i = arr.length - 1; i > 0; i -= 1) {
      s = (s * 16807 + 0) % 2147483647;
      const j = s % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  dateSeed(dateStr) {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  },

  normalizeQuestion(item) {
    const question = this.decode(item.question);
    const correct = this.decode(item.correct_answer);
    const incorrect = item.incorrect_answers.map((a) => this.decode(a));
    const choices = this.shuffle([correct, ...incorrect]);
    const correctIndex = choices.indexOf(correct);

    return {
      question,
      choices,
      correctIndex,
      category: this.decode(item.category),
      difficulty: item.difficulty,
    };
  },

  async fetchQuestions({ categoryId = null, amount = 10, difficulty = 'easy' } = {}) {
    if (!this.token) {
      await this.requestToken();
    }

    const params = new URLSearchParams({
      amount: String(amount),
      type: 'multiple',
      encode: 'url3986',
      difficulty,
    });

    if (this.token) {
      params.set('token', this.token);
    }

    if (categoryId != null) {
      params.set('category', String(categoryId));
    }

    const res = await fetch(`${this.BASE}/api.php?${params.toString()}`);
    const data = await res.json();

    if (data.response_code === 4) {
      await this.resetToken();
      return this.fetchQuestions({ categoryId, amount, difficulty });
    }

    if (data.response_code !== 0 || !data.results?.length) {
      throw new Error('Failed to fetch questions from API');
    }

    return data.results.map((item) => this.normalizeQuestion(item));
  },

  async fetchFallback(difficulty = 'easy') {
    const res = await fetch('data/fallback.json');
    if (!res.ok) throw new Error('Fallback not available');
    const data = await res.json();
    return data.questions.map((q) => ({
      question: q.question,
      choices: [...q.choices],
      correctIndex: q.correctIndex,
      category: q.category || 'General',
      difficulty,
    }));
  },

  async fetchDailyQuestion() {
    const today = new Date().toISOString().slice(0, 10);
    const seed = this.dateSeed(today);

    try {
      const catIds = this.CURATED_IDS;
      const catIndex = seed % catIds.length;
      const catId = catIds[catIndex];

      const questions = await this.fetchQuestions({
        categoryId: catId,
        amount: 1,
        difficulty: 'medium',
      });

      if (questions.length > 0) {
        const q = questions[0];
        return {
          questions: [q],
          offline: false,
          categoryName: `Daily Challenge — ${q.category}`,
          isDaily: true,
        };
      }
    } catch { /* fall through */ }

    const fallback = await this.fetchFallback('medium');
    const index = seed % fallback.length;
    const q = fallback[index];
    return {
      questions: [q],
      offline: true,
      categoryName: `Daily Challenge — ${q.category}`,
      isDaily: true,
    };
  },

  async loadRound(categoryId, categoryName, difficulty = 'easy') {
    try {
      const questions = await this.fetchQuestions({
        categoryId,
        amount: 10,
        difficulty,
      });
      return { questions, offline: false, categoryName };
    } catch {
      const questions = await this.fetchFallback(difficulty);
      return {
        questions: questions.slice(0, 10),
        offline: true,
        categoryName: categoryName || 'Backup',
      };
    }
  },
};
