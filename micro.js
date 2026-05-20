/* ═══════════════════════════════════════════════════════
   MicroNotes — script.js
   Features: dark mode, search, scroll progress, active
   section, accordions, flashcards, copy, PDF, back-to-top
═══════════════════════════════════════════════════════ */

'use strict';

// ── Toast system ──────────────────────────────────────
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut .3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Dark Mode ──────────────────────────────────────────
(function initTheme() {
  const saved = localStorage.getItem('micronotes-theme') || 'light';
  document.body.setAttribute('data-theme', saved);
})();

document.getElementById('theme-toggle').addEventListener('click', () => {
  const current = document.body.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', next);
  localStorage.setItem('micronotes-theme', next);
  showToast(`${next === 'dark' ? '🌙 Dark' : '☀️ Light'} mode enabled`);
});

// ── Scroll Progress ────────────────────────────────────
const scrollBar = document.getElementById('scroll-progress');
const heroProgressBar = document.getElementById('hero-progress-bar');
const progressPct = document.getElementById('progress-pct');
const backToTop = document.getElementById('back-to-top');

function updateScrollProgress() {
  const docH = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docH > 0 ? Math.round((window.scrollY / docH) * 100) : 0;
  scrollBar.style.width = pct + '%';

  // Update hero progress bar
  if (heroProgressBar) {
    heroProgressBar.style.width = pct + '%';
    if (progressPct) progressPct.textContent = pct + '%';
  }

  // Back-to-top visibility
  if (window.scrollY > 400) {
    backToTop.classList.add('visible');
  } else {
    backToTop.classList.remove('visible');
  }
}

window.addEventListener('scroll', updateScrollProgress, { passive: true });
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ── Active Section Highlighting ────────────────────────
const tocLinks = document.querySelectorAll('.toc-link');
const sections = document.querySelectorAll('.scroll-target, .content-section');

function updateActiveSection() {
  let current = '';
  sections.forEach(sec => {
    const rect = sec.getBoundingClientRect();
    if (rect.top <= 100) current = sec.id;
  });
  tocLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-section') === current) {
      link.classList.add('active');
    }
  });
}
window.addEventListener('scroll', updateActiveSection, { passive: true });

// ── Hamburger / Sidebar ────────────────────────────────
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const closeSidebar = document.getElementById('close-sidebar');

function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('visible');
  document.body.style.overflow = 'hidden';
}
function closeSidebarFn() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('visible');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', openSidebar);
closeSidebar.addEventListener('click', closeSidebarFn);
sidebarOverlay.addEventListener('click', closeSidebarFn);

// Close sidebar on TOC link click (mobile)
tocLinks.forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth < 900) closeSidebarFn();
  });
});

// ── Smooth Scroll for Internal Links ──────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const navH = document.getElementById('navbar').offsetHeight;
      const targetY = target.getBoundingClientRect().top + window.scrollY - navH - 16;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  });
});

// ── Accordions ─────────────────────────────────────────
document.querySelectorAll('.accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    const accordion = header.parentElement;
    const isOpen = accordion.classList.contains('open');
    // Close siblings in same group
    const group = accordion.closest('.accordion-group') || document;
    if (group !== document) {
      group.querySelectorAll('.accordion.open').forEach(a => {
        if (a !== accordion) a.classList.remove('open');
      });
    }
    accordion.classList.toggle('open', !isOpen);
  });
});

// ── Flashcards ─────────────────────────────────────────
document.querySelectorAll('.flashcard').forEach(card => {
  card.addEventListener('click', () => {
    card.classList.toggle('flipped');
  });
});

// ── Copy Code Buttons ──────────────────────────────────
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const code = btn.getAttribute('data-code');
    try {
      await navigator.clipboard.writeText(code);
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      showToast('Code copied to clipboard!', 'success');
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 2000);
    } catch {
      showToast('Copy failed. Please copy manually.', 'info');
    }
  });
});

// ── Search Functionality ───────────────────────────────
const searchInput = document.getElementById('search-input');
const searchOverlay = document.getElementById('search-overlay');
const searchResults = document.getElementById('search-results');

// Build search index from DOM
const searchIndex = [];
document.querySelectorAll('.content-section').forEach(section => {
  const unitBadge = section.querySelector('.unit-badge');
  const unit = unitBadge ? unitBadge.textContent.trim() : '';

  // Index headings and paragraphs
  section.querySelectorAll('h3, h4, p, li, td').forEach(el => {
    const text = el.textContent.trim();
    if (text.length > 15) {
      const nearestId = el.closest('[id]')?.id || section.id;
      const nearestHeading = el.closest('.scroll-target')?.querySelector('h3')?.textContent || section.querySelector('h2')?.textContent;
      searchIndex.push({
        text,
        section: nearestId,
        heading: nearestHeading || '',
        unit
      });
    }
  });
});

function highlight(text, query) {
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(re, '<mark>$1</mark>');
}

