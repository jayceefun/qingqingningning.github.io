(() => {
  const pages = Array.from(document.querySelectorAll(".page"));
  const total = pages.length;
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const indicator = document.getElementById("pageIndicator");
  const dotsEl = document.getElementById("dots");
  const stage = document.getElementById("stage");
  const fxLayer = document.getElementById("fxLayer");

  let index = 0;
  let touchStartX = 0;
  let touchStartY = 0;

  for (let i = 0; i < total; i += 1) {
    const d = document.createElement("span");
    d.className = "dot" + (i === 0 ? " is-on" : "");
    dotsEl.appendChild(d);
  }
  const dots = Array.from(dotsEl.children);

  function show(i) {
    index = Math.max(0, Math.min(total - 1, i));
    pages.forEach((p, n) => p.classList.toggle("is-active", n === index));
    dots.forEach((d, n) => d.classList.toggle("is-on", n === index));
    indicator.textContent = `${index + 1} / ${total}`;
    btnPrev.disabled = index === 0;
    // 末页不禁用：显示「再看一遍」
    btnNext.disabled = false;
    const atEnd = index === total - 1;
    btnNext.textContent = atEnd ? "再看一遍" : "下一页";
    btnNext.setAttribute("aria-label", atEnd ? "再看一遍" : "下一页");
  }

  function next() {
    if (index >= total - 1) {
      show(0);
      return;
    }
    show(index + 1);
  }

  function prev() {
    if (index > 0) show(index - 1);
  }

  btnPrev.addEventListener("click", prev);
  btnNext.addEventListener("click", next);

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === " ") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    }
  });

  // 滑动翻页：仅横向明显滑动时翻页，不把点击当翻页
  stage.addEventListener(
    "touchstart",
    (e) => {
      const t = e.changedTouches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    },
    { passive: true }
  );

  stage.addEventListener(
    "touchend",
    (e) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      if (dx < 0) next();
      else prev();
    },
    { passive: true }
  );

  function spawn(cls, x, y, color) {
    const el = document.createElement("span");
    el.className = cls;
    if (color) el.style.background = color;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    fxLayer.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  function burst(type, cx, cy) {
    const n = type === "heart" ? 5 : 7;
    for (let i = 0; i < n; i += 1) {
      const ox = (Math.random() - 0.5) * 70;
      const oy = (Math.random() - 0.5) * 40;
      if (type === "heart") {
        spawn("fx-heart", cx + ox, cy + oy, Math.random() > 0.5 ? "#ff8fab" : "#7dceb8");
      } else if (type === "crumb") {
        spawn("fx-crumb", cx + ox, cy + oy);
      } else if (type === "spark") {
        spawn("fx-spark", cx + ox, cy + oy);
      } else if (type === "feather") {
        spawn("fx-feather", cx + ox, cy + oy);
      }
    }
  }

  function onInteract(btn, clientX, clientY) {
    const kind = btn.dataset.interact;
    const rect = stage.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    btn.classList.add("is-pop");
    setTimeout(() => btn.classList.remove("is-pop"), 220);

    if (kind === "qing" || kind === "ning") {
      burst("heart", x, y);
    } else if (kind === "cookie") {
      burst("crumb", x, y);
    } else if (kind === "sun") {
      burst("spark", x, y);
    } else if (kind === "bird") {
      burst("feather", x, y);
    }
  }

  stage.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-interact]");
    if (!btn || !stage.contains(btn)) return;
    // 禁止点击画面翻页，仅特效
    e.stopPropagation();
    onInteract(btn, e.clientX, e.clientY);
  });

  show(0);
})();
