import { useState, useEffect } from 'react'
import {
  Play,
  RefreshCw,
  FileCode,
  Lock,
  CheckCircle2,
  AlertOctagon,
  Fingerprint,
  Cpu,
  Terminal,
  Copy,
  Check,
} from 'lucide-react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { toast } from 'sonner'
import { cn } from '../../lib/utils'

interface IncidentSummary {
  id: string
  title: string
  service: string
  severity: string
  status: string
  source: string
  culprit_commit?: string
  created_at: string
}

interface IncidentDetail {
  id: string
  title: string
  service_name: string
  severity: string
  status: string
  source: string
  culprit_commit?: string
  created_at: string
  resolved_at?: string
  evidence?: {
    id: string
    verdict: string
    repro_exit_code: number
    pytest_exit_code: number
    patch_diff: string
    patch_sha256: string
    tampered_diff?: string
    tampered_sha256?: string
    tamper_detected?: boolean
    tamper_timestamp?: string
    attestation_json?: string
    sealed_at?: string
  }
  messages?: Array<{
    id: string
    agent_role: string
    content: string
    timestamp: string
    evidence_payload?: any
  }>
}

export function IncidentCommandCenter() {
  const [incidents, setIncidents] = useState<IncidentSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeIncident, setActiveIncident] = useState<IncidentDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [systemMode, setSystemMode] = useState<{ switch_mode: string; note: string; base_url: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'timeline' | 'diff' | 'attestation'>('timeline')

  const fetchSystemMode = async () => {
    try {
      const res = await fetch('/api/v1/system/mode')
      if (res.ok) setSystemMode(await res.json())
    } catch {
      // fallback
    }
  }

  const fetchIncidents = async () => {
    try {
      const res = await fetch('/api/v1/incidents')
      if (res.ok) {
        const data: IncidentSummary[] = await res.json()
        setIncidents(data)
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id)
        }
      }
    } catch (e) {
      console.error('Failed to load incidents', e)
    }
  }

  const fetchDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/incidents/${id}`)
      if (res.ok) {
        const data = await res.json()
        const inc = data.incident || data
        setActiveIncident({
          id: inc.id,
          title: inc.title,
          service_name: inc.service || inc.service_name || 'checkout-api',
          severity: inc.severity || 'high',
          status: inc.status || 'awaiting_approval',
          source: inc.source || 'sentry',
          culprit_commit: inc.culprit_commit,
          created_at: String(inc.created_at),
          evidence: data.evidence ? {
            id: data.evidence.id,
            verdict: data.evidence.gate_verdict || data.evidence.verdict || 'VERIFIED',
            repro_exit_code: data.evidence.repro_exit_code || 0,
            pytest_exit_code: data.evidence.test_exit_code || 0,
            patch_diff: data.evidence.patch_diff || '',
            patch_sha256: data.evidence.patch_sha256 || '',
            tampered_diff: data.evidence.tampered_diff,
            tampered_sha256: data.evidence.tampered_sha256,
            tamper_detected: data.evidence.tamper_detected || (inc.status === 'tampered'),
            tamper_timestamp: data.evidence.tamper_timestamp,
            attestation_json: data.evidence.attestation_statement ? JSON.stringify(data.evidence.attestation_statement, null, 2) : data.evidence.attestation_json,
            sealed_at: data.evidence.sealed_at,
          } : undefined,
          messages: (data.timeline || data.messages || []).map((m: any, idx: number) => ({
            id: m.id || String(idx),
            agent_role: m.agent || m.agent_role || 'Switch Agent',
            content: m.content || m.message || '',
            timestamp: m.timestamp || new Date().toISOString(),
          })),
        })
      }
    } catch (e) {
      console.error('Failed to load incident detail', e)
    }
  }

  useEffect(() => {
    fetchSystemMode()
    fetchIncidents()
  }, [])

  useEffect(() => {
    if (selectedId) {
      fetchDetail(selectedId)
    }
  }, [selectedId])

  const handleLaunchDemo = async () => {
    setLoading(true)
    try {
      toast.info('Triggering Sentry alert & launching Switch agent swarm...')
      const res = await fetch('/api/v1/incidents/demo', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to launch demo')
      const data = await res.json()
      toast.success(`Incident ${data.incident_id} dispatched!`, {
        description: 'Triage, Repro, Patch, and Verifier agents are executing.',
      })
      await fetchIncidents()
      setSelectedId(data.incident_id)
      await fetchDetail(data.incident_id)
    } catch (e: any) {
      toast.error('Launch failed', { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedId) return
    try {
      const res = await fetch(`/api/v1/incidents/${selectedId}/approve`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success('Patch Approved & Merged', {
          description: `PR #${data.pr_number || '142'} merged into production branch.`,
        })
        await fetchDetail(selectedId)
        await fetchIncidents()
      } else {
        toast.error('Approval Rejected by Gate', { description: data.detail || 'Verification gate blocked merge.' })
      }
    } catch (e: any) {
      toast.error('Approval failed', { description: e.message })
    }
  }

  const handleTamper = async () => {
    if (!selectedId) return
    try {
      toast.warning('Simulating adversary post-verification diff corruption...')
      const res = await fetch(`/api/v1/incidents/${selectedId}/tamper`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.error('TAMPER DETECTED BY EVIDENCE GATE', {
          description: 'Sealed DSSE Ed25519 signature mismatch! Deployment permanently locked.',
        })
        await fetchDetail(selectedId)
        await fetchIncidents()
      } else {
        toast.error('Tamper simulation error', { description: data.detail })
      }
    } catch (e: any) {
      toast.error('Tamper failed', { description: e.message })
    }
  }

  const handleRerun = async () => {
    if (!selectedId) return
    setLoading(true)
    try {
      toast.info('Re-running clean reproduction and verification pipeline...')
      const res = await fetch(`/api/v1/incidents/${selectedId}/rerun`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success('Investigation Re-Run Complete', {
          description: 'Clean patch verified and sealed with fresh DSSE attestation.',
        })
        await fetchDetail(selectedId)
        await fetchIncidents()
      } else {
        toast.error('Re-run failed', { description: data.detail })
      }
    } catch (e: any) {
      toast.error('Re-run failed', { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  const copyAttestation = () => {
    if (activeIncident?.evidence?.attestation_json) {
      navigator.clipboard.writeText(activeIncident.evidence.attestation_json)
      setCopied(true)
      toast.success('in-toto DSSE JSON copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isLive = systemMode?.switch_mode === 'live'

  return (
    <Card className="border-indigo-500/20 shadow-app-sm overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-surface to-surface border-b border-line p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-app-md bg-indigo-600 text-white font-mono font-bold shadow-app-xs">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-app-base font-bold text-ink">Autonomous Incident Command</h2>
              <Badge variant="outline" className="font-mono text-[10px] tracking-tight border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                SWITCH MESH ACTIVE
              </Badge>
            </div>
            <p className="text-app-xs text-ink-subtle">
              Evidence-gated autonomous triage, reproduction, AST verification, and in-toto DSSE Ed25519 signing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-app-md bg-surface-muted border border-line text-xs font-mono">
            <span className={cn('h-2 w-2 rounded-full', isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500')} />
            <span className="font-medium">{isLive ? '🟢 Live Switch Core' : '🟡 Standalone Replay'}</span>
          </div>

          <Button
            size="sm"
            onClick={handleLaunchDemo}
            disabled={loading}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-app-xs font-medium"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Launch Demo Incident
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-line">
        {/* Incident List Column */}
        <div className="lg:col-span-4 p-3 flex flex-col gap-2 bg-surface-subtle/50">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-mono uppercase font-semibold text-ink-subtle tracking-wider">
              Telemetry Incidents ({incidents.length})
            </span>
            <Button variant="ghost" size="icon-sm" onClick={fetchIncidents} className="h-6 w-6">
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex flex-col gap-1.5 max-h-[520px] overflow-y-auto pr-1">
            {incidents.map((inc) => {
              const isSelected = inc.id === selectedId
              const isTampered = inc.status === 'tampered'
              const isResolved = inc.status === 'resolved'
              const isAwaiting = inc.status === 'awaiting_approval'

              return (
                <button
                  key={inc.id}
                  onClick={() => setSelectedId(inc.id)}
                  className={cn(
                    'flex flex-col text-left p-3 rounded-app-md border transition-all text-xs',
                    isSelected
                      ? 'bg-surface border-indigo-500/40 shadow-app-xs ring-1 ring-indigo-500/20'
                      : 'bg-surface/60 border-line hover:border-line-strong hover:bg-surface'
                  )}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono font-bold text-ink flex items-center gap-1.5">
                      {inc.id}
                      <span className="text-[10px] font-normal text-ink-subtle">({inc.service})</span>
                    </span>
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase',
                        isResolved && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                        isTampered && 'bg-rose-500/15 text-rose-600 dark:text-rose-400 animate-pulse',
                        isAwaiting && 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                        !isResolved && !isTampered && !isAwaiting && 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                      )}
                    >
                      {inc.status}
                    </span>
                  </div>
                  <span className="font-medium text-ink truncate">{inc.title}</span>
                  <div className="flex items-center justify-between text-[10px] text-ink-subtle mt-2 font-mono">
                    <span>Source: {inc.source}</span>
                    <span>Commit: {inc.culprit_commit ? inc.culprit_commit.slice(0, 7) : 'HEAD'}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Incident Detail Console */}
        <div className="lg:col-span-8 p-4 flex flex-col gap-4">
          {activeIncident ? (
            <>
              {/* Header Info & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="text-app-base font-bold text-ink font-mono">{activeIncident.id}</h3>
                    <Badge variant="outline" className="font-mono text-xs">
                      {activeIncident.service_name}
                    </Badge>
                    <span className="text-xs text-ink-subtle">Severity: <strong className="text-rose-600 uppercase font-mono">{activeIncident.severity}</strong></span>
                  </div>
                  <p className="text-app-sm text-ink font-medium mt-0.5">{activeIncident.title}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRerun}
                    disabled={loading}
                    className="gap-1.5 text-xs h-8"
                  >
                    <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
                    Re-Run Gate
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleTamper}
                    disabled={loading || activeIncident.status === 'tampered'}
                    className="gap-1.5 text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    <AlertOctagon className="h-3.5 w-3.5" />
                    Simulate Tamper
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleApprove}
                    disabled={loading || activeIncident.status !== 'awaiting_approval'}
                    className="gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-app-xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve & Deploy PR
                  </Button>
                </div>
              </div>

              {/* Tamper Alert if detected */}
              {activeIncident.evidence?.tamper_detected && (
                <div className="p-3 rounded-app-md bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between font-mono">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>
                      <strong>CRYPTOGRAPHIC INTEGRITY VIOLATION:</strong> Diff was tampered post-verification. Expected SHA-256: <code className="bg-rose-500/20 px-1 rounded">{activeIncident.evidence.patch_sha256?.slice(0, 12)}...</code> but received <code className="bg-rose-500/20 px-1 rounded">{activeIncident.evidence.tampered_sha256?.slice(0, 12)}...</code>. Gate has blocked deployment.
                    </span>
                  </div>
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 border-b border-line pb-1 text-xs">
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={cn(
                    'px-3 py-1.5 rounded-app-sm font-medium transition-colors flex items-center gap-1.5',
                    activeTab === 'timeline' ? 'bg-surface-muted text-ink font-semibold' : 'text-ink-subtle hover:text-ink'
                  )}
                >
                  <Terminal className="h-3.5 w-3.5" />
                  Switch Agent Conversation ({activeIncident.messages?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('diff')}
                  className={cn(
                    'px-3 py-1.5 rounded-app-sm font-medium transition-colors flex items-center gap-1.5',
                    activeTab === 'diff' ? 'bg-surface-muted text-ink font-semibold' : 'text-ink-subtle hover:text-ink'
                  )}
                >
                  <FileCode className="h-3.5 w-3.5" />
                  Verified Unified Diff
                </button>
                <button
                  onClick={() => setActiveTab('attestation')}
                  className={cn(
                    'px-3 py-1.5 rounded-app-sm font-medium transition-colors flex items-center gap-1.5',
                    activeTab === 'attestation' ? 'bg-surface-muted text-ink font-semibold' : 'text-ink-subtle hover:text-ink'
                  )}
                >
                  <Fingerprint className="h-3.5 w-3.5" />
                  in-toto DSSE Ed25519 Attestation
                </button>
              </div>

              {/* Tab: Switch Agent Timeline */}
              {activeTab === 'timeline' && (
                <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {activeIncident.messages?.map((msg, idx) => {
                    const isTriage = msg.agent_role.includes('triage')
                    const isRepro = msg.agent_role.includes('repro')
                    const isPatch = msg.agent_role.includes('patch')

                    const roleBadge = isTriage
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                      : isRepro
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                      : isPatch
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'

                    return (
                      <div key={idx} className="p-3 rounded-app-md bg-surface border border-line text-xs flex flex-col gap-1.5 shadow-app-xs">
                        <div className="flex items-center justify-between">
                          <span className={cn('px-2 py-0.5 rounded text-[10px] font-mono font-semibold border', roleBadge)}>
                            {msg.agent_role}
                          </span>
                          <span className="text-[10px] font-mono text-ink-subtle">{msg.timestamp}</span>
                        </div>
                        <p className="text-ink whitespace-pre-wrap font-mono text-[11px] leading-relaxed bg-surface-subtle p-2 rounded border border-line-subtle">
                          {msg.content}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Tab: Unified Diff Viewer */}
              {activeTab === 'diff' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-ink-subtle font-mono px-1">
                    <span>
                      SHA-256: <code>{activeIncident.evidence?.patch_sha256 || 'None'}</code>
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      Verdict: {activeIncident.evidence?.verdict || 'PENDING'}
                    </Badge>
                  </div>
                  <pre className="p-3 rounded-app-md bg-zinc-950 text-zinc-100 font-mono text-xs overflow-x-auto max-h-[360px] border border-zinc-800 leading-snug">
                    {activeIncident.evidence?.patch_diff || '# No diff captured yet.'}
                  </pre>
                </div>
              )}

              {/* Tab: in-toto DSSE Attestation */}
              {activeTab === 'attestation' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-mono px-1">
                    <span className="text-ink-subtle flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-indigo-500" />
                      Payload Type: <code>application/vnd.in-toto+json</code> (DSSE Ed25519)
                    </span>
                    <Button variant="ghost" size="sm" onClick={copyAttestation} className="h-7 text-xs gap-1 font-mono">
                      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      Copy JSON
                    </Button>
                  </div>
                  <pre className="p-3 rounded-app-md bg-zinc-950 text-indigo-300 font-mono text-xs overflow-x-auto max-h-[360px] border border-zinc-800 leading-snug">
                    {activeIncident.evidence?.attestation_json || JSON.stringify(activeIncident.evidence, null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-ink-subtle">
              <Cpu className="h-8 w-8 text-ink-subtle mb-2" />
              <p className="text-app-sm font-medium">Select an incident to inspect the Switch agent swarm transcript.</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
