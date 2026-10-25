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
const menu=$('.menu-toggle'),links=$('#nav-links'),small=window.matchMedia('(max-width:800px)');
function updateMenu(){if(!menu||!links)return;menu.hidden=!small.matches;links.classList.toggle('is-collapsed',small.matches);menu.setAttribute('aria-expanded',String(!small.matches));menu.textContent='Menu'}
if(menu){updateMenu();small.addEventListener?.('change',updateMenu);menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Close menu':'Menu';links.classList.toggle('is-collapsed',!open)});links.addEventListener('click',event=>{if(event.target.closest('a')&&small.matches)updateMenu()});links.addEventListener('keydown',event=>{if(event.key==='Escape'){updateMenu();menu.focus()}})}
document.querySelectorAll('[data-service]').forEach(link=>link.addEventListener('click',()=>{const field=$('#service');field.value=link.dataset.service;$('#form-status').textContent=field.selectedOptions[0].text+' selected. Add your details below, then prepare an email.'}));
document.querySelectorAll('.faq details').forEach(details=>{let running;details.querySelector('summary').addEventListener('click',event=>{if(paused||!details.animate)return;event.preventDefault();if(running){running.cancel();running=null;details.style.height=''}const start=details.getBoundingClientRect().height,opening=!details.open;details.open=true;const end=opening?details.getBoundingClientRect().height:details.querySelector('summary').getBoundingClientRect().height;running=animate(details,[{height:start+'px'},{height:end+'px'}],{duration:220,easing:'ease-out'});running?.finished.then(()=>{details.open=opening;details.style.height='';running=null}).catch(()=>{})})});
$('#year').textContent=new Date().getFullYear();
$('#inquiry').addEventListener('submit',event=>{event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;const data=new FormData(form);const body=`Name: ${data.get('name')}\nEmail: ${data.get('email')}\nBusiness: ${data.get('business')||'Not provided'}\nHelp with: ${$('#service').selectedOptions[0].text}\n\n${data.get('message')}`;const subject='Website inquiry'+(data.get('business')?': '+data.get('business'):'');window.location.href='mailto:aidan1465@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);$('#form-status').textContent='Your email draft is prepared. Review it and press Send in your email app. Nothing has been sent or saved by this website. If no email app opens, email aidan1465@gmail.com directly.'});
})();