function doSearch(query) {
  if (!query.trim() || query.length < 2) {
    searchOverlay.classList.remove('visible');
    return;
  }
  const q = query.toLowerCase();
  const results = searchIndex.filter(item => item.text.toLowerCase().includes(q)).slice(0, 8);
  if (!results.length) {
    searchResults.innerHTML = '<div class="search-result-item"><div class="sr-title">No results found</div></div>';
  } else {
    const unique = [];
    const seen = new Set();
    results.forEach(r => {
      const key = r.section + r.heading;
      if (!seen.has(key)) { seen.add(key); unique.push(r); }
    });
    searchResults.innerHTML = unique.map(r => `
      <div class="search-result-item" data-section="${r.section}">
        <div class="sr-unit">${r.unit}</div>
        <div class="sr-title">${highlight(r.heading || r.section, query)}</div>
        <div class="sr-snippet">${highlight(r.text.substring(0, 100), query)}…</div>
      </div>
    `).join('');
  }
  searchOverlay.classList.add('visible');

  // Click result
  searchResults.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.getAttribute('data-section');
      const target = document.getElementById(id);
      if (target) {
        const navH = document.getElementById('navbar').offsetHeight;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH - 16, behavior: 'smooth' });
      }
      searchOverlay.classList.remove('visible');
      searchInput.value = '';
    });
  });
}

searchInput.addEventListener('input', e => doSearch(e.target.value));
searchInput.addEventListener('focus', () => { if (searchInput.value) doSearch(searchInput.value); });

document.addEventListener('click', e => {
  if (!searchOverlay.contains(e.target) && e.target !== searchInput) {
    searchOverlay.classList.remove('visible');
  }
});

// Keyboard shortcut ⌘K / Ctrl+K
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
  if (e.key === 'Escape') {
    searchOverlay.classList.remove('visible');
    searchInput.blur();
  }
});

// ── Download PDF ───────────────────────────────────────
document.getElementById('download-pdf').addEventListener('click', () => {
  showToast('📄 Opening print dialog for PDF export…', 'info');
  setTimeout(() => window.print(), 500);
});

// ── MCQ Interaction ────────────────────────────────────
document.querySelectorAll('.mcq-option').forEach(option => {
  option.addEventListener('click', () => {
    // Don't change the correct answer highlighting
    const isCorrect = option.classList.contains('correct');
    const group = option.closest('.mcq-item');
    if (isCorrect) {
      showToast('✅ Correct!', 'success');
    } else {
      showToast('❌ Try again! Check the highlighted answer.', 'info');
    }
    group.querySelector('.mcq-explain').style.display = 'block';
  });
});
// Hide explanations initially
document.querySelectorAll('.mcq-explain').forEach(el => {
  el.style.display = 'none';
});

// ── Reading Time Estimate ──────────────────────────────
(function estimateReadingTime() {
  const text = document.getElementById('main-content').textContent;
  const words = text.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  const display = document.getElementById('reading-time-display');
  if (display) display.textContent = `${minutes} min read`;
})();

// ── Animated Counters in Hero ──────────────────────────
function animateCounters() {
  document.querySelectorAll('.stat-pill strong').forEach(el => {
    const val = parseInt(el.textContent);
    if (isNaN(val)) return;
    let current = 0;
    const step = val / 30;
    const timer = setInterval(() => {
      current += step;
      if (current >= val) { current = val; clearInterval(timer); }
      el.textContent = Math.floor(current) + (el.nextSibling?.textContent?.includes('+') ? '' : '');
    }, 30);
  });
}

// Trigger once hero is visible
const heroObs = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) { animateCounters(); heroObs.disconnect(); }
}, { threshold: 0.5 });
const hero = document.getElementById('hero');
if (hero) heroObs.observe(hero);

// ── Intersection Observer for sections ────────────────
const sectionObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.animationPlayState = 'running';
    }
  });
}, { threshold: 0.05 });
document.querySelectorAll('.content-section').forEach(s => {
  s.style.animationPlayState = 'paused';
  sectionObs.observe(s);
});

// ── Bookmark Feature ───────────────────────────────────
document.querySelectorAll('.sub-heading').forEach(heading => {
  const bookmarkBtn = document.createElement('button');
  bookmarkBtn.style.cssText = `
    margin-left: auto; opacity: 0; transition: opacity 200ms;
    background: none; border: none; cursor: pointer; padding: 4px;
  `;
  bookmarkBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
  bookmarkBtn.setAttribute('aria-label', 'Bookmark this section');
  heading.appendChild(bookmarkBtn);

  heading.style.display = 'flex';
  heading.addEventListener('mouseenter', () => bookmarkBtn.style.opacity = '1');
  heading.addEventListener('mouseleave', () => bookmarkBtn.style.opacity = '0');

  bookmarkBtn.addEventListener('click', () => {
    showToast(`🔖 Section bookmarked!`, 'success');
    bookmarkBtn.querySelector('svg').setAttribute('fill', 'var(--primary)');
    bookmarkBtn.querySelector('svg').setAttribute('stroke', 'var(--primary)');
  });
});

// ── Initial run ────────────────────────────────────────
updateScrollProgress();
updateActiveSection();

console.log('%c🖥️ MicroNotes — 8086 Study Notes', 'font-size:18px;font-weight:bold;color:#4F46E5');
console.log('%cBuilt with care for exam success 📚', 'color:#64748B');