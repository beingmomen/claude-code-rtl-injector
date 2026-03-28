(function() {
  var SEL = '[class*="userMessage_"], [class*="messageInput_"]';

  function applyDirAuto(el) {
    if (el.nodeType === 1) {
      if (el.matches && el.matches(SEL) && !el.getAttribute('dir')) {
        el.setAttribute('dir', 'auto');
      }
      var children = el.querySelectorAll(SEL);
      for (var i = 0; i < children.length; i++) {
        if (!children[i].getAttribute('dir')) {
          children[i].setAttribute('dir', 'auto');
        }
      }
    }
  }

  function applyAll() {
    var els = document.querySelectorAll(SEL);
    for (var i = 0; i < els.length; i++) {
      if (!els[i].getAttribute('dir')) {
        els[i].setAttribute('dir', 'auto');
      }
    }
  }

  // Apply to existing elements once DOM is ready
  if (document.body) {
    applyAll();
  }

  // Watch for new elements added dynamically
  var observer = new MutationObserver(function(mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var added = mutations[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        applyDirAuto(added[j]);
      }
    }
  });

  var startObserver = function() {
    observer.observe(document.body, { childList: true, subtree: true });
    applyAll();
  };

  if (document.body) {
    startObserver();
  } else {
    document.addEventListener('DOMContentLoaded', startObserver);
  }
})();
