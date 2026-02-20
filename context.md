# Web3 Security Guardian (0G DeFAI Track)

## 📌 Project Overview
A "Safe-to-Mainnet" AI Vault Deployer and Security Guardian. This DeFAI pipeline prevents vulnerable smart contracts from reaching mainnet by acting as an automated, AI-powered white-hat auditor. It analyzes code, proves vulnerabilities via simulated exploits, generates patches, and safely deploys the secured contract.

**Workflow:**
1. **Input Code:** User pastes a DeFi smart contract (e.g., an ERC-4626 Vault).
2. **0G AI Analysis:** Decentralized LLM inference scans for critical flaws (e.g., Reentrancy, Oracle Manipulation).
3. **Foundry Fuzzing:** The backend spins up a local fork, writes a custom exploit, and executes it (proving the vulnerability in a terminal UI).
4. **AI Patch & Re-Simulation:** The AI suggests a fix, updates the code, and re-runs the simulation to prove the exploit now fails.
5. **Safe Deployment:** Unlocks deployment to testnet/mainnet only after the contract passes the simulation.

## 🛠 Tech Stack
* **Frontend:** Next.js (App Router), React, Tailwind CSS, Shadcn UI
* **State Management:** Zustand
* **AI Inference:** 0G Compute Network (using the 0G Compute TypeScript SDK)
* **Backend/Simulation:** Node.js API Routes + Foundry (`forge test`)
* **Web3 Integration:** `wagmi`, `viem`, RainbowKit

---

## 📝 TODO: AI Context & Implementation Plan
*Use the following task list as a step-by-step implementation guide.*

### Phase 1: Frontend State & UI Skeleton
- [ ] **Setup Next.js:** Initialize Next.js with App Router, Tailwind, and Shadcn.
- [ ] **Create Zustand Store (`src/store/usePipelineStore.ts`):** - Manage state for `currentStep` (1-4).
  - Manage contract state: `originalCode`, `patchedCode`.
  - Manage analysis state: `isScanning`, `vulnerabilities` (JSON array), `isFuzzing`, `terminalLogs`.
- [ ] **Build UI Components:**
  - `PipelineStepper`: Top navigation to show progress.
  - `CodeEditorPane`: Use `@monaco-editor/react` for Solidity syntax highlighting.
  - `AnalysisDashboard`: Display 0G AI structured JSON output (Risk Score & Vulnerability list).
  - `TerminalSim`: Use `react-terminal-ui` to simulate the Foundry logs.

### Phase 2: 0G AI Integration
- [ ] **Setup 0G Compute SDK:** Integrate the `@0glabs/0g-compute-typescript-sdk` for decentralized AI queries.
- [ ] **Create Analysis API (`src/app/api/analyze/route.ts`):**
  - Prompt engineer the 0G AI model: "Act as a senior smart contract auditor. Analyze the following Solidity code. Return ONLY a structured JSON with `riskScore`, `vulnerability`, and `patchedCode`."
  - Connect this route to the `Analyze` button on the frontend.

### Phase 3: Foundry Backend Simulation
- [ ] **Create Simulation API (`src/app/api/simulate/route.ts`):**
  - Accept the Solidity string from the frontend.
  - Write it to a temporary `src/Vault.sol` file in a local Foundry directory.
  - Execute `forge test` (or a mock bash script for the hackathon demo) via Node's `child_process.exec`.
  - Stream the standard output (stdout) back to the frontend's terminal UI component.

### Phase 4: Web3 Deployment
- [ ] **Integrate Web3 Providers:** Setup `RainbowKit` and `wagmi` in a `Web3Provider` wrapper.
- [ ] **Create Deployment Flow:** - Once the `zustand` store marks the contract as `safe` (Step 4), unlock the Deploy button.
  - Trigger a wallet transaction using `useWriteContract` to deploy the `patchedCode` bytecode.