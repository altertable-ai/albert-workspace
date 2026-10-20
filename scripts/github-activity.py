#!/usr/bin/env python3
"""Collect dated GitHub activity for a report. Requires Python 3.9+ and gh."""

import argparse
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent


def timestamp(value):
    """Accept a date (midnight UTC) or an ISO timestamp with a timezone."""
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if len(value) == 10:
        parsed = parsed.replace(tzinfo=timezone.utc)
    if parsed.tzinfo is None:
        raise ValueError("timestamps must include a timezone, for example Z")
    return parsed.astimezone(timezone.utc)


def iso(value):
    return value.isoformat().replace("+00:00", "Z")


def api(endpoint, **params):
    command = ["gh", "api", "--method", "GET", "--paginate", "--slurp", endpoint]
    for key, value in params.items():
        command.extend(["-f", f"{key}={value}"])
    result = subprocess.run(command, text=True, capture_output=True, timeout=60)
    if result.returncode:
        raise RuntimeError(f"GitHub request failed ({endpoint}): {result.stderr.strip()}")
    return json.loads(result.stdout)


def search(query):
    items = []
    for page in api("search/issues", q=query, per_page=100):
        if page.get("incomplete_results") or page["total_count"] > 1000:
            raise RuntimeError("GitHub search is incomplete; retry with a shorter period")
        items.extend(page["items"])
    return items


def repositories(config):
    entries = config.get("sdks", []) + config.get("projects", [])
    if config.get("workspace"):
        entries.append(config["workspace"])
    repos = sorted({entry["repo"] for entry in entries})
    if not repos or any(not re.fullmatch(r"[\w.-]+/[\w.-]+", repo) for repo in repos):
        raise ValueError("repository list must contain valid owner/repository names")
    return repos


def collect(config, author, since, until):
    repos = repositories(config)
    repo_set = set(repos)
    scope = " ".join(f"repo:{repo}" for repo in repos)

    def in_period(value):
        return value is not None and since <= timestamp(value) < until

    def repo_of(item):
        return "/".join(item["repository_url"].split("/")[-2:])

    report = {
        "since": iso(since), "until_exclusive": iso(until), "author": author,
        "repositories": repos, "opened_prs": [], "merged_prs": [],
        "closed_unmerged_prs": [], "issue_comments": [], "pr_reviews": [],
    }
    events = [
        ("opened_prs", "created", "", "created_at"),
        ("merged_prs", "merged", "is:merged", "merged_at"),
        ("closed_unmerged_prs", "closed", "is:unmerged", "closed_at"),
    ]
    for group, qualifier, extra, field in events:
        query = (f"{scope} is:pr author:{author} {extra} "
                 f"{qualifier}:{iso(since)}..{iso(until)}")
        for item in search(query):
            repo = repo_of(item)
            if repo not in repo_set:
                continue
            if field == "merged_at":
                # Search results do not always include a merge timestamp.
                value = item.get("pull_request", {}).get("merged_at")
                if not value:
                    pages = api(f"repos/{repo}/pulls/{item['number']}")
                    value = pages[0]["merged_at"]
            else:
                value = item[field]
            if in_period(value):
                report[group].append({
                    "repo": repo, "number": item["number"], "title": item["title"],
                    "url": item["html_url"], "at": value,
                })

    # Threads can change after the reporting period. Do not impose an upper
    # updated-at bound; filter the actual comment and review dates below.
    # `involves` covers issues and PRs Albert commented on or reviewed.
    query = f"{scope} involves:{author} updated:>={iso(since)}"
    for item in search(query):
        repo = repo_of(item)
        if repo not in repo_set:
            continue
        pages = api(f"repos/{repo}/issues/{item['number']}/comments", per_page=100)
        for page in pages:
            for comment in page:
                if ((comment.get("user") or {}).get("login", "").lower() == author.lower()
                        and in_period(comment["created_at"])):
                    report["issue_comments"].append({
                        "repo": repo, "number": item["number"], "title": item["title"],
                        "url": comment["html_url"], "at": comment["created_at"],
                    })
        if not item.get("pull_request"):
            continue
        pages = api(f"repos/{repo}/pulls/{item['number']}/reviews", per_page=100)
        for page in pages:
            for review in page:
                submitted = review.get("submitted_at")
                if ((review.get("user") or {}).get("login", "").lower() == author.lower()
                        and submitted and in_period(submitted)):
                    report["pr_reviews"].append({
                        "repo": repo, "number": item["number"], "title": item["title"],
                        "url": review.get("html_url") or item["html_url"],
                        "at": submitted, "state": review.get("state"),
                    })
    for group in ("opened_prs", "merged_prs", "closed_unmerged_prs",
                  "issue_comments", "pr_reviews"):
        report[group].sort(key=lambda row: (row["at"], row["url"]))
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--author", default="albert20260301")
    parser.add_argument("--since", help="inclusive date or ISO timestamp; default: seven days ago")
    parser.add_argument("--until", help="exclusive date or ISO timestamp; default: now (UTC)")
    parser.add_argument("--config", type=Path, default=ROOT / "repositories.config.json")
    args = parser.parse_args()
    try:
        if not re.fullmatch(r"[\w-]+", args.author):
            raise ValueError("author must be a GitHub login")
        until = timestamp(args.until) if args.until else datetime.now(timezone.utc)
        since = timestamp(args.since) if args.since else until - timedelta(days=7)
        if since >= until:
            raise ValueError("since must be earlier than until")
        config = json.loads(args.config.read_text())
        report = collect(config, args.author, since, until)
    except (ValueError, KeyError, OSError, RuntimeError, subprocess.TimeoutExpired) as error:
        print(f"Activity report failed: {error}", file=sys.stderr)
        return 1
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
