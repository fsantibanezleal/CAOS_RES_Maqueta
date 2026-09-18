"""Every version source agrees (conventions/versioning.md, ADR-0068).

VERSION holds the display form (X.XX.XXX) and is the single source of truth; frontend/package.json and its
lock file hold the semver form without leading zeros (0.9.0 for 0.09.000); the CHANGELOG's top entry is the
same release. The in-app footer derives its display string from package.json.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]


def _numbers(version: str) -> tuple[int, int, int]:
    match = re.fullmatch(r"v?(\d+)\.(\d+)\.(\d+)", version.strip())
    assert match, f"not a version: {version!r}"
    return tuple(int(part) for part in match.groups())


def test_version_file_is_the_display_form():
    display = (REPO / "VERSION").read_text(encoding="utf-8").strip()
    assert re.fullmatch(r"\d+\.\d{2}\.\d{3}", display), display


def test_manifests_changelog_and_version_agree():
    display = (REPO / "VERSION").read_text(encoding="utf-8").strip()
    package = json.loads((REPO / "frontend" / "package.json").read_text(encoding="utf-8"))["version"]
    lock = json.loads((REPO / "frontend" / "package-lock.json").read_text(encoding="utf-8"))
    changelog = (REPO / "CHANGELOG.md").read_text(encoding="utf-8")
    top = re.search(r"^## \[(\d+\.\d+\.\d+)\]", changelog, re.M).group(1)

    assert re.fullmatch(r"(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)", package), f"package.json {package} is not semver"
    assert _numbers(package) == _numbers(display)
    assert lock["version"] == lock["packages"][""]["version"] == package
    assert top == display, f"CHANGELOG top entry {top}, VERSION {display}"
