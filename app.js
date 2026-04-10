// ============================================================
// TOEIC Practice App - Main Application Logic
// ============================================================

let allQuestions = [];
let quizQuestions = [];
let currentIndex = 0;
let answers = []; // { questionId, selectedIndex, isCorrect, timeSpent }
let questionStartTime = null;
let lastAnswer = null;
let currentFilter = null;

const PART_INFO = {
  'Part 5': { title: 'Part 5: 短文穴埋め', icon: '📝' },
  'Part 6': { title: 'Part 6: 長文穴埋め', icon: '📄' },
  'Part 7': { title: 'Part 7: 読解問題', icon: '📖' },
};

const DIFFICULTY_LABELS = {
  easy: '初級', medium: '中級', hard: '上級'
};

// ============================================================
// Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  await loadQuestions();
  renderHome();
});

async function loadQuestions() {
  try {
    const res = await fetch('questions.json');
    const data = await res.json();
    allQuestions = data.questions;
  } catch (e) {
    console.error('Failed to load questions:', e);
    allQuestions = [];
  }
}

// ============================================================
// Home Screen
// ============================================================

function renderHome() {
  document.getElementById('total-count').textContent = allQuestions.length + '問';

  const container = document.getElementById('part-cards');
  container.innerHTML = '';

  for (const [part, info] of Object.entries(PART_INFO)) {
    const count = allQuestions.filter(q => q.part === part).length;
    const card = document.createElement('button');
    card.className = 'part-card';
    card.onclick = () => startQuiz(part);
    card.innerHTML = `
      <div class="part-icon">${info.icon}</div>
      <div class="part-info">
        <strong>${info.title}</strong>
        <small>${count}問</small>
      </div>
      <span class="part-arrow">›</span>
    `;
    container.appendChild(card);
  }
}

// ============================================================
// Screen Management
// ============================================================

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ============================================================
// Quiz Logic
// ============================================================

function startQuiz(part, count) {
  let questions = part
    ? allQuestions.filter(q => q.part === part)
    : [...allQuestions];

  // Shuffle
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  if (count && count < questions.length) {
    questions = questions.slice(0, count);
  }

  quizQuestions = questions;
  currentIndex = 0;
  answers = [];
  lastAnswer = null;
  currentFilter = part;

  showQuizQuestion();
}

function showQuizQuestion() {
  showScreen('screen-quiz');
  const q = quizQuestions[currentIndex];
  const total = quizQuestions.length;

  // Progress
  const pct = ((currentIndex) / total) * 100;
  document.getElementById('progress-fill').style.width = pct + '%';

  // Badges
  document.getElementById('badge-part').textContent = q.part;
  document.getElementById('badge-category').textContent = q.category;

  const diffBadge = document.getElementById('badge-difficulty');
  diffBadge.textContent = DIFFICULTY_LABELS[q.difficulty];
  diffBadge.className = 'badge badge-difficulty ' + q.difficulty;

  // Passage
  const passageArea = document.getElementById('passage-area');
  if (q.passage) {
    passageArea.textContent = q.passage;
    passageArea.classList.add('visible');
  } else {
    passageArea.textContent = '';
    passageArea.classList.remove('visible');
  }

  // Question
  document.getElementById('question-text').textContent = q.sentence;

  // Choices
  const choicesDiv = document.getElementById('choices');
  choicesDiv.innerHTML = '';
  q.choices.forEach((choice, idx) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice;
    btn.onclick = () => submitAnswer(idx);
    choicesDiv.appendChild(btn);
  });

  // Counter
  document.getElementById('quiz-counter').textContent =
    `Q${currentIndex + 1} / ${total}`;

  questionStartTime = Date.now();
}

function submitAnswer(selectedIndex) {
  const q = quizQuestions[currentIndex];
  const timeSpent = (Date.now() - questionStartTime) / 1000;
  const isCorrect = selectedIndex === q.correctIndex;

  lastAnswer = {
    questionId: q.id,
    selectedIndex,
    isCorrect,
    timeSpent,
  };

  showExplanation();
}

// ============================================================
// Explanation Screen
// ============================================================

