(() => {
  const pages = Array.from(document.querySelectorAll(".page"));
  const total = pages.length;
  const indicator = document.getElementById("pageIndicator");
  const dotsEl = document.getElementById("dots");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const stage = document.getElementById("stage");
  const hint = document.getElementById("hint");
  const fxLayer = document.getElementById("fxLayer");
  const SVGNS = "http://www.w3.org/2000/svg";
  const ZH = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

  // 每页初始画面：重新进入时还原，方便反复玩
  const skies = pages.map((p) => p.querySelector(".sky"));
  const snaps = skies.map((s) => ({ html: s.innerHTML, cls: s.className }));
  const fresh = () => ({ flags: new Set(), count: 0, tally: 0, pick: null, cycle: 0 });
  const states = pages.map(fresh);

  let index = 0;
  let locking = false;

  pages.forEach((_, i) => {
    const d = document.createElement("span");
    d.className = "dot" + (i === 0 ? " is-on" : "");
    dotsEl.appendChild(d);
  });

  function resetPage(i) {
    const sky = skies[i];
    if (sky.dataset.dirty) {
      sky.innerHTML = snaps[i].html;
      sky.className = snaps[i].cls;
    }
    states[i] = fresh();
  }

  function updateUI() {
    indicator.textContent = `${index + 1} / ${total}`;
    btnPrev.disabled = index === 0;
    btnNext.textContent = index === total - 1 ? "再看一遍" : "下一页";
    dotsEl.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("is-on", i === index));
  }

  function goTo(nextPage, dir) {
    if (locking || nextPage === index || nextPage < 0 || nextPage >= total) return;
    locking = true;
    resetPage(nextPage);
    const current = pages[index];
    const target = pages[nextPage];
    const exitClass = dir === "next" ? "is-exit-left" : "is-exit-right";
    current.classList.remove("is-active");
    current.classList.add(exitClass);
    target.style.transform = dir === "next" ? "translateX(18%)" : "translateX(-18%)";
    target.style.opacity = "0";
    void target.offsetWidth;
    target.classList.add("is-active");
    target.style.transform = "";
    target.style.opacity = "";
    window.setTimeout(() => {
      current.classList.remove(exitClass);
      locking = false;
    }, 460);
    index = nextPage;
    updateUI();
    if (hint && index > 0) hint.style.opacity = "0.55";
    if (window.speechSynthesis) speechSynthesis.cancel();
  }

  function next() {
    if (index === total - 1) { goTo(0, "prev"); return; }
    goTo(index + 1, "next");
  }
  function prev() { goTo(index - 1, "prev"); }
  btnNext.addEventListener("click", next);
  btnPrev.addEventListener("click", prev);

  // 支持 index.html#p=3 直接打开某页
  const m = location.hash.match(/p=(\d+)/);
  if (m) {
    const n = Math.min(total - 1, Math.max(0, Number(m[1])));
    pages[0].classList.remove("is-active");
    pages[n].classList.add("is-active");
    index = n;
  }

  function elCenter(el) {
    const s = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - s.left, y: r.top + r.height / 2 - s.top, top: r.top - s.top, w: r.width, h: r.height };
  }
  function spawn(node, life) { fxLayer.appendChild(node); window.setTimeout(() => node.remove(), life); }

  function burstSparks(x, y, n = 10, colors) {
    const cols = colors || ["#ffe08a", "#ffffff", "#ff8fab", "#5eb7e6", "#f0c14a"];
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      p.className = "fx-spark" + (i % 3 === 0 ? " star" : "");
      const ang = (Math.PI * 2 * i) / n + Math.random() * 0.35;
      const dist = 26 + Math.random() * 48;
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.setProperty("--tx", Math.cos(ang) * dist + "px");
      p.style.setProperty("--ty", Math.sin(ang) * dist + "px");
      p.style.background = cols[i % cols.length];
      spawn(p, 800);
    }
  }
  function glyphs(x, y, list, n = 4) {
    for (let i = 0; i < n; i++) {
      const h = document.createElement("span");
      h.className = "fx-glyph";
      h.textContent = list[i % list.length];
      h.style.left = x + (Math.random() * 30 - 15) + "px";
      h.style.top = y - 8 + "px";
      h.style.animationDelay = i * 0.1 + "s";
      spawn(h, 1200);
    }
  }
  function drops(x, y, color, n = 7) {
    for (let i = 0; i < n; i++) {
      const d = document.createElement("span");
      d.className = "fx-drop";
      d.style.background = color;
      d.style.left = x + "px";
      d.style.top = y + "px";
      d.style.setProperty("--tx", Math.random() * 44 - 22 + "px");
      d.style.setProperty("--ty", 30 + Math.random() * 40 + "px");
      spawn(d, 700);
    }
  }
  function fall(c, kind, color, n = 14) {
    for (let i = 0; i < n; i++) {
      const f = document.createElement("span");
      f.className = "fx-fall " + kind;
      if (color && kind !== "rain" && kind !== "snow") f.style.background = color;
      f.style.left = c.x + (Math.random() - 0.5) * Math.max(c.w, 80) + "px";
      f.style.top = c.y + (Math.random() - 0.3) * 20 + "px";
      f.style.setProperty("--tx", (Math.random() - 0.5) * 60 + "px");
      f.style.setProperty("--ty", 110 + Math.random() * 120 + "px");
      f.style.setProperty("--rot", Math.random() * 360 + "deg");
      f.style.setProperty("--dur", 0.9 + Math.random() * 0.8 + "s");
      f.style.animationDelay = Math.random() * 0.35 + "s";
      spawn(f, 2200);
    }
  }
  function bubbles(c, n = 9) {
    for (let i = 0; i < n; i++) {
      const b = document.createElement("span");
      b.className = "fx-bubble-ring";
      b.style.left = c.x + (Math.random() - 0.5) * 60 + "px";
      b.style.top = c.y + (Math.random() - 0.5) * 20 + "px";
      b.style.setProperty("--tx", (Math.random() - 0.5) * 30 + "px");
      b.style.animationDelay = Math.random() * 0.3 + "s";
      spawn(b, 1500);
    }
  }
  function fx(kind, c, color) {
    switch (kind || "sparks") {
      case "none": return;
      case "hearts": glyphs(c.x, c.y - 10, ["♡", "♥", "💕", "✨"], 5); return;
      case "notes": glyphs(c.x, c.y - 10, ["♪", "♫", "♪"], 3); return;
      case "stars": burstSparks(c.x, c.y, 12, ["#ffe08a", "#fff", "#fff59d"]); return;
      case "zz": glyphs(c.x + 10, c.y - 20, ["Z", "z", "Z"], 3); return;
      case "drops": drops(c.x, c.y, color || "#64b5f6"); return;
      case "rain": fall(c, "rain", null, 18); return;
      case "snow": fall(c, "snow", null, 18); return;
      case "petals": fall(c, "petal", color || "#ff9ec4", 16); return;
      case "leaves": fall(c, "leaf", color || "#f39c34", 14); return;
      case "bubbles": bubbles(c); return;
      default: burstSparks(c.x, c.y, 10, color ? [color, "#fff", "#ffe08a"] : null);
    }
  }
  function bubble(x, y, text) {
    if (!text) return;
    const b = document.createElement("div");
    b.className = "fx-bubble";
    b.textContent = text;
    const w = stage.clientWidth;
    b.style.left = Math.min(w - 50, Math.max(50, x)) + "px";
    b.style.top = Math.max(8, y - 36) + "px";
    spawn(b, 1700);
  }
  function flashClass(el, cls, ms) {
    if (!cls || cls === "none") return;
    el.classList.remove(cls);
    el.getBoundingClientRect();
    el.classList.add(cls);
    window.setTimeout(() => el.classList.remove(cls), ms);
  }
  function speak(t, keep) {
    if (!t || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "zh-CN";
    u.rate = 0.95;
    if (!keep) speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
  function swapUse(el, to, toggle) {
    const u = el.querySelector("use");
    if (!u) return true;
    const cur = u.getAttribute("href");
    if (!u.dataset.orig) u.dataset.orig = cur;
    if (toggle && cur === to) { u.setAttribute("href", u.dataset.orig); return false; }
    u.setAttribute("href", to);
    return true;
  }
  function classes(el, list, op) {
    if (list) list.split(" ").forEach((k) => k && el.classList[op](k));
  }
  function stageMid() {
    return { x: stage.clientWidth / 2, y: stage.clientHeight * 0.3, w: 120 };
  }
  function pageDone(page, delay) {
    const t = page.dataset.done;
    if (!t) return;
    window.setTimeout(() => {
      const c = stageMid();
      bubble(c.x, c.y, t);
      speak(t, true);
      burstSparks(c.x, c.y, 16);
    }, delay || 900);
  }
  function badge(el, n) {
    const bb = el.getBBox();
    const g = document.createElementNS(SVGNS, "g");
    const cx = bb.x + bb.width / 2;
    const cy = bb.y - 8;
    const c = document.createElementNS(SVGNS, "circle");
    c.setAttribute("cx", cx); c.setAttribute("cy", cy); c.setAttribute("r", 11);
    c.setAttribute("fill", "#ffe08a"); c.setAttribute("stroke", "#fff"); c.setAttribute("stroke-width", 2.5);
    const t = document.createElementNS(SVGNS, "text");
    t.setAttribute("x", cx); t.setAttribute("y", cy + 4.6);
    t.setAttribute("text-anchor", "middle"); t.setAttribute("font-size", 13); t.setAttribute("font-weight", 700);
    t.setAttribute("font-family", "Segoe UI, Verdana, Arial"); t.setAttribute("fill", "#6a4416");
    t.textContent = String(n);
    g.appendChild(c); g.appendChild(t);
    el.appendChild(g);
  }

  function generic(el, page, st, c, sayOverride) {
    const d = el.dataset;
    const move = d.move === "1";
    if (d.once && el.classList.contains("is-done")) {
      if (!move) flashClass(el, d.anim || "is-pulse", 650);
      fx(d.fx, c, d.color);
      bubble(c.x, c.top, d.say);
      speak(d.say);
      return;
    }
    let on = true;
    if (d.swap) on = swapUse(el, d.swap, d.toggle === "1");
    if (d.flip) {
      if (st.flags.has(d.flip)) st.flags.delete(d.flip); else st.flags.add(d.flip);
      on = st.flags.has(d.flip);
    }
    classes(el, d.add, "add");
    classes(el, d.remove, "remove");
    ["target", "also"].forEach((k) => {
      const sel = d[k];
      if (!sel) return;
      const list = sel === ".sky" ? [page.querySelector(".sky")] : page.querySelectorAll(sel);
      list.forEach((t) => {
        if (d[k + "Swap"]) swapUse(t, d[k + "Swap"], false);
        classes(t, d[k + "Add"], "add");
        classes(t, d[k + "Remove"], "remove");
        if (d[k + "Anim"]) flashClass(t, d[k + "Anim"], 800);
      });
    });
    if (d.set) st.flags.add(d.set);
    if (!move) flashClass(el, d.anim || "is-pulse", d.anim === "is-swing" ? 2000 : 1000);
    fx(d.fx, c, d.color);
    const say = sayOverride || (on ? d.say : d.sayOff || d.say);
    bubble(c.x, c.top, say);
    speak(say);
    if (d.reply) {
      const at = page.querySelector(d.replyAt || d.target);
      window.setTimeout(() => {
        const rc = at ? elCenter(at) : stageMid();
        bubble(rc.x, rc.top, d.reply);
        speak(d.reply, true);
        if (at) flashClass(at, "is-hop", 550);
      }, 1300);
    }
    el.classList.add("is-done");
  }

  function doCount(el, page, st, c) {
    if (el.classList.contains("is-counted")) { flashClass(el, "is-hop", 550); return; }
    st.count += 1;
    el.classList.add("is-counted");
    badge(el, st.count);
    flashClass(el, "is-hop", 550);
    burstSparks(c.x, c.y, 8);
    bubble(c.x, c.top, ZH[st.count] || String(st.count));
    speak(ZH[st.count] || String(st.count));
    const all = page.querySelectorAll('[data-interact="count"]').length;
    if (st.count === all) pageDone(page);
  }

  function doTally(el, page, st, c) {
    const max = Number(el.dataset.max || 10);
    if (st.tally >= max) { flashClass(el, "is-pulse", 600); fx("bubbles", c); return; }
    st.tally += 1;
    flashClass(el, "is-pulse", 600);
    fx(el.dataset.fx || "bubbles", c);
    bubble(c.x, c.top, ZH[st.tally] || String(st.tally));
    speak(ZH[st.tally] || String(st.tally));
    if (st.tally === max) {
      window.setTimeout(() => { bubble(c.x, c.top, el.dataset.done); speak(el.dataset.done, true); burstSparks(c.x, c.y, 16); }, 800);
    }
  }

  function doPick(el, page, st, c) {
    if (el.classList.contains("is-gone")) return;
    page.querySelectorAll('[data-interact="pick"]').forEach((x) => x.classList.remove("is-picked"));
    el.classList.add("is-picked");
    st.pick = el;
    flashClass(el, "is-hop", 550);
    bubble(c.x, c.top, el.dataset.say);
    speak(el.dataset.say);
  }

  function doBin(el, page, st, c) {
    if (!st.pick) {
      flashClass(el, "is-no", 420);
      bubble(c.x, c.top, "先点一样垃圾");
      speak("先点一样垃圾");
      return;
    }
    const item = st.pick;
    if (item.dataset.kind === el.dataset.accept) {
      const ib = item.getBBox();
      const bb = el.getBBox();
      const dx = bb.x + bb.width / 2 - (ib.x + ib.width / 2);
      const dy = bb.y + 6 - (ib.y + ib.height / 2);
      item.classList.remove("is-picked");
      item.style.transform = `translate(${dx}px, ${dy}px) scale(0.3)`;
      item.classList.add("is-gone");
      st.pick = null;
      flashClass(el, "is-pulse", 650);
      burstSparks(c.x, c.y, 12);
      const t = "放对啦，" + el.dataset.say;
      bubble(c.x, c.top, t);
      speak(t);
      const left = page.querySelectorAll('[data-interact="pick"]:not(.is-gone)').length;
      if (!left) pageDone(page, 1200);
    } else {
      flashClass(el, "is-no", 420);
      bubble(c.x, c.top, "不对哦，换一个桶");
      speak("不对哦，换一个桶");
    }
  }

  function handle(el) {
    const page = el.closest(".page");
    const pi = pages.indexOf(page);
    if (pi !== index) return;
    const st = states[pi];
    skies[pi].dataset.dirty = "1";
    const d = el.dataset;
    const c = elCenter(el);
    if (d.need && !st.flags.has(d.need)) {
      flashClass(el, "is-no", 420);
      bubble(c.x, c.top, d.needSay);
      speak(d.needSay);
      return;
    }
    switch (d.interact) {
      case "count": doCount(el, page, st, c); return;
      case "tally": doTally(el, page, st, c); return;
      case "pick": doPick(el, page, st, c); return;
      case "bin": doBin(el, page, st, c); return;
      case "cycle": {
        const words = d.words.split("|");
        const t = words[st.cycle % words.length];
        st.cycle += 1;
        generic(el, page, st, c, t);
        return;
      }
      case "pet":
        flashClass(el, "is-pet", 600);
        fx(d.fx || "hearts", c, d.color);
        bubble(c.x, c.top, d.say);
        speak(d.say);
        return;
      default:
        generic(el, page, st, c);
    }
  }

  stage.addEventListener("click", (e) => {
    if (e.target.closest(".controls")) return;
    const hit = e.target.closest("[data-interact]");
    if (hit) {
      e.stopPropagation();
      handle(hit);
      return;
    }
    if (e.target.closest(".caption")) return;
    const s = stage.getBoundingClientRect();
    burstSparks(e.clientX - s.left, e.clientY - s.top, 5, ["#ffe08a", "#fff", "#ff8fab"]);
  });

  let startX = 0, startY = 0, tracking = false;
  stage.addEventListener("touchstart", (e) => {
    const t = e.changedTouches[0];
    startX = t.clientX; startY = t.clientY; tracking = true;
  }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (!tracking) return;
    tracking = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) next(); else prev();
  }, { passive: true });
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
    else if (e.key === "ArrowLeft") prev();
  });

  updateUI();
})();
