# Prophet — What We’ve Done Well & What’s Left

Based on `context.md`, the README, and the current codebase.

---

## What we’ve done well

### 1. **0G integration (agent)**
- **0G Compute SDK** wired with `@0glabs/0g-serving-broker` (CJS for Node 23).
- **Single 0G service** (`agent/src/services/0gService.ts`): broker init, provider listing, **transfer-fund before acknowledge** (so sub-account is funded), then inference and JSON extraction.
- **Mainnet vs testnet**: `0G_RPC_URL` in root `.env` switches between `https://evmrpc.0g.ai` (mainnet) and `https://evmrpc-testnet.0g.ai` (testnet).
- **Graceful fallback**: If 0G fails or no key, analyzer returns a stub report with `inference_backend: 'local'`; attack/patch generators return mock Solidity.

### 2. **Agent API surface**
- **HTTP server** on port 3001 with CORS:
  - `GET /health`
  - `POST /analyze` → ProphetReport (0G or stub)
  - `POST /generate-attack` → Foundry invariant test code (0G or mock)
  - `POST /generate-patch` → patched Solidity from original + crash trace (0G or mock)
- **Structured report**: `ProphetReport` in `agent/src/types/report.ts` matches README schema (risk_score, risk_level, vulnerabilities, exploit_paths, fix_suggestions, meta with `inference_backend`).

### 3. **Analyzer flow**
- Hash + contract name extraction, 0G prompt for JSON report, regex extraction of JSON from response, mapping into `ProphetReport` with safe defaults.

### 4. **Attack & patch generators**
- **attackGenerator**: Prompt for “elite white-hat” Foundry invariant tests; `extractSolidityCode()` to strip markdown; mock returns a minimal invariant test skeleton.
- **patchGenerator**: Prompt for remediation from original code + crash trace; same extraction; mock returns original + comment.

### 5. **Docs and ops**
- **SETUP.md**: Two 0G balances (Ethereum vs OG Mainnet), testnet faucet, CLI deposit + **transfer-fund** to provider, mainnet bridge (hub.0g.ai), troubleshooting (InsufficientAvailableBalance, etc.).
- **TESTING.md**: How to run agent and hit endpoints.
- **.env.example**: 0G_RPC_URL and RPC_URL_SEPOLIA documented.

### 6. **Frontend skeleton**
- **Landing** (`app/page.tsx`): Clear value prop, “Launch” → `/analyze`.
- **Analyze pipeline** (`app/analyze/page.tsx`): 3-pane layout — CodeEditor, VulnerabilityReport, FuzzingTerminal; PipelineStepper.
- **Zustand store** (`usePipelineStore`): Steps 1–4, original/patched code, vulnerabilities/exploitPaths/fixSuggestions, risk score/level, summary, terminal logs, isScanning/isFuzzing, actions (setCode, startAnalysis, updateReport, addTerminalLog, startFuzzing, etc.).
- **CodeEditor**: Solidity validation, upload .sol, syntax-style tokenization, vulnerable line highlighting (from store), “Run analysis” button (currently only updates store, does not call agent).
- **VulnerabilityReport**: Risk card, vulnerability list, exploit paths, fix suggestions — all read from store; UI supports the full report shape.
- **FuzzingTerminal**: Renders `terminalLogs`, “Live” when `isFuzzing`; `useSimulation` hook calls `POST /simulate` (not implemented on agent yet).

### 7. **Monorepo**
- `frontend/` (Next.js/Vite?), `agent/` (Node + tsx), `contracts/` (Foundry); root package.json; agent loads root `.env`.

---

## What’s left to do (high level)

### Phase 1 (context) — Frontend state & UI
- [x] Next.js + Tailwind + Shadcn (largely done).
- [x] Zustand store with pipeline state, code, report, terminal (done).
- [x] PipelineStepper, CodeEditor, “HackerDashboard” (VulnerabilityReport), TerminalSim (FuzzingTerminal) (done).
- [ ] **Wire “Run analysis” to agent**: CodeEditor’s `handleRunAnalysis` should `fetch(POST /analyze, { source })` and call `updateReport()` with the response (and map agent’s snake_case to store if needed).

### Phase 2 (context) — 0G agentic brains
- [x] 0G SDK and attack/patch APIs (done).
- [ ] Optional: Stronger prompt engineering and output validation (e.g. Zod) for attack and patch so generated Solidity is more often compilable and on-target.

### Phase 3 (context) — Foundry fuzzing engine
- [ ] **Backend fuzz orchestration**: New agent endpoint (e.g. `POST /fuzz` or `POST /simulate`) that:
  - Accepts contract source + optional AI-generated test (or calls `generate-attack` internally).
  - Writes contract + test into `contracts/` (or a temp Foundry project).
  - Runs `forge test --invariant -vvvv` via `child_process` (or similar).
  - Streams stdout to the client (SSE or chunked response).
  - On failure: captures crash trace, calls `generate-patch`, returns trace + patched code (and optionally re-runs in a loop).
- [ ] **Frontend**: Point `useSimulation` at this endpoint (e.g. `/fuzz` or `/simulate`) and optionally trigger “generate attack → fuzz → on break, generate patch → show patch / re-run” from the UI.

### Phase 4 (context) — Web3 deployment
- [ ] RainbowKit + wagmi (or existing Web3 stack) in a provider.
- [ ] When store marks contract as “Secured” (e.g. fuzzer passed), unlock a Deploy button.
- [ ] Deploy patched bytecode to testnet (and later mainnet with clear guardrails) via wallet.

### Cross-cutting
- [ ] **Report shape**: Agent returns vulnerabilities with e.g. `type`/`description`; frontend/store expect `id`/`title`/`explanation` and possibly `locations`. Normalize in the API or in the frontend when calling `updateReport()`.
- [ ] **Source hash**: Use a real hash (e.g. crypto.createHash('sha256')) in the agent instead of the current simple numeric hash for `source_hash`.
- [ ] **SARIF / export**: README mentions SARIF; add optional export of the report for CI/dashboards.
- [ ] **E2E demo**: One-button path: paste contract → analyze → (optional) generate attack → fuzz → if break, patch → re-fuzz until secured.

---

## Summary

- **Strong**: 0G integration (mainnet/testnet, transfer-fund, fallbacks), agent API (/analyze, /generate-attack, /generate-patch), report schema, SETUP/TESTING docs, and the full frontend pipeline UI and state.
- **Next**: Connect the analyze page to the agent (“Run analysis” → POST /analyze → updateReport), implement the Foundry fuzz/simulate endpoint and stream it to the terminal, then close the loop (patch on break, re-fuzz) and add Web3 deployment when secured.
