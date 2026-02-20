/**
 * Runs Foundry tests (generated or manual) in a temp directory and streams output.
 * Used to evaluate how easy it is to break a contract: run malicious/generated tests with forge test.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/** Resolve forge binary so it works when not on process PATH (e.g. Cursor/VS Code). */
function getForgeCommand(): string {
  if (process.env.FORGE_PATH) return process.env.FORGE_PATH;
  const home = os.homedir();
  const defaultPath = path.join(home, '.foundry', 'bin', 'forge');
  if (home && fs.existsSync(defaultPath)) return defaultPath;
  return 'forge';
}

const FOUNDRY_TOML = `[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.28"
evm_version = "cancun"

[fmt]
line_length = 100
`;

export interface SimulateOptions {
  source: string;
  testCode: string;
  contractName: string;
}

export interface StreamChunk {
  chunk: string;
  done?: boolean;
  exitCode?: number;
  error?: string;
}

/**
 * Run a command in cwd; yields each line of stdout/stderr, then yields exit code via done/exitCode.
 */
async function* runCommand(
  cmd: string,
  args: string[],
  cwd: string
): AsyncGenerator<StreamChunk, void, undefined> {
  const queue: StreamChunk[] = [];
  let resolveWait: (() => void) | null = null;
  const waitNext = (): Promise<void> =>
    new Promise((r) => {
      resolveWait = r;
    });

  const push = (chunk: StreamChunk) => {
    queue.push(chunk);
    if (resolveWait) {
      resolveWait();
      resolveWait = null;
    }
  };

  const proc = spawn(cmd, args, { cwd, shell: false });
  let buffer = '';
  const flush = (str: string) => {
    buffer += str;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      push({ chunk: line + '\n' });
    }
  };
  proc.stdout?.on('data', (d) => flush(d.toString()));
  proc.stderr?.on('data', (d) => flush(d.toString()));
  proc.on('error', (err) => {
    push({ chunk: `[prophet] Failed to run ${cmd}: ${err.message}\n`, done: true, exitCode: -1, error: err.message });
  });
  proc.on('close', (code, signal) => {
    if (buffer.length) push({ chunk: buffer + '\n' });
    push({ chunk: '\n', done: true, exitCode: code ?? -1 });
  });

  for (;;) {
    if (queue.length === 0) await waitNext();
    const next = queue.shift();
    if (!next) continue;
    yield next;
    if (next.done) break;
  }
}

/**
 * Write contract and test to a temp Foundry project and run forge build && forge test.
 * Yields each line of stdout/stderr for streaming to the client.
 */
export async function* runFoundryTests(
  options: SimulateOptions
): AsyncGenerator<StreamChunk, void, undefined> {
  const { source, testCode, contractName } = options;
  const tmpDir = path.join(
    os.tmpdir(),
    `prophet-foundry-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );
  const srcDir = path.join(tmpDir, 'src');
  const testDir = path.join(tmpDir, 'test');

  try {
    fs.mkdirSync(srcDir, { recursive: true });
    fs.mkdirSync(testDir, { recursive: true });

    fs.writeFileSync(path.join(tmpDir, 'foundry.toml'), FOUNDRY_TOML);
    fs.writeFileSync(path.join(srcDir, `${contractName}.sol`), source);
    fs.writeFileSync(path.join(testDir, `${contractName}.t.sol`), testCode);

    yield { chunk: `[prophet] Temp project: ${tmpDir}\n` };
    yield { chunk: `[prophet] Installing forge-std...\n` };
    const gitInit = runCommand('git', ['init'], tmpDir);
    for await (const msg of gitInit) {
      yield msg;
    }
    const forgeCmd = getForgeCommand();
    for await (const msg of runCommand(forgeCmd, ['install', 'foundry-rs/forge-std'], tmpDir)) {
      yield msg;
      if (msg.done && msg.exitCode !== 0) {
        yield {
          chunk: `[prophet] forge install failed (exit ${msg.exitCode}). Is Foundry installed and git available?\n`,
          done: true,
          exitCode: msg.exitCode,
        };
        return;
      }
    }
    yield { chunk: `[prophet] Running forge build...\n` };

    for await (const msg of runCommand(forgeCmd, ['build'], tmpDir)) {
      yield msg;
      if (msg.done && msg.exitCode !== 0) {
        yield { chunk: `[prophet] forge build failed (exit ${msg.exitCode})\n`, done: true, exitCode: msg.exitCode };
        return;
      }
    }

    yield { chunk: `[prophet] Running forge test...\n` };
    for await (const msg of runCommand(forgeCmd, ['test'], tmpDir)) {
      yield msg;
    }
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}
