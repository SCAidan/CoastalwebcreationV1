/* One view of existing records. Projection never deletes, merges, or rewrites source data. */
(function (root) {
  const stages = ['First contact', 'Planning', 'Building', 'Client review', 'Live & care'];
  const key = value => String(value || '').trim().toLocaleLowerCase('en-US');
  function projectStage(status) {
    return ({Discovery: 1, Design: 2, Review: 3, 'Ready to launch': 3, Launched: 4})[status];
  }
  function project(data, portal = {}) {
    const groups = new Map();
    function add(name, kind, record) {
      if (!key(name)) return;
      const k = key(name);
      if (!groups.has(k)) groups.set(k, {key: k, business: name, refs: [], portalProjects: [], accounts: []});
      const b = groups.get(k);
      if (kind === 'portal') b.portalProjects.push(record);
      else if (kind === 'account') b.accounts.push(record);
      else b.refs.push({kind, record});
    }
    for (const kind of ['leads', 'clients', 'projects', 'calls', 'tasks', 'transactions'])
      for (const r of data[kind] || []) add(r.business, kind, r);
    for (const a of portal.accounts || []) add(a.business_name, 'account', a);
    for (const p of portal.projects || []) {
      const a = (portal.accounts || []).find(a => a.id === p.client_id);
      if (a) add(a.business_name, 'portal', p);
    }
    return [...groups.values()].map(b => {
      const metadata = b.refs.find(x => x.record.workflow_stage)?.record;
      const person = b.refs.find(x => x.record.contact)?.record;
      const statuses = [...b.refs.filter(x => x.kind === 'projects').map(x => projectStage(x.record.status)), ...b.portalProjects.map(x => projectStage(x.status))].filter(x => x !== undefined);
      const lead = b.refs.find(x => x.kind === 'leads')?.record;
      const stage = metadata && stages.includes(metadata.workflow_stage) ? stages.indexOf(metadata.workflow_stage) : statuses.length ? Math.min(...statuses) : lead && ['Meeting', 'Proposal', 'Won'].includes(lead.stage) ? 1 : 0;
      const records = b.refs.map(x => x.record);
      return {...b, stage, contact: person?.contact || '', metadata,
        deleted: b.refs.some(x => x.record.workflow_deleted === 'true'),
        inactive: metadata?.workflow_archived === 'true' || (lead && ['Lost'].includes(lead.stage) && !statuses.length),
        waiting: metadata?.workflow_waiting === 'true',
        next: metadata?.workflow_next || b.portalProjects.find(p => p.next_step)?.next_step || '',
        website: records.find(r => r.website)?.website || b.portalProjects.find(p => p.website_url)?.website_url || '',
        followup: metadata?.followup || lead?.followup || '',
        renewal: records.find(r => r.renewal)?.renewal || '',
        ambiguous: b.accounts.length > 1 || b.refs.filter(x => x.kind === 'leads').length > 1,
        doNotContact: b.refs.some(x => x.kind === 'calls' && x.record.outcome === 'Do not contact'),
      };
    });
  }
  function safeWebsite(value) {
    try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; }
  }
  function withDeleted(data, business, deleted, id) {
    const next = JSON.parse(JSON.stringify(data));
    const ref = business.refs.find(x => x.record.workflow_deleted !== undefined) ||
      business.refs.find(x => x.record === business.metadata) ||
      business.refs.find(x => ['leads','clients','projects'].includes(x.kind));
    let record = ref && next[ref.kind].find(r => r.id === ref.record.id);
    if (!record) {
      record = {id, business: business.business, contact: business.contact || '', stage: 'New', source: 'Other'};
      next.leads.push(record);
    }
    for (const source of business.refs.filter(x => x.record.workflow_deleted !== undefined)) {
      const existing = next[source.kind].find(r => r.id === source.record.id);
      if (existing) existing.workflow_deleted = String(deleted);
    }
    record.workflow_deleted = String(deleted);
    if (!record.workflow_stage) record.workflow_stage = stages[business.stage];
    return next;
  }
  const model = {stages, key, project, safeWebsite, withDeleted};
  root.CoastalWorkspace = model;
  if (typeof module === 'object' && module.exports) module.exports = model;
})(globalThis);
