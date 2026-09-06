// Run without flags to review. Run --submit only after deploying these files.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {origin} from './seo-config.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const key=fs.readFileSync(path.join(root,'indexnow-key.txt'),'utf8').trim();
if(!/^[a-f0-9]{32}$/.test(key))throw Error('Invalid IndexNow verification key');
const urlList=[...fs.readFileSync(path.join(root,'sitemap.xml'),'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1].replace(/&amp;/g,'&'));
if(!urlList.length||urlList.length>10000||urlList.some(url=>new URL(url).origin!==origin))throw Error('Sitemap URLs must use the canonical host');
const keyLocation=origin+'/indexnow-key.txt';
console.log(JSON.stringify({mode:process.argv.includes('--submit')?'submit':'preview',host:new URL(origin).hostname,keyLocation,urlCount:urlList.length,firstURLs:urlList.slice(0,10)},null,2));
if(!process.argv.includes('--submit')){
  console.log('No requests sent. Deploy first, then run this command with --submit.');
}else{
  const verification=await fetch(keyLocation,{redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!verification.ok||(await verification.text()).trim()!==key)throw Error('The deployed verification file does not match. Nothing submitted.');
  const liveSitemap=await fetch(origin+'/sitemap.xml',{redirect:'error',signal:AbortSignal.timeout(15000)});
  const deployed=await liveSitemap.text();
  if(!liveSitemap.ok||urlList.some(url=>!deployed.includes('<loc>'+url+'</loc>')))throw Error('The updated sitemap is not deployed. Nothing submitted.');
  const response=await fetch('https://api.indexnow.org/indexnow',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},body:JSON.stringify({host:new URL(origin).hostname,key,keyLocation,urlList}),signal:AbortSignal.timeout(20000)});
  if(response.status!==200&&response.status!==202)throw Error('IndexNow returned '+response.status+': '+(await response.text()).slice(0,300));
  console.log(`IndexNow received ${urlList.length} URLs (HTTP ${response.status}). Receipt does not guarantee indexing or ranking.`);
}
