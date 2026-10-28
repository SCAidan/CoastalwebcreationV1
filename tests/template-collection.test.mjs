import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Exercise the actual frontend handoff without sending inquiries or notification emails.
const source=readFileSync(new URL('../assets/site.js',import.meta.url),'utf8');
const selectionCode=source.slice(source.indexOf("const styleField=$('#style')"),source.indexOf('const briefButton='));
function setup(search=''){
  const listeners={};
  const fields={
    '#style':{value:'unsure',addEventListener:(name,fn)=>listeners[name]=fn},
    '#message':{value:'',maxLength:3000},
    '#form-status':{textContent:''},
    '#inquiry':{addEventListener:(name,fn)=>listeners[name]=fn}
  };
  const context=vm.createContext({$:id=>fields[id],URLSearchParams,location:{search,hash:''},document:{querySelectorAll:()=>[]}});
  vm.runInContext(selectionCode,context);
  return {fields,listeners,run:code=>vm.runInContext(code,context)};
}
test('new design handoff preserves notes and replaces only the prior generated direction',()=>{
  const {fields,run}=setup();
  fields['#message'].value='Please include my service area.';
  run("chooseExample('home-services')");
  assert.equal(fields['#style'].value,'home-services');
  assert.match(fields['#message'].value,/Please include my service area\./);
  run("chooseExample('salon');chooseExample('salon')");
  assert.equal(fields['#style'].value,'salon');
  assert.equal(fields['#message'].value,'Please include my service area.\n\nDesign direction: Salon & barber example.');
  run("chooseStyle('professional')");
  assert.equal(fields['#message'].value,'Please include my service area.');
  assert.equal(fields['#style'].value,'professional');
});
test('the outgoing FormData remains compatible with the unchanged backend allowlist',()=>{
  const {fields,listeners}=setup('?example=salon');
  const payload=new FormData();
  payload.set('style',fields['#style'].value);
  payload.set('message',fields['#message'].value);
  listeners.formdata({formData:payload});
  assert.equal(payload.get('style'),'unsure');
  assert.match(payload.get('message'),/Salon & barber example/);
  payload.set('style','professional');
  listeners.formdata({formData:payload});
  assert.equal(payload.get('style'),'professional');
});
test('unknown query values and full project notes are handled safely',()=>{
  const {fields,run}=setup('?example=__proto__&style=forged');
  assert.equal(fields['#message'].value,'');
  assert.equal(fields['#style'].value,'unsure');
  fields['#message'].value='x'.repeat(3000);
  run("chooseExample('home-services')");
  assert.equal(fields['#message'].value.length,3000);
  assert.equal(fields['#style'].value,'unsure');
  assert.match(fields['#form-status'].textContent,/notes are full/);
});

test('photo-led example preserves its direction through compatible FormData',()=>{
 const {fields,listeners}=setup('?example=home-comfort');
 assert.equal(fields['#style'].value,'home-comfort');
 assert.match(fields['#message'].value,/Construction & remodeling example/);
 const payload=new FormData();payload.set('style',fields['#style'].value);payload.set('message',fields['#message'].value);
 listeners.formdata({formData:payload});
 assert.equal(payload.get('style'),'unsure');assert.match(payload.get('message'),/Construction & remodeling example/);
});
