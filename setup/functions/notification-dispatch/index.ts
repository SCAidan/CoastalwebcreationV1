// Server-only worker. The scheduler token is generated in Vault, not shipped to clients.
const FROM = 'Coastal Web Works <updates@notify.coastalwebwork.com>';
const ADDRESS = /^[^\s@<>\u0000-\u001f\u007f]+@[^\s@<>\u0000-\u001f\u007f]+\.[^\s@<>\u0000-\u001f\u007f]+$/;
export function emailPayload(job: any) {
  const p = job.payload;
  if (!['inquiry_owner','inquiry_confirmation','request_owner','request_update'].includes(job.kind) ||
      !p || typeof p.to !== 'string' || p.to.length > 254 || !ADDRESS.test(p.to) ||
      typeof p.reply_to !== 'string' || p.reply_to.length > 254 || !ADDRESS.test(p.reply_to) ||
      typeof p.subject !== 'string' || p.subject.length > 200 || /[\r\n]/.test(p.subject) ||
      typeof p.text !== 'string' || p.text.length > 12000) throw Error('invalid_job');
  if (['inquiry_owner','request_owner'].includes(job.kind) && p.to !== 'sales@coastalwebwork.com') throw Error('invalid_job');
  return {from: FROM, to: [p.to], reply_to: p.reply_to, subject: p.subject, text: p.text};
}
export async function handle(request: Request, env: Record<string,string>, pause = (ms: number) => new Promise(r=>setTimeout(r,ms))) {
  const reply = (body: unknown, status=200) => new Response(JSON.stringify(body), {status, headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  if (request.method !== 'POST') return reply({error:'Method not allowed'},405);
  const token = (request.headers.get('Authorization') || '').match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token) return reply({error:'Unauthorized'},401);
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.RESEND_API_KEY) return reply({error:'Email service not configured'},503);
  const rpc = async (name: string, body: unknown={}) => {
    const r = await fetch(env.SUPABASE_URL+'/rest/v1/rpc/'+name, {method:'POST',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
    if (!r.ok) throw Error('database_unavailable');
    return r.json();
  };
  try {
    const settings = await rpc('notification_dispatch_settings');
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),v=>v.toString(16).padStart(2,'0')).join('');
    let difference = digest.length ^ (settings?.token_hash || '').length;
    for (let n=0;n<digest.length;n++) difference |= digest.charCodeAt(n) ^ (settings?.token_hash || '').charCodeAt(n);
    if (!settings?.token_hash || difference !== 0) return reply({error:'Unauthorized'},401);
    if (!settings.enabled) return reply({configured:true,enabled:false});
    const jobs = await rpc('claim_notification_jobs');
    let sent=0, failed=0;
    for (const job of jobs) {
      let payload;
      try { payload=emailPayload(job); }
      catch {
        await rpc('finish_notification_job',{job_id:job.id,lease_token:job.claim_token,outcome:'permanent_failure'});
        failed++; continue;
      }
      let outcome='retry', message_id=null;
      try {
        const r = await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'coastal-notification/'+job.id},body:JSON.stringify(payload),signal:AbortSignal.timeout(10000)});
        if (r.ok) {
          const data=await r.json();
          if (typeof data.id==='string' && data.id) { outcome='sent'; message_id=data.id; }
        } else if (r.status===429) outcome='rate_limited';
        else if (r.status>=400 && r.status<500 && ![408,409,425].includes(r.status)) outcome='permanent_failure';
      } catch { /* A saved job remains retryable without exposing content or provider errors. */ }
      const finished=await rpc('finish_notification_job',{job_id:job.id,lease_token:job.claim_token,outcome,message_id});
      if (!finished) throw Error('lease_lost');
      if (outcome==='sent') sent++; else failed++;
      if (outcome==='rate_limited') break;
      // Keep below the provider's default two requests/second.
      await pause(600);
    }
    return reply({processed:sent+failed,sent,failed});
  } catch { return reply({error:'Notification processing unavailable'},503); }
}
Deno.serve((request: Request)=>handle(request,{
  SUPABASE_URL:Deno.env.get('SUPABASE_URL') || '',
  SUPABASE_SERVICE_ROLE_KEY:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  RESEND_API_KEY:Deno.env.get('RESEND_API_KEY') || '',
}));
