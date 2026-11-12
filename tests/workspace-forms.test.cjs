const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const model = require('../dashboard/workspace-model.js');
function formHarness() {
 const nodes = new Map();
 const node = selector => { if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',disabled:false,showModal(){this.open=true;},close(){this.open=false;}});return nodes.get(selector); };
 const listeners = {};
 const ctx = {URLSearchParams,location:{search:''},query:'',filter:'',today:()=> '2026-11-11',newId:()=> 'workflow-marker',toast(){},window:{CoastalWorkspace:model,CoastalCloud:{connected:()=>true}},document:{querySelector:node,addEventListener:(name,fn)=>{(listeners[name] ||= []).push(fn);}},render(){},settings(){},page:'settings',schemas:{leads:{singular:'lead'},calls:{fields:[['outcome','Outcome','select',['No answer','Interested']]]}},state:{leads:[],calls:[],clients:[],projects:[],tasks:[],transactions:[]},esc:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),editing:null};
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

function clickAction(h, action, key) {
 const attr='data-'+action, property=action.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
 const b={dataset:{[property]:key},hasAttribute:name=>name===attr};
 h.listeners.click[0]({target:{closest:()=>b}});
}
test('Delete client is visible and confirmation can be canceled without changing records',()=>{
 const h=formHarness();h.ctx.state.leads.push({id:'a',business:'Example',stage:'New'});
 clickAction(h,'business','example');assert.ok(h.node('#view').innerHTML.includes('data-delete-business="example"'));
 const before=JSON.stringify(h.ctx.state);clickAction(h,'delete-business','example');assert.equal(h.node('#client-removal').open,true);h.node('#removal-cancel').onclick();assert.equal(h.node('#client-removal').open,false);assert.equal(JSON.stringify(h.ctx.state),before);
});
test('confirmed client deletion saves a recoverable marker, and restoration returns the client',async()=>{
 const h=formHarness();h.ctx.state.leads.push({id:'a',business:'Example',stage:'New'});let saved;
 h.ctx.window.CoastalCloud.queueSave=async next=>{saved=next;return true;};
 clickAction(h,'delete-business','example');await h.node('#client-removal-form').onsubmit({preventDefault(){}});
 assert.equal(saved.leads[0].workflow_deleted,'true');assert.equal(h.ctx.state.leads.length,1);assert.equal(model.project(h.ctx.state)[0].deleted,true);
 clickAction(h,'restore-business','example');await h.node('#client-removal-form').onsubmit({preventDefault(){}});
 assert.equal(saved.leads[0].workflow_deleted,'false');assert.equal(model.project(h.ctx.state)[0].deleted,false);
});
test('failed deletion never removes the client from local state or reports a successful removal',async()=>{
 const h=formHarness();h.ctx.state.leads.push({id:'a',business:'Example',stage:'New'});const before=JSON.stringify(h.ctx.state);let message='';h.ctx.toast=s=>{message=s;};h.ctx.window.CoastalCloud.queueSave=async()=>false;
 clickAction(h,'delete-business','example');await h.node('#client-removal-form').onsubmit({preventDefault(){}});
 assert.equal(JSON.stringify(h.ctx.state),before);assert.equal(h.node('#client-removal').open,true);assert.ok(message.includes('has not been removed'));assert.equal(h.node('#removal-submit').disabled,false);
});
