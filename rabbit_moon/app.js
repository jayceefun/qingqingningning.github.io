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

  pages.forEach((_, i) => {
    const d = document.createElement("span");
    d.className = "dot" + (i === 0 ? " is-on" : "");
    dotsEl.appendChild(d);
  });

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
      seedFireflies(target);
    }, 460);

    index = nextPage;
    updateUI();

    if (hint && index > 0) {
      hint.style.opacity = "0.55";
      hint.style.transition = "opacity 0.4s";
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

  function seedFireflies(page) {
    const host = page.querySelector(".fireflies");
    if (!host) return;
    host.innerHTML = "";
    const dense = host.classList.contains("dense");
    const count = dense ? 14 : 9;
    for (let i = 0; i < count; i++) {
      const f = document.createElement("span");
      f.className = "firefly";
      f.style.left = 8 + Math.random() * 84 + "%";
      f.style.top = 10 + Math.random() * 55 + "%";
      f.style.setProperty("--dx", Math.random() * 60 - 30 + "px");
      f.style.setProperty("--dy", Math.random() * -50 - 10 + "px");
      f.style.animationDuration = 4 + Math.random() * 5 + "s";
      f.style.animationDelay = Math.random() * 4 + "s";
      host.appendChild(f);
    }
  }

  seedFireflies(pages[0]);

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

  function burstSparks(x, y, n = 10, asStar = false) {
    const colors = ["#ffe9a8", "#ffffff", "#ffd0a8", "#c8e8ff", "#ffd0e8"];
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      p.className = "fx-spark" + (asStar ? " star" : "");
      const ang = (Math.PI * 2 * i) / n + Math.random() * 0.35;
      const dist = 26 + Math.random() * 48;
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.setProperty("--tx", Math.cos(ang) * dist + "px");
      p.style.setProperty("--ty", Math.sin(ang) * dist + "px");
      if (!asStar) p.style.background = colors[i % colors.length];
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

  function notes(x, y) {
    ["♪", "♫", "♩"].forEach((g, i) => {
      const n = document.createElement("span");
      n.className = "fx-note";
      n.textContent = g;
      n.style.left = x + i * 10 + "px";
      n.style.top = y + "px";
      n.style.setProperty("--tx", 8 + i * 10 + "px");
      n.style.animationDelay = i * 0.07 + "s";
      spawn(n, 1000);
    });
  }

  function leaves(x, y) {
    for (let i = 0; i < 7; i++) {
      const leaf = document.createElement("span");
      leaf.className = "fx-leaf";
      leaf.style.left = x + (Math.random() * 30 - 15) + "px";
      leaf.style.top = y + "px";
      leaf.style.setProperty("--tx", Math.random() * 40 - 20 + "px");
      leaf.style.background = ["#6aaa70", "#4f8a58", "#8bc48a"][i % 3];
      leaf.style.animationDelay = i * 0.05 + "s";
      spawn(leaf, 1100);
    }
  }

  function bubble(x, y, text) {
    const b = document.createElement("div");
    b.className = "fx-bubble";
    b.textContent = text;
    b.style.left = x + "px";
    b.style.top = y - 36 + "px";
    spawn(b, 1700);
  }

  function shootStar(x, y) {
    const s = document.createElement("span");
    s.className = "fx-shoot";
    s.style.left = x + "px";
    s.style.top = y + "px";
    s.style.setProperty("--rot", 18 + Math.random() * 30 + "deg");
    spawn(s, 750);
  }

  function flashClass(el, cls, ms) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    window.setTimeout(() => el.classList.remove(cls), ms);
  }

  const wiseLines = ["月亮属于大家～", "抬头就能看见", "慢慢来就好", "心静月自明"];

  function handleInteract(el, clientX, clientY) {
    const type = el.dataset.interact;
    const c = elCenter(el);
    const p = stagePoint(clientX, clientY);

    switch (type) {
      case "moon":
        flashClass(el, "is-pulse", 700);
        burstSparks(c.x, c.y, 14, true);
        bubble(c.x, c.y - 20, "亮晶晶！");
        break;
      case "rabbit":
        if (el.classList.contains("rabbit-jump")) {
          flashClass(el, "is-super-hop", 700);
          burstSparks(c.x, c.y - 20, 8, false);
        } else {
          flashClass(el, "is-pet", 550);
        }
        hearts(c.x, c.y - 10, 5);
        break;
      case "family":
        flashClass(el, "is-pet", 550);
        hearts(c.x, c.y - 8, 6);
        bubble(c.x, c.y - 24, "一家亲");
        break;
      case "house":
        flashClass(el, "is-lit", 1200);
        burstSparks(c.x, c.y - 10, 8, false);
        bubble(c.x, c.y - 28, "暖暖的家");
        break;
      case "bird":
        flashClass(el, "is-dash", 850);
        notes(c.x, c.y - 6);
        break;
      case "tree":
        flashClass(el, "is-shake", 600);
        leaves(c.x, c.y - 20);
        break;
      case "pond": {
        const pr = el.getBoundingClientRect();
        const lx = ((clientX - pr.left) / pr.width) * 100;
        const ly = ((clientY - pr.top) / pr.height) * 100;
        el.style.setProperty("--rx", lx + "%");
        el.style.setProperty("--ry", ly + "%");
        // 点击倒影：碎裂再聚回
        flashClass(el, "is-breaking", 1900);
        flashClass(el, "is-splash", 900);
        const reflect = el.querySelector(".moon-reflect");
        const rc = reflect ? elCenter(reflect) : p;
        burstSparks(rc.x, rc.y, 12, true);
        bubble(rc.x, rc.y - 18, "碎成亮晶晶！");
        break;
      }
      case "turtle":
        flashClass(el, "is-nod", 650);
        bubble(c.x, c.y - 18, wiseLines[Math.floor(Math.random() * wiseLines.length)]);
        burstSparks(c.x, c.y, 6, true);
        break;
      case "flower":
        flashClass(el, "is-bloom", 500);
        burstSparks(c.x, c.y, 7, false);
        hearts(c.x, c.y, 2);
        break;
      case "stars":
        shootStar(p.x, p.y);
        burstSparks(p.x, p.y, 5, true);
        break;
      default:
        burstSparks(p.x, p.y, 6, false);
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

    const p = stagePoint(e.clientX, e.clientY);
    if (e.target.closest(".caption")) return;
    burstSparks(p.x, p.y, 5, true);
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
      e.preventDefault();
      prev();
    }
  });

  updateUI();
})();
