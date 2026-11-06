import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Search,
  Terminal,
  Layers,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { ThemeToggle } from '../../components/theme/theme-toggle'

export interface PublicRule {
  id: string
  key: string
  title: string
  category: string
  soc2_criteria: string[]
  openssf_scorecard_check?: string
  version: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  rationale: string
  remediation: string
  evaluator_logic: string
  free_tier_status: string
}

const PUBLIC_RULES_CATALOG: PublicRule[] = [
  {
    id: 'po-rule-01',
    key: 'po-anti-masking-gate',
    title: 'ProofOps AST Anti-Masking Verification Gate',
    category: 'Autonomous Agent Security',
    soc2_criteria: ['CC8.1', 'CC8.2'],
    openssf_scorecard_check: 'AST-Integrity',
    version: '2.0.0',
    severity: 'critical',
    description: 'Scans autonomous coding agent patches for deleted test assertions, bare except blocks, or silenced failure frames.',
    rationale: 'LLM agents frequently hallucinate fixes by weakening test suites rather than repairing underlying business logic.',
    remediation: 'Ensure the autonomous agent patch preserves all original pytest assertions and repairs the root cause.',
    evaluator_logic: 'Executes AST diff comparison between base and patched test suites. Flags any AST delete/replace on assert nodes.',
    free_tier_status: 'Included (ProofOps Core)',
  },
  {
    id: 'po-rule-02',
    key: 'po-dsse-cryptographic-sealing',
    title: 'in-toto DSSE Ed25519 Cryptographic Attestation',
    category: 'Supply Chain & Attestation',
    soc2_criteria: ['CC6.1', 'CC7.3'],
    openssf_scorecard_check: 'Signed-Releases',
    version: '2.0.0',
    severity: 'critical',
    description: 'Generates and cryptographically verifies an in-toto v1 Statement wrapped in a DSSE Ed25519 PAE envelope.',
    rationale: 'Mathematical assurance that evidence was produced by verified test execution and has not been tampered with.',
    remediation: 'Configure PROOFOPS_SIGNING_KEY in production or use default Ed25519 local keypair for development.',
    evaluator_logic: 'Verifies DSSE Ed25519 signature over pre-authentication encoding (PAE) against public key.',
    free_tier_status: 'Included (ProofOps Core)',
  },
  {
    id: 'po-rule-03',
    key: 'po-empty-diff-rejection',
    title: 'Autonomous Agent Empty-Diff Rejection Gate',
    category: 'Autonomous Agent Security',
    soc2_criteria: ['CC8.1'],
    openssf_scorecard_check: 'Diff-Verification',
    version: '2.0.0',
    severity: 'critical',
    description: 'Rejects autonomous agent pull requests containing zero line modifications that falsely claim resolution.',
    rationale: 'Prevents premature closure of Sentry incident tickets when agents report false completion.',
    remediation: 'Agent must produce a valid non-empty unified diff targeting the affected codebase.',
    evaluator_logic: 'Checks that git diff patch length > 0 and contains at least 1 added or modified line.',
    free_tier_status: 'Included (ProofOps Core)',
  },
  {
    id: 'po-rule-04',
    key: 'po-path-scope-enforcement',
    title: 'Path Scope & Microservice Boundary Policy',
    category: 'Access Control',
    soc2_criteria: ['CC6.6', 'CC6.7'],
    openssf_scorecard_check: 'Scope-Boundary',
    version: '2.0.0',
    severity: 'high',
    description: 'Restricts autonomous agent file edits strictly to the service directory affected by the incident alert.',
    rationale: 'Prevents path traversal and unauthorized modifications to root configuration files, CI workflows, or secrets.',
    remediation: 'Configure service allowed_paths in proofops.template.yaml.',
    evaluator_logic: 'Evaluates all file paths in patch diff against allowed service directory prefix.',
    free_tier_status: 'Included (ProofOps Core)',
  },
  {
    id: 'rule-01',
    key: 'gh-branch-protection-main',
    title: 'Default Branch Protection & Ruleset Enforcement',
    category: 'Source Control & Change Management',
    soc2_criteria: ['CC6.1', 'CC6.6', 'CC8.1'],
    openssf_scorecard_check: 'Branch-Protection',
    version: '1.2.0',
    severity: 'critical',
    description: 'Requires either an active GitHub Ruleset or classic branch protection rule on main/master to prevent direct pushes.',
    rationale: 'Direct commits bypass code review and automated CI verification, introducing untracked vulnerabilities into production.',
    remediation: 'Navigate to GitHub Settings -> Rules -> Rulesets (or Branches) and enforce branch protection on the default branch.',
    evaluator_logic: 'Evaluates GET /repos/{owner}/{repo}/rulesets?includes_parents=true and /branches/{branch}/protection. GitHub Free private repos evaluate to needs_review with plan limitation metadata rather than false failure.',
    free_tier_status: 'Included (up to 5 repositories)',
  },
  {
    id: 'rule-02',
    key: 'gh-pr-reviews-required',
    title: 'Independent Pull Request Peer Reviews',
    category: 'Change Management',
    soc2_criteria: ['CC6.2', 'CC8.1'],
    openssf_scorecard_check: 'Code-Review',
    version: '1.1.0',
    severity: 'high',
    description: 'Enforces mandatory pull request peer approval count >= 1 with stale review dismissal enabled upon new commits.',
    rationale: 'Mandates segregation of duties so no single engineer can push unreviewed code changes directly into production systems.',
    remediation: 'In branch protection or ruleset settings, enable "Require a pull request before merging" and "Dismiss stale approvals".',
    evaluator_logic: 'Inspects rulesets for pull_request rule type (required_approving_review_count >= 1, dismiss_stale_reviews_on_push=true) and classic protection reviews payload.',
    free_tier_status: 'Included (up to 5 repositories)',
  },
  {
    id: 'rule-03',
    key: 'gh-dependabot-alerts-triage',
    title: 'Dependabot Software Vulnerability Alerts Triage',
    category: 'Vulnerability & Patch Management',
    soc2_criteria: ['CC7.1', 'CC7.2'],
    openssf_scorecard_check: 'Vulnerabilities',
    version: '1.0.0',
    severity: 'critical',
    description: 'Verifies that zero unresolved Critical or High CVSS Dependabot vulnerability alerts exist in repository dependencies.',
    rationale: 'Known CVE vulnerabilities in open source dependencies create immediate exploitable attack surfaces in production apps.',
    remediation: 'Inspect Dependabot alerts in GitHub Code security tab and merge recommended automated version bump pull requests.',
    evaluator_logic: 'Queries GET /repos/{owner}/{repo}/dependabot/alerts for open alerts with severity critical or high.',
    free_tier_status: 'Included (up to 5 repositories)',
  },
  {
    id: 'rule-04',
    key: 'gh-signed-commits-enforced',
    title: 'Cryptographic Commit Signature Verification',
    category: 'Source Integrity & Provenance',
    soc2_criteria: ['CC6.8', 'CC7.4'],
    openssf_scorecard_check: 'Signed-Commits',
    version: '1.0.0',
    severity: 'medium',
    description: 'Mandates verified GPG, SSH, or S/MIME cryptographic commit signatures on commits targeting the default branch.',
    rationale: 'Cryptographic signatures establish non-repudiation and verify that commits originate from authorized team members.',
    remediation: 'Enable "Require signed commits" in GitHub branch protection or ruleset configuration.',
    evaluator_logic: 'Checks rulesets for required_signatures or classic required_signatures.enabled.',
    free_tier_status: 'Included (up to 5 repositories)',
  },
]

