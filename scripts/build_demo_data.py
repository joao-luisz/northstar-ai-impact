"""Build a deterministic, explicitly synthetic cohort for the NORTHSTAR demo."""
from __future__ import annotations

import json
import math
import csv
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "cohort.json"
QUEUES = {
    "billing": {"volume": 1100, "resolution": 0.68, "grounded": 0.946, "handoff": 0.36, "latency": 1.78},
    "account": {"volume": 930, "resolution": 0.72, "grounded": 0.937, "handoff": 0.32, "latency": 1.96},
    "orders": {"volume": 1370, "resolution": 0.77, "grounded": 0.951, "handoff": 0.27, "latency": 1.72},
    "technical": {"volume": 820, "resolution": 0.59, "grounded": 0.912, "handoff": 0.43, "latency": 2.23},
}


def build_rows() -> list[dict[str, object]]:
    start = date(2026, 6, 29)
    rows = []
    for week in range(13):
        for queue_index, (queue, base) in enumerate(QUEUES.items()):
            volume = round(base["volume"] * (1 + week * 0.025 + math.sin(week * 0.5 + queue_index) * 0.055))
            rows.append({
                "week": week,
                "label": (start + timedelta(days=week * 7)).strftime("%b %d"),
                "queue": queue,
                "volume": volume,
                "resolution": round((base["resolution"] + week * 0.0088 + math.sin(week * 0.78 + queue_index) * 0.012) * 100, 2),
                "grounded": round((base["grounded"] - week * 0.0009 + math.sin(week * 0.62 + queue_index) * 0.0042) * 100, 2),
                "handoff": round((base["handoff"] - week * 0.0069 + math.cos(week * 0.61 + queue_index) * 0.0075) * 100, 2),
                "latency": round(base["latency"] - week * 0.025 + math.cos(week * 0.82 + queue_index) * 0.07, 3),
                "modelCost": round(0.14 - week * 0.001 + math.sin(week * 0.5 + queue_index) * 0.008, 4),
            })
    return rows


if __name__ == "__main__":
    OUT.parent.mkdir(parents=True, exist_ok=True)
    rows = build_rows()
    OUT.write_text(json.dumps({"data_status": "synthetic_demo", "generated_by": "scripts/build_demo_data.py", "rows": rows}, indent=2) + "\n", encoding="utf-8")
    with (ROOT / "data" / "cohort.csv").open("w", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} synthetic cohort rows to data/cohort.json and data/cohort.csv")
