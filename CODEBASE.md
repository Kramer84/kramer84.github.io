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

`switchLang(lang)` refetches `data.json` on every call, fills each `[data-key]` element (dotted keys such as `labels.skills` are nested lookups), then rebuilds the skills, publications and repository lists. The choice is saved in `localStorage` as `preferredLang`; the default is `fr`.

## Images (`data/`)

| File | Status |
|------|--------|
| `DSC_4401.png` | Profile picture, used by `index.html` |
| `DSC4391.JPG` | `og:image` in `index.html` |
| `DSC_4401.xcf` | GIMP file, not referenced by the page |
| `DSC_4401.JPG`, `DSCGPT1.png`, `DSCGPT1BW.png`, `DSCGPT1.xcf` | Not referenced by the page |

## Open questions

- Which unreferenced images should go? Commit `b463688` says "remember the remove unused ones"; the owner has deferred this and will decide. Files stay in git history after removal, so deleting them does not unpublish them.
- Is `noindex, nofollow` in `index.html` still wanted? The meta description and Open Graph tags suggest the page is meant to be shared.
- `og:image` is the relative path `./data/DSC4391.JPG`. Hypothesis: link-preview crawlers need an absolute URL, so previews may show no image. Not tested.
- The `og:image` (`DSC4391.JPG`) and the profile picture (`DSC_4401.png`) are different files. Is that intended?
