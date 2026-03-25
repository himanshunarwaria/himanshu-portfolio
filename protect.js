(function(){
  /* 1 — Block right-click */
  document.addEventListener('contextmenu',function(e){e.preventDefault();return false;});

  /* 2 — Block drag on images */
  document.addEventListener('dragstart',function(e){
    if(e.target.tagName==='IMG'){e.preventDefault();return false;}
  });

  /* 3 — Block copy / cut */
  document.addEventListener('copy',function(e){e.preventDefault();return false;});
  document.addEventListener('cut',function(e){e.preventDefault();return false;});

  /* 4 — Block keyboard shortcuts */
  document.addEventListener('keydown',function(e){
    var k=e.key.toLowerCase();
    // F12
    if(e.key==='F12'){e.preventDefault();return false;}
    // PrintScreen (best-effort — OS may still capture)
    if(e.key==='PrintScreen'){e.preventDefault();return false;}
    if(e.ctrlKey||e.metaKey){
      // Ctrl+S  save page
      // Ctrl+U  view source
      // Ctrl+A  select all
      // Ctrl+C  copy
      // Ctrl+P  print
      if(['s','u','a','c','p'].includes(k)){e.preventDefault();return false;}
      // Ctrl+Shift+I / J / C  DevTools
      if(e.shiftKey&&['i','j','c'].includes(k)){e.preventDefault();return false;}
    }
  });

  /* 5 — CSS: no select, no drag, overlay on images, block print */
  var css=[
    '*{-webkit-user-select:none!important;-moz-user-select:none!important;user-select:none!important}',
    'img{-webkit-user-drag:none!important;user-drag:none!important;pointer-events:none!important}',
    /* transparent overlay on every image container blocks "save image as" */
    '.gallery-item,.listing-img,.cat-card-thumb,.latest-card-thumb,.banner-item{position:relative}',
    '.gallery-item::after,.listing-img::after,.cat-card-thumb::after,.latest-card-thumb::after,.banner-item::after{content:"";position:absolute;inset:0;z-index:999}',
    /* block print / screenshot via print dialog */
    '@media print{html,body{display:none!important}}'
  ].join('');
  var s=document.createElement('style');
  s.textContent=css;
  document.head.appendChild(s);
})();
