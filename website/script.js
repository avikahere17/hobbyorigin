/* ══════════════════════════════════════════════════════════════
   HobbyOrigin Marketing Website — script.js
   ══════════════════════════════════════════════════════════════ */

/* ── Scroll reveal ── */
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // stagger children within same parent
      const siblings = [...entry.target.parentElement.querySelectorAll('.reveal:not(.visible)')];
      const delay = siblings.indexOf(entry.target) * 80;
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
reveals.forEach(el => observer.observe(el));

/* ── Navbar scroll ── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

/* ── Hamburger ── */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger?.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
// Close on link click
navLinks?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

/* ── FAB show after scroll ── */
const fab = document.getElementById('fab');
window.addEventListener('scroll', () => {
  fab.classList.toggle('visible', window.scrollY > 400);
}, { passive: true });

/* ── Persona tabs ── */
document.querySelectorAll('.ptab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.ptab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.persona-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab)?.classList.add('active');
  });
});

/* ── Waitlist form ── */
const form = document.getElementById('waitlistForm');
const successMsg = document.getElementById('wlSuccess');
const btnText = document.getElementById('wlBtnText');

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('wlName').value.trim();
  const email = document.getElementById('wlEmail').value.trim();
  const age = document.getElementById('wlAge').value;

  if (!name || !email) return;

  // Simulate submission
  btnText.textContent = 'Joining…';
  setTimeout(() => {
    form.style.display = 'none';
    successMsg.style.display = 'block';
    // Log to console for now (replace with real API call)
    console.log('Waitlist signup:', { name, email, age });
  }, 800);
});

/* ── Smooth anchor scroll ── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ── Animate use-of-funds bars on scroll ── */
const barFills = document.querySelectorAll('.bar-fill');
const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.width = entry.target.style.width || '0%';
      barObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
barFills.forEach(bar => barObserver.observe(bar));

/* ── Counter animation for hero stats ── */
function animateCounter(el, target, suffix = '') {
  const isFloat = target.toString().includes('.');
  let current = 0;
  const step = target / 60;
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    const display = isFloat ? current.toFixed(1) : Math.floor(current);
    el.textContent = (suffix === '£' ? '£' : '') + display + (suffix !== '£' ? suffix : '');
    if (current >= target) clearInterval(timer);
  }, 16);
}

const statNums = document.querySelectorAll('.stat-num');
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const raw = el.textContent.trim();
      if (raw.startsWith('£')) {
        const n = parseFloat(raw.slice(1).replace('k','')) * (raw.includes('k') ? 1000 : 1);
        animateCounter(el, n / 1000, 'k');
        el.textContent = raw; // reset shown while animating
      }
      statObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });
statNums.forEach(el => statObserver.observe(el));
