(function() {
  var MSG_SEL = '[class*="userMessage_"]';
  var INPUT_SEL = '[class*="messageInput_"]';
  var CONTAINER_SEL = '[class*="messageInputContainer_"]';
  var MIRROR_SEL = '[class*="mentionMirror_"]';

  // Detect direction from first strong directional character
  var RTL_RE = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  var LTR_RE = /[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/;

  function detectDir(text) {
    for (var i = 0; i < text.length; i++) {
      if (RTL_RE.test(text[i])) return 'rtl';
      if (LTR_RE.test(text[i])) return 'ltr';
    }
    return null;
  }

  function setDir(el, dir) {
    if (el && el.getAttribute('dir') !== dir) {
      el.setAttribute('dir', dir);
    }
  }

  // Handle input events on the messageInput contenteditable
  function onInput(e) {
    var input = e.target;
    var text = input.textContent || '';
    var dir = detectDir(text) || 'auto';

    setDir(input, dir);

    // Propagate to sibling mirror and parent container
    var parent = input.parentElement;
    if (parent) {
      var mirror = parent.querySelector(MIRROR_SEL);
      if (mirror) setDir(mirror, dir);
      if (parent.matches && parent.matches(CONTAINER_SEL)) {
        setDir(parent, dir);
      }
    }
  }

  // Track which inputs have listeners attached
  var tracked = new WeakSet();

  function setupInput(el) {
    if (!tracked.has(el)) {
      tracked.add(el);
      el.setAttribute('dir', 'auto');
      el.addEventListener('input', onInput);

      var parent = el.parentElement;
      if (parent) {
        var mirror = parent.querySelector(MIRROR_SEL);
        if (mirror) mirror.setAttribute('dir', 'auto');
        if (parent.matches && parent.matches(CONTAINER_SEL)) {
          parent.setAttribute('dir', 'auto');
        }
      }
    }
  }

  function applyDirAuto(el) {
    if (el.nodeType === 1) {
      if (el.matches && el.matches(MSG_SEL) && !el.getAttribute('dir')) {
        el.setAttribute('dir', 'auto');
      }
      if (el.matches && el.matches(INPUT_SEL)) {
        setupInput(el);
      }
      var msgs = el.querySelectorAll(MSG_SEL);
      for (var i = 0; i < msgs.length; i++) {
        if (!msgs[i].getAttribute('dir')) msgs[i].setAttribute('dir', 'auto');
      }
      var inputs = el.querySelectorAll(INPUT_SEL);
      for (var i = 0; i < inputs.length; i++) {
        setupInput(inputs[i]);
      }
    }
  }

  function applyAll() {
    var msgs = document.querySelectorAll(MSG_SEL);
    for (var i = 0; i < msgs.length; i++) {
      if (!msgs[i].getAttribute('dir')) msgs[i].setAttribute('dir', 'auto');
    }
    var inputs = document.querySelectorAll(INPUT_SEL);
    for (var i = 0; i < inputs.length; i++) {
      setupInput(inputs[i]);
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
