var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/landing/templatesCatalog.js
var TEMPLATE_CATEGORIES = [
  {
    cat: "3D & Perspective",
    catAr: "\u062B\u0644\u0627\u062B\u064A \u0627\u0644\u0623\u0628\u0639\u0627\u062F \u0648\u0627\u0644\u0645\u0646\u0638\u0648\u0631",
    items: ["Card Tilt", "Card Tunnel", "Cube Spin", "Flip Card", "Image Tunnel", "Reflection"]
  },
  {
    cat: "Orbit",
    catAr: "\u0645\u062F\u0627\u0631 \u0648\u062F\u0648\u0631\u0627\u0646",
    items: ["Card Globe", "Halo Globe", "Orb Wall", "Orbit", "Orbit Ring", "Radial Wheel", "Sphere 3D", "Spiral", "Spiral Vortex"]
  },
  {
    cat: "Carousel & Flow",
    catAr: "\u0643\u0627\u0631\u0648\u0633\u064A\u0644 \u0648\u0627\u0646\u0633\u064A\u0627\u0628",
    items: ["Arc Carousel", "Carousel", "Carousel 04", "Carousel 3D 01", "Carousel 3D 02", "Coverflow", "Curved Carousel", "Curved Carousel 02", "Curved Carousel 03", "Curved Carousel 04", "Filmstrip", "Gallery 01", "Ribbon Flow", "Rotunda Carousel 01", "Sphere Carousel", "Swipe Deck"]
  },
  {
    cat: "Colors",
    catAr: "\u0627\u0644\u0623\u0644\u0648\u0627\u0646",
    items: ["Color Palette 01", "Color Palette 02", "Color Palette 03", "Color Palette 04", "Color Squares"]
  },
  {
    cat: "Stack & Scatter",
    catAr: "\u062A\u0643\u062F\u064A\u0633 \u0648\u062A\u0628\u0639\u062B\u0631",
    items: ["Card Fan", "Cascade", "Depth Dive", "Image Trail", "Polaroid Stack", "Proximity Field", "Stack Scatter"]
  },
  {
    cat: "Text",
    catAr: "\u0646\u0635\u0648\u0635 \u0645\u062A\u062D\u0631\u0643\u0629",
    items: ["3D Stagger Flip", "Fluid Text", "Gradient Text", "Line Reveal", "Text Morph", "Text Stagger", "Text Wave", "Type Sequence", "Video Text"]
  },
  {
    cat: "Grid",
    catAr: "\u0634\u0628\u0643\u0629",
    items: ["Drift Tiles", "Grid Pulse", "Mosaic Flip", "Wave Grid"]
  },
  {
    cat: "Reveal & Wipe",
    catAr: "\u0643\u0634\u0641 \u0648\u0645\u0633\u062D",
    items: ["Blinds", "Iris Reveal", "Reveal Wipe", "Stagger Reveal"]
  },
  {
    cat: "Slideshow & Story",
    catAr: "\u0634\u0631\u0627\u0626\u062D \u0648\u0642\u0635\u0629",
    items: ["Feature Stream", "Slideshow", "Split Screen", "Story Feed"]
  },
  {
    cat: "Spotlight & Focus",
    catAr: "\u0625\u0628\u0631\u0627\u0632 \u0648\u062A\u0631\u0643\u064A\u0632",
    items: ["Cinematic", "Ken Burns", "Spotlight", "Zoom Blur"]
  },
  {
    cat: "Isometric",
    catAr: "\u0623\u064A\u0632\u0648\u0645\u062A\u0631\u0643",
    items: ["Iso Tiles", "Isometric"]
  },
  {
    cat: "Logo & Branding",
    catAr: "\u0627\u0644\u0634\u0639\u0627\u0631 \u0648\u0627\u0644\u0647\u0648\u064A\u0629",
    items: ["Brand Motion 01", "Logo Reveal", "Neon Frame"]
  },
  {
    cat: "Ticker & Marquee",
    catAr: "\u0634\u0631\u064A\u0637 \u0645\u062A\u062D\u0631\u0643",
    items: ["Marquee", "Totem Wall"]
  }
];
var ALL_TEMPLATE_NAMES = TEMPLATE_CATEGORIES.flatMap((g) => g.items);
function categorySlug(cat) {
  return String(cat).toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
__name(categorySlug, "categorySlug");

// src/landing/templatePages.js
var SITE = "https://rotionapp.com";
var esc = /* @__PURE__ */ __name((s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]), "esc");
var CAT_COPY = {
  "3d-perspective": {
    en: "Give flat images real depth: cards that tilt, spin, and fly through 3D space with convincing perspective. Perfect for product showcases and bold intros.",
    ar: "\u0627\u0645\u0646\u062D \u0635\u0648\u0631\u0643 \u0639\u0645\u0642\u0627\u064B \u062D\u0642\u064A\u0642\u064A\u0627\u064B: \u0628\u0637\u0627\u0642\u0627\u062A \u062A\u0645\u064A\u0644 \u0648\u062A\u062F\u0648\u0631 \u0648\u062A\u0637\u064A\u0631 \u0641\u064A \u0641\u0636\u0627\u0621 \u062B\u0644\u0627\u062B\u064A \u0627\u0644\u0623\u0628\u0639\u0627\u062F \u0628\u0645\u0646\u0638\u0648\u0631 \u0645\u0642\u0646\u0639. \u0645\u062B\u0627\u0644\u064A\u0629 \u0644\u0639\u0631\u0636 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0648\u0627\u0644\u0645\u0642\u062F\u0651\u0645\u0627\u062A \u0627\u0644\u062C\u0631\u064A\u0626\u0629."
  },
  orbit: {
    en: "Images orbiting a center \u2014 rings, globes, spirals and radial wheels that rotate seamlessly. Great for galleries, logos and \u201Ceverything revolves around us\u201D stories.",
    ar: '\u0635\u0648\u0631 \u062A\u062F\u0648\u0631 \u062D\u0648\u0644 \u0645\u0631\u0643\u0632 \u2014 \u062D\u0644\u0642\u0627\u062A \u0648\u0643\u064F\u0631\u0627\u062A \u0648\u062D\u0644\u0632\u0648\u0646\u0627\u062A \u0648\u0639\u062C\u0644\u0627\u062A \u0634\u0639\u0627\u0639\u064A\u0629 \u062A\u062F\u0648\u0631 \u0628\u0633\u0644\u0627\u0633\u0629. \u0631\u0627\u0626\u0639\u0629 \u0644\u0644\u0645\u0639\u0627\u0631\u0636 \u0648\u0627\u0644\u0634\u0639\u0627\u0631\u0627\u062A \u0648\u0642\u0635\u0635 "\u0643\u0644 \u0634\u064A\u0621 \u064A\u062F\u0648\u0631 \u062D\u0648\u0644\u0646\u0627".'
  },
  "carousel-flow": {
    en: "Smooth looping carousels and flowing card strips \u2014 coverflow, curved rings, filmstrips and swipe decks. Drop in your images and export a seamless motion video.",
    ar: "\u0643\u0627\u0631\u0648\u0633\u064A\u0644\u0627\u062A \u0648\u0634\u0631\u0627\u0626\u0637 \u0628\u0637\u0627\u0642\u0627\u062A \u0627\u0646\u0633\u064A\u0627\u0628\u064A\u0629 \u0645\u062A\u0643\u0631\u0651\u0631\u0629 \u2014 \u0643\u0648\u0641\u0631\u0641\u0644\u0648\u060C \u062D\u0644\u0642\u0627\u062A \u0645\u0646\u062D\u0646\u064A\u0629\u060C \u0623\u0634\u0631\u0637\u0629 \u0623\u0641\u0644\u0627\u0645 \u0648\u0633\u062D\u0628 \u0627\u0644\u0628\u0637\u0627\u0642\u0627\u062A. \u0623\u0636\u0641 \u0635\u0648\u0631\u0643 \u0648\u0635\u062F\u0651\u0631 \u0641\u064A\u062F\u064A\u0648 \u0645\u0648\u0634\u0646 \u0645\u062A\u0643\u0631\u0651\u0631\u0627\u064B."
  },
  colors: {
    en: "Animated color palettes and swatches \u2014 show a brand\u2019s colors with codes, in clean grids or layered stacks. Ideal for brand kits and style guides.",
    ar: "\u0644\u0648\u062D\u0627\u062A \u0623\u0644\u0648\u0627\u0646 \u0648\u0639\u064A\u0651\u0646\u0627\u062A \u0645\u062A\u062D\u0631\u0643\u0629 \u2014 \u0627\u0639\u0631\u0636 \u0623\u0644\u0648\u0627\u0646 \u0647\u0648\u064A\u062A\u0643 \u0645\u0639 \u0623\u0643\u0648\u0627\u062F\u0647\u0627 \u0641\u064A \u0634\u0628\u0643\u0627\u062A \u0623\u0646\u064A\u0642\u0629 \u0623\u0648 \u0637\u0628\u0642\u0627\u062A \u0645\u062A\u0631\u0627\u0643\u0628\u0629. \u0645\u062B\u0627\u0644\u064A\u0629 \u0644\u0647\u0648\u064A\u0627\u062A \u0627\u0644\u0639\u0644\u0627\u0645\u0627\u062A \u0648\u0623\u062F\u0644\u0629 \u0627\u0644\u0623\u0646\u0645\u0627\u0637."
  },
  "stack-scatter": {
    en: "Playful stacks, fans and scatters \u2014 cards that pile, spread and drift with depth. Perfect for photo dumps, moodboards and energetic social posts.",
    ar: "\u0623\u0643\u0648\u0627\u0645 \u0648\u0645\u0631\u0627\u0648\u062D \u0648\u062A\u0628\u0639\u062B\u0631 \u0645\u0631\u062D \u2014 \u0628\u0637\u0627\u0642\u0627\u062A \u062A\u062A\u0643\u062F\u0651\u0633 \u0648\u062A\u0646\u062A\u0634\u0631 \u0648\u062A\u0646\u062C\u0631\u0641 \u0628\u0639\u0645\u0642. \u0645\u062B\u0627\u0644\u064A\u0629 \u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0627\u0644\u0635\u0648\u0631 \u0648\u0627\u0644\u0644\u0648\u062D\u0627\u062A \u0627\u0644\u0645\u0632\u0627\u062C\u064A\u0629 \u0648\u0645\u0646\u0634\u0648\u0631\u0627\u062A \u0627\u0644\u0633\u0648\u0634\u064A\u0627\u0644 \u0627\u0644\u0646\u0627\u0628\u0636\u0629."
  },
  text: {
    en: "Kinetic typography \u2014 morphing, staggering, waving and revealing text. Turn a headline or quote into a scroll-stopping animated statement.",
    ar: "\u062A\u0627\u064A\u0628\u0648\u063A\u0631\u0627\u0641\u064A \u062D\u0631\u0643\u064A\u0629 \u2014 \u0646\u0635\u0648\u0635 \u062A\u062A\u062D\u0648\u0651\u0644 \u0648\u062A\u062A\u062A\u0627\u0628\u0639 \u0648\u062A\u062A\u0645\u0648\u0651\u062C \u0648\u062A\u0646\u0643\u0634\u0641. \u062D\u0648\u0651\u0644 \u0639\u0646\u0648\u0627\u0646\u0627\u064B \u0623\u0648 \u0627\u0642\u062A\u0628\u0627\u0633\u0627\u064B \u0625\u0644\u0649 \u0628\u064A\u0627\u0646 \u0645\u062A\u062D\u0631\u0643 \u064A\u0648\u0642\u0641 \u0627\u0644\u062A\u0645\u0631\u064A\u0631."
  },
  grid: {
    en: "Rhythmic image grids \u2014 tiles that pulse, flip and ripple in sync. Great for portfolios, feature walls and satisfying, hypnotic loops.",
    ar: "\u0634\u0628\u0643\u0627\u062A \u0635\u0648\u0631 \u0625\u064A\u0642\u0627\u0639\u064A\u0629 \u2014 \u0645\u0631\u0628\u0651\u0639\u0627\u062A \u062A\u0646\u0628\u0636 \u0648\u062A\u0646\u0642\u0644\u0628 \u0648\u062A\u062A\u0645\u0648\u0651\u062C \u0628\u062A\u0646\u0627\u063A\u0645. \u0631\u0627\u0626\u0639\u0629 \u0644\u0644\u0623\u0639\u0645\u0627\u0644 \u0648\u062C\u062F\u0631\u0627\u0646 \u0627\u0644\u0645\u0632\u0627\u064A\u0627 \u0648\u0627\u0644\u062D\u0644\u0642\u0627\u062A \u0627\u0644\u0645\u064F\u0631\u0636\u064A\u0629 \u0627\u0644\u0622\u0633\u0631\u0629."
  },
  "reveal-wipe": {
    en: "Reveal your image with style \u2014 blinds, iris, wipes and staggered masks. Clean, cinematic transitions for intros and before/after moments.",
    ar: "\u0627\u0643\u0634\u0641 \u0635\u0648\u0631\u062A\u0643 \u0628\u0623\u0646\u0627\u0642\u0629 \u2014 \u0633\u062A\u0627\u0626\u0631\u060C \u0642\u0632\u062D\u064A\u0629\u060C \u0645\u0633\u062D\u0627\u062A \u0648\u0623\u0642\u0646\u0639\u0629 \u0645\u062A\u062A\u0627\u0628\u0639\u0629. \u0627\u0646\u062A\u0642\u0627\u0644\u0627\u062A \u0646\u0638\u064A\u0641\u0629 \u0633\u064A\u0646\u0645\u0627\u0626\u064A\u0629 \u0644\u0644\u0645\u0642\u062F\u0651\u0645\u0627\u062A \u0648\u0644\u062D\u0638\u0627\u062A \u0642\u0628\u0644/\u0628\u0639\u062F."
  },
  "slideshow-story": {
    en: "Turn a set of images into a story \u2014 slideshows, split screens and story feeds with polished pacing. Ideal for recaps, launches and highlights.",
    ar: "\u062D\u0648\u0651\u0644 \u0645\u062C\u0645\u0648\u0639\u0629 \u0635\u0648\u0631 \u0625\u0644\u0649 \u0642\u0635\u0629 \u2014 \u0634\u0631\u0627\u0626\u062D \u0648\u0634\u0627\u0634\u0627\u062A \u0645\u0642\u0633\u0651\u0645\u0629 \u0648\u062E\u0644\u0627\u0635\u0627\u062A \u0642\u0635\u0635\u064A\u0629 \u0628\u0625\u064A\u0642\u0627\u0639 \u0645\u0635\u0642\u0648\u0644. \u0645\u062B\u0627\u0644\u064A\u0629 \u0644\u0644\u0645\u0644\u062E\u0651\u0635\u0627\u062A \u0648\u0627\u0644\u0625\u0637\u0644\u0627\u0642\u0627\u062A \u0648\u0623\u0628\u0631\u0632 \u0627\u0644\u0644\u0642\u0637\u0627\u062A."
  },
  "spotlight-focus": {
    en: "Put one image center stage \u2014 cinematic Ken Burns, spotlight and zoom-blur focus effects that draw the eye. Perfect for a hero shot or single product.",
    ar: "\u0636\u0639 \u0635\u0648\u0631\u0629 \u0648\u0627\u062D\u062F\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u062A\u0635\u0641 \u2014 \u062A\u0623\u062B\u064A\u0631\u0627\u062A \u0643\u064A\u0646 \u0628\u064A\u0631\u0646\u0632 \u0627\u0644\u0633\u064A\u0646\u0645\u0627\u0626\u064A\u0629 \u0648\u0627\u0644\u0625\u0628\u0631\u0627\u0632 \u0648\u0636\u0628\u0627\u0628\u064A\u0629 \u0627\u0644\u062A\u0642\u0631\u064A\u0628 \u0627\u0644\u062A\u064A \u062A\u062C\u0630\u0628 \u0627\u0644\u0639\u064A\u0646. \u0645\u062B\u0627\u0644\u064A\u0629 \u0644\u0644\u0642\u0637\u0629 \u0631\u0626\u064A\u0633\u064A\u0629 \u0623\u0648 \u0645\u0646\u062A\u062C \u0648\u0627\u062D\u062F."
  },
  isometric: {
    en: "Isometric tiles and scenes \u2014 a clean, modern 3/4 view that feels designed and techy. Great for app screens, dashboards and product features.",
    ar: "\u0628\u0644\u0627\u0637\u0627\u062A \u0648\u0645\u0634\u0627\u0647\u062F \u0623\u064A\u0632\u0648\u0645\u062A\u0631\u064A\u0629 \u2014 \u0645\u0646\u0638\u0648\u0631 \u062B\u0644\u0627\u062B\u0629 \u0623\u0631\u0628\u0627\u0639 \u0646\u0638\u064A\u0641 \u0648\u0639\u0635\u0631\u064A \u0628\u0625\u062D\u0633\u0627\u0633 \u0645\u0635\u0645\u064E\u0651\u0645 \u0648\u062A\u0642\u0646\u064A. \u0631\u0627\u0626\u0639\u0629 \u0644\u0634\u0627\u0634\u0627\u062A \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0648\u0644\u0648\u062D\u0627\u062A \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0648\u0645\u0632\u0627\u064A\u0627 \u0627\u0644\u0645\u0646\u062A\u062C."
  },
  "logo-branding": {
    en: "Reveal your logo like a pro \u2014 polished logo reveals and neon frames on real mockups, with fades, overshoot pops and Ken Burns depth.",
    ar: "\u0627\u0643\u0634\u0641 \u0634\u0639\u0627\u0631\u0643 \u0628\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 \u2014 \u0638\u0647\u0648\u0631 \u0634\u0639\u0627\u0631 \u0645\u0635\u0642\u0648\u0644 \u0648\u0625\u0637\u0627\u0631\u0627\u062A \u0646\u064A\u0648\u0646 \u0639\u0644\u0649 \u0645\u0648\u0643 \u0623\u0628 \u062D\u0642\u064A\u0642\u064A\u060C \u0645\u0639 \u062A\u0644\u0627\u0634\u064D \u0648\u062A\u062C\u0627\u0648\u0632 \u0646\u0627\u0628\u0636 \u0648\u0639\u0645\u0642 \u0643\u064A\u0646 \u0628\u064A\u0631\u0646\u0632."
  },
  "ticker-marquee": {
    en: "Endless scrolling tickers and marquee walls \u2014 perfect for announcements, logos, sponsors and \u201Calways-on\u201D brand energy.",
    ar: "\u0623\u0634\u0631\u0637\u0629 \u062A\u0645\u0631\u064A\u0631 \u0644\u0627 \u0646\u0647\u0627\u0626\u064A\u0629 \u0648\u062C\u062F\u0631\u0627\u0646 \u0645\u0627\u0631\u0643\u064A\u0647 \u2014 \u0645\u062B\u0627\u0644\u064A\u0629 \u0644\u0644\u0625\u0639\u0644\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0634\u0639\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0631\u0639\u0627\u0629 \u0648\u0637\u0627\u0642\u0629 \u0627\u0644\u0639\u0644\u0627\u0645\u0629 \u0627\u0644\u062F\u0627\u0626\u0645\u0629."
  }
};
var UI = {
  en: {
    brand: "Rotion App",
    templates: "Templates",
    editor: "Open editor",
    tryNow: "Try it now",
    allTitle: "Motion Templates",
    allSub: "Browse every ready-made motion template by category \u2014 pick one, drop in your images, and export a looping video in seconds.",
    inThis: "Templates in this category",
    home: "Home",
    other: "More categories",
    footer: "Create scroll-stopping motion videos in your browser."
  },
  ar: {
    brand: "Rotion App",
    templates: "\u0627\u0644\u0642\u0648\u0627\u0644\u0628",
    editor: "\u0627\u0641\u062A\u062D \u0627\u0644\u0645\u062D\u0631\u0651\u0631",
    tryNow: "\u062C\u0631\u0651\u0628\u0647 \u0627\u0644\u0622\u0646",
    allTitle: "\u0642\u0648\u0627\u0644\u0628 \u0627\u0644\u0645\u0648\u0634\u0646",
    allSub: "\u062A\u0635\u0641\u0651\u062D \u0643\u0644 \u0642\u0648\u0627\u0644\u0628 \u0627\u0644\u0645\u0648\u0634\u0646 \u0627\u0644\u062C\u0627\u0647\u0632\u0629 \u062D\u0633\u0628 \u0627\u0644\u0642\u0633\u0645 \u2014 \u0627\u062E\u062A\u0631 \u0642\u0627\u0644\u0628\u0627\u064B\u060C \u0623\u0636\u0641 \u0635\u0648\u0631\u0643\u060C \u0648\u0635\u062F\u0651\u0631 \u0641\u064A\u062F\u064A\u0648 \u0645\u062A\u0643\u0631\u0651\u0631\u0627\u064B \u0641\u064A \u062B\u0648\u0627\u0646\u064D.",
    inThis: "\u0642\u0648\u0627\u0644\u0628 \u0647\u0630\u0627 \u0627\u0644\u0642\u0633\u0645",
    home: "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
    other: "\u0623\u0642\u0633\u0627\u0645 \u0623\u062E\u0631\u0649",
    footer: "\u0623\u0646\u0634\u0626 \u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A \u0645\u0648\u0634\u0646 \u062A\u0648\u0642\u0641 \u0627\u0644\u062A\u0645\u0631\u064A\u0631 \u0645\u0646 \u0645\u062A\u0635\u0641\u0651\u062D\u0643."
  }
};
var CSS = `
:root{--bg:#0A1622;--bg2:#0e1c2b;--panel:#0e1a28;--bd:#1d3145;--bd2:#294056;--tx:#e8eef5;--dim:#93a4b8;--mut:#647588;--acc:#2563eb;--acc2:#00e5a0}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--tx);font-family:-apple-system,Segoe UI,Tahoma,Arial,sans-serif;line-height:1.6}
a{color:inherit;text-decoration:none}
.t-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px;border-bottom:1px solid var(--bd);position:sticky;top:0;background:linear-gradient(180deg,var(--bg2),var(--bg));z-index:5}
.t-brand{display:flex;align-items:center;gap:10px;font-weight:800}
.t-brand img{border-radius:7px}
.t-nav{display:flex;align-items:center;gap:14px;font-weight:600;font-size:14px}
.t-nav a{color:var(--dim)}.t-nav a:hover{color:#fff}
.t-cta{background:linear-gradient(180deg,var(--acc2),var(--acc));color:#04120c!important;padding:8px 16px;border-radius:10px;font-weight:700}
.t-wrap{max-width:1040px;margin:0 auto;padding:34px 20px 64px}
.t-crumb{font-size:13px;color:var(--mut);margin-bottom:14px}
.t-crumb a:hover{color:var(--acc2)}
.t-h1{font-size:34px;font-weight:800;margin:6px 0 12px;line-height:1.2}
.t-lead{font-size:17px;color:var(--dim);max-width:720px;margin:0 0 26px}
.t-media{width:100%;max-width:720px;border-radius:16px;border:1px solid var(--bd2);margin:0 0 28px;display:block}
.t-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px;margin:20px 0 30px}
.t-card{display:block;padding:18px;border-radius:14px;border:1px solid var(--bd);background:var(--panel);transition:border-color .15s,transform .05s}
.t-card:hover{border-color:var(--acc2);transform:translateY(-2px)}
.t-card h3{margin:0 0 6px;font-size:17px}
.t-card p{margin:0;font-size:13.5px;color:var(--mut)}
.t-card .cnt{color:var(--acc2);font-weight:700;font-size:12.5px}
.t-h2{font-size:20px;margin:34px 0 14px}
.t-chips{display:flex;flex-wrap:wrap;gap:9px;margin:0 0 30px}
.t-chip{padding:8px 14px;border-radius:999px;border:1px solid var(--bd2);background:var(--bg2);color:var(--tx);font-size:14px}
.t-btn{display:inline-block;background:linear-gradient(180deg,var(--acc2),var(--acc));color:#04120c;font-weight:700;padding:13px 26px;border-radius:12px;font-size:16px}
.t-foot{border-top:1px solid var(--bd);color:var(--mut);font-size:13px;padding:24px 20px;text-align:center}
.t-foot a{color:var(--dim)}.t-foot a:hover{color:var(--acc2)}
/* Live-preview gallery: masonry columns so varied aspect ratios tile artfully. */
.tpv-gallery{columns:3 250px;column-gap:16px;margin:8px 0 34px}
.tpv-card{break-inside:avoid;margin:0 0 16px;border-radius:16px;overflow:hidden;border:1px solid var(--bd);background:var(--panel);transition:border-color .15s,transform .06s}
.tpv-card:hover{border-color:var(--acc2);transform:translateY(-2px)}
.tpv-card canvas{display:block;width:100%;height:auto;background:#0b0f16}
.tpv-meta{padding:12px 15px}
.tpv-meta h3{margin:0 0 4px;font-size:15.5px;color:#fff}
.tpv-meta p{margin:0;font-size:12.5px;color:var(--mut);line-height:1.5}
@media(max-width:520px){.t-h1{font-size:27px}.t-nav .t-lbl{display:none}.tpv-gallery{columns:2 150px;column-gap:12px}}
`;
function mergeCat(cat, lang, cfg) {
  const slug = categorySlug(cat.cat);
  const ov = cfg && cfg[slug] || {};
  const name = lang === "ar" ? cat.catAr || cat.cat : cat.cat;
  const defDesc = (CAT_COPY[slug] || {})[lang] || "";
  const desc = (lang === "ar" ? ov.descAr : ov.desc) || defDesc;
  const media = /^(https:\/\/|\/)/.test(ov.mediaUrl || "") ? ov.mediaUrl : "";
  return { slug, name, desc, media, items: cat.items || [] };
}
__name(mergeCat, "mergeCat");
function shell({ lang, path, title, desc, body, jsonLd, preview }) {
  const rtl = lang === "ar";
  const canonical = SITE + path;
  const altPath = rtl ? path.replace(/^\/ar/, "") || "/" : "/ar" + path;
  const enUrl = rtl ? SITE + altPath : canonical;
  const arUrl = rtl ? canonical : SITE + altPath;
  const u = UI[lang];
  return `<!doctype html><html lang="${lang}" dir="${rtl ? "rtl" : "ltr"}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="en" href="${enUrl}">
<link rel="alternate" hreflang="ar" href="${arUrl}">
<link rel="alternate" hreflang="x-default" href="${enUrl}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta name="theme-color" content="#0A1622">
<meta property="og:type" content="website"><meta property="og:url" content="${canonical}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${SITE}/og-image${rtl ? "-ar" : ""}.svg">
<meta name="twitter:card" content="summary_large_image">
<script src="/analytics.js"><\/script>
<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}<\/script>
<style>${CSS}</style></head>
<body>
<header class="t-top">
  <a class="t-brand" href="${rtl ? "/ar" : "/"}"><img src="/icon-rotion-02.png" alt="" width="28" height="28">${u.brand}</a>
  <nav class="t-nav">
    <a href="${rtl ? "/ar/templates" : "/templates"}"><span class="t-lbl">${u.templates}</span></a>
    <a class="t-lang" href="${altPath}">${rtl ? "EN" : "\u0639"}</a>
    <a class="t-cta" href="/app">${u.editor}</a>
  </nav>
</header>
<main class="t-wrap">${body}</main>
<footer class="t-foot">${esc(u.footer)}<br>
  <a href="${rtl ? "/ar" : "/"}">${u.home}</a> \xB7 <a href="${rtl ? "/ar/templates" : "/templates"}">${u.templates}</a> \xB7 <a href="/app">${u.editor}</a> \xB7 \xA9 Rotion App
</footer>
${preview ? '<script type="module" src="/template-preview.js"><\/script>' : ""}
</body></html>`;
}
__name(shell, "shell");
function renderTemplatesIndex(lang, cfg) {
  const rtl = lang === "ar";
  const u = UI[lang];
  const base = rtl ? "/ar/templates" : "/templates";
  const cats = TEMPLATE_CATEGORIES.map((c) => mergeCat(c, lang, cfg));
  const cards = cats.map(
    (c) => `<a class="t-card" href="${base}/${c.slug}"><h3>${esc(c.name)}</h3><p>${esc(c.desc)}</p><div class="cnt">${c.items.length} ${rtl ? "\u0642\u0627\u0644\u0628" : "templates"}</div></a>`
  ).join("");
  const body = `
    <div class="t-crumb"><a href="${rtl ? "/ar" : "/"}">${esc(u.home)}</a> / ${esc(u.templates)}</div>
    <h1 class="t-h1">${esc(u.allTitle)}</h1>
    <p class="t-lead">${esc(u.allSub)}</p>
    <div class="t-grid">${cards}</div>
    <a class="t-btn" href="/app">${esc(u.editor)}</a>`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: u.home, item: SITE + (rtl ? "/ar" : "/") },
          { "@type": "ListItem", position: 2, name: u.templates, item: SITE + base }
        ]
      },
      {
        "@type": "CollectionPage",
        name: u.allTitle,
        description: u.allSub,
        url: SITE + base,
        isPartOf: { "@type": "WebSite", name: "Rotion App", url: SITE },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: cats.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, url: SITE + base + "/" + c.slug }))
        }
      }
    ]
  };
  return shell({ lang, path: base, title: `${u.allTitle} \u2014 Rotion App`, desc: u.allSub, body, jsonLd });
}
__name(renderTemplatesIndex, "renderTemplatesIndex");
function renderCategoryPage(lang, cat, cfg) {
  const rtl = lang === "ar";
  const u = UI[lang];
  const base = rtl ? "/ar/templates" : "/templates";
  const c = mergeCat(cat, lang, cfg);
  const path = `${base}/${c.slug}`;
  const media = c.media ? /\.(mp4|webm)(\?|$)/i.test(c.media) ? `<video class="t-media" src="${esc(c.media)}" autoplay muted loop playsinline></video>` : `<img class="t-media" src="${esc(c.media)}" alt="${esc(c.name)}" loading="lazy">` : "";
  const blurb = rtl ? `\u0642\u0627\u0644\u0628 \u0645\u0648\u0634\u0646 \u0645\u0646 \u0642\u0633\u0645 ${c.name} \u2014 \u0623\u0636\u0641 \u0635\u0648\u0631\u0643 \u0648\u0635\u062F\u0651\u0631 \u0641\u064A\u062F\u064A\u0648 \u0645\u062A\u0643\u0631\u0651\u0631\u0627\u064B.` : `A ${c.name} motion template \u2014 add your images and export a looping video.`;
  const gallery = c.items.map(
    (name) => `
      <figure class="tpv-card">
        <canvas class="tpv" data-tpl="${esc(name)}" aria-label="${esc(name)}"></canvas>
        <figcaption class="tpv-meta"><h3>${esc(name)}</h3><p>${esc(blurb)}</p></figcaption>
      </figure>`
  ).join("");
  const body = `
    <div class="t-crumb"><a href="${rtl ? "/ar" : "/"}">${esc(u.home)}</a> / <a href="${base}">${esc(u.templates)}</a> / ${esc(c.name)}</div>
    <h1 class="t-h1">${esc(c.name)}</h1>
    <p class="t-lead">${esc(c.desc)}</p>
    ${media}
    <a class="t-btn" href="/app">${esc(u.tryNow)}</a>
    <h2 class="t-h2">${esc(u.inThis)} (${c.items.length})</h2>
    <div class="tpv-gallery">${gallery}</div>
    <p><a class="t-card" style="max-width:260px;margin-top:10px" href="${base}">\u2190 ${esc(u.other)}</a></p>`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: u.home, item: SITE + (rtl ? "/ar" : "/") },
          { "@type": "ListItem", position: 2, name: u.templates, item: SITE + base },
          { "@type": "ListItem", position: 3, name: c.name, item: SITE + path }
        ]
      },
      {
        "@type": "CollectionPage",
        name: `${c.name} \u2014 Rotion App`,
        description: c.desc,
        url: SITE + path,
        isPartOf: { "@type": "WebSite", name: "Rotion App", url: SITE },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: c.items.map((name, i) => ({ "@type": "ListItem", position: i + 1, name }))
        }
      }
    ]
  };
  return shell({ lang, path, title: `${c.name} \u2014 Rotion App`, desc: c.desc, body, jsonLd, preview: true });
}
__name(renderCategoryPage, "renderCategoryPage");
var CATEGORY_SLUGS = TEMPLATE_CATEGORIES.map((c) => categorySlug(c.cat));

