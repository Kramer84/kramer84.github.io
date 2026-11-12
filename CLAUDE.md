# kramer84.github.io

Personal professional profile of Kristóf A. Simády, in French and English, served by GitHub Pages from `main` at the repo root (no build step, no Jekyll config). Plain HTML, CSS and JavaScript with no dependencies to install; Font Awesome loads from a CDN.

## Commands

- Run: `python3 -m http.server 8000`, then open http://localhost:8000. The page fetches `data.json`, so opening `index.html` as a `file://` URL shows only the name, title, contact details and links written in the HTML.
- Check after editing content: `python3 -m json.tool data.json >/dev/null`.
- Test: `python3 -m unittest discover tests` (static checks, standard library only) and `node --test tests/script.test.js` (script.js behaviour, Node built-ins only).
- Lint, install: none exist.
- Deploy: pushing to `main` publishes the site.

## Working rules

- Stay inside this folder.
- Separate facts from hypotheses: give verified values with their source file and label hypotheses.
- When docs and files disagree, the files win; fix the doc.
- `data/` is public: put only images the page uses there. Originals and sources go in the private repo `Kramer84/site-image-sources`, cloned (git-ignored) at `image-sources/`.
- Everything committed here is public, including the contents of `data/`. Check `git status` before any commit.

## Gotchas

- `data.json` holds parallel `fr` and `en` trees. Change both, keeping the same keys: in `script.js`, a missing `data-key` value displays as the text `undefined`, and a missing parent object or `skills`/`repositories` list throws and stops the render.
- Repository and publication fields go through `innerHTML` in `script.js`. Write them as valid HTML: escape `<`, and escape `&` when a letter, digit or `#` follows it.
- The French summary is also written in `index.html` as the fallback when `data.json` fails; a test checks the two match. The email appears in `data.json` and twice in `index.html` (link target and fallback text). Change them together. The name, title and location also have fallback text in `index.html`.
- `index.html` sets `noindex, nofollow` on purpose: for now the owner wants the site reached only through the QR code on the CV. Do not remove it or add links to the site without asking.

Last validated against the real files: 2026-11-04
