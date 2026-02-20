import Link from "next/link"
import {
  Shield,
  ArrowRight,
  Sparkles,
  Bug,
  Lock,
  LineChart,
  FileCode2,
  GitBranch,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage(): JSX.Element {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Background Accents */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[480px] w-[780px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,255,65,0.06),rgba(0,0,0,0))] blur-2xl" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[360px] w-[560px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,23,68,0.05),rgba(0,0,0,0))] blur-2xl" />
        <div className="absolute left-[-10%] bottom-[10%] h-[240px] w-[420px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,171,0,0.04),rgba(0,0,0,0))] blur-2xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/70 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg border border-neon-green/20 bg-neon-green/10">
            <Shield className="size-4 text-neon-green" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Prophet</h1>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              AI white-hat for DeFi contracts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="hidden text-sm text-muted-foreground transition hover:text-foreground md:inline">
            Home
          </Link>
          <Link
            href="https://github.com/AaravM11/prophet"
            className="hidden text-sm text-muted-foreground transition hover:text-foreground md:inline"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </Link>
          <Link href="/analyze">
            <Button className="group">
              Launch Analyzer
              <ArrowRight className="ml-2 size-4 transition group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-12 md:pt-20">
        {/* Hero */}
        <section className="grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center">
          {/* Left: copy */}
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-neon-green" aria-hidden="true" />
              AI-powered white-hat agent for Solidity
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
              Find, explain, and fix DeFi contract risks before they ship.
            </h2>
            <p className="mt-4 text-muted-foreground md:text-base">
              Prophet reads your Solidity, flags reentrancy, oracle manipulation, and access
              control issues, simulates realistic exploits, and proposes minimal-diff patches. You
              stay in control: all changes are read-only and reviewable by design.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/analyze">
                <Button size="lg" className="group">
                  Start analysis
                  <ArrowRight className="ml-2 size-4 transition group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="secondary">
                  Explore features
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="ghost" className="border border-border/60">
                  How it works
                </Button>
              </Link>
            </div>
            <div className="mt-6 text-xs font-mono text-muted-foreground">
              Read-only by default • Testnet deploy optional • JSON reports for CI
            </div>
          </div>

          {/* Right: mock analyzer panel */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-neon-green/10 via-transparent to-fuchsia-500/5 blur-xl" />
            <div className="overflow-hidden rounded-3xl border border-border bg-card/80 backdrop-blur">
              <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-2.5 rounded-full bg-neon-green" />
                  <span className="font-mono text-[11px] text-muted-foreground">
                    audit/UniswapVault.sol
                  </span>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-emerald-300">
                  3 critical • 1 high
                </span>
              </div>

              <div className="grid gap-0 border-b border-border/70 bg-background/40 text-xs md:grid-cols-[1.1fr_minmax(0,1fr)]">
                {/* Findings list */}
                <div className="border-r border-border/70 p-4">
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Findings
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 rounded-lg border border-border/70 bg-card/60 p-2">
                      <div className="mt-0.5">
                        <Bug className="size-3.5 text-red-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-300">
                            Critical
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            Reentrancy in withdraw()
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          External call before state update allows draining vault via recursive
                          withdrawals.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2 rounded-lg border border-border/70 bg-card/40 p-2">
                      <div className="mt-0.5">
                        <Lock className="size-3.5 text-amber-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">
                            High
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            Missing onlyOwner guard
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          setOracle() callable by anyone; protocol parameters can be hijacked.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2 rounded-lg border border-border/70 bg-card/30 p-2">
                      <div className="mt-0.5">
                        <LineChart className="size-3.5 text-sky-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-200">
                            Medium
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            Oracle manipulation surface
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Price feed is single source; MeV-style sandwich attacks are realistic.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Patch preview / diff */}
                <div className="flex flex-col border-l border-border/70 bg-black/30 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <GitBranch className="size-3" />
                      <span>Suggested patch</span>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                      Minimal diff
                    </span>
                  </div>
                  <div className="relative flex-1 overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-[#050608] to-[#040b06]">
                    <pre className="max-h-[220px] overflow-auto p-3 text-[11px] leading-relaxed text-muted-foreground">
                      <code>
                        {`- function withdraw(uint256 amount) external {
-   (bool ok,) = msg.sender.call{value: amount}("");
-   require(ok, "TRANSFER_FAILED");
-   balances[msg.sender] -= amount;
- }

+ function withdraw(uint256 amount) external nonReentrant {
+   uint256 bal = balances[msg.sender];
+   require(bal >= amount, "INSUFFICIENT_BALANCE");
+   balances[msg.sender] = bal - amount;
+   (bool ok,) = msg.sender.call{value: amount}("");
+   require(ok, "TRANSFER_FAILED");
+ }`}
                      </code>
                    </pre>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Prophet generates human-readable diffs. You approve, edit, or discard in your
                    normal Git workflow.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mt-16 space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-xl font-semibold tracking-tight md:text-2xl">
                Built for real DeFi audits
              </h3>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Not just “linting with AI.” Prophet learns from known exploits, simulates flows,
                and surfaces issues the compiler and static analyzers miss.
              </p>
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              Supports Solidity &amp; Vyper • Slither-friendly • Hardhat/Foundry ready
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/70 p-4">
              <div className="inline-flex size-8 items-center justify-center rounded-lg border border-neon-green/30 bg-neon-green/10">
                <Bug className="size-4 text-neon-green" />
              </div>
              <h4 className="text-sm font-semibold">Exploit-aware scanning</h4>
              <p className="text-sm text-muted-foreground">
                Detects patterns like reentrancy, flash-loan abuse, oracle games, and role
                escalation by simulating attacker behavior, not just matching signatures.
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/70 p-4">
              <div className="inline-flex size-8 items-center justify-center rounded-lg border border-border/70 bg-background/70">
                <FileCode2 className="size-4 text-sky-300" />
              </div>
              <h4 className="text-sm font-semibold">Explanations your team can ship with</h4>
              <p className="text-sm text-muted-foreground">
                Every finding ships with a plain-English impact summary, exploit walkthrough, and
                references you can drop directly into your audit report.
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/70 p-4">
              <div className="inline-flex size-8 items-center justify-center rounded-lg border border-border/70 bg-background/70">
                <LineChart className="size-4 text-emerald-300" />
              </div>
              <h4 className="text-sm font-semibold">CI-ready JSON artifacts</h4>
              <p className="text-sm text-muted-foreground">
                Export structured reports for GitHub Actions, fail builds on critical issues, and
                track risk over time as contracts evolve.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mt-16">
          <h3 className="text-xl font-semibold tracking-tight md:text-2xl">How Prophet fits in</h3>
          <div className="mt-6 grid gap-4 text-sm md:grid-cols-3">
            <div className="relative rounded-2xl border border-border bg-card/70 p-4">
              <div className="mb-2 inline-flex rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
                Step 1
              </div>
              <p className="font-semibold">Point Prophet at your repo or single contract.</p>
              <p className="mt-2 text-muted-foreground">
                Paste code, upload a file, or connect your Git remote. Prophet works with Hardhat,
                Foundry, or raw Solidity.
              </p>
            </div>
            <div className="relative rounded-2xl border border-border bg-card/70 p-4">
              <div className="mb-2 inline-flex rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
                Step 2
              </div>
              <p className="font-semibold">Review findings and simulated attack paths.</p>
              <p className="mt-2 text-muted-foreground">
                See which functions are abusable, with concrete call sequences and gas-realistic
                traces instead of vague “high risk” labels.
              </p>
            </div>
            <div className="relative rounded-2xl border border-border bg-card/70 p-4">
              <div className="mb-2 inline-flex rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
                Step 3
              </div>
              <p className="font-semibold">Apply minimal-diff patches via your normal workflow.</p>
              <p className="mt-2 text-muted-foreground">
                Prophet suggests diffs; you edit, commit, and merge. No hidden deploy step, no
                opaque “auto-fix” on mainnet.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}