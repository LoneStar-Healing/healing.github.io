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
  const donateAmount = document.getElementById('donate-amount');
  const flexBtn = document.getElementById('flex-amount');

  let selectedAmount = 50;

  function updateDonateButton() {
    donateAmount.textContent = `$${selectedAmount.toLocaleString()}`;
  }

  function selectAmount(amt) {
    selectedAmount = amt;
    amountBtns.forEach(b => b.classList.toggle('active', b.dataset.amount === String(amt)));
    updateDonateButton();
  }

  // The last amount slot flexes by frequency: "Other" (choose-your-amount,
  // one-time) when One-time is active, or a fixed "$1,000" tier when Monthly
  // is — because Stripe can't offer a choose-your-amount *recurring* gift.
  function syncFlexButton(freq) {
    if (freq === 'monthly') {
      flexBtn.textContent = '$1,000';
      flexBtn.dataset.amount = '1000';
      flexBtn.classList.remove('custom');
    } else {
      flexBtn.textContent = 'More';
      flexBtn.dataset.amount = 'custom';
      flexBtn.classList.add('custom');
    }
    // If the current selection doesn't exist for this frequency, fall back to $50.
    if (!(PAYMENT_LINKS[freq] || {})[selectedAmount]) {
      selectAmount(50);
    }
  }

  amountBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // "Other" (one-time only) has no amount field on the site — send the donor
      // straight to Stripe's choose-your-amount page; they enter the amount there.
      if (btn.dataset.amount === 'custom') {
        const url = (PAYMENT_LINKS.once || {}).custom;
        if (!url) {
          alert('Custom amounts aren’t available right now — please choose a preset amount.');
          return;
        }
        window.location.href = url;
        return;
      }

      selectAmount(parseInt(btn.dataset.amount, 10));
    });
  });

  /* ---------- Frequency toggle ---------- */
  const freqBtns = document.querySelectorAll('.freq-btn');
  const donateFreq = document.getElementById('donate-freq');

  freqBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      freqBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const freq = btn.dataset.freq;
      donateFreq.textContent = freq === 'monthly' ? '/ month' : '';
      syncFlexButton(freq);
    });
  });

  /* ---------- Stripe Payment Links ----------
     Create these in your Stripe Dashboard:
       Product catalog → Payment links → + New
     - Preset amounts: use a fixed price (e.g. $50). Monthly ones need a
       recurring price — a single link can't be both one-time and monthly.
     - once.custom: one link with "Customers choose what to pay" pricing
       (the one-time "Other" button sends donors straight here).
     - monthly.1000: a fixed $1,000/month link — the recurring tab shows this
       instead of "Other", since Stripe can't do a custom recurring amount.
     Paste each link's URL (https://buy.stripe.com/...) below; leave '' until
     made and the button tells the donor it isn't available yet. */
  const PAYMENT_LINKS = {
    once: {
      25:     'https://buy.stripe.com/test_eVqdRa5KK5B09YK7Yf7Vm0b',
      50:     'https://buy.stripe.com/test_eVqaEYehg4wWc6S7Yf7Vm0c',
      100:    'https://buy.stripe.com/test_8x200kflke7w4Eqdiz7Vm0d',
      250:    'https://buy.stripe.com/test_14A9AU5KK2oO1secev7Vm0e',
      500:    'https://buy.stripe.com/test_8x2fZi4GG3sS4Eq0vN7Vm0f',
      custom: 'https://buy.stripe.com/test_fZufZi4GG0gGdaWcev7Vm0m', // choose your amount
    },
    monthly: {
      25:     'https://buy.stripe.com/test_dRm28sb548Nc4EqemD7Vm0g',
      50:     'https://buy.stripe.com/test_eVqcN68WWe7wdaW5Q77Vm0h',
      100:    'https://buy.stripe.com/test_5kQeVegpod3sc6S1zR7Vm0i',
      250:    'https://buy.stripe.com/test_7sYfZi3CCfbA9YK3HZ7Vm0j',
      500:    'https://buy.stripe.com/test_cNi9AU4GG7J83Am6Ub7Vm0k',
      1000:   'https://buy.stripe.com/test_fZu6oIehge7w0oa3HZ7Vm0l', // $1,000/month — the recurring "More" tier
    },
  };

  const donateCta = document.getElementById('donate-cta');
  if (donateCta) {
    donateCta.addEventListener('click', () => {
      const freq = document.querySelector('.freq-btn.active').dataset.freq;
      const url = (PAYMENT_LINKS[freq] || {})[selectedAmount];

      if (!url) {
        alert('That donation option isn’t set up yet. Please choose a different amount, or email research@lonestarhealing.org.');
        return;
      }

      window.location.href = url;
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
