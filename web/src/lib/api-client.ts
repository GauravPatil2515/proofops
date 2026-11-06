/**
 * Proofline API Client with Clerk Authentication
 * Uses Clerk's useAuth hook for token management and TanStack Query for caching.
 */
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface OverviewData {
  readiness_score: number;
  checks_total: number;
  checks_passing: number;
  checks_failing: number;
  checks_needs_review: number;
  checks_not_checked: number;
  open_tasks_count: number;
  evidence_items_count: number;
  evidence_approved_count: number;
  questionnaires_count: number;
  recent_events: any[];
}

export interface Membership {
  id: string;
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  role: string;
  created_at: string;
}

export interface CurrentUserContext {
  user: {
    id: string;
    email: string;
    display_name: string;
    is_active: boolean;
    created_at: string;
  };
  memberships: Membership[];
}

class ApiClient {
  private token: string | null = null;
  private currentOrgId: string | null = null;
  
  setToken(token: string | null) {
    this.token = token;
  }
  
  setOrgId(orgId: string) {
    this.currentOrgId = orgId;
  }
  
  getOrgId(): string | null {
    return this.currentOrgId;
  }
  
  getToken(): string | null {
    return this.token;
  }
  
  clearAuth() {
    this.token = null;
    this.currentOrgId = null;
  }
  
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.token) {
      this.token = 'demo_proofops_token';
    }
    
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };
    
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    
    headers['Authorization'] = `Bearer ${this.token}`;
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (response.status === 401) {
      this.clearAuth();
      throw new Error('Authentication expired');
    }
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const msg = typeof errorBody.detail === 'string'
        ? errorBody.detail
        : errorBody.detail ? JSON.stringify(errorBody.detail) : `Request failed with status ${response.status}`;
      throw new Error(msg);
    }
    
    return response.json();
  }
  
  // Health
  async checkHealth(): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE.replace('/api/v1', '')}/health/ready`);
    return res.json();
  }
  
  // Current User
  async getCurrentUser(): Promise<CurrentUserContext> {
    return this.request<CurrentUserContext>('/auth/me');
  }
  
  // Overview / Readiness
  async getOverview(orgId: string): Promise<OverviewData> {
    return this.request<OverviewData>(`/organizations/${orgId}/overview`);
  }
  
  // Security Controls & Checks
  async getControls(orgId: string) {
    return this.request<any[]>(`/organizations/${orgId}/controls`);
  }
  
  async getCheckRuns(orgId: string, status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<any[]>(`/organizations/${orgId}/checks${query}`);
  }
  
  async runAllChecks(orgId: string) {
    return this.request<any[]>(`/organizations/${orgId}/checks/run`, {
      method: 'POST',
    });
  }
  
  async getRepositories(orgId: string) {
    return this.request<any[]>(`/organizations/${orgId}/integrations/github/repositories`);
  }
  
  // Evidence Library
  async getEvidence(orgId: string, reviewStatus?: string) {
    const query = reviewStatus ? `?review_status=${reviewStatus}` : '';
    return this.request<any[]>(`/organizations/${orgId}/evidence${query}`);
  }
  
  async uploadEvidence(orgId: string, formData: FormData) {
    return this.request<any>(`/organizations/${orgId}/evidence/upload`, {
      method: 'POST',
      body: formData,
    });
  }
  
  async getUploadUrl(orgId: string, title: string, contentType: string, contentHash: string, controlId?: string) {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content_type', contentType);
    formData.append('content_hash', contentHash);
    if (controlId) formData.append('control_id', controlId);
    
    return this.request<{
      upload_url: string;
      evidence_id: string;
      object_key: string;
      expires_in: number;
    }>(`/organizations/${orgId}/evidence/upload-url`, {
      method: 'POST',
      body: formData,
    });
  }
  
  async completeUpload(orgId: string, evidenceId: string) {
    return this.request<any>(`/organizations/${orgId}/evidence/${evidenceId}/complete-upload`, {
      method: 'POST',
    });
  }
  
  async reviewEvidence(orgId: string, evidenceId: string, status: 'approved' | 'rejected', notes?: string) {
    return this.request<any>(`/organizations/${orgId}/evidence/${evidenceId}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, notes }),
    });
  }
  
  async downloadEvidence(orgId: string, evidenceId: string) {
    return this.request<{ download_url: string; expires_in: number }>(
      `/organizations/${orgId}/evidence/${evidenceId}/download`
    );
  }
  
  async verifyEvidenceHash(orgId: string, evidenceId: string) {
    return this.request<{ verified: boolean; expected_hash: string; checked_at: string }>(
      `/organizations/${orgId}/evidence/${evidenceId}/verify`
    );
  }
  
  // Questionnaires
  async getQuestionnaires(orgId: string) {
    return this.request<any[]>(`/organizations/${orgId}/questionnaires`);
  }
  
  async getQuestions(orgId: string, questionnaireId: string) {
    return this.request<any[]>(`/organizations/${orgId}/questionnaires/${questionnaireId}/questions`);
  }
  
  async draftAnswerWithAI(orgId: string, questionnaireId: string, questionId: string) {
    return this.request<any>(
      `/organizations/${orgId}/questionnaires/${questionnaireId}/questions/${questionId}/draft-answer`,
      { method: 'POST' }
    );
  }
  
  async reviewQuestionAnswer(
    orgId: string,
    questionnaireId: string,
    questionId: string,
    action: 'approve' | 'edit_draft' | 'reject',
    answerText?: string
  ) {
    return this.request<any>(
      `/organizations/${orgId}/questionnaires/${questionnaireId}/questions/${questionId}/review`,
      {
        method: 'POST',
        body: JSON.stringify({ action, answer_text: answerText }),
      }
    );
  }
  
  // Policies
  async getPolicies(orgId: string) {
    return this.request<any[]>(`/organizations/${orgId}/policies`);
  }
  
  async createPolicy(orgId: string, policyData: { title: string; category: string; summary: string; body: string }) {
    return this.request<any>(`/organizations/${orgId}/policies`, {
      method: 'POST',
      body: JSON.stringify(policyData),
    });
  }
  
  // Tasks & Remediation
  async getTasks(orgId: string, status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<any[]>(`/organizations/${orgId}/tasks${query}`);
  }
  
  async createTask(orgId: string, payload: { title: string; description: string; severity: string; control_id?: string; owner_user_id?: string; due_date?: string }) {
    return this.request<any>(`/organizations/${orgId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  
  async resolveTask(orgId: string, taskId: string, resolutionNote: string) {
    return this.request<any>(`/organizations/${orgId}/tasks/${taskId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution_note: resolutionNote }),
    });
  }
  
  // Integrations
  async getIntegrations(orgId: string) {
    return this.request<any[]>(`/organizations/${orgId}/integrations`);
  }

  async getGitHubRepositories(orgId: string) {
    return this.request<{ repositories: any[]; count: number }>(`/organizations/${orgId}/integrations/github/repositories`);
  }

  async updateRepositoryScope(orgId: string, repoOwner: string, repoName: string, isInScope: boolean, exclusionReason?: string) {
    return this.request<any>(`/organizations/${orgId}/integrations/github/repositories/${repoOwner}/${repoName}/scope`, {
      method: 'PATCH',
      body: JSON.stringify({ is_in_scope: isInScope, exclusion_reason: exclusionReason }),
    });
  }
  
  async connectGitHub(orgId: string) {
    // Initiate OAuth flow - returns URL to redirect user to GitHub for installation
    return this.request<{ url: string; state: string }>(`/auth/github/initiate?org_id=${orgId}`, {
      method: 'GET',
    });
  }
  
  async disconnectIntegration(orgId: string, integrationId: string) {
    return this.request<any>(`/organizations/${orgId}/integrations/${integrationId}`, {
      method: 'DELETE',
    });
  }
  
  // Audit Events
  async getAuditEvents(orgId: string) {
    return this.request<any[]>(`/organizations/${orgId}/audit-events`);
  }
  
  // Reports
  async generateReadinessReport(orgId: string, framework?: string, scope?: string) {
    const params = new URLSearchParams();
    if (framework) params.append('framework', framework);
    if (scope) params.append('scope', scope);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ report_id: string; status: string }>(`/organizations/${orgId}/reports/readiness${query}`, {
      method: 'POST',
    });
  }
  
  async generateEvidencePackage(orgId: string, framework?: string, scope?: string) {
    const params = new URLSearchParams();
    if (framework) params.append('framework', framework);
    if (scope) params.append('scope', scope);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ report_id: string; status: string }>(`/organizations/${orgId}/reports/evidence-package${query}`, {
      method: 'POST',
    });
  }
  
  async generateQuestionnaireExport(orgId: string, questionnaireId: string, framework?: string) {
    const params = new URLSearchParams();
    if (framework) params.append('framework', framework);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ report_id: string; status: string }>(`/organizations/${orgId}/reports/questionnaire-export/${questionnaireId}${query}`, {
      method: 'POST',
    });
  }
  
  async generateMonitoringHistory(orgId: string, framework?: string, scope?: string, lookbackDays?: number) {
    const params = new URLSearchParams();
    if (framework) params.append('framework', framework);
    if (scope) params.append('scope', scope);
    if (lookbackDays) params.append('lookback_days', lookbackDays.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ report_id: string; status: string }>(`/organizations/${orgId}/reports/monitoring-history${query}`, {
      method: 'POST',
    });
  }
  
  async listReports(orgId: string, reportType?: string) {
    const query = reportType ? `?report_type=${reportType}` : '';
    return this.request<any[]>(`/organizations/${orgId}/reports${query}`);
  }
  
  async getReport(orgId: string, reportId: string) {
    return this.request<any>(`/organizations/${orgId}/reports/${reportId}`);
  }
  
  async downloadReport(orgId: string, reportId: string, fileType: 'pdf' | 'json' | 'zip' | 'csv') {
    return this.request<{ download_url: string; expires_in: number }>(`/organizations/${orgId}/reports/${reportId}/download/${fileType}`);
  }
  
  async approveReport(orgId: string, reportId: string) {
    return this.request<any>(`/organizations/${orgId}/reports/${reportId}/approve`, {
      method: 'POST',
    });
  }

  // Auth sync
  async syncUser(clerkToken: string) {
    if (!clerkToken) {
      throw new Error('syncUser called with empty clerkToken');
    }
    console.log('[api-client] Calling syncUser with token:', clerkToken.substring(0, 20) + '...');
    try {
      const result = await this.request<{ status: string; user_id: string }>('/auth/sync-user', {
        method: 'POST',
        body: JSON.stringify({ clerk_token: clerkToken }),
      });
      console.log('[api-client] syncUser result:', result);
      return result;
    } catch (err) {
      console.error('[api-client] syncUser failed:', err);
      throw err;
    }
  }
}