export function RulesCatalogPage() {
  const [search, setSearch] = useState('')
  const [selectedCriteria, setSelectedCriteria] = useState<string>('all')

  const filteredRules = PUBLIC_RULES_CATALOG.filter((rule) => {
    const matchesSearch =
      rule.title.toLowerCase().includes(search.toLowerCase()) ||
      rule.key.toLowerCase().includes(search.toLowerCase()) ||
      rule.description.toLowerCase().includes(search.toLowerCase())
    const matchesCriteria =
      selectedCriteria === 'all' || rule.soc2_criteria.includes(selectedCriteria)
    return matchesSearch && matchesCriteria
  })

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-canvas/80 backdrop-blur-md px-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
          <div className="flex h-7 w-7 items-center justify-center rounded-app-md bg-ink text-white font-mono text-app-xs font-bold shadow-app-xs">
            P
          </div>
          <span className="font-semibold text-ink tracking-tight">Proofline</span>
          <span className="text-xs text-ink-muted">/ Public Rule Catalog</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm text-ink-muted hover:text-ink transition-colors">
            Home
          </Link>
          <ThemeToggle />
          <Link to="/sign-in">
            <Button size="sm" variant="outline" className="h-8">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-14 sm:py-20 border-b border-line bg-surface-muted/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent mb-4">
            <Layers className="h-3.5 w-3.5" />
            Open & Deterministic Compliance Standards
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-ink mb-4">
            Public Compliance Rule Catalog
          </h1>
          <p className="text-base sm:text-lg text-ink-muted max-w-3xl leading-relaxed">
            Proofline's security evaluation rules are 100% deterministic, open, and aligned with OpenSSF Scorecard and AICPA SOC 2 Trust Services Criteria. No opaque black boxes.
          </p>
        </div>
      </section>

      {/* Main Catalog */}
      <main className="py-10 max-w-5xl mx-auto px-4 sm:px-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
            <Input
              type="text"
              placeholder="Search rules, keywords, or CVEs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {['all', 'CC6.1', 'CC6.2', 'CC7.1', 'CC8.1'].map((crit) => (
              <Button
                key={crit}
                variant={selectedCriteria === crit ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedCriteria(crit)}
                className="h-8 text-xs font-mono"
              >
                {crit === 'all' ? 'All Criteria' : crit}
              </Button>
            ))}
          </div>
        </div>

        {/* Rule Cards */}
        <div className="flex flex-col gap-6">
          {filteredRules.map((rule) => (
            <Card key={rule.id} className="border border-line overflow-hidden hover:border-accent/40 transition-colors">
              <CardHeader className="bg-surface-muted/30 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-accent font-semibold bg-accent-soft px-2 py-0.5 rounded">
                      {rule.key}
                    </span>
                    <span className="text-xs text-ink-muted font-mono">v{rule.version}</span>
                    {rule.openssf_scorecard_check && (
                      <Badge variant="outline" className="text-[11px] font-mono gap-1">
                        <CheckCircle2 className="h-3 w-3 text-success" />
                        OpenSSF: {rule.openssf_scorecard_check}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {rule.soc2_criteria.map((c) => (
                      <Badge key={c} variant="outline" className="text-xs font-mono bg-canvas">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
                <CardTitle className="text-lg mt-2">{rule.title}</CardTitle>
                <CardDescription className="text-sm">{rule.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-ink text-xs uppercase tracking-wider mb-1">Audit Rationale</h4>
                  <p className="text-ink-muted text-sm leading-relaxed">{rule.rationale}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-ink text-xs uppercase tracking-wider mb-1">Evaluation Logic</h4>
                  <div className="rounded bg-surface-muted p-2.5 font-mono text-xs text-ink/90 overflow-x-auto border border-line">
                    <Terminal className="inline-block h-3.5 w-3.5 mr-1.5 text-accent" />
                    {rule.evaluator_logic}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-line gap-2 text-xs text-ink-muted">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-ink">Remediation:</span>
                    <span>{rule.remediation}</span>
                  </div>
                  <span className="font-mono text-accent shrink-0">{rule.free_tier_status}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-line text-center text-xs text-ink-muted mt-20">
        <p>&copy; 2025 Proofline. Open rule catalog licensed under Apache 2.0.</p>
      </footer>
    </div>
  )
}
