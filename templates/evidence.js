(() => {
  'use strict';
  const images=document.querySelectorAll('a[data-gallery]');
  if(!images.length || typeof HTMLDialogElement==='undefined')return;
  const dialog=document.createElement('dialog');
  dialog.className='gallery-dialog';
  dialog.setAttribute('aria-label','Sample gallery image');
  const close=document.createElement('button'),image=document.createElement('img'),caption=document.createElement('p'),notice=document.createElement('small');
  close.type='button';close.textContent='Close image';
  notice.textContent='Generated sample imagery for this fictional design example. Not real customer work.';
  dialog.append(close,image,caption,notice);document.body.append(dialog);
  let trigger=null;
  images.forEach(link=>link.addEventListener('click',event=>{
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    const thumbnail=link.querySelector('img') || link.closest('figure')?.querySelector('[data-compare-after]');
    if(!thumbnail)return;
    event.preventDefault();trigger=link;
    image.width=thumbnail.naturalWidth||1200;image.height=thumbnail.naturalHeight||1000;
    image.alt=thumbnail.alt;image.src=link.href;
    caption.textContent=link.dataset.gallery;
    dialog.showModal();close.focus();
  }));
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{image.removeAttribute('src');trigger?.focus()});
  const filters=document.querySelectorAll('[data-gallery-filter]');
  filters.forEach(button=>{button.hidden=false;button.addEventListener('click',()=>{
    const value=button.dataset.galleryFilter;
    if(!['all','cuts','detail'].includes(value))return;
    filters.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
    const gallery=document.querySelector('.barber-gallery');if(gallery)gallery.dataset.filter=value;
    document.querySelectorAll('[data-photo-category]').forEach(figure=>{figure.hidden=value!=='all'&&figure.dataset.photoCategory!==value});
  })});
})();
