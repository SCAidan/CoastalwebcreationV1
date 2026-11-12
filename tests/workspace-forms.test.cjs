const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const model = require('../dashboard/workspace-model.js');
function formHarness() {
 const nodes = new Map();
 const node = selector => { if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',disabled:false,showModal(){this.open=true;}});return nodes.get(selector); };
 const listeners = {};
 const ctx = {window:{CoastalWorkspace:model,CoastalCloud:{connected:()=>true}},document:{querySelector:node,addEventListener:(name,fn)=>{(listeners[name] ||= []).push(fn);}},render(){},settings(){},page:'settings',schemas:{leads:{singular:'lead'},calls:{fields:[['outcome','Outcome','select',['No answer','Interested']]]}},state:{leads:[],calls:[],clients:[],projects:[],tasks:[],transactions:[]},esc:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),editing:null};
 ctx.$=node;
 vm.runInNewContext(fs.readFileSync(require.resolve('../dashboard/workspace-ui.js'),'utf8'),ctx);
 node('#add').onclick();
 return {html:node('#fields').innerHTML,node,ctx,listeners};
}
test('actual new-business form leaves optional website and renewal empty, with no literal code placeholders',()=>{
 const {html}=formHarness();
 assert.ok(!html.includes('${'), 'unexpanded code must never become an input value');
 for(const name of ['website','renewal']){
  const input=html.match(new RegExp('<input\\b[^>]*name="'+name+'"[^>]*>'))?.[0];
  assert.ok(input,name+' input exists');
  assert.ok(!/\brequired(?:\s|=|>)/.test(input),name+' is optional');
  assert.ok(!input.includes('value=') || /value=""/.test(input),name+' starts empty');
 }
});
test('name and business remain the required quick-add fields',()=>{
 const {html}=formHarness();
 for(const name of ['contact','business'])assert.match(html,new RegExp('<input\\b[^>]*name="'+name+'"[^>]*\\brequired\\b'));
});

test('actual business update form also accepts an empty website without requiring any URL',()=>{
 const {node,ctx,listeners}=formHarness();
 ctx.state.leads.push({id:'sample',business:'New client',contact:'Sample contact',stage:'New',workflow_stage:'First contact',website:''});
 const b={dataset:{business:'new client'},hasAttribute:name=>name==='data-business'};
 listeners.click[0]({target:{closest:()=>b}});
 const form=node('#view').innerHTML.match(/<form id="workflow-form">([\s\S]*?)<\/form>/)?.[1];
 assert.ok(form,'actual workflow form rendered');
 const input=form.match(/<input\b[^>]*name="website"[^>]*>/)?.[0];
 assert.ok(input);assert.match(input,/value=""/);assert.ok(!/\brequired\b/.test(input));
});
