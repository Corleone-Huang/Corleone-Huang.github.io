# Mengqi Huang’s academic homepage

This static site is published through GitHub Pages from `main`.

- `index.html` contains the biography, news, publications, and project content.
- `theme.css` holds the current site styles and loads after the base `template.css`.
- `career-timeline.js` and `news.js` handle the responsive timeline and news archive.
- `pics/` holds the site images and source artwork. `pics/optimized/` holds the responsive WebP files and JPEG fallbacks used on the page.

From the repository root, run `python3 -m http.server 8765 --bind 127.0.0.1` and open <http://127.0.0.1:8765/>.

To regenerate the responsive project images, run `python3 scripts/optimize_images.py` in an environment with Pillow installed. The script prints the generated asset URLs, including the content versions used in `index.html`.
