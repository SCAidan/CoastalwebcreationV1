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

test('client removal retains related calls, projects, payments, and portal access',()=>{
 const data=blank();data.leads=[{id:'a',business:'Acme',stage:'New'}];data.calls=[{id:'call',business:'Acme',notes:'Keep this'}];data.projects=[{id:'p',business:'Acme',status:'Review'}];data.transactions=[{id:'tx',business:'Acme',amount:'100'}];const portal={accounts:[{id:'client',business_name:'Acme',active:true}],projects:[{id:'pp',client_id:'client',status:'Review'}]};
 const before=JSON.stringify(data),b=model.project(data,portal)[0],next=model.withDeleted(data,b,true,'marker');assert.equal(JSON.stringify(data),before);assert.deepEqual(next.calls,data.calls);assert.deepEqual(next.projects,data.projects);assert.deepEqual(next.transactions,data.transactions);assert.equal(portal.accounts[0].active,true);assert.equal(model.project(next,portal)[0].deleted,true);assert.equal(model.project(next,portal).length,1);
});
test('portal-only client can be removed and restored without deleting the account',()=>{
 const data=blank(),portal={accounts:[{id:'client',business_name:'Portal client',active:true}]};const next=model.withDeleted(data,model.project(data,portal)[0],true,'marker');assert.equal(next.leads[0].id,'marker');assert.equal(model.project(next,portal)[0].deleted,true);const restored=model.withDeleted(next,model.project(next,portal)[0],false,'unused');assert.equal(restored.leads.length,1);assert.equal(model.project(restored,portal)[0].deleted,false);assert.equal(portal.accounts[0].active,true);
});

test('restoring a grouped business clears all imported removal markers for that business only',()=>{
 const data=blank();data.leads=[{id:'a',business:'Same',stage:'New',workflow_deleted:'true'},{id:'b',business:'Same',stage:'New',workflow_deleted:'true'},{id:'c',business:'Other',stage:'New',workflow_deleted:'true'}];const b=model.project(data).find(b=>b.business==='Same');const next=model.withDeleted(data,b,false,'unused');assert.equal(model.project(next).find(b=>b.business==='Same').deleted,false);assert.equal(model.project(next).find(b=>b.business==='Other').deleted,true);assert.equal(next.leads.length,3);
});
