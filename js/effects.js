/* Shared Facilo firefly and click-water effects. */
document.addEventListener("DOMContentLoaded", () => {
  const initGoldenStardust = () => {
    let canvas = document.querySelector("#goldCanvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "goldCanvas";
      document.body.prepend(canvas);
    }
    canvas.setAttribute("aria-hidden", "true");
    const context = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!context) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const particles = [];
    let viewportWidth = 0;
    let viewportHeight = 0;
    let pixelRatio = 1;
    let previousTime = 0;
    let animationFrame = null;
    let resizeFrame = null;

    const createParticle = (randomHeight = true) => ({
      x: Math.random() * viewportWidth,
      y: randomHeight ? Math.random() * viewportHeight : viewportHeight + 10,
      radius: .8 + Math.random() * 1.6,
      rise: 5 + Math.random() * 13,
      drift: 2 + Math.random() * 5,
      phase: Math.random() * Math.PI * 2,
      shimmer: .45 + Math.random() * 1.3,
      opacity: .2 + Math.random() * .45
    });

    const drawParticles = (time = performance.now()) => {
      context.clearRect(0, 0, viewportWidth, viewportHeight);
      context.globalCompositeOperation = "lighter";
      particles.forEach((particle) => {
        const pulse = .72 + Math.sin(time * .001 * particle.shimmer + particle.phase) * .18;
        context.globalAlpha = particle.opacity * pulse;
        context.fillStyle = "rgba(212, 175, 55, .19)";
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius * 3.1, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = "rgba(212, 175, 55, .72)";
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = "rgba(255, 240, 192, .82)";
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius * .34, 0, Math.PI * 2);
        context.fill();
      });
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
    };

    const resizeCanvas = () => {
      viewportWidth = Math.max(1, window.innerWidth);
      viewportHeight = Math.max(1, window.innerHeight);
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(4000000 / (viewportWidth * viewportHeight)));
      canvas.width = Math.round(viewportWidth * pixelRatio);
      canvas.height = Math.round(viewportHeight * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const targetCount = Math.max(28, Math.min(54, Math.round((viewportWidth * viewportHeight) / 26000)));
      if (particles.length > targetCount) particles.splice(targetCount);
      while (particles.length < targetCount) particles.push(createParticle());
      particles.forEach((particle) => {
        if (particle.x > viewportWidth) particle.x = Math.random() * viewportWidth;
        if (particle.y > viewportHeight) particle.y = Math.random() * viewportHeight;
      });
      drawParticles();
    };

    const stopAnimation = () => {
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
      previousTime = 0;
    };

    const animate = (time) => {
      if (document.hidden || motionPreference.matches) {
        animationFrame = null;
        return;
      }
      const delta = previousTime ? Math.min((time - previousTime) / 1000, .05) : 0;
      previousTime = time;
      particles.forEach((particle, index) => {
        particle.y -= particle.rise * delta;
        particle.x += Math.sin(time * .00035 * particle.shimmer + particle.phase) * particle.drift * delta;
        if (particle.y < -particle.radius * 4) particles[index] = createParticle(false);
      });
      drawParticles(time);
      animationFrame = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (animationFrame === null && !document.hidden && !motionPreference.matches) {
        previousTime = 0;
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    const scheduleResize = () => {
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = null;
        resizeCanvas();
      });
    };

    const handleMotionPreference = () => {
      stopAnimation();
      drawParticles();
      startAnimation();
    };

    resizeCanvas();
    startAnimation();
    window.addEventListener("resize", scheduleResize, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAnimation();
      else startAnimation();
    });
    if (motionPreference.addEventListener) motionPreference.addEventListener("change", handleMotionPreference);
    else motionPreference.addListener(handleMotionPreference);
  };
  const initButtonFeedback = () => {
    const feedbackTimers = new WeakMap();
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest("button:not(.btn-close), .btn");
      if (!button || button.matches(".add-cart") || button.disabled || button.getAttribute("aria-disabled") === "true") return;

      window.clearTimeout(feedbackTimers.get(button));
      button.classList.remove("is-clicking");
      void button.offsetWidth;
      button.classList.add("is-clicking");
      feedbackTimers.set(button, window.setTimeout(() => button.classList.remove("is-clicking"), 380));

      const rect = button.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "click-ripple";
      ripple.setAttribute("aria-hidden", "true");
      const pointX = event.detail === 0 ? rect.width / 2 : event.clientX - rect.left;
      const pointY = event.detail === 0 ? rect.height / 2 : event.clientY - rect.top;
      ripple.style.left = `${rect.left + pointX}px`;
      ripple.style.top = `${rect.top + pointY}px`;
      document.body.append(ripple);
      window.setTimeout(() => ripple.remove(), 500);

      const destination = button.dataset.scrollTarget;
      if (destination) {
        const section = document.querySelector(destination);
        section?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
        });
      }
    });
  };
  initGoldenStardust();
  initButtonFeedback();
});
