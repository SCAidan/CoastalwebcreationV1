import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
const source=(await readFile(new URL('../setup/functions/notification-dispatch/index.ts',import.meta.url),'utf8')).replace(/Deno\.serve\([\s\S]*$/,'');
const {handle,emailPayload}=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
const token='a'.repeat(64), digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),v=>v.toString(16).padStart(2,'0')).join('');
const env={SUPABASE_URL:'https://db.test',SUPABASE_SERVICE_ROLE_KEY:'service-fixture',RESEND_API_KEY:'mail-fixture'};
const req=(auth='Bearer '+token,method='POST')=>new Request('https://worker.test',{method,headers:{Authorization:auth}});
const job={id:'11111111-1111-4111-8111-111111111111',claim_token:'claim',kind:'inquiry_owner',payload:{to:'sales@coastalwebwork.com',reply_to:'client@example.test',subject:'New inquiry',text:'Plain text <script>not HTML</script>'}};
const response=(data,status=200)=>new Response(JSON.stringify(data),{status});
test('notification worker boundaries and delivery',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);let calls=[],options={};
 function mock(o={}) {calls=[];options=o;globalThis.fetch=async(url,init)=>{calls.push({url,init});
  if(url.endsWith('/notification_dispatch_settings'))return response({enabled:!options.disabled,token_hash:options.wrongToken?'b'.repeat(64):digest});
  if(url.endsWith('/claim_notification_jobs'))return response(options.jobs||[job]);
  if(url.endsWith('/finish_notification_job'))return response(!options.lostLease);
  if(url==='https://api.resend.com/emails') {if(options.timeout)throw Error('sensitive details');return response(options.malformed?{}:{id:'email-fixture'},options.status||200);}
  throw Error('unexpected fetch');
 };}
 await t.test('unauthenticated and invalid methods never touch database or mail',async()=>{for(const r of [req(''),req('Bearer forged'),req(undefined,'GET')]){mock();assert.ok((await handle(r,env)).status>=400);assert.equal(calls.length,0);}});
 await t.test('well formed wrong token cannot claim or send',async()=>{mock({wrongToken:true});assert.equal((await handle(req(),env)).status,401);assert.equal(calls.length,1);});
 await t.test('missing key cannot claim jobs',async()=>{mock();assert.equal((await handle(req(),{...env,RESEND_API_KEY:''})).status,503);assert.equal(calls.length,0);});
 await t.test('disabled worker reports configuration without sending',async()=>{mock({disabled:true});assert.deepEqual(await (await handle(req(),env)).json(),{configured:true,enabled:false});assert.equal(calls.length,1);});
 await t.test('saved job uses fixed sender, reply-to and stable idempotency key',async()=>{mock();const r=await handle(req(),env,async()=>{});assert.deepEqual(await r.json(),{processed:1,sent:1,failed:0});const sent=calls.find(c=>c.url==='https://api.resend.com/emails');assert.equal(sent.init.headers['Idempotency-Key'],'coastal-notification/'+job.id);const p=JSON.parse(sent.init.body);assert.equal(p.from,'Coastal Web Works <updates@notify.coastalwebwork.com>');assert.deepEqual(p.to,['sales@coastalwebwork.com']);assert.equal(p.reply_to,'client@example.test');assert.equal(p.html,undefined);assert.equal(JSON.parse(calls.at(-1).init.body).message_id,'email-fixture');assert.equal(r.headers.get('Cache-Control'),'no-store');assert.ok(!(await handle(req(),env,async()=>{})).headers.has('Access-Control-Allow-Origin'));});
 await t.test('all four event types are accepted',()=>{for(const kind of ['inquiry_owner','inquiry_confirmation','request_owner','request_update'])assert.ok(emailPayload({...job,kind}));});
 await t.test('header injection, arbitrary sender and forged owner destination rejected',()=>{for(const payload of [{...job.payload,to:'sales@coastalwebwork.com\r\nBcc: victim@example.test'},{...job.payload,subject:'hello\nBcc:'},{...job.payload,reply_to:'x@example.test\r\n'},{...job.payload,to:'victim@example.test'}])assert.throws(()=>emailPayload({...job,payload}));assert.equal(emailPayload({...job,payload:{...job.payload,from:'attacker@example.test'}}).from,'Coastal Web Works <updates@notify.coastalwebwork.com>');});
 await t.test('transient errors, ambiguous successes and timeouts remain retryable',async()=>{for(const o of [{status:500},{timeout:true},{malformed:true},{status:409}]){mock(o);const r=await handle(req(),env,async()=>{});assert.equal(r.status,200);assert.equal(JSON.parse(calls.at(-1).init.body).outcome,'retry');assert.ok(!JSON.stringify(await r.json()).includes('private'));}});
 await t.test('rate limit stops batch and requests shared cooldown',async()=>{mock({status:429,jobs:[job,{...job,id:'second'}]});await handle(req(),env,async()=>{});assert.equal(calls.filter(c=>c.url==='https://api.resend.com/emails').length,1);assert.equal(JSON.parse(calls.at(-1).init.body).outcome,'rate_limited');});
 await t.test('invalid job and permanent provider failures are not silently successful',async()=>{mock({status:422});assert.equal((await (await handle(req(),env,async()=>{})).json()).failed,1);assert.equal(JSON.parse(calls.at(-1).init.body).outcome,'permanent_failure');mock({jobs:[{...job,payload:{}}]});await handle(req(),env,async()=>{});assert.ok(!calls.some(c=>c.url==='https://api.resend.com/emails'));});
 await t.test('lost lease yields safe failure',async()=>{mock({lostLease:true});const r=await handle(req(),env,async()=>{});assert.equal(r.status,503);assert.deepEqual(await r.json(),{error:'Notification processing unavailable'});});
});
