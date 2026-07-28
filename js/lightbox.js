// lightbox.js — shared navigable lightbox
// Usage: window.Lightbox.init() then window.Lightbox.open(mediaArray, startIndex)

(function () {
  let mediaList = [];
  let currentIndex = 0;

  // Build DOM
  const overlay = document.createElement("div");
  overlay.className = "lightbox";
  overlay.innerHTML = `
    <button class="lightbox-close" aria-label="Close">CLOSE</button>
    <button class="lightbox-arrow lightbox-prev" aria-label="Previous">&#8592;</button>
    <div class="lightbox-content"></div>
    <button class="lightbox-arrow lightbox-next" aria-label="Next">&#8594;</button>
  `;
  document.body.appendChild(overlay);

  const content  = overlay.querySelector(".lightbox-content");
  const btnPrev  = overlay.querySelector(".lightbox-prev");
  const btnNext  = overlay.querySelector(".lightbox-next");
  const btnClose = overlay.querySelector(".lightbox-close");

  function renderMedia(media) {
    content.replaceChildren();

    if (media.type === "image") {
      const img = document.createElement("img");
      img.src = media.src;
      img.alt = media.alt || "";
      content.appendChild(img);

    } else if (media.type === "youtube") {
      const wrap = document.createElement("div");
      wrap.className = "lightbox-video";
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${media.id}?autoplay=1`;
      iframe.title = "Video";
      iframe.allow = "autoplay; encrypted-media; picture-in-picture";
      iframe.allowFullscreen = true;
      wrap.appendChild(iframe);
      content.appendChild(wrap);

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
      content.appendChild(wrap);
      vid.play().catch(() => {});
    }
  }

  function updateArrows() {
    btnPrev.style.visibility = mediaList.length > 1 ? "visible" : "hidden";
    btnNext.style.visibility = mediaList.length > 1 ? "visible" : "hidden";
    btnPrev.style.opacity = currentIndex > 0 ? "1" : "0.2";
    btnNext.style.opacity = currentIndex < mediaList.length - 1 ? "1" : "0.2";
  }

  function navigate(delta) {
    const next = currentIndex + delta;
    if (next < 0 || next >= mediaList.length) return;
    currentIndex = next;
    renderMedia(mediaList[currentIndex]);
    updateArrows();
  }

  function open(list, startIndex) {
    mediaList = list;
    currentIndex = startIndex || 0;
    renderMedia(mediaList[currentIndex]);
    updateArrows();
    overlay.classList.add("open");
  }

  function close() {
    overlay.classList.remove("open");
    content.replaceChildren(); // stops video/iframe
    mediaList = [];
  }

  // Events
  btnClose.addEventListener("click", close);
  btnPrev.addEventListener("click", (e) => { e.stopPropagation(); navigate(-1); });
  btnNext.addEventListener("click", (e) => { e.stopPropagation(); navigate(+1); });
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("open")) return;
    if (e.key === "Escape")      close();
    if (e.key === "ArrowLeft")   navigate(-1);
    if (e.key === "ArrowRight")  navigate(+1);
  });

  window.Lightbox = { open, close };
})();
