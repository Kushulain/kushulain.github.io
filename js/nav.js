// Injects the shared navigation overlay and highlights the current page.
(function () {
  const pages = [
    { href: "index.html", label: "HOME" },
    { href: "works.html", label: "WORKS" },
    { href: "about.html", label: "ABOUT" },
  ];

  const nav = document.createElement("nav");
  nav.className = "site-nav";

  const path = location.pathname.split("/").pop() || "index.html";

  for (const page of pages) {
    const a = document.createElement("a");
    a.href = page.href;
    a.textContent = page.label;
    if (page.href === path) a.setAttribute("aria-current", "page");
    nav.appendChild(a);
  }

  document.body.prepend(nav);

  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 12);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
