import { ShieldCheck, GitBranch, FileLock, Zap, CheckCircle2, ArrowRight, Lock, Cloud } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { ThemeToggle } from '../components/theme/theme-toggle'
import { cn } from '../lib/utils'

const DEMO_CONTROLS = [
  {
    id: 'cc6.1',
    code: 'CC6.1',
    title: 'Branch Protection Rules',
    description: 'Enforce branch protection on main branch with required reviews and status checks',
    status: 'passing' as const,
    severity: 'critical' as const,
    source: 'github',
    observed: 'Branch protection enabled on main. Required: 1 review, CI passes, admin enforcement.',
  },
  {
    id: 'cc6.2',
    code: 'CC6.2',
    title: 'Pull Request Review Policy',
    description: 'Require code review before merge with stale review dismissal',
    status: 'needs_review' as const,
    severity: 'high' as const,
    source: 'github',
    observed: 'PR reviews required but stale review dismissal NOT configured.',
  },
  {
    id: 'cc6.3',
    code: 'CC6.3',
    title: 'Dependabot Security Alerts',
    description: 'Dependabot alerts enabled and critical/high vulnerabilities remediated within SLA',
    status: 'failing' as const,
    severity: 'high' as const,
    source: 'github',
    observed: '1 Critical Dependabot alert open for 14 days (CVE-2024-1234 in lodash@4.17.20).',
  },
  {
    id: 'cc7.1',
    code: 'CC7.1',
    title: 'Signed Commits Enforcement',
    description: 'Require GPG-signed commits on protected branches',
    status: 'needs_review' as const,
    severity: 'medium' as const,
    source: 'github',
    observed: 'Signed commits NOT enforced on main branch.',
  },
]

const DEMO_EVIDENCE = [
  { name: 'branch-protection-config.json', status: 'approved', source: 'github', freshness: 'fresh' },
  { name: 'pr-review-policy.pdf', status: 'in_review', source: 'github', freshness: 'fresh' },
  { name: 'dependabot-alerts-export.json', status: 'rejected', source: 'github', freshness: 'stale' },
  { name: 'signed-commits-config.json', status: 'approved', source: 'github', freshness: 'fresh' },
]

const DEMO_TASKS = [
  { title: 'Enable stale review dismissal on main branch', severity: 'high', status: 'open', due: '2025-01-20' },
  { title: 'Remediate Critical Dependabot alert CVE-2024-1234', severity: 'critical', status: 'in_progress', due: '2025-01-18' },
  { title: 'Enforce signed commits on main branch', severity: 'medium', status: 'open', due: '2025-01-25' },
]

