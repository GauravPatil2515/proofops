import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  FileLock,
  Zap,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Cloud,
  Lock,
  BarChart3,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { ThemeToggle } from '../components/theme/theme-toggle'
import { cn } from '../lib/utils'

const FEATURES = [
  {
    icon: GitBranch,
    title: 'GitHub Security Posture',
    description: 'Automated scans of branch protection, PR review requirements, Dependabot alerts, and signed commits across all repositories.',
    controls: ['CC6.1', 'CC6.2', 'CC6.3', 'CC7.1'],
  },
  {
    icon: Cloud,
    title: 'Cloud & Infrastructure',
    description: 'IAM least-privilege, S3 encryption, CloudTrail, VPC security groups — with AWS, GCP, and Azure integrations coming soon.',
    controls: ['CC6.7', 'CC7.2', 'CC8.1'],
  },
  {
    icon: Lock,
    title: 'Evidence Locker',
    description: 'Upload artifacts (PDFs, screenshots, configs) with client-side SHA-256 hashing. Direct-to-R2 uploads, signed URLs, and human approval workflow.',
    controls: ['CC6.4', 'CC7.3'],
  },
  {
    icon: BarChart3,
    title: 'Readiness Dashboard',
    description: 'Real-time SOC 2 Type I readiness score with trend charts, failing controls, open remediation tasks, and audit-ready PDF export.',
    controls: ['CC1.1', 'CC2.1'],
  },
  {
    icon: FileLock,
    title: 'Policy Version Control',
    description: 'Versioned policies with AI-assisted drafts, human review gates, and cryptographic content hashing. Four SOC 2 templates included.',
    controls: ['CC1.2', 'CC2.2'],
  },
  {
    icon: Zap,
    title: 'Questionnaire Automation',
    description: 'Import CSV/XLSX security questionnaires. AI generates grounded answers citing your approved evidence and policies. Confidence scoring included.',
    controls: ['CC2.3', 'CC3.1'],
  },
]

