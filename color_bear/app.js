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

  let index = 0;
  let locking = false;
  const state = {
    brush: null,
    mix: new Set(),
    apples: 0,
    skyPainted: false,
    huntDone: false,
  };

  pages.forEach((_, i) => {
    const d = document.createElement("span");
    d.className = "dot" + (i === 0 ? " is-on" : "");
    dotsEl.appendChild(d);
  });

  // 派对气球预上色
  document.querySelectorAll('[data-interact="party-balloon"]').forEach((el) => {
    const body = el.querySelector(".balloon-body") || el.querySelector("ellipse");
    // use 内部要找 shadow DOM 不行；改用 setAttribute 在 use 外层不行
    // 派对页气球用 CSS filter 着色
    const c = el.dataset.color;
    if (c) el.style.setProperty("--balloon", c);
    el.querySelector(".art-svg")?.style.setProperty("filter", `drop-shadow(0 4px 10px rgba(60,40,20,.18))`);
    // 直接改 fill：clone 一份或对 use 无效。改用 inline SVG 路径——派对气球在 click 时上色
    paintBalloonEl(el, c);
  });

  function paintBalloonEl(wrap, color) {
    if (!wrap || !color) return;
    // <use> 无法直接改内部 fill，换成给 svg 加 style 并用 CSS 变量；
    // 更稳妥：在 wrap 上叠一层半透明 tint
    let tint = wrap.querySelector(".balloon-tint");
    if (!tint) {
      tint = document.createElement("span");
      tint.className = "balloon-tint";
      tint.style.cssText =
        "position:absolute;left:12%;top:2%;width:76%;height:58%;border-radius:50%;pointer-events:none;mix-blend-mode:multiply;opacity:.85;transition:background .35s";
      wrap.appendChild(tint);
    }
    tint.style.background = color;
  }

  function updateUI() {
    indicator.textContent = `${index + 1} / ${total}`;
    btnPrev.disabled = index === 0;
    btnNext.textContent = index === total - 1 ? "再看一遍" : "下一页";
    dotsEl.querySelectorAll(".dot").forEach((d, i) => {
      d.classList.toggle("is-on", i === index);
    });
  }

  function goTo(nextPage, dir) {
    if (locking || nextPage === index || nextPage < 0 || nextPage >= total) return;
    locking = true;
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
    if (hint && index > 0) {
      hint.style.opacity = "0.55";
    }
  }

  function next() {
    if (index === total - 1) {
      goTo(0, "prev");
      return;
    }
    goTo(index + 1, "next");
  }

  function prev() {
    goTo(index - 1, "prev");
  }

  btnNext.addEventListener("click", next);
  btnPrev.addEventListener("click", prev);

  function stagePoint(clientX, clientY) {
    const rect = stage.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function elCenter(el) {
    const s = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return {
      x: r.left + r.width / 2 - s.left,
      y: r.top + r.height / 2 - s.top,
    };
  }

  function spawn(node, life) {
    fxLayer.appendChild(node);
    window.setTimeout(() => node.remove(), life);
  }

  function burstSparks(x, y, n = 10, colors) {
    const cols = colors || ["#ffe08a", "#ffffff", "#ff8fab", "#5eb7e6", "#f0c14a"];
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      p.className = "fx-spark";
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

  function hearts(x, y, n = 4) {
    const glyphs = ["♡", "♥", "💕", "✨"];
    for (let i = 0; i < n; i++) {
      const h = document.createElement("span");
      h.className = "fx-heart";
      h.textContent = glyphs[i % glyphs.length];
      h.style.left = x + (Math.random() * 24 - 12) + "px";
      h.style.top = y - 8 + "px";
      h.style.animationDelay = i * 0.08 + "s";
      spawn(h, 1000);
    }
  }

  function paintDrops(x, y, color, n = 6) {
    for (let i = 0; i < n; i++) {
      const d = document.createElement("span");
      d.className = "fx-drop";
      d.style.background = color;
      d.style.left = x + "px";
      d.style.top = y + "px";
      d.style.setProperty("--tx", Math.random() * 40 - 20 + "px");
      d.style.setProperty("--ty", 30 + Math.random() * 40 + "px");
      spawn(d, 700);
    }
  }

  function bubble(x, y, text) {
    const b = document.createElement("div");
    b.className = "fx-bubble";
    b.textContent = text;
    b.style.left = x + "px";
    b.style.top = y - 36 + "px";
    spawn(b, 1600);
  }

  function flashClass(el, cls, ms) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    window.setTimeout(() => el.classList.remove(cls), ms);
  }

  function speak(t) {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "zh-CN";
    u.rate = 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  function handleInteract(el, clientX, clientY) {
    const type = el.dataset.interact;
    const c = elCenter(el);
    const p = stagePoint(clientX, clientY);
    const page = el.closest(".page");

    switch (type) {
      case "sun":
        flashClass(el, "is-pulse", 700);
        burstSparks(c.x, c.y, 12, ["#ffe08a", "#fff", "#f0c14a"]);
        bubble(c.x, c.y - 16, "暖暖的");
        break;

      case "sun-paint": {
        if (state.brush !== "#f0c14a") {
          bubble(c.x, c.y - 16, "先点黄颜料");
          flashClass(el, "is-pulse", 400);
          break;
        }
        flashClass(el, "is-pulse", 700);
        paintDrops(c.x, c.y, "#f0c14a", 8);
        burstSparks(c.x, c.y, 14, ["#ffe08a", "#f0c14a", "#fff"]);
        bubble(c.x, c.y - 20, "黄色太阳");
        speak("黄色");
        el.classList.add("glow", "is-painted");
        break;
      }

      case "balloon": {
        flashClass(el, "is-pulse", 600);
        burstSparks(c.x, c.y, 8);
        break;
      }

      case "pot": {
        const color = el.dataset.color;
        const name = el.dataset.name || "";
        paintDrops(c.x, c.y, color, 7);
        flashClass(el, "is-pulse", 400);
        const balloon = page.querySelector('[data-interact="balloon"]');
        if (balloon) {
          paintBalloonEl(balloon, color);
          const bc = elCenter(balloon);
          burstSparks(bc.x, bc.y, 10, [color, "#fff"]);
          bubble(bc.x, bc.y - 20, name + "色气球");
          speak(name + "色");
        }
        break;
      }

      case "pot-pick": {
        state.brush = el.dataset.color;
        page.querySelectorAll('[data-interact="pot-pick"]').forEach((x) => x.classList.remove("is-pick"));
        el.classList.add("is-pick");
        paintDrops(c.x, c.y, state.brush, 5);
        bubble(c.x, c.y - 16, "选好了");
        break;
      }

      case "apple": {
        if (el.classList.contains("gone")) return;
        el.classList.add("gone");
        state.apples += 1;
        burstSparks(c.x, c.y, 8, ["#e23b3b", "#ff8fab", "#fff"]);
        const basket = page.querySelector('[data-interact="basket"]');
        if (basket) {
          const bc = elCenter(basket);
          paintDrops(bc.x, bc.y - 10, "#e23b3b", 4);
          // 显示篮中果
          const fruit = basket.querySelector("#basketFruit");
          // use 内 id 不可见；用 tint 提示
          let pile = basket.querySelector(".fruit-pile");
          if (!pile) {
            pile = document.createElement("span");
            pile.className = "fruit-pile";
            pile.style.cssText =
              "position:absolute;left:28%;top:18%;width:44%;height:36%;border-radius:50%;background:#e23b3b;box-shadow:10px 4px 0 #c62828,-8px 6px 0 #ef5350;opacity:0;transition:opacity .35s";
            basket.appendChild(pile);
          }
          pile.style.opacity = String(Math.min(1, state.apples / 3));
        }
        if (state.apples >= 3) {
          bubble(c.x, c.y - 20, "摘完啦");
          speak("红色");
        }
        break;
      }

      case "basket":
        flashClass(el, "is-pulse", 500);
        bubble(c.x, c.y - 16, state.apples ? "满满的" : "空篮子");
        break;

      case "tree":
        flashClass(el, "is-shake", 550);
        burstSparks(c.x, c.y - 20, 8, ["#66bb6a", "#43a047", "#a5d6a7"]);
        break;

      case "mix": {
        const tone = el.dataset.tone;
        state.mix.add(tone);
        paintDrops(c.x, c.y, tone === "red" ? "#e23b3b" : "#f0c14a", 6);
        flashClass(el, "is-pulse", 400);
        bubble(c.x, c.y - 16, state.mix.size === 1 ? "再点另一滴" : "点调色盘");
        break;
      }

      case "palette": {
        const well = el.querySelector(".mix-well");
        if (state.mix.has("red") && state.mix.has("yellow")) {
          // use 内改不了，叠橙色层
          let tint = el.querySelector(".mix-tint");
          if (!tint) {
            tint = document.createElement("span");
            tint.className = "mix-tint";
            tint.style.cssText =
              "position:absolute;left:38%;top:48%;width:24%;height:30%;border-radius:50%;background:#ff9800;pointer-events:none;box-shadow:0 0 12px #ff9800";
            el.appendChild(tint);
          }
          burstSparks(c.x, c.y, 14, ["#ff9800", "#f0c14a", "#e23b3b"]);
          bubble(c.x, c.y - 20, "橙色！");
          speak("橙色");
          const flower = page.querySelector("#orangeFlower");
          if (flower) flower.classList.add("is-on");
          state.mix.clear();
        } else {
          bubble(c.x, c.y - 16, "先点红和黄");
          flashClass(el, "is-pulse", 400);
        }
        void well;
        break;
      }

      case "sky-pot": {
        state.skyPainted = true;
        paintDrops(c.x, c.y, "#5eb7e6", 8);
        page.querySelectorAll(".cloud").forEach((cloud) => cloud.classList.add("is-blue"));
        const bird = page.querySelector("#blueBird");
        if (bird) bird.classList.add("is-on");
        burstSparks(c.x, c.y, 10, ["#5eb7e6", "#fff", "#90caf9"]);
        bubble(c.x, c.y - 16, "蓝色");
        speak("蓝色");
        break;
      }

      case "cloud":
        if (!state.skyPainted) {
          bubble(c.x, c.y - 12, "先点蓝颜料");
          break;
        }
        el.classList.add("is-blue");
        burstSparks(c.x, c.y, 6, ["#5eb7e6", "#fff"]);
        break;

      case "bird":
        if (!el.classList.contains("is-on")) return;
        flashClass(el, "is-dash", 800);
        burstSparks(c.x, c.y, 8, ["#5eb7e6", "#fff"]);
        bubble(c.x, c.y - 16, "啾啾");
        break;

      case "hunt": {
        const ok = el.dataset.ok === "1";
        if (ok) {
          el.classList.add("is-ok");
          state.huntDone = true;
          flashClass(el, "is-pulse", 600);
          burstSparks(c.x, c.y, 12, ["#e23b3b", "#ff8fab", "#fff"]);
          hearts(c.x, c.y - 10, 5);
          bubble(c.x, c.y - 20, "找到红色了");
          speak("红色");
          const bear = page.querySelector('[data-interact="bear"]');
          if (bear) flashClass(bear, "is-hop", 550);
        } else {
          el.classList.add("is-wrong");
          window.setTimeout(() => el.classList.remove("is-wrong"), 400);
          bubble(c.x, c.y - 16, "再找找");
        }
        break;
      }

      case "party-balloon": {
        paintBalloonEl(el, el.dataset.color);
        flashClass(el, "is-pulse", 600);
        burstSparks(c.x, c.y, 12, [el.dataset.color, "#fff", "#ffe08a"]);
        hearts(c.x, c.y - 8, 3);
        break;
      }

      case "bear":
        flashClass(el, "is-pet", 550);
        hearts(c.x, c.y - 10, 5);
        break;

      case "flower":
        flashClass(el, "is-pulse", 500);
        burstSparks(c.x, c.y, 7, ["#ff8fab", "#ffb3c6", "#ffe08a"]);
        hearts(c.x, c.y, 2);
        break;

      default:
        burstSparks(p.x, p.y, 6);
    }
  }

  stage.addEventListener("click", (e) => {
    if (e.target.closest("button.btn") || e.target.closest(".controls")) return;
    const hit = e.target.closest("[data-interact]");
    if (hit) {
      e.stopPropagation();
      handleInteract(hit, e.clientX, e.clientY);
      return;
    }
    if (e.target.closest(".caption")) return;
    const p = stagePoint(e.clientX, e.clientY);
    burstSparks(p.x, p.y, 5, ["#ffe08a", "#fff", "#ff8fab"]);
  });

  let startX = 0;
  let startY = 0;
  let tracking = false;

  stage.addEventListener(
    "touchstart",
    (e) => {
      const t = e.changedTouches[0];
      startX = t.clientX;
      startY = t.clientY;
      tracking = true;
    },
    { passive: true }
  );

  stage.addEventListener(
    "touchend",
    (e) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) next();
      else prev();
    },
    { passive: true }
  );

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === " ") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft") {
      prev();
    }
  });

  updateUI();
})();
