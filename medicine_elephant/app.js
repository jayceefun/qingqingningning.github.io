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

  // 音效：浏览器现合成，不用音频文件，离线可用
  let actx = null;
  function tone(freqs, dur, type, vol) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = actx.currentTime;
      freqs.forEach((f, i) => {
        const o = actx.createOscillator();
        const g = actx.createGain();
        const t = t0 + i * dur * 0.75;
        o.type = type || "sine";
        o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol || 0.07, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(actx.destination);
        o.start(t);
        o.stop(t + dur + 0.03);
      });
    } catch (e) { /* 不支持音频时静默 */ }
  }
  const sfx = {
    pop: () => tone([660, 880], 0.09, "triangle", 0.06),
    ok: () => tone([523, 659, 784], 0.13, "sine", 0.07),
    win: () => tone([523, 659, 784, 1047], 0.16, "triangle", 0.08),
    no: () => tone([240, 190], 0.12, "square", 0.025),
    drag: () => tone([440], 0.06, "sine", 0.04),
    tick: () => tone([990], 0.05, "sine", 0.035),
  };

  // 每页完成一次互动得一颗星，末页报总数
  const stars = new Set();
  function award(pi) {
    if (stars.has(pi)) return;
    stars.add(pi);
    const dot = dotsEl.children[pi];
    if (dot) dot.classList.add("is-star");
  }

  function ripple(x, y) {
    const r = document.createElement("span");
    r.className = "fx-ripple";
    r.style.left = x + "px";
    r.style.top = y + "px";
    spawn(r, 650);
  }

  function confetti(n) {
    const cols = ["#ff8fab", "#ffd54f", "#64b5f6", "#81c784", "#ba68c8", "#ff8a65"];
    const w = stage.clientWidth;
    for (let i = 0; i < (n || 40); i++) {
      const c = document.createElement("span");
      c.className = "fx-confetti";
      c.style.left = Math.random() * w + "px";
      c.style.background = cols[i % cols.length];
      c.style.setProperty("--tx", (Math.random() - 0.5) * 120 + "px");
      c.style.setProperty("--rot", Math.random() * 720 - 360 + "deg");
      c.style.animationDelay = Math.random() * 0.4 + "s";
      c.style.animationDuration = 1.4 + Math.random() * 0.9 + "s";
      spawn(c, 2800);
    }
  }

  // 每页初始画面：重新进入时还原，方便反复玩
  const skies = pages.map((p) => p.querySelector(".sky"));
  const snaps = skies.map((s) => ({ html: s.innerHTML, cls: s.className }));
  const fresh = () => ({ flags: new Set(), count: 0, tally: 0, pick: null, cycle: 0, seq: 0, open: null, flipLock: false });
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
    if (index === total - 1 && stars.size > 0) {
      window.setTimeout(() => {
        const t = `你收集了 ${stars.size} 颗星星`;
        const c = stageMid();
        bubble(c.x, c.y, t);
        speak(t, true);
        confetti(30);
        sfx.win();
      }, 800);
    }
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
    award(pages.indexOf(page));
    const t = page.dataset.done;
    window.setTimeout(() => {
      sfx.win();
      confetti(36);
      if (!t) return;
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

  // data-target / data-also：点一个物体，改变画面里别的物体
  function applyTargets(el, page) {
    const d = el.dataset;
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
    // data-move-to="dx,dy"：移动到画面里的另一处（SVG 单位）
    if (d.moveTo) {
      const [mx, my] = d.moveTo.split(",").map(Number);
      el.style.transition = `transform ${d.moveMs || 1400}ms ease-in-out`;
      el.style.transform = `translate(${mx}px, ${my}px)`;
    }
    applyTargets(el, page);
    if (d.set) st.flags.add(d.set);
    sfx.pop();
    award(pages.indexOf(page));
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
    // data-group：同组物体都点过一遍，这页算完成
    if (d.group && !page.querySelector(`[data-group="${d.group}"]:not(.is-done)`)) pageDone(page, 1000);
  }

  function doCount(el, page, st, c) {
    if (el.classList.contains("is-counted")) { flashClass(el, "is-hop", 550); return; }
    st.count += 1;
    el.classList.add("is-counted");
    badge(el, st.count);
    sfx.ok();
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
    sfx.tick();
    flashClass(el, "is-pulse", 600);
    fx(el.dataset.fx || "bubbles", c);
    bubble(c.x, c.top, ZH[st.tally] || String(st.tally));
    speak(ZH[st.tally] || String(st.tally));
    if (st.tally === max) {
      window.setTimeout(() => { bubble(c.x, c.top, el.dataset.done); speak(el.dataset.done, true); burstSparks(c.x, c.y, 16); }, 800);
      pageDone(page, 900);
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
      sfx.ok();
      const t = "放对啦，" + el.dataset.say;
      bubble(c.x, c.top, t);
      speak(t);
      const left = page.querySelectorAll('[data-interact="pick"]:not(.is-gone)').length;
      if (!left) pageDone(page, 1200);
    } else {
      flashClass(el, "is-no", 420);
      sfx.no();
      bubble(c.x, c.top, "不对哦，换一个桶");
      speak("不对哦，换一个桶");
    }
  }

  // 按顺序点：data-step 从 1 开始，点错提示该点哪一个
  function doSeq(el, page, st, c) {
    const step = Number(el.dataset.step);
    if (el.classList.contains("is-seq-done")) { flashClass(el, "is-hop", 500); return; }
    if (step !== st.seq + 1) {
      sfx.no();
      flashClass(el, "is-no", 420);
      const want = page.querySelector(`[data-interact="seq"][data-step="${st.seq + 1}"]`);
      const t = want ? `先点${want.getAttribute("aria-label")}` : "换一个试试";
      bubble(c.x, c.top, t);
      speak(t);
      if (want) flashClass(want, "is-hint", 1400);
      return;
    }
    st.seq += 1;
    el.classList.add("is-seq-done");
    badge(el, st.seq);
    generic(el, page, st, c);
    const all = page.querySelectorAll('[data-interact="seq"]').length;
    if (st.seq === all) pageDone(page, 1100);
  }

  // 选一选：data-ok="1" 是正确答案
  function doQuiz(el, page, st, c) {
    if (st.flags.has("quiz-done")) { flashClass(el, "is-hop", 500); return; }
    if (el.dataset.ok === "1") {
      st.flags.add("quiz-done");
      el.classList.add("is-right");
      page.querySelectorAll('[data-interact="quiz"]').forEach((x) => { if (x !== el) x.classList.add("is-faded"); });
      sfx.ok();
      fx("stars", c);
      bubble(c.x, c.top, el.dataset.say || "答对啦");
      speak(el.dataset.say || "答对啦");
      ["target", "also"].forEach((k) => {
        if (!el.dataset[k]) return;
        page.querySelectorAll(el.dataset[k]).forEach((t) => {
          if (el.dataset[k + "Swap"]) swapUse(t, el.dataset[k + "Swap"], false);
          classes(t, el.dataset[k + "Add"], "add");
          if (el.dataset[k + "Anim"]) flashClass(t, el.dataset[k + "Anim"], 800);
        });
      });
      pageDone(page, 1000);
    } else {
      sfx.no();
      flashClass(el, "is-no", 420);
      const t = el.dataset.say || "再想想";
      bubble(c.x, c.top, t);
      speak(t);
    }
  }

  // 翻牌配对：data-pair 相同的两张是一对
  function doFlip(el, page, st, c) {
    if (st.flipLock || el.classList.contains("is-open")) return;
    el.classList.add("is-open");
    sfx.pop();
    if (!st.open) { st.open = el; return; }
    const a = st.open;
    st.open = null;
    if (a.dataset.pair === el.dataset.pair) {
      [a, el].forEach((x) => x.classList.add("is-matched"));
      sfx.ok();
      fx("stars", c);
      const t = el.dataset.say || "一对";
      bubble(c.x, c.top, t);
      speak(t);
      const left = page.querySelectorAll('[data-interact="flip"]:not(.is-matched)').length;
      if (!left) pageDone(page, 900);
    } else {
      st.flipLock = true;
      window.setTimeout(() => {
        sfx.no();
        [a, el].forEach((x) => x.classList.remove("is-open"));
        st.flipLock = false;
      }, 850);
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
      sfx.no();
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
      case "seq": doSeq(el, page, st, c); return;
      case "quiz": doQuiz(el, page, st, c); return;
      case "flip": doFlip(el, page, st, c); return;
      case "drag":
      case "rub":
      case "hold":
        // 手势类由指针事件处理；单纯点一下只给提示
        if (!el.classList.contains("is-done") && d.hint) { bubble(c.x, c.top, d.hint); speak(d.hint); }
        return;
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
        // 只有摸一摸的页面，摸一下也算完成
        if (!page.querySelector('[data-interact]:not([data-interact="pet"])')) pageDone(page, 900);
        return;
      default:
        generic(el, page, st, c);
    }
  }

  // ---------- 手势：拖一拖 / 擦一擦 / 按住 ----------
  let gesture = null;
  let suppressClick = 0;
  const GESTURE_SEL = '[data-interact="drag"],[data-interact="rub"],[data-interact="hold"]';

  function svgScale(el) {
    const m = el.ownerSVGElement && el.ownerSVGElement.getScreenCTM();
    return m ? m.a : 1;
  }
  function bboxCenter(el) {
    const b = el.getBBox();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  }
  function allDone(page, type) {
    return !page.querySelector(`[data-interact="${type}"]:not(.is-done)`);
  }

  stage.addEventListener("pointerdown", (e) => {
    const el = e.target.closest(GESTURE_SEL);
    if (!el || el.classList.contains("is-done")) return;
    const page = el.closest(".page");
    const pi = pages.indexOf(page);
    if (pi !== index) return;
    const st = states[pi];
    if (el.dataset.need && !st.flags.has(el.dataset.need)) return;
    skies[pi].dataset.dirty = "1";
    e.preventDefault();
    gesture = { el, page, st, type: el.dataset.interact, x0: e.clientX, y0: e.clientY, lastX: e.clientX, lastY: e.clientY, moved: 0, scale: svgScale(el) };
    if (gesture.type === "drag") { el.classList.add("is-dragging"); sfx.drag(); }
    if (gesture.type === "rub") gesture.cover = page.querySelector(el.dataset.cover);
    if (gesture.type === "hold") startHold(gesture);
  });

  window.addEventListener("pointermove", (e) => {
    if (!gesture) return;
    const g = gesture;
    const dx = e.clientX - g.x0;
    const dy = e.clientY - g.y0;
    const step = Math.hypot(e.clientX - g.lastX, e.clientY - g.lastY);
    g.lastX = e.clientX;
    g.lastY = e.clientY;
    g.moved = Math.max(g.moved, Math.hypot(dx, dy));
    if (g.type === "drag") g.el.style.transform = `translate(${dx / g.scale}px, ${dy / g.scale}px)`;
    else if (g.type === "rub") rubMove(g, step, e);
  });

  function endGesture() {
    if (!gesture) return;
    const g = gesture;
    gesture = null;
    if (g.moved > 6 || g.type === "hold") suppressClick = Date.now();
    if (g.type === "drag") dropDrag(g);
    else if (g.type === "hold") endHold(g);
  }
  window.addEventListener("pointerup", endGesture);
  window.addEventListener("pointercancel", endGesture);
  // 手势进行中不让页面滚动或翻页
  stage.addEventListener("touchmove", (e) => { if (gesture) e.preventDefault(); }, { passive: false });

  function dropDrag(g) {
    const { el, page, st } = g;
    const d = el.dataset;
    el.classList.remove("is-dragging");
    if (g.moved < 6) { el.style.transform = ""; return; }
    const m = el.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/) || [0, 0, 0];
    const tx = Number(m[1]);
    const ty = Number(m[2]);
    const ec = bboxCenter(el);
    const cx = ec.x + tx;
    const cy = ec.y + ty;
    const hit = Array.from(page.querySelectorAll(d.drop || ".drop")).find((t) => {
      const b = t.getBBox();
      const pad = 16;
      return cx > b.x - pad && cx < b.x + b.width + pad && cy > b.y - pad && cy < b.y + b.height + pad;
    });
    const c = elCenter(el);
    const fits = hit && (!hit.dataset.accept || hit.dataset.accept === d.kind) && !(hit.classList.contains("is-filled") && !hit.dataset.multi);
    el.classList.add("is-snapping");
    window.setTimeout(() => el.classList.remove("is-snapping"), 460);
    if (fits) {
      const tc = bboxCenter(hit);
      const ox = Number(d.snapX || 0);
      const oy = Number(d.snapY || 0);
      el.style.transform = `translate(${tc.x - ec.x + ox}px, ${tc.y - ec.y + oy}px)`;
      el.classList.add("is-done", "is-placed");
      if (!hit.dataset.multi) hit.classList.add("is-filled");
      flashClass(hit, "is-pulse", 600);
      sfx.ok();
      award(pages.indexOf(page));
      const hc = elCenter(hit);
      fx(d.fx || "stars", hc, d.color);
      const say = d.say || "放好啦";
      bubble(hc.x, hc.top, say);
      speak(say);
      applyTargets(el, page);
      if (d.set) st.flags.add(d.set);
      if (allDone(page, "drag")) pageDone(page, 1000);
    } else {
      el.style.transform = "";
      sfx.no();
      const t = hit ? d.wrong || "不是这里哦" : d.hint || "再拖近一点";
      bubble(c.x, c.top, t);
      speak(t);
    }
  }

  function rubMove(g, step, e) {
    const d = g.el.dataset;
    const need = Number(d.amount || 700);
    const before = g.st.rub || 0;
    g.st.rub = before + step;
    const p = Math.min(1, g.st.rub / need);
    if (g.cover) g.cover.style.opacity = String(1 - p);
    if (Math.floor(g.st.rub / 80) !== Math.floor(before / 80)) {
      sfx.tick();
      const s = stage.getBoundingClientRect();
      fx(d.fx || "bubbles", { x: e.clientX - s.left, y: e.clientY - s.top, w: 30, h: 30, top: e.clientY - s.top }, d.color);
    }
    if (p >= 1 && !g.el.classList.contains("is-done")) {
      gesture = null;
      suppressClick = Date.now();
      generic(g.el, g.page, g.st, elCenter(g.el));
      if (allDone(g.page, "rub")) pageDone(g.page, 900);
    }
  }

  function startHold(g) {
    const ms = Number(g.el.dataset.ms || 1400);
    const c = elCenter(g.el);
    const ring = document.createElement("span");
    ring.className = "fx-hold";
    ring.style.left = c.x + "px";
    ring.style.top = c.y + "px";
    fxLayer.appendChild(ring);
    g.ring = ring;
    g.t0 = performance.now();
    g.el.classList.add("is-holding");
    let lastTick = 0;
    const loop = (now) => {
      if (gesture !== g) return;
      const p = Math.min(1, (now - g.t0) / ms);
      ring.style.setProperty("--p", p * 360 + "deg");
      if (now - lastTick > 180) { lastTick = now; sfx.tick(); }
      if (p >= 1) {
        gesture = null;
        suppressClick = Date.now();
        cleanupHold(g);
        generic(g.el, g.page, g.st, elCenter(g.el));
        if (allDone(g.page, "hold")) pageDone(g.page, 900);
        return;
      }
      g.raf = requestAnimationFrame(loop);
    };
    g.raf = requestAnimationFrame(loop);
  }
  function cleanupHold(g) {
    cancelAnimationFrame(g.raf);
    if (g.ring) g.ring.remove();
    g.el.classList.remove("is-holding");
  }
  function endHold(g) {
    cleanupHold(g);
    if (g.el.classList.contains("is-done")) return;
    const c = elCenter(g.el);
    const t = g.el.dataset.hint || "按住不放哦";
    bubble(c.x, c.top, t);
    speak(t);
  }

  stage.addEventListener("click", (e) => {
    if (e.target.closest(".controls")) return;
    if (Date.now() - suppressClick < 450) return;
    const hit = e.target.closest("[data-interact]");
    if (hit) {
      e.stopPropagation();
      const s = stage.getBoundingClientRect();
      ripple(e.clientX - s.left, e.clientY - s.top);
      handle(hit);
      return;
    }
    if (e.target.closest(".caption")) return;
    const s = stage.getBoundingClientRect();
    burstSparks(e.clientX - s.left, e.clientY - s.top, 5, ["#ffe08a", "#fff", "#ff8fab"]);
  });

  let startX = 0, startY = 0, tracking = false;
  stage.addEventListener("touchstart", (e) => {
    if (e.target.closest && e.target.closest(GESTURE_SEL)) { tracking = false; return; }
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
