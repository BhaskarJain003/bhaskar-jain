#!/usr/bin/env python3
"""
prepare_asteroid_data.py — DELEGATING SHIM
==========================================
All asteroid-data.json generation logic now lives in the sibling repo at
../Asteroid_Mining/build_website_data.py. This file is kept only so that
the legacy `npm run asteroid-data` command continues to work; it locates
the canonical script and runs it.

This file deliberately contains no asteroid-mining logic. The website is
a pure presentation layer over the JSON produced by Asteroid_Mining.

To refresh the data without going through npm:

    cd ../Asteroid_Mining
    uv run python build_website_data.py

To regenerate everything (taxonomy catalogs, merge, enrichment, JSON):

    cd ../Asteroid_Mining
    uv run python make_all.py
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parent
CANONICAL = REPO_ROOT.parent / "Asteroid_Mining" / "build_website_data.py"


def main() -> int:
    if not CANONICAL.exists():
        print(f"ERROR: Canonical data-prep script not found at:\n  {CANONICAL}",
              file=sys.stderr)
        print("\nThe website expects the Asteroid_Mining repo to live alongside it.\n"
              "Either clone it next to bhaskar-jain, or invoke build_website_data.py\n"
              "directly from wherever it lives:\n"
              "  uv run python <path-to>/build_website_data.py --output "
              f"{REPO_ROOT / 'public/thoughts/asteroid-mining/asteroid-data.json'}",
              file=sys.stderr)
        return 1

    print(f"Delegating to {CANONICAL}")
    result = subprocess.run(
        [sys.executable, str(CANONICAL)],
        cwd=CANONICAL.parent,
        check=False,
    )
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
