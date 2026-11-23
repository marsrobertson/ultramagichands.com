# ultramagichands.com

Static site for Ultra Magic Hands, massage by Mars in London. Plain HTML/CSS/JS, no build step.

```
index.html            massage homepage
gardening-affairs.html Ministry of Gardening Affairs
dating-relating.html   Dating & relating
advisory.html          Advisory, consultancy & counselling
assets/style.css      styles
assets/site.js        WhatsApp links, nav, animated review wall
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
- Price and treatment copy: `index.html`, sections `#prices` and `#experience`.
- Text testimonials in `#reviews` are shown until review screenshots are added, then hidden automatically.
- Colours: the variables at the top of `assets/style.css`.

## Hosting (GitHub Pages)

1. Repo Settings → Pages → Deploy from branch → `main` / root.
2. `CNAME` already contains `www.ultramagichands.com`.
3. At your domain registrar, point `www` (CNAME) to `marsrobertson.github.io`, and add the four GitHub Pages A records for the bare domain. Then remove the Google Sites custom-domain mapping.

## Existing review screenshot collection

The wall uses original screenshots in `reviews/png/` and reviewer metadata in
`reviews/reviews.csv`. Run `python3 tools/index_reviews.py` after updating them.

Natural-height reviews pack into tight columns with a dedicated full-height
newsletter placeholder column. The river moves left and pauses on hover or
keyboard focus. Drag or swipe to move it in either direction. Offscreen columns
reshuffle as they recycle. Reviews display inline; only the 🔗 badges link to
Google originals. Reduced-motion preferences enable manual scrolling.

Email capture is not connected yet.

Pricing uses one shared sliding-scale panel with one booking link. Related work
is linked from the homepage’s `#projects` section and has three dedicated pages.

## Editorial images

`assets/images/` contains four generated editorial illustrations, encoded as
JPEGs for the website: massage, gardening, conversation, and advisory. They are illustrative
artwork, not photographs of Mars, clients, or actual project locations. Used in
the homepage hero, experience section, project cards, and dedicated page heroes.

## Your own photo gallery

`gallery.html` is the personal photo gallery, separate from Google review screenshots.
It uses natural image proportions, captions, keyboard navigation and a swipeable
full-size viewer. No generated artwork is added to this gallery.

Import a folder of your own JPEG, PNG, WebP or AVIF photos:

```
python3 tools/build_gallery.py --source /path/to/your/photos
```

Requires Pillow. Originals stay untouched. The importer creates web JPEGs without
EXIF/GPS metadata and generates `gallery/photos.js`. Optional `gallery/captions.json`
maps original filenames to `caption` and `alt` values. Filename order controls display
order. The first imported photo becomes the homepage hero; the first six appear in
the homepage gallery preview. Until photos are supplied, that preview stays hidden
and the dedicated gallery shows an empty state. No upload backend is required.
