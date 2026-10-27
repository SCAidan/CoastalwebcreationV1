(() => {
  'use strict';
  // Native anchors provide useful navigation with or without JavaScript.
  const railLinks = document.querySelectorAll('[data-tech-service]');
  railLinks.forEach(link => link.addEventListener('click', () => {
    railLinks.forEach(other => {
      other.classList.toggle('is-active', other === link);
      if (other === link) other.setAttribute('aria-current', 'true');
      else other.removeAttribute('aria-current');
    });
  }));
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
      if (!service) return;
      buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      detail.querySelector('.overline').textContent = service[0];
      detail.querySelector('h3').textContent = service[1];
      detail.querySelector('p:not(.overline)').textContent = service[2];
    });
  });
})();
