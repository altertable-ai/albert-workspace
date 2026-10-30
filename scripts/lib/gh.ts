export type GhRequest = {
  endpoint: string;
  method?: string;
  fields?: Record<string, string>;
  paginate?: boolean;
  input?: string;
};

export class GhError extends Error {
  constructor(
    readonly request: GhRequest,
    readonly stderr: string,
    readonly exitCode: number,
  ) {
    super(`GitHub request failed (${request.endpoint}): ${stderr || `exit ${exitCode}`}`);
  }
}

export function runCommand(
  command: string[],
  options: { input?: string } = {},
): { exitCode: number; stdout: string; stderr: string } {
  const result = Bun.spawnSync(command, {
    stdout: "pipe",
    stderr: "pipe",
    stdin: options.input != null ? Buffer.from(options.input) : undefined,
  });
  return {
    exitCode: result.exitCode ?? 1,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}

export const gh = {
  json(request: GhRequest): unknown {
    const command = ["gh", "api", "--method", request.method ?? "GET"];
    if (request.paginate) {
      // Emit each page as one JSON line; older gh versions lack --slurp.
      command.push("--paginate", "--jq", "tojson");
    }
    command.push(request.endpoint);
    for (const [key, value] of Object.entries(request.fields ?? {})) {
      command.push("-f", `${key}=${value}`);
    }
    if (request.input != null) {
      command.push("--input", "-");
    }
    const result = runCommand(command, { input: request.input });
    if (result.exitCode) {
      throw new GhError(request, result.stderr.trim(), result.exitCode);
    }
    const text = result.stdout.trim();
    if (request.paginate) {
      return text ? text.split(/\r?\n/).map((page) => JSON.parse(page)) : [];
    }
    return text ? JSON.parse(text) : null;
  },
};

export function pagesOf<T>(value: unknown): T[] {
  if (!Array.isArray(value)) {
    return [];
  }
  if (value.length > 0 && Array.isArray(value[0])) {
    return (value as T[][]).flat();
  }
  return value as T[];
}