function showExplanation() {
  showScreen('screen-explanation');
  const q = quizQuestions[currentIndex];
  const total = quizQuestions.length;
  const a = lastAnswer;

  // Progress
  const pct = ((currentIndex + 1) / total) * 100;
  document.getElementById('progress-fill-exp').style.width = pct + '%';

  // Banner
  const banner = document.getElementById('result-banner');
  banner.className = 'result-banner ' + (a.isCorrect ? 'correct' : 'incorrect');
  banner.innerHTML = `
    <span class="banner-icon">${a.isCorrect ? '✅' : '❌'}</span>
    <div class="banner-text">
      <strong>${a.isCorrect ? '正解！' : '不正解'}</strong>
      <small>回答時間: ${a.timeSpent.toFixed(1)}秒</small>
    </div>
  `;

  // Passage
  const passageArea = document.getElementById('exp-passage-area');
  if (q.passage) {
    passageArea.textContent = q.passage;
    passageArea.classList.add('visible');
  } else {
    passageArea.textContent = '';
    passageArea.classList.remove('visible');
  }

  // Question
  document.getElementById('exp-question-text').textContent = q.sentence;

  // Choices with states
  const choicesDiv = document.getElementById('exp-choices');
  choicesDiv.innerHTML = '';
  q.choices.forEach((choice, idx) => {
    const btn = document.createElement('button');
    let cls = 'choice-btn';
    let icon = '';

    if (idx === q.correctIndex) {
      cls += ' correct';
      icon = '✓';
    } else if (idx === a.selectedIndex && !a.isCorrect) {
      cls += ' incorrect';
      icon = '✗';
    } else {
      cls += ' dimmed';
    }

    btn.className = cls;
    btn.disabled = true;
    btn.innerHTML = `<span>${choice}</span>${icon ? `<span class="choice-icon">${icon}</span>` : ''}`;
    choicesDiv.appendChild(btn);
  });

  // Explanation
  document.getElementById('explanation-text').textContent = q.explanation;

  // Next button text
  const btnNext = document.getElementById('btn-next');
  btnNext.textContent = (currentIndex + 1 < total) ? '次の問題へ' : '結果を見る';
}

function nextQuestion() {
  answers.push(lastAnswer);
  lastAnswer = null;

  if (currentIndex + 1 < quizQuestions.length) {
    currentIndex++;
    showQuizQuestion();
  } else {
    showResult();
  }
}

// ============================================================
// Result Screen
// ============================================================

function showResult() {
  showScreen('screen-result');

  const total = answers.length;
  const correct = answers.filter(a => a.isCorrect).length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Score circle
  const ring = document.getElementById('score-ring');
  const circumference = 2 * Math.PI * 52; // r=52
  const offset = circumference * (1 - pct / 100);

  // Color
  let color;
  if (pct >= 80) color = 'var(--green)';
  else if (pct >= 60) color = 'var(--orange)';
  else color = 'var(--red)';

  ring.style.stroke = color;
  // Trigger animation
  setTimeout(() => {
    ring.style.strokeDashoffset = offset;
  }, 100);

  document.getElementById('score-percent').textContent = pct + '%';
  document.getElementById('score-percent').style.color = color;
  document.getElementById('score-fraction').textContent = `${correct} / ${total}`;

  // Message
  let msg;
  if (pct >= 90) msg = '素晴らしい！完璧に近い成績です！';
  else if (pct >= 80) msg = 'よくできました！この調子で頑張りましょう！';
  else if (pct >= 60) msg = 'まずまずの結果です。苦手分野を復習しましょう。';
  else if (pct >= 40) msg = 'もう少し頑張りましょう。基礎から見直してみましょう。';
  else msg = '基礎からしっかり学習しましょう。繰り返し練習が大切です。';
  document.getElementById('score-message').textContent = msg;

  // Stats
  document.getElementById('stat-correct').textContent = correct;
  document.getElementById('stat-incorrect').textContent = total - correct;
  document.getElementById('stat-rate').textContent = pct + '%';

  // Part breakdown
  const breakdown = document.getElementById('part-breakdown');
  if (!currentFilter) {
    let html = '<div class="part-breakdown-title">パート別結果</div>';
    for (const part of ['Part 5', 'Part 6', 'Part 7']) {
      const partAnswers = answers.filter(a => {
        const q = quizQuestions.find(q => q.id === a.questionId);
        return q && q.part === part;
      });
      if (partAnswers.length === 0) continue;
      const partCorrect = partAnswers.filter(a => a.isCorrect).length;
      const partPct = Math.round((partCorrect / partAnswers.length) * 100);
      let barColor;
      if (partPct >= 70) barColor = 'var(--green)';
      else if (partPct >= 50) barColor = 'var(--orange)';
      else barColor = 'var(--red)';

      html += `
        <div class="part-result-row">
          <span class="part-result-name">${PART_INFO[part].title}</span>
          <span class="part-result-score">${partCorrect}/${partAnswers.length}</span>
          <div class="part-result-bar">
            <div class="part-result-bar-fill" style="width:${partPct}%; background:${barColor}"></div>
          </div>
        </div>
      `;
    }
    breakdown.innerHTML = html;
  } else {
    breakdown.innerHTML = '';
  }
}

// ============================================================
// Navigation
// ============================================================

function confirmQuit() {
  if (confirm('クイズを終了しますか？進捗は保存されません。')) {
    goHome();
  }
}

function goHome() {
  // Reset score ring for next time
  const ring = document.getElementById('score-ring');
  ring.style.strokeDashoffset = 326.7;
  showScreen('screen-home');
}

function retryQuiz() {
  // Reset ring
  const ring = document.getElementById('score-ring');
  ring.style.strokeDashoffset = 326.7;

  // Reshuffle same questions
  for (let i = quizQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [quizQuestions[i], quizQuestions[j]] = [quizQuestions[j], quizQuestions[i]];
  }
  currentIndex = 0;
  answers = [];
  lastAnswer = null;
  showQuizQuestion();
}
