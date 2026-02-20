/**
 * Attack Generator: Uses 0G AI to generate Foundry invariant tests.
 * Can use raw source only or analysis report (vulnerabilities + exploit_paths) for targeted malicious tests.
 */
import type { ProphetReport } from '../types/report.js';
import { call0GAI, is0GAvailable } from './0gService.js';

const SINGLE_FILE_STRUCTURE = `Structure (all in ONE file, in this order):

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

/* ============================================================
                        TARGET CONTRACT
   ============================================================ */

import "../src/<ContractName>.sol";

/* ============================================================
                     ATTACKER / HELPER CONTRACTS
   ============================================================ */

// Interfaces, ReentrantAttacker-style contracts, etc.

/* ============================================================
                          TEST SUITE
   ============================================================ */

contract <ContractName>Test is Test {
    // setUp(), test*() functions using vm.prank, vm.deal, assertEq, etc.
}`;

const ATTACK_SYSTEM_PROMPT = `You are an elite white-hat smart contract security researcher. Your task is to analyze Solidity contracts and write Foundry tests designed to break their core logic.

You must return ONLY valid Solidity code in a SINGLE file. Use this exact structure:
${SINGLE_FILE_STRUCTURE}

Rules:
1. Put the target contract import under "TARGET CONTRACT", attacker/helper contracts (interfaces, reentrancy attackers, etc.) under "ATTACKER / HELPER CONTRACTS", and the test contract under "TEST SUITE".
2. Use Foundry's Test.sol: vm.prank, vm.deal, assertEq, assertTrue, assertLt, etc.
3. No markdown, no code fences, no explanations. Start with "// SPDX-License-Identifier: MIT".`;

const TARGETED_ATTACK_SYSTEM_PROMPT = `You are an elite white-hat smart contract security researcher. You are given a security audit report with specific vulnerabilities and exploit paths. Your task is to write a Foundry test file that attempts to exploit those findings.

You must return ONLY valid Solidity code in a SINGLE file. Use this exact structure:
${SINGLE_FILE_STRUCTURE}

Rules:
1. Replace <ContractName> with the actual contract name from the report.
2. Put the target import under "TARGET CONTRACT", any attacker/helper contracts (e.g. ReentrantAttacker, interfaces) under "ATTACKER / HELPER CONTRACTS", and the main test contract (extending Test) under "TEST SUITE".
3. Target the reported vulnerabilities; use vm.prank, vm.deal, assertEq, assertTrue, assertLt as needed.
4. No markdown, no code fences. Start with "// SPDX-License-Identifier: MIT".`;

/**
 * Generate a Foundry invariant test contract to attack the given Solidity code.
 * @param contractSource - The Solidity contract source code to attack
 * @returns Foundry test contract source code
 */
export async function generateAttack(contractSource: string): Promise<string> {
  const prompt = `Analyze this Solidity contract and write a complete Foundry test file designed to break its core logic:

\`\`\`solidity
${contractSource}
\`\`\`

Output a SINGLE Solidity file with:
1. SPDX + pragma ^0.8.20 and import "forge-std/Test.sol"
2. A "TARGET CONTRACT" section with import "../src/<ContractName>.sol"
3. An "ATTACKER / HELPER CONTRACTS" section (interfaces, attacker contracts like reentrancy helpers)
4. A "TEST SUITE" section: one contract <ContractName>Test is Test { setUp(); test*(); }

Use the exact comment headers shown in the system prompt. Return ONLY the Solidity code, no markdown.`;

  if (!is0GAvailable()) {
    return generateMockAttackTest(contractSource);
  }

  try {
    const testCode = await call0GAI(prompt, ATTACK_SYSTEM_PROMPT);
    return extractSolidityCode(testCode);
  } catch (e) {
    console.error('[AttackGenerator] Failed to generate attack:', e);
    return generateMockAttackTest(contractSource);
  }
}

