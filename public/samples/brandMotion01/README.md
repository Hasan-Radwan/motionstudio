# Brand Motion 01 — default sample images

Drop the default **background montage** images for the "Brand Motion 01"
template into this folder. They flip quickly behind the revealed logo.

Naming (exact):

    card-1.jpg
    card-2.jpg
    …
    card-12.jpg

- Use JPG, named `card-N.jpg` starting at 1, with no gaps.
- Up to 12 are used by default (the template's default image count is 12:
  1 logo + up to 11 montage frames). You can add fewer — missing files are
  skipped and it falls back to the generic cards in `public/samples/cards/`.
- Landscape/portrait both work; they're drawn "cover" to fill the 9:16 frame.

The **logo** (first slot) is the Rotion "R" by default
(`public/icon-rotion-02.png`); users replace it by uploading their own logo
into the first media slot.

After adding or changing files, rebuild (`npm run build`) / redeploy for the
live site; the local dev server picks them up on refresh.
