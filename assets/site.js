(()=>{
'use strict';
const $=s=>document.querySelector(s),reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduced.matches;const activeAnimations=new Set();
const motionButton=$('#motion-toggle');
function stopAnimations(){for(const animation of activeAnimations)animation.finish();activeAnimations.clear()}
function setMotion(value){paused=value;document.body.classList.toggle('motion-paused',paused);if(paused)stopAnimations();if(motionButton){motionButton.textContent=paused?'Enable animations':'Pause animations';motionButton.setAttribute('aria-pressed',String(paused))}}
function animate(element,frames,options){if(paused||!element.animate)return;const animation=element.animate(frames,options);activeAnimations.add(animation);animation.finished.catch(()=>{}).finally(()=>activeAnimations.delete(animation));return animation}
if(motionButton){motionButton.hidden=false;motionButton.addEventListener('click',()=>setMotion(!paused))}
setMotion(paused);reduced.addEventListener?.('change',event=>setMotion(event.matches));
// Content is visible by default, including when scripts or observers are unavailable.
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){animate(entry.target,[{opacity:.25,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:550,easing:'cubic-bezier(.2,.7,.2,1)'});observer.unobserve(entry.target)}},{threshold:.08});document.querySelectorAll('.process article,.service-list article,.about,.faq,.contact-grid').forEach(el=>observer.observe(el))}
animate($('.hero'),[{opacity:.35,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:550,easing:'ease-out'});
// One short decorative movement; no continuous background animation or scroll hijacking.
animate($('.wave-art'),[{transform:'translateY(0)'},{transform:'translateY(6px)'},{transform:'translateY(0)'}],{duration:4000,easing:'ease-in-out'});
const menu=$('.menu-toggle'),links=$('#nav-links'),small=window.matchMedia('(max-width:960px)');
function updateMenu(){if(!menu||!links)return;menu.hidden=!small.matches;links.classList.toggle('is-collapsed',small.matches);menu.setAttribute('aria-expanded',String(!small.matches));menu.textContent='Menu'}
if(menu){updateMenu();small.addEventListener?.('change',updateMenu);menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Close menu':'Menu';links.classList.toggle('is-collapsed',!open)});links.addEventListener('click',event=>{if(event.target.closest('a')&&small.matches)updateMenu()});links.addEventListener('keydown',event=>{if(event.key==='Escape'){updateMenu();menu.focus()}})}
document.querySelectorAll('[data-service]').forEach(link=>link.addEventListener('click',()=>{const field=$('#service'),option=[...field.options].find(option=>option.value===link.dataset.service);if(option){field.value=option.value;$('#form-status').textContent=option.text+' selected. Add your details below, then send your inquiry.'}}));
document.querySelectorAll('.faq details').forEach(details=>{let running;details.querySelector('summary').addEventListener('click',event=>{if(paused||!details.animate)return;event.preventDefault();if(running){running.cancel();running=null;details.style.height=''}const start=details.getBoundingClientRect().height,opening=!details.open;details.open=true;const end=opening?details.getBoundingClientRect().height:details.querySelector('summary').getBoundingClientRect().height;running=animate(details,[{height:start+'px'},{height:end+'px'}],{duration:220,easing:'ease-out'});running?.finished.then(()=>{details.open=opening;details.style.height='';running=null}).catch(()=>{})})});
const styleField=$('#style');
const styleNames={restaurant:'Restaurant & hospitality example',professional:'Technology & professional services example'};
const exampleNames={'home-services':'Home services & trades example',salon:'Salon & barber example','home-comfort':'Construction & remodeling example'};
const exampleNotes=Object.values(exampleNames).map(name=>'Design direction: '+name+'.');
function withoutExampleNote(value){return value.split('\n\n').filter(part=>!exampleNotes.includes(part)).join('\n\n')}
function chooseStyle(value){
  if(!Object.hasOwn(styleNames,value))return;
  styleField.value=value;
  $('#message').value=withoutExampleNote($('#message').value);
  $('#form-status').textContent=styleNames[value]+' selected. Tell me about your business below.';
}
function chooseExample(value){
  if(!Object.hasOwn(exampleNames,value))return;
  const message=$('#message'),existing=withoutExampleNote(message.value).trim();
  const note='Design direction: '+exampleNames[value]+'.';
  const next=(existing?existing+'\n\n':'')+note;
  if(next.length>message.maxLength){
    styleField.value='unsure';
    $('#form-status').textContent='Your project notes are full. Shorten them before choosing this design direction.';
    return;
  }
  message.value=next;
  styleField.value=value;
  $('#form-status').textContent=exampleNames[value]+' selected and included in your project notes. Tell me about your business below.';
}
chooseStyle(new URLSearchParams(location.search).get('style'));
chooseExample(new URLSearchParams(location.search).get('example'));
styleField.addEventListener('change',()=>{
  if(Object.hasOwn(exampleNames,styleField.value))chooseExample(styleField.value);
  else if(Object.hasOwn(styleNames,styleField.value))chooseStyle(styleField.value);
  else {$('#message').value=withoutExampleNote($('#message').value);$('#form-status').textContent='Let’s choose a design direction together. Tell me about your business below.'}
});
// Preserve the backend's existing style allowlist. New directions travel in message.
$('#inquiry').addEventListener('formdata',event=>{
  if(Object.hasOwn(exampleNames,event.formData.get('style')))event.formData.set('style','unsure');
});
document.querySelectorAll('[data-style],[data-example]').forEach(link=>link.addEventListener('click',event=>{
  if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  if(link.dataset.example)chooseExample(link.dataset.example);else chooseStyle(link.dataset.style);
  location.hash='contact';
}));
const briefButton=$('#add-brief');if(briefButton){briefButton.hidden=false;briefButton.addEventListener('click',()=>{const selected=[...document.querySelectorAll('[name=website-goal]:checked')].map(input=>input.value);if(!selected.length){$('#brief-status').textContent='Choose at least one goal, or contact Aidan to figure it out together.';return}const message=$('#message'),brief='I’d like my website to help with: '+selected.join(', ')+'.';if(!message.value.includes(brief)){const next=(message.value.trim()?message.value.trim()+'\n\n':'')+brief;if(next.length>message.maxLength){$('#brief-status').textContent='Your project notes are already full. Shorten them before adding these goals.';return}message.value=next;}$('#brief-status').textContent='Your goals have been added to the inquiry below. Nothing has been sent.';$('#form-status').textContent='Your goals are included. Add your contact details, then send your inquiry.';location.hash='contact'})}
$('#year').textContent=new Date().getFullYear();
$('#inquiry').addEventListener('submit',async event=>{event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;const button=form.querySelector('[type=submit]');button.disabled=true;$('#form-status').textContent='Sending your inquiry…';try{const r=await fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form)))});const d=await r.json();if(!r.ok)throw Error(d.error||'Your inquiry could not be sent.');try{sessionStorage.setItem('coastal-inquiry-receipt',JSON.stringify({id:d.receipt,at:Date.now()}))}catch{}form.reset();location.assign('/thank-you/')}catch(err){$('#form-status').textContent=err.message+' You can also call (831) 521-9681 or email sales@coastalwebwork.com.'}finally{button.disabled=false}});
// Enable submission only after the secure JavaScript handler is attached.
$('#inquiry [type=submit]').disabled=false;
})();
