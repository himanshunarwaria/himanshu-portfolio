import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {origin,canonicalPath} from './seo-config.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const excluded=new Set(['.git','.agents','.codex','artifacts','node_modules','images']);
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(item=>excluded.has(item.name)?[]:item.isDirectory()?walk(path.join(dir,item.name)):item.name.endsWith('.html')?[path.join(dir,item.name)]:[]);
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g)].map(m=>[m[1].toLowerCase(),decode(m[3])]));
const issues=[];
const issue=(file,code,message)=>issues.push({file,code,message});
const localRoute=pathname=>{
  const route=decodeURIComponent(pathname).replace(/^\//,'');
  return !route||route.endsWith('/')?route+'index.html':route;
};
const pages=walk(root).map(file=>{
  const route=path.relative(root,file).split(path.sep).join('/');
  const html=fs.readFileSync(file,'utf8').replace(/<!--[\s\S]*?-->/g,'');
  const metas=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>attrs(m[0]));
  const meta=key=>metas.find(m=>m.name===key||m.property===key)?.content||'';
  const links=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>attrs(m[0]));
  const canonicals=links.filter(l=>l.rel==='canonical');
  const title=decode((html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||'').trim();
  const canonical=canonicals[0]?.href||'';
  const indexable=!/noindex/i.test(meta('robots'));
  const expected=origin+canonicalPath(route);
  const schemas=[];
  for(const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
    try{const value=JSON.parse(m[1]);schemas.push(...(value['@graph']||[value]));}catch(e){issue(route,'schema-json',e.message);}
  }
  const h1s=[...html.matchAll(/<h1\b/gi)].length;
  if(!title)issue(route,'title','Missing title');
  if(!meta('description'))issue(route,'description','Missing meta description');
  if(h1s!==1)issue(route,'h1',`Expected one H1, found ${h1s}`);
  if(indexable){
    if(canonicals.length!==1||canonical!==expected)issue(route,'canonical',`Expected ${expected}; found ${canonical||'none'}`);
    if(meta('og:url')!==expected)issue(route,'og-url','Open Graph URL does not match the canonical URL');
    if(!meta('og:image'))issue(route,'og-image','Missing social sharing image');
    else {
      const image=new URL(meta('og:image'),origin);
      if(image.origin===origin&&!fs.existsSync(path.join(root,decodeURIComponent(image.pathname))))issue(route,'og-image-file','Sharing image does not exist locally');
    }
    if(!meta('twitter:card'))issue(route,'twitter-card','Missing Twitter/X card');
    if(!schemas.length)issue(route,'schema-missing','No structured data');
  }
  const ids=new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]));
  const hrefs=[...html.matchAll(/<a\b[^>]*>/gi)].map(m=>attrs(m[0]).href).filter(Boolean);
  return {route,title,description:meta('description'),canonical,indexable,h1s,schemas:schemas.map(s=>s['@type']),hrefs,ids:[...ids],html};
});
const byRoute=new Map(pages.map(p=>[p.route,p]));
const seen=new Set();
const queue=['index.html'];
while(queue.length){
  const route=queue.pop();
  if(seen.has(route)||!byRoute.has(route))continue;
  seen.add(route);
  for(const href of byRoute.get(route).hrefs){
    try{
      const url=new URL(href,origin+'/'+route);
      if(url.hostname===new URL(origin).hostname||url.hostname===new URL(origin).hostname.replace(/^www\./,''))queue.push(localRoute(url.pathname));
    }catch{ /* Non-web links do not belong to the crawl graph. */ }
  }
}
for(const page of pages)if(page.indexable&&!seen.has(page.route))issue(page.route,'orphan','Indexable page is unreachable through static links from the homepage');
for(const page of pages){
  for(const href of page.hrefs){
    if(/^(mailto:|tel:|javascript:|data:)/i.test(href))continue;
    let url;try{url=new URL(decode(href),origin+'/'+(page.route==='index.html'?'':page.route));}catch{continue;}
    if(url.hostname!=='www.himanshunarwaria.in'&&url.hostname!=='himanshunarwaria.in')continue;
    const target=localRoute(url.pathname);
    const dest=byRoute.get(target);
    if(dest&&url.hash&&!dest.ids.includes(decodeURIComponent(url.hash.slice(1))))issue(page.route,'anchor',`Missing destination ${target}${url.hash}`);
  }
}
for(const field of ['title','description','canonical']){
  const groups=new Map();
  for(const page of pages.filter(p=>p.indexable&&p[field]))groups.set(page[field],[...(groups.get(page[field])||[]),page.route]);
  for(const [value,routes] of groups)if(routes.length>1)issue(routes.join(', '),'duplicate-'+field,value);
}
const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>decode(m[1]));
for(const page of pages){
  const url=origin+canonicalPath(page.route);
  if(page.indexable&&!urls.includes(url))issue(page.route,'sitemap-missing','Indexable canonical page is absent from sitemap');
  if(!page.indexable&&urls.includes(url))issue(page.route,'sitemap-noindex','Noindex page is in sitemap');
}
for(const url of urls){
  const parsed=new URL(url);
  if(parsed.origin!==origin)issue('sitemap.xml','sitemap-host',url);
  if(!byRoute.has(localRoute(parsed.pathname)))issue('sitemap.xml','sitemap-dead-url',url);
}
const counts=issues.reduce((a,i)=>(a[i.code]=(a[i.code]||0)+1,a),{});
const report={checkedAt:new Date().toISOString(),origin,pages:pages.length,indexable:pages.filter(p=>p.indexable).length,sitemapEntries:urls.length,counts,issues,inventory:pages.map(({html,ids,...page})=>page)};
const reportFlag=process.argv.indexOf('--report');
if(reportFlag!==-1){
  const file=path.resolve(root,process.argv[reportFlag+1]);
  if(!file.startsWith(root+path.sep))throw Error('Report must stay in the workspace');
  fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({pages:report.pages,indexable:report.indexable,sitemapEntries:urls.length,issues:issues.length,counts},null,2));
if(process.argv.includes('--details'))console.log(JSON.stringify(issues,null,2));
if(process.argv.includes('--check')&&issues.length)process.exitCode=1;
