# Default sample images

Drop your designed / generated images here and they show up automatically as the
**default preview content** for templates (before the user uploads their own).
Everything is optional — any missing file is silently skipped, so the app falls
back to the built-in generated placeholder until you add images.

Served at the site root, so a file at `public/samples/cards/card-1.jpg` is
reachable at `/samples/cards/card-1.jpg`.

## Generic cards (shared by every template with no specific set)

```
public/samples/cards/card-1.jpg
public/samples/cards/card-2.jpg
…
public/samples/cards/card-6.jpg
```

Use whatever card imagery you like (photos, posters, product shots). Portrait or
square works best for most carousels.

## Per-template sets (override the generic cards + add a background)

Named after the template id. Example for **Curved Carousel** (`curvedCarousel`):

```
public/samples/curvedCarousel/card-1.jpg   ← used as the FOREGROUND subject (a cut-out PNG works great)
public/samples/curvedCarousel/card-2.jpg   ← poster
public/samples/curvedCarousel/card-3.jpg
…
public/samples/curvedCarousel/card-6.jpg
public/samples/curvedCarousel/bg.jpg       ← default background for this template
```

For the foreground subject, a transparent-background **PNG** (renamed to .jpg or
kept as .png — update the list in `src/assets/samples.js` if you use .png) reads
best over the moving carousel.

## Adding another template

Edit `src/assets/samples.js` → `TEMPLATE_SAMPLES` and add an entry with the
template id, its `cards` list, and an optional `background` URL.
