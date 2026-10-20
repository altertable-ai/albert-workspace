"""Exercise repository coverage with a fake read-only GitHub CLI."""

import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "ecosystem-status.sh"

FAKE_GH = '''#!/usr/bin/env python3
import json, os, subprocess, sys
from pathlib import Path
args = sys.argv[1:]
assert args[0] == "api", args
endpoint = args[1]
responses = json.loads(Path(os.environ["GH_FIXTURES"]).read_text())
with Path(os.environ["GH_CALLS"]).open("a") as calls:
    calls.write(endpoint + "\\n")
if endpoint not in responses:
    print("Unexpected request: " + endpoint, file=sys.stderr)
    sys.exit(1)
value = responses[endpoint]
if isinstance(value, dict) and "error" in value:
    print(value["error"], file=sys.stderr)
    sys.exit(1)
if "--slurp" in args and "--jq" in args:
    print("the `--slurp` option is not supported with `--jq` or `--template`", file=sys.stderr)
    sys.exit(1)
if "--slurp" in args:
    value = value["_pages"] if isinstance(value, dict) and "_pages" in value else [value]
if "--jq" in args:
    result = subprocess.run(["jq", "-r", args[args.index("--jq") + 1]],
                            input=json.dumps(value), text=True, capture_output=True)
    sys.stdout.write(result.stdout)
    sys.exit(result.returncode)
print(json.dumps(value))
'''


class EcosystemStatusTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        gh = self.root / "gh"
        gh.write_text(FAKE_GH)
        gh.chmod(0o755)
        self.config = {
            "workspace": {"repo": "acme/workspace"},
            "sdks": [{"repo": "acme/sdk", "kind": "lakehouse"},
                     {"repo": "acme/tool", "kind": "tooling"}],
            "projects": [{"repo": "acme/app", "kind": "runtime"},
                         {"repo": "acme/tool", "kind": "tooling"}],
        }
        self.responses = {
            "repos/altertable-ai/altertable-client-specs/tags": [
                {"name": "v2.0.0", "commit": {"sha": "latest-commit"}},
                {"name": "v1.0.0", "commit": {"sha": "older-commit"}},
            ],
            "repos/acme/sdk/git/trees/HEAD": {"tree": [{"path": "specs", "sha": "latest-commit"}]},
        }
        for repo in ("acme/workspace", "acme/sdk", "acme/tool", "acme/app"):
            self.responses.update({
                f"repos/{repo}": {"full_name": repo, "default_branch": "main"},
                f"repos/{repo}/pulls?state=open&per_page=100&page=1": [],
                f"repos/{repo}/issues?state=open&per_page=100&page=1": [],
                f"repos/{repo}/commits/main": {"sha": "head-commit"},
                f"repos/{repo}/commits/head-commit/check-runs?per_page=100": {
                    "total_count": 1,
                    "check_runs": [{"status": "completed", "conclusion": "success"}],
                },
            })

    def run_report(self):
        config_path = self.root / "config.json"
        config_path.write_text(json.dumps(self.config))
        fixtures = self.root / "responses.json"
        fixtures.write_text(json.dumps(self.responses))
        calls = self.root / "calls.txt"
        env = {**os.environ, "PATH": f"{self.root}{os.pathsep}{os.environ['PATH']}",
               "GH_FIXTURES": str(fixtures), "GH_CALLS": str(calls)}
        result = subprocess.run(["bash", str(SCRIPT), "--json", "--config", str(config_path)],
                                env=env, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        return {entry["repo"]: entry for entry in json.loads(result.stdout)["repos"]}, calls.read_text()

    def test_all_configured_repositories_and_only_api_sdks_need_specs(self):
        repos, calls = self.run_report()
        self.assertEqual(set(repos), {"acme/workspace", "acme/sdk", "acme/tool", "acme/app"})
        self.assertEqual(repos["acme/sdk"]["spec"], "OK")
        for repo in ("acme/workspace", "acme/tool", "acme/app"):
            self.assertEqual(repos[repo]["spec"], "N/A")
            self.assertNotIn(f"repos/{repo}/git/trees", calls)
        self.assertNotIn("git/ref/tags", calls)

    def test_issues_after_a_full_page_of_prs_are_counted(self):
        self.responses["repos/acme/app/issues?state=open&per_page=100&page=1"] = [
            {"pull_request": {"url": "a-pr"}} for _ in range(100)
        ]
        self.responses["repos/acme/app/issues?state=open&per_page=100&page=2"] = [{"number": 101}]
        repos, _ = self.run_report()
        self.assertEqual(repos["acme/app"]["open_issues"], "1")

    def test_failed_requests_are_unavailable_not_zero_or_missing(self):
        self.responses["repos/acme/app"] = {"error": "network error"}
        self.responses["repos/acme/sdk/git/trees/HEAD"] = {"error": "request failed"}
        repos, _ = self.run_report()
        self.assertEqual(repos["acme/app"]["spec"], "UNAVAILABLE")
        self.assertEqual(repos["acme/app"]["open_prs"], "-")
        self.assertEqual(repos["acme/sdk"]["spec"], "UNKNOWN")

    def test_checks_on_later_pages_can_fail_or_still_be_pending(self):
        first_page = {"total_count": 101, "check_runs": [
            {"status": "completed", "conclusion": "success"} for _ in range(100)
        ]}
        for status, conclusion, expected in (("completed", "failure", "failure"),
                                              ("in_progress", None, "pending")):
            with self.subTest(expected=expected):
                self.responses["repos/acme/app/commits/head-commit/check-runs?per_page=100"] = {
                    "_pages": [first_page, {"total_count": 101, "check_runs": [
                        {"status": status, "conclusion": conclusion}
                    ]}]
                }
                repos, _ = self.run_report()
                self.assertEqual(repos["acme/app"]["ci"], expected)

    def test_tooling_only_inventory_does_not_fetch_specs(self):
        self.config["sdks"] = [{"repo": "acme/tool", "kind": "tooling"}]
        repos, calls = self.run_report()
        self.assertTrue(all(repo["spec"] == "N/A" for repo in repos.values()))
        self.assertNotIn("altertable-client-specs", calls)


if __name__ == "__main__":
    unittest.main()