// worker.js
var enc = new TextEncoder();
var json = /* @__PURE__ */ __name((obj, status = 200) => new Response(JSON.stringify(obj), {
  status,
  headers: { "content-type": "application/json", "cache-control": "no-store" }
}), "json");
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
__name(timingSafeEqual, "timingSafeEqual");
async function verifyPaddleSignature(rawBody, header, secret) {
  if (!secret || !header) return false;
  const parts = Object.fromEntries(
    header.split(";").map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()];
    })
  );
  const { ts, h1 } = parts;
  if (!ts || !h1) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(`${ts}:${rawBody}`));
  const computed = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return timingSafeEqual(computed, h1);
}
__name(verifyPaddleSignature, "verifyPaddleSignature");
async function handleWebhook(request, env) {
  const raw = await request.text();
  const secret = env.PADDLE_WEBHOOK_SECRET;
  if (!secret) return new Response("webhook not configured", { status: 200 });
  const ok = await verifyPaddleSignature(raw, request.headers.get("Paddle-Signature"), secret);
  if (!ok) return new Response("invalid signature", { status: 401 });
  let evt;
  try {
    evt = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }
  const type = evt.event_type || "";
  const data = evt.data || {};
  const email = (data?.custom_data?.email || data?.customer?.email || "").toLowerCase();
  if (email && env.SUBS && type.startsWith("subscription.")) {
    const status = data.status || "";
    const active = status === "active" || status === "trialing";
    await env.SUBS.put(
      "sub:" + email,
      JSON.stringify({
        plan: active ? "pro" : "free",
        status,
        subscriptionId: data.id || null,
        updatedAt: Date.now()
      })
    );
  }
  return new Response("ok", { status: 200 });
}
__name(handleWebhook, "handleWebhook");
function b64urlToBytes(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? 4 - s.length % 4 : 0;
  const bin = atob(s + "=".repeat(pad));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
__name(b64urlToBytes, "b64urlToBytes");
var b64urlToStr = /* @__PURE__ */ __name((s) => new TextDecoder().decode(b64urlToBytes(s)), "b64urlToStr");
async function verifyGoogleIdToken(idToken, clientId) {
  const parts = String(idToken || "").split(".");
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts;
  let header, payload;
  try {
    header = JSON.parse(b64urlToStr(h));
    payload = JSON.parse(b64urlToStr(p));
  } catch {
    return null;
  }
  const now = Math.floor(Date.now() / 1e3);
  if (payload.aud !== clientId) return null;
  if (!["accounts.google.com", "https://accounts.google.com"].includes(payload.iss)) return null;
  if (payload.exp && payload.exp < now) return null;
  if (payload.email_verified === false) return null;
  const certs = await fetch("https://www.googleapis.com/oauth2/v3/certs").then((r) => r.json());
  const jwk = (certs.keys || []).find((k) => k.kid === header.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlToBytes(sig), enc.encode(`${h}.${p}`));
  if (!ok) return null;
  return { email: (payload.email || "").toLowerCase(), name: payload.name || "" };
}
__name(verifyGoogleIdToken, "verifyGoogleIdToken");
async function handleGoogleAuth(request, env) {
  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId) return json({ error: "not_configured" }, 400);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }
  const profile = await verifyGoogleIdToken(body?.credential, clientId);
  if (!profile || !profile.email) return json({ error: "invalid_token" }, 401);
  return json({ email: profile.email, name: profile.name });
}
__name(handleGoogleAuth, "handleGoogleAuth");
async function handleEntitlement(url, env) {
  const email = (url.searchParams.get("email") || "").toLowerCase();
  if (!email || !env.SUBS) return json({ plan: "free", status: null });
  const rec = await env.SUBS.get("sub:" + email);
  const data = rec ? JSON.parse(rec) : null;
  if (data?.plan === "pro" && data.expiresAt && Date.now() > data.expiresAt) {
    return json({ plan: "free", status: "expired", expiresAt: data.expiresAt });
  }
  return json({ plan: data?.plan || "free", status: data?.status || null, expiresAt: data?.expiresAt || null });
}
__name(handleEntitlement, "handleEntitlement");
var EMAIL_FROM_FALLBACK = "Rotion App <onboarding@resend.dev>";
function emailFrom(env) {
  return env.EMAIL_FROM || EMAIL_FROM_FALLBACK;
}
__name(emailFrom, "emailFrom");
function siteUrl(env) {
  return (env.SITE_URL || "https://rotionapp.com").replace(/\/+$/, "");
}
__name(siteUrl, "siteUrl");
function esc2(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
__name(esc2, "esc");
function genToken() {
  return crypto.randomUUID().replace(/-/g, "");
}
__name(genToken, "genToken");
async function sendEmail(env, { to, subject, html, text, headers, replyTo, tags }) {
  if (!env.RESEND_API_KEY) return { ok: false, skipped: true, error: "no_api_key" };
  const body = { from: emailFrom(env), to: Array.isArray(to) ? to : [to], subject };
  if (html) body.html = html;
  if (text) body.text = text;
  if (replyTo) body.reply_to = replyTo;
  if (headers) body.headers = headers;
  if (tags) body.tags = tags;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.message || data?.name || `http_${res.status}` };
    return { ok: true, id: data?.id || null };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}
