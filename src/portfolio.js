document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const textEl = document.querySelector(".typing-text span");
  const homeSection = document.querySelector(".home");
  const homeGlow = document.querySelector(".home-glow");

  document.body.classList.add("is-ready");

  if (textEl) {
    const words = ["web developer", "software engineer", "UI designer", "app builder"];
    const typeSpeed = 100;
    const deleteSpeed = 60;
    const pauseAfterType = 1400;
    const pauseAfterDelete = 350;

    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
      const currentWord = words[wordIndex];

      if (isDeleting) {
        charIndex--;
      } else {
        charIndex++;
      }

      textEl.textContent = currentWord.slice(0, charIndex);
      textEl.classList.add("is-visible");

      let delay = isDeleting ? deleteSpeed : typeSpeed;

      if (!isDeleting && charIndex === currentWord.length) {
        delay = pauseAfterType;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        delay = pauseAfterDelete;
      }

      setTimeout(type, delay);
    }

    type();
  }

  const animateCounters = (el) => {
    const raw = (el.dataset.count || el.textContent.trim()).toString().trim();
    const match = raw.match(/^(\D*?)(\d+)(\D*?)$/);
    if (!match) return;

    const [, rawPrefix, number, rawSuffix] = match;
    const prefix = el.dataset.prefix ?? rawPrefix ?? "";
    const suffix = el.dataset.suffix ?? rawSuffix ?? "";
    const target = Number(number);

    if (Number.isNaN(target)) return;

    if (prefersReducedMotion) {
      el.textContent = `${prefix}${target}${suffix}`;
      return;
    }

    const duration = 900;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      el.textContent = `${prefix}${current}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  };

  const revealTargets = document.querySelectorAll(".reveal, .metric strong[data-count]");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          entry.target.classList.add("is-visible");

          if (entry.target.matches(".metric strong[data-count]")) {
            animateCounters(entry.target);
          }

          revealObserver.unobserve(entry.target);
        }
      },
      { threshold: 0.22, rootMargin: "0px 0px -40px 0px" }
    );

    revealTargets.forEach((node) => revealObserver.observe(node));
  } else {
    revealTargets.forEach((node) => node.classList.add("is-visible"));
    document.querySelectorAll(".metric strong[data-count]").forEach(animateCounters);
  }

  const tiltNodes = document.querySelectorAll('[data-tilt="true"]');
  tiltNodes.forEach((card) => {
    let rafId = null;

    const reset = () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--mx", "50%");
      card.style.setProperty("--my", "50%");
    };

    reset();

    card.addEventListener("pointermove", (event) => {
      if (prefersReducedMotion) return;

      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      const rotateY = (x - 50) / 9;
      const rotateX = (50 - y) / 12;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        card.style.setProperty("--rx", `${rotateX.toFixed(2)}deg`);
        card.style.setProperty("--ry", `${rotateY.toFixed(2)}deg`);
        card.style.setProperty("--mx", `${x.toFixed(2)}%`);
        card.style.setProperty("--my", `${y.toFixed(2)}%`);
      });
    });

    card.addEventListener("pointerleave", () => {
      if (rafId) cancelAnimationFrame(rafId);
      reset();
    });
  });

  if (homeSection && homeImage && homeGlow && !prefersReducedMotion) {
    homeSection.addEventListener("mousemove", (e) => {
      const rect = homeSection.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      homeImage.style.transform = `translate(${x * 15}px, ${y * 15}px)`;
      homeGlow.style.transform = `translate(${x * -20}px, ${y * -20}px)`;
    });

    homeSection.addEventListener("mouseleave", () => {
      homeImage.style.transform = "translate(0px, 0px)";
      homeGlow.style.transform = "translate(0px, 0px)";
    });
  }

  const gsapReady = typeof window.gsap !== "undefined";

  if (gsapReady) {
    if (window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
    }

    if (homeSection) {
      const homeTimeline = window.gsap.timeline({ defaults: { ease: "power3.out" } });
      homeTimeline
        .from(".eyebrow", { opacity: 0, y: 14, duration: 0.45 }, "-=0.55")
        .from(".home-content h1", { opacity: 0, y: 24, duration: 0.8 }, "-=0.35")
        .from(".home-content h3", { opacity: 0, y: 18, duration: 0.8 }, "-=0.55")
        .from('.home-content > p:not(.eyebrow)', { opacity: 0, y: 14, duration: 0.7 }, '-=0.45')
        .from(".social-icons a", { opacity: 0, y: 12, stagger: 0.12, duration: 0.45 }, "-=0.2")
        .from(".home .btn", { opacity: 0, y: 14, duration: 0.6 }, "-=0.15");
    }

    document.querySelectorAll(".reveal").forEach((target) => {
      window.gsap.fromTo(
        target,
        { opacity: 0, y: 36, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: target,
            start: "top 82%",
          },
        }
      );
    });

    if (document.querySelector(".hero")) {
      window.gsap.from(".hero", {
        opacity: 0,
        y: 22,
        duration: 0.7,
        ease: "power2.out",
      });
    }
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
  }
});