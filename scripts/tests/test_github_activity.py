"""Checks for report dates, complete pages, and failed GitHub requests."""

import importlib.util
import json
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / "github-activity.py"
spec = importlib.util.spec_from_file_location("activity", SCRIPT)
activity = importlib.util.module_from_spec(spec)
spec.loader.exec_module(activity)

SINCE = activity.timestamp("2026-10-12")
UNTIL = activity.timestamp("2026-10-19")
CONFIG = {
    "workspace": {"repo": "acme/workspace"},
    "sdks": [{"repo": "acme/sdk"}],
    "projects": [{"repo": "acme/app"}],
}


def item(number, repo="acme/sdk", **fields):
    return {
        "number": number, "repository_url": f"https://api.github.com/repos/{repo}",
        "title": f"Change {number}", "html_url": f"https://github.com/{repo}/issues/{number}",
        **fields,
    }


class ActivityTests(unittest.TestCase):
    def test_uses_event_dates_and_includes_workspace_and_projects(self):
        # PR 1 was created before the period, then merged during it. PR 2 opened
        # exactly at the start; PR 3 opened exactly at the next period's start.
        responses = [
            [item(1, created_at="2026-10-01T12:00:00Z"),
             item(2, repo="acme/workspace", created_at="2026-10-12T00:00:00Z"),
             item(3, created_at="2026-10-19T00:00:00Z")],
            [item(1, pull_request={"merged_at": "2026-10-15T12:00:00Z"})],
            [item(4, repo="acme/app", closed_at="2026-10-16T12:00:00Z")],
            [],
        ]
        with patch.object(activity, "search", side_effect=responses) as search:
            report = activity.collect(CONFIG, "albert", SINCE, UNTIL)
        self.assertEqual([row["number"] for row in report["opened_prs"]], [2])
        self.assertEqual([row["number"] for row in report["merged_prs"]], [1])
        self.assertEqual([row["number"] for row in report["closed_unmerged_prs"]], [4])
        for call in search.call_args_list:
            for repo in ("acme/workspace", "acme/sdk", "acme/app"):
                self.assertIn(f"repo:{repo}", call.args[0])
        self.assertIn("is:unmerged", search.call_args_list[2].args[0])

    def test_merge_timestamp_fetched_when_search_omits_it(self):
        with patch.object(activity, "search", side_effect=[[], [item(5)], [], []]), \
             patch.object(activity, "api", return_value=[{"merged_at": "2026-10-13T12:00:00Z"}]):
            report = activity.collect(CONFIG, "albert", SINCE, UNTIL)
        self.assertEqual(report["merged_prs"][0]["at"], "2026-10-13T12:00:00Z")

    def test_issue_comments_filter_author_date_and_keep_later_pages(self):
        pages = [
            [{"user": {"login": "someone"}, "created_at": "2026-10-13T00:00:00Z"},
             {"user": {"login": "albert"}, "created_at": "2026-10-11T23:59:59Z"}],
            [{"user": {"login": "Albert"}, "created_at": "2026-10-18T23:59:59Z",
              "html_url": "https://github.com/acme/sdk/issues/6#issuecomment-1"},
             {"user": {"login": "albert"}, "created_at": "2026-10-19T00:00:00Z"}],
        ]
        with patch.object(activity, "search", side_effect=[[], [], [], [item(6)]]) as search, \
             patch.object(activity, "api", return_value=pages):
            report = activity.collect(CONFIG, "albert", SINCE, UNTIL)
        self.assertEqual(len(report["issue_comments"]), 1)
        self.assertTrue(report["issue_comments"][0]["url"].endswith("issuecomment-1"))
        self.assertEqual(report["pr_reviews"], [])
        # A thread updated after the window can still contain comments in it.
        self.assertIn("involves:albert", search.call_args_list[-1].args[0])
        self.assertNotIn("is:issue", search.call_args_list[-1].args[0])
        self.assertIn("updated:>=", search.call_args_list[-1].args[0])
        self.assertNotIn("..", search.call_args_list[-1].args[0])

    def test_pr_comments_and_reviews_are_included(self):
        pr = item(
            9, html_url="https://github.com/acme/sdk/pull/9",
            pull_request={"url": "https://api.github.com/repos/acme/sdk/pulls/9"},
        )
        comments = [[{"user": {"login": "albert"}, "created_at": "2026-10-13T12:00:00Z",
                      "html_url": "https://github.com/acme/sdk/pull/9#issuecomment-2"}]]
        reviews = [[{"user": {"login": "albert"}, "submitted_at": "2026-10-14T12:00:00Z",
                     "html_url": "https://github.com/acme/sdk/pull/9#pullrequestreview-3",
                     "state": "APPROVED"},
                    {"user": {"login": "albert"}, "submitted_at": None, "state": "PENDING"},
                    {"user": {"login": "other"}, "submitted_at": "2026-10-14T12:00:00Z",
                     "state": "COMMENTED"}]]

        def fake_api(endpoint, **_params):
            if endpoint.endswith("/comments"):
                return comments
            if endpoint.endswith("/reviews"):
                return reviews
            self.fail(endpoint)

        with patch.object(activity, "search", side_effect=[[], [], [], [pr]]), \
             patch.object(activity, "api", side_effect=fake_api):
            report = activity.collect(CONFIG, "albert", SINCE, UNTIL)
        self.assertTrue(report["issue_comments"][0]["url"].endswith("issuecomment-2"))
        self.assertTrue(report["pr_reviews"][0]["url"].endswith("pullrequestreview-3"))
        self.assertEqual(report["pr_reviews"][0]["state"], "APPROVED")
        self.assertEqual(len(report["pr_reviews"]), 1)

    def test_search_keeps_all_pages_and_rejects_partial_results(self):
        pages = [{"total_count": 101, "items": [item(1)]},
                 {"total_count": 101, "items": [item(2)]}]
        with patch.object(activity, "api", return_value=pages):
            self.assertEqual([row["number"] for row in activity.search("query")], [1, 2])
        for page in ({"total_count": 1001}, {"total_count": 1, "incomplete_results": True}):
            with patch.object(activity, "api", return_value=[page]), \
                 self.assertRaisesRegex(RuntimeError, "incomplete"):
                activity.search("query")

    def test_api_reads_all_pages_without_shell_interpolation(self):
        result = subprocess.CompletedProcess([], 0, stdout=json.dumps([[], []]))
        with patch.object(activity.subprocess, "run", return_value=result) as run:
            self.assertEqual(activity.api("search/issues", q="repo:acme/sdk author:albert"), [[], []])
        command = run.call_args.args[0]
        self.assertEqual(command[command.index("--method") + 1], "GET")
        self.assertIn("--paginate", command)
        self.assertIn("q=repo:acme/sdk author:albert", command)
        self.assertNotIn("shell", run.call_args.kwargs)

    def test_api_failure_is_not_reported_as_empty_activity(self):
        result = subprocess.CompletedProcess([], 1, stdout="", stderr="rate limit exceeded")
        with patch.object(activity.subprocess, "run", return_value=result), \
             self.assertRaisesRegex(RuntimeError, "rate limit exceeded"):
            activity.api("search/issues")

    def test_timezone_and_invalid_input(self):
        self.assertEqual(activity.timestamp("2026-10-12T02:00:00+02:00"), SINCE)
        with self.assertRaises(ValueError):
            activity.timestamp("2026-10-12T00:00:00")
        with self.assertRaises(ValueError):
            activity.repositories({"sdks": [{"repo": "not a repository"}]})


if __name__ == "__main__":
    unittest.main()
