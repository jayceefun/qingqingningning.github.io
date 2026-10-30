
(() => {
  const pages = Array.from(document.querySelectorAll(".page"));
  const total = pages.length;
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const indicator = document.getElementById("pageIndicator");
  const dotsEl = document.getElementById("dots");
  const stage = document.getElementById("stage");
  let index = 0, x0 = 0, y0 = 0;
  for (let i = 0; i < total; i++) {
    const d = document.createElement("span");
    d.className = "dot" + (i === 0 ? " is-on" : "");
    dotsEl.appendChild(d);
  }
  const dots = Array.from(dotsEl.children);
  function show(i) {
    index = Math.max(0, Math.min(total - 1, i));
    pages.forEach((p, n) => p.classList.toggle("is-active", n === index));
    dots.forEach((d, n) => d.classList.toggle("is-on", n === index));
    indicator.textContent = (index + 1) + " / " + total;
    btnPrev.disabled = index === 0;
    const end = index === total - 1;
    btnNext.textContent = end ? "再看一遍" : "下一页";
    btnNext.disabled = false;
  }
  function next() { show(index >= total - 1 ? 0 : index + 1); }
  function prev() { if (index > 0) show(index - 1); }
  btnPrev.addEventListener("click", prev);
  btnNext.addEventListener("click", next);
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });
  stage.addEventListener("touchstart", (e) => { x0 = e.changedTouches[0].clientX; y0 = e.changedTouches[0].clientY; }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) next(); else prev();
  }, { passive: true });
  const toast = document.getElementById("toast");
  function say(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(say._t);
    say._t = setTimeout(() => toast.classList.remove("show"), 900);
  }
  const mode = document.body.dataset.mode;
  if (mode === "paint") {
    document.querySelectorAll("[data-color]").forEach((b) => b.addEventListener("click", () => {
      document.getElementById("balloon").setAttribute("fill", b.dataset.color);
      say(b.dataset.name);
    }));
  } else if (mode === "count") {
    let n = 0;
    document.querySelectorAll("[data-bird]").forEach((b) => b.addEventListener("click", () => {
      const want = n + 1;
      if (Number(b.dataset.bird) !== want) { say("先数第 " + want + " 只"); return; }
      b.classList.add("is-on");
      n = want;
      say(String(n));
      if (n === 5) say("五只，数完啦");
    }));
  } else if (mode === "mood") {
    document.querySelectorAll("[data-mood]").forEach((b) => b.addEventListener("click", () => {
      document.getElementById("moodFace").textContent = b.dataset.face;
      const ok = b.dataset.mood === document.getElementById("weather").dataset.need;
      say(ok ? "对啦，心情和天气在一起" : "再看看窗外");
    }));
  } else if (mode === "greet") {
    document.querySelectorAll("[data-greet]").forEach((b) => b.addEventListener("click", () => {
      say(b.dataset.greet);
      if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(b.dataset.greet);
        u.lang = "zh-CN";
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      }
    }));
  } else if (mode === "daynight") {
    document.getElementById("skyToggle").addEventListener("click", () => {
      const sky = document.getElementById("daySky");
      const night = sky.dataset.night === "1";
      sky.dataset.night = night ? "0" : "1";
      document.getElementById("sun").style.display = night ? "block" : "none";
      document.getElementById("moon").style.display = night ? "none" : "block";
      say(night ? "白天，企鹅去玩耍" : "黑夜，企鹅要睡觉");
    });
  } else if (mode === "grow") {
    let s = 0;
    const scales = ["0.35", "0.6", "0.85", "1"];
    document.getElementById("water").addEventListener("click", () => {
      if (s < 3) s += 1;
      document.getElementById("plant").setAttribute("transform", "translate(180 250) scale(" + scales[s] + ") translate(-180 -250)");
      say(s === 3 ? "开花啦" : "咕嘟，又喝了一口水");
    });
  } else if (mode === "traffic") {
    let green = false;
    document.getElementById("light").addEventListener("click", () => {
      green = !green;
      document.getElementById("redLamp").setAttribute("fill", green ? "#ccc" : "#e23b3b");
      document.getElementById("greenLamp").setAttribute("fill", green ? "#43a047" : "#ccc");
      say(green ? "绿灯，可以走" : "红灯，停一停");
    });
    document.getElementById("deer").addEventListener("click", () => {
      if (!green) { say("红灯亮着，先别走"); return; }
      document.getElementById("deerBody").setAttribute("transform", "translate(70 0)");
      say("小鹿安全过去啦");
    });
  } else if (mode === "sort") {
    let picked = null;
    document.querySelectorAll("[data-item]").forEach((b) => b.addEventListener("click", () => { picked = b; say("放到哪一桶？"); }));
    document.querySelectorAll("[data-bin]").forEach((bin) => bin.addEventListener("click", () => {
      if (!picked) { say("先点一个垃圾"); return; }
      if (picked.dataset.item === bin.dataset.bin) {
        picked.style.display = "none";
        say("放对啦");
        picked = null;
      } else say("这个桶不收它");
    }));
  } else if (mode === "steps") {
    let step = 0;
    const names = ["抹肥皂", "搓一搓", "冲干净"];
    document.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => {
      if (Number(b.dataset.step) !== step) { say("先做：" + names[step]); return; }
      b.classList.add("is-on");
      step += 1;
      say(step === 3 ? "小手干净啦" : "下一步：" + names[step]);
    }));
  } else if (mode === "seasons") {
    const looks = {
      spring: ["#b7e3f7", "#7dce7a", "#ff8fab"],
      summer: ["#7ec8f0", "#2e7d32", "#43a047"],
      autumn: ["#f6d7a8", "#e09a3a", "#e23b3b"],
      winter: ["#d7e6f5", "#8d6e63", "#fff"]
    };
    document.querySelectorAll("[data-season]").forEach((b) => b.addEventListener("click", () => {
      const c = looks[b.dataset.season];
      document.getElementById("seasonSky").setAttribute("fill", c[0]);
      document.getElementById("leaf").setAttribute("fill", c[1]);
      document.getElementById("bloom").setAttribute("fill", c[2]);
      say(b.dataset.label);
    }));
  }
  show(0);
})();
