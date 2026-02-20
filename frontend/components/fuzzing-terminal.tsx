"use client"

import { useEffect, useRef, useState } from "react"
import { Terminal, Circle } from "lucide-react"

interface TerminalLine {
  text: string
  type: "info" | "success" | "warning" | "error" | "command" | "header" | "dim"
  delay: number
}

const terminalLines: TerminalLine[] = [
  { text: "$ forge test --match-test testReentrancyExploit -vvvv", type: "command", delay: 0 },
  { text: "", type: "dim", delay: 200 },
  { text: "[*] Compiling project...", type: "dim", delay: 400 },
  { text: "[*] Compiler run successful (5 contracts compiled)", type: "info", delay: 800 },
  { text: "", type: "dim", delay: 900 },
  { text: "Running 1 test for test/VaultExploit.t.sol:VaultExploitTest", type: "header", delay: 1000 },
  { text: "", type: "dim", delay: 1100 },
  { text: "  [SETUP] Deploying VulnerableVault with 2,000,000 USDC...", type: "dim", delay: 1200 },
  { text: "  [SETUP] Vault deployed at 0x5FbDB2315678afecb367f032d93F642f64180aa3", type: "dim", delay: 1500 },
  { text: "  [SETUP] Attacker balance: 0 USDC", type: "dim", delay: 1700 },
  { text: "", type: "dim", delay: 1800 },
  { text: "  [LOG] Step 1: Attacker takes 10,000,000 USDC flash loan from Aave", type: "info", delay: 2000 },
  { text: "  [LOG] Step 2: Depositing into vault to receive shares...", type: "info", delay: 2400 },
  { text: "  [LOG] Step 3: Triggering callback via malicious ERC777 token...", type: "warning", delay: 2800 },
  { text: "  [LOG] Step 4: previewRedeem() called during callback", type: "warning", delay: 3200 },
  { text: "  [LOG]   ├── balanceOf() inflated: 12,000,000 USDC (expected: 2,000,000)", type: "warning", delay: 3500 },
  { text: "  [LOG]   ├── Share price manipulated: 6.0x actual value", type: "warning", delay: 3700 },
  { text: "  [LOG]   └── Excess shares minted to attacker", type: "warning", delay: 3900 },
  { text: "  [LOG] Step 5: Redeeming inflated shares for underlying assets...", type: "info", delay: 4200 },
  { text: "  [LOG] Step 6: Repaying flash loan...", type: "info", delay: 4500 },
  { text: "", type: "dim", delay: 4800 },
  { text: "  ══════════════════════════════════════════════════════════════", type: "error", delay: 5000 },
  { text: "  EXPLOIT SUCCESSFUL: 1,500,000 USDC Drained. Transaction Reverted.", type: "error", delay: 5200 },
  { text: "  ══════════════════════════════════════════════════════════════", type: "error", delay: 5400 },
  { text: "", type: "dim", delay: 5500 },
  { text: "  Attacker profit: +1,500,000 USDC", type: "error", delay: 5700 },
  { text: "  Vault remaining: 500,000 USDC (75% drained)", type: "error", delay: 5900 },
  { text: "", type: "dim", delay: 6000 },
  { text: "Test result: FAILED. 1 test(s) failed, 0 passed", type: "error", delay: 6200 },
]

const typeColorMap: Record<TerminalLine["type"], string> = {
  command: "text-neon-green",
  info: "text-foreground",
  success: "text-neon-green",
  warning: "text-neon-amber",
  error: "text-neon-red font-semibold",
  header: "text-foreground font-semibold",
  dim: "text-muted-foreground",
}

export function FuzzingTerminal() {
  const [visibleLines, setVisibleLines] = useState<number>(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = []

    terminalLines.forEach((line, index) => {
      const timeout = setTimeout(() => {
        setVisibleLines(index + 1)
      }, line.delay)
      timeouts.push(timeout)
    })

    return () => timeouts.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [visibleLines])

  return (
    <section
      className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-[#0d0d0d]"
      aria-label="Foundry fuzzing terminal output"
    >
      {/* Terminal header */}
      <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-2">
        <Terminal className="size-3.5 text-neon-red" aria-hidden="true" />
        <span className="text-xs text-muted-foreground font-mono">Foundry Fuzzing Console</span>
        <div className="ml-auto flex items-center gap-1.5">
          <Circle className="size-2 fill-neon-red text-neon-red animate-pulse" aria-hidden="true" />
          <span className="text-[10px] text-neon-red font-mono uppercase tracking-wider">Live</span>
        </div>
      </div>

      {/* Terminal body */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 font-mono text-[12px] leading-5">
        {terminalLines.slice(0, visibleLines).map((line, index) => (
          <div key={index} className={typeColorMap[line.type]}>
            {line.text || "\u00A0"}
          </div>
        ))}
        {visibleLines < terminalLines.length && (
          <span className="inline-block w-2 h-4 bg-neon-green animate-pulse" aria-hidden="true" />
        )}
      </div>
    </section>
  )
}
