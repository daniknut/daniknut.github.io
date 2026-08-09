const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = Array.from(document.querySelectorAll(".nav-link"));
const revealItems = document.querySelectorAll(".reveal");
const yearNode = document.querySelector("#year");

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

function closeNav() {
  if (!navToggle || !siteNav) {
    return;
  }

  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open navigation");
  siteNav.classList.remove("is-open");
  document.body.classList.remove("nav-open");
}

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isExpanded = navToggle.getAttribute("aria-expanded") === "true";

    navToggle.setAttribute("aria-expanded", String(!isExpanded));
    navToggle.setAttribute(
      "aria-label",
      isExpanded ? "Open navigation" : "Close navigation"
    );
    siteNav.classList.toggle("is-open", !isExpanded);
    document.body.classList.toggle("nav-open", !isExpanded);
  });

  document.addEventListener("click", (event) => {
    if (!siteNav.classList.contains("is-open")) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (!siteNav.contains(target) && !navToggle.contains(target)) {
      closeNav();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNav();
    }
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", closeNav);
  });
}

// Press feedback fires on pointer-down rather than on click, so touch users
// get the same immediate response a mouse user gets from :hover. iOS Safari
// only applies :active in some cases, so the class is what makes this
// dependable there; the CSS keeps :active as well for everything else.
const PRESSABLE = [
  ".button",
  ".nav-link",
  ".nav-toggle",
  ".brand-mark",
  ".skip-link",
  ".contact-strip a",
  ".contact-grid a",
  ".entry-links a",
  ".earlier-link",
  ".fact-value a",
].join(", ");

let pressedElement = null;

function releasePress() {
  if (!pressedElement) {
    return;
  }

  pressedElement.classList.remove("is-pressed");
  pressedElement = null;
}

document.addEventListener(
  "pointerdown",
  (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const target = event.target.closest(PRESSABLE);
    if (!target) {
      return;
    }

    releasePress();
    pressedElement = target;
    target.classList.add("is-pressed");
  },
  { passive: true }
);

["pointerup", "pointercancel", "dragstart"].forEach((eventName) => {
  document.addEventListener(eventName, releasePress, { passive: true });
});

// A scroll means the touch became a drag, so the press was never a press.
window.addEventListener("scroll", releasePress, { passive: true });
window.addEventListener("blur", releasePress);

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      // Must be 0, not a ratio. A ratio threshold is unreachable once a
      // section grows taller than the viewport / ratio: #work is ~7000px, so
      // 0.12 needed ~850px on screen at once and simply never fired on a
      // laptop or phone, leaving the whole section at opacity 0. Triggering
      // on first contact is height-independent.
      threshold: 0,
      rootMargin: "0px 0px -40px 0px",
    }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const sections = navLinks
  .map((link) => {
    const id = link.getAttribute("href");
    if (!id || !id.startsWith("#")) {
      return null;
    }

    const section = document.querySelector(id);
    if (!section) {
      return null;
    }

    return { link, section };
  })
  .filter(Boolean);

if ("IntersectionObserver" in window && sections.length > 0) {
  const crossingBand = new Set();

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          crossingBand.add(entry.target);
        } else {
          crossingBand.delete(entry.target);
        }
      });

      // Ranking by intersectionRatio breaks for the same reason the reveal
      // threshold did: sections are far taller than the detection band, so
      // every ratio is a meaningless sliver. Take the last section in
      // document order that is currently crossing the band instead, which is
      // the one being scrolled into.
      let activeSection = null;
      sections.forEach(({ section }) => {
        if (crossingBand.has(section)) {
          activeSection = section;
        }
      });

      if (!activeSection) {
        return;
      }

      sections.forEach(({ link, section }) => {
        link.classList.toggle("is-active", section === activeSection);
      });
    },
    {
      threshold: 0,
      rootMargin: "-25% 0px -60% 0px",
    }
  );

  sections.forEach(({ section }) => sectionObserver.observe(section));
}
