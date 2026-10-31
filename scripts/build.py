#!/usr/bin/env python3
"""Generate the standalone workspace using only Python's standard library."""

import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def render():
    source = ROOT / "src"
    html = (source / "shell.html").read_text(encoding="utf-8")
    replacements = {
        "/* WORKSHOP_STYLES */": (source / "workshop.css").read_text(encoding="utf-8"),
        "/* WORKSHOP_VALIDATION */": (source / "validation.js").read_text(encoding="utf-8"),
        "/* WORKSHOP_CORE */": (source / "workshop-core.js").read_text(encoding="utf-8"),
        "/* WORKSHOP_BLUEPRINT */": (source / "workshop-blueprint.js").read_text(encoding="utf-8"),
        "/* WORKSHOP_STARTUP */": (source / "startup.js").read_text(encoding="utf-8"),
    }
    for key in ("seed", "matrix", "launch"):
        data = json.loads((source / "data" / f"{key}.json").read_text(encoding="utf-8"))
        replacements[f"/* {key.upper()}_DATA */"] = json.dumps(
            data, ensure_ascii=False, separators=(",", ":")
        ).replace("<", "\\u003c")
    for token, value in replacements.items():
        if html.count(token) != 1:
            raise ValueError(f"Marcador ausente ou repetido: {token}")
        if token.startswith("/* WORKSHOP_") and token != "/* WORKSHOP_STYLES */" and "</script" in value.lower():
            raise ValueError(f"Fechamento de script não escapado em {token}")
        html = html.replace(token, value)
    return html


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Check that index.html matches its sources")
    args = parser.parse_args()
    content = render()
    output = ROOT / "index.html"
    if args.check:
        if not output.exists() or output.read_text(encoding="utf-8") != content:
            raise SystemExit("index.html está desatualizado. Execute python3 scripts/build.py.")
        print("Distribuição confere com as fontes.")
    else:
        output.write_text(content, encoding="utf-8")
        digest = hashlib.sha256(content.encode("utf-8")).hexdigest()
        print(f"Gerado index.html ({len(content.encode('utf-8')):,} bytes, SHA-256 {digest[:12]}).")


if __name__ == "__main__":
    main()
