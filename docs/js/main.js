/*!
 * Flashpoint Leads LLC — main.js
 * Mobile nav toggle | Smooth scroll | Active nav highlighting
 */
(function () {
  'use strict';

  /* ── Mobile nav toggle ──────────────────────────────────── */
  const nav = document.querySelector('.nav');
  const navToggle = document.querySelector('.nav-toggle');

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close nav when a link inside the mobile menu is clicked
    nav.querySelectorAll('.nav-links a, .nav-actions a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close nav when clicking outside
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target)) {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── Active nav link highlighting ──────────────────────── */
  (function highlightNav() {
    var current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      if (href === current || (current === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  })();

  /* ── Smooth scroll for anchor links ────────────────────── */
  document.addEventListener('click', function (e) {
    var target = e.target.closest('a[href^="#"]');
    if (!target) return;
    var id = target.getAttribute('href').slice(1);
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ── FAQ accordion ──────────────────────────────────────── */
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      var isOpen = item.classList.contains('open');
      // Close all
      document.querySelectorAll('.faq-item.open').forEach(function (openItem) {
        openItem.classList.remove('open');
        openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });
      // Toggle current
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ── Sticky nav shadow on scroll ────────────────────────── */
  window.addEventListener('scroll', function () {
    if (!nav) return;
    if (window.scrollY > 20) {
      nav.style.boxShadow = '0 2px 32px rgba(0,0,0,0.6)';
    } else {
      nav.style.boxShadow = '';
    }
  }, { passive: true });

  /* ── Intersection Observer: fade-in on scroll ───────────── */
  if ('IntersectionObserver' in window) {
    var style = document.createElement('style');
    style.textContent = '.reveal{opacity:0;transform:translateY(24px);transition:opacity .55s ease,transform .55s ease}.reveal.visible{opacity:1;transform:none}';
    document.head.appendChild(style);

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.card, .pricing-card, .step, .testimonial-card, .faq-item').forEach(function (el) {
      el.classList.add('reveal');
      observer.observe(el);
    });
  }
})();
