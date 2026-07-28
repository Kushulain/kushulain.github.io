// experience-gallery.js
// Adds image/video galleries with navigable lightbox to each .xp-item
// that has a data-gallery attribute containing a JSON array of media objects.

(function () {
  const s = document.createElement("style");
  s.textContent = `
    .xp-gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 0.75rem;
      margin-top: 1.2rem;
    }
    .xp-thumb {
      position: relative;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      background: var(--bg-soft);
      cursor: pointer;
      border: none;
      padding: 0;
    }
    .xp-thumb img,
    .xp-thumb video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.82;
      transition: opacity 0.3s ease, transform 0.3s ease;
      display: block;
    }
    .xp-thumb:hover img,
    .xp-thumb:hover video {
      opacity: 1;
      transform: scale(1.04);
    }
    .xp-thumb .play-icon {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      color: var(--text);
      font-size: 1.6rem;
      text-shadow: var(--glow-orange);
      pointer-events: none;
      transition: opacity 0.2s;
    }
    .xp-thumb:hover .play-icon { opacity: 0; }
  `;
  document.head.appendChild(s);

  // Media definitions per experience id
  const XP_MEDIA = {
    "patchworld": [
      { type: "youtube", id: "7x2K-Lu6d6Y" },
      { type: "image", src: "assets/img/experiences/Patchworld1.jpg", alt: "Patchworld screenshot 1" },
      { type: "image", src: "assets/img/experiences/Patchworld2.jpg", alt: "Patchworld screenshot 2" },
      { type: "image", src: "assets/img/experiences/Patchworld3.jpg", alt: "Patchworld screenshot 3" },
      { type: "image", src: "assets/img/experiences/Patchworld4.jpg", alt: "Patchworld screenshot 4" },
      { type: "image", src: "assets/img/experiences/Patchworld5.jpg", alt: "Patchworld screenshot 5" },
      { type: "image", src: "assets/img/experiences/Patchworld6.jpg", alt: "Patchworld screenshot 6" },
    ],
    "empathy-creature": [
      { type: "image", src: "assets/img/experiences/empathy_creatures_g.gif", alt: "Empathy Creature animated" },
      { type: "image", src: "assets/img/experiences/empathy_creatures1.jpg", alt: "Empathy Creature 1" },
      { type: "image", src: "assets/img/experiences/empathy_creatures2.jpg", alt: "Empathy Creature 2" },
      { type: "image", src: "assets/img/experiences/empathy_creatures3.jpg", alt: "Empathy Creature 3" },
      { type: "image", src: "assets/img/experiences/empathy_creatures4.jpg", alt: "Empathy Creature 4" },
      { type: "image", src: "assets/img/experiences/empathy_creatures5.jpg", alt: "Empathy Creature 5" },
    ],
    "jellyfish": [
      { type: "image", src: "assets/img/experiences/jellyfish1.jpg", alt: "Jellyfish VR 1" },
      { type: "image", src: "assets/img/experiences/jellyfish2.jpg", alt: "Jellyfish VR 2" },
      { type: "image", src: "assets/img/experiences/jellyfish3.jpg", alt: "Jellyfish VR 3" },
      { type: "image", src: "assets/img/experiences/jellyfish4.jpg", alt: "Jellyfish VR 4" },
      { type: "image", src: "assets/img/experiences/jellyfish5.jpg", alt: "Jellyfish VR 5" },
      { type: "image", src: "assets/img/experiences/jellyfish6.JPG", alt: "Jellyfish VR 6" },
      { type: "image", src: "assets/img/experiences/jellyfish7.jpg", alt: "Jellyfish VR 7" },
    ],
    "hanahana": [
      { type: "image", src: "assets/img/experiences/hanahana7.jpg", alt: "Hanahana 7" },
      { type: "video", src: "assets/img/experiences/hanahana_video.mp4", poster: "assets/img/experiences/hanahana1.jpg" },
      { type: "image", src: "assets/img/experiences/hanahana1.jpg", alt: "Hanahana 1" },
      { type: "image", src: "assets/img/experiences/hanahana2.jpg", alt: "Hanahana 2" },
      { type: "image", src: "assets/img/experiences/hanahana3.jpg", alt: "Hanahana 3" },
      { type: "image", src: "assets/img/experiences/hanahana4.jpg", alt: "Hanahana 4" },
      { type: "image", src: "assets/img/experiences/hanahana5.jpg", alt: "Hanahana 5" },
      { type: "image", src: "assets/img/experiences/hanahana6.jpg", alt: "Hanahana 6" },
    ],
  };

  function makeThumb(media, allMedia, index) {
    const btn = document.createElement("button");
    btn.className = "xp-thumb";

    if (media.type === "youtube") {
      const img = document.createElement("img");
      img.src = `https://img.youtube.com/vi/${media.id}/hqdefault.jpg`;
      img.alt = "Trailer";
      img.loading = "lazy";
      const play = document.createElement("span");
      play.className = "play-icon";
      play.textContent = "▶";
      btn.append(img, play);
    } else if (media.type === "video") {
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
      play.textContent = "▶";
      btn.append(vid, play);
      btn.addEventListener("mouseenter", () => vid.play().catch(() => {}));
      btn.addEventListener("mouseleave", () => { vid.pause(); vid.currentTime = 0; });
    } else {
      const img = document.createElement("img");
      img.src = media.src;
      img.alt = media.alt || "";
      img.loading = "lazy";
      btn.appendChild(img);
    }

    btn.addEventListener("click", () => window.Lightbox.open(allMedia, index));
    return btn;
  }

  // Inject galleries into each .xp-item that has a data-xp-id attribute
  document.querySelectorAll(".xp-item[data-xp-id]").forEach((item) => {
    const id = item.dataset.xpId;
    const mediaList = XP_MEDIA[id];
    if (!mediaList || !mediaList.length) return;

    const grid = document.createElement("div");
    grid.className = "xp-gallery";
    mediaList.forEach((media, i) => grid.appendChild(makeThumb(media, mediaList, i)));

    // Append gallery inside the .xp-content div
    const xpContent = item.querySelector(".xp-content");
    if (xpContent) xpContent.appendChild(grid);
  });
})();
