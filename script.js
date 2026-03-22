(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ----------------------------
  // Cursor glow (optional)
  // ----------------------------
  const glow = $(".cursorGlow");
  let glowSize = 520;
  document.addEventListener("mousemove", (e) => {
    if (!glow) return;
    const x = e.clientX - glowSize / 2;
    const y = e.clientY - glowSize / 2;
    glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });

  // Make glow slightly smaller on touchy areas.
  document.addEventListener(
    "pointerover",
    (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (t.closest("a,button,.btn,.linkBtn")) {
        glowSize = 360;
        glow?.style && (glow.style.width = `${glowSize}px`);
        glow?.style && (glow.style.height = `${glowSize}px`);
      }
    },
    { passive: true }
  );
  document.addEventListener("pointerout", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.closest("a,button,.btn,.linkBtn")) {
      glowSize = 520;
      if (glow) {
        glow.style.width = `${glowSize}px`;
        glow.style.height = `${glowSize}px`;
      }
    }
  });

  // ----------------------------
  // Mobile menu toggle
  // ----------------------------
  const toggle = $(".nav__toggle");
  const menu = $("#navMenu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
    // Close menu when a link is clicked
    $$(".nav__link", menu).forEach((a) => {
      a.addEventListener("click", () => {
        if (menu.classList.contains("is-open")) {
          menu.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  // ----------------------------
  // Smooth scroll + active section
  // ----------------------------
  const navLinks = $$("[data-nav]");
  const sections = navLinks
    .map((a) => document.getElementById(a.getAttribute("href")?.slice(1) || ""))
    .filter(Boolean);

  function setActiveById(id) {
    navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`));
  }

  if (sections.length) {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
        if (visible?.target?.id) setActiveById(visible.target.id);
      },
      { root: null, threshold: [0.15, 0.3, 0.6], rootMargin: "-20% 0px -65% 0px" }
    );
    sections.forEach((s) => obs.observe(s));
  }

  // Use scrollIntoView for internal links.
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const a = t.closest("a[href^='#']");
    if (!a) return;

    const href = a.getAttribute("href");
    if (!href || href === "#") return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // ----------------------------
  // Typing effect
  // ----------------------------
  const typeEl = $(".type");
  if (typeEl) {
    const words = (typeEl.dataset.words || "").split(",").map((s) => s.trim()).filter(Boolean);
    let wIdx = 0;
    let charIdx = 0;
    let deleting = false;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduced || words.length === 0) {
      typeEl.textContent = words[0] || "";
    } else {
      const tick = () => {
        const word = words[wIdx] || "";
        if (!deleting) {
          charIdx = Math.min(word.length, charIdx + 1);
          typeEl.textContent = word.slice(0, charIdx);
          if (charIdx >= word.length) deleting = true;
        } else {
          charIdx = Math.max(0, charIdx - 1);
          typeEl.textContent = word.slice(0, charIdx);
          if (charIdx === 0) {
            deleting = false;
            wIdx = (wIdx + 1) % words.length;
          }
        }

        const nextDelay = !deleting
          ? 70 + Math.random() * 35
          : 35 + Math.random() * 20;

        setTimeout(tick, nextDelay);
      };

      setTimeout(tick, 300);
    }
  }

  // ----------------------------
  // Canvas stars background
  // ----------------------------
  const canvas = $("#bg");
  const ctx = canvas?.getContext?.("2d");
  if (canvas && ctx) {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const state = {
      w: 0,
      h: 0,
      stars: [],
      t: 0,
    };

    function resize() {
      state.w = Math.floor(window.innerWidth);
      state.h = Math.floor(window.innerHeight);
      canvas.width = Math.floor(state.w * DPR);
      canvas.height = Math.floor(state.h * DPR);
      canvas.style.width = `${state.w}px`;
      canvas.style.height = `${state.h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      const count = Math.max(90, Math.floor((state.w * state.h) / 16000));
      state.stars = new Array(count).fill(0).map(() => {
        const z = Math.random();
        return {
          x: Math.random() * state.w,
          y: Math.random() * state.h,
          r: 0.6 + Math.random() * 1.7,
          // Keep stars mostly static; the screenshot vibe is calm with only twinkle.
          vx: (0.001 + Math.random() * 0.003) * (Math.random() < 0.5 ? -1 : 1),
          vy: (0.001 + Math.random() * 0.003),
          a: 0.12 + z * 0.55,
          tw: Math.random() * Math.PI * 2,
          z,
        };
      });
    }

    window.addEventListener("resize", resize, { passive: true });
    resize();

    function draw() {
      const { w, h, stars } = state;
      ctx.clearRect(0, 0, w, h);

      // faint vignette
      const grd = ctx.createRadialGradient(w * 0.5, h * 0.45, 10, w * 0.5, h * 0.45, Math.max(w, h) * 0.75);
      grd.addColorStop(0, "rgba(0,0,0,0)");
      grd.addColorStop(1, "rgba(0,0,0,.35)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      for (const s of stars) {
        s.tw += 0.02;
        const twinkle = 0.65 + Math.sin(s.tw) * 0.35;
        const alpha = s.a * twinkle;

        s.x += s.vx * 0.06;
        s.y += s.vy * 0.04;

        // wrap
        if (s.x < -20) s.x = w + 20;
        if (s.x > w + 20) s.x = -20;
        if (s.y > h + 20) s.y = -20;

        ctx.beginPath();
        ctx.fillStyle = `rgba(124,247,255,${alpha})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();

        // occasional accent
        if (s.z > 0.62 && Math.random() < 0.012) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(181,255,106,${alpha * 0.9})`;
          ctx.arc(s.x + 2, s.y - 1, s.r * 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    if (reduced) {
      draw();
    } else {
      const loop = () => {
        state.t += 1;
        draw();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }

  // ----------------------------
  // Intersection reveals
  // ----------------------------
  const revealTargets = $$(".reveal");
  if (revealTargets.length) {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle("reveal--in", e.isIntersecting)),
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    revealTargets.forEach((t) => obs.observe(t));
  }

  // ----------------------------
  // Projects grid
  // ----------------------------
  const projectsGrid = $("#projectsGrid");
  if (projectsGrid) {
    const projects = [
      {
        title: "Project One",
        desc: "A sleek UI concept with animated sections, keyboard-friendly navigation, and thoughtful microinteractions.",
        tags: ["UI", "Motion", "Accessibility"],
        links: [{ label: "Live", href: "#" }, { label: "Code", href: "#" }],
      },
      {
        title: "Project Two",
        desc: "A small full-stack app: clean component architecture, clear states, and a fast user flow.",
        tags: ["Full-stack", "APIs", "UX"],
        links: [{ label: "Live", href: "#" }, { label: "Code", href: "#" }],
      },
      {
        title: "Project Three",
        desc: "A developer tool or dashboard with data visualizations and performance-focused rendering.",
        tags: ["DevTools", "Performance", "Charts"],
        links: [{ label: "Live", href: "#" }, { label: "Code", href: "#" }],
      },
      {
        title: "Project Four",
        desc: "A portfolio or landing page with a strong visual identity and smooth interactions across breakpoints.",
        tags: ["Design", "Responsive", "Polish"],
        links: [{ label: "Live", href: "#" }, { label: "Code", href: "#" }],
      },
      {
        title: "Project Five",
        desc: "An experimental idea: interactive animations, progressive enhancement, and clean code organization.",
        tags: ["Experiments", "JS", "CSS"],
        links: [{ label: "Live", href: "#" }, { label: "Code", href: "#" }],
      },
      {
        title: "Project Six",
        desc: "A clean content system: reusable cards, consistent spacing, and maintainable UI patterns.",
        tags: ["Components", "Systems", "TypeScript*"],
        links: [{ label: "Live", href: "#" }, { label: "Code", href: "#" }],
      },
    ];

    projectsGrid.innerHTML = projects
      .map((p) => {
        const linksHtml = p.links
          .map((l) => {
            const safeHref = l.href || "#";
            return `<a class="linkBtn" href="${safeHref}" target="${
              safeHref.startsWith("http") ? "_blank" : "_self"
            }" rel="noreferrer">${l.label} <span aria-hidden="true">↗</span></a>`;
          })
          .join("");

        const tags = p.tags.map((t) => `<span class="tag">${t}</span>`).join("");

        return `
          <article class="projectCard reveal" tabindex="0" aria-label="${p.title}">
            <div class="badgeRow" style="margin-bottom:10px">
              <span class="badge badge--mono badge--ghost">Featured</span>
            </div>
            <h3 class="projectCard__title">${p.title}</h3>
            <p class="projectCard__desc">${p.desc}</p>
            <div class="projectCard__tags">${tags}</div>
            <div class="projectCard__actions">${linksHtml}</div>
          </article>
        `;
      })
      .join("");

    // stagger reveal: add initial offsets
    const cards = $$(".projectCard");
    cards.forEach((c, i) => {
      c.style.transitionDelay = `${Math.min(220, i * 35)}ms`;
    });
    // reveal on load/scroll
    const revealObs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle("reveal--in", e.isIntersecting)),
      { threshold: 0.2 }
    );
    cards.forEach((c) => revealObs.observe(c));
  }

  // ----------------------------
  // Skills bar animation
  // ----------------------------
  const skills = $$(".skill[data-skill]");
  if (skills.length) {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target;
          const pct = Number(el.getAttribute("data-skill") || 0);
          const fill = $(".bar__fill", el);
          if (fill) fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
        }
      },
      { threshold: 0.2 }
    );
    skills.forEach((s) => obs.observe(s));
    if (reduced) {
      skills.forEach((el) => {
        const pct = Number(el.getAttribute("data-skill") || 0);
        const fill = $(".bar__fill", el);
        if (fill) fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
      });
    }
  }

  // ----------------------------
  // Stats count-up
  // ----------------------------
  const stats = $$("[data-count]");
  if (stats.length) {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const els = stats.map((n) => n);

    const anim = () => {
      els.forEach((n) => {
        const target = Number(n.getAttribute("data-count") || 0);
        const duration = 1100;
        const start = performance.now();
        const from = 0;

        const step = (now) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          const v = Math.round(from + (target - from) * eased);
          n.textContent = String(v);
          if (t < 1) requestAnimationFrame(step);
        };

        if (target <= 0) n.textContent = "0";
        else requestAnimationFrame(step);
      });
    };

    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) {
          anim();
          obs.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    // attach to nearest parent section
    const root = $("#about");
    if (root) obs.observe(root);
    if (reduced) anim();
  }

  // ----------------------------
  // Footer year
  // ----------------------------
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ----------------------------
  // Contact form -> mailto
  // ----------------------------
  const contactForm = $("#contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const form = e.currentTarget;
      const fd = new FormData(form);
      const name = String(fd.get("name") || "").trim();
      const email = String(fd.get("email") || "").trim();
      const message = String(fd.get("message") || "").trim();

      const to = "you@example.com";
      const subject = encodeURIComponent(`Portfolio message from ${name || "someone"}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n`
      );

      // Basic validation already via required attributes.
      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    });
  }

  // ----------------------------
  // Mini music player
  // ----------------------------
  const audio = $("#bgAudio");
  const playBtn = $("#musicPlayBtn");
  const seek = $("#musicSeek");
  const vol = $("#musicVol");
  const muteBtn = $("#musicMuteBtn");
  const curTimeEl = $("#musicCurTime");
  const durTimeEl = $("#musicDurTime");
  const stateEl = $("#musicTrackState");
  const fileInput = $("#musicFileInput");

  const prevBtn = $("#musicPrevBtn");
  const nextBtn = $("#musicNextBtn");

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  if (audio && playBtn && seek && curTimeEl && durTimeEl && vol && muteBtn) {
    // User-friendly default
    audio.volume = Math.max(0, Math.min(1, Number(vol.value) || 0.7));
    // Start muted (autoplay-safe). We will unmute after the first user gesture.
    audio.muted = true;
    muteBtn.textContent = "🔇";
    muteBtn.setAttribute("aria-label", "Unmute");

    let isSeeking = false;

    function syncPlayState() {
      const isPlaying = !audio.paused && !audio.ended;
      playBtn.textContent = isPlaying ? "❚❚" : "▶";
      playBtn.setAttribute("aria-label", isPlaying ? "Pause" : "Play");

      if (stateEl) {
        if (audio.error) stateEl.textContent = "missing";
        else if (isPlaying) stateEl.textContent = "playing";
        else stateEl.textContent = audio.currentTime > 0 ? "paused" : "offline";
      }
    }

    function syncDuration() {
      const d = audio.duration;
      if (Number.isFinite(d) && d > 0) {
        seek.max = String(d);
        durTimeEl.textContent = formatTime(d);
      }
    }

    function syncTime() {
      if (!Number.isFinite(audio.currentTime)) return;
      if (isSeeking) return;
      curTimeEl.textContent = formatTime(audio.currentTime);
      const d = audio.duration;
      if (Number.isFinite(d) && d > 0) {
        seek.value = String(audio.currentTime);
      }
    }

    // Attempt to load metadata (doesn't start playback)
    syncDuration();
    syncTime();
    syncPlayState();

    // Force the browser to try loading the source so we can surface "missing" state early.
    try {
      audio.load();
    } catch {
      // ignore
    }

    // Autoplay-safe attempt: play muted immediately.
    try {
      void audio.play();
    } catch {
      // Autoplay might be blocked; user gesture below will handle it.
    }

    let didUnmute = false;
    const unmuteAndPlayOnce = async () => {
      if (didUnmute) return;
      didUnmute = true;
      audio.muted = false;
      muteBtn.textContent = "🔊";
      muteBtn.setAttribute("aria-label", "Mute");
      try {
        if (audio.paused) await audio.play();
      } catch {
        // ignore; user can still use the play button.
      }
    };
    // Unmute on first interaction (click/tap/keyboard).
    document.addEventListener("pointerdown", unmuteAndPlayOnce, { once: true, passive: true });
    document.addEventListener("keydown", unmuteAndPlayOnce, { once: true });

    audio.addEventListener("loadedmetadata", () => {
      syncDuration();
      syncTime();
      syncPlayState();
    });

    audio.addEventListener("error", () => {
      if (stateEl) stateEl.textContent = "missing";
    });

    audio.addEventListener("timeupdate", () => {
      syncTime();
    });

    audio.addEventListener("play", () => syncPlayState());
    audio.addEventListener("pause", () => syncPlayState());
    audio.addEventListener("ended", () => syncPlayState());

    // Play/pause
    playBtn.addEventListener("click", async () => {
      try {
        // If the file failed to load before, try reloading on the next click.
        if (audio.error || audio.readyState === 0) {
          try {
            audio.load();
          } catch {
            // ignore
          }
        }

        // If the track is missing, let user pick a local file.
        if ((audio.error || audio.readyState === 0) && fileInput) {
          fileInput.click();
          return;
        }

        // User clicked play, so allow sound.
        audio.muted = false;
        muteBtn.textContent = "🔊";
        muteBtn.setAttribute("aria-label", "Mute");

        if (audio.paused) await audio.play();
        else audio.pause();
      } catch {
        // Autoplay might be blocked; user interaction already happened, so just ignore.
      }
    });

    // When user picks a local audio file, use it as the player source.
    if (fileInput) {
      fileInput.addEventListener("change", async () => {
        const file = fileInput.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        try {
          audio.src = url; // Override the missing ./music/track.mp3
          audio.load();
          await audio.play();
        } catch {
          // If play fails, user can click again.
        }
      });
    }

    // If the src fails initially (missing file), allow reload attempts on click.
    playBtn.addEventListener("dblclick", () => {
      try {
        audio.load();
        void audio.play();
      } catch {
        // ignore
      }
    });

    // Seek
    seek.addEventListener("input", () => {
      isSeeking = true;
      const t = Number(seek.value);
      if (Number.isFinite(t)) curTimeEl.textContent = formatTime(t);
    });
    seek.addEventListener("change", () => {
      const t = Number(seek.value);
      if (Number.isFinite(t)) audio.currentTime = t;
      isSeeking = false;
    });

    // Volume + mute
    vol.addEventListener("input", () => {
      audio.volume = Math.max(0, Math.min(1, Number(vol.value) || 0));
      muteBtn.textContent = audio.muted || audio.volume === 0 ? "🔈" : "🔊";
      muteBtn.setAttribute("aria-label", audio.muted ? "Unmute" : "Mute");
    });

    muteBtn.addEventListener("click", () => {
      audio.muted = !audio.muted;
      muteBtn.textContent = audio.muted ? "🔇" : "🔊";
      muteBtn.setAttribute("aria-label", audio.muted ? "Unmute" : "Mute");
    });

    // Simple prev/next placeholders (single track by default).
    // If you want playlists, tell me how you want tracks provided (array or separate files).
    prevBtn?.addEventListener("click", () => {
      audio.currentTime = Math.max(0, audio.currentTime - 10);
    });
    nextBtn?.addEventListener("click", () => {
      const max = Number.isFinite(audio.duration) ? audio.duration : audio.currentTime + 10;
      audio.currentTime = Math.min(max, audio.currentTime + 10);
    });
  }
})();

