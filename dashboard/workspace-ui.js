/* Uses the existing owner workspace and portal APIs; account isolation stays server-side. */
(() => {
  const model = window.CoastalWorkspace, legacyRender = render, legacySettings = settings;
  const stageNames = model.stages;
  let portal = {accounts: [], projects: [], requests: [], inquiries: []}, portalReady = false, portalError = '', selected = '', boardMode = true, requestFilter = 'Open', refreshing = false;
  const nav = [['overview','Overview'],['businesses','Businesses'],['requests','Requests'],['sites','Live websites'],['transactions','Money'],['settings','Settings & backup']];
  const attr = s => esc(s);
  const tag = (s, warning=false) => `<span class="pill ${warning?'warning':''}">${esc(s)}</span>`;
  const button = (label, name, value='') => `<button type="button" data-${name}="${attr(value)}">${esc(label)}</button>`;
  const all = () => model.project(state, portal);
  const find = () => all().find(b=>b.key===selected);
  const empty = t => `<div class="empty">${esc(t)}</div>`;
  const ownerLinks = () => `<a href="/dashboard/portal">Manage client access & portal projects</a>`;
  async function portalAPI(body) {
    const response = await fetch('/api/portal', body ? {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : {});
    const data = await response.json();
    if(response.status===401) location.replace('/login/?owner=1');
    if(!response.ok) throw Error(data.error || 'Unable to load client requests.');
    if(!body && data.role!=='owner') throw Error('Owner access required.');
    return data;
  }
  async function loadPortal() {
    if(refreshing) return;
    refreshing = true;
    try { portal = await portalAPI(); portalReady = true; portalError = ''; }
    catch(e) { portalError = e.message; }
    finally {refreshing = false; render();}
  }
  function portalNotice() {
    if(portalError) return `<div class="notice warning">${esc(portalError)} ${button('Retry','refresh-requests')}</div>`;
    if(!portalReady) return '<div class="notice">Loading client requests…</div>';
    return '';
  }
  function requestBusiness(r) {
    const project = portal.projects.find(p=>p.id===r.project_id);
    const account = portal.accounts.find(a=>a.id===project?.client_id);
    return account?.business_name || project?.name || 'Client project';
  }
  function requestCard(r, full=false) {
    return `<article class="workspace-request"><div class="panel-top"><small>${esc(requestBusiness(r))}</small>${tag(r.status,r.status==='New')}</div><h3>${esc(r.title)}</h3><p class="preserve-lines">${esc(r.body)}</p>${full?`<form data-request-reply="${attr(r.id)}"><label>Request status<select name="status">${['New','In progress','Waiting for you','Completed'].map(s=>`<option ${r.status===s?'selected':''}>${s}</option>`).join('')}</select></label><label>Reply visible to the client<textarea name="owner_reply" maxlength="4000">${esc(r.owner_reply||'')}</textarea></label><p class="money-note">“Waiting for you” means waiting for the client. Saving a reply updates their portal.</p><button class="primary">Save status & reply</button></form>`:`${r.owner_reply?`<p><b>Your reply:</b> ${esc(r.owner_reply)}</p>`:''}${button('Open requests','nav','requests')}`}</article>`;
  }
  function businessRow(b) {
    return `<div class="business-row"><div>${button(b.business,'business',b.key)}<small>${esc(b.contact || 'Contact not added')}</small></div>${tag(stageNames[b.stage])}<small>${esc(b.next || 'Set the next action')}${b.waiting?' · Waiting on client':''}${b.doNotContact?' · Do not contact':''}</small></div>`;
  }
  function overviewPage() {
    const businesses=all().filter(b=>!b.inactive), requests=portal.requests.filter(r=>r.status!=='Completed');
    const due=businesses.filter(b=>!b.doNotContact&&b.followup&&b.followup<=today());
    $('#stats').innerHTML = [[portalReady?requests.length:'—','Client requests',portalReady?'Open changes from client portals':'Not loaded'],[businesses.filter(b=>b.stage<4).length,'Websites in progress','From the first call to review'],[businesses.filter(b=>b.waiting).length,'Waiting on clients','Content, feedback, or approval'],[businesses.filter(b=>b.stage===4).length,'Live websites','Care and performance']].map(([n,t,s])=>`<div class="stat"><small>${t}</small><strong>${n}</strong><span>${s}</span></div>`).join('');
    $('#view').innerHTML=`${portalNotice()}<div class="workspace-columns"><section class="panel"><div class="panel-top"><h2>What clients want changed</h2>${button('Refresh','refresh-requests')}</div>${requests.length?requests.slice(0,3).map(r=>requestCard(r)).join(''):empty(portalReady?'No open client requests.':'Requests have not loaded yet.')}</section><section class="panel"><h2>Move something forward</h2>${due.length?due.map(b=>`<div class="task"><div><b>${esc(b.business)}</b><small>Follow up · ${esc(b.followup)}</small></div>${button('Open','business',b.key)}</div>`).join(''):empty('No follow-ups due today.')}<h3>Waiting on clients</h3>${businesses.filter(b=>b.waiting).slice(0,3).map(b=>`<div class="task"><div><b>${esc(b.business)}</b><small>${esc(b.next||'Ask for the next item')}</small></div>${button('Open','business',b.key)}</div>`).join('')||empty('Nothing marked as waiting.')}<p>${button('All tasks','nav','tasks')}</p></section></div><section class="panel"><div class="panel-top"><h2>Where every website stands</h2>${button('All businesses','nav','businesses')}</div>${businesses.slice(0,6).map(businessRow).join('')||empty('Add a name and business to get started.')}</section>${portalReady&&portal.inquiries.some(i=>i.status==='New')?`<section class="panel"><h2>New website inquiries</h2>${portal.inquiries.filter(i=>i.status==='New').map(i=>`<div class="workspace-request"><h3>${esc(i.business||i.name)}</h3><p>${esc(i.message)}</p>${ownerLinks()}</div>`).join('')}</section>`:''}`;
  }
  function businessesPage() {
    const businesses=all().filter(b=>(filter==='Archived'?b.inactive:!b.inactive) && `${b.business} ${b.contact}`.toLowerCase().includes(query.toLowerCase()));
    $('#view').innerHTML=`<section class="panel"><div class="toolbar"><input id="business-search" aria-label="Search businesses or people" placeholder="Search businesses or people…" value="${attr(query)}"><select id="business-filter" aria-label="Active or archived businesses"><option ${filter!=='Archived'?'selected':''}>Active</option><option ${filter==='Archived'?'selected':''}>Archived</option></select>${button(boardMode?'List view':'Board view','board-mode')}</div>${boardMode?`<div class="business-board">${stageNames.map((s,i)=>`<section class="board-lane"><h2>${s} <small>${businesses.filter(b=>b.stage===i).length}</small></h2>${businesses.filter(b=>b.stage===i).map(b=>`<button class="business-card" data-business="${attr(b.key)}"><b>${esc(b.business)}</b><small>${esc(b.contact||'Contact not added')}</small>${b.waiting?tag('Waiting on client',true):''}${b.doNotContact?tag('Do not contact',true):''}<span>${esc(b.next||'Set the next action')}</span></button>`).join('')||'<p class="money-note">No businesses here.</p>'}</section>`).join('')}</div>`:businesses.map(businessRow).join('')||empty('No matching businesses.')}<p class="money-note">Existing records are grouped by their exact business name for this view. Original records and histories are retained.</p></section>`;
    $('#business-search').oninput=e=>{const pos=e.target.selectionStart;query=e.target.value;businessesPage();$('#business-search').focus();$('#business-search').setSelectionRange(pos,pos)};
    $('#business-filter').onchange=e=>{filter=e.target.value;businessesPage()};
  }
  function metadata(b) {
    let record=b.refs.find(x=>x.record.workflow_stage)?.record || b.refs.find(x=>x.kind==='leads')?.record || b.refs.find(x=>x.kind==='clients')?.record || b.refs.find(x=>x.kind==='projects')?.record;
    if(!record){record={id:newId(),business:b.business,contact:b.contact,stage:'New',source:'Other'};state.leads.push(record);}
    return record;
  }
  function detailPage() {
    const b=find(); if(!b){go('businesses');return;}
    const meta=b.metadata||{}, website=model.safeWebsite(b.website);
    const projectIds=b.portalProjects.map(p=>p.id);
    const checks=['Scope agreed','Agreement recorded','Payment verified','Content collected','Client approval','Launched and handed off'];
    $('#view').innerHTML=`<div class="toolbar">${button('← Businesses','nav','businesses')}${tag(stageNames[b.stage])}${b.waiting?tag('Waiting on client',true):''}${b.doNotContact?tag('Do not contact',true):''}</div>${b.ambiguous?'<div class="notice warning">Multiple records use this business name. Review the original records below before changing shared workflow details.</div>':''}<div class="workspace-columns"><section class="panel"><h2>${esc(b.business)}</h2><p>${esc(b.contact)}</p><form id="workflow-form"><label>Website stage<select name="workflow_stage">${stageNames.map((s,i)=>`<option ${b.stage===i?'selected':''}>${s}</option>`).join('')}</select></label><label>Website URL (optional, HTTPS)<input type="url" name="website" value="${attr(b.website)}" maxlength="300"></label><label>Domain / hosting renewal<input type="date" name="renewal" value="${attr(b.renewal)}"></label><label>Next action<input name="workflow_next" value="${attr(b.next)}" maxlength="300"></label><label>Next follow-up<input type="date" name="followup" value="${attr(b.followup)}"></label><label class="check-row"><input type="checkbox" name="workflow_waiting" ${b.waiting?'checked':''}>Waiting on the client</label><label class="check-row"><input type="checkbox" name="workflow_archived" ${b.inactive?'checked':''}>Archive this business</label><h3>Website checklist</h3>${checks.map((s,i)=>`<label class="check-row"><input type="checkbox" name="workflow_check_${i}" ${meta['workflow_check_'+i]==='true'?'checked':''}>${s}</label>`).join('')}<p class="money-note">Workflow notes are private. Client-visible project status is managed in the portal project below. Checklist items are manually verified.</p><button class="primary">Save workflow</button></form><h3>Calls and notes</h3>${b.refs.filter(x=>x.kind==='calls').map(x=>`<div class="task"><div><b>${esc(x.record.outcome)}</b><small>${esc(x.record.date)} · ${esc(x.record.notes)}</small></div>${button('Edit','edit','calls:'+x.record.id)}</div>`).join('')||empty('No calls recorded yet.')}<form id="business-call-form"><label>Call outcome<select name="outcome">${schemas.calls.fields.find(f=>f[0]==='outcome')[3].map(s=>`<option>${s}</option>`).join('')}</select></label><label>Conversation notes<textarea name="notes" maxlength="4000" required></textarea></label><label>Next follow-up (optional)<input name="followup" type="date"></label><button>Save call</button></form></section><div><section class="panel"><h2>Business details</h2>${website?`<a href="${attr(website)}" target="_blank" rel="noopener">Open website ↗</a>`:'<p>No live website added yet.</p>'}<h3>Original records</h3>${b.refs.map(x=>`<div class="task"><div><b>${esc(schemas[x.kind].singular)}</b><small>${esc(x.record.name||x.record.contact||x.record.date||'Business record')}</small></div>${button('Edit','edit',x.kind+':'+x.record.id)}</div>`).join('')}${b.portalProjects.map(p=>`<details><summary>Client-visible project: ${esc(p.name)} · ${esc(p.status)}</summary><form data-portal-project="${attr(p.id)}"><label>Client-visible status<select name="status">${['Discovery','Design','Review','Ready to launch','Launched','On hold'].map(s=>`<option ${p.status===s?'selected':''}>${s}</option>`).join('')}</select></label><label>Next step visible to client<textarea name="next_step" maxlength="2000">${esc(p.next_step||'')}</textarea></label><button>Save client-visible project</button></form></details>`).join('')}<p>${ownerLinks()}</p>${button('Add a task','business-task',b.key)} ${button('Record payment','business-payment',b.key)}</section><section class="panel"><h2>Client change requests</h2>${portal.requests.filter(r=>projectIds.includes(r.project_id)).map(r=>requestCard(r)).join('')||empty('No linked requests. Portal projects are associated through their client account.')}<p class="money-note">Requests refresh when you open Requests or press Refresh.</p></section></div></div>`;
    $('#workflow-form').onsubmit=async e=>{e.preventDefault();const submit=e.target.querySelector('button');submit.disabled=true;const values=Object.fromEntries(new FormData(e.target));if(values.website&&!model.safeWebsite(values.website)){toast('Use a complete HTTPS website address.');submit.disabled=false;return;}const record=metadata(b);for(const k of ['workflow_stage','workflow_next','followup','website','renewal'])record[k]=String(values[k]||'');for(const k of ['workflow_waiting','workflow_archived',...checks.map((_,i)=>'workflow_check_'+i)])record[k]=String(values[k]==='on');const ok=await save();render();toast(ok?'Workflow saved.':'Not saved. Export a backup before closing.');};
    $('#business-call-form').onsubmit=async e=>{e.preventDefault();const submit=e.target.querySelector('button');submit.disabled=true;const values=Object.fromEntries(new FormData(e.target));state.calls.push({...values,business:b.business,id:newId(),date:today()});if(values.followup)metadata(b).followup=values.followup;const ok=await save();render();toast(ok?'Call recorded.':'Not saved. Export a backup before closing.');};
  }
  function requestsPage() {
    const list=portal.requests.filter(r=>requestFilter==='All'||(requestFilter==='Open'?r.status!=='Completed':r.status===requestFilter));
    $('#view').innerHTML=`${portalNotice()}<div class="toolbar">${['Open','New','In progress','Waiting for you','Completed','All'].map(s=>`<button data-request-filter="${s}" aria-pressed="${s===requestFilter}">${s==='Waiting for you'?'Waiting on client':s}</button>`).join('')}${button('Refresh','refresh-requests')}</div>${list.map(r=>`<section class="panel">${requestCard(r,true)}</section>`).join('')||empty(portalReady?'No requests in this view.':'Requests are not loaded yet.')}`;
  }
  function sitesPage() {
    $('#view').innerHTML=`<p class="notice">Analytics has not been connected to this workspace. Missing numbers stay labeled; they are not reported as zero visits.</p>${all().filter(b=>b.stage===4&&!b.inactive).map(b=>`<section class="panel"><div class="panel-top"><h2>${esc(b.business)}</h2>${button('Open business','business',b.key)}</div>${model.safeWebsite(b.website)?`<a href="${attr(model.safeWebsite(b.website))}" target="_blank" rel="noopener">Open website ↗</a>`:'<p>Website address not recorded.</p>'}<div class="site-metrics">${[['Visits · last 30 days','Not connected'],['Website inquiries','Not connected'],['Site & form checks','Not checked'],['Next renewal',b.renewal||'Add date']].map(([k,v])=>`<div><small>${k}</small><b>${esc(v)}</b></div>`).join('')}</div></section>`).join('')||empty('Move a website to Live & care to see it here.')}`;
  }
  function addBusiness() {
    editing={kind:'leads'};
    $('#dialog-title').textContent='Add a business';
    $('#fields').innerHTML='<label>Name *<input name="contact" required maxlength="300" autocomplete="name"></label><label>Business *<input name="business" required maxlength="300" autocomplete="organization"></label><input type="hidden" name="stage" value="New"><input type="hidden" name="source" value="Other"><input type="hidden" name="workflow_stage" value="First contact"><details><summary>Optional details</summary><label>Email<input name="email" type="email" maxlength="254"></label><label>Phone<input name="phone" type="tel" maxlength="300"></label><label>Website URL (optional, HTTPS)<input type="url" name="website" value="" maxlength="300"></label><label>Domain / hosting renewal<input type="date" name="renewal" value=""></label><label>Next action<input name="workflow_next" maxlength="300"></label><label>Next follow-up<input name="followup" type="date"></label><label>Notes<textarea name="notes" maxlength="4000"></textarea></label></details>';
    document.querySelector('#record-form button[type=submit]').textContent='Save business';$('#editor').showModal();
  }
  settings=()=>{legacySettings();$('#view').insertAdjacentHTML('beforeend',`<section class="panel"><h2>Original records & tools</h2><p>Your existing records remain available for review, editing, and backups.</p><div class="toolbar">${Object.entries(schemas).map(([k,v])=>button(v.label,'nav',k)).join('')}</div>${ownerLinks()}<details><summary>Assistant & cash flow</summary><div class="grid"></div></details></section>`);};
  render=()=>{
    if(['businesses','business','requests','sites','overview'].includes(page)){
      $('#stats').innerHTML='';$('#add').hidden=false;
      $('#title').textContent=({overview:'Your day, at a glance',businesses:'Every business. One place.',business:find()?.business||'Business',requests:'Client requests',sites:'How your live sites are doing'})[page];
      ({overview:overviewPage,businesses:businessesPage,business:detailPage,requests:requestsPage,sites:sitesPage})[page]();
    }else legacyRender();
    $('#nav').innerHTML=nav.map(([k,label])=>`<button data-nav="${k}" class="${page===k||(page==='business'&&k==='businesses')?'active':''}" ${page===k?'aria-current="page"':''}>${label}</button>`).join('');
    $('#add').textContent=page==='transactions'?'+ Record payment':'+ Add business';$('#add').onclick=()=>page==='transactions'?openEditor('transactions'):addBusiness();
    if(!window.CoastalCloud?.connected())$('#add').disabled=true;else $('#add').disabled=false;
  };
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-business')){selected=b.dataset.business;page='business';render();}
    if(b.hasAttribute('data-board-mode')){boardMode=!boardMode;businessesPage();}
    if(b.hasAttribute('data-refresh-requests')||b.dataset.nav==='requests')loadPortal();
    if(b.hasAttribute('data-request-filter')){requestFilter=b.dataset.requestFilter;requestsPage();}
    for(const [a,kind] of [['businessTask','tasks'],['businessPayment','transactions']])if(b.dataset[a]){selected=b.dataset[a];const business=find();openEditor(kind);$('#record-form').elements.namedItem('business').value=business.business;}
  });
  document.addEventListener('submit',async e=>{
    const projectForm=e.target.closest('[data-portal-project]');if(projectForm){e.preventDefault();const submit=projectForm.querySelector('button');submit.disabled=true;const p=portal.projects.find(x=>x.id===projectForm.dataset.portalProject);try{await portalAPI({action:'project',id:p.id,client_id:p.client_id,name:p.name,due_date:p.due_date,website_url:p.website_url,...Object.fromEntries(new FormData(projectForm))});await loadPortal();toast('Client-visible project saved.');}catch(err){toast(err.message);submit.disabled=false;}return;}
    const form=e.target.closest('[data-request-reply]');if(!form)return;e.preventDefault();const submit=form.querySelector('button');submit.disabled=true;
    try{await portalAPI({action:'reply',id:form.dataset.requestReply,...Object.fromEntries(new FormData(form))});await loadPortal();toast('Request saved to the client portal.');}catch(err){toast(err.message);submit.disabled=false;}
  });
  render();
  document.addEventListener('coastal:ready',loadPortal);
  document.addEventListener('coastal:signed-out',()=>{portal={accounts:[],projects:[],requests:[],inquiries:[]};portalReady=false;portalError='';});
})();
