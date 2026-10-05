"""Database-free tests of the public reusable-app contract."""
import sys
import unittest
from importlib.resources import files
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "src"))

from django.conf import settings

if not settings.configured:
    settings.configure(
        SECRET_KEY="integration-tests-only",
        INSTALLED_APPS=["django.contrib.staticfiles", "scientific_calculator"],
        STATIC_URL="/static/",
        TEMPLATES=[{"BACKEND": "django.template.backends.django.DjangoTemplates", "APP_DIRS": True}],
    )

import django
django.setup()
from django.contrib.staticfiles import finders
from django.template import Context, Template
from django.template.loader import render_to_string
from scientific_calculator.templatetags.scientific_calculator import scientific_calculator


class IntegrationTests(unittest.TestCase):
    def test_no_argument_tag_contract(self):
        self.assertEqual(scientific_calculator(), {})
        html = Template("{% load scientific_calculator %}{% scientific_calculator %}").render(Context())
        self.assertEqual(html, render_to_string("scientific_calculator/calculator.html"))
        self.assertIn("data-scientific-calculator", html)

    def test_multiple_embeds_have_no_duplicate_ids(self):
        from html.parser import HTMLParser
        class Inventory(HTMLParser):
            roots = 0
            ids = []
            def handle_starttag(self, tag, attrs):
                values = dict(attrs)
                if "data-scientific-calculator" in values:
                    self.roots += 1
                if "id" in values:
                    self.ids.append(values["id"])
        html = Template("{% load scientific_calculator %}{% scientific_calculator %}{% scientific_calculator %}").render(Context())
        inventory = Inventory()
        inventory.feed(html)
        self.assertEqual(inventory.roots, 2)
        self.assertEqual(len(inventory.ids), len(set(inventory.ids)))

    def test_host_context_is_escaped_and_does_not_leak_into_tag(self):
        payload = '<img src=x onerror="alert(1)">'
        html = Template("{% load scientific_calculator %}{{ brand }}{% scientific_calculator %}").render(Context({"brand": payload, "result": payload}))
        self.assertIn("&lt;img", html)
        self.assertNotIn(payload, html)
        self.assertEqual(html.count("data-scientific-calculator"), 1)

    def test_packaged_assets_are_discoverable_and_local(self):
        package = files("scientific_calculator")
        for name in ("calculator.js", "calculator.css", "physical-keys.json"):
            relative = "scientific_calculator/" + name
            asset = package.joinpath("static", relative)
            self.assertTrue(asset.is_file(), relative)
            self.assertEqual(Path(finders.find(relative)).read_bytes(), asset.read_bytes())
        self.assertTrue(package.joinpath("templates/scientific_calculator/calculator.html").is_file())


if __name__ == "__main__":
    unittest.main()
