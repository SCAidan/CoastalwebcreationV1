import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

function setup(extra={}){
 const before={},after={},controls={hidden:true};
 const range={value:'50',listeners:{},attrs:{},addEventListener(k,fn){this.listeners[k]=fn},setAttribute(k,v){this.attrs[k]=v}};
 const view={dataset:{},listeners:{},styles:{},captured:null,
  style:{setProperty(k,v){view.styles[k]=v}},
  querySelector(s){return s==='.comparison-label-before'?before:after},
  addEventListener(k,fn){this.listeners[k]=fn},
  getBoundingClientRect(){return {left:100,width:400}},setPointerCapture(id){this.captured=id}};
 const comparison={querySelector(s){return s==='[data-comparison-view]'?view:s==='input[type="range"]'?range:controls}};
 const document={getElementById(){return null},querySelectorAll(s){return s==='[data-comparison]'?[comparison]:[]}};
 vm.runInNewContext(readFileSync(new URL('../templates/home-comfort.js',import.meta.url),'utf8'),{document,...extra});
 return {view,range,before,after,controls};
}
test('comparison range exposes full views with accurate labels and bounded values',()=>{
 const {view,range,before,after,controls}=setup();
 assert.equal(controls.hidden,false);assert.equal(view.dataset.ready,'true');
 range.value='0';range.listeners.input();assert.equal(view.styles['--comparison-position'],'0%');assert.equal(before.hidden,true);assert.equal(after.hidden,false);assert.equal(range.attrs['aria-valuetext'],'0% before, 100% after');
 range.value='100';range.listeners.input();assert.equal(after.hidden,true);assert.equal(before.hidden,false);
 range.value='invalid';range.listeners.input();assert.equal(range.value,'50');
});
test('photo dragging tracks only the captured pointer, clamps at edges and stops on cancel',()=>{
 const {view,range}=setup();
 view.listeners.pointerdown({button:2,pointerId:1,clientX:300});assert.equal(view.captured,null);
 view.listeners.pointerdown({button:0,pointerId:7,clientX:200});assert.equal(view.captured,7);assert.equal(range.value,'25');
 view.listeners.pointermove({pointerId:8,clientX:500});assert.equal(range.value,'25');
 view.listeners.pointermove({pointerId:7,clientX:900});assert.equal(range.value,'100');
 view.listeners.pointermove({pointerId:7,clientX:0});assert.equal(range.value,'0');
 view.listeners.pointercancel({pointerId:7});view.listeners.pointermove({pointerId:7,clientX:300});assert.equal(range.value,'0');
});

function animationEnvironment(reduced=false){
 const frames=new Map(),observers=[];let sequence=0;
 const extra={matchMedia:()=>({matches:reduced,addEventListener(){}}),
  requestAnimationFrame(fn){frames.set(++sequence,fn);return sequence},cancelAnimationFrame(id){frames.delete(id)},
  IntersectionObserver:class{constructor(callback){this.callback=callback;observers.push(this)}observe(){}disconnect(){this.disconnected=true}}};
 return {extra,frames,observers,tick(now){const queued=[...frames.values()];frames.clear();queued.forEach(fn=>fn(now))}};
}
test('comparison preview runs one short visible sweep and stops immediately on interaction',()=>{
 const env=animationEnvironment(),{range}=setup(env.extra);const observer=env.observers[0];
 assert.equal(env.frames.size,0);observer.callback([{isIntersecting:true,intersectionRatio:0.8}]);env.tick(0);env.tick(450);assert.equal(range.value,'65');
 range.listeners.focus();assert.equal(env.frames.size,0);range.value='22';range.listeners.input();observer.callback([{isIntersecting:true,intersectionRatio:0.8}]);assert.equal(range.value,'22');assert.equal(env.frames.size,0);
});
test('comparison preview returns to center and reduced-motion users get no automatic movement',()=>{
 const env=animationEnvironment(),{range}=setup(env.extra);env.observers[0].callback([{isIntersecting:true,intersectionRatio:0.8}]);env.tick(0);env.tick(900);env.tick(1800);assert.equal(range.value,'50');assert.equal(env.frames.size,0);env.observers[0].callback([{isIntersecting:true,intersectionRatio:0.8}]);assert.equal(env.frames.size,0);
 const reduced=animationEnvironment(true);const still=setup(reduced.extra);assert.equal(reduced.observers.length,0);assert.equal(reduced.frames.size,0);assert.equal(still.range.value,'50');
});
