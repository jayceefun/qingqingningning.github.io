
(() => {
  const pages = [...document.querySelectorAll(".page")];
  const total = pages.length;
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const indicator = document.getElementById("pageIndicator");
  const dotsEl = document.getElementById("dots");
  const stage = document.getElementById("stage");
  const toast = document.getElementById("toast");
  let index = 0, x0 = 0, y0 = 0;
  for (let i = 0; i < total; i++) {
    const d = document.createElement("span");
    d.className = "dot" + (i === 0 ? " is-on" : "");
    dotsEl.appendChild(d);
  }
  const dots = [...dotsEl.children];
  function show(i) {
    index = Math.max(0, Math.min(total - 1, i));
    pages.forEach((p, n) => p.classList.toggle("is-active", n === index));
    dots.forEach((d, n) => d.classList.toggle("is-on", n === index));
    indicator.textContent = `${index + 1} / ${total}`;
    btnPrev.disabled = index === 0;
    btnNext.textContent = index === total - 1 ? "再看一遍" : "下一页";
  }
  function next() { show(index >= total - 1 ? 0 : index + 1); }
  function prev() { if (index > 0) show(index - 1); }
  btnPrev.onclick = prev; btnNext.onclick = next;
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });
  stage.addEventListener("touchstart", (e) => { x0 = e.changedTouches[0].clientX; y0 = e.changedTouches[0].clientY; }, {passive:true});
  stage.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    dx < 0 ? next() : prev();
  }, {passive:true});
  function say(t) {
    if (!toast) return;
    toast.textContent = t;
    toast.classList.add("show");
    clearTimeout(say._t);
    say._t = setTimeout(() => toast.classList.remove("show"), 900);
  }
  function speak(t) {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "zh-CN"; u.rate = 0.95;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }
  const state = { count: 0, mix: [], grow: 0, green: false, pick: null, wash: 0, night: false };
  stage.addEventListener("click", (e) => {
    const hot = e.target.closest("[data-hot]");
    if (!hot || !stage.contains(hot)) return;
    e.stopPropagation();
    const page = hot.closest(".page");
    if (!page || !page.classList.contains("is-active")) return;
    const book = document.body.dataset.book;
    const name = hot.dataset.hot;

    if (book === "color_bear") {
      if (name.startsWith("pot-")) {
        const ball = page.querySelector("#ball");
        if (ball) { ball.setAttribute("fill", hot.dataset.color); say(hot.dataset.say); }
      } else if (name.startsWith("apple-")) {
        hot.classList.add("gone"); say(hot.dataset.say || "放进篮子");
      } else if (name === "mix-r" || name === "mix-y") {
        state.mix.push(hot.dataset.color);
        say(state.mix.length === 1 ? "再点另一种颜色" : "点大盘子混合");
        if (state.mix.length > 2) state.mix = state.mix.slice(-2);
      } else if (name === "mix-out") {
        const out = page.querySelector("#mixOut");
        if (state.mix.length >= 2 && out) { out.setAttribute("fill", "#ff9800"); say("变成橙色啦"); state.mix = []; }
        else say("先点红和黄");
      } else if (name === "find-red") { say("找到红色了"); hot.classList.add("ok"); }
      else if (name === "find-blue") { say("找到蓝色了"); hot.classList.add("ok"); }
      else if (name === "party" || name === "balloon" || name === "bear") { say("跳一跳"); hot.classList.add("ok"); setTimeout(()=>hot.classList.remove("ok"),400); }
      return;
    }
    if (book === "count_birds" && name === "bird") {
      const n = Number(hot.dataset.n);
      if (n !== state.count + 1) { say("先点 " + (state.count + 1)); return; }
      hot.classList.add("ok"); state.count = n; say(String(n));
      if (n === 5) { say("五只，数完啦"); state.count = 0; }
      return;
    }
    if (book === "mood_cat") {
      const mouth = page.querySelector("#catMouth");
      if (name === "face-sad") { if (mouth) mouth.setAttribute("d", "M172 268 q8 -8 16 0"); say("难过"); }
      else if (name === "face-happy") { if (mouth) mouth.setAttribute("d", "M172 262 q8 8 16 0"); say("开心"); }
      else if (name === "raindrops" || name === "cloud") say("滴答滴答");
      else if (name === "sun") say("暖暖的");
      else if (name === "cat") say("喵");
      return;
    }
    if (book === "hello_puppy") {
      if (name === "say-hi") { say("你好"); speak("你好"); }
      else if (name === "say-thanks") { say("谢谢"); speak("谢谢"); }
      else if (name === "say-bye") { say("再见"); speak("再见"); }
      else if (name === "pup") { say("汪汪"); const paw = page.querySelector("#pawWave"); if (paw) { paw.setAttribute("transform", "rotate(-20 120 280)"); setTimeout(()=>paw.removeAttribute("transform"),300);} }
      return;
    }
    if (book === "day_penguin") {
      const bg = page.querySelector("#bgDN");
      const skyStars = page.querySelector("#skyStars");
      if (name === "sun") { state.night = false; if (bg) bg.setAttribute("fill", "#b7e3f7"); if (skyStars) skyStars.setAttribute("opacity", "0"); say("白天"); }
      else if (name === "moon") { state.night = true; if (bg) bg.setAttribute("fill", "#1a2744"); if (skyStars) skyStars.setAttribute("opacity", "1"); say("黑夜"); }
      else if (name === "stars") { if (skyStars) skyStars.setAttribute("opacity", "1"); say("一闪一闪"); }
      else if (name === "igloo") say("回家睡觉");
      else if (name === "penguin") say(state.night ? "嘘，睡觉" : "去玩啦");
      return;
    }
    if (book === "grow_seed") {
      if (name === "can") {
        state.grow = Math.min(3, state.grow + 1);
        const plant = page.querySelector("#plant");
        const scales = [0.25, 0.45, 0.7, 1];
        if (plant) plant.setAttribute("transform", `translate(180 340) scale(${scales[state.grow]}) translate(-180 -340)`);
        say(state.grow === 3 ? "开花啦" : "咕嘟");
      } else if (name === "sun") say("晒太阳");
      else if (name === "seed") say("小种子");
      return;
    }
    if (book === "cross_deer") {
      if (name === "light") {
        state.green = !state.green;
        page.querySelector("#lampR").setAttribute("fill", state.green ? "#ccc" : "#e23b3b");
        page.querySelector("#lampG").setAttribute("fill", state.green ? "#43a047" : "#ccc");
        say(state.green ? "绿灯" : "红灯");
      } else if (name === "deer") {
        if (!state.green) { say("红灯，停"); return; }
        hot.setAttribute("transform", "translate(160 0)"); say("安全通过");
      } else if (name === "car") say("嘀嘀，停下");
      return;
    }
    if (book === "sort_raccoon") {
      if (name === "paper" || name === "peel" || name === "bottle") { state.pick = name; say("放到哪一桶"); return; }
      if (name.startsWith("bin-")) {
        const need = name.slice(4);
        if (!state.pick) { say("先点垃圾"); return; }
        if (state.pick === need) {
          const item = page.querySelector(`[data-hot="${state.pick}"]`);
          if (item) item.classList.add("gone");
          say("放对啦"); state.pick = null;
        } else say("换个桶");
        return;
      }
      if (name === "raccoon") say("棒棒的");
      return;
    }
    if (book === "wash_monkey") {
      if (name === "step1" || name === "soap") { if (state.wash !== 0) { say("先点肥皂"); return; } state.wash = 1; say("抹肥皂"); hot.classList.add("ok"); }
      else if (name === "step2" || name === "hands") { if (state.wash !== 1) { say("再搓一搓"); return; } state.wash = 2; say("搓一搓"); hot.classList.add("ok"); }
      else if (name === "step3" || name === "water" || name === "sink") { if (state.wash !== 2) { say("最后冲水"); return; } state.wash = 3; say("冲干净"); const w = page.querySelector("#waterStream"); if (w) w.setAttribute("opacity", "1"); hot.classList.add("ok"); }
      else if (name === "monkey") say(state.wash === 3 ? "干净啦" : "先洗手");
      return;
    }
    if (book === "season_tree") {
      const leaf = page.querySelector("#sLeaf");
      const bloom = page.querySelector("#sBloom");
      const sky = page.querySelector("#sSky");
      const map = {
        spring: ["#b7e3f7", "#81c784", "#ff8fab", "春天"],
        summer: ["#4fc3f7", "#2e7d32", "#43a047", "夏天"],
        autumn: ["#ffe0b2", "#ef6c00", "#e53935", "秋天"],
        winter: ["#cfd8dc", "#b0bec5", "#fff", "冬天"]
      };
      if (map[name]) {
        const m = map[name];
        if (sky) sky.setAttribute("fill", m[0]);
        if (leaf) leaf.setAttribute("fill", m[1]);
        if (bloom) bloom.setAttribute("fill", m[2]);
        say(m[3]);
      } else if (name === "tree") say("沙沙沙");
      return;
    }
  });
  show(0);
})();