export const api = new ApiClient();

/**
 * Hook for using the API client with Clerk authentication.
 * Automatically handles token retrieval and organization context.
 */
export function useApiClient() {
  const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = clerkPublishableKey && !clerkPublishableKey.startsWith('pk_test_placeholder');

  // Always call useAuth() - it handles missing provider internally
  const clerkAuth = useAuth();
  const { getToken, isSignedIn, isLoaded } = clerkAuth;
  
  const [isLoading, setIsLoading] = useState(!isClerkConfigured ? false : true);
  const [isAuthenticated, setIsAuthenticated] = useState(!isClerkConfigured ? true : false);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(!isClerkConfigured ? 'demo-org-1' : null);
  const tokenPromiseRef = useRef<Promise<string> | null>(null);

  useEffect(() => {
    if (!isClerkConfigured) {
      // Demo / development fallback
      setIsLoading(false);
      setIsAuthenticated(true);
      setCurrentOrgId('demo-org-1');
      return;
    }

    if (isLoaded) {
      setIsLoading(false);
      if (isSignedIn) {
        setIsAuthenticated(true);
        if (!api.getToken()) {
          ensureAuthenticated();
        }
      } else {
        setIsAuthenticated(false);
      }
    }
  }, [isLoaded, isSignedIn, isClerkConfigured]);

  async function ensureAuthenticated(): Promise<string> {
    if (!isClerkConfigured) {
      const demoOrg = 'demo-org-1';
      api.setOrgId(demoOrg);
      setCurrentOrgId(demoOrg);
      setIsAuthenticated(true);
      return demoOrg;
    }

    if (api.getToken() && api.getOrgId()) {
      const orgId = api.getOrgId()!;
      setCurrentOrgId(orgId);
      setIsAuthenticated(true);
      return orgId;
    }

    if (!isSignedIn) {
      throw new Error('User not signed in');
    }
    
    if (!tokenPromiseRef.current) {
      const promise = (async () => {
        try {
          // Get Clerk token with Proofline template
          const clerkToken = await getToken({ template: 'proofline' });
          console.log('[api-client] Clerk token received:', clerkToken ? 'present' : 'empty/null');
          if (!clerkToken) {
            // Fallback to demo mode if Clerk template not configured
            console.warn('[api-client] Clerk token empty, falling back to demo mode');
            const demoOrg = 'demo-org-1';
            api.setOrgId(demoOrg);
            setCurrentOrgId(demoOrg);
            setIsAuthenticated(true);
            return demoOrg;
          }
          
          api.setToken(clerkToken);
          
          // Sync user and get memberships
          console.log('[api-client] Syncing user with backend...');
          await api.syncUser(clerkToken);
          
          // Get user context to find organizations
          const userContext = await api.getCurrentUser();
          console.log('[api-client] User context received:', userContext);
          
          if (userContext.memberships.length > 0) {
            // Use first membership as default, but allow switching
            const defaultOrg = userContext.memberships[0].organization_id;
            api.setOrgId(defaultOrg);
            setCurrentOrgId(defaultOrg);
            setIsAuthenticated(true);
            return defaultOrg;
          }
          
          throw new Error('No organization memberships found');
        } catch (err) {
          console.error('[api-client] Authentication failed:', err);
          api.clearAuth();
          setIsAuthenticated(false);
          setCurrentOrgId(null);
          throw err;
        }
      })();
      
      tokenPromiseRef.current = promise;
    }
    
    return tokenPromiseRef.current;
  }
  
  async function switchOrganization(orgId: string) {
    // Verify user has access to this organization
    const userContext = await api.getCurrentUser();
    const membership = userContext.memberships.find(m => m.organization_id === orgId);
    if (!membership) {
      throw new Error('Access denied to organization');
    }
    api.setOrgId(orgId);
    setCurrentOrgId(orgId);
  }
  
  return {
    api,
    ensureAuthenticated,
    switchOrganization,
    isLoading,
    isAuthenticated,
    currentOrgId,
  };
}