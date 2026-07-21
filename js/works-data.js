// WORKS entries. Adding a project = adding an object here, nothing else.
//
// Template:
// {
//   id: "url-anchor",                     // unique, used as #anchor
//   title: "Title",
//   description: "Short description.",
//   media: [
//     { type: "image", src: "assets/img/xxx.jpg", alt: "Alt text" },
//     { type: "youtube", id: "VIDEO_ID" },
//   ],
//   tags: ["VFX", "Shader"],              // shown and filterable at the top
//   related: ["other-entry-id"],          // optional links to other entries
// }
const WORKS_DATA = [
  {
    id: "hanahana",
    title: "Hanahana — Plasma / SSS / Ritual",
    description:
      "Placeholder description. Real-time plasma shader with subsurface scattering and ritual VFX. Includes hands render optimization and plasma sorting — full breakdowns coming soon.",
    media: [
      { type: "image", src: "assets/img/placeholder-hanahana.svg", alt: "Hanahana plasma shader" },
      { type: "youtube", id: "VY27zF3SISc" },
    ],
    tags: ["VFX", "Shader", "Optimization"],
    related: [],
  },
  {
    id: "patchworld",
    title: "Patchworld — Orbs, Kaleidoscope & Mixed Reality",
    description:
      "Placeholder description. Orbs, kaleidoscope, block redesign, tag connections, in-game particle generator, agentic integration, mixed reality and shared anchors.",
    media: [
      { type: "image", src: "assets/img/placeholder-patchworld.svg", alt: "Patchworld visuals" },
      { type: "youtube", id: "VY27zF3SISc" },
    ],
    tags: ["XR/MR", "Optimization", "Tooling"],
    related: [],
  },
  {
    id: "jellyfish",
    title: "JellyFish — Tentacles & Audio-Reactive Color",
    description:
      "Placeholder description. Procedural tentacles driven by two bone chains interpolated in the shader, color spreading, and audio pitch reactive visuals.",
    media: [
      { type: "image", src: "assets/img/placeholder-jellyfish.svg", alt: "JellyFish tentacles" },
      { type: "youtube", id: "VY27zF3SISc" },
    ],
    tags: ["VFX", "Audio-Reactive", "Shader"],
    related: [],
  },
];
