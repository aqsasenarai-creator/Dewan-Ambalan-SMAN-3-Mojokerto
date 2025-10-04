// ====== small helpers ======
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// set footer year
document.getElementById('year').textContent = new Date().getFullYear();

// ====== NAV smooth scroll (menu) ======
$$('.topmenu a').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ====== reveal elements on scroll (IntersectionObserver) ======
const revealItems = document.querySelectorAll(
  '.section-title, .home-title, .home-welcome, .home-logo, .absensi-card, .quiz-form'
);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(ent => {
    if (ent.isIntersecting) ent.target.classList.add('visible');
  });
}, { threshold: 0.18 });

revealItems.forEach(el => revealObserver.observe(el));

// ====== Absensi cards (langsung link, no JS required) ======

// ====== QUIZ logic (client-side) ======
// NOTE: client-side only. Untuk real, perlu backend.
const quizForm = $('#quizForm');
const quizMsg = $('#quizMsg');
const resultsModal = $('#resultsModal');
const resultsContent = $('#resultsContent');
const viewResultsBtn = $('#viewResultsBtn');
const closeResults = $('#closeResults');

// correct answers (ubah sesuai soal)
const CORRECT = { q1: 'a', q2: 'b', q3: 'a' };

// key localStorage
const STORAGE_KEY = 'smk_quiz_submissions_v1';

// submit handler
quizForm.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const data = new FormData(quizForm);
  const answers = {
    q1: data.get('q1') || '',
    q2: data.get('q2') || '',
    q3: data.get('q3') || ''
  };

  // hitung skor
  let score = 0;
  Object.keys(CORRECT).forEach(k => { if (answers[k] === CORRECT[k]) score++; });

  // simpan record (ts, score, answers)
  const record = { ts: Date.now(), score, answers };
  const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  arr.push(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

  quizMsg.textContent = `Terima kasih! Skor Anda: ${score} / ${Object.keys(CORRECT).length}`;
  quizForm.reset();

  // animasi kecil
  quizForm.classList.add('sent');
  setTimeout(() => quizForm.classList.remove('sent'), 900);
});

// ====== RESULTS VIEW (restricted) ======
// NOTE: hanya proteksi client-side. Untuk produksi, harus server-side.
const ALLOWED_USERS = ['admin', 'guru1']; // ubah sesuai akun
function askPassword() {
  const acct = prompt('Masukkan nama akun untuk melihat hasil (contoh: admin):');
  if (!acct) return null;
  return acct.trim();
}

viewResultsBtn.addEventListener('click', () => {
  const acct = askPassword();
  if (!acct) return;
  if (!ALLOWED_USERS.includes(acct)) {
    alert('Akses ditolak. Anda tidak termasuk akun yang berwenang.');
    return;
  }

  // ambil data submissions
  const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (!arr.length) {
    resultsContent.innerHTML = '<p>Tidak ada data hasil.</p>';
  } else {
    // hitung rata-rata & tampilkan histori
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
    resultsContent.innerHTML = html;
  }

  resultsModal.classList.remove('hidden');
});

// close modal
closeResults.addEventListener('click', () => resultsModal.classList.add('hidden'));
resultsModal.addEventListener('click', (e) => { if (e.target === resultsModal) resultsModal.classList.add('hidden'); });

// ====== UX polish: keyboard escape ======
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') resultsModal.classList.add('hidden');
});
