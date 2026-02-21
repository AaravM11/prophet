/**
 * Export report helpers: build Prophet JSON from store and map to SARIF 2.1 for CI/GitHub Code Scanning.
 * Client-side only; no backend required.
 */

import type {
  Vulnerability,
  ExploitPath,
  FixSuggestion,
  Location,
} from "@/src/store/usePipelineStore"

/** Prophet report shape (matches agent schema) for JSON export */
export interface ProphetReportExport {
  contract_name: string
  source_hash: string
  risk_score: number
  risk_level: "critical" | "high" | "medium" | "low"
  summary: string
  vulnerabilities: Array<{
    id: string
    title: string
    severity: string
    confidence: number
    locations: Location[]
    explanation: string
    evidence?: { patterns?: string[]; call_graph?: string[] }
    references?: string[]
  }>
  exploit_paths: Array<{
    name: string
    steps: Array<{
      action: string
      pre_state: Record<string, string>
      post_state: Record<string, string>
      notes: string
    }>
    success_criteria: string
  }>
  fix_suggestions: Array<{
    id: string
    title: string
    strategy: string
    explanation: string
    diff_preview?: string
    tradeoffs?: string
  }>
  meta: {
    generated_at: string
    generator: string
    inference_backend: "0g" | "local"
    version: string
    tier?: "standard" | "premium"
  }
}

export interface StoreReportSlice {
  vulnerabilities: Vulnerability[]
  exploitPaths: ExploitPath[]
  fixSuggestions: FixSuggestion[]
  riskScore: number | null
  riskLevel: "critical" | "high" | "medium" | "low" | null
  summary: string | null
  contractFileName: string
  analyzedContractName: string | null
  analyzedWithPremium?: boolean
}

/**
 * Build the Prophet report payload from the pipeline store (for JSON export or SARIF input).
 */
export function buildProphetReportFromStore(slice: StoreReportSlice): ProphetReportExport {
  const contractName =
    slice.analyzedContractName ?? (slice.contractFileName.replace(/\.sol$/i, "") || "Contract")
  const score = slice.riskScore ?? 0
  const riskScoreNorm = score <= 100 ? score / 100 : 0
  const level = slice.riskLevel ?? "low"

  return {
    contract_name: contractName,
    source_hash: "",
    risk_score: riskScoreNorm,
    risk_level: level,
    summary: slice.summary ?? "Analysis export",
    vulnerabilities: slice.vulnerabilities.map((v) => ({
      id: v.id,
      title: v.title,
      severity: v.severity,
      confidence: v.confidence,
      locations: v.locations,
      explanation: v.explanation,
      evidence: v.evidence,
      references: v.references,
    })),
    exploit_paths: slice.exploitPaths.map((p) => ({
      name: p.name,
      steps: p.steps.map((s) => ({
        action: s.action,
        pre_state: s.pre_state,
        post_state: s.post_state,
        notes: s.notes,
      })),
      success_criteria: p.success_criteria,
    })),
    fix_suggestions: slice.fixSuggestions.map((f) => ({
      id: f.id,
      title: f.title,
      strategy: f.strategy,
      explanation: f.explanation,
      diff_preview: f.diff_preview,
      tradeoffs: f.tradeoffs,
    })),
    meta: {
      generated_at: new Date().toISOString(),
      generator: "prophet@alpha",
      inference_backend: "0g",
      version: "0.1.0",
      tier: slice.analyzedWithPremium ? "premium" : "standard",
    },
  }
}

/** SARIF 2.1 severity: critical/high -> error, medium -> warning, low -> note */
function severityToSarifLevel(
  severity: string
): "error" | "warning" | "note" {
  switch (severity) {
    case "critical":
    case "high":
      return "error"
    case "medium":
      return "warning"
    default:
      return "note"
  }
}

export interface SarifExportOptions {
  /** Default artifact URI for locations (e.g. contract file path for GitHub). */
  defaultArtifactUri?: string
}

/**
 * Map a Prophet report to SARIF 2.1 for GitHub Code Scanning / CI.
 */
export function prophetReportToSarif(
  report: ProphetReportExport,
  options: SarifExportOptions = {}
): Record<string, unknown> {
  const artifactUri = options.defaultArtifactUri ?? report.contract_name + ".sol"

  const ruleIds = new Set<string>()
  const rules: Array<{
    id: string
    name: string
    shortDescription: { text: string }
    fullDescription?: { text: string }
    defaultConfiguration: { level: string }
    help?: { text: string }
  }> = []
  const results: Array<{
    ruleId: string
    level?: string
    message: { text: string }
    locations: Array<{
      physicalLocation: {
        artifactLocation: { uri: string }
        region: { startLine: number; endLine?: number; startColumn?: number; endColumn?: number }
      }
    }>
    partialFingerprints?: Record<string, string>
  }> = []

  for (const v of report.vulnerabilities) {
    const ruleId = v.id || v.title.replace(/\s+/g, "_").slice(0, 64)
    if (!ruleIds.has(ruleId)) {
      ruleIds.add(ruleId)
      rules.push({
        id: ruleId,
        name: v.title,
        shortDescription: { text: v.title },
        fullDescription: v.explanation ? { text: v.explanation } : undefined,
        defaultConfiguration: { level: severityToSarifLevel(v.severity) },
        help: v.explanation ? { text: v.explanation } : undefined,
      })
    }

    const locations = v.locations.length
      ? v.locations.map((loc) => ({
          physicalLocation: {
            artifactLocation: { uri: loc.file || artifactUri },
            region: {
              startLine: loc.line_start || 1,
              endLine: loc.line_end || loc.line_start || 1,
              startColumn: 1,
              endColumn: 1,
            },
          },
        }))
      : [
          {
            physicalLocation: {
              artifactLocation: { uri: artifactUri },
              region: { startLine: 1, endLine: 1, startColumn: 1, endColumn: 1 },
            },
          },
        ]

    results.push({
      ruleId,
      level: severityToSarifLevel(v.severity),
      message: { text: v.explanation || v.title },
      locations,
      partialFingerprints: {
        "prophet/v1": `${ruleId}:${artifactUri}:${locations.map((l) => l.physicalLocation.region.startLine).join(",")}`,
      },
    })
  }

  const sarif = {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "Prophet",
            version: report.meta.version,
            informationUri: "https://github.com/krishavs1/prophet",
            rules,
          },
        },
        results,
        artifacts:
          results.length > 0
            ? [
                {
                  location: { uri: artifactUri },
                  sourceLanguage: "solidity",
                },
              ]
            : undefined,
      },
    ],
  }
  return sarif as Record<string, unknown>
}

/**
 * Trigger a file download in the browser.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
