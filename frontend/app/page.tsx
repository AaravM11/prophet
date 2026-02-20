import { Shield } from "lucide-react"
import { PipelineStepper } from "@/components/pipeline-stepper"
import { CodeEditor } from "@/components/code-editor"
import { VulnerabilityReport } from "@/components/vulnerability-report"
import { FuzzingTerminal } from "@/components/fuzzing-terminal"

export default function Page() {
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-neon-green/10 border border-neon-green/20">
            <Shield className="size-4 text-neon-green" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-foreground">
              Web3 Security Guardian
            </h1>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
              Smart Contract Audit Pipeline
            </p>
          </div>
        </div>

        <PipelineStepper />

        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span className="size-2 rounded-full bg-neon-green animate-pulse" aria-hidden="true" />
          <span>Network: Ethereum Mainnet</span>
        </div>
      </header>

      {/* Main Content - 3-Pane Layout */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left Pane: Code Editor */}
        <div className="w-[52%] border-r border-border p-3">
          <CodeEditor />
        </div>

        {/* Right Pane: Split Top/Bottom */}
        <div className="flex flex-1 flex-col">
          {/* Top Right: AI Vulnerability Report */}
          <div className="flex-1 overflow-hidden border-b border-border p-3">
            <VulnerabilityReport />
          </div>

          {/* Bottom Right: Fuzzing Terminal */}
          <div className="h-[45%] p-3">
            <FuzzingTerminal />
          </div>
        </div>
      </main>
    </div>
  )
}
