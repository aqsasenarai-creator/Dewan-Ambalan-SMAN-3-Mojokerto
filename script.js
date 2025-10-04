// ====== small helpers ======
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

// ===== set footer year (jika ada elemen) =====
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== NAV smooth scroll (menu) =====
$$('.topmenu a').forEach(a => {
  a.addEventListener('click', (e) => {
    // Jika href berisi hash internal, smooth scroll
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // jika link absolute atau file lain, biarkan browser buka (atau target="_blank")
  });
});

// ===== reveal elements on scroll (IntersectionObserver) =====
const revealItems = document.querySelectorAll('.section-title, .home-title, .home-welcome, .home-logo, .absensi-card, .quiz-form');
if (revealItems.length) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      if (ent.isIntersecting) ent.target.classList.add('visible');
    });
  }, { threshold: 0.18 });

  revealItems.forEach(el => revealObserver.observe(el));
}

// ===== QUIZ logic (aktif hanya jika ada form) =====
const quizForm = $('#quizForm');
if (quizForm) {
  const quizMsg = $('#quizMsg');
  const resultsModal = $('#resultsModal');
  const resultsContent = $('#resultsContent');
  const viewResultsBtn = $('#viewResultsBtn');
  const closeResults = $('#closeResults');

  // correct answers (ubah sesuai)
  const CORRECT = { q1: 'a', q2: 'b', q3: 'a' };
  const STORAGE_KEY = 'smk_quiz_submissions_v1';

  quizForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const data = new FormData(quizForm);
    const answers = {
      q1: data.get('q1') || '',
      q2: data.get('q2') || '',
      q3: data.get('q3') || ''
    };

    let score = 0;
    Object.keys(CORRECT).forEach(k => { if (answers[k] === CORRECT[k]) score++; });

    const record = { ts: Date.now(), score, answers };
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    arr.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

    if (quizMsg) quizMsg.textContent = `Terima kasih! Skor Anda: ${score} / ${Object.keys(CORRECT).length}`;
    quizForm.reset();
    quizForm.classList.add('sent');
    setTimeout(() => quizForm.classList.remove('sent'), 900);
  });

  // results view (restricted)
  const ALLOWED_USERS = ['admin', 'guru1']; // ubah sesuai kebutuhan
  function askPassword() {
    const acct = prompt('Masukkan nama akun untuk melihat hasil (contoh: admin):');
    if (!acct) return null;
    return acct.trim();
  }

  if (viewResultsBtn) {
    viewResultsBtn.addEventListener('click', () => {
      const acct = askPassword();
      if (!acct) return;
      if (!ALLOWED_USERS.includes(acct)) {
        alert('Akses ditolak. Anda tidak termasuk akun yang berwenang.');
        return;
      }

      const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!arr.length) {
        if (resultsContent) resultsContent.innerHTML = '<p>Tidak ada data hasil.</p>';
      } else {
        const total = arr.reduce((s, r) => s + r.score, 0);
        const avg = (total / (arr.length * Object.keys(CORRECT).length)) * 100;
        let html = `<p>Total submission: ${arr.length}</p>`;
        html += `<p>Rata-rata akurasi: ${avg.toFixed(1)}%</p>`;
        html += `<hr><h4>Histori terakhir</h4><ol>`;
        const recent = arr.slice(-10).reverse();
        recent.forEach(r => {
          const d = new Date(r.ts);
          html += `<li><strong>${d.toLocaleString()}</strong> — Skor: ${r.score}/${Object.keys(CORRECT).length}</li>`;
        });
        html += `</ol>`;
        if (resultsContent) resultsContent.innerHTML = html;
      }

      if (resultsModal) resultsModal.classList.remove('hidden');
    });
  }

  // close modal
  if (closeResults && resultsModal) {
    closeResults.addEventListener('click', () => resultsModal.classList.add('hidden'));
    resultsModal.addEventListener('click', (e) => { if (e.target === resultsModal) resultsModal.classList.add('hidden'); });
  }

  // keyboard esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && resultsModal) resultsModal.classList.add('hidden');
  });
}
