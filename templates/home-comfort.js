(() => {
  'use strict';
  const services = {
    remodels: ['01 / Remodels', 'A fresh take on home.', 'A place to showcase kitchen, bathroom and whole-home remodeling. Help homeowners picture what could change, from the first conversation to the final details.'],
    additions: ['02 / Additions', 'More room for what matters.', 'Show how room additions and extensions can create useful space while working with the character of the existing home.'],
    finishes: ['03 / Finish work', 'Thoughtful down to the details.', 'A place for cabinetry, trim and interior finishes. Let close-up project photography show the care that goes into the work.']
  };
  const detail = document.getElementById('home-service-detail');
  const buttons = document.querySelectorAll('[data-home-service]');
  if (detail) buttons.forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      if (!Object.hasOwn(services, button.dataset.homeService)) return;
      const service = services[button.dataset.homeService];
      buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      detail.querySelector('.overline').textContent = service[0];
      detail.querySelector('h3').textContent = service[1];
      detail.querySelector('p:not(.overline)').textContent = service[2];
    });
  });
  document.querySelectorAll('[data-comparison]').forEach(comparison => {
    const view = comparison.querySelector('[data-comparison-view]');
    const range = comparison.querySelector('input[type="range"]');
    const controls = comparison.querySelector('.comparison-control');
    if (!view || !range || !controls) return;
    const update = value => {
      const number = Number(value);
      const position = Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : 50;
      range.value = String(Math.round(position));
      view.style.setProperty('--comparison-position', `${range.value}%`);
      range.setAttribute('aria-valuetext', `${range.value}% before, ${100 - Number(range.value)}% after`);
      view.querySelector('.comparison-label-before').hidden = position < 5;
      view.querySelector('.comparison-label-after').hidden = position > 95;
    };
    let previewFrame = 0;
    let previewObserver = null;
    let interacted = false;
    const stopPreview = () => {
      interacted = true;
      previewObserver?.disconnect();
      if (previewFrame) cancelAnimationFrame(previewFrame);
      previewFrame = 0;
    };
    range.addEventListener('input', () => { stopPreview(); update(range.value); });
    range.addEventListener('focus', stopPreview);
    let pointer = null;
    const move = event => {
      const bounds = view.getBoundingClientRect();
      if (bounds.width > 0) update((event.clientX - bounds.left) / bounds.width * 100);
    };
    view.addEventListener('pointerdown', event => {
      if (event.button !== 0 || pointer !== null) return;
      stopPreview();
      pointer = event.pointerId;
      view.setPointerCapture(pointer);
      move(event);
    });
    view.addEventListener('pointermove', event => { if (event.pointerId === pointer) move(event); });
    const stop = event => { if (event.pointerId === pointer) pointer = null; };
    view.addEventListener('pointerup', stop);
    view.addEventListener('pointercancel', stop);
    view.addEventListener('lostpointercapture', stop);
    update(range.value);
    controls.hidden = false;
    view.dataset.ready = 'true';
    const motion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (!motion?.matches && typeof IntersectionObserver === 'function' && typeof requestAnimationFrame === 'function') {
      let previewStarted = false;
      previewObserver = new IntersectionObserver(entries => {
        if (interacted || previewStarted || !entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.45)) return;
        previewStarted = true;
        previewObserver.disconnect();
        let started = null;
        const animate = now => {
          if (interacted) return;
          if (started === null) started = now;
          const progress = Math.min(1, (now - started) / 1800);
          update(progress === 1 ? 50 : 50 + 15 * Math.sin(progress * Math.PI * 2));
          previewFrame = progress < 1 ? requestAnimationFrame(animate) : 0;
        };
        previewFrame = requestAnimationFrame(animate);
      }, { threshold: 0.45 });
      previewObserver.observe(view);
      motion?.addEventListener('change', event => {
        if (!event.matches) return;
        const moving = previewFrame !== 0;
        stopPreview();
        if (moving) update(50);
      });
    }
  });
})();
