import { useState } from 'react'
import {
  Building2,
  Users,
  KeyRound,
  Bell,
  Database,
  Lock,
  Check,
  Plus,
  Trash2,
} from 'lucide-react'
import { PageHeader, PageBody } from '../../components/layout/page-header'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input, Textarea } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Switch } from '../../components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs'
import { Separator } from '../../components/ui/separator'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select'
import { toast } from 'sonner'
import { useAuthApi } from '../../lib/queries'

type SettingsTab = 'organization' | 'team' | 'roles' | 'notifications' | 'retention' | 'security'

function SettingRow({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-app-sm font-medium text-ink">{title}</span>
        {description && <span className="text-app-xs text-ink-muted">{description}</span>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export function SettingsPage() {
  const { isAuthenticated, isLoading } = useAuthApi()
  const [tab, setTab] = useState<SettingsTab>('organization')

  if (!isAuthenticated) {
    return (
      <>
        <PageHeader
          title="Settings"
          description="Please sign in to access workspace settings."
        />
      </>
    )
  }

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Settings"
          description="Loading workspace configuration…"
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Workspace configuration. Connect your Clerk organization to manage members and roles."
        meta={
          <Badge variant="outline" className="normal-case tracking-normal">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
            Live
          </Badge>
        }
      />

      <PageBody>
        <Tabs value={tab} onValueChange={(v) => setTab(v as SettingsTab)}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="organization" className="gap-1.5">
              <Building2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              Organization
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-1.5">
              <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
              Team members
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-1.5">
              <KeyRound className="h-3.5 w-3.5" strokeWidth={1.75} />
              Roles
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5">
              <Bell className="h-3.5 w-3.5" strokeWidth={1.75} />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="retention" className="gap-1.5">
              <Database className="h-3.5 w-3.5" strokeWidth={1.75} />
              Data retention
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5">
              <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Organization */}
          <TabsContent value="organization">
            <OrgSettings />
          </TabsContent>

          {/* Team */}
          <TabsContent value="team">
            <TeamSettings />
          </TabsContent>

          {/* Roles */}
          <TabsContent value="roles">
            <RolesSettings />
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>

          {/* Retention */}
          <TabsContent value="retention">
            <RetentionSettings />
          </TabsContent>

          {/* Security */}
          <TabsContent value="security">
            <SecuritySettings />
          </TabsContent>
        </Tabs>
      </PageBody>
    </>
  )
}

function OrgSettings() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-0.5">
          <CardTitle>Organization profile</CardTitle>
          <CardDescription>Changes require backend API integration.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-app-xs font-medium text-ink-muted">Organization name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Organization" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-app-xs font-medium text-ink-muted">URL slug</label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-org" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-app-xs font-medium text-ink-muted">Plan</label>
            <div className="flex items-center justify-between h-9 px-3 rounded-app-md border border-line bg-surface-muted">
              <span className="text-app-sm text-ink capitalize">Team</span>
              <Button variant="outline" size="sm" onClick={() => toast.info('Billing portal', { description: 'Coming with the FastAPI backend.' })}>
                Manage billing
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-app-xs font-medium text-ink-muted">Status</label>
            <div className="flex items-center gap-2 h-9 px-3 rounded-app-md border border-line bg-surface-muted">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
              <span className="text-app-sm text-ink capitalize">Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button onClick={() => toast.success('Profile saved (demo)', { description: 'Backend API integration required.' })}>
            <Check className="h-3.5 w-3.5 mr-1.5" strokeWidth={2} />
            Save changes
          </Button>
          <Button variant="ghost">Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function TeamSettings() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-0.5">
          <CardTitle>Team members</CardTitle>
          <CardDescription>Manage team members via Clerk dashboard.</CardDescription>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => window.open('https://dashboard.clerk.com', '_blank')}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Open Clerk Dashboard
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-app-md border border-line p-3 bg-surface-muted">
          <div className="text-app-sm font-medium text-ink">Team management is handled by Clerk</div>
          <p className="text-app-xs text-ink-muted mt-1">
            Add, remove, and manage team members through the <a href="https://dashboard.clerk.com" target="_blank" className="text-accent underline">Clerk Dashboard</a>.
            Member roles are synced automatically via the Clerk webhook.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function RolesSettings() {
  const roles = [
    { name: 'Owner', description: 'Full control of organization, billing, and integrations.', permissions: ['All permissions', 'Billing', 'Delete organization'] },
    { name: 'Admin', description: 'Manage members, integrations, and policies. Cannot change billing.', permissions: ['Manage members', 'Connect integrations', 'Publish policies'] },
    { name: 'Member', description: 'Manage controls, evidence, and questionnaires.', permissions: ['Run checks', 'Upload evidence', 'Approve answers'] },
    { name: 'Viewer', description: 'Read-only access to all data.', permissions: ['View checks', 'View evidence', 'View reports'] },
  ]
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-0.5">
          <CardTitle>Roles & permissions</CardTitle>
          <CardDescription>Role-based access control. Custom roles available on enterprise plans.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0 grid grid-cols-1 md:grid-cols-2 gap-3">
        {roles.map((r) => (
          <div key={r.name} className="rounded-app-md border border-line p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Badge variant={r.name === 'Owner' ? 'accent' : 'default'} className="normal-case tracking-normal">{r.name}</Badge>
            </div>
            <p className="text-app-xs text-ink-muted">{r.description}</p>
            <ul className="flex flex-col gap-0.5">
              {r.permissions.map((p) => (
                <li key={p} className="text-app-xs text-ink-muted flex items-center gap-1.5">
                  <Check className="h-2.5 w-2.5 text-success" strokeWidth={2.5} />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function NotificationSettings() {
  const [settings, setSettings] = useState({
    check_failures: true,
    evidence_in_review: true,
    task_assignment: true,
    overdue_tasks: true,
    weekly_digest: false,
    monthly_report: true,
  })

  const channels: { id: string; label: string }[] = [
    { id: 'email', label: 'Email' },
    { id: 'slack', label: 'Slack (when connected)' },
    { id: 'inapp', label: 'In-app' },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-0.5">
          <CardTitle>Notification preferences</CardTitle>
          <CardDescription>Configure how you receive alerts. Requires backend integration.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col">
        <SettingRow title="Check failures" description="When a previously passing check begins to fail.">
          <Switch checked={settings.check_failures} onCheckedChange={(v) => setSettings((s) => ({ ...s, check_failures: v }))} />
        </SettingRow>
        <SettingRow title="Evidence in review" description="When uploaded evidence requires your approval.">
          <Switch checked={settings.evidence_in_review} onCheckedChange={(v) => setSettings((s) => ({ ...s, evidence_in_review: v }))} />
        </SettingRow>
        <SettingRow title="Task assignment" description="When a task is assigned to you.">
          <Switch checked={settings.task_assignment} onCheckedChange={(v) => setSettings((s) => ({ ...s, task_assignment: v }))} />
        </SettingRow>
        <SettingRow title="Overdue tasks" description="Daily summary of overdue tasks assigned to you.">
          <Switch checked={settings.overdue_tasks} onCheckedChange={(v) => setSettings((s) => ({ ...s, overdue_tasks: v }))} />
        </SettingRow>
        <SettingRow title="Weekly digest" description="A weekly readiness summary, sent Monday morning.">
          <Switch checked={settings.weekly_digest} onCheckedChange={(v) => setSettings((s) => ({ ...s, weekly_digest: v }))} />
        </SettingRow>
        <SettingRow title="Monthly report" description="A monthly readiness and activity report.">
          <Switch checked={settings.monthly_report} onCheckedChange={(v) => setSettings((s) => ({ ...s, monthly_report: v }))} />
        </SettingRow>

        <Separator className="my-3" />

        <div className="flex flex-col gap-2">
          <span className="text-app-2xs font-medium uppercase tracking-wider text-ink-faint">Delivery channels</span>
          <div className="flex flex-wrap gap-2">
            {channels.map((c) => (
              <label key={c.id} className="flex items-center gap-1.5 rounded-app-md border border-line bg-surface px-2.5 py-1.5 text-app-xs text-ink-muted cursor-pointer hover:bg-surface-muted">
                <input type="checkbox" defaultChecked={c.id === 'inapp' || c.id === 'email'} className="accent-accent" />
                {c.label}
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RetentionSettings() {
  const [days, setDays] = useState('90')
  const [exportNote, setExportNote] = useState('')

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-0.5">
          <CardTitle>Data retention</CardTitle>
          <CardDescription>Configure data retention policies. Requires backend integration.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col gap-4">
        <SettingRow title="Evidence retention" description="Number of days to retain collected evidence. Minimum: 90.">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="180">180 days</SelectItem>
              <SelectItem value="365">1 year</SelectItem>
              <SelectItem value="730">2 years</SelectItem>
              <SelectItem value="forever">Forever</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title="Audit log retention" description="Audit trail events are retained for the lifetime of the organization.">
          <Badge variant="default" className="normal-case tracking-normal">Forever</Badge>
        </SettingRow>
        <SettingRow title="Auto-purge stale evidence" description="Evidence older than 365 days with no link to a control is auto-archived.">
          <Switch defaultChecked />
        </SettingRow>

        <Separator className="my-2" />

        <div className="flex flex-col gap-1.5">
          <label className="text-app-xs font-medium text-ink-muted">Data export notice</label>
          <Textarea
            placeholder="Notice shown to your team when exporting data."
            rows={3}
            value={exportNote}
            onChange={(e) => setExportNote(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => toast.success('Retention settings saved (demo)')}>
            <Check className="h-3.5 w-3.5 mr-1.5" strokeWidth={2} />
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SecuritySettings() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-0.5">
          <CardTitle>Security settings</CardTitle>
          <CardDescription>Authentication and access policy for this workspace.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col">
        <SettingRow title="Require SSO" description="Members must sign in via SAML SSO. Available on enterprise plans.">
          <Switch defaultChecked={false} />
        </SettingRow>
        <SettingRow title="Require MFA" description="All members must have multi-factor authentication enabled.">
          <Switch defaultChecked />
        </SettingRow>
        <SettingRow title="Session duration" description="How long a session remains valid before re-authentication.">
          <Select defaultValue="7">
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 hour</SelectItem>
              <SelectItem value="8">8 hours</SelectItem>
              <SelectItem value="24">1 day</SelectItem>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title="IP allowlist" description="Restrict workspace access to a list of approved IP ranges.">
          <Switch defaultChecked={false} />
        </SettingRow>
        <SettingRow title="API key access" description="Allow API keys for programmatic access. Keys inherit the role of the issuing user.">
          <Switch defaultChecked />
        </SettingRow>

        <Separator className="my-3" />

        <div className="rounded-app-md border border-line p-3">
          <div className="text-app-sm font-medium text-ink">API keys</div>
          <p className="text-app-xs text-ink-muted mt-0.5">Generate keys for backend integrations.</p>
          <div className="mt-2 flex items-center justify-between rounded-app-sm bg-surface-muted p-2">
            <code className="text-app-xs text-ink-muted font-mono">prooflive_prod_••••••••••••••3a4f</code>
            <Button variant="ghost" size="sm" onClick={() => toast.info('Demo key only', { description: 'Real keys are issued by the FastAPI backend.' })}>Reveal</Button>
          </div>
          <Button variant="outline" size="sm" className="mt-2 gap-1.5">
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            New API key
          </Button>
        </div>

        <Separator className="my-3" />

        <div className="flex items-center justify-between gap-3 rounded-app-md border border-danger-border bg-danger-soft/40 p-3">
          <div>
            <div className="text-app-sm font-medium text-ink">Delete organization</div>
            <p className="text-app-xs text-ink-muted mt-0.5">Permanently delete this organization and all data. This action cannot be undone.</p>
          </div>
          <Button variant="danger" size="sm" className="gap-1.5" onClick={() => toast.error('Demo only', { description: 'Cannot delete in demo mode.' })}>
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}