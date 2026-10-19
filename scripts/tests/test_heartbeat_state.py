"""Checks for resuming saved work without losing existing heartbeat entries."""

from copy import deepcopy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "heartbeat-state.py"
spec = importlib.util.spec_from_file_location("heartbeat_state", SCRIPT)
state_tool = importlib.util.module_from_spec(spec)
spec.loader.exec_module(state_tool)
EXAMPLE = SCRIPT.parent.parent / "schemas/heartbeat-state.example.json"


class HeartbeatStateTests(unittest.TestCase):
    def setUp(self):
        self.state = json.loads(EXAMPLE.read_text())

    def test_existing_entries_remain_valid_and_due(self):
        for queue in state_tool.QUEUES:
            self.state[queue] = [
                {key: value for key, value in entry.items() if key in state_tool.REQUIRED}
                for entry in self.state[queue]
            ]
        state_tool.validate(self.state)
        self.assertEqual(len(state_tool.due(self.state, state_tool.timestamp("2026-07-01T00:00:00Z"))), 3)

    def test_waiting_items_resume_at_their_check_time(self):
        now = state_tool.timestamp("2026-07-01T14:00:00+02:00")
        result = state_tool.due(self.state, now)
        self.assertEqual([entry["queue"] for entry in result], ["retry_queue"])
        self.assertIn("promise", result[0])
        self.assertIn("evidence", result[0])
        self.assertIn("done_when", result[0])

    def test_all_queues_resume_when_due_without_mutating_state(self):
        original = deepcopy(self.state)
        result = state_tool.due(self.state, state_tool.timestamp("2026-07-04T00:00:00Z"))
        self.assertEqual(len(result), 3)
        self.assertEqual(self.state, original)

    def test_invalid_state_fails_validation(self):
        for key, value in (("next_check_at", "2026-07-01T12:00:00"),
                           ("next_check_at", "not a date"),
                           ("evidence", "not a list"), ("goal", ""),
                           ("updated_at", "2026-02-30"), ("unknown", "value")):
            with self.subTest(key=key, value=value):
                state = deepcopy(self.state)
                state["retry_queue"][0][key] = value
                with self.assertRaises((TypeError, ValueError)):
                    state_tool.validate(state)

    def test_broken_or_missing_queues_fail(self):
        for change in (lambda state: state.pop("blockers"),
                       lambda state: state.update(deferred={}),
                       lambda state: state.update(last_full_heartbeat="2026-02-30")):
            state = deepcopy(self.state)
            change(state)
            with self.assertRaises(ValueError):
                state_tool.validate(state)

    def test_empty_queue_is_valid(self):
        state = {"last_full_heartbeat": None, **{queue: [] for queue in state_tool.QUEUES}}
        self.assertEqual(state_tool.due(state, state_tool.timestamp("2026-07-01T00:00:00Z")), [])

    def test_missing_state_is_idle_and_does_not_create_a_file(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "state.json"
            result = subprocess.run([sys.executable, str(SCRIPT), "due", "--file", str(path)],
                                    text=True, capture_output=True)
            self.assertEqual(result.returncode, 0)
            self.assertEqual(json.loads(result.stdout), [])
            self.assertFalse(path.exists())

    def test_invalid_file_is_a_failure_not_an_empty_backlog(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "state.json"
            path.write_text('{"broken": true}')
            result = subprocess.run([sys.executable, str(SCRIPT), "due", "--file", str(path)],
                                    text=True, capture_output=True)
            self.assertEqual(result.returncode, 1)
            self.assertEqual(result.stdout, "")
            self.assertIn("Maintenance state error", result.stderr)


if __name__ == "__main__":
    unittest.main()
