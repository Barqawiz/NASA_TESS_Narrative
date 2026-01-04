#!/usr/bin/env python3
"""
Compare CSV headers and show a small preview without loading full files into memory.

Usage:
  python3 scripts/compare_csv_headers.py data/tess_confirmed_plannets.csv data/tess_confirmed_plannetsv2.csv
"""

from __future__ import annotations

import csv
import sys
from pathlib import Path


def read_header(path: Path) -> list[str]:
    with path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.reader(f)
        return next(reader)


def preview_rows(path: Path, n: int = 3) -> list[list[str]]:
    rows: list[list[str]] = []
    with path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.reader(f)
        header = next(reader)
        rows.append(header)
        for i, row in enumerate(reader):
            if i >= n:
                break
            rows.append(row)
    return rows


def main() -> int:
    if len(sys.argv) != 3:
        print("Expected 2 args: <csv1> <csv2>", file=sys.stderr)
        return 2

    p1 = Path(sys.argv[1])
    p2 = Path(sys.argv[2])

    h1 = read_header(p1)
    h2 = read_header(p2)

    s1 = set(h1)
    s2 = set(h2)

    only1 = sorted(s1 - s2)
    only2 = sorted(s2 - s1)

    print(f"File 1: {p1}  columns={len(h1)}")
    print(f"File 2: {p2}  columns={len(h2)}")
    print()

    print(f"Only in file 1 ({len(only1)}):")
    for c in only1[:80]:
        print(f"  - {c}")
    if len(only1) > 80:
        print(f"  ... ({len(only1) - 80} more)")
    print()

    print(f"Only in file 2 ({len(only2)}):")
    for c in only2[:80]:
        print(f"  - {c}")
    if len(only2) > 80:
        print(f"  ... ({len(only2) - 80} more)")
    print()

    # tiny preview (header + first rows)
    for path in (p1, p2):
        print(f"Preview: {path} (header + 3 rows)")
        rows = preview_rows(path, n=3)
        for i, r in enumerate(rows):
            print(f"  row[{i}]: cols={len(r)}  first_8={r[:8]}")
        print()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())


