/* Step by step pages: the tick boxes of a `- [ ] step` list work, and are remembered in this
   browser. Nothing leaves it. Pages without such a list are untouched. */
(function () {
  "use strict";
  var KEY = "bsm_docs_checks";
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* a preference only */ } }
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); }
  function init() {
    var boxes = document.querySelectorAll(".task-list-item input[type=checkbox]");
    if (!boxes.length) return;
    var page = location.pathname.replace(/\/(fr\/)?/, "/");
    var store = load();
    var done = store[page] || [];
    boxes.forEach(function (b) {
      var li = b.closest("li");
      var k = hash((li ? li.textContent : "").trim().slice(0, 120));
      b.disabled = false;
      b.checked = done.indexOf(k) >= 0;
      b.addEventListener("change", function () {
        var s = load(), cur = s[page] || [], i = cur.indexOf(k);
        if (b.checked && i < 0) cur.push(k);
        if (!b.checked && i >= 0) cur.splice(i, 1);
        if (cur.length) s[page] = cur; else delete s[page];
        save(s);
      });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  // Material swaps page content without a reload when instant navigation is on; ours is off, but
  // this keeps the script right if that ever changes.
  if (window.document$ && window.document$.subscribe) window.document$.subscribe(init);
})();
