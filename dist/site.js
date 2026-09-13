/* Flow Fusion site behaviour. Scoped to #ff-site for GoHighLevel embedding.
   checkoutLinks: an https URL or a path relative to this page (e.g. 'checkout/core').
   Empty values deliberately show a preview notice and never charge a card. */
(() => {
  'use strict';
  const checkoutLinks = { core: 'checkout/core', starter: 'checkout/starter', growth: 'checkout/growth', scale: 'checkout/scale' };
  const root = document.getElementById('ff-site');
  if (!root || root.dataset.initialized) return;
  root.dataset.initialized = 'true';
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = motionPreference.matches;
  const motionButton = root.querySelector('.ff-global-motion');
  const navButton = root.querySelector('.ff-menu-toggle');
  const menu = root.querySelector('#ff-menu');
  const progress = root.querySelector('.ff-scroll-line');
  const demo = root.querySelector('.ff-product-demo');
  const demoButtons = [...root.querySelectorAll('[data-demo-step]')];
  const demoToggle = root.querySelector('.ff-motion-toggle');
  let demoStep = 0, demoTimer = null, demoRunning = false;
  let demoVisible = false, demoStarted = false, demoComplete = false;
  let manualPaused = false;
  const eventCopy = ['New inquiry captured. A contact record is ready.', 'Follow-up sent. Your team knows what comes next.', 'Appointment booked. The conversation moves forward.'];

  function setDemoStep(step) {
    demoStep = step;
    demo.dataset.step = String(step);
    demoButtons.forEach((button, i) => { button.classList.toggle('is-active', i === step); button.setAttribute('aria-pressed', String(i === step)); });
    root.querySelector('.ff-event-text').textContent = eventCopy[step];
    root.querySelector('.ff-event-status').textContent = `Step ${step + 1} of 3`;
  }
  function updateDemoLabel() {
    demoToggle.textContent = demoRunning ? 'Pause motion  Ⅱ' : demoComplete ? 'Replay walkthrough  ↻' : 'Play walkthrough  ▷';
    demoToggle.setAttribute('aria-label', demoRunning ? 'Pause walkthrough animation' : demoComplete ? 'Replay walkthrough animation' : 'Play walkthrough animation');
    if (reduced) { demoToggle.textContent = 'Motion reduced'; demoToggle.setAttribute('aria-label', 'Animation disabled; use the three stage buttons to explore'); }
    demoToggle.disabled = reduced;
  }
  function stopDemo() { clearTimeout(demoTimer); demoTimer = null; demoRunning = false; updateDemoLabel(); }
  function playDemo() {
    if (reduced || document.hidden || !demoVisible) return;
    stopDemo(); demoRunning = true; updateDemoLabel();
    demoTimer = window.setTimeout(() => {
      if (demoStep >= 2) { demoComplete = true; stopDemo(); return; }
      setDemoStep(demoStep + 1); playDemo();
    }, 3800);
  }
  demoButtons.forEach(button => button.addEventListener('click', () => { manualPaused = true; demoComplete = false; stopDemo(); setDemoStep(Number(button.dataset.demoStep)); }));
  demoToggle.addEventListener('click', () => {
    if (demoRunning) { manualPaused = true; stopDemo(); }
    else { manualPaused = false; if (demoComplete || demoStep === 2) setDemoStep(0); demoComplete = false; playDemo(); }
  });
  function setReduced(value) {
    reduced = value; root.classList.toggle('ff-reduced-motion', reduced);
    motionButton.setAttribute('aria-pressed', String(reduced));
    motionButton.textContent = reduced ? 'Motion reduced' : 'Reduce motion';
    if (reduced) stopDemo();
    else if (demoStarted && demoVisible && !demoComplete && !manualPaused) playDemo();
    updateDemoLabel();
  }
  motionButton.addEventListener('click', () => setReduced(!reduced));
  motionPreference.addEventListener('change', e => setReduced(e.matches));
  setReduced(reduced);
  const closeMenu = () => { menu.classList.remove('is-open'); navButton.setAttribute('aria-expanded', 'false'); navButton.setAttribute('aria-label', 'Open navigation'); };
  navButton.addEventListener('click', () => {
    const open = navButton.getAttribute('aria-expanded') !== 'true';
    menu.classList.toggle('is-open', open); navButton.setAttribute('aria-expanded', String(open)); navButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  root.addEventListener('keydown', e => { if(e.key === 'Escape' && menu.classList.contains('is-open')) {closeMenu(); navButton.focus();} });
  document.addEventListener('click', e => {if(!menu.contains(e.target) && !navButton.contains(e.target)) closeMenu();});
  root.querySelectorAll('a[href^="#ff-"]').forEach(link => link.addEventListener('click', e => {
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if(!target) return;
    e.preventDefault(); closeMenu();
    target.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex','-1');
    target.focus({preventScroll:true});
  }));
  let scrollQueued = false;
  function updateProgress() {
    scrollQueued = false;
    const top = root.getBoundingClientRect().top + window.scrollY;
    const range = Math.max(1, root.offsetHeight - window.innerHeight);
    progress.style.transform = `scaleX(${Math.max(0,Math.min(1,(window.scrollY-top)/range))})`;
  }
  window.addEventListener('scroll', () => {if (!scrollQueued) {scrollQueued = true;requestAnimationFrame(updateProgress);}}, {passive:true});
  window.addEventListener('resize', updateProgress); updateProgress();
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => { if(entry.isIntersecting) { entry.target.classList.add('ff-in-view'); entry.target.classList.remove('ff-reveal-pending'); reveal.unobserve(entry.target); } }), {threshold:.08, rootMargin:'0px 0px -25px 0px'});
    root.querySelectorAll('.ff-reveal').forEach(el => { if(el.getBoundingClientRect().top > innerHeight && !reduced) el.classList.add('ff-reveal-pending'); reveal.observe(el); });
    const demoObserver = new IntersectionObserver(entries => { demoVisible = entries[0].isIntersecting; if (demoVisible) { if(!demoStarted) {demoStarted = true;playDemo();} else if(!manualPaused && !demoComplete) playDemo(); } else stopDemo(); }, {threshold:.25});
    demoObserver.observe(demo);
  } else { root.querySelectorAll('.ff-reveal').forEach(el => el.classList.add('ff-in-view')); demoVisible=true; demoStarted=true;playDemo(); }
  document.addEventListener('visibilitychange', () => { root.classList.toggle('ff-page-hidden',document.hidden); if(document.hidden) stopDemo(); else if(demoVisible && !manualPaused && !demoComplete) playDemo(); });
  const dialog = root.querySelector('.ff-checkout-dialog');
  const plans = {
    core:{name:'Core',price:99,includes:'Flow Fusion CRM. SMS messaging is not included.'},
    starter:{name:'Starter',price:150,includes:'Flow Fusion CRM + 5,000 SMS per month + 1 SMS number.'},
    growth:{name:'Growth',price:297,includes:'Flow Fusion CRM + 25,000 SMS per month + 1 SMS number.'},
    scale:{name:'Scale',price:497,includes:'Flow Fusion CRM + 50,000 SMS per month + 1 SMS number.'}
  };
  root.querySelectorAll('[data-plan]').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.plan, plan = plans[key], url = checkoutLinks[key];
    if (!plan) return;
    if(url) { try {const parsed = new URL(url, window.location.href); if(parsed.protocol==='https:' || parsed.origin===window.location.origin) {window.location.assign(parsed.href);return;} } catch {} }
    root.querySelector('#ff-checkout-title').textContent = plan.name;
    root.querySelector('.ff-dialog-price').textContent = `$${plan.price} / month`;
    root.querySelector('.ff-dialog-includes').textContent = plan.includes;
    dialog.showModal();
  }));
  dialog.addEventListener('click',e => { const rect=dialog.getBoundingClientRect(); if(e.target===dialog && (e.clientX<rect.left || e.clientX>rect.right || e.clientY<rect.top || e.clientY>rect.bottom)) dialog.close(); });
  root.querySelector('[data-year]').textContent = String(new Date().getFullYear());
})();
