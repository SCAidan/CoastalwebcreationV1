/* Deterministic action drafts. No model output can execute writes. */
(function(root){
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function dateFrom(text,now=new Date()){
 const explicit=text.match(/\b(\d{4}-\d{2}-\d{2})\b/);if(explicit){const [y,m,d]=explicit[1].split('-').map(Number),v=new Date(y,m-1,d,12);return iso(v)===explicit[1]?{value:explicit[1],label:explicit[1]}:{error:'That date is not valid. Use YYYY-MM-DD.'}}
 const d=new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);if(/\btomorrow\b/i.test(text)){d.setDate(d.getDate()+1);return{value:iso(d),label:'tomorrow'}}if(/\btoday\b/i.test(text))return{value:iso(d),label:'today'};
 const days=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];const re=/\b(next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i,m=text.match(re);if(m){let delta=(days.indexOf(m[2].toLowerCase())-d.getDay()+7)%7;if(m[1]&&delta===0)delta=7;d.setDate(d.getDate()+delta);return{value:iso(d),label:m[0]}}return{};
}
const trim=s=>s.trim().replace(/^[\s,:;"“]+|[\s,;.!"”]+$/g,'');
function parse(text,state,now=new Date()){
 const q=text.trim();if(!/^(add|create|log|set|schedule|remind|follow\s+up|update)\b/i.test(q))return null;
 if(/^(delete|remove)\b/i.test(q))return null;
 if(q.length>1200)return{error:'Keep an action under 1,200 characters.'};
 const date=dateFrom(q,now);if(date.error)return{error:date.error};
 const notes=(q.match(/\bnotes?\s*:\s*([\s\S]+)$/i)||[])[1]||'';
 const main=q.replace(/\bnotes?\s*:[\s\S]+$/i,'').trim();
 const cleanName=s=>trim(s.replace(/\s*(?:[,;]|\b(?:and\s+)?(?:remind|follow\s*up|call|on|by|due|email|phone|contact|value)\b)[\s\S]*$/i,''));
 let m=main.match(/^(?:add|create)\s+(?:a\s+)?(?:new\s+)?lead\s+(?:for\s+)?(.+)$/i)||main.match(/^(?:add|create)\s+(.+?)\s+as\s+(?:a\s+)?(?:new\s+)?lead\b/i);
 if(m){const business=cleanName(m[1]);if(!business)return{error:'Include a business name, for example: Add Coastal Painting as a lead.'};const matches=state.leads.filter(l=>l.business.trim().toLowerCase()===business.toLowerCase());if(matches.length)return{error:'A lead named “'+business+'” already exists. Open Leads to review it, or ask to set its follow-up.'};const email=(main.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)||[])[0]||'',phone=(main.match(/\bphone\s*:?\s*([+\d() .-]{7,25})/i)||[])[1]||'';const values={business,stage:'New',source:'Other',email,phone:trim(phone),notes};if(date.value)values.followup=date.value;return{kind:'leads',values,title:'New lead',explanation:date.value?'Follow-up: '+date.value+' (your local calendar).':'No follow-up date supplied. You can add one in review.'}}
 m=main.match(/^(?:add|create)\s+(?:a\s+)?(?:new\s+)?task\s*:?\s*(.+)$/i);if(m){const name=trim(m[1].replace(/\s+(?:due|by|on)\s+(?:next\s+)?(?:\d{4}-\d{2}-\d{2}|today|tomorrow|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b.*$/i,''));if(!name)return{error:'Include the task name.'};return{kind:'tasks',values:{name,status:'To do',due:date.value||'',notes},title:'New task',explanation:date.value?'Due '+date.value:'No due date supplied.'}}
 m=main.match(/^log\s+(?:a\s+)?call\s+(?:with|to|for)\s+(.+)$/i);if(m){const business=trim(m[1].replace(/\s*(?:[,;]|\boutcome\s*:|\bon\s+(?:\d{4}|today|tomorrow))[\s\S]*$/i,''));if(!business)return{error:'Include the business you called.'};return{kind:'calls',values:{business,date:date.value||iso(now),notes:notes||'',outcome:''},title:'Call log',explanation:'Choose the actual call outcome in the review form. No call will be placed.'}}
 m=main.match(/^(?:set|schedule|update)\s+(?:a\s+)?follow[- ]?up\s+(?:for|with)\s+(.+?)\s+(?:on|for|to)\s+(.+)$/i)||main.match(/^remind\s+me\s+to\s+call\s+(.+?)\s+(?:on\s+)?(today|tomorrow|(?:next\s+)?(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)|\d{4}-\d{2}-\d{2})[.!]?$/i)||main.match(/^follow\s+up\s+with\s+(.+?)\s+(?:on\s+)?(today|tomorrow|(?:next\s+)?(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)|\d{4}-\d{2}-\d{2})[.!]?$/i);
 if(m){if(!date.value)return{error:'Specify a day or date for the follow-up.'};const name=trim(m[1]),matches=state.leads.filter(l=>l.business.trim().toLowerCase()===name.toLowerCase());if(!matches.length)return{error:'No exact lead match for “'+name+'”. Use its full business name, or add it as a lead first.'};if(matches.length>1)return{error:'More than one lead has that name. Open Leads and choose the correct record manually.'};return{kind:'leads',id:matches[0].id,values:{followup:date.value},title:'Update follow-up',explanation:name+' · '+(matches[0].followup||'no date')+' → '+date.value+'. This creates an in-app reminder, not an email or phone notification.'}}
 return{error:'I can prepare a lead, task, call log or lead follow-up. Try “Add Coastal Painting as a lead”, “Add task Review homepage by Friday”, “Log a call with Coastal Painting”, or “Set follow-up for Coastal Painting on Friday”. Other actions are not supported yet.'};
}
root.CoastalActions={parse,dateFrom};if(typeof module!=='undefined')module.exports=root.CoastalActions;
})(typeof window!=='undefined'?window:globalThis);
