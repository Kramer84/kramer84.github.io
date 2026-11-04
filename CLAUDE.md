# kramer84.github.io

Personal professional profile of Kristóf A. Simády, in French and English, served by GitHub Pages from `main` at the repo root (no build step, no Jekyll config). Plain HTML, CSS and JavaScript with no dependencies to install; Font Awesome loads from a CDN.

## Commands

- Run: `python3 -m http.server 8000`, then open http://localhost:8000. The page fetches `data.json`, so opening `index.html` as a `file://` URL leaves it empty.
- Check after editing content: `python3 -m json.tool data.json >/dev/null`.
- Test: `python3 -m unittest discover tests` (static checks, standard library only).
- Lint, install: none exist.
- Deploy: pushing to `main` publishes the site.

## Working rules

- Stay inside this folder.
- Separate facts from hypotheses: give verified values with their source file and label hypotheses.
- When docs and files disagree, the files win; fix the doc.
- Keep the images in `data/` in place, used or not, until the owner asks for a change; choosing them is the owner's call.
- Everything committed here is public, including the contents of `data/`. Check `git status` before any commit.

## Gotchas

- `data.json` holds parallel `fr` and `en` trees. Change both, keeping the same keys: in `script.js`, a missing `data-key` value displays as the text `undefined`, and a missing parent object or `skills`/`repositories` list throws and stops the render.
- Repository and publication fields go through `innerHTML` in `script.js`. Write them as valid HTML: escape `<`, and escape `&` when a letter, digit or `#` follows it.
- The email appears twice: the `email` values in `data.json` (displayed text) and the `mailto:` in `index.html` (link target). Change them together.
- `index.html` sets `noindex, nofollow`, so search engines are told to skip the site.

Last validated against the real files: 2026-11-04
