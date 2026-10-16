/* Facilo storefront catalog and client-side interactions. */
document.addEventListener("DOMContentLoaded", () => {
  const initThemeToggle = () => {
    const root = document.documentElement;
    const toggle = document.querySelector("#themeToggle");
    const themeColorMeta = document.querySelector("#themeColorMeta");
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let transitioning = false;

    const syncToggle = (theme) => {
      const isLight = theme === "light";
      if (toggle) {
        toggle.setAttribute("aria-pressed", String(isLight));
        toggle.setAttribute("aria-label", `Switch to ${isLight ? "dark" : "light"} theme`);
        toggle.title = `Switch to ${isLight ? "dark" : "light"} theme`;
        const label = toggle.querySelector(".theme-toggle-label");
        if (label) label.textContent = isLight ? "Light" : "Dark";
      }
      if (themeColorMeta) themeColorMeta.setAttribute("content", isLight ? "#FAF6F0" : "#1E120B");
    };

    const applyTheme = (theme) => {
      root.dataset.theme = theme;
      syncToggle(theme);
      try {
        window.localStorage.setItem("facilo-theme", theme);
      } catch (_) {
        // The theme still works for this visit when storage is unavailable.
      }
    };

    const scheduleStagger = (selector, startDelay, stepDelay, maxIncrement = Number.POSITIVE_INFINITY) => {
      document.querySelectorAll(selector).forEach((element, index) => {
        const delay = startDelay + Math.min(index * stepDelay, maxIncrement);
        element.style.setProperty("--theme-stagger", `${delay}ms`);
      });
    };

    const prepareStagger = () => {
      scheduleStagger(".navbar", 0, 0);
      scheduleStagger(".hero-content", 110, 0);
      scheduleStagger(".hero-showcase", 230, 0);
      scheduleStagger(".categories-section .section-heading", 350, 0);
      scheduleStagger(".category-card", 450, 75, 300);
      scheduleStagger(".products-section .section-heading", 850, 0);
      scheduleStagger(".product-filter-tabs", 950, 0);
      scheduleStagger(".product-card", 1050, 34);
      scheduleStagger(".benefit-item", 1750, 90, 270);
      scheduleStagger(".newsletter-inner", 2150, 0);
      scheduleStagger(".site-footer .footer-main", 2300, 0);
      scheduleStagger(".site-footer .footer-bottom", 2450, 0);
    };

    syncToggle(root.dataset.theme === "light" ? "light" : "dark");
    if (!toggle) return;

    toggle.addEventListener("click", () => {
      if (transitioning) return;
      const nextTheme = root.dataset.theme === "light" ? "dark" : "light";
      const bounds = toggle.getBoundingClientRect();
      const originX = `${bounds.left + bounds.width / 2}px`;
      const originY = `${bounds.top + bounds.height / 2}px`;
      root.style.setProperty("--theme-origin-x", originX);
      root.style.setProperty("--theme-origin-y", originY);

      if (motionPreference.matches) {
        applyTheme(nextTheme);
        return;
      }

      transitioning = true;
      prepareStagger();
      const overlay = document.createElement("div");
      overlay.className = `theme-transition-overlay theme-transition-overlay--${nextTheme}`;
      overlay.setAttribute("aria-hidden", "true");
      overlay.style.setProperty("--theme-origin-x", originX);
      overlay.style.setProperty("--theme-origin-y", originY);
      document.body.append(overlay);
      root.classList.add("theme-transitioning");
      void root.offsetWidth;
      applyTheme(nextTheme);
      window.requestAnimationFrame(() => root.classList.add("theme-transition-revealing"));

      let cleanupTimer;
      let overlayTimer;
      const finishTransition = () => {
        window.clearTimeout(cleanupTimer);
        window.clearTimeout(overlayTimer);
        overlay.remove();
        root.classList.remove("theme-transitioning", "theme-transition-revealing");
        transitioning = false;
      };
      overlay.addEventListener("animationend", () => {
        window.clearTimeout(overlayTimer);
        overlay.remove();
      }, { once: true });
      overlayTimer = window.setTimeout(() => overlay.remove(), 1600);
      cleanupTimer = window.setTimeout(finishTransition, 3900);
    });
  };

  const spawnAddCartBurst = (button) => {
    const bounds = button.getBoundingClientRect();
    const burst = document.createElement("span");
    burst.className = "add-cart-celebration";
    burst.setAttribute("aria-hidden", "true");
    burst.style.left = `${bounds.left + bounds.width / 2}px`;
    burst.style.top = `${bounds.top + bounds.height / 2}px`;

    const particles = [
      ["fa-sparkles", -30, -19, 12], ["fa-star", -23, -31, 8],
      ["fa-star", -7, -35, 6], ["fa-sparkles", 13, -31, 9],
      ["fa-star", 31, -18, 7], ["fa-star", 35, 3, 6],
      ["fa-sparkles", 23, 24, 9], ["fa-star", 1, 31, 7],
      ["fa-star", -24, 20, 6]
    ];

    particles.forEach(([icon, x, y, size], index) => {
      const particle = document.createElement("i");
      particle.className = `fa-solid ${icon}`;
      particle.style.setProperty("--burst-x", `${x}px`);
      particle.style.setProperty("--burst-y", `${y}px`);
      particle.style.setProperty("--burst-delay", `${index * 22}ms`);
      particle.style.setProperty("--burst-size", `${size}px`);
      burst.append(particle);
    });

    document.body.append(burst);
    window.setTimeout(() => burst.remove(), 1050);
  };

  const randomizeGalaxyParticles = () => {
    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    document.querySelectorAll(".galaxy-button .star").forEach((star) => {
      star.style.setProperty("--angle", `${randomInt(0, 360)}deg`);
      star.style.setProperty("--duration", randomInt(6, 20));
      star.style.setProperty("--delay", randomInt(0, 10));
      star.style.setProperty("--alpha", (randomInt(40, 90) / 100).toFixed(2));
      star.style.setProperty("--size", randomInt(2, 6));
      star.style.setProperty("--distance", randomInt(28, 112));
    });
  };

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

  const initScrollProgress = () => {
    const header = document.querySelector(".site-header");
    if (!header) return;
    let progress = header.querySelector(".scroll-progress-bar");
    if (!progress) {
      progress = document.createElement("div");
      progress.className = "scroll-progress-bar";
      progress.setAttribute("aria-hidden", "true");
      header.append(progress);
    }

    let frame = null;
    const updateProgress = () => {
      frame = null;
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const amount = scrollableHeight > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollableHeight) * 100)) : 0;
      progress.style.width = `${amount}%`;
    };
    const scheduleUpdate = () => {
      if (frame === null) frame = window.requestAnimationFrame(updateProgress);
    };

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    window.addEventListener("load", scheduleUpdate, { once: true });
    updateProgress();
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

  initThemeToggle();
  randomizeGalaxyParticles();
  initGoldenStardust();
  initScrollProgress();
  initButtonFeedback();

  const categoryNames = {
    E: "Electronics",
    F: "Fashion",
    H: "Home & Living",
    D: "Digital Assets",
    A: "Automotive"
  };

  // Eight distinct products are available in each category. Featured rows
  // provide a compact first view; the full 40-item catalog stays one click away.
  const catalogRows = `
E|Studio wireless headphones|1890|4.9|128|Bestseller|Soundroom|1505740420928-5e560c06d30e|Amber over-ear wireless headphones|Studio-tuned sound and soft memory foam make these a comfortable daily listening companion.|featured
E|Pocket mirrorless camera|6490|4.8|76|Editor's pick|Frame & Field|1516035069371-29a1b244cc32|Compact mirrorless camera on a neutral surface|A compact camera made for everyday documentation, weekend travel and the occasional happy accident.|featured
E|Tactile mechanical keyboard|1250|4.7|94|Top rated|Key House|1587829741301-dc798b83add3|Mechanical keyboard on a tidy desk|A weighted aluminum keyboard with warm tactile switches and a clean layout for a considered desk setup.|-
E|Everyday smart watch|2190|4.8|112|New arrival|North Circuit|1546868871-7041f2a55e12|Modern smartwatch with a clean display|A refined smart watch for everyday movement, reminders and quick connections.|-
E|Portable Bluetooth speaker|890|4.8|83|Travel favorite|Soundroom|1608043152269-423dbba4e7e1|Portable wireless speaker ready for travel|Rich, room-filling sound in a portable design made for home, picnics and weekend escapes.|-
E|QuietTone wireless earbuds|1190|4.7|147|Customer favorite|Quiet Tone|1590658268037-6bf12165a8df|Wireless earbuds with a compact charging case|Compact wireless earbuds with a comfortable fit and clear sound for commutes and focused work.|-
E|Smart home control hub|1590|4.6|58|Verified tech|Hearth Labs|1558089687-f282ffcbc126|Smart home controls arranged in a modern interior|Bring connected lights and home routines together with a simple, discreet control hub.|-
E|Studio 4K monitor|5290|4.8|69|Desk upgrade|Display Works|1527443224154-c4a3942d3acf|Wide display monitor on a minimal desk|A crisp 4K display with generous workspace for editing, design and everyday multitasking.|-
F|Everyday leather tote|2450|4.8|86|Just arrived|Atelier Noura|1590874103328-eac38a683ce7|Crafted tan leather handbag|A softly structured leather tote with room for daily essentials and a little more.|featured
F|City runner sneakers|1560|4.8|153|Community favorite|Common Ground|1542291026-7eec264c27ff|Modern running sneaker in a vivid colorway|Lightweight everyday sneakers with breathable uppers, cushioned soles and a versatile colorway.|featured
F|Softline wool coat|3280|4.9|51|Small batch|Maison Sable|1539533018447-63fcce2678e3|Tailored neutral wool coat|A clean, tailored wool coat with a soft hand and thoughtful details for cool-weather layering.|-
F|Relaxed linen shirt|790|4.7|92|Natural fibers|Atelier Noura|1598033129183-c4f50c736f10|Relaxed linen shirt in a light neutral shade|An easy-fitting linen shirt that wears well on its own or layered through the seasons.|-
F|Sienna leather crossbody|1780|4.8|74|Hand finished|Atelier Noura|1584917865442-de89df76afd3|Compact leather crossbody bag|A compact crossbody bag with useful compartments, an adjustable strap and hand-finished leather.|-
F|Acetate frame sunglasses|640|4.6|66|New arrival|Sol Studio|1511499767150-a48a237f0083|Classic sunglasses in warm acetate|A timeless acetate frame with UV-protective lenses and a comfortable fit for bright days.|-
F|Commuter canvas backpack|1120|4.7|109|Everyday carry|Common Ground|1553062407-98eeb64c6a62|Durable canvas backpack for everyday use|A practical canvas backpack with a padded laptop sleeve and easy-access pockets for city days.|-
F|Minimal automatic watch|3200|4.9|64|Limited edition|Hour & Form|1523275335684-37898b6baf30|Minimal wristwatch with a cream dial|A clean automatic watch with a balanced dial and polished steel case, designed for daily wear.|-
H|Sculpted ceramic table lamp|980|5.0|42|Hand finished|Clay House|1507473885765-e6ed057f782c|Sculptural table lamp with a warm glow|A handmade ceramic base and diffused light bring a calm accent to bedside tables and reading corners.|featured
H|Loomed lounge chair|4850|4.9|38|New arrival|Form & Fiber|1567538096630-e0c55bd6374c|Contemporary lounge chair in a warm interior|A sculptural frame and natural woven seat make this a comfortable place for slow mornings and long reads.|featured
H|Artisan stoneware dinner set|1180|4.8|59|Small batch|Clay House|1578749556568-bc2c40e68b61|Artisan ceramics arranged on a tabletop|A small-batch stoneware set with naturally varied glaze, made for everyday meals and long dinners.|-
H|Washed linen bedding set|1690|4.8|87|Soft touch|Casa Linen|1631049307264-da0ec9d70304|Soft neutral bedding in a light-filled bedroom|Breathable washed linen bedding with a relaxed texture that gets softer with every wash.|-
H|Walnut bedside table|2190|4.7|31|Maker made|Form & Fiber|1499933374294-4584851497cc|Warm wood furniture in a considered home|A compact bedside table in warm walnut with a drawer for the small things worth keeping close.|-
H|Sculpted stoneware vase|520|4.9|48|Hand finished|Clay House|1578500494198-246f612d3b3d|Sculptural ceramic vase on a shelf|A tactile stoneware vase with a softly sculpted shape, equally lovely with branches or on its own.|-
H|Woven cotton throw|690|4.8|72|Customer favorite|Casa Linen|1600210492486-724fe5c67fb0|Warm textured throw in a quiet living room|A soft, woven cotton throw for cool evenings, reading corners and a little extra texture.|-
H|Everyday serving bowl set|460|4.7|53|Small batch|Clay House|1490312278390-ab64016e0aa9|Handmade serving bowls on a table|A useful set of handmade stoneware bowls with a durable glaze for daily meals and shared tables.|-
D|Warm Lightroom preset collection|240|4.9|211|Instant download|Soft Focus Studio|1498050108023-c5249f4df085|Creative workspace with laptop and photo editing tools|A flexible collection of warm photo presets designed to help creators find a consistent look across a project.|featured
D|Studio portfolio website template|390|4.8|103|Creator favorite|Forma Digital|1516321318423-f06f85e504b3|Laptop displaying a clean creative portfolio|A polished responsive portfolio template for independent designers, photographers and creative studios.|-
D|Essential creator icon set|160|4.7|67|Instant download|Forma Digital|1558655146-d09347e92766|Designer working on a colorful digital illustration|A cohesive set of editable icons for digital products, presentations and social content.|-
D|Undated digital planner|180|4.8|92|Instant download|Paperless Day|1586281380349-632531db7ed4|Digital planner open beside a notebook|A flexible digital planner for goals, weekly priorities and projects, ready to use on a tablet.|-
D|Social launch template kit|290|4.8|81|Creator favorite|Forma Digital|1553877522-43269d4ea984|Creative team reviewing a digital campaign|A coordinated set of editable social templates to help a small business launch a new collection.|-
D|Modern brand type pairing|210|4.6|49|Instant download|Type Foundry|1519389950473-47ba0277781c|Modern creative workspace with screens|A thoughtful font pairing with practical usage notes for digital identities and editorial projects.|-
D|Editorial ebook cover collection|140|4.7|61|Instant download|Paperless Day|1455390582262-044cdead277a|Writer creating an editorial project|A collection of editable ebook cover layouts for authors, educators and independent publishers.|-
D|Printable abstract art set|120|4.9|134|Instant download|Forma Digital|1541961017774-22349e4a1262|Colorful abstract artwork on a gallery wall|A coordinated set of high-resolution printable art files for a warm, modern living space.|-
A|Roadtrip dash camera|1090|4.8|118|Road ready|Route One|1492144534655-ae79c964c9d7|Modern car on a scenic road|A compact, easy-to-mount dash camera with clear daytime footage and a discreet profile for daily driving.|featured
A|Premium detailing kit|720|4.9|83|Workshop pick|Cleanline Auto|1607860108855-64acf2078ed9|Car detailing and care products|A curated set of gentle cleaners, microfiber cloths and finishing tools for a cared-for car.|-
A|Weekend trunk organizer|460|4.7|52|Travel essential|Route One|1503376780353-7e6692767b70|Classic car ready for a weekend drive|A durable trunk organizer with flexible compartments to keep tools and travel supplies in order.|-
A|Leather steering wheel cover|390|4.6|44|Verified fit|Drive Goods|1511919884226-fd3cad34687c|Classic car interior with leather details|A hand-stitched leather cover that adds a comfortable grip and a refined finish to the cabin.|-
A|Portable tire inflator|850|4.8|97|Road ready|Route One|1486262715619-67b85e0b08d3|Automotive workshop equipment ready for use|A compact tire inflator with a clear pressure display for quick top-ups at home or on the road.|-
A|All-weather floor mat set|690|4.7|62|Everyday protection|Drive Goods|1504222490345-c075b6008014|Vehicle interior prepared for an everyday drive|A durable set of easy-clean floor mats to help protect the cabin through every season.|-
A|Roof cargo travel bag|1290|4.8|73|Weekend favorite|Route One|1533473359331-0135ef1b58bf|Car packed for a scenic road trip|A weather-resistant cargo bag that adds flexible storage for longer drives and weekend escapes.|-
A|Cordless car care vacuum|980|4.7|88|Workshop pick|Cleanline Auto|1493238792000-8113da705763|Polished car ready for a detailed clean|A compact cordless vacuum with useful attachments for keeping seats, mats and hard-to-reach corners tidy.|-
  `.trim().split("\n").map((row, index) => {
    const [code, name, price, rating, reviews, badge, seller, imageId, alt, description, featured] = row.trim().split("|");
    return {
      id: `facilo-${index + 1}`,
      category: categoryNames[code],
      name,
      price: Number(price),
      rating: Number(rating),
      reviews: Number(reviews),
      badge,
      seller,
      image: `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&w=900&h=760&q=85`,
      alt,
      description,
      featured: featured === "featured"
    };
  });

  const searchForm = document.querySelector("#searchForm");
  const searchInput = document.querySelector("#siteSearch");
  const productGrid = document.querySelector("#productGrid");
  const emptyState = document.querySelector("#emptyState");
  const catalogNote = document.querySelector("#catalogNote");
  const showAllButton = document.querySelector("#showAllProducts");
  const cartCountBadge = document.querySelector("#cartCount");
  const cartButton = document.querySelector(".cart-button");
  const filterTabs = [...document.querySelectorAll(".filter-tab")];
  const modalElement = document.querySelector("#productModal");
  const modal = window.bootstrap && modalElement ? new bootstrap.Modal(modalElement) : null;
  const productById = new Map(catalogRows.map((product) => [product.id, product]));
  const favoriteIds = new Set();
  let activeCategory = "all";
  let showingAll = false;
  let cartItems = 0;
  let toastTimer;
  const addCartResetTimers = new WeakMap();
  const addCartAnimationTimers = new WeakMap();

  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  }[character]));
  const normalize = (value) => value.toLocaleLowerCase().trim();
  const formatPrice = (price) => `MAD ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(price)}`;

  const showToast = (message) => {
    const toast = document.querySelector("#toastMessage");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
    const roundedFullStars = rating - fullStars >= 0.75 ? fullStars + 1 : fullStars;
    let markup = "";
    for (let index = 0; index < roundedFullStars; index += 1) markup += '<i class="fa-solid fa-star" aria-hidden="true"></i>';
    if (hasHalfStar) markup += '<i class="fa-solid fa-star-half-stroke" aria-hidden="true"></i>';
    const shownStars = roundedFullStars + Number(hasHalfStar);
    for (let index = shownStars; index < 5; index += 1) markup += '<i class="fa-regular fa-star" aria-hidden="true"></i>';
    return `<span class="rating-stars" role="img" aria-label="Rated ${rating.toFixed(1)} out of 5">${markup}</span>`;
  };

  const renderProduct = (product) => {
    const isFavorite = favoriteIds.has(product.id);
    const badgeClass = /new|arrival/i.test(product.badge) ? "badge-new" : /limited|small batch/i.test(product.badge) ? "badge-limited" : "";
    const sellerLabel = `Verified seller: ${product.seller}`;
    return `
      <article class="product-card" data-product-id="${escapeHTML(product.id)}">
        <div class="product-image-wrap">
          <span class="product-badge ${badgeClass}">${escapeHTML(product.badge)}</span>
          <button class="favorite-button${isFavorite ? " is-favorite" : ""}" type="button" data-favorite aria-label="${isFavorite ? "Remove" : "Add"} ${escapeHTML(product.name)} ${isFavorite ? "from" : "to"} favorites" aria-pressed="${isFavorite}">
            <i class="${isFavorite ? "fa-solid" : "fa-regular"} fa-heart" aria-hidden="true"></i>
          </button>
          <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.alt)}" width="900" height="760" loading="lazy">
        </div>
        <div class="product-info">
          <div class="product-meta-line">
            <p class="product-category">${escapeHTML(product.category)}</p>
            <span class="seller-badge" title="${escapeHTML(sellerLabel)}" aria-label="${escapeHTML(sellerLabel)}"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> ${escapeHTML(product.seller)}</span>
          </div>
          <h3>${escapeHTML(product.name)}</h3>
          <div class="product-review">${renderStars(product.rating)}<span>${product.rating.toFixed(1)} <span class="review-count">(${product.reviews})</span></span></div>
          <div class="product-bottom">
            <strong class="product-price">${formatPrice(product.price)}</strong>
            <div class="product-actions">
              <button class="view-details" type="button" data-product-details="${escapeHTML(product.id)}">View details</button>
              <button class="add-cart" type="button" data-add-cart="${escapeHTML(product.id)}" aria-label="Add ${escapeHTML(product.name)} to cart">
                <span class="add-cart-icon" aria-hidden="true"><i class="fa-solid fa-plus"></i></span>
                <span class="add-cart-label">Add</span>
                <span class="add-cart-sheen" aria-hidden="true"></span>
              </button>
            </div>
          </div>
        </div>
      </article>`;
  };

  const getVisibleProducts = () => {
    const term = normalize(searchInput?.value || "");
    let matches = catalogRows.filter((product) => {
      const matchesCategory = activeCategory === "all" || product.category === activeCategory;
      const searchable = normalize(`${product.name} ${product.category} ${product.seller} ${product.badge}`);
      return matchesCategory && (!term || searchable.includes(term));
    });
    if (activeCategory === "all" && !showingAll && !term) matches = matches.filter((product) => product.featured);
    return { matches, term };
  };

  const updateCatalog = () => {
    if (!productGrid) return;
    const { matches, term } = getVisibleProducts();
    productGrid.innerHTML = matches.map(renderProduct).join("");
    if (emptyState) emptyState.hidden = matches.length !== 0;
    if (catalogNote) {
      if (term) catalogNote.textContent = `${matches.length} search ${matches.length === 1 ? "result" : "results"}`;
      else if (activeCategory !== "all") catalogNote.textContent = `${matches.length} ${activeCategory} products`;
      else catalogNote.textContent = showingAll ? `${catalogRows.length} products` : `${catalogRows.filter((product) => product.featured).length} featured picks`;
    }
    if (showAllButton) {
      const canToggleCatalog = activeCategory === "all" && !term;
      showAllButton.hidden = !canToggleCatalog;
      showAllButton.setAttribute("aria-expanded", String(showingAll));
      showAllButton.innerHTML = showingAll
        ? 'Show featured picks <i class="fa-solid fa-arrow-up" aria-hidden="true"></i>'
        : `Show all ${catalogRows.length} products <i class="fa-solid fa-arrow-down" aria-hidden="true"></i>`;
    }
    const label = activeCategory === "all" ? "Marketplace products" : `${activeCategory} products`;
    productGrid.setAttribute("aria-label", term ? `${label}, search results for ${searchInput.value}` : label);
  };

  const setActiveCategory = (category) => {
    activeCategory = category;
    showingAll = false;
    filterTabs.forEach((tab) => {
      const active = normalize(tab.dataset.filter || "all") === normalize(category);
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-pressed", String(active));
    });
    updateCatalog();
  };

  const updateCartBadge = () => {
    if (cartCountBadge) cartCountBadge.textContent = cartItems > 99 ? "99+" : String(cartItems);
    if (cartButton) cartButton.setAttribute("aria-label", `Shopping cart, ${cartItems} ${cartItems === 1 ? "item" : "items"}`);
  };

  const addToCart = (product, button) => {
    if (!product) return;
    cartItems += 1;
    updateCartBadge();
    if (button) {
      const isProductAdd = button.matches(".add-cart");
      const label = button.querySelector(".add-cart-label") || button.querySelector("span");
      const icon = button.querySelector(".add-cart-icon i") || button.querySelector("i");
      window.clearTimeout(addCartResetTimers.get(button));
      window.clearTimeout(addCartAnimationTimers.get(button));
      button.classList.remove("is-added", "is-adding");
      void button.offsetWidth;
      button.classList.add("is-added");
      if (isProductAdd) {
        button.classList.add("is-adding");
        spawnAddCartBurst(button);
        const animationTimer = window.setTimeout(() => button.classList.remove("is-adding"), 900);
        addCartAnimationTimers.set(button, animationTimer);
      }
      button.setAttribute("aria-label", `${product.name} added to cart`);
      icon?.classList.replace("fa-plus", "fa-check");
      if (label) label.textContent = "Added";
      const resetTimer = window.setTimeout(() => {
        button.classList.remove("is-added");
        button.setAttribute("aria-label", `Add ${product.name} to cart`);
        icon?.classList.replace("fa-check", "fa-plus");
        if (label) label.textContent = "Add";
      }, 1500);
      addCartResetTimers.set(button, resetTimer);
    }
    showToast(`${product.name} added to your cart. Cart count: ${cartItems}.`);
  };

  searchInput?.addEventListener("input", updateCatalog);
  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    updateCatalog();
    document.querySelector("#explore")?.scrollIntoView({ behavior: "smooth" });
  });
  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      setActiveCategory(tab.dataset.filter || "all");
    });
  });
  document.querySelectorAll(".category-card").forEach((categoryLink) => {
    categoryLink.addEventListener("click", (event) => {
      const category = categoryLink.dataset.category;
      if (!category) return;
      event.preventDefault();
      if (searchInput) searchInput.value = "";
      setActiveCategory(category);
      document.querySelector("#explore")?.scrollIntoView({ behavior: "smooth" });
    });
  });
  showAllButton?.addEventListener("click", () => {
    showingAll = !showingAll;
    updateCatalog();
  });

  productGrid?.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const favoriteButton = target?.closest("[data-favorite]");
    if (favoriteButton) {
      const card = favoriteButton.closest("[data-product-id]");
      const product = productById.get(card?.dataset.productId);
      if (!product) return;
      const isFavorite = !favoriteIds.has(product.id);
      if (isFavorite) favoriteIds.add(product.id);
      else favoriteIds.delete(product.id);
      favoriteButton.classList.toggle("is-favorite", isFavorite);
      favoriteButton.setAttribute("aria-pressed", String(isFavorite));
      favoriteButton.setAttribute("aria-label", `${isFavorite ? "Remove" : "Add"} ${product.name} ${isFavorite ? "from" : "to"} favorites`);
      favoriteButton.querySelector("i")?.classList.toggle("fa-regular", !isFavorite);
      favoriteButton.querySelector("i")?.classList.toggle("fa-solid", isFavorite);
      showToast(isFavorite ? `${product.name} added to your favorites.` : `${product.name} removed from your favorites.`);
      return;
    }

    const addButton = target?.closest("[data-add-cart]");
    if (addButton) {
      addToCart(productById.get(addButton.dataset.addCart), addButton);
      return;
    }

    const detailsButton = target?.closest("[data-product-details]");
    if (!detailsButton) return;
    const product = productById.get(detailsButton.dataset.productDetails);
    if (!product) return;
    document.querySelector("#productModalTitle").textContent = product.name;
    const modalImage = document.querySelector("#productModalImage");
    modalImage.src = product.image;
    modalImage.alt = product.alt;
    document.querySelector("#productModalCategory").textContent = product.category;
    document.querySelector("#productModalDescription").textContent = product.description;
    document.querySelector("#productModalPrice").textContent = formatPrice(product.price);
    const modalAddButton = document.querySelector("#modalAddCart");
    modalAddButton.dataset.productId = product.id;
    if (modal) modal.show();
    else showToast(`${product.name}: ${formatPrice(product.price)}`);
  });

  document.querySelector("#modalAddCart")?.addEventListener("click", (event) => {
    const product = productById.get(event.currentTarget.dataset.productId);
    addToCart(product);
    modal?.hide();
  });

  cartButton?.addEventListener("click", () => {
    showToast(cartItems ? `Your cart has ${cartItems} ${cartItems === 1 ? "item" : "items"}.` : "Your cart is empty.");
  });

  document.querySelector("#newsletterForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const feedback = document.querySelector("#newsletterFeedback");
    if (feedback) feedback.textContent = "Thanks for your interest. Newsletter signup is ready to connect.";
    form.reset();
  });

  document.querySelectorAll("#mainNavigation .nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      const menu = document.querySelector("#mainNavigation");
      if (window.bootstrap && menu?.classList.contains("show")) bootstrap.Collapse.getOrCreateInstance(menu).hide();
    });
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping = target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
    if (event.key === "/" && !isTyping && searchInput) {
      event.preventDefault();
      searchInput.focus();
    }
    if (event.key === "Escape" && document.activeElement === searchInput) searchInput.blur();
  });

  updateCartBadge();
  updateCatalog();
  const year = document.querySelector("#currentYear");
  if (year) year.textContent = String(new Date().getFullYear());
});
