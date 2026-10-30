(() => {
  const pages = Array.from(document.querySelectorAll(".page"));
  const total = pages.length;
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const indicator = document.getElementById("pageIndicator");
  const dotsEl = document.getElementById("dots");
  const stage = document.getElementById("stage");
  const fxLayer = document.getElementById("fxLayer");
  const knownCount = document.getElementById("knownCount");
  const known = new Set();

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
    const letter = pages[index].dataset.letter;
    indicator.textContent = letter ? `${letter} · ${index + 1} / ${total}` : `${index + 1} / ${total}`;
    btnPrev.disabled = index === 0;
    btnNext.disabled = false;
    const atEnd = index === total - 1;
    btnNext.textContent = atEnd ? "再看一遍" : "下一页";
    btnNext.setAttribute("aria-label", atEnd ? "再看一遍" : "下一页");
    if (knownCount) knownCount.textContent = `已认识 ${known.size} / 26`;
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

  function speak(raw) {
    if (!raw || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    raw.split(",").forEach((part) => {
      const [text, lang] = part.split("|");
      if (!text) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === "zh" ? "zh-CN" : "en-US";
      u.rate = lang === "zh" ? 0.95 : 0.82;
      window.speechSynthesis.speak(u);
    });
  }

  function markKnown(letter) {
    if (!letter) return;
    known.add(letter);
    const card = document.querySelector(`.page[data-letter="${letter}"] .letter-card`);
    if (card) card.classList.add("is-known");
    document.querySelectorAll(`.abc-key[data-letter="${letter}"]`).forEach((k) => k.classList.add("is-known"));
    if (knownCount) knownCount.textContent = `已认识 ${known.size} / 26`;
  }

  function burst(type, x, y) {
    const n = type === "heart" ? 5 : 8;
    for (let i = 0; i < n; i += 1) {
      const el = document.createElement("span");
      el.className = type === "heart" ? "fx-heart" : "fx-spark";
      el.style.left = `${x + (Math.random() - 0.5) * 80}px`;
      el.style.top = `${y + (Math.random() - 0.5) * 36}px`;
      fxLayer.appendChild(el);
      setTimeout(() => el.remove(), 900);
    }
  }

  btnPrev.addEventListener("click", prev);
  btnNext.addEventListener("click", next);

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === " ") {
      e.preventDefault();
      next();
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
      return;
    }
    if (e.key.length === 1 && e.key >= "a" && e.key <= "z") {
      const letter = e.key.toUpperCase();
      const page = pages.findIndex((p) => p.dataset.letter === letter);
      if (page >= 0) {
        show(page);
        const btn = pages[page].querySelector("[data-speak]");
        speak(btn && btn.dataset.speak);
        markKnown(letter);
      }
    }
  });

  stage.addEventListener("touchstart", (e) => {
    const t = e.changedTouches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }, { passive: true });

  stage.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (dx < 0) next();
    else prev();
  }, { passive: true });

  stage.addEventListener("click", (e) => {
    const jump = e.target.closest("[data-goto]");
    if (jump && stage.contains(jump)) {
      e.stopPropagation();
      const page = Number(jump.dataset.goto);
      show(page);
      speak(jump.dataset.speak);
      markKnown(jump.dataset.letter);
      jump.classList.add("is-pop");
      setTimeout(() => jump.classList.remove("is-pop"), 240);
      const rect = stage.getBoundingClientRect();
      burst("spark", e.clientX - rect.left, e.clientY - rect.top);
      return;
    }
    const btn = e.target.closest("[data-interact]");
    if (!btn || !stage.contains(btn)) return;
    e.stopPropagation();
    btn.classList.add("is-pop");
    setTimeout(() => btn.classList.remove("is-pop"), 240);
    const rect = stage.getBoundingClientRect();
    const kind = btn.dataset.interact;
    if (kind === "qing" || kind === "ning") burst("heart", e.clientX - rect.left, e.clientY - rect.top);
    else burst("spark", e.clientX - rect.left, e.clientY - rect.top);
    if (kind === "letter" || kind === "thing") {
      speak(btn.dataset.speak);
      markKnown(pages[index].dataset.letter);
    }
  });

  show(0);
})();
