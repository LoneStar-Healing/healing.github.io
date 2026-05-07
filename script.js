/* ============================================
   LONE STAR HEALING — interactions
============================================ */

(function () {
  'use strict';

  /* ---------- Research tabs ---------- */
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');

  function activateTab(targetTab) {
    const targetId = targetTab.dataset.tab;

    tabs.forEach(tab => {
      const isActive = tab === targetTab;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive);
      tab.tabIndex = isActive ? 0 : -1;
    });

    panels.forEach(panel => {
      const isActive = panel.id === `panel-${targetId}`;
      panel.classList.toggle('active', isActive);
      panel.hidden = !isActive;
    });
  }

  tabs.forEach((tab, idx) => {
    tab.addEventListener('click', () => activateTab(tab));

    tab.addEventListener('keydown', (e) => {
      let nextIdx = null;
      if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') nextIdx = 0;
      else if (e.key === 'End') nextIdx = tabs.length - 1;

      if (nextIdx !== null) {
        e.preventDefault();
        activateTab(tabs[nextIdx]);
        tabs[nextIdx].focus();
      }
    });
  });

  /* ---------- Donation amount selection ---------- */
  const amountBtns = document.querySelectorAll('.amount-btn');
  const customWrap = document.getElementById('custom-wrap');
  const customInput = document.getElementById('custom-amount');
  const donateAmount = document.getElementById('donate-amount');

  let selectedAmount = 50;
  let isCustom = false;

  function updateDonateButton() {
    if (isCustom) {
      const val = parseFloat(customInput.value);
      donateAmount.textContent = val > 0 ? `$${val.toLocaleString()}` : '$—';
    } else {
      donateAmount.textContent = `$${selectedAmount.toLocaleString()}`;
    }
  }

  amountBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      amountBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (btn.dataset.amount === 'custom') {
        isCustom = true;
        customWrap.hidden = false;
        customInput.focus();
      } else {
        isCustom = false;
        customWrap.hidden = true;
        selectedAmount = parseInt(btn.dataset.amount, 10);
      }
      updateDonateButton();
    });
  });

  if (customInput) {
    customInput.addEventListener('input', updateDonateButton);
  }

  /* ---------- Frequency toggle ---------- */
  const freqBtns = document.querySelectorAll('.freq-btn');
  const donateFreq = document.getElementById('donate-freq');

  freqBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      freqBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      donateFreq.textContent = btn.dataset.freq === 'monthly' ? '/ month' : '';
    });
  });

  /* ---------- Donate CTA (placeholder) ---------- */
  const donateCta = document.getElementById('donate-cta');
  if (donateCta) {
    donateCta.addEventListener('click', () => {
      const amount = isCustom
        ? parseFloat(customInput.value)
        : selectedAmount;
      const freq = document.querySelector('.freq-btn.active').dataset.freq;

      if (!amount || amount < 1) {
        customInput.focus();
        return;
      }

      // Replace this with your real donation processor URL
      // e.g. Stripe Payment Link, Givebutter, Donorbox, etc.
      const donationURL = `https://donate.example.org/?amount=${amount}&frequency=${freq}`;
      console.log('Would redirect to:', donationURL);
      alert(`Ready to process: $${amount} (${freq}).\n\nReplace this with your real donation processor URL in script.js.`);
    });
  }

  /* ---------- Reveal-on-scroll ---------- */
  if ('IntersectionObserver' in window) {
    const reveal = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    };

    const io = new IntersectionObserver(reveal, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.mission-card, .stat, .resource-link').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
      io.observe(el);
    });
  }

})();
