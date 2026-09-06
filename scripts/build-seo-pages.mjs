// Produces static HTML: no build server, JavaScript rendering, or runtime dependency.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {origin,person,website,modified} from './seo-config.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const services=JSON.parse(fs.readFileSync(path.join(root,'content/services.json'),'utf8'));
const e=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ref={'@id':person['@id']};
const json=value=>JSON.stringify(value,null,2).replace(/</g,'\\u003c');
const crumbs=(items)=>({'@type':'BreadcrumbList',itemListElement:items.map(([name,url],index)=>({'@type':'ListItem',position:index+1,name,item:origin+url}))});
const serviceEntity=s=>({'@type':'Service','@id':origin+'/'+s.slug+'.html#service',name:s.name+' by Himanshu Narwaria',serviceType:s.name,description:s.summary,url:origin+'/'+s.slug+'.html',provider:ref,areaServed:{'@type':'Place',name:'Worldwide'}});
const nav=`<header class="directory-header"><div class="directory-header-inner"><a class="directory-brand" href="/" aria-label="Himanshu Narwaria, home"><span aria-hidden="true">HN</span>Himanshu Narwaria</a><nav aria-label="Primary navigation"><a href="websites.html">Work</a><a href="services.html">Services</a><a href="about.html">About</a><a class="directory-nav-cta" href="#project-contact">Let’s talk <span aria-hidden="true">↗</span></a></nav></div></header>`;
const contact=`<section class="service-contact" id="project-contact" aria-labelledby="project-contact-title"><div><p class="directory-eyebrow">Start a conversation</p><h2 id="project-contact-title">What are you working on?</h2><p>Share the idea, deliverables, and timeline. I’ll help define the scope and the next step.</p></div><div class="service-contact-links"><a class="directory-button" href="index.html#contact">Send a project brief <span aria-hidden="true">↗</span></a><a href="mailto:himanshunarwaria@gmail.com">himanshunarwaria@gmail.com</a><a href="https://wa.me/917089271701" target="_blank" rel="noopener noreferrer">WhatsApp · +91 7089271701</a></div></section>`;
const footer=`<footer class="directory-footer"><p>Himanshu Narwaria<br><span>Agra, India · Working worldwide</span></p><nav aria-label="Footer navigation"><a href="services.html">All services</a><a href="about.html">About Himanshu</a><a href="index.html#blog">Design notes</a><a href="https://www.linkedin.com/in/himanshunarwaria" target="_blank" rel="noopener noreferrer">LinkedIn</a><a href="https://www.instagram.com/himanshunarwaria" target="_blank" rel="noopener noreferrer">Instagram</a></nav></footer>`;
function page(file,title,description,graph,body,image='images/hero/og-cover.jpg'){
  const url=origin+'/'+file;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${e(title)}</title>
  <meta name="description" content="${e(description)}">
  <meta name="author" content="Himanshu Narwaria">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="theme-color" content="#f4f4ef">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="${file==='about.html'?'profile':'website'}">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="Himanshu Narwaria">
  <meta property="og:title" content="${e(title)}">
  <meta property="og:description" content="${e(description)}">
  <meta property="og:image" content="${origin}/${image}">
  <meta property="og:image:alt" content="Himanshu Narwaria, designer and developer">
  <meta property="og:locale" content="en_IN">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${e(title)}">
  <meta name="twitter:description" content="${e(description)}">
  <meta name="twitter:image" content="${origin}/${image}">
  <link rel="icon" type="image/png" href="images/Icons/fav.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&amp;family=Space+Mono:wght@400;700&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles/services.css">
  <link rel="stylesheet" href="styles/accessibility-baseline.css">
  <script type="application/ld+json">${json({'@context':'https://schema.org','@graph':[person,website,...graph]})}</script>
</head>
<body class="service-page">
  <a class="skip-link" href="#main-content">Skip to main content</a>
  ${nav}
  <main class="directory-shell" id="main-content" tabindex="-1">
    ${body}
    ${contact}
  </main>
  ${footer}
</body>
</html>
`;
}
const breadcrumb=(name,service=false)=>`<nav class="directory-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span>${service?'<a href="services.html">Services</a><span aria-hidden="true">/</span>':''}<span aria-current="page">${e(name)}</span></nav>`;
const cards=(items)=>`<div class="service-directory">${items.map((s,index)=>`<a class="service-directory-card" href="${s.slug}.html"><span class="service-directory-number">${String(index+1).padStart(2,'0')} <span aria-hidden="true">↗</span></span><h3>${e(s.name)}</h3><p>${e(s.summary)}</p></a>`).join('\n')}</div>`;
for(const s of services){
  const file=s.slug+'.html';
  const graph=[serviceEntity(s),{'@type':'WebPage','@id':origin+'/'+file+'#webpage',url:origin+'/'+file,name:s.title,description:s.description,inLanguage:'en',isPartOf:{'@id':website['@id']},mainEntity:{'@id':origin+'/'+file+'#service'},author:ref},crumbs([['Home','/'],['Services','/services.html'],[s.name,'/'+file]])];
  const body=`${breadcrumb(s.name,true)}
    <section class="service-hero" aria-labelledby="service-title">
      <div><p class="directory-eyebrow">${e(s.name)} · Agra, India</p><h1 id="service-title">${e(s.headline)}</h1><p class="directory-lead">${e(s.intro)}</p><a class="directory-button" href="#project-contact">Discuss your project <span aria-hidden="true">↗</span></a></div>
      <aside class="service-fit"><span class="service-fit-symbol" aria-hidden="true">✳</span><h2>A good fit for</h2><p>${e(s.fit)}</p><a href="about.html">Work directly with Himanshu <span aria-hidden="true">↗</span></a></aside>
    </section>
    <section class="service-section" aria-labelledby="deliverables-title"><div class="service-section-heading"><p class="directory-eyebrow">The scope</p><h2 id="deliverables-title">What I can help with</h2><p>We agree on the deliverables, review rounds, and handoff before work begins.</p></div><div class="service-deliverables">${s.deliverables.map(([title,text])=>`<article><h3>${e(title)}</h3><p>${e(text)}</p></article>`).join('')}</div></section>
    <section class="service-section" aria-labelledby="process-title"><div class="service-section-heading"><p class="directory-eyebrow">The process</p><h2 id="process-title">How we’ll work together</h2></div><ol class="service-process">${s.approach.map(([title,text])=>`<li><h3>${e(title)}</h3><p>${e(text)}</p></li>`).join('')}</ol></section>
    <section class="service-brief" aria-labelledby="brief-title"><h2 id="brief-title">What to include in your brief</h2><p>${e(s.inputs)}</p></section>
    <section class="service-section" aria-labelledby="examples-title"><div class="service-section-heading"><p class="directory-eyebrow">Explore further</p><h2 id="examples-title">${e(s.proofHeading)}</h2><p>${e(s.proofIntro)}</p></div><ul class="service-proof">${s.proof.map(p=>`<li><a href="${e(p.href)}">${e(p.label)}<span aria-hidden="true">↗</span></a></li>`).join('')}</ul></section>
    <section class="service-section" aria-labelledby="faq-title"><div class="service-section-heading"><p class="directory-eyebrow">Before we begin</p><h2 id="faq-title">Your questions, answered.</h2></div><div class="service-faq">${s.faqs.map(([q,a])=>`<details><summary>${e(q)}</summary><p>${e(a)}</p></details>`).join('')}</div></section>
    <section class="service-related" aria-labelledby="related-title"><h2 id="related-title">Bring the other pieces together.</h2>${cards(s.related.map(slug=>services.find(s=>s.slug===slug)))}</section>`;
  fs.writeFileSync(path.join(root,file),page(file,s.title,s.description,graph,body));
}
const hubTitle='Design, Video & Web Services | Himanshu Narwaria';
const hubDescription='Explore graphic design, video editing, AI video production, social media management, web design, and development by Himanshu Narwaria in Agra, India.';
const hubBody=`${breadcrumb('Services')}<section class="directory-intro"><p class="directory-eyebrow">Independent creative services</p><h1>From first idea<br>to the final detail.</h1><p class="directory-lead">I’m Himanshu Narwaria, an independent designer and developer in Agra, India. Choose a focused service or combine design, video, social content, and web development into one project.</p></section><section aria-labelledby="all-services-title"><h2 class="directory-subtitle" id="all-services-title">Find the right service</h2>${cards(services)}</section><section class="service-section"><div class="service-section-heading"><p class="directory-eyebrow">A connected approach</p><h2>One brief. A considered scope.</h2></div><div class="service-prose"><p>A new business might need a visual identity and a website. A campaign might need social designs, video edits, and a landing page. We identify the deliverables that belong together and set a review sequence before production.</p><p>Projects are scoped around the work, the available material, and the timeline. I work remotely with clients across India and worldwide. Share your audience, goals, and constraints to start the conversation.</p><a href="about.html">Meet Himanshu Narwaria <span aria-hidden="true">↗</span></a></div></section><section class="service-related"><h2>See the work behind the services.</h2><div class="service-work-links"><a href="websites.html">Website case studies ↗</a><a href="social-media.html">Social media design ↗</a><a href="meta-ads.html">Performance ad creative ↗</a><a href="listings.html">Amazon listing design ↗</a></div></section>`;
fs.writeFileSync(path.join(root,'services.html'),page('services.html',hubTitle,hubDescription,[{'@type':'CollectionPage','@id':origin+'/services.html#webpage',url:origin+'/services.html',name:hubTitle,description:hubDescription,isPartOf:{'@id':website['@id']},about:ref,mainEntity:{'@type':'ItemList',itemListElement:services.map((s,i)=>({'@type':'ListItem',position:i+1,name:s.name,url:origin+'/'+s.slug+'.html'}))}},crumbs([['Home','/'],['Services','/services.html']])],hubBody));
const profileTitle='About Himanshu Narwaria | Designer & Developer in Agra';
const profileDescription='Meet Himanshu Narwaria, an independent designer and developer in Agra, India. Explore his background, creative services, portfolio, and official profiles.';
const profileBody=`${breadcrumb('About Himanshu')}<section class="service-hero profile-hero"><div><p class="directory-eyebrow">Designer. Developer. Creative partner.</p><h1>Himanshu<br>Narwaria.</h1><p class="directory-lead">I’m an independent designer and frontend developer based in Agra, India. I work across brand identity, digital products, campaigns, video content, and e-commerce design.</p><p>My approach connects what a brand needs to say with how the final experience looks, feels, and works.</p><a class="directory-button" href="services.html">Explore my services <span aria-hidden="true">↗</span></a></div><figure class="profile-photo"><img src="images/hero/05.jpg" alt="Himanshu Narwaria playing chess" width="1080" height="1350" fetchpriority="high" decoding="async"><figcaption>Himanshu Narwaria · Agra, India</figcaption></figure></section><section class="service-section"><div class="service-section-heading"><p class="directory-eyebrow">My practice</p><h2>Design is communication.<br>Code makes it tangible.</h2></div><div class="service-prose"><p>My portfolio spans work for restaurants, consumer brands, education, finance, travel, and e-commerce businesses. The formats change, but the task stays consistent: make the message easier to understand and the next action easier to take.</p><p>I bring graphic design, interface design, and frontend implementation into the same conversation. My toolkit includes Adobe Photoshop, Illustrator, Figma, Premiere Pro, and After Effects, alongside frontend development.</p><p>I work directly with clients to establish a brief, review the direction, and deliver the agreed assets. Remote collaboration makes that process available to businesses across India and worldwide.</p></div></section><section class="service-section"><div class="service-section-heading"><p class="directory-eyebrow">Selected work</p><h2>Explore the portfolio.</h2></div><ul class="service-proof"><li><a href="websites.html">Websites and digital products <span aria-hidden="true">↗</span></a></li><li><a href="social-media.html">Social media and campaign design <span aria-hidden="true">↗</span></a></li><li><a href="listings.html">Amazon listings and e-commerce design <span aria-hidden="true">↗</span></a></li><li><a href="meta-ads.html">Performance ad creative <span aria-hidden="true">↗</span></a></li></ul></section><section class="service-section" aria-labelledby="official-title"><div class="service-section-heading"><p class="directory-eyebrow">Find me online</p><h2 id="official-title">Official profiles &amp; contact</h2></div><div class="service-prose"><p>This is the portfolio of Himanshu Narwaria, the designer and developer based in Agra. These are the social profiles linked to my work.</p><ul class="profile-details"><li><strong>LinkedIn</strong><a href="https://www.linkedin.com/in/himanshunarwaria" target="_blank" rel="noopener noreferrer">Himanshu Narwaria on LinkedIn</a></li><li><strong>Instagram</strong><a href="https://www.instagram.com/himanshunarwaria" target="_blank" rel="noopener noreferrer">@himanshunarwaria</a></li><li><strong>Email</strong><a href="mailto:himanshunarwaria@gmail.com">himanshunarwaria@gmail.com</a></li><li><strong>Based in</strong><span>Agra, Uttar Pradesh, India</span></li></ul></div></section>`;
fs.writeFileSync(path.join(root,'about.html'),page('about.html',profileTitle,profileDescription,[{'@type':'ProfilePage','@id':origin+'/about.html#webpage',url:origin+'/about.html',name:profileTitle,description:profileDescription,dateModified:modified,inLanguage:'en',isPartOf:{'@id':website['@id']},mainEntity:ref},crumbs([['Home','/'],['About Himanshu','/about.html']])],profileBody,'images/hero/05.jpg'));

// Refresh only the explicitly owned service block and schema in the homepage.
const homePath=path.join(root,'index.html');
let home=fs.readFileSync(homePath,'utf8');
const directory=`<!-- service-directory:start -->\n        <div class="home-service-directory"><div class="home-service-heading"><h3>Find the right service.</h3><a class="text-link" href="services.html">All services</a></div>${cards(services)}</div>\n        <!-- service-directory:end -->`;
if(home.includes('<!-- service-directory:start -->'))home=home.replace(/<!-- service-directory:start -->[\s\S]*?<!-- service-directory:end -->/,directory);
else home=home.replace('        <div class="capabilities-cta">',directory+'\n\n        <div class="capabilities-cta">');
home=home.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,`<script type="application/ld+json">${json({'@context':'https://schema.org','@graph':[person,website,{'@type':'WebPage','@id':origin+'/#webpage',url:origin+'/',name:'Himanshu Narwaria | Design, Video & Web Development',isPartOf:{'@id':website['@id']},about:ref,mainEntity:ref},{'@type':'Service','@id':origin+'/#service',name:'Creative and digital services by Himanshu Narwaria',provider:ref,url:origin+'/services.html',hasOfferCatalog:{'@type':'OfferCatalog',name:'Creative services',itemListElement:services.map(s=>({'@type':'Offer',itemOffered:serviceEntity(s)}))}}]})}</script>`);
fs.writeFileSync(homePath,home);
console.log(`Generated ${services.length} service pages, services.html, about.html, and the homepage service directory.`);