export function DemoPage() {
  const passingCount = DEMO_CONTROLS.filter(c => c.status === 'passing').length
  const failingCount = DEMO_CONTROLS.filter(c => c.status === 'failing').length
  const needsReviewCount = DEMO_CONTROLS.filter(c => c.status === 'needs_review').length
  const total = DEMO_CONTROLS.length
  const readinessScore = Math.round((passingCount / total) * 100)

  return (
    <div className="min-h-screen bg-canvas">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-canvas/80 backdrop-blur-md px-3 sm:px-5">
        <Link to="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
          <ShieldCheck className="h-5 w-5 text-accent" strokeWidth={2} />
          <span className="font-semibold text-ink">Proofline Demo</span>
        </Link>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="normal-case tracking-normal">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-warning" />
            Demo Mode
          </Badge>
          <ThemeToggle />
          <Link to="/sign-in">
            <Button size="sm" className="gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
              Start Free
            </Button>
          </Link>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Hero */}
          <section className="text-center py-8 sm:py-12">
            <Badge variant="outline" className="mb-4 normal-case tracking-normal">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-warning" />
              Live Demo Data — No authentication required
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-4">
              Proofline Security Dashboard
            </h1>
            <p className="text-lg text-ink-muted max-w-2xl mx-auto">
              This is a fully functional demo with live data structures. All controls, evidence, tasks, 
              and policies are interactive. Connect your GitHub to see real data.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/sign-in">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  <ShieldCheck className="h-4 w-4" strokeWidth={2} />
                  Connect Your GitHub
                </Button>
              </Link>
            </div>
          </section>

          {/* Readiness Score */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <Card className={cn('bg-success-soft/50 border-success-border')}>
              <CardContent className="p-4 text-center">
                <div className="text-3xl sm:text-4xl font-bold text-success">{readinessScore}%</div>
                <div className="text-sm text-ink-muted">Readiness Score</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl sm:text-4xl font-bold text-success">{passingCount}</div>
                <div className="text-sm text-ink-muted">Passing</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl sm:text-4xl font-bold text-danger">{failingCount}</div>
                <div className="text-sm text-ink-muted">Failing</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl sm:text-4xl font-bold text-warning">{needsReviewCount}</div>
                <div className="text-sm text-ink-muted">Needs Review</div>
              </CardContent>
            </Card>
          </section>

          {/* Security Checks */}
          <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-ink">Security Checks</h2>
                <p className="text-sm text-ink-muted">Deterministic evaluation of GitHub security posture</p>
              </div>
              <Badge variant="default" className="normal-case tracking-normal">
                <GitBranch className="h-3 w-3" strokeWidth={2} />
                GitHub
              </Badge>
            </div>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-line text-left text-sm text-ink-muted">
                      <th className="p-3 font-medium">Control</th>
                      <th className="p-3 font-medium hidden md:table-cell">Description</th>
                      <th className="p-3 font-medium hidden lg:table-cell">Source</th>
                      <th className="p-3 font-medium w-28">Status</th>
                      <th className="p-3 font-medium w-24">Severity</th>
                      <th className="p-3 font-medium w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_CONTROLS.map((control) => (
                      <tr key={control.id} className="border-b border-line/50 hover:bg-surface-muted/50 cursor-pointer">
                        <td className="p-3">
                          <div className="font-mono text-xs text-ink-muted">{control.code}</div>
                          <div className="font-medium text-ink truncate max-w-[280px]">{control.title}</div>
                        </td>
                        <td className="p-3 hidden md:table-cell text-ink-muted text-sm truncate max-w-[300px]">{control.description}</td>
                        <td className="p-3 hidden lg:table-cell text-ink-muted text-xs">
<Badge variant="default" className="normal-case tracking-normal">
                            <GitBranch className="h-3 w-3" strokeWidth={1.75} />
                            GitHub
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge 
                            variant={
                              control.status === 'passing' ? 'success' :
                              control.status === 'failing' ? 'danger' :
                              'warning'
                            }
                            className="normal-case tracking-normal gap-1"
                          >
                            {control.status === 'passing' && <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={2} />}
                            {control.status === 'failing' && <Lock className="h-2.5 w-2.5" strokeWidth={2} />}
                            {control.status === 'needs_review' && <span className="inline-block h-2.5 w-2.5 rounded-full bg-warning" />}
                            {control.status.charAt(0).toUpperCase() + control.status.slice(1).replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge 
                            variant={
                              control.severity === 'critical' ? 'danger' :
                              control.severity === 'high' ? 'danger' :
                              control.severity === 'medium' ? 'warning' :
                              'default'
                            }
                            className="normal-case tracking-normal"
                          >
                            {control.severity}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Button variant="ghost" size="icon-sm" className="text-ink-muted hover:text-ink">
                            →
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          {/* Evidence, Tasks, Policies Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Evidence */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileLock className="h-4 w-4 text-accent" strokeWidth={2} />
                      Evidence Library
                    </CardTitle>
                    <CardDescription>Artifacts with SHA-256 verification</CardDescription>
                  </div>
<Badge variant="default" className="normal-case tracking-normal">
                    <GitBranch className="h-3 w-3" strokeWidth={1.75} />
                    GitHub
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {DEMO_EVIDENCE.map((ev) => (
                    <div key={ev.name} className="flex items-center justify-between py-2 border-b border-line/50 last:border-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileLock className="h-4 w-4 text-ink-subtle" strokeWidth={1.75} />
                        <div className="min-w-0">
                          <div className="font-medium text-ink truncate max-w-[200px]">{ev.name}</div>
                          <div className="text-xs text-ink-subtle">{ev.source} · {ev.freshness}</div>
                        </div>
                      </div>
                      <Badge 
                        variant={
                          ev.status === 'approved' ? 'success' :
                          ev.status === 'in_review' ? 'default' :
                          'danger'
                        }
                        className="normal-case tracking-normal"
                      >
                        {ev.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tasks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-warning" strokeWidth={2} />
                      Remediation Tasks
                    </CardTitle>
                    <CardDescription>Open tasks to remediate failing controls</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {DEMO_TASKS.map((task) => (
                    <div key={task.title} className="flex items-center justify-between py-2 border-b border-line/50 last:border-0">
                      <div className="min-w-0">
                        <div className="font-medium text-ink truncate max-w-[200px]">{task.title}</div>
                        <div className="text-xs text-ink-subtle flex items-center gap-2">
                          <Badge variant="outline" className="normal-case tracking-normal">{task.due}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            task.severity === 'critical' ? 'danger' :
                            task.severity === 'high' ? 'danger' :
                            'warning'
                          }
                          className="normal-case tracking-normal"
                        >
                          {task.severity}
                        </Badge>
                        <Badge 
                          variant={
                            task.status === 'in_progress' ? 'info' :
                            'outline'
                          }
                          className="normal-case tracking-normal"
                        >
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-accent-soft/50 border-accent-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" strokeWidth={2} />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common operations in this demo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/sign-in">
                  <Button className="w-full justify-start gap-2" variant="primary">
                    <ShieldCheck className="h-4 w-4" strokeWidth={2} />
                    Connect Your GitHub
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  View Full Dashboard
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <FileLock className="h-4 w-4" strokeWidth={2} />
                  Generate Sample PDF Report
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <GitBranch className="h-4 w-4" strokeWidth={2} />
                  View GitHub Integration
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* Features Preview */}
          <section className="mb-6">
            <h2 className="text-xl font-bold text-ink mb-4">What You Get with Proofline</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FeatureCard icon={<GitBranch className="h-5 w-5" strokeWidth={2} />} title="GitHub Security Posture" description="Branch protection, PR reviews, Dependabot, signed commits — evaluated deterministically across all repos." controls={['CC6.1', 'CC6.2', 'CC6.3', 'CC7.1']} />
              <FeatureCard icon={<Cloud className="h-5 w-5" strokeWidth={2} />} title="Cloud Infrastructure" description="IAM least-privilege, S3 encryption, CloudTrail, VPC security groups — AWS, GCP, Azure integrations." controls={['CC6.7', 'CC7.2', 'CC8.1']} />
              <FeatureCard icon={<FileLock className="h-5 w-5" strokeWidth={2} />} title="Evidence Locker" description="Client-side SHA-256, direct-to-R2 uploads, signed URLs, human approval workflow, cryptographic integrity." controls={['CC6.4', 'CC7.3']} />
            </div>
          </section>

          {/* CTA */}
          <section className="text-center py-8 bg-accent-soft rounded-app-lg">
            <h2 className="text-2xl font-bold text-ink mb-2">Ready to Prove Your Security?</h2>
            <p className="text-ink-muted mb-6 max-w-xl mx-auto">
              Join engineering teams using Proofline to continuously validate their SOC 2 readiness. 
              Free tier includes unlimited repositories and evidence storage.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/sign-in">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  <ShieldCheck className="h-4 w-4" strokeWidth={2} />
                  Start Free Assessment
                </Button>
              </Link>
              <Link to="/">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto bg-white border-ink/20 hover:bg-surface-muted">
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  Back to Landing
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-line bg-surface-muted/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center text-sm text-ink-muted">
          <p>Proofline Demo — No data persisted. <Link to="/sign-in" className="underline hover:text-accent">Connect your GitHub</Link> for real data.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description, controls }: { icon: React.ReactNode; title: string; description: string; controls: string[] }) {
  return (
    <Card className="h-full hover:border-accent/50 transition-colors">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-app-md bg-accent-soft text-accent">
            {icon}
          </span>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1.5">
          {controls.map((c) => (
            <span key={c} className="px-2 py-0.5 rounded text-xs font-mono bg-surface-muted text-ink-muted border border-line">
              {c}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}