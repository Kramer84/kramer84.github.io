# Codebase index

| Path | Role | Entry point |
|------|------|-------------|
| `index.html` | Page skeleton: `data-key` placeholders, hardcoded social and `mailto:` links, meta tags | Served at `/` |
| `script.js` | Fetches `data.json` and renders the selected language | `window.onload` calls `switchLang()` |
| `data.json` | All translatable content, under `fr` and `en` | Edit this to change the profile text, skills, repos or publications |
| `style.css` | Layout and theme; colours are variables on `:root` | Linked from `index.html` |
| `data/` | Data, not code: images and GIMP sources | See below |
| `tests/test_site.py` | Static checks: FR/EN parity, `data-key` coverage, card text and URLs, local references | `python3 -m unittest discover tests` |

## Rendering (`script.js`)

`switchLang(lang)` loads `data.json` once, fills each `[data-key]` element (dotted keys such as `labels.skills` are nested lookups), then rebuilds the skills, publications, repository and other-project lists. It also sets `<html lang>` and marks the active language button. The choice is saved in `localStorage` as `preferredLang`; without one, French browsers get `fr` and all others `en`. If `data.json` fails, the fallback text in `index.html` stays.

## Images (`data/`)

| File | Status |
|------|--------|
| `DSC_4401.png` | Profile picture and `og:image` in `index.html` |
| `DSC_4401.xcf` | GIMP file, not referenced by the page |
| `DSC4391.JPG`, `DSC_4401.JPG`, `DSCGPT1.png`, `DSCGPT1BW.png`, `DSCGPT1.xcf` | Not referenced by the page |

## Open questions

- Which unreferenced images should go? Commit `00b7e36` says "remember the remove unused ones"; the owner has deferred this and will decide. Files stay in git history after removal, so deleting them does not unpublish them.
