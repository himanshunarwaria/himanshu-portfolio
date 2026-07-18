(function(){
  /* Light image protection only.
     Does not block text selection, copying, printing, keyboard use,
     DevTools, or accessibility tools. */
  document.addEventListener('contextmenu', function(e){
    if (e.target.tagName === 'IMG') e.preventDefault();
  });
  document.addEventListener('dragstart', function(e){
    if (e.target.tagName === 'IMG') e.preventDefault();
  });
  var s = document.createElement('style');
  s.textContent = 'img{-webkit-user-drag:none;user-drag:none}';
  document.head.appendChild(s);
})();
