import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '../components/layout/app-shell'
import { LandingPage } from '../pages/landing-page'
import { OverviewPage } from '../pages/overview/overview-page'
import { SecurityChecksPage } from '../pages/security-checks/security-checks-page'
import { EvidencePage } from '../pages/evidence/evidence-page'
import { QuestionnairesPage } from '../pages/questionnaires/questionnaires-page'
import { PoliciesPage } from '../pages/policies/policies-page'
import { TasksPage } from '../pages/tasks/tasks-page'
import { IntegrationsPage } from '../pages/integrations/integrations-page'
import { SettingsPage } from '../pages/settings/settings-page'
import { AuditTrailPage } from '../pages/settings/audit-trail-page'
import { SignInPage } from '../pages/auth/sign-in-page'
import { DemoPage } from '../pages/demo-page'
import { RulesCatalogPage } from '../pages/rules/rules-catalog-page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/rules',
    element: <RulesCatalogPage />,
  },
  {
    path: '/sign-in',
    element: <SignInPage />,
  },
  {
    path: '/demo',
    element: <DemoPage />,
  },
  {
    path: '/overview',
    element: (
      <AppShell>
        <OverviewPage />
      </AppShell>
    ),
  },
  {
    path: '/security-checks',
    element: (
      <AppShell>
        <SecurityChecksPage />
      </AppShell>
    ),
  },
  {
    path: '/evidence',
    element: (
      <AppShell>
        <EvidencePage />
      </AppShell>
    ),
  },
  {
    path: '/questionnaires',
    element: (
      <AppShell>
        <QuestionnairesPage />
      </AppShell>
    ),
  },
  {
    path: '/policies',
    element: (
      <AppShell>
        <PoliciesPage />
      </AppShell>
    ),
  },
  {
    path: '/tasks',
    element: (
      <AppShell>
        <TasksPage />
      </AppShell>
    ),
  },
  {
    path: '/integrations',
    element: (
      <AppShell>
        <IntegrationsPage />
      </AppShell>
    ),
  },
  {
    path: '/audit-trail',
    element: (
      <AppShell>
        <AuditTrailPage />
      </AppShell>
    ),
  },
  {
    path: '/settings',
    element: (
      <AppShell>
        <SettingsPage />
      </AppShell>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])