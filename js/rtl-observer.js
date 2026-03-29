(function() {
  var MSG_SEL = '[class*="userMessage_"]';
  var INPUT_SEL = '[class*="messageInput_"]:not([class*="messageInputContainer_"])';
  var CONTAINER_SEL = '[class*="messageInputContainer_"]';
  var MIRROR_SEL = '[class*="mentionMirror_"]';
  var ALL_SEL = MSG_SEL + ', ' + INPUT_SEL + ', ' + CONTAINER_SEL + ', ' + MIRROR_SEL;

  function setDirAuto(el) {
    if (el && !el.getAttribute('dir')) {
      el.setAttribute('dir', 'auto');
    }
  }

  function setupInput(el) {
    setDirAuto(el);
    // Also set dir="auto" on sibling mirror and parent container
    var parent = el.parentElement;
    if (parent) {
      var mirror = parent.querySelector(MIRROR_SEL);
      if (mirror) setDirAuto(mirror);
      if (parent.matches && parent.matches(CONTAINER_SEL)) {
        setDirAuto(parent);
      }
    }
  }

  function applyDirAuto(el) {
    if (el.nodeType === 1) {
      if (el.matches && el.matches(MSG_SEL)) {
        setDirAuto(el);
      }
      if (el.matches && el.matches(INPUT_SEL)) {
        setupInput(el);
      }
      if (el.matches && el.matches(ALL_SEL)) {
        setDirAuto(el);
      }
      var children = el.querySelectorAll(ALL_SEL);
      for (var i = 0; i < children.length; i++) {
        if (children[i].matches(INPUT_SEL)) {
          setupInput(children[i]);
        } else {
          setDirAuto(children[i]);
        }
      }
    }
  }

  function applyAll() {
    var els = document.querySelectorAll(ALL_SEL);
    for (var i = 0; i < els.length; i++) {
      if (els[i].matches(INPUT_SEL)) {
        setupInput(els[i]);
      } else {
        setDirAuto(els[i]);
      }
    }
  }

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
