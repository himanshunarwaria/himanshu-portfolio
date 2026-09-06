// Normalize existing documents and regenerate the sitemap from indexable pages.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {origin,canonicalPath,person,website,modified} from './seo-config.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const excluded=new Set(['.git','.agents','.codex','artifacts','node_modules','images']);
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>excluded.has(x.name)?[]:x.isDirectory()?walk(path.join(dir,x.name)):x.name.endsWith('.html')?[path.join(dir,x.name)]:[]);
const e=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
const meta=(html,name)=>decode((html.match(new RegExp('<meta\\b[^>]*(?:name|property)=["\']'+name+'["\'][^>]*content="([^"]*)"','i'))||[])[1]||'');
const addMeta=(html,name,value,property=false)=>meta(html,name)?html:html.replace('</head>',`<meta ${property?'property':'name'}="${name}" content="${e(value)}">\n</head>`);
const oldMap=new Map([...fs.readFileSync(path.join(root,'sitemap.xml'),'utf8').matchAll(/<url>\s*<loc>(.*?)<\/loc>([\s\S]*?)<\/url>/g)].map(m=>[new URL(m[1]).pathname,m[2].match(/<lastmod>(.*?)<\/lastmod>/)?.[1]]));
const collection=new Set(['ads.html','banners.html','websites.html','social-media.html','meta-ads.html','listings.html','AI-FILM/clips/index.html']);
const serviceRoutes=new Set(JSON.parse(fs.readFileSync(path.join(root,'content/services.json'),'utf8')).map(s=>s.slug+'.html'));
const contextualLinks={
  'websites.html':{text:'Planning a website? Explore the design and development services behind this work.',links:[['Web design','web-design.html'],['Web development','web-development.html']]},
  'social-media.html':{text:'Need consistent content for your brand? Explore design and ongoing social media support.',links:[['Social media management','social-media-management.html'],['Graphic design','graphic-design.html']]},
  'meta-ads.html':{text:'Build a coordinated set of campaign assets for your next launch.',links:[['Graphic design','graphic-design.html'],['Video editing','video-editing.html']]},
  'banners.html':{text:'Explore the creative services behind brand and campaign design.',links:[['Graphic design','graphic-design.html'],['All services','services.html']]},
  'listings.html':{text:'Need clearer product visuals? Start with a focused design brief.',links:[['Graphic design','graphic-design.html'],['All services','services.html']]},
  'ads.html':{text:'Connect your advertising creative with the rest of your brand.',links:[['Graphic design','graphic-design.html'],['Video editing','video-editing.html']]}
};
const indexable=[];let changed=0;
for(const file of walk(root)){
  const route=path.relative(root,file).split(path.sep).join('/');
  const pathname=canonicalPath(route);
  const before=fs.readFileSync(file,'utf8');
  let html=before.replaceAll('https://himanshunarwaria.in',origin);
  const noindex=/noindex/i.test(meta(html,'robots'));
  if(!noindex){
    const title=decode((html.match(/<title>([\s\S]*?)<\/title>/)||[])[1]||'');
    const description=meta(html,'description');
    let firstImage=(html.match(/<img\b[^>]*src="([^"]+)"/)||[])[1];
    if(firstImage&&/^(data:|https?:)/.test(firstImage))firstImage=null;
    const image=meta(html,'og:image')||(firstImage?new URL(firstImage,origin+'/'+route).href:origin+'/images/hero/og-cover.jpg');
    html=addMeta(html,'og:image',image,true);
    html=addMeta(html,'og:image:alt',title,true);
    html=addMeta(html,'twitter:card','summary_large_image');
    html=addMeta(html,'twitter:title',meta(html,'og:title')||title);
    html=addMeta(html,'twitter:description',meta(html,'og:description')||description);
    html=addMeta(html,'twitter:image',image);
    html=addMeta(html,'author','Himanshu Narwaria');
    html=html.replace(/<meta\b[^>]*name="robots"[^>]*>/i,'<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">');
    html=addMeta(html,'robots','index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    html=html.replace(/(<meta\b[^>]*property="og:site_name"[^>]*content=")[^"]*/i,'$1Himanshu Narwaria');
    if(!/application\/ld\+json/.test(html)){
      const type=collection.has(route)?'CollectionPage':'CreativeWork';
      const data={'@context':'https://schema.org','@type':type,'@id':origin+pathname+'#'+(type==='CreativeWork'?'work':'webpage'),url:origin+pathname,name:title,description,image,inLanguage:'en',creator:{'@type':'Person','@id':person['@id'],name:person.name,url:person.url},isPartOf:{'@id':website['@id']}};
      html=html.replace('</head>',`<script type="application/ld+json">${JSON.stringify(data,null,2).replace(/</g,'\\u003c')}</script>\n</head>`);
    }
    html=html.replace(/(<script[^>]*type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/gi,(all,open,body,close)=>{
      const data=JSON.parse(body.replaceAll(origin+'/AI-FILM/#himanshu',person['@id']));
      const visit=value=>{
        if(!value||typeof value!=='object')return;
        if(value['@type']==='Person'&&value.name==='Himanshu Narwaria'){value['@id']=person['@id'];value.url=person.url;}
        if(value['@type']==='BlogPosting'){
          value.image=value.image||image;
          value.mainEntityOfPage={'@type':'WebPage','@id':origin+pathname};
        }
        Object.values(value).forEach(visit);
      };visit(data);
      return open+JSON.stringify(data,null,2).replace(/</g,'\\u003c')+close;
    });
    if(route.startsWith('blog/'))html=html.replace('<span class="mv">Himanshu Narwaria</span>','<a class="mv" href="../about.html" rel="author">Himanshu Narwaria</a>');
    const context=contextualLinks[route]||(route.startsWith('blog/')?{text:'Explore the services behind this article, or learn more about its author.',links:[['Creative services','../services.html'],['About Himanshu Narwaria','../about.html']]}:null);
    if(context&&!html.includes('class="related-service-note"')){
      const prefix=route.includes('/')?'../':'';
      html=html.replace('</head>',`<link rel="stylesheet" href="${prefix}styles/seo-links.css">\n</head>`);
      html=html.replace(/<footer\b/,`<aside class="related-service-note" aria-label="Related services"><p>${e(context.text)}</p><div>${context.links.map(([label,href])=>`<a href="${href}">${e(label)} <span aria-hidden="true">↗</span></a>`).join('')}</div></aside>\n<footer`);
    }
    indexable.push({url:origin+pathname,lastmod:route==='index.html'||route==='about.html'||route==='services.html'||serviceRoutes.has(route)?modified:oldMap.get(pathname)});
  }
  if(html!==before){fs.writeFileSync(file,html);changed++;}
}
indexable.sort((a,b)=>a.url===origin+'/'?-1:b.url===origin+'/'?1:a.url.localeCompare(b.url));
fs.writeFileSync(path.join(root,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+indexable.map(p=>`  <url><loc>${e(p.url)}</loc>${p.lastmod?`<lastmod>${p.lastmod}</lastmod>`:''}</url>`).join('\n')+'\n</urlset>\n');
console.log(`Updated ${changed} HTML documents; sitemap contains ${indexable.length} canonical, indexable pages. Existing content dates were preserved.`);
