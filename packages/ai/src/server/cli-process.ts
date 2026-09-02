import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

export interface CliProcessOptions {
  executable: string;
  args: readonly string[];
  stdin?: string;
  environment?: Record<string, string | undefined>;
  timeoutMs?: number;
  maxOutputBytes?: number;
  retries?: number;
  allowNonZeroExit?: boolean;
  onWorkingDirectory?: (directory: string) => void;
}

export interface CliProcessResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class CliProcessError extends Error {
  readonly code: "TIMEOUT" | "OUTPUT_LIMIT" | "LAUNCH_FAILED" | "NON_ZERO_EXIT";
  constructor(code: "TIMEOUT" | "OUTPUT_LIMIT" | "LAUNCH_FAILED" | "NON_ZERO_EXIT", message: string) {
    super(message);
    this.name = "CliProcessError";
    this.code = code;
  }
}

const defaultTimeoutMs = parsePositiveInteger(process.env.CLI_RUNTIME_TIMEOUT_MS, 60_000);
const defaultMaxOutputBytes = parsePositiveInteger(process.env.CLI_MAX_OUTPUT_BYTES, 1_048_576);
const maxConcurrency = parsePositiveInteger(process.env.CLI_MAX_CONCURRENCY, 2);
let activeProcesses = 0;
const waiters: (() => void)[] = [];

export async function runCliProcess(options: CliProcessOptions): Promise<CliProcessResult> {
  const retries = Math.min(Math.max(options.retries ?? 0, 0), 2);
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await runOnce(options);
    } catch (error) {
      lastError = error;
      if (attempt === retries) throw error;
    }
  }
  throw lastError;
}

export function filteredEnvironment(extra: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  const environment = Object.create(null) as NodeJS.ProcessEnv;
  for (const key of ["LANG", "LC_ALL", "LC_CTYPE", "PATH", "TZ"]) {
    if (process.env[key]) environment[key] = process.env[key];
  }
  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined) environment[key] = value;
  }
  return environment;
}

async function runOnce(options: CliProcessOptions): Promise<CliProcessResult> {
  await acquireSlot();
  const directory = await mkdtemp(join(tmpdir(), "korean-learning-cli-"));
  options.onWorkingDirectory?.(directory);
  try {
    return await spawnBounded({ ...options, cwd: directory });
  } finally {
    await rm(directory, { recursive: true, force: true });
    releaseSlot();
  }
}

function spawnBounded(options: CliProcessOptions & { cwd: string }): Promise<CliProcessResult> {
  const limit = options.maxOutputBytes ?? defaultMaxOutputBytes;
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
  return new Promise((resolvePromise, reject) => {
    let settled = false;
    let stdout = "";
    let stderr = "";
    let bytes = 0;
    let timedOut = false;
    let outputExceeded = false;
    let child;
    try {
      child = spawn(options.executable, [...options.args], {
        cwd: options.cwd,
        env: filteredEnvironment(options.environment),
        shell: false,
        stdio: ["pipe", "pipe", "pipe"]
      });
    } catch {
      reject(new CliProcessError("LAUNCH_FAILED", "The local AI provider could not be started."));
      return;
    }
    const settle = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      callback();
    };
    const append = (stream: "stdout" | "stderr", chunk: Buffer) => {
      bytes += chunk.byteLength;
      if (bytes > limit) {
        outputExceeded = true;
        child.kill("SIGKILL");
        return;
      }
      if (stream === "stdout") stdout += chunk.toString("utf8");
      else stderr += chunk.toString("utf8");
    };
    child.stdout.on("data", (chunk: Buffer) => append("stdout", chunk));
    child.stderr.on("data", (chunk: Buffer) => append("stderr", chunk));
    child.on("error", () => settle(() => reject(new CliProcessError("LAUNCH_FAILED", "The local AI provider could not be started."))));
    child.on("close", (code) => settle(() => {
      if (timedOut) return reject(new CliProcessError("TIMEOUT", "The local AI provider timed out."));
      if (outputExceeded) return reject(new CliProcessError("OUTPUT_LIMIT", "The local AI provider returned too much output."));
      if (code !== 0 && !options.allowNonZeroExit) {
        return reject(new CliProcessError("NON_ZERO_EXIT", "The local AI provider exited unexpectedly."));
      }
      resolvePromise({ stdout, stderr, exitCode: code ?? -1 });
    }));
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);
    if (options.stdin) child.stdin.end(options.stdin);
    else child.stdin.end();
  });
}

async function acquireSlot(): Promise<void> {
  if (activeProcesses < maxConcurrency) {
    activeProcesses += 1;
    return;
  }
  await new Promise<void>((resolvePromise) => waiters.push(resolvePromise));
  activeProcesses += 1;
}

function releaseSlot(): void {
  activeProcesses -= 1;
  waiters.shift()?.();
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