__name(sendEmail, "sendEmail");
function emailShell(env, { bodyHtml, token }) {
  const site = siteUrl(env);
  const unsub = token ? `${site}/api/email/unsubscribe?t=${token}` : site;
  const addr = env.EMAIL_ADDRESS ? `<div style="margin-top:6px">${esc2(env.EMAIL_ADDRESS)}</div>` : "";
  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#0b0b10;color:#e7e7ee;font-family:-apple-system,Segoe UI,Tahoma,Arial,sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:32px 24px">
    <div style="font-size:22px;font-weight:800;color:#fff">Rotion</div>
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #24242e;margin:28px 0"/>
    <div style="font-size:12px;color:#8a8a99;line-height:1.7">
      <a href="${site}" style="color:#8a8a99">rotionapp.com</a>
      &middot; <a href="${unsub}" style="color:#8a8a99">\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 / Unsubscribe</a>
      ${addr}
    </div>
  </div>
</body></html>`;
}
__name(emailShell, "emailShell");
function buildWelcomeEmail(env, rec) {
  const site = siteUrl(env);
  const token = rec.emailToken || "";
  const unsub = token ? `${site}/api/email/unsubscribe?t=${token}` : site;
  const bodyHtml = `
    <h1 style="font-size:20px;color:#fff;margin:20px 0 10px">\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u0641\u064A Rotion \u{1F44B}</h1>
    <p style="line-height:1.9;color:#c9c9d4;margin:0 0 14px">
      \u0634\u0643\u0631\u0627\u064B \u0644\u0627\u0646\u0636\u0645\u0627\u0645\u0643! Rotion \u064A\u062D\u0648\u0651\u0644 \u0635\u0648\u0631\u0643 \u0625\u0644\u0649 \u0641\u064A\u062F\u064A\u0648 \u0645\u0648\u0634\u0646 \u062C\u0630\u0651\u0627\u0628: \u0627\u062E\u062A\u0631 \u0642\u0627\u0644\u0628\u0627\u064B\u060C \u0623\u0636\u0641 \u0635\u0648\u0631\u0643\u060C \u0648\u0635\u062F\u0651\u0631 \u0641\u064A\u062F\u064A\u0648 \u064A\u062F\u0648\u0631 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0628\u0644\u0627 \u0628\u0631\u0627\u0645\u062C \u0645\u0639\u0642\u0651\u062F\u0629.
    </p>
    <p style="line-height:1.8;color:#9a9aa8;margin:0 0 22px;font-size:14px">
      Welcome to Rotion \u2014 pick a template, add your images, and export a looping motion video.
    </p>
    <a href="${site}/app" style="display:inline-block;background:#00E5A0;color:#04120c;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px">\u0627\u0641\u062A\u062D \u0627\u0644\u0645\u062D\u0631\u0651\u0631 \xB7 Open the editor</a>`;
  return {
    subject: "\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u0641\u064A Rotion \u{1F3AC}",
    html: emailShell(env, { bodyHtml, token }),
    text: `\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u0641\u064A Rotion!

\u0627\u062E\u062A\u0631 \u0642\u0627\u0644\u0628\u0627\u064B\u060C \u0623\u0636\u0641 \u0635\u0648\u0631\u0643\u060C \u0648\u0635\u062F\u0651\u0631 \u0641\u064A\u062F\u064A\u0648 \u0645\u0648\u0634\u0646.
\u0627\u0641\u062A\u062D \u0627\u0644\u0645\u062D\u0631\u0651\u0631: ${site}/app

\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643: ${unsub}`,
    headers: token ? { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : void 0,
    tags: [{ name: "type", value: "welcome" }]
  };
}
__name(buildWelcomeEmail, "buildWelcomeEmail");
async function handleUnsubscribe(url, env) {
  const token = (url.searchParams.get("t") || "").replace(/[^a-f0-9]/gi, "").slice(0, 64);
  const page = /* @__PURE__ */ __name((title, msg) => new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<div style="font-family:-apple-system,Segoe UI,Tahoma,Arial,sans-serif;max-width:440px;margin:12vh auto;padding:0 24px;text-align:center;color:#1a1a22">
  <div style="font-size:22px;font-weight:800">Rotion</div>
  <h1 style="font-size:19px;margin:18px 0 8px">${esc2(title)}</h1>
  <p style="color:#555;line-height:1.7">${esc2(msg)}</p>
  <a href="${siteUrl(env)}" style="color:#0a9;text-decoration:none">rotionapp.com</a>
</div>`,
    { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } }
  ), "page");
  if (!token || !env.SUBS) return page("\u0631\u0627\u0628\u0637 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \xB7 Invalid link", "\u0631\u0627\u0628\u0637 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D.");
  const email = await env.SUBS.get("unsub:" + token);
  if (!email) return page("\u0631\u0627\u0628\u0637 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \xB7 Invalid link", "\u0647\u0630\u0627 \u0627\u0644\u0631\u0627\u0628\u0637 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u0623\u0648 \u0645\u0646\u062A\u0647\u064D.");
  const key = "user:" + email;
  const raw = await env.SUBS.get(key);
  if (raw) {
    const rec = JSON.parse(raw);
    rec.unsubscribed = true;
    rec.marketingConsent = false;
    rec.unsubscribedAt = Date.now();
    await env.SUBS.put(key, JSON.stringify(rec));
  }
  return page("\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u2713", "\u0644\u0646 \u062A\u0635\u0644\u0643 \u0631\u0633\u0627\u0626\u0644 \u062A\u0633\u0648\u064A\u0642\u064A\u0629 \u0628\u0639\u062F \u0627\u0644\u0622\u0646 \xB7 You have been unsubscribed from marketing emails.");
}
__name(handleUnsubscribe, "handleUnsubscribe");
async function handleAdminSendTest(request, env) {
  if (!adminOk(request, env)) return json({ error: "unauthorized" }, 401);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }
  const to = (body?.to || "").toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return json({ error: "bad_email" }, 400);
  const r = await sendEmail(env, {
    to,
    subject: "Rotion \u2014 \u0627\u062E\u062A\u0628\u0627\u0631 \u0627\u0644\u0628\u0631\u064A\u062F / test email",
    html: emailShell(env, {
      bodyHtml: '<p style="color:#c9c9d4;line-height:1.9;margin:20px 0">\u0647\u0630\u0627 \u0627\u062E\u062A\u0628\u0627\u0631 \u0645\u0646 Rotion. \u0625\u0646 \u0648\u0635\u0644\u0643 \u0641\u0627\u0644\u0625\u0639\u062F\u0627\u062F \u064A\u0639\u0645\u0644 \u2705<br/>This is a Rotion test email \u2014 your setup works \u2705</p>',
      token: ""
    }),
    text: "Rotion test email \u2014 your setup works.",
    tags: [{ name: "type", value: "test" }]
  });
  return json(r, r.ok ? 200 : 502);
}
__name(handleAdminSendTest, "handleAdminSendTest");
async function handleTrackUser(request, env, ctx) {
  if (!env.SUBS) return json({ ok: false });
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }
  const email = (body?.email || "").toLowerCase().trim();
  if (!email || email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "bad_email" }, 400);
  }
  const key = "user:" + email;
  const now = Date.now();
  const existing = await env.SUBS.get(key);
  const isNew = !existing;
  const rec = existing ? JSON.parse(existing) : { email, firstSeen: now };
  if (body.name) rec.name = String(body.name).slice(0, 80);
  if (body.provider) rec.provider = ["local", "google"].includes(body.provider) ? body.provider : "local";
  rec.lastSeen = now;
  if (isNew) {
    rec.marketingConsent = body.marketingConsent === false ? false : true;
    rec.unsubscribed = false;
    if (!rec.emailToken) rec.emailToken = genToken();
  }
  await env.SUBS.put(key, JSON.stringify(rec));
  if (isNew && rec.emailToken) {
    await env.SUBS.put("unsub:" + rec.emailToken, email);
    if (!rec.welcomedAt && env.RESEND_API_KEY) {
      const deliver = (async () => {
        const r = await sendEmail(env, { to: email, ...buildWelcomeEmail(env, rec) });
        if (r.ok) {
          rec.welcomedAt = Date.now();
          await env.SUBS.put(key, JSON.stringify(rec));
        }
      })();
      if (ctx && ctx.waitUntil) ctx.waitUntil(deliver);
      else await deliver;
    }
  }
  return json({ ok: true, isNew });
}
__name(handleTrackUser, "handleTrackUser");
async function handleGetConfig(env) {
  if (!env.SUBS) return json({});
  const raw = await env.SUBS.get("config:site");
  return json(raw ? JSON.parse(raw) : {});
}
__name(handleGetConfig, "handleGetConfig");
function adminOk(request, env) {
  return !!env.ADMIN_KEY && request.headers.get("x-admin-key") === env.ADMIN_KEY;
}
__name(adminOk, "adminOk");
async function handleAdminUsers(request, env) {
  if (!adminOk(request, env)) return json({ error: "unauthorized" }, 401);
  if (!env.SUBS) return json({ users: [] });
  const list = await env.SUBS.list({ prefix: "user:", limit: 1e3 });
  const users = [];
  for (const k of list.keys) {
    const rec = JSON.parse(await env.SUBS.get(k.name) || "{}");
    const subRaw = await env.SUBS.get("sub:" + (rec.email || ""));
    const sub = subRaw ? JSON.parse(subRaw) : null;
    const expired = sub?.plan === "pro" && sub.expiresAt && Date.now() > sub.expiresAt;
    users.push({
      email: rec.email,
      name: rec.name || "",
      provider: rec.provider || "local",
      firstSeen: rec.firstSeen || null,
      lastSeen: rec.lastSeen || null,
      plan: expired ? "free" : sub?.plan || "free",
      status: expired ? "expired" : sub?.status || null,
      manual: !!sub?.manual,
      expiresAt: sub?.expiresAt || null
    });
  }
  users.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
  return json({ users });
}
__name(handleAdminUsers, "handleAdminUsers");
async function handleAdminStats(request, env) {
  if (!adminOk(request, env)) return json({ error: "unauthorized" }, 401);
  if (!env.SUBS) return json({});
  const users = await env.SUBS.list({ prefix: "user:", limit: 1e3 });
  const subs = await env.SUBS.list({ prefix: "sub:", limit: 1e3 });
  let pro = 0;
  for (const k of subs.keys) {
    const s = JSON.parse(await env.SUBS.get(k.name) || "{}");
    if (s.plan === "pro") pro++;
  }
  const total = users.keys.length;
  return json({ totalUsers: total, proUsers: pro, freeUsers: Math.max(0, total - pro) });
}
__name(handleAdminStats, "handleAdminStats");
async function handleTrackTemplate(request, env) {
  if (!env.SUBS) return json({ ok: false });
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }
  const id = String(body?.id || "").slice(0, 60).replace(/[^a-zA-Z0-9_-]/g, "");
  if (!id) return json({ error: "no_id" }, 400);
  const name = String(body?.name || id).slice(0, 60);
  const key = "tpl:" + id;
  const existing = await env.SUBS.get(key);
  const rec = existing ? JSON.parse(existing) : { id, name, count: 0 };
  rec.count = (rec.count || 0) + 1;
  rec.name = name;
  rec.lastSeen = Date.now();
  await env.SUBS.put(key, JSON.stringify(rec));
  return json({ ok: true });
}
__name(handleTrackTemplate, "handleTrackTemplate");
async function handleAdminTemplates(request, env) {
  if (!adminOk(request, env)) return json({ error: "unauthorized" }, 401);
  if (!env.SUBS) return json({ templates: [] });
  const list = await env.SUBS.list({ prefix: "tpl:", limit: 1e3 });
  const templates = [];
  for (const k of list.keys) {
    const rec = JSON.parse(await env.SUBS.get(k.name) || "{}");
    templates.push({ id: rec.id || k.name.slice(4), name: rec.name || "", count: rec.count || 0, lastSeen: rec.lastSeen || null });
  }
  templates.sort((a, b) => b.count - a.count);
  return json({ templates });
}
__name(handleAdminTemplates, "handleAdminTemplates");
async function handleAdminSetPlan(request, env) {
  if (!adminOk(request, env)) return json({ error: "unauthorized" }, 401);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }
  const email = (body?.email || "").toLowerCase();
  const plan = body?.plan;
  if (!email || !["free", "pro"].includes(plan)) return json({ error: "bad_input" }, 400);
  let expiresAt = null;
  if (plan === "pro") {
    const e = Number(body?.expiresAt);
    if (Number.isFinite(e) && e > Date.now()) expiresAt = e;
  }
  await env.SUBS.put(
    "sub:" + email,
    JSON.stringify({
      plan,
      status: plan === "pro" ? "active" : "canceled",
      manual: true,
      expiresAt,
      updatedAt: Date.now()
    })
  );
  return json({ ok: true, expiresAt });
}
__name(handleAdminSetPlan, "handleAdminSetPlan");
async function handleAdminConfig(request, env) {
  if (!adminOk(request, env)) return json({ error: "unauthorized" }, 401);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }
  await env.SUBS.put("config:site", JSON.stringify(body || {}));
  return json({ ok: true });
}
__name(handleAdminConfig, "handleAdminConfig");
async function loadTemplatesContent(env) {
  if (!env.SUBS) return {};
  try {
    const raw = await env.SUBS.get("config:templates");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
__name(loadTemplatesContent, "loadTemplatesContent");
function htmlPage(html) {
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" }
  });
}
__name(htmlPage, "htmlPage");
async function handleTemplatePages(url, env) {
  const p = url.pathname.replace(/\/+$/, "") || "/";
  const ar = p === "/ar/templates" || p.startsWith("/ar/templates/");
  const rest = ar ? p.slice("/ar/templates".length) : p.slice("/templates".length);
  const lang = ar ? "ar" : "en";
  const cfg = await loadTemplatesContent(env);
  if (rest === "" || rest === "/") return htmlPage(renderTemplatesIndex(lang, cfg));
  const slug = rest.replace(/^\//, "");
  const cat = TEMPLATE_CATEGORIES.find((c) => categorySlug(c.cat) === slug);
  if (!cat) return null;
  return htmlPage(renderCategoryPage(lang, cat, cfg));
}
__name(handleTemplatePages, "handleTemplatePages");
function handleSitemap() {
  const S = "https://rotionapp.com";
  const bi = /* @__PURE__ */ __name((en, ar, priority, cf = "weekly") => {
    const alts = `<xhtml:link rel="alternate" hreflang="en" href="${S}${en}"/><xhtml:link rel="alternate" hreflang="ar" href="${S}${ar}"/><xhtml:link rel="alternate" hreflang="x-default" href="${S}${en}"/>`;
    return [en, ar].map((loc) => `<url><loc>${S}${loc}</loc>${alts}<changefreq>${cf}</changefreq><priority>${priority}</priority></url>`).join("");
  }, "bi");
  const one = /* @__PURE__ */ __name((loc, priority) => `<url><loc>${S}${loc}</loc><changefreq>monthly</changefreq><priority>${priority}</priority></url>`, "one");
  let body = bi("/", "/ar", "1.0") + bi("/templates", "/ar/templates", "0.8");
  for (const c of TEMPLATE_CATEGORIES) {
    const s = categorySlug(c.cat);
    body += bi("/templates/" + s, "/ar/templates/" + s, "0.7");
  }
  for (const p of ["/terms", "/privacy", "/refund", "/contact"]) body += one(p, "0.4");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${body}</urlset>`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
__name(handleSitemap, "handleSitemap");
async function handleAdminTemplatesContent(request, env, method) {
  if (!adminOk(request, env)) return json({ error: "unauthorized" }, 401);
  if (method === "GET") return json(await loadTemplatesContent(env));
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }
  const slugs = new Set(TEMPLATE_CATEGORIES.map((c) => categorySlug(c.cat)));
  const clean = {};
  for (const [k, v] of Object.entries(body || {})) {
    if (!slugs.has(k) || !v || typeof v !== "object") continue;
    const e = {};
    if (typeof v.desc === "string") e.desc = v.desc.slice(0, 600);
    if (typeof v.descAr === "string") e.descAr = v.descAr.slice(0, 600);
    if (typeof v.mediaUrl === "string" && /^(https:\/\/|\/)/.test(v.mediaUrl.trim())) {
      e.mediaUrl = v.mediaUrl.trim().slice(0, 400);
    }
    clean[k] = e;
  }
  await env.SUBS.put("config:templates", JSON.stringify(clean));
  return json({ ok: true });
}
__name(handleAdminTemplatesContent, "handleAdminTemplatesContent");
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const m = request.method;
    if (pathname === "/api/paddle/webhook" && m === "POST") return handleWebhook(request, env);
    if (pathname === "/api/entitlement" && m === "GET") return handleEntitlement(url, env);
    if (pathname === "/api/auth/google" && m === "POST") return handleGoogleAuth(request, env);
    if (pathname === "/api/user/track" && m === "POST") return handleTrackUser(request, env, ctx);
    if (pathname === "/api/track/template" && m === "POST") return handleTrackTemplate(request, env);
    if (pathname === "/api/config" && m === "GET") return handleGetConfig(env);
    if (m === "GET" && (pathname === "/templates" || pathname.startsWith("/templates/") || pathname === "/ar/templates" || pathname.startsWith("/ar/templates/"))) {
      const res = await handleTemplatePages(url, env);
      if (res) return res;
    }
    if (pathname === "/api/admin/templates-content" && (m === "GET" || m === "PUT"))
      return handleAdminTemplatesContent(request, env, m);
    if (pathname === "/sitemap.xml" && m === "GET") return handleSitemap();
    if (pathname === "/api/email/unsubscribe" && (m === "GET" || m === "POST")) return handleUnsubscribe(url, env);
    if (pathname === "/api/admin/send-test" && m === "POST") return handleAdminSendTest(request, env);
    if (pathname === "/api/admin/users" && m === "GET") return handleAdminUsers(request, env);
    if (pathname === "/api/admin/stats" && m === "GET") return handleAdminStats(request, env);
    if (pathname === "/api/admin/templates" && m === "GET") return handleAdminTemplates(request, env);
    if (pathname === "/api/admin/set-plan" && m === "POST") return handleAdminSetPlan(request, env);
    if (pathname === "/api/admin/config" && m === "PUT") return handleAdminConfig(request, env);
    return env.ASSETS.fetch(request);
  }
};

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-sxTIxG/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-sxTIxG/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
