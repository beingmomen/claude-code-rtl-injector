(function () {
  var RTL_CSS = [
    "*, *::before, *::after {",
    "  unicode-bidi: plaintext !important;",
    "}",
    "input, textarea {",
    "  unicode-bidi: plaintext !important;",
    "}",
  ].join("\n");

  var injected = new WeakSet();

  function injectIntoRoot(root) {
    if (!root || injected.has(root)) {
      return;
    }
    injected.add(root);
    try {
      var sheet = new CSSStyleSheet();
      sheet.replaceSync(RTL_CSS);
      var existing = Array.prototype.slice.call(root.adoptedStyleSheets || []);
      root.adoptedStyleSheets = existing.concat([sheet]);
    } catch (e) {}
    var children = root.querySelectorAll("*");
    for (var i = 0; i < children.length; i++) {
      if (children[i].shadowRoot) {
        injectIntoRoot(children[i].shadowRoot);
      }
    }
  }

  function processElement(el) {
    if (el.shadowRoot) {
      injectIntoRoot(el.shadowRoot);
    }
  }

  function processAll() {
    var all = document.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      processElement(all[i]);
    }
  }

  var observer = new MutationObserver(function (mutations) {
    for (var m = 0; m < mutations.length; m++) {
      var added = mutations[m].addedNodes;
      for (var a = 0; a < added.length; a++) {
        var node = added[a];
        if (node.nodeType !== 1) {
          continue;
        }
        processElement(node);
        var descendants = node.querySelectorAll
          ? node.querySelectorAll("*")
          : [];
        for (var d = 0; d < descendants.length; d++) {
          processElement(descendants[d]);
        }
      }
    }
  });

  var startObserver = function () {
    observer.observe(document.body, { childList: true, subtree: true });
    processAll();
  };

  if (document.body) {
    startObserver();
  } else {
    document.addEventListener("DOMContentLoaded", startObserver);
  }
})();
