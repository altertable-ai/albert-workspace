import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const directory = mkdtempSync(join(tmpdir(), "albert-gh-test-"));
const helper = resolve(import.meta.dir, "../lib/gh.ts");

beforeAll(() => {
  const executable = join(directory, "gh");
  writeFileSync(executable, `#!${process.execPath}
await Bun.write(process.env.GH_TEST_ARGS, JSON.stringify(Bun.argv.slice(2)));
process.stdout.write(process.env.GH_TEST_OUTPUT ?? "");
process.stderr.write(process.env.GH_TEST_ERROR ?? "");
process.exit(Number(process.env.GH_TEST_EXIT ?? 0));
`);
  chmodSync(executable, 0o755);
});

afterAll(() => rmSync(directory, { recursive: true, force: true }));

function request(output: string, paginate = true, error = "", exitCode = 0) {
  const argsFile = join(directory, "args.json");
  const result = Bun.spawnSync([process.execPath, "-e", `
    import { gh } from ${JSON.stringify(helper)};
    console.log(JSON.stringify(gh.json({
      endpoint: "search/issues", paginate: ${paginate}, fields: { per_page: "100" }
    })));
  `], {
    env: {
      ...process.env,
      PATH: `${directory}:${process.env.PATH}`,
      GH_TEST_ARGS: argsFile,
      GH_TEST_OUTPUT: output,
      GH_TEST_ERROR: error,
      GH_TEST_EXIT: String(exitCode),
    },
    stdout: "pipe",
    stderr: "pipe",
  });
  return { result, args: JSON.parse(readFileSync(argsFile, "utf8")) as string[] };
}

describe("gh pagination compatibility", () => {
  test("collects object pages without requiring --slurp", () => {
    const { result, args } = request('{"items":[{"title":"first\\nline"}]}\n{"items":[]}\n');
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout.toString())).toEqual([
      { items: [{ title: "first\nline" }] }, { items: [] },
    ]);
    expect(args).toEqual([
      "api", "--method", "GET", "--paginate", "--jq", "tojson",
      "search/issues", "-f", "per_page=100",
    ]);
  });

  test("preserves array page boundaries", () => {
    const { result } = request('[{"id":1}]\r\n[{"id":2}]\r\n');
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout.toString())).toEqual([[{ id: 1 }], [{ id: 2 }]]);
  });

  test("returns an empty page list for empty paginated output", () => {
    expect(JSON.parse(request("").result.stdout.toString())).toEqual([]);
  });

  test("keeps non-paginated JSON and empty responses unchanged", () => {
    expect(JSON.parse(request('{\n "id": 1\n}', false).result.stdout.toString())).toEqual({ id: 1 });
    expect(JSON.parse(request("", false).result.stdout.toString())).toBeNull();
  });

  test("does not return partial pages when gh fails", () => {
    const { result } = request('[{"id":1}]\n', true, "rate limit exceeded", 1);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.toString()).toContain("rate limit exceeded");
  });
});
