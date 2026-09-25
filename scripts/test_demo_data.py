"""Data contract checks for the reproducible demo fixture."""
import unittest

from build_demo_data import QUEUES, build_rows


class DemoDataTests(unittest.TestCase):
    def test_fixture_has_thirteen_weeks_for_each_queue(self):
        rows = build_rows()
        self.assertEqual(len(rows), 13 * len(QUEUES))
        self.assertEqual({row["queue"] for row in rows}, set(QUEUES))
        self.assertEqual({row["week"] for row in rows}, set(range(13)))

    def test_metrics_are_in_valid_ranges(self):
        for row in build_rows():
            self.assertGreater(row["volume"], 0)
            for metric in ("resolution", "grounded", "handoff"):
                self.assertGreaterEqual(row[metric], 0)
                self.assertLessEqual(row[metric], 100)
            self.assertGreater(row["latency"], 0)
            self.assertGreater(row["modelCost"], 0)

    def test_fixture_is_deterministic(self):
        self.assertEqual(build_rows(), build_rows())


if __name__ == "__main__":
    unittest.main()
