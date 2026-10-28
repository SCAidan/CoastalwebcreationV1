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
})();
