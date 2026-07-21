// Renders WORKS entries from WORKS_DATA: tag filters, media lightbox,
// and RTT divider shaders between entries.
(function () {
  const listEl = document.getElementById("works-list");
  const filtersEl = document.getElementById("tag-filters");

  /* ---------------- Tag filters (multi-select, "All" by default) ---------------- */

  const allTags = [...new Set(WORKS_DATA.flatMap((w) => w.tags))].sort();
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
    const img = document.createElement("img");
    if (media.type === "youtube") {
      img.src = `https://img.youtube.com/vi/${media.id}/hqdefault.jpg`;
      img.alt = "Video thumbnail";
      const play = document.createElement("span");
      play.className = "play-icon";
      play.textContent = "\u25B6";
      btn.append(img, play);
    } else {
      img.src = media.src;
      img.alt = media.alt || "";
      btn.append(img);
    }
    img.loading = "lazy";
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

    if (work.related && work.related.length) {
      const rel = document.createElement("p");
      rel.className = "work-related";
      rel.append("Related: ");
      work.related.forEach((id, i) => {
        const target = WORKS_DATA.find((w) => w.id === id);
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
    const visible = WORKS_DATA.filter(
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
