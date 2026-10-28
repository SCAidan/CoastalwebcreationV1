(() => {
  'use strict';
  const services = {
    heating: ['01 / Heating', 'Make room for warm.', 'A place for heating repairs, system replacements and seasonal checkups. Help visitors understand their options before they get in touch.'],
    cooling: ['02 / Cooling', 'A breath of fresh air.', 'Room to explain efficient cooling, system upgrades and comfort options. Give customers a clear next step when their home needs attention.'],
    care: ['03 / Home care', 'Good care goes a long way.', 'A place for routine maintenance and seasonal upkeep. Show how small, thoughtful checks can help customers look after their home.']
  };
  const detail = document.getElementById('home-service-detail');
  const buttons = document.querySelectorAll('[data-home-service]');
  if (detail) buttons.forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      const service = services[button.dataset.homeService];
      if (!Object.hasOwn(services, button.dataset.homeService)) return;
      buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      detail.querySelector('.overline').textContent = service[0];
      detail.querySelector('h3').textContent = service[1];
      detail.querySelector('p:not(.overline)').textContent = service[2];
    });
  });
})();
