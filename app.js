/* Дитя многоэтажки — интерактив подъезда */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* приватный режим */ } },
  };

  /* =========================================================
     ЗВУК: всё синтезируется на лету, файлов нет
     ========================================================= */
  const Sound = (() => {
    let ctx = null, master, ventFilter, drone, on = false;

    function noiseBuffer(seconds, brown) {
      const len = Math.floor(ctx.sampleRate * seconds);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
      }
      return buf;
    }

    function init() {
      if (ctx) return true;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);

      // гул ламп дневного света
      const hum = ctx.createOscillator(); hum.type = 'sine'; hum.frequency.value = 50;
      const hum2 = ctx.createOscillator(); hum2.type = 'triangle'; hum2.frequency.value = 100;
      const hg = ctx.createGain(); hg.gain.value = 0.05;
      const hg2 = ctx.createGain(); hg2.gain.value = 0.012;
      hum.connect(hg).connect(master); hum2.connect(hg2).connect(master);
      hum.start(); hum2.start();

      // вентиляция: коричневый шум
      const vent = ctx.createBufferSource(); vent.buffer = noiseBuffer(3, true); vent.loop = true;
      ventFilter = ctx.createBiquadFilter(); ventFilter.type = 'lowpass'; ventFilter.frequency.value = 520;
      const vg = ctx.createGain(); vg.gain.value = 0.22;
      vent.connect(ventFilter).connect(vg).connect(master); vent.start();

      // гул бездны для «Клети»
      drone = ctx.createGain(); drone.gain.value = 0;
      const d1 = ctx.createOscillator(); d1.type = 'sawtooth'; d1.frequency.value = 41;
      const df = ctx.createBiquadFilter(); df.type = 'lowpass'; df.frequency.value = 150;
      d1.connect(df).connect(drone).connect(master); d1.start();

      dripLoop();
      return true;
    }

    function dripLoop() {
      setTimeout(() => { if (on) drip(); dripLoop(); }, rand(4000, 11000));
    }
    function drip() {
      const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(rand(1300, 1900), t);
      o.frequency.exponentialRampToValueAtTime(380, t + 0.12);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.3);
    }

    function set(v) {
      if (!init()) return false;
      on = v;
      if (ctx.state === 'suspended') ctx.resume();
      master.gain.setTargetAtTime(v ? 0.7 : 0, ctx.currentTime, 0.25);
      return true;
    }
    function ding() {
      if (!on) return;
      const t = ctx.currentTime;
      [[1318.5, 0], [1046.5, 0.24]].forEach(([f, dt]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, t + dt);
        g.gain.linearRampToValueAtTime(0.12, t + dt + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 1.2);
        o.connect(g).connect(master); o.start(t + dt); o.stop(t + dt + 1.3);
      });
    }
    function motor(dur) {
      if (!on) return;
      const t = ctx.currentTime, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = 68;
      f.type = 'lowpass'; f.frequency.value = 220;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.08, t + 0.15);
      g.gain.setValueAtTime(0.08, t + Math.max(0.2, dur - 0.2));
      g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(f).connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
    }
    function clunk() {
      if (!on) return;
      const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(120, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      g.gain.setValueAtTime(0.1, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.2);
    }
    function page() {
      if (!on) return;
      const t = ctx.currentTime, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noiseBuffer(0.25, false);
      f.type = 'bandpass'; f.frequency.value = 3200; f.Q.value = 0.6;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + 0.25);
    }
    function mood(floor) {
      if (!ctx) return;
      const t = ctx.currentTime, dark = floor === 5;
      ventFilter.frequency.setTargetAtTime(dark ? 230 : 520, t, 0.6);
      drone.gain.setTargetAtTime(dark ? 0.05 : 0, t, 0.8);
    }
    return { set, ding, motor, clunk, page, mood, get on() { return on; } };
  })();

  const soundBtn = $('#sound-toggle');
  const soundLabel = $('.hud-sound-label');
  function setSound(v) {
    const ok = Sound.set(v);
    const state = ok && v;
    soundBtn.setAttribute('aria-pressed', String(state));
    soundLabel.textContent = state ? 'звук: вкл' : 'звук: выкл';
    if (state) Sound.mood(currentFloor);
  }
  soundBtn.addEventListener('click', () => setSound(!Sound.on));

  /* =========================================================
     ТОСТ
     ========================================================= */
  const toastEl = $('#toast');
  let toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1900);
  }

  /* =========================================================
     ЗАГРУЗОЧНЫЙ ЭКРАН
     ========================================================= */
  const loader = $('#loader');
  let loaderOpen = false;
  (function initLoader() {
    if (!loader) return;
    if (store.get('mnozhka-in')) { loader.remove(); return; }
    loaderOpen = true;
    document.documentElement.style.overflow = 'hidden';

    const building = $('.loader-building', loader);
    const cells = Array.from({ length: 45 }, () => building.appendChild(document.createElement('i')));
    const order = cells.map((_, i) => i).sort(() => Math.random() - 0.5);
    const tips = [
      'Совет: если долго смотреть на стул, стул начнёт смотреть на тебя.',
      'Совет: лифт ходит по кнопкам 1–7. Или ногами по лестнице.',
      'Совет: на пятом этаже опять выкрутили лампочку. Свети мышкой.',
      'Совет: почтовый ящик №1 открыт для заказов.',
    ];
    const pct = $('#loader-pct'), tipEl = $('#loader-tip'), label = $('#loader-label');
    const actions = $('#loader-actions'), press = $('#loader-press');
    press.textContent = finePointer ? 'или нажми любую клавишу' : 'или тапни по экрану';
    let tipI = 0, ready = false;
    const tipTimer = setInterval(() => { tipI = (tipI + 1) % tips.length; tipEl.textContent = tips[tipI]; }, 1700);

    const fontsReady = Promise.race([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      new Promise(r => setTimeout(r, 2500)),
    ]);
    const dur = reduce ? 200 : 1800;
    const t0 = performance.now();
    let lit = 0;
    function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      const target = Math.floor(p * cells.length);
      while (lit < target) {
        cells[order[lit]].className = Math.random() < 0.12 ? 'tv' : 'on';
        lit++;
      }
      pct.textContent = Math.round(p * 100) + '%';
      if (p < 1) requestAnimationFrame(tick);
      else fontsReady.then(done);
    }
    requestAnimationFrame(tick);

    function done() {
      ready = true;
      label.textContent = 'подъезд загружен';
      pct.textContent = '100%';
      actions.classList.add('show');
      press.classList.add('show');
      $('#enter-sound').focus({ preventScroll: true });
    }
    function enter(withSound) {
      if (!ready || !loaderOpen) return;
      loaderOpen = false;
      clearInterval(tipTimer);
      store.set('mnozhka-in', '1');
      if (withSound) { setSound(true); setTimeout(() => Sound.ding(), 250); }
      loader.classList.add('gone');
      document.documentElement.style.overflow = '';
      document.removeEventListener('keydown', onKey, true);
      setTimeout(() => loader.remove(), 700);
    }
    function onKey(e) {
      if (!ready || !loaderOpen) return;
      if (e.key === 'Tab' || e.key === 'Shift') return;
      const onButton = e.target.closest && e.target.closest('#loader-actions');
      if (onButton && (e.key === 'Enter' || e.key === ' ')) return;
      e.preventDefault();
      e.stopPropagation();
      enter(false);
    }
    document.addEventListener('keydown', onKey, true);
    $('#enter-sound').addEventListener('click', () => enter(true));
    $('#enter-quiet').addEventListener('click', () => enter(false));
    loader.addEventListener('click', e => { if (!e.target.closest('button')) enter(false); });
  })();

  /* =========================================================
     НОЧНОЙ РАЙОН (canvas) + ЖИЛАЯ ЯЧЕЙКА С ГЛАЗКАМИ
     ========================================================= */
  const roof = $('#roof');
  const cube = $('#cube');
  const pupils = $$('.pupil', cube);
  const pointer = { x: innerWidth * 0.7, y: innerHeight * 0.4, nx: 0.3, ny: -0.2, last: 0 };
  let heroVisible = true;

  window.addEventListener('pointermove', e => {
    pointer.x = e.clientX; pointer.y = e.clientY;
    pointer.nx = (e.clientX / innerWidth) * 2 - 1;
    pointer.ny = (e.clientY / innerHeight) * 2 - 1;
    pointer.last = performance.now();
  }, { passive: true });

  const City = (() => {
    const cv = $('#city');
    if (!cv || !cv.getContext) return null;
    const g = cv.getContext('2d');
    const PAD = 70;
    const cfg = [
      { depth: 0.3, color: '#171a23', hMin: 0.2, hMax: 0.42, wMin: 60, wMax: 120, win: 'rgba(243,180,79,.45)', density: 0.1 },
      { depth: 0.6, color: '#111319', hMin: 0.26, hMax: 0.55, wMin: 90, wMax: 170, win: 'rgba(243,180,79,.75)', density: 0.16 },
      { depth: 1.0, color: '#0a0b0e', hMin: 0.12, hMax: 0.3, wMin: 140, wMax: 250, win: 'rgba(243,180,79,.95)', density: 0.2 },
    ];
    let W = 0, H = 0, dpr = 1, layers = [], stars = [];
    let tx = 0, ty = 0;

    function drawWin(o, w, c) {
      o.fillStyle = c.color; o.fillRect(w.x - 1, w.y - 1, w.w + 2, w.h + 2);
      o.fillStyle = w.lit ? (w.tv ? 'rgba(155,188,255,.85)' : c.win) : 'rgba(255,255,255,.035)';
      o.fillRect(w.x, w.y, w.w, w.h);
    }

    function build() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = cv.clientWidth; H = cv.clientHeight;
      if (!W || !H) return;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      const narrow = W < 700;
      layers = cfg.map(c => {
        const lw = W + PAD * 2;
        const off = document.createElement('canvas');
        off.width = Math.round(lw * dpr); off.height = Math.round(H * dpr);
        const o = off.getContext('2d'); o.scale(dpr, dpr);
        const wins = [];
        let x = -rand(0, 40);
        while (x < lw) {
          const bw = rand(c.wMin, c.wMax) * (narrow ? 0.6 : 1);
          const bh = H * rand(c.hMin, c.hMax);
          const by = H - bh;
          o.fillStyle = c.color;
          o.fillRect(x, by, bw, bh);
          if (Math.random() < 0.55) { // антенна
            const ax = x + bw * rand(0.15, 0.8);
            o.fillRect(ax, by - 14, 2, 14); o.fillRect(ax - 7, by - 12, 16, 2); o.fillRect(ax - 4, by - 7, 10, 2);
          }
          const cols = Math.max(2, Math.floor(bw / 15));
          const rows = Math.floor(bh / 17);
          const cw = bw / cols;
          for (let r = 1; r < rows; r++) {
            for (let k = 0; k < cols; k++) {
              const w = { x: x + k * cw + cw * 0.28, y: by + r * 17, w: cw * 0.44, h: 8, lit: Math.random() < c.density, tv: Math.random() < 0.08 };
              wins.push(w); drawWin(o, w, c);
            }
          }
          x += bw + rand(4, 24);
        }
        return { c, off, o, wins };
      });
      stars = Array.from({ length: Math.round((W * H) / 7000) }, () => ({ x: Math.random() * W, y: Math.random() * H * 0.55, a: rand(0.1, 0.7), s: Math.random() < 0.1 ? 2 : 1.2 }));
      draw();
    }

    function draw() {
      if (!W) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      for (const s of stars) {
        g.fillStyle = `rgba(231,229,223,${s.a})`;
        g.fillRect(s.x - tx * 6, s.y, s.s, s.s);
      }
      const sy = Math.min(scrollY, H);
      for (const L of layers) {
        const dx = -PAD - tx * PAD * L.c.depth;
        const dy = ty * 6 * L.c.depth + sy * (1 - L.c.depth) * 0.45;
        g.drawImage(L.off, dx, dy, L.off.width / dpr, H);
      }
    }

    function flip() {
      if (!layers.length) return;
      const L = layers[Math.floor(Math.random() * layers.length)];
      const w = L.wins[Math.floor(Math.random() * L.wins.length)];
      if (!w) return;
      w.lit = !w.lit;
      if (w.lit) w.tv = Math.random() < 0.15;
      drawWin(L.o, w, L.c);
    }

    function step(targetX, targetY) {
      tx += (targetX - tx) * 0.06;
      ty += (targetY - ty) * 0.06;
      draw();
    }

    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 150); });
    build();
    return { step, flip, build };
  })();

  // окна на боку куба
  const cubeWins = $('#cube-windows');
  const cubeCells = Array.from({ length: 20 }, () => {
    const i = cubeWins.appendChild(document.createElement('i'));
    const r = Math.random();
    if (r < 0.3) i.className = 'on'; else if (r < 0.36) i.className = 'tv';
    return i;
  });

  // моргание
  (function blinkLoop() {
    setTimeout(() => {
      if (!reduce) {
        cube.classList.add('blink');
        setTimeout(() => cube.classList.remove('blink'), 130);
        if (Math.random() < 0.25) setTimeout(() => { cube.classList.add('blink'); setTimeout(() => cube.classList.remove('blink'), 110); }, 260);
      }
      blinkLoop();
    }, rand(2200, 5600));
  })();

  setInterval(() => {
    if (!heroVisible) return;
    if (City) for (let i = 0; i < 2; i++) City.flip();
    const c = cubeCells[Math.floor(Math.random() * cubeCells.length)];
    c.className = c.className ? '' : (Math.random() < 0.2 ? 'tv' : 'on');
  }, 420);

  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(roof);

  function heroFrame(now) {
    if (heroVisible) {
      let nx = pointer.nx, ny = pointer.ny, px = pointer.x, py = pointer.y;
      const idle = now - pointer.last > 2500;
      if (idle) { // глаза осматриваются сами
        nx = Math.sin(now / 1900) * 0.7;
        ny = Math.cos(now / 2700) * 0.35;
      }
      if (!reduce) {
        City && City.step(nx, ny);
        cube.style.setProperty('--ry', (-30 + nx * 14).toFixed(2) + 'deg');
        cube.style.setProperty('--rx', (-16 - ny * 7).toFixed(2) + 'deg');
      } else if (City) City.step(0, 0);
      for (const p of pupils) {
        const eye = p.parentElement.getBoundingClientRect();
        const cx = eye.left + eye.width / 2, cy = eye.top + eye.height / 2;
        let dx, dy;
        if (idle) { dx = nx; dy = ny; } else {
          const vx = px - cx, vy = py - cy, len = Math.hypot(vx, vy) || 1;
          const k = Math.min(1, len / 260);
          dx = (vx / len) * k; dy = (vy / len) * k;
        }
        p.style.setProperty('--px', (dx * eye.width * 0.2).toFixed(1) + 'px');
        p.style.setProperty('--py', (dy * eye.height * 0.24).toFixed(1) + 'px');
      }
    }
    requestAnimationFrame(heroFrame);
  }
  requestAnimationFrame(heroFrame);

  /* =========================================================
     ЭТАЖИ, ТАБЛО, ЛИФТ
     ========================================================= */
  const floors = $$('[data-floor]');
  const liftLinks = $$('.lift-buttons a');
  const ledNums = [$('#led-num'), $('#doors .led-num')];
  const ledArrows = [$('#led-arrow'), $('#doors .led-arrow')];
  let currentFloor = 7, shownFloor = 7, ledTimer = 0, traveling = false;

  function showLED(n, arrow) {
    ledNums.forEach(el => { el.textContent = n; });
    ledArrows.forEach(el => { el.textContent = arrow || ''; });
  }
  function animateLED(to, stepMs = 110) {
    clearInterval(ledTimer);
    if (shownFloor === to) { showLED(to, ''); return; }
    const dir = to > shownFloor ? 1 : -1;
    const arrow = dir > 0 ? '▲' : '▼';
    showLED(shownFloor, arrow);
    ledTimer = setInterval(() => {
      shownFloor += dir;
      showLED(shownFloor, shownFloor === to ? '' : arrow);
      if (shownFloor === to) clearInterval(ledTimer);
    }, stepMs);
  }
  function markCurrent(n) {
    liftLinks.forEach(a => a.setAttribute('aria-current', String(+a.dataset.travel === n)));
  }
  markCurrent(7);

  const klet = $('#klet');
  let lastFlicker = 0;
  function onFloorEnter(n, section) {
    if (reduce) return;
    const sfx = $('.sfx', section);
    if (sfx) { sfx.classList.remove('pop'); void sfx.offsetWidth; sfx.classList.add('pop'); }
    if (n === 5 && performance.now() - lastFlicker > 8000) {
      lastFlicker = performance.now();
      klet.classList.add('flicker');
      setTimeout(() => klet.classList.remove('flicker'), 1000);
    }
  }
  function setCurrent(n, section) {
    if (n === currentFloor) return;
    currentFloor = n;
    if (!traveling) animateLED(n);
    markCurrent(n);
    Sound.mood(n);
    onFloorEnter(n, section);
  }
  const floorIO = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) setCurrent(+e.target.dataset.floor, e.target); });
  }, { rootMargin: '-45% 0px -54% 0px' });
  floors.forEach(f => floorIO.observe(f));

  const doors = $('#doors');
  const lift = $('#lift');
  const liftLed = $('#lift-led');
  const mobileMQ = matchMedia('(max-width: 899px)');

  function travel(n) {
    const target = floors.find(f => +f.dataset.floor === n);
    if (!target || traveling) return;
    closeLiftMenu();
    const heading = $('h1, h2', target);
    const land = () => {
      if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
      history.replaceState(null, '', '#' + target.id);
    };
    const top = () => target.getBoundingClientRect().top + scrollY;
    if (reduce) { window.scrollTo(0, top()); land(); return; }
    if (n === currentFloor && Math.abs(target.getBoundingClientRect().top) < 120) {
      window.scrollTo({ top: top(), behavior: 'smooth' });
      return;
    }
    traveling = true;
    Sound.clunk();
    doors.classList.add('closed');
    const span = Math.max(1, Math.abs(n - shownFloor));
    const ride = Math.max(500, span * 190);
    setTimeout(() => {
      Sound.motor(ride / 1000);
      animateLED(n, ride / span);
      window.scrollTo(0, top());
      setTimeout(() => {
        Sound.ding();
        doors.classList.remove('closed');
        traveling = false;
        land();
      }, ride + 120);
    }, 520);
  }

  document.addEventListener('click', e => {
    const a = e.target.closest('[data-travel]');
    if (!a || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    travel(+a.dataset.travel);
  });

  function syncLiftButton() {
    if (mobileMQ.matches) {
      liftLed.removeAttribute('tabindex');
      liftLed.setAttribute('aria-expanded', String(lift.classList.contains('open')));
      liftLed.setAttribute('aria-label', 'Лифт: открыть кнопки этажей');
    } else {
      lift.classList.remove('open');
      liftLed.setAttribute('tabindex', '-1');
      liftLed.removeAttribute('aria-expanded');
      liftLed.setAttribute('aria-label', 'Табло лифта');
    }
  }
  function closeLiftMenu() {
    if (!lift.classList.contains('open')) return;
    lift.classList.remove('open');
    syncLiftButton();
  }
  liftLed.addEventListener('click', () => {
    if (!mobileMQ.matches) return;
    lift.classList.toggle('open');
    syncLiftButton();
  });
  document.addEventListener('click', e => { if (!e.target.closest('#lift')) closeLiftMenu(); });
  mobileMQ.addEventListener ? mobileMQ.addEventListener('change', syncLiftButton) : mobileMQ.addListener(syncLiftButton);
  syncLiftButton();

  // цифры 1–7 вызывают лифт
  document.addEventListener('keydown', e => {
    if (loaderOpen || e.metaKey || e.ctrlKey || e.altKey) return;
    if ($('#lightbox').open) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (/^[1-7]$/.test(e.key)) travel(+e.key);
    if (e.key === 'Escape') closeLiftMenu();
  });

  // трафаретные номера чуть отстают при прокрутке
  const stencils = $$('.stencil');
  let scrollQueued = false;
  window.addEventListener('scroll', () => {
    if (reduce || scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      for (const s of stencils) {
        const r = s.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) continue;
        s.style.setProperty('--shift', ((r.top - innerHeight / 2) * -0.08).toFixed(1) + 'px');
      }
    });
  }, { passive: true });

  /* =========================================================
     ЧИТАЛКА «ПЕРЕРОЖДЕНИЕ В СТУЛ»
     ========================================================= */
  (function initReader() {
    const reader = $('#reader');
    if (!reader) return;
    const N = 10;
    const pages = Array.from({ length: N }, (_, i) => ({
      src: `img/chair/ch2-${String(i + 1).padStart(2, '0')}.webp`,
      w: i === 1 ? 800 : 573, h: i === 1 ? 571 : 800,
    }));
    const img = $('#reader-img'), cur = $('#reader-cur'), strip = $('#reader-strip');
    $('#reader-total').textContent = String(N).padStart(2, '0');
    const dots = pages.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.tabIndex = -1;
      b.addEventListener('click', () => go(i));
      strip.appendChild(b);
      return b;
    });
    let page = 0;
    function paint() {
      cur.textContent = String(page + 1).padStart(2, '0');
      dots.forEach((d, i) => d.setAttribute('aria-current', String(i === page)));
    }
    function go(i) {
      i = (i + N) % N;
      if (i === page) return;
      page = i;
      paint();
      Sound.page();
      img.classList.add('turning');
      const p = pages[i];
      const pre = new Image();
      pre.onload = pre.onerror = () => {
        img.src = p.src; img.width = p.w; img.height = p.h;
        img.alt = `Глава 2, страница ${i + 1}`;
        requestAnimationFrame(() => img.classList.remove('turning'));
        new Image().src = pages[(i + 1) % N].src;
      };
      pre.src = p.src;
    }
    paint();
    $('#reader-prev').addEventListener('click', () => go(page - 1));
    $('#reader-next').addEventListener('click', () => go(page + 1));
    const pageEl = $('#reader-page');
    let sx = null, sy = null;
    pageEl.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
    pageEl.addEventListener('pointerup', e => {
      if (sx === null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { go(page + (dx < 0 ? 1 : -1)); return; }
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
        const r = pageEl.getBoundingClientRect();
        go(page + (e.clientX - r.left < r.width / 2 ? -1 : 1));
      }
    });
    reader.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(page + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(page - 1); }
    });
  })();

  /* =========================================================
     ЛАЙТБОКС
     ========================================================= */
  const lb = $('#lightbox');
  const lbImg = $('#lb-img'), lbCap = $('#lb-cap');
  let lbGroup = [], lbIdx = 0, sketchDragged = false;
  function lbShow() {
    const a = lbGroup[lbIdx];
    const im = $('img', a);
    lbImg.src = a.getAttribute('href');
    lbImg.alt = im ? im.alt : '';
    const cap = a.dataset.caption || (im && im.alt) || '';
    lbCap.textContent = `${cap} · ${lbIdx + 1} / ${lbGroup.length}`;
  }
  function lbStep(d) { lbIdx = (lbIdx + d + lbGroup.length) % lbGroup.length; lbShow(); Sound.page(); }
  if (lb && typeof lb.showModal === 'function') {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[data-lightbox]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      if (sketchDragged) return;
      lbGroup = $$(`a[data-lightbox="${a.dataset.lightbox}"]`);
      lbIdx = lbGroup.indexOf(a);
      lbShow();
      lb.showModal();
    });
    $('#lb-prev').addEventListener('click', () => lbStep(-1));
    $('#lb-next').addEventListener('click', () => lbStep(1));
    $('#lb-close').addEventListener('click', () => lb.close());
    lb.addEventListener('click', e => { if (e.target === lb || e.target.tagName === 'FIGURE') lb.close(); });
    lb.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') lbStep(1);
      if (e.key === 'ArrowLeft') lbStep(-1);
    });
    lb.addEventListener('close', () => { lbImg.src = 'data:,'; });
  }

  /* =========================================================
     «КЛЕТЬ»: фонарик, загрузочные экраны, мигание
     ========================================================= */
  (function initKlet() {
    const abyss = $('#abyss');
    if (!abyss) return;
    if (!reduce) {
      abyss.addEventListener('pointermove', e => {
        const r = abyss.getBoundingClientRect();
        abyss.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        abyss.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }, { passive: true });
    }

    const shots = ['load-1', 'load-2', 'load-3', 'load-4', 'load-5'].map(n => `img/klet/${n}.webp`);
    const lsImg = $('#ls-img'), bar = $('#ls-bar'), dotsBox = $('#ls-dots'), frame = $('#ls-frame');
    let shot = 0, lsVisible = false;
    const dots = shots.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Загрузочный экран ${i + 1}`);
      b.addEventListener('click', () => showShot(i));
      dotsBox.appendChild(b);
      return b;
    });
    function runBar() {
      if (reduce) { bar.style.width = '100%'; return; }
      bar.classList.remove('run'); void bar.offsetWidth; bar.classList.add('run');
      bar.style.animationPlayState = lsVisible ? 'running' : 'paused';
    }
    function showShot(i) {
      shot = (i + shots.length) % shots.length;
      dots.forEach((d, k) => d.setAttribute('aria-current', String(k === shot)));
      lsImg.classList.add('fade');
      setTimeout(() => {
        const pre = new Image();
        pre.onload = pre.onerror = () => { lsImg.src = shots[shot]; lsImg.classList.remove('fade'); };
        pre.src = shots[shot];
      }, 300);
      runBar();
    }
    dots[0].setAttribute('aria-current', 'true');
    bar.addEventListener('animationend', () => showShot(shot + 1));
    new IntersectionObserver(([e]) => {
      lsVisible = e.isIntersecting;
      bar.style.animationPlayState = lsVisible ? 'running' : 'paused';
    }, { threshold: 0.3 }).observe(frame);
    runBar();

    if (!reduce && finePointer) {
      frame.addEventListener('pointermove', e => {
        const r = frame.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        lsImg.style.setProperty('--lx', (x * -30).toFixed(1) + 'px');
        lsImg.style.setProperty('--ly', (y * -18).toFixed(1) + 'px');
      });
      frame.addEventListener('pointerleave', () => {
        lsImg.style.setProperty('--lx', '0px');
        lsImg.style.setProperty('--ly', '0px');
      });
    }
  })();

  /* =========================================================
     СКЕТЧБУК: тащить мышкой
     ========================================================= */
  (function initSketches() {
    const sk = $('#sketches');
    if (!sk) return;
    let down = false, startX = 0, startScroll = 0, moved = false;
    sk.addEventListener('dragstart', e => e.preventDefault());
    sk.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startScroll = sk.scrollLeft;
    });
    window.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 6) { moved = true; sk.classList.add('dragging'); }
      if (moved) sk.scrollLeft = startScroll - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      sk.classList.remove('dragging');
      if (moved) { sketchDragged = true; setTimeout(() => { sketchDragged = false; }, 50); }
    });
  })();

  /* =========================================================
     ПОЧТА: отрывные листочки и копирование ника
     ========================================================= */
  $$('.tabs li').forEach(li => {
    $('a', li).addEventListener('click', () => {
      setTimeout(() => li.classList.add('torn'), 60);
      setTimeout(() => li.classList.remove('torn'), 6000);
    });
  });

  const copyBtn = $('#copy-handle');
  copyBtn.addEventListener('click', () => {
    const text = copyBtn.dataset.copy;
    const fallback = () => {
      const el = $('.notice-handle');
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
      toast('выделил ник, жми ctrl+c');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => toast('ник скопирован: ' + text), fallback);
    } else fallback();
  });
})();
