#!/usr/bin/env bun
/** Create a public GitHub repository and apply Altertable branch settings. */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GhError, gh, runCommand } from "./lib/gh.ts";

const PROTECTION = {
  required_status_checks: { strict: true, contexts: [] },
  enforce_admins: true,
  required_pull_request_reviews: {
    required_approving_review_count: 1,
    dismiss_stale_reviews: false,
    require_code_owner_reviews: false,
    require_last_push_approval: false,
  },
  restrictions: null,
  required_linear_history: false,
  allow_force_pushes: false,
  allow_deletions: false,
  block_creations: false,
  required_conversation_resolution: false,
};

export function parseRepo(name: string): { org: string; name: string; repo: string } {
  if (name.includes("/")) {
    const [org, short] = name.split("/");
    return { org, name: short, repo: name };
  }
  const user = gh.json({ endpoint: "user" }) as { login: string };
  return { org: user.login, name, repo: `${user.login}/${name}` };
}

export function setupGithubRepo(fullName: string, description = "") {
  const { repo } = parseRepo(fullName);
  console.log(`==> Creating repository ${repo}`);
  const created = runCommand(
    ["gh", "repo", "create", repo, "--public", ...(description ? ["--description", description] : [])],
  );
  if (created.exitCode) {
    console.error(created.stderr.trim());
    console.log("    Repository already exists or creation skipped — continuing.");
  } else {
    console.log("    Repository created.");
  }

  console.log("==> Configuring merge settings");
  gh.json({
    endpoint: `repos/${repo}`,
    method: "PATCH",
    fields: {
      allow_squash_merge: "true",
      squash_merge_commit_title: "PR_TITLE",
      squash_merge_commit_message: "PR_BODY",
      allow_rebase_merge: "true",
      allow_merge_commit: "false",
      allow_update_branch: "true",
      delete_branch_on_merge: "true",
      has_projects: "false",
      has_wiki: "false",
      has_discussions: "false",
    },
  });
  console.log("    Done.");

  console.log("==> Ensuring 'main' branch exists");
  try {
    const branch = gh.json({ endpoint: `repos/${repo}/branches/main` }) as { name?: string };
    if (branch.name === "main") {
      console.log("    'main' branch already exists.");
    } else {
      throw new Error("main missing");
    }
  } catch (error) {
    if (error instanceof GhError) {
      console.error(error.message);
    }
    console.log("    Branch not found — pushing an initial empty commit to create 'main'.");
    const folder = mkdtempSync(join(tmpdir(), "albert-repo-"));
    try {
      const git = (args: string[]) => {
        const result = runCommand(["git", "-C", folder, ...args]);
        if (result.exitCode) {
          throw new Error(result.stderr.trim() || `git ${args.join(" ")} failed`);
        }
      };
      git(["init", "-b", "main", "-q"]);
      git(["commit", "--allow-empty", "-m", "chore: initial commit", "-q"]);
      git(["remote", "add", "origin", `git@github.com:${repo}.git`]);
      git(["push", "origin", "main", "-q"]);
      console.log("    'main' branch created.");
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  }

  console.log("==> Applying branch protection rules to 'main'");
  gh.json({
    endpoint: `repos/${repo}/branches/main/protection`,
    method: "PUT",
    input: JSON.stringify(PROTECTION),
  });
  console.log("    Done.");
  console.log(`\n✓ Repository bootstrap complete: https://github.com/${repo}`);
  return repo;
}

async function main() {
  const repo = Bun.argv[2];
  const description = Bun.argv[3] ?? "";
  if (!repo) {
    console.error("Usage: bun scripts/setup-github-repo.ts <org/repo-name> [description]");
    return 1;
  }
  try {
    setupGithubRepo(repo, description);
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return 1;
  }
}

if (import.meta.main) {
  process.exit(await main());
}
