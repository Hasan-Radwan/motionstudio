// Bilingual template catalog — a flat, dependency-free list of every template
// name grouped by category. Kept SEPARATE from src/templates/* (which import the
// canvas render code) so it can be imported safely by both the browser landing
// page AND the build-time prerender (linkedom/node) without pulling in any
// canvas/render modules. This is what makes all 75 template names appear in the
// static HTML a crawler / AI engine sees (they are otherwise only rendered inside
// the /app on the client). Keep in sync with the registry in src/templates/index.js.

export const TEMPLATE_CATEGORIES = [
  {
    cat: '3D & Perspective',
    catAr: 'ثلاثي الأبعاد والمنظور',
    items: ['Card Tilt', 'Card Tunnel', 'Cube Spin', 'Flip Card', 'Image Tunnel', 'Reflection'],
  },
  {
    cat: 'Orbit',
    catAr: 'مدار ودوران',
    items: ['Card Globe', 'Halo Globe', 'Orb Wall', 'Orbit', 'Orbit Ring', 'Radial Wheel', 'Sphere 3D', 'Spiral', 'Spiral Vortex'],
  },
  {
    cat: 'Carousel & Flow',
    catAr: 'كاروسيل وانسياب',
    items: ['Arc Carousel', 'Carousel', 'Carousel 04', 'Carousel 3D 01', 'Carousel 3D 02', 'Coverflow', 'Curved Carousel', 'Curved Carousel 02', 'Curved Carousel 03', 'Curved Carousel 04', 'Filmstrip', 'Gallery 01', 'Ribbon Flow', 'Rotunda Carousel 01', 'Sphere Carousel', 'Swipe Deck'],
  },
  {
    cat: 'Colors',
    catAr: 'الألوان',
    items: ['Color Palette 01', 'Color Palette 02', 'Color Palette 03', 'Color Palette 04', 'Color Squares'],
  },
  {
    cat: 'Stack & Scatter',
    catAr: 'تكديس وتبعثر',
    items: ['Card Fan', 'Cascade', 'Depth Dive', 'Image Trail', 'Polaroid Stack', 'Proximity Field', 'Stack Scatter'],
  },
  {
    cat: 'Text',
    catAr: 'نصوص متحركة',
    items: ['3D Stagger Flip', 'Fluid Text', 'Gradient Text', 'Line Reveal', 'Text Morph', 'Text Stagger', 'Text Wave', 'Type Sequence', 'Video Text'],
  },
  {
    cat: 'Grid',
    catAr: 'شبكة',
    items: ['Drift Tiles', 'Grid Pulse', 'Mosaic Flip', 'Wave Grid'],
  },
  {
    cat: 'Reveal & Wipe',
    catAr: 'كشف ومسح',
    items: ['Blinds', 'Iris Reveal', 'Reveal Wipe', 'Stagger Reveal'],
  },
  {
    cat: 'Slideshow & Story',
    catAr: 'شرائح وقصة',
    items: ['Feature Stream', 'Slideshow', 'Split Screen', 'Story Feed'],
  },
  {
    cat: 'Spotlight & Focus',
    catAr: 'إبراز وتركيز',
    items: ['Cinematic', 'Ken Burns', 'Spotlight', 'Zoom Blur'],
  },
  {
    cat: 'Isometric',
    catAr: 'أيزومترك',
    items: ['Iso Tiles', 'Isometric'],
  },
  {
    cat: 'Logo & Branding',
    catAr: 'الشعار والهوية',
    items: ['Brand Motion 01', 'Logo Reveal', 'Neon Frame'],
  },
  {
    cat: 'Ticker & Marquee',
    catAr: 'شريط متحرك',
    items: ['Marquee', 'Totem Wall'],
  },
];

// Flat list of all template names (used by the ItemList JSON-LD schema).
export const ALL_TEMPLATE_NAMES = TEMPLATE_CATEGORIES.flatMap((g) => g.items);

// Stable URL slug for a category's English name, e.g. 'Carousel & Flow' ->
// 'carousel-flow'. Used by the server-rendered /templates/<slug> landing pages.
export function categorySlug(cat) {
  return String(cat)
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