const INTEGRATIONS = [
  { name: 'GitHub', status: 'live', icon: GitBranch },
  { name: 'AWS', status: 'coming', icon: Cloud },
  { name: 'GCP', status: 'coming', icon: Cloud },
  { name: 'Slack', status: 'coming', icon: Lock },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-canvas/80 backdrop-blur-md px-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
          <div className="flex h-7 w-7 items-center justify-center rounded-app-md bg-ink text-white font-mono text-app-xs font-bold shadow-app-xs">
            P
          </div>
          <span className="font-semibold text-ink tracking-tight">Proofline</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/rules" className="text-app-sm text-ink-muted hover:text-ink hidden sm:inline-block transition-colors">
            Rule Catalog
          </Link>
          <Link to="/demo" className="text-app-sm text-ink-muted hover:text-ink hidden sm:inline-block transition-colors">
            Demo
          </Link>
          <ThemeToggle />
          <Link to="/sign-in">
            <Button size="sm" variant="outline" className="h-8">
              Sign In
            </Button>
          </Link>
          <Link to="/overview">
            <Button size="sm" className="h-8 gap-1 hidden sm:inline-flex">
              Dashboard &rarr;
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-canvas to-surface-muted py-20 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success mb-6">
              <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
              SOC 2 Type I Readiness Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-ink tracking-tight mb-6">
              Continuous Security Compliance
              <br />
              <span className="text-accent">for Engineering Teams</span>
            </h1>
            <p className="text-lg sm:text-xl text-ink-muted mb-8 max-w-2xl mx-auto leading-relaxed">
              Proofline connects to your GitHub, cloud, and communication tools to continuously evaluate 
              security controls against SOC 2 criteria. Deterministic checks. Cryptographic evidence. 
              Audit-ready reports.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/sign-in">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  <ShieldCheck className="h-4 w-4" strokeWidth={2} />
                  Start Free Assessment
                </Button>
              </Link>
              <Link to="/demo">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  View Live Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 border-y border-line bg-surface-muted/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-ink-muted">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" strokeWidth={2} />
              <span>Deterministic rule engine</span>
            </div>
            <div className="flex items-center gap-2">
              <FileLock className="h-4 w-4 text-info" strokeWidth={2} />
              <span>SHA-256 evidence integrity</span>
            </div>
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-ink" strokeWidth={2} />
              <span>GitHub App (least privilege)</span>
            </div>
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-warning" strokeWidth={2} />
              <span>Cloudflare R2 storage</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-accent" strokeWidth={2} />
              <span>Clerk authentication</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-28 bg-canvas">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-ink mb-4">How It Works</h2>
            <p className="text-lg text-ink-muted max-w-2xl mx-auto">
              Connect your tools, run automated checks, collect evidence, and generate audit-ready reports — all in one platform.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="h-full hover:border-accent/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <feature.icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </div>
                  <CardDescription className="text-sm">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {feature.controls.map((c) => (
                      <span key={c} className="px-2 py-0.5 rounded text-xs font-mono bg-surface-muted text-ink-muted border border-line">
                        {c}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 lg:py-28 bg-surface-muted/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-ink mb-4">Integrations</h2>
            <p className="text-lg text-ink-muted max-w-2xl mx-auto">
              Connect the tools you already use. Least-privilege access. Read-only by default.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {INTEGRATIONS.map((integration) => (
              <Card key={integration.name} className={cn(
                'h-full flex flex-col items-center p-6',
                integration.status === 'live' ? 'border-accent/30 bg-accent-soft/20' : 'border-line'
              )}>
                <div className="flex items-center justify-center h-12 w-12 rounded-full mb-4" 
                     style={integration.status === 'live' 
                       ? { background: 'var(--accent-soft)', color: 'var(--accent)' } 
                       : { background: 'var(--surface-muted)', color: 'var(--ink-muted)' }}>
                  <integration.icon className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <CardTitle className="text-lg">{integration.name}</CardTitle>
                <CardDescription className="text-center">
                  {integration.status === 'live' 
                    ? 'Live — Branch protection, PR reviews, Dependabot, signed commits'
                    : 'Coming soon'}
                </CardDescription>
                {integration.status === 'live' && (
                  <div className="mt-auto flex items-center justify-center gap-1 text-xs text-success">
                    <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                    Active
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works steps */}
      <section className="py-20 lg:py-28 bg-canvas">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-ink mb-4">Get Compliant in 4 Steps</h2>
            <p className="text-lg text-ink-muted max-w-2xl mx-auto">
              From zero to audit-ready in hours, not weeks.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StepCard step="01" title="Connect" description="Install the GitHub App with least-privilege permissions. Add AWS, GCP, or Slack when ready." icon={<GitBranch className="h-6 w-6" strokeWidth={2} />} />
            <StepCard step="02" title="Scan" description="Run deterministic checks across all repos. Branch protection, PR reviews, Dependabot, signed commits — evaluated in seconds." icon={<Zap className="h-6 w-6" strokeWidth={2} />} />
            <StepCard step="03" title="Evidence" description="Upload artifacts directly to R2 with SHA-256 hashing. Route for human approval. Cryptographic integrity guaranteed." icon={<FileLock className="h-6 w-6" strokeWidth={2} />} />
            <StepCard step="04" title="Report" description="Generate SOC 2 Type I readiness PDF with trend charts, control evidence, and remediation tasks. Audit-ready on demand." icon={<BarChart3 className="h-6 w-6" strokeWidth={2} />} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-accent-soft">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-ink mb-4">Ready to Prove Your Security?</h2>
          <p className="text-lg text-ink-muted mb-8">
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
            <Link to="/demo">
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto bg-white border-ink/20 hover:bg-surface-muted">
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
                View Live Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-line bg-surface-muted/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-ink mb-3">Proofline</h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Continuous SOC 2 readiness for modern engineering teams. Deterministic checks, cryptographic evidence, audit-ready reports.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-ink mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-ink-muted">
                <li><Link to="/rules" className="hover:text-accent text-accent font-medium">Public Rule Catalog</Link></li>
                <li><Link to="/security-checks" className="hover:text-accent">Security Checks</Link></li>
                <li><Link to="/evidence" className="hover:text-accent">Evidence Library</Link></li>
                <li><Link to="/questionnaires" className="hover:text-accent">Questionnaires</Link></li>
                <li><Link to="/policies" className="hover:text-accent">Policies</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-ink mb-3">Integrations</h4>
              <ul className="space-y-2 text-sm text-ink-muted">
                <li>GitHub (Live)</li>
                <li>AWS (Coming Soon)</li>
                <li>GCP (Coming Soon)</li>
                <li>Slack (Coming Soon)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-ink mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-ink-muted">
                <li><Link to="#" className="hover:text-accent">Documentation</Link></li>
                <li><Link to="#" className="hover:text-accent">API Reference</Link></li>
                <li><Link to="#" className="hover:text-accent">Security</Link></li>
                <li><Link to="#" className="hover:text-accent">Changelog</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-muted">
            <p>&copy; 2025 Proofline. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="#" className="hover:text-accent">Privacy</Link>
              <Link to="#" className="hover:text-accent">Terms</Link>
              <Link to="#" className="hover:text-accent">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function StepCard({ step, title, description, icon }: { step: string; title: string; description: string; icon: React.ReactNode }) {
  return (
    <Card className="h-full relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-accent/20" />
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono text-ink-muted">{step}</span>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-accent-soft text-accent">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}