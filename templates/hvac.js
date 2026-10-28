(() => {
  'use strict';
  const services={
    heating:['Heating services','Get comfortable with your options.','Repairs, replacements and seasonal care. A place to explain what you work on and what customers can expect.'],
    cooling:['Cooling services','Find your cool.','Introduce AC repair, ductless systems and planned replacements. Help visitors understand your services before they call.'],
    air:['Air quality services','A clearer approach to better air.','Explain your airflow, filtration and ventilation services, with space for your real process and customer questions.']
  };
  const detail=document.getElementById('trade-service-detail'),buttons=document.querySelectorAll('[data-trade-service]');
  if(detail)buttons.forEach(button=>{button.hidden=false;button.addEventListener('click',()=>{
    const key=button.dataset.tradeService;if(!Object.hasOwn(services,key))return;
    const [label,title,body]=services[key];
    buttons.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
    detail.querySelector('.overline').textContent=label;detail.querySelector('h3').textContent=title;detail.querySelector('p:not(.overline)').textContent=body;
  })});
  const select=document.getElementById('request-type'),status=document.getElementById('request-guidance');
  const messages={repair:'On your website, customers could share their system type and what they’re noticing.',replace:'On your website, customers could describe the current system and the goals for an upgrade.',maintain:'On your website, customers could request routine care and share their preferred contact method.'};
  select?.addEventListener('change',()=>{if(Object.hasOwn(messages,select.value))status.textContent=messages[select.value]});
})();
