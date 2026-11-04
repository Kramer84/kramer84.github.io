"""Static checks for the site. Run from the repo root: python3 -m unittest discover tests"""

import json
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LANGS = ("fr", "en")


class IndexParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.data_keys = set()
        self.ids = set()
        self.local_refs = set()
        self.mailto = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "data-key" in attrs:
            self.data_keys.add(attrs["data-key"])
        if "id" in attrs:
            self.ids.add(attrs["id"])

        href = attrs.get("href") or ""
        if href.startswith("mailto:"):
            self.mailto = href.removeprefix("mailto:")

        refs = [href, attrs.get("src")]
        if attrs.get("property") == "og:image":
            refs.append(attrs.get("content"))
        for ref in refs:
            if ref and not re.match(r"[a-z]+:", ref):
                self.local_refs.add(ref)


def key_paths(node, prefix=""):
    paths = set()
    for key, value in node.items():
        paths.add(prefix + key)
        if isinstance(value, dict):
            paths |= key_paths(value, f"{prefix}{key}.")
    return paths


def lookup(node, dotted_key):
    for part in dotted_key.split("."):
        node = node[part]
    return node


class SiteTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT / "data.json").read_text(encoding="utf-8"))
        cls.index = IndexParser()
        cls.index.feed((ROOT / "index.html").read_text(encoding="utf-8"))
        cls.script = (ROOT / "script.js").read_text(encoding="utf-8")

    def cards(self, lang):
        """Fields script.js injects through innerHTML."""
        for repo in self.data[lang]["repositories"]:
            yield repo["name"], repo["description"], repo["url"]
        for pub in self.data[lang]["publications"]:
            yield pub["title"], pub["description"], pub["url"]

    def test_languages_have_the_same_keys(self):
        self.assertEqual(key_paths(self.data["fr"]), key_paths(self.data["en"]))

    def test_every_data_key_has_text_in_every_language(self):
        self.assertTrue(self.index.data_keys)
        for lang in LANGS:
            for key in self.index.data_keys:
                with self.subTest(lang=lang, key=key):
                    value = lookup(self.data[lang], key)
                    self.assertIsInstance(value, str)
                    self.assertTrue(value.strip())

    def test_lists_are_populated_and_parallel(self):
        for field in ("skills", "repositories", "publications"):
            with self.subTest(field=field):
                self.assertTrue(self.data["fr"][field])
                self.assertEqual(len(self.data["fr"][field]), len(self.data["en"][field]))

    def test_cards_link_to_the_same_urls_in_both_languages(self):
        for field in ("repositories", "publications"):
            with self.subTest(field=field):
                urls = [[item["url"] for item in self.data[lang][field]] for lang in LANGS]
                self.assertEqual(urls[0], urls[1])

    def test_card_urls_use_https(self):
        for lang in LANGS:
            for _, _, url in self.cards(lang):
                with self.subTest(lang=lang, url=url):
                    self.assertTrue(url.startswith("https://"))

    def test_card_text_is_safe_for_inner_html(self):
        # "R & D" is valid HTML; "&copy" would be parsed as a character reference.
        ambiguous_ampersand = re.compile(r"&(?=[#\w])(?!#?\w+;)")
        for lang in LANGS:
            for title, description, _ in self.cards(lang):
                for text in (title, description):
                    with self.subTest(lang=lang, text=text):
                        self.assertNotIn("<", text)
                        self.assertIsNone(ambiguous_ampersand.search(text))

    def test_mailto_matches_displayed_email(self):
        for lang in LANGS:
            with self.subTest(lang=lang):
                self.assertEqual(self.index.mailto, self.data[lang]["email"])

    def test_other_projects_are_parallel_safe_and_unlinked(self):
        self.assertEqual(len(self.data["fr"]["other_projects"]), len(self.data["en"]["other_projects"]))
        for lang in LANGS:
            for project in self.data[lang]["other_projects"]:
                with self.subTest(lang=lang, name=project["name"]):
                    self.assertNotIn("url", project)
                    self.assertNotIn("<", project["name"] + project["description"])

    def test_page_stays_out_of_search_engines(self):
        # Deliberate: the site is reached only through the QR code on the CV.
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn('<meta name="robots" content="noindex, nofollow">', html)

    def test_local_references_exist(self):
        self.assertTrue(self.index.local_refs)
        for ref in self.index.local_refs:
            with self.subTest(ref=ref):
                self.assertTrue((ROOT / ref).is_file())

    def test_script_targets_exist_in_index(self):
        targets = set(re.findall(r"getElementById\('([^']+)'\)", self.script))
        self.assertTrue(targets)
        self.assertLessEqual(targets, self.index.ids)


if __name__ == "__main__":
    unittest.main()
