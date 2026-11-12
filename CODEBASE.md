# Codebase index

| Path | Role | Entry point |
|------|------|-------------|
| `index.html` | Page skeleton: `data-key` placeholders, hardcoded social and `mailto:` links, meta tags | Served at `/` |
| `script.js` | Fetches `data.json` and renders the selected language | ``switchLang()` runs at load (script is `defer`red) |
| `data.json` | All translatable content, under `fr` and `en` | Edit this to change the profile text, skills, repos or publications |
| `style.css` | Layout and theme; colours are variables on `:root` | Linked from `index.html` |
| `data/` | Data, not code: images and GIMP sources | See below |
| `tests/test_site.py` | Static checks: FR/EN parity, `data-key` coverage, card text and URLs, local references, HTML summary fallback | `python3 -m unittest discover tests` |
| `tests/script.test.js` | Behaviour tests for `script.js` in a Node `vm` sandbox with a fake DOM (no dependencies) | `node --test tests/script.test.js` |

## Rendering (`script.js`)

`switchLang(lang)` loads `data.json` once, fills each `[data-key]` element (dotted keys such as `labels.skills` are nested lookups), then rebuilds the skills, publications, repository and other-project lists. It also sets `<html lang>` and marks the active language button. The choice is saved in `localStorage` as `preferredLang`; without one, French browsers get `fr` and all others `en`. If `data.json` fails, the fallback text in `index.html` stays.

## Images (`data/`)

Only `profile.jpg` (300x300, made by `enhance_profile.py` in the private repo from the original `DSC_4389.JPG`) lives here: it is the profile picture and the `og:image`. Originals and GIMP sources are in the private repo `Kramer84/site-image-sources`. Older commits of this repo still contain them.
