"use client"

import { FileCode2, AlertTriangle } from "lucide-react"

const VULNERABILITY_LINE = 24

const solidityCode = [
  '// SPDX-License-Identifier: MIT',
  'pragma solidity ^0.8.20;',
  '',
  'import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";',
  'import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";',
  'import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";',
  'import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";',
  '',
  'contract VulnerableVault is ERC4626 {',
  '    using SafeERC20 for IERC20;',
  '',
  '    mapping(address => uint256) public lastDeposit;',
  '    uint256 public totalBorrowed;',
  '    uint256 public constant LOCK_PERIOD = 1 days;',
  '',
  '    constructor(',
  '        IERC20 asset_',
  '    ) ERC4626(asset_) ERC20("Vault Token", "vTKN") {}',
  '',
  '    /// @notice Preview the amount of assets for redeeming shares',
  '    /// @dev VULNERABLE: Read-only reentrancy via external call',
  '    function previewRedeem(uint256 shares) public view override returns (uint256) {',
  '        uint256 totalAssets_ = IERC20(asset()).balanceOf(address(this));',
  '        // Attacker can manipulate balanceOf during callback',
  '        uint256 supply = totalSupply();',
  '        return shares * totalAssets_ / supply;',
  '    }',
  '',
  '    /// @notice Deposit assets into the vault',
  '    function deposit(',
  '        uint256 assets,',
  '        address receiver',
  '    ) public override returns (uint256) {',
  '        lastDeposit[receiver] = block.timestamp;',
  '        return super.deposit(assets, receiver);',
  '    }',
  '',
  '    /// @notice Withdraw assets from the vault',
  '    function withdraw(',
  '        uint256 assets,',
  '        address receiver,',
  '        address owner',
  '    ) public override returns (uint256) {',
  '        require(',
  '            block.timestamp >= lastDeposit[owner] + LOCK_PERIOD,',
  '            "VulnerableVault: locked"',
  '        );',
  '        return super.withdraw(assets, receiver, owner);',
  '    }',
  '',
  '    /// @notice Returns total assets managed by vault',
  '    function totalAssets() public view override returns (uint256) {',
  '        return IERC20(asset()).balanceOf(address(this)) - totalBorrowed;',
  '    }',
  '}',
]

function tokenize(line: string) {
  const tokens: { text: string; className: string }[] = []
  const patterns: [RegExp, string][] = [
    [/^(\/\/.*)/, "text-muted-foreground italic"],
    [/^(\/\/\/.*)/, "text-neon-green/50 italic"],
    [/^("(?:[^"\\]|\\.)*")/, "text-neon-amber"],
    [/^(\b(?:pragma|solidity|import|contract|is|using|for|function|public|view|override|returns|return|require|mapping|address|uint256|constant|constructor)\b)/, "text-neon-green"],
    [/^(\b(?:IERC20|ERC4626|ERC20|SafeERC20|IERC20|VulnerableVault)\b)/, "text-[#00b0ff]"],
    [/^(\b(?:true|false)\b)/, "text-neon-amber"],
    [/^(\b\d+\b)/, "text-neon-amber"],
    [/^(@\w+(?:\/[^\s;]+)?)/, "text-[#00b0ff]"],
    [/^(\b(?:memory|calldata|storage|external|internal|private|virtual|pure)\b)/, "text-neon-green/70"],
  ]

  let remaining = line
  while (remaining.length > 0) {
    let matched = false
    for (const [pattern, className] of patterns) {
      const match = remaining.match(pattern)
      if (match) {
        tokens.push({ text: match[1], className })
        remaining = remaining.slice(match[1].length)
        matched = true
        break
      }
    }
    if (!matched) {
      const nextSpecial = remaining.slice(1).search(/[/"@a-zA-Z0-9]/)
      if (nextSpecial === -1) {
        tokens.push({ text: remaining, className: "text-foreground" })
        remaining = ""
      } else {
        tokens.push({ text: remaining.slice(0, nextSpecial + 1), className: "text-foreground" })
        remaining = remaining.slice(nextSpecial + 1)
      }
    }
  }
  return tokens
}

export function CodeEditor() {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-[#0d0d0d]" aria-label="Smart contract code editor">
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-2">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-3 rounded-full bg-neon-red/80" />
          <span className="size-3 rounded-full bg-neon-amber/80" />
          <span className="size-3 rounded-full bg-neon-green/80" />
        </div>
        <div className="flex items-center gap-1.5 ml-3">
          <FileCode2 className="size-3.5 text-muted-foreground" aria-hidden="true" />
          <span className="text-xs text-muted-foreground font-mono">VulnerableVault.sol</span>
        </div>
      </div>

      {/* Code area */}
      <div className="flex-1 overflow-auto p-0" role="code" aria-label="Solidity smart contract source code">
        <pre className="text-[13px] leading-6 font-mono">
          {solidityCode.map((line, i) => {
            const lineNum = i + 1
            const isVulnerable = lineNum === VULNERABILITY_LINE
            const tokens = tokenize(line)

            return (
              <div
                key={lineNum}
                className={`flex ${
                  isVulnerable
                    ? "bg-neon-red/10 border-l-2 border-neon-red"
                    : "border-l-2 border-transparent hover:bg-secondary/30"
                }`}
              >
                <span
                  className={`inline-block w-12 shrink-0 select-none pr-4 text-right text-xs leading-6 ${
                    isVulnerable ? "text-neon-red" : "text-muted-foreground/50"
                  }`}
                  aria-hidden="true"
                >
                  {lineNum}
                </span>
                <span className="flex-1 pr-4">
                  {isVulnerable && (
                    <AlertTriangle className="inline-block size-3.5 text-neon-red mr-1 -mt-0.5" aria-label="Vulnerability detected on this line" />
                  )}
                  {tokens.map((token, j) => (
                    <span key={j} className={token.className}>{token.text}</span>
                  ))}
                </span>
              </div>
            )
          })}
        </pre>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-border bg-secondary/50 px-4 py-1 text-[11px] text-muted-foreground font-mono">
        <div className="flex items-center gap-3">
          <span>Solidity</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <AlertTriangle className="size-3 text-neon-red" aria-hidden="true" />
            <span className="text-neon-red">1 vulnerability</span>
          </span>
          <span>Ln 24, Col 1</span>
        </div>
      </div>
    </section>
  )
}
