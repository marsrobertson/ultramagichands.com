# ultramagichands.com

Single-page site for Ultra Magic Hands, a mobile massage service in Playa San Juan, Tenerife. Plain HTML/CSS/JS, no build step.

```
index.html            the page
assets/style.css      styles
assets/site.js        WhatsApp links, nav, review collage, lightbox
reviews/raw/          drop Google Maps review screenshots here
reviews/reviews.js    generated list of review images (the page reads this)
tools/build_reviews.py  screenshots -> web images + collages
```

## Adding Google reviews

1. On your phone, open your Google Maps listing → Reviews → sort by Newest. Screenshot each review (crop to one review per image if you can).
2. Put the images in `reviews/raw/`. They are used in filename order.
3. Run:

   ```
   pip install pillow
   python3 tools/build_reviews.py --maps-url "https://maps.app.goo.gl/..." --rating 5.0 --count 23
   ```

   Use the rating and count exactly as Google shows them; leave them out and the collage just says "Google Maps reviews". Add `--trim-top 140` to cut the phone status bar if needed.

This writes:
- `reviews/img/*.jpg`: resized copies with photo metadata (location etc.) stripped. These appear on the site.
- `reviews/collage/collage.jpg`: one long collage.
- `reviews/collage/insta-*.jpg`: 1080×1350 slides for an Instagram carousel.

## Editing

- WhatsApp number: search `447586294279` in `index.html`.
- Prices and treatment copy: `index.html`, sections `#prices` and `#treatments`.
- Colours: the variables at the top of `assets/style.css`.

## Hosting (GitHub Pages)

1. Repo Settings → Pages → Deploy from branch → `main` / root.
2. `CNAME` already contains `www.ultramagichands.com`.
3. At your domain registrar, point `www` (CNAME) to `marsrobertson.github.io`, and add the four GitHub Pages A records for the bare domain. Then remove the Google Sites custom-domain mapping.
