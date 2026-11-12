import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PUBLIC_FILES,publicPath} from '../functions/_server/public-assets.mjs';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
test('sitemap URLs are canonical public indexable pages, not login routes or noindex design demos',async()=>{
 const xml=await read('sitemap.xml');const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>new URL(m[1]));assert.equal(urls.length,new Set(urls.map(u=>u.href)).size);
 for(const u of urls){assert.equal(u.origin,'https://coastalwebwork.com');assert.ok(!/^\/(login|dashboard|portal|pay|thank-you|templates)(\/|$)/.test(u.pathname));assert.ok(publicPath(u.pathname),u.pathname);const file=u.pathname==='/'?'index.html':u.pathname.endsWith('/')?u.pathname.slice(1)+'index.html':u.pathname.slice(1)+'.html';const html=await read(file);assert.ok(!/<meta[^>]+name="robots"[^>]+noindex/.test(html));assert.ok(html.includes('rel="canonical" href="'+u.href+'"'),file);}
});
test('service pages are linked from the homepage and truthful structured data matches the canonical URL',async()=>{
 const home=await read('index.html');
 for(const slug of ['web-design','website-redesign','website-care']){const file='services/'+slug+'/index.html',html=await read(file);assert.ok(PUBLIC_FILES.includes(file));assert.ok(home.includes('href="/services/'+slug+'/"'));const data=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.ok(data['@graph'].some(n=>n['@type']==='Service'&&n.url==='https://coastalwebwork.com/services/'+slug+'/'));assert.ok(!html.includes('aggregateRating'));assert.ok(!html.includes('streetAddress'));}
});
