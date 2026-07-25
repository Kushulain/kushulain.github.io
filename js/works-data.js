// WORKS entries. Adding a project = adding an object here, nothing else.
//
// Template:
// {
//   id: "url-anchor",                     // unique, used as #anchor
//   title: "Title",
//   description: "Short description.",
//   breakdown: "path/to/article.html",    // optional — renders "Read breakdown →"
//   media: [
//     { type: "image", src: "assets/img/xxx.jpg", alt: "Alt text" },
//     { type: "video", src: "assets/img/xxx.mp4", poster: "assets/img/xxx.jpg" },
//     { type: "youtube", id: "VIDEO_ID" },
//   ],
//   tags: ["VFX", "Shader"],              // shown and filterable at the top
//   related: ["other-entry-id"],          // optional links to other entries
// }
const WORKS_DATA = [
  {
    id: "hanahana",
    title: "Hanahana — Skin SSS",
    description:
      "Custom skin Subsurface Scattering via a screen-space shadow buffer hack and hexagonal PCF sampling. Unity 5 Built-in Pipeline, real-time, 2018.",
    breakdown: "breakdown-hand-sss.html",
    media: [
      { type: "image", src: "assets/img/breakdowns/hand_sss/breakdown-hand_sss2.jpg", alt: "Hanahana — backlit hands with skin SSS" },
      { type: "image", src: "assets/img/breakdowns/hand_sss/breakdown-hand_sss1.jpg", alt: "Hanahana — SSS glow through fingers" },
      { type: "image", src: "assets/img/breakdowns/hand_sss/breakdown-hand_sss3.jpg", alt: "Hanahana — shadow edge translucency" },
      { type: "video", src: "assets/img/breakdowns/hand_sss/hand_sss.mp4", poster: "assets/img/breakdowns/hand_sss/breakdown-hand_sss1.jpg" },
    ],
    tags: ["VFX", "Shader", "Optimization"],
    related: [],
  },
];
