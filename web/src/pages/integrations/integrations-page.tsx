import { useState } from 'react'
import {
  GitBranch as GithubIcon,
  Cloud,
  MessageSquare as SlackIcon,
  Plug,
  Lock,
  RefreshCw,
  Trash2,
  ExternalLink,
  Info,
  Check,
} from 'lucide-react'
import { PageHeader, PageBody } from '../../components/layout/page-header'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog'
import { Separator } from '../../components/ui/separator'
import { toast } from 'sonner'
import { cn, timeAgo } from '../../lib/utils'
import { useIntegrations, useConnectGitHub, useDisconnectIntegration, useGitHubRepositories, useUpdateRepositoryScope } from '../../lib/queries'
import { useAuthApi } from '../../lib/queries'
import type { Integration, IntegrationKind, IntegrationStatus } from '../../types'

const KIND_ICON: Record<IntegrationKind, React.ReactNode> = {
  github: <GithubIcon className="h-5 w-5" strokeWidth={1.75} />,
  aws: <Cloud className="h-5 w-5" strokeWidth={1.75} />,
  slack: <SlackIcon className="h-5 w-5" strokeWidth={1.75} />,
  gcp: <Cloud className="h-5 w-5" strokeWidth={1.75} />,
  azure: <Cloud className="h-5 w-5" strokeWidth={1.75} />,
  vercel: <Cloud className="h-5 w-5" strokeWidth={1.75} />,
  linear: <Plug className="h-5 w-5" strokeWidth={1.75} />,
  okta: <Lock className="h-5 w-5" strokeWidth={1.75} />,
}

const STATUS_LABEL: Record<Integration['status'], string> = {
  available: 'Available for connection',
  connected: 'Connected',
  coming_soon: 'Coming soon',
  error: 'Connection error',
}

