const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../dashboard/workspace-model.js');
const blank = () => ({leads:[],clients:[],projects:[],calls:[],tasks:[],transactions:[]});
test('unified view preserves every legacy source record and does not infer payments',()=>{
 const data=blank(); data.leads.push({id:'lead',business:'Acme',contact:'Name',stage:'Won'});data.projects.push({id:'project',business:' ACME ',status:'Review',price:'1000'});data.calls.push({id:'call',business:'Acme',outcome:'Do not contact'});data.transactions.push({id:'payment',business:'Acme',amount:'1000',type:'Income'});
 const before=JSON.stringify(data),[b]=model.project(data);
 assert.equal(JSON.stringify(data),before);assert.equal(b.refs.length,4);assert.equal(b.stage,3);assert.equal(b.contact,'Name');assert.equal(b.doNotContact,true);assert.equal(b.metadata,undefined);
});
test('business workflow metadata survives projection and archived businesses stay distinct',()=>{
 const data=blank();data.leads.push({id:'a',business:'Acme',stage:'New',workflow_stage:'Live & care',workflow_waiting:'true',workflow_archived:'true',workflow_next:'Check forms'});
 const [b]=model.project(data);assert.equal(b.stage,4);assert.equal(b.waiting,true);assert.equal(b.inactive,true);assert.equal(b.next,'Check forms');
});
test('portal projects and requests associate by client ID rather than project title',()=>{
 const data=blank(); const portal={accounts:[{id:'a',business_name:'Acme'},{id:'b',business_name:'Other'}],projects:[{id:'p',client_id:'b',name:'Acme',status:'Launched'}]};
 const result=model.project(data,portal);assert.equal(result.find(b=>b.business==='Other').portalProjects[0].id,'p');assert.equal(result.find(b=>b.business==='Acme').portalProjects.length,0);
});
test('same-name records remain intact and ambiguity is marked for review',()=>{
 const data=blank(); data.leads=[{id:'one',business:'Same name'},{id:'two',business:'Same name'}];const [b]=model.project(data);assert.equal(b.ambiguous,true);assert.equal(b.refs.length,2);assert.deepEqual(data.leads.map(r=>r.id),['one','two']);
});
test('multiple projects keep an active build visible rather than implying all work is launched',()=>{
 const data=blank();data.projects=[{id:'a',business:'Acme',status:'Launched'},{id:'b',business:'Acme',status:'Design'}];assert.equal(model.project(data)[0].stage,2);
});
test('external website links reject script URLs, credentials, insecure and malformed addresses',()=>{
 for(const url of ['javascript:alert(1)','data:text/html,test','http://example.com','https://name:pass@example.com','not a url'])assert.equal(model.safeWebsite(url),'');assert.equal(model.safeWebsite('https://example.com/'),'https://example.com/');
});
