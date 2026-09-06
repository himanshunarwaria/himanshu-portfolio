export const origin='https://www.himanshunarwaria.in';
// Directory homepages use their trailing-slash URL; other pages retain .html.
export const canonicalPath=route=>'/'+route.replace(/(^|\/)index\.html$/,'$1');
// Current professional role, verified against the company's public team page.
export const currentRole={
  title:'Co-founder',
  organization:{'@type':'Organization','@id':'https://xaviklabs.com/#organization',name:'Xavik Labs',url:'https://xaviklabs.com/'},
  source:'https://xaviklabs.com/team'
};
export const person={
  '@type':'Person',
  '@id':origin+'/#person',
  name:'Himanshu Narwaria',
  givenName:'Himanshu',
  familyName:'Narwaria',
  url:origin+'/about.html',
  image:origin+'/images/hero/05.jpg',
  description:'Co-founder of Xavik Labs and a designer and developer based in Agra, India, offering graphic design, video editing, AI video production, social media management, web design, and frontend development.',
  jobTitle:currentRole.title,
  worksFor:currentRole.organization,
  subjectOf:{'@type':'WebPage',url:currentRole.source,name:'Xavik Labs team'},
  homeLocation:{'@type':'Place',name:'Agra, India',address:{'@type':'PostalAddress',addressLocality:'Agra',addressRegion:'Uttar Pradesh',addressCountry:'IN'}},
  email:'mailto:himanshunarwaria@gmail.com',
  sameAs:['https://www.instagram.com/himanshunarwaria','https://www.linkedin.com/in/himanshunarwaria'],
  knowsAbout:['Graphic design','Brand identity','Video editing','AI video production','Social media management','Web design','Frontend development','Amazon A+ content','Performance ad creative']
};
export const website={'@type':'WebSite','@id':origin+'/#website',url:origin+'/',name:'Himanshu Narwaria',inLanguage:'en',publisher:{'@id':person['@id']}};
export const modified='2026-09-06';