export function IntegrationsPage() {
  const { orgId, isAuthenticated, isLoading: authLoading } = useAuthApi()
  const { data: integrations = [], isLoading: integrationsLoading, error: integrationsError } = useIntegrations(orgId)
  const { data: reposData } = useGitHubRepositories(orgId)
  const connectGitHubMutation = useConnectGitHub()
  const disconnectIntegrationMutation = useDisconnectIntegration()
  const updateScopeMutation = useUpdateRepositoryScope()

  const [disconnectTarget, setDisconnectTarget] = useState<Integration | null>(null)

  const isLoading = authLoading || integrationsLoading
  const isLive = isAuthenticated && !integrationsError

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-ink">Sign in to view integrations</h2>
          <p className="text-app-sm text-ink-muted mt-1">Please sign in with Clerk to access your integrations.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (integrationsError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-danger">Failed to load integrations</h2>
          <p className="text-app-sm text-ink-muted mt-1">{integrationsError.message}</p>
        </div>
      </div>
    )
  }

  async function handleDisconnect() {
    if (!disconnectTarget) return
    try {
      await disconnectIntegrationMutation.mutateAsync(disconnectTarget.id)
      toast.success(`${disconnectTarget.name} disconnected from workspace`)
      setDisconnectTarget(null)
    } catch (err: any) {
      toast.error('Disconnect failed', { description: err.message })
    }
  }

  function handleResync(i: Integration) {
    toast.success(`Sync scheduled for ${i.name}`, { description: 'Live posture synchronization initiated.' })
  }

  return (
    <>
      <PageHeader
        title="Integrations"
        description="Connect Proofline to your source control, cloud, and communication systems. Each connection enables a specific set of automated controls and evidence collection."
        meta={
          <Badge variant="outline" className="normal-case tracking-normal">
            <span className={cn("inline-block h-1.5 w-1.5 rounded-full", isLive ? "bg-success" : "bg-warning")} />
            {isLive ? 'Live Integrations Active' : 'Sample demo data'}
          </Badge>
        }
      />

      <PageBody className="flex flex-col gap-4">
        {/* Info callout */}
        <Card className="border-info-border bg-info-soft/40">
          <CardContent className="p-3 flex items-start gap-2">
            <Info className="h-4 w-4 text-info mt-0.5 shrink-0" strokeWidth={2} />
            <p className="text-app-sm text-ink-muted leading-relaxed">
              GitHub integration uses GitHub App with least-privilege permissions. Click <span className="font-medium text-ink">Connect</span> to install the app on your organization. Other integrations are coming soon.
            </p>
          </CardContent>
        </Card>

        {/* Catalog grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {integrations.map((i) => {
            const isComingSoon = i.status === 'coming_soon'
            const isConnected = i.status === 'connected'
            return (
              <Card key={i.id} className={cn('flex flex-col', isComingSoon && 'opacity-70')}>
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center h-9 w-9 rounded-app-md bg-surface-muted text-ink shrink-0">
                      {KIND_ICON[i.kind as IntegrationKind]}
                    </span>
                    <div className="min-w-0">
                      <CardTitle className="truncate">{i.name}</CardTitle>
                      <CardDescription>{STATUS_LABEL[i.status as IntegrationStatus]}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-3 pt-0">
                  <p className="text-app-sm text-ink-muted leading-relaxed">{i.description}</p>

                  {i.scopes && (
                    <div className="flex flex-wrap gap-1">
                      {i.scopes.map((s: string) => (
                        <Badge key={s} variant="default" className="normal-case tracking-normal">{s}</Badge>
                      ))}
                    </div>
                  )}

                  {/* Permissions */}
                  <div className="flex flex-col gap-1.5 mt-auto">
                    <div className="text-app-2xs font-medium uppercase tracking-wider text-ink-faint">Requested permissions</div>
                    <ul className="flex flex-col gap-0.5">
                      {i.permissions.map((p: string) => (
                        <li key={p} className="text-app-xs text-ink-muted font-mono flex items-center gap-1.5">
                          <Check className="h-2.5 w-2.5 text-success shrink-0" strokeWidth={2.5} />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  {/* Status + sync */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-app-2xs font-medium uppercase tracking-wider text-ink-faint">Status</span>
                      <span className={cn('text-app-xs', isConnected ? 'text-success' : isComingSoon ? 'text-ink-faint' : 'text-ink-muted')}>
                        {isConnected && (
                          <span className="inline-flex items-center gap-1">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                            Connected
                          </span>
                        )}
                        {isComingSoon && 'Not yet available'}
                        {i.status === 'available' && 'Available'}
                      </span>
                      {isConnected && i.lastSync && (
                        <span className="text-app-2xs text-ink-faint">Last sync {timeAgo(i.lastSync)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isConnected && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleResync(i)} className="gap-1.5 h-8">
                            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
                            Sync
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setDisconnectTarget(i)} className="gap-1.5 h-8 text-danger hover:bg-danger-soft hover:border-danger-border">
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                            Disconnect
                          </Button>
                        </>
                      )}
                      {!isConnected && !isComingSoon && i.kind === 'github' && (
                        <Button 
                          size="sm" 
                          onClick={() => connectGitHubMutation.mutate()}
                          disabled={connectGitHubMutation.isPending}
                          className="gap-1.5 h-8"
                        >
                          {connectGitHubMutation.isPending ? (
                            <>
                              <span className="animate-spin h-3.5 w-3.5" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              Connect
                              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                            </>
                          )}
                        </Button>
                      )}
                      {!isConnected && !isComingSoon && i.kind !== 'github' && (
                        <Button size="sm" disabled className="gap-1.5 h-8">
                          Coming soon
                        </Button>
                      )}
                      {isComingSoon && (
                        <Button size="sm" disabled className="gap-1.5 h-8">
                          Coming soon
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Repository Scoping Card (Default-excludes forks & archived repos) */}
        {reposData?.repositories && reposData.repositories.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle>Monitored Repositories & Scoping</CardTitle>
                  <CardDescription>
                    Define the SOC 2 audit boundary. Proofline default-excludes forks and archived repos to prevent false failures.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs w-fit">
                  {reposData.repositories.filter((r: any) => r.is_in_scope).length} of {reposData.repositories.length} In-Scope
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-line rounded-md border border-line overflow-hidden">
                {reposData.repositories.map((repo: any) => {
                  const [owner, name] = repo.full_name.split('/')
                  return (
                    <div key={repo.full_name} className="flex items-center justify-between p-3.5 hover:bg-surface-muted/50 transition-colors">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink text-sm truncate">{repo.full_name}</span>
                          {repo.fork && <Badge variant="outline" className="text-[10px] py-0">Fork</Badge>}
                          {repo.archived && <Badge variant="outline" className="text-[10px] py-0">Archived</Badge>}
                          {repo.private ? (
                            <Badge variant="outline" className="text-[10px] py-0 text-ink-muted">Private</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] py-0 text-success">Public</Badge>
                          )}
                        </div>
                        {repo.exclusion_reason && !repo.is_in_scope && (
                          <span className="text-xs text-ink-muted">
                            Excluded: <span className="font-mono text-[11px]">{repo.exclusion_reason}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Button
                          variant={repo.is_in_scope ? "primary" : "outline"}
                          size="sm"
                          className={cn("h-7 text-xs", repo.is_in_scope ? "bg-accent hover:bg-accent/90" : "text-ink-muted")}
                          disabled={updateScopeMutation.isPending}
                          onClick={() => {
                            updateScopeMutation.mutate({
                              repoOwner: owner,
                              repoName: name,
                              isInScope: !repo.is_in_scope,
                              exclusionReason: repo.is_in_scope ? 'manual_exclude' : undefined,
                            })
                            toast.success(`Updated scoping for ${repo.full_name}`)
                          }}
                        >
                          {repo.is_in_scope ? "In Scope" : "Excluded"}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming integrations */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-0.5">
              <CardTitle>Roadmap</CardTitle>
              <CardDescription>Integrations planned for future release — listed in priority order</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0 flex flex-wrap gap-1.5">
            {['GCP', 'Azure', 'Vercel', 'Linear', 'Okta', '1Password', 'Datadog', 'PagerDuty'].map((name) => (
              <Badge key={name} variant="outline" className="normal-case tracking-normal">{name}</Badge>
            ))}
          </CardContent>
        </Card>
      </PageBody>

      {/* Disconnect confirmation */}
      <Dialog open={!!disconnectTarget} onOpenChange={(v) => !v && setDisconnectTarget(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Disconnect {disconnectTarget?.name}?</DialogTitle>
            <DialogDescription>
              Disconnecting will stop automated evidence collection for any controls that depend on this integration. Existing evidence will be retained but future checks will return "Not checked" until the integration is reconnected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDisconnect} className="gap-1.5">
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}