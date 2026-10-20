#!/usr/bin/env bun
/** Check GitHub Actions pinning and runner policy. */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

export const REQUIRED_UBUNTU_RUNNER = "ubuntu-24.04";

export type PolicyError = { file: string; message: string };

function workflowFiles(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }
  const found: string[] = [];
  const stack = [directory];
  while (stack.length) {
    const current = stack.pop()!;
    for (const entry of readdirSync(current)) {
      const path = join(current, entry);
      if (statSync(path).isDirectory()) {
        stack.push(path);
      } else if (/\.ya?ml$/.test(entry)) {
        found.push(path);
      }
    }
  }
  return found.sort();
}

export function checkWorkflowText(text: string, file: string): PolicyError[] {
  const errors: PolicyError[] = [];
  for (const match of text.matchAll(/^[ \t]*runs-on:[ \t]*(ubuntu-(latest|[0-9]+\.[0-9]+))[ \t]*(#.*)?$/gm)) {
    if (match[1] !== REQUIRED_UBUNTU_RUNNER) {
      errors.push({ file, message: `${file} must use ${REQUIRED_UBUNTU_RUNNER} instead of ${match[1]}` });
    }
  }
  for (const match of text.matchAll(/^[ \t]*-?[ \t]*uses:[ \t]*([^ \t#]+)/gm)) {
    let reference = match[1].trim();
    if (reference.startsWith("./")) {
      continue;
    }
    if (reference.startsWith("docker://")) {
      errors.push({ file, message: `${file} must pin container actions by digest: ${reference}` });
      continue;
    }
    if (!/^[^@]+@[0-9a-f]{40}$/.test(reference)) {
      errors.push({ file, message: `${file} has an action that is not pinned to a commit SHA: ${reference}` });
    }
  }
  return errors;
}

export function checkRuntimePins(root: string, workflows: string[]): PolicyError[] {
  const errors: PolicyError[] = [];
  const joined = workflows.map((file) => readFileSync(file, "utf8")).join("\n");
  if (/uses:\s*actions\/setup-node@/.test(joined)) {
    if (!existsSync(join(root, ".node-version"))) {
      errors.push({ file: root, message: `${root} uses actions/setup-node but has no .node-version` });
    }
    if (!/node-version-file:\s*\.node-version/.test(joined)) {
      errors.push({ file: root, message: `${root} must configure actions/setup-node with node-version-file: .node-version` });
    }
    if (/^[ \t]*node-version:[ \t]*[^ \t#]/m.test(joined)) {
      errors.push({ file: root, message: `${root} must not hard-code node-version in workflows; use .node-version` });
    }
  }
  if (/uses:\s*oven-sh\/setup-bun@/.test(joined)) {
    if (!existsSync(join(root, ".bun-version"))) {
      errors.push({ file: root, message: `${root} uses oven-sh/setup-bun but has no .bun-version` });
    }
    if (!/bun-version-file:\s*\.bun-version/.test(joined)) {
      errors.push({ file: root, message: `${root} must configure oven-sh/setup-bun with bun-version-file: .bun-version` });
    }
    if (/^[ \t]*bun-version:[ \t]*[^ \t#]/m.test(joined)) {
      errors.push({ file: root, message: `${root} must not hard-code bun-version in workflows; use .bun-version` });
    }
  }
  return errors;
}

export function validateWorkflowPolicy(root: string): PolicyError[] {
  const workflowDir = join(root, ".github/workflows");
  if (!existsSync(workflowDir)) {
    return [];
  }
  const files = workflowFiles(workflowDir);
  const errors = files.flatMap((file) => checkWorkflowText(readFileSync(file, "utf8"), file));
  return [...errors, ...checkRuntimePins(root, files)];
}

async function main() {
  const root = resolve(Bun.argv[2] ?? ".");
  const errors = validateWorkflowPolicy(root);
  if (errors.length) {
    for (const error of errors) {
      console.error(`ERROR: ${error.message}`);
    }
    return 1;
  }
  console.log(`Workflow policy passed: ${root}`);
  return 0;
}

if (import.meta.main) {
  process.exit(await main());
}
