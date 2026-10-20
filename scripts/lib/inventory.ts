import { readFileSync } from "node:fs";

export type RepoEntry = { repo: string; kind?: string };

export type Inventory = {
  repos: string[];
  specRepos: string[];
};

export function loadInventory(configPath: string): Inventory {
  const config = JSON.parse(readFileSync(configPath, "utf8")) as {
    workspace?: RepoEntry;
    sdks?: RepoEntry[];
    projects?: RepoEntry[];
  };
  const sdks = config.sdks ?? [];
  const projects = config.projects ?? [];
  const repos = [
    ...new Set(
      [config.workspace?.repo, ...sdks.map((entry) => entry.repo), ...projects.map((entry) => entry.repo)].filter(
        (repo): repo is string => Boolean(repo),
      ),
    ),
  ];
  const specRepos = sdks
    .filter((entry) => entry.kind === "lakehouse" || entry.kind === "product-analytics")
    .map((entry) => entry.repo);
  return { repos, specRepos };
}
