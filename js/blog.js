// Renders WORKS entries from WORKS_DATA: tag filters, media lightbox,
// and RTT divider shaders between entries.
(function () {
  // Inject style for the breakdown link (keeps style.css clean)
  const s = document.createElement("style");
  s.textContent = `
    .breakdown-link {
      display: inline-block;
      margin-top: 1rem;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--orange);
      text-shadow: var(--glow-soft);
      transition: text-shadow .22s, letter-spacing .22s;
    }
    .breakdown-link:hover {
      color: var(--orange);
      letter-spacing: 0.26em;
      text-shadow: var(--glow-orange);
    }
  `;
  document.head.appendChild(s);

  const listEl = document.getElementById("works-list");
  const filtersEl = document.getElementById("tag-filters");

  /* ---------------- Tag filters (multi-select, "All" by default) ---------------- */

  const allTags = [...new Set(BLOG_DATA.flatMap((w) => w.tags))].sort();
  const activeTags = new Set();

  function makeFilterBtn(label, onClick) {
    const btn = document.createElement("button");
    btn.className = "text-btn";
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    filtersEl.appendChild(btn);
    return btn;
  }

  const allBtn = makeFilterBtn("All", () => {
    activeTags.clear();
    render();
  });

  const tagBtns = new Map();
  for (const tag of allTags) {
    tagBtns.set(tag, makeFilterBtn(tag, () => {
      activeTags.has(tag) ? activeTags.delete(tag) : activeTags.add(tag);
      render();
    }));
  }

  function syncFilterUI() {
    allBtn.classList.toggle("active", activeTags.size === 0);
    for (const [tag, btn] of tagBtns) {
      btn.classList.toggle("active", activeTags.has(tag));
    }
  }

  /* ---------------- Lightbox ---------------- */

  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.innerHTML = `<button class="lightbox-close" aria-label="Close">CLOSE</button><div class="lightbox-content"></div>`;
  document.body.appendChild(lightbox);
  const lightboxContent = lightbox.querySelector(".lightbox-content");

  function openLightbox(media) {
    if (media.type === "image") {
      const img = document.createElement("img");
      img.src = media.src;
      img.alt = media.alt || "";
      lightboxContent.replaceChildren(img);
    } else if (media.type === "youtube") {
      const wrap = document.createElement("div");
      wrap.className = "lightbox-video";
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${media.id}?autoplay=1`;
      iframe.title = "Video";
      iframe.allow = "autoplay; encrypted-media; picture-in-picture";
      iframe.allowFullscreen = true;
      wrap.appendChild(iframe);
      lightboxContent.replaceChildren(wrap);
    } else if (media.type === "video") {
      const wrap = document.createElement("div");
      wrap.className = "lightbox-video";
      const vid = document.createElement("video");
      vid.controls = true;
      vid.autoplay = true;
      vid.loop = true;
      vid.style.cssText = "width:100%;height:100%;object-fit:contain;background:#000;";
      if (media.poster) vid.poster = media.poster;
      const src = document.createElement("source");
      src.src = media.src;
      src.type = "video/mp4";
      vid.appendChild(src);
      wrap.appendChild(vid);
      lightboxContent.replaceChildren(wrap);
      // Must call play() synchronously within the user-gesture context.
      // setTimeout breaks Firefox (loses the gesture scope).
      vid.play().catch(() => {});
    }
    lightbox.classList.add("open");
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightboxContent.replaceChildren(); // stops any playing video
  }

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target.classList.contains("lightbox-close")) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  /* ---------------- Entries ---------------- */

  function mediaThumb(media) {
    const btn = document.createElement("button");
    btn.className = "media-thumb";

    if (media.type === "youtube") {
      const img = document.createElement("img");
      img.src = `https://img.youtube.com/vi/${media.id}/hqdefault.jpg`;
      img.alt = "Video thumbnail";
      img.loading = "lazy";
      const play = document.createElement("span");
      play.className = "play-icon";
      play.textContent = "\u25B6";
      btn.append(img, play);
    } else if (media.type === "video") {
      // Inline muted preview — autoplays on hover, fullscreen on click
      const vid = document.createElement("video");
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.preload = "metadata";
      if (media.poster) vid.poster = media.poster;
      const source = document.createElement("source");
      source.src = media.src;
      source.type = "video/mp4";
      vid.appendChild(source);
      const play = document.createElement("span");
      play.className = "play-icon";
      play.textContent = "\u25B6";
      btn.append(vid, play);
      btn.addEventListener("mouseenter", () => vid.play().catch(() => {}));
      btn.addEventListener("mouseleave", () => { vid.pause(); vid.currentTime = 0; });
    } else {
      // image
      const img = document.createElement("img");
      img.src = media.src;
      img.alt = media.alt || "";
      img.loading = "lazy";
      btn.append(img);
    }

    btn.addEventListener("click", () => openLightbox(media));
    return btn;
  }

  function entryEl(work) {
    const article = document.createElement("article");
    article.className = "work-entry";
    article.id = work.id;

    const h2 = document.createElement("h2");
    h2.textContent = work.title;

    const tags = document.createElement("div");
    tags.className = "work-tags";
    for (const tag of work.tags) {
      const span = document.createElement("span");
      span.textContent = tag;
      tags.appendChild(span);
    }

    const desc = document.createElement("p");
    desc.className = "work-desc";
    desc.textContent = work.description;

    const grid = document.createElement("div");
    grid.className = "media-grid";
    for (const media of work.media) grid.appendChild(mediaThumb(media));

    article.append(h2, tags, desc, grid);

    if (work.breakdown) {
      const link = document.createElement("a");
      link.href = work.breakdown;
      link.className = "breakdown-link";
      link.textContent = "Read breakdown \u2192";
      article.appendChild(link);
    }

    if (work.related && work.related.length) {
      const rel = document.createElement("p");
      rel.className = "work-related";
      rel.append("Related: ");
      work.related.forEach((id, i) => {
        const target = BLOG_DATA.find((w) => w.id === id);
        if (!target) return;
        if (i > 0) rel.append(" · ");
        const a = document.createElement("a");
        a.href = `#${id}`;
        a.textContent = target.title;
        rel.appendChild(a);
      });
      article.appendChild(rel);
    }

    return article;
  }

  function render() {
    syncFilterUI();
    const visible = BLOG_DATA.filter(
      (w) => activeTags.size === 0 || w.tags.some((t) => activeTags.has(t))
    );

    listEl.replaceChildren();

    if (!visible.length) {
      const empty = document.createElement("p");
      empty.className = "works-empty";
      empty.textContent = "Nothing matches these tags (yet).";
      listEl.appendChild(empty);
      return;
    }

    visible.forEach((work, i) => {
      if (i > 0) {
        const divider = document.createElement("canvas");
        divider.className = "rtt-divider";
        listEl.appendChild(divider);
      }
      listEl.appendChild(entryEl(work));
    });

    window.initRttDividers(listEl);
  }

  render();

  // Jump to the anchored entry once rendered (direct links like works.html#jellyfish)
  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target) target.scrollIntoView();
  }
})();
