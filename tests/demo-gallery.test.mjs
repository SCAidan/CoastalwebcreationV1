import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {publicPath} from '../functions/_server/public-assets.mjs';

const routes=['restaurant','professional','home-services','salon','home-comfort'];
test('each public demo provides honest review placements and an accessible gallery fallback',()=>{
 for(const route of routes){
  const html=readFileSync(new URL(`../templates/${route}.html`,import.meta.url),'utf8');
  assert.match(html,/Google reviews/);assert.match(html,/Yelp reviews/);
  assert.match(html,/Demo placeholder · No reviews connected/);
  assert.match(html,/data-gallery=/);assert.match(html,/Generated sample/);
  assert.match(html,/noindex,follow/);
  assert.doesNotMatch(html,/aggregateRating|ratingValue|reviewCount|<iframe/i);
  for(const [,path] of html.matchAll(/href="(\/assets\/[^\"]+)" data-gallery=/g))assert.ok(publicPath(path),path);
 }
});
test('gallery dialog preserves Escape and close focus, and filters use the same visible state',()=>{
 class El{
  constructor(){this.listeners={};this.dataset={};this.attrs={};this.children=[];this.hidden=false;this.naturalWidth=1000;this.naturalHeight=1250;this.alt='Generated sample';this.href='https://example.test/assets/photo.webp'}
  append(...els){this.children.push(...els)}setAttribute(k,v){this.attrs[k]=v}removeAttribute(k){delete this.attrs[k]}
  addEventListener(k,fn){this.listeners[k]=fn}focus(){this.focused=true}querySelector(){return thumb}
  showModal(){this.open=true}close(){this.open=false;this.listeners.close?.()}
 }
 const thumb=new El(),link=new El();link.dataset.gallery='Texture / Fade';
 const filters=['all','cuts','detail'].map(value=>{const e=new El();e.dataset.galleryFilter=value;return e});
 const figures=['cuts','cuts','detail'].map(value=>{const e=new El();e.dataset.photoCategory=value;return e});
 const gallery=new El(),body=new El();
 const document={body,createElement:()=>new El(),querySelector:()=>gallery,querySelectorAll:s=>s==='a[data-gallery]'?[link]:s==='[data-gallery-filter]'?filters:figures};
 vm.runInNewContext(readFileSync(new URL('../templates/evidence.js',import.meta.url),'utf8'),{document,HTMLDialogElement:class{}});
 let prevented=false;link.listeners.click({preventDefault(){prevented=true}});
 assert.equal(prevented,true);const dialog=body.children[0];assert.equal(dialog.open,true);
 const [close,image,caption]=dialog.children;
 assert.equal(image.src,link.href);assert.equal(image.alt,thumb.alt);assert.equal(caption.textContent,'Texture / Fade');
 close.listeners.click();assert.equal(dialog.open,false);assert.equal(link.focused,true);
 filters[2].listeners.click();assert.deepEqual(figures.map(f=>f.hidden),[true,true,false]);assert.equal(gallery.dataset.filter,'detail');
 assert.equal(filters[2].attrs['aria-pressed'],'true');
 filters[0].listeners.click();assert.deepEqual(figures.map(f=>f.hidden),[false,false,false]);
});