/**
 * Generate Foundry attack tests using the audit report so tests target specific vulnerabilities and exploit paths.
 * This makes the generated tests "malicious" in the sense they try to break the contract along the reported vectors.
 *
 * @param contractSource - The Solidity contract source
 * @param report - ProphetReport from analyze() (vulnerabilities, exploit_paths)
 * @returns Foundry test contract source code
 */
export async function generateAttackFromReport(
  contractSource: string,
  report: ProphetReport
): Promise<string> {
  const vulnSummary =
    report.vulnerabilities.length > 0
      ? report.vulnerabilities
          .map((v) => {
            const locs = v.locations.map((l) => `${l.function} L${l.line_start}`).join(', ');
            return `- [${v.severity}] ${v.title}${locs ? ` (${locs})` : ''}: ${v.explanation}`;
          })
          .join('\n')
      : 'None listed.';
  const exploitSummary =
    report.exploit_paths.length > 0
      ? report.exploit_paths
          .map(
            (ep) =>
              `- ${ep.name}: ${ep.success_criteria}\n  Steps: ${ep.steps.map((s) => s.action).join(' -> ')}`
          )
          .join('\n')
      : 'None listed.';

  const prompt = `Target contract (analyzed):

\`\`\`solidity
${contractSource}
\`\`\`

Audit findings to target:
Vulnerabilities:
${vulnSummary}

Exploit paths:
${exploitSummary}

Write ONE Solidity file that exploits these findings. Use contract name "${report.contract_name}" and import from "../src/${report.contract_name}.sol".

Structure (required):
1. SPDX + pragma ^0.8.20 + import "forge-std/Test.sol"
2. Section "TARGET CONTRACT" with: import "../src/${report.contract_name}.sol";
3. Section "ATTACKER / HELPER CONTRACTS" with interfaces and attacker contracts (e.g. ReentrantAttacker)
4. Section "TEST SUITE" with: contract ${report.contract_name}Test is Test { setUp(); test*(); }

Use the exact comment block headers (e.g. /* ===== TARGET CONTRACT ===== */). Return ONLY the Solidity code, no markdown.`;

  if (!is0GAvailable()) {
    return generateMockAttackTest(contractSource, report.contract_name);
  }

  try {
    const testCode = await call0GAI(prompt, TARGETED_ATTACK_SYSTEM_PROMPT);
    return extractSolidityCode(testCode);
  } catch (e) {
    console.error('[AttackGenerator] Failed to generate attack from report:', e);
    return generateMockAttackTest(contractSource, report.contract_name);
  }
}

/**
 * Extract Solidity code from AI response (removes markdown, code fences, etc.)
 */
function extractSolidityCode(response: string): string {
  // Remove markdown code fences
  let code = response.replace(/```solidity?\n?/g, '').replace(/```\n?/g, '');
  
  // Remove leading/trailing whitespace
  code = code.trim();
  
  // If it starts with "pragma" or "// SPDX", it's likely valid Solidity
  if (code.startsWith('pragma') || code.startsWith('// SPDX')) {
    return code;
  }
  
  // Try to find Solidity code block
  const match = code.match(/(pragma solidity[\s\S]*)/);
  if (match) {
    return match[1].trim();
  }
  
  return code;
}

/**
 * Generate a mock Foundry test for development (when 0G unavailable).
 * Uses the same single-file structure: target, attacker/helpers, test suite.
 */
function generateMockAttackTest(
  contractSource: string,
  contractNameOverride?: string
): string {
  const contractName =
    contractNameOverride ??
    (contractSource.match(/contract\s+(\w+)/)?.[1] ?? 'Target');

  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

/* ============================================================
                        TARGET CONTRACT
   ============================================================ */

import "../src/${contractName}.sol";

/* ============================================================
                     ATTACKER / HELPER CONTRACTS
   ============================================================ */

// Add interfaces and attacker contracts here when targeting specific vulns

/* ============================================================
                          TEST SUITE
   ============================================================ */

contract ${contractName}Test is Test {
    ${contractName} public target;

    function setUp() public {
        target = new ${contractName}();
    }

    function testPlaceholder() public view {
        assertEq(address(target) != address(0), true);
    }
}`;
}
