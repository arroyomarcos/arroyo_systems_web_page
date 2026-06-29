document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const pages = Array.from(document.querySelectorAll(".page"));

  if (!("IntersectionObserver" in window)) {
    pages.forEach((page) => page.classList.add("is-visible"));
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    pages.forEach((page) => page.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.08,
    },
  );

  pages.forEach((page) => {
    if (page.classList.contains("is-visible")) {
      return;
    }

    observer.observe(page);
  });
});
