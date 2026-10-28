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
})();
