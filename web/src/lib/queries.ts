/**
 * TanStack Query hooks for Proofline API
 * Provides caching, invalidation, and optimistic updates.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, useApiClient } from './api-client';

// Query keys for consistent caching
export const queryKeys = {
  currentUser: () => ['currentUser'] as const,
  overview: (orgId: string) => ['overview', orgId] as const,
  controls: (orgId: string) => ['controls', orgId] as const,
  checkRuns: (orgId: string, status?: string) => ['checkRuns', orgId, status] as const,
  repositories: (orgId: string) => ['repositories', orgId] as const,
  evidence: (orgId: string, reviewStatus?: string) => ['evidence', orgId, reviewStatus] as const,
  questionnaires: (orgId: string) => ['questionnaires', orgId] as const,
  questions: (orgId: string, questionnaireId: string) => ['questions', orgId, questionnaireId] as const,
  policies: (orgId: string) => ['policies', orgId] as const,
  tasks: (orgId: string, status?: string) => ['tasks', orgId, status] as const,
  integrations: (orgId: string) => ['integrations', orgId] as const,
  auditEvents: (orgId: string) => ['auditEvents', orgId] as const,
};

/**
 * Authentication hook - handles Clerk token and org context
 */
export function useAuthApi() {
  const { ensureAuthenticated, switchOrganization, isAuthenticated, isLoading, currentOrgId } = useApiClient();
  
  const { data: orgId } = useQuery({
    queryKey: ['auth', 'orgId'],
    queryFn: ensureAuthenticated,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  return {
    orgId: orgId || currentOrgId || 'demo-org-1',
    isAuthenticated,
    isLoading,
    currentOrgId,
    switchOrganization,
    ensureAuthenticated,
  };
}

/**
 * Overview / Readiness
 */
export function useOverview(orgId?: string) {
  return useQuery({
    queryKey: queryKeys.overview(orgId!),
    queryFn: () => api.getOverview(orgId!),
    enabled: !!orgId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Security Controls & Checks
 */
export function useControls(orgId?: string) {
  return useQuery({
    queryKey: queryKeys.controls(orgId!),
    queryFn: () => api.getControls(orgId!),
    enabled: !!orgId,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCheckRuns(orgId?: string, status?: string) {
  return useQuery({
    queryKey: queryKeys.checkRuns(orgId!, status),
    queryFn: () => api.getCheckRuns(orgId!, status),
    enabled: !!orgId,
    staleTime: 30 * 1000,
  });
}

export function useRunAllChecks() {
  const queryClient = useQueryClient();
  const { orgId } = useAuthApi();
  
  return useMutation({
    mutationFn: () => api.runAllChecks(orgId!),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.checkRuns(orgId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.controls(orgId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview(orgId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(orgId!) });
    },
  });
}

export function useRepositories(orgId?: string) {
  return useQuery({
    queryKey: queryKeys.repositories(orgId!),
    queryFn: () => api.getRepositories(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Evidence Library
 */
export function useEvidence(orgId?: string, reviewStatus?: string) {
  return useQuery({
    queryKey: queryKeys.evidence(orgId!, reviewStatus),
    queryFn: () => api.getEvidence(orgId!, reviewStatus),
    enabled: !!orgId,
    staleTime: 60 * 1000,
  });
}

export function useUploadEvidence() {
  const queryClient = useQueryClient();
  const { orgId } = useAuthApi();
  
  return useMutation({
    mutationFn: ({ formData }: { formData: FormData }) => 
      api.uploadEvidence(orgId!, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.evidence(orgId!) });
    },
  });
}

export function useGetUploadUrl() {
  const { orgId } = useAuthApi();
  
  return useMutation({
    mutationFn: ({ title, contentType, contentHash, controlId }: { 
      title: string; 
      contentType: string; 
      contentHash: string; 
      controlId?: string; 
    }) => api.getUploadUrl(orgId!, title, contentType, contentHash, controlId),
  });
}

export function useCompleteUpload() {
  const queryClient = useQueryClient();
  const { orgId } = useAuthApi();
  
  return useMutation({
    mutationFn: (evidenceId: string) => api.completeUpload(orgId!, evidenceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.evidence(orgId!) });
    },
  });
}

export function useReviewEvidence() {
  const queryClient = useQueryClient();
  const { orgId } = useAuthApi();
  
  return useMutation({
    mutationFn: ({ 
      evidenceId, 
      status, 
      notes 
    }: { 
      evidenceId: string; 
      status: 'approved' | 'rejected'; 
      notes?: string; 
    }) => api.reviewEvidence(orgId!, evidenceId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.evidence(orgId!) });
    },
  });
}

export function useDownloadEvidence() {
  const { orgId } = useAuthApi();
  
  return useMutation({
    mutationFn: (evidenceId: string) => api.downloadEvidence(orgId!, evidenceId),
  });
}

export function useVerifyEvidenceHash() {
  const { orgId } = useAuthApi();
  
  return useMutation({
    mutationFn: (evidenceId: string) => api.verifyEvidenceHash(orgId!, evidenceId),
  });
}

/**
 * Questionnaires
 */
export function useQuestionnaires(orgId?: string) {
  return useQuery({
    queryKey: queryKeys.questionnaires(orgId!),
    queryFn: () => api.getQuestionnaires(orgId!),
    enabled: !!orgId,
    staleTime: 60 * 1000,
  });
}

export function useQuestions(orgId?: string, questionnaireId?: string) {
  return useQuery({
    queryKey: queryKeys.questions(orgId!, questionnaireId!),
    queryFn: () => api.getQuestions(orgId!, questionnaireId!),
    enabled: !!orgId && !!questionnaireId,
    staleTime: 60 * 1000,
  });
}

export function useDraftAnswerWithAI() {
  const { orgId } = useAuthApi();
  
  return useMutation({
    mutationFn: ({ questionnaireId, questionId }: { questionnaireId: string; questionId: string }) => 
      api.draftAnswerWithAI(orgId!, questionnaireId, questionId),
  });
}

export function useReviewQuestionAnswer() {
  const { orgId } = useAuthApi();
  
  return useMutation({
    mutationFn: ({ 
      questionnaireId, 
      questionId, 
      action, 
      answerText 
    }: { 
      questionnaireId: string; 
      questionId: string; 
      action: 'approve' | 'edit_draft' | 'reject'; 
      answerText?: string; 
    }) => api.reviewQuestionAnswer(orgId!, questionnaireId, questionId, action, answerText),
  });
}

/**
 * Policies
 */
export function usePolicies(orgId?: string) {
  return useQuery({
    queryKey: queryKeys.policies(orgId!),
    queryFn: () => api.getPolicies(orgId!),
    enabled: !!orgId,
    staleTime: 60 * 1000,
  });
}

export function useCreatePolicy() {
  const queryClient = useQueryClient();
  const { orgId } = useAuthApi();
  
  return useMutation({
    mutationFn: (policyData: { title: string; category: string; summary: string; body: string }) => 
      api.createPolicy(orgId!, policyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.policies(orgId!) });
    },
  });
}

/**
 * Tasks & Remediation
 */
export function useTasks(orgId?: string, status?: string) {
  return useQuery({
    queryKey: queryKeys.tasks(orgId!, status),
    queryFn: () => api.getTasks(orgId!, status),
    enabled: !!orgId,
    staleTime: 30 * 1000,
  });
}

export function useResolveTask() {
  const queryClient = useQueryClient();
  const { orgId } = useAuthApi();
  
  return useMutation({
    mutationFn: ({ taskId, resolutionNote }: { taskId: string; resolutionNote: string }) => 
      api.resolveTask(orgId!, taskId, resolutionNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(orgId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview(orgId!) });
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { orgId } = useAuthApi();
  
  return useMutation({
    mutationFn: (payload: { title: string; description: string; severity: string; control_id?: string; owner_user_id?: string; due_date?: string }) => 
      api.createTask(orgId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(orgId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview(orgId!) });
    },
  });
}

/**
 * Integrations
 */
export function useIntegrations(orgId?: string) {
  return useQuery({
    queryKey: queryKeys.integrations(orgId!),
    queryFn: () => api.getIntegrations(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useConnectGitHub() {
  const { orgId } = useAuthApi();
  
  return useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('No organization selected')
      const token = api.getToken()
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/auth/github/initiate?org_id=${orgId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
        },
      })
      if (!res.ok) throw new Error('Failed to initiate GitHub OAuth')
      return res.json()
    },
    onSuccess: (data) => {
      // Redirect to GitHub for OAuth
      if (data.url) {
        window.location.href = data.url
      }
    },
  });
}

export function useGitHubRepositories(orgId?: string) {
  return useQuery({
    queryKey: queryKeys.repositories(orgId!),
    queryFn: () => api.getGitHubRepositories(orgId!),
    enabled: !!orgId,
    staleTime: 60 * 1000,
  });
}

export function useUpdateRepositoryScope() {
  const queryClient = useQueryClient();
  const { orgId } = useAuthApi();

  return useMutation({
    mutationFn: ({ repoOwner, repoName, isInScope, exclusionReason }: { repoOwner: string; repoName: string; isInScope: boolean; exclusionReason?: string }) =>
      api.updateRepositoryScope(orgId!, repoOwner, repoName, isInScope, exclusionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.repositories(orgId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview(orgId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.checkRuns(orgId!) });
    },
  });
}

export function useDisconnectIntegration() {
  const queryClient = useQueryClient();
  const { orgId } = useAuthApi();
  
  return useMutation({
    mutationFn: (integrationId: string) => api.disconnectIntegration(orgId!, integrationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations(orgId!) });
    },
  });
}

/**
 * Audit Events
 */
export function useAuditEvents(orgId?: string) {
  return useQuery({
    queryKey: queryKeys.auditEvents(orgId!),
    queryFn: () => api.getAuditEvents(orgId!),
    enabled: !!orgId,
    staleTime: 30 * 1000,
  });
}