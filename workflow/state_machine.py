"""Deterministic Incident State Machine."""
from __future__ import annotations

import time
from enum import Enum
from typing import Any, Dict, List, Optional


class IncidentState(str, Enum):
    RECEIVED = "received"
    TRIAGE = "triage"
    INVESTIGATING = "investigating"
    REPRODUCING = "reproducing"
    FIXING = "fixing"
    VERIFYING = "verifying"
    BLOCKED = "blocked"
    AWAITING_APPROVAL = "awaiting_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    PR_CREATED = "pr_created"
    RESOLVED = "resolved"


class StateMachineError(Exception):
    """Raised when an invalid state transition is attempted."""


# Valid transition map
ALLOWED_TRANSITIONS = {
    IncidentState.RECEIVED: [IncidentState.TRIAGE, IncidentState.INVESTIGATING],
    IncidentState.TRIAGE: [IncidentState.INVESTIGATING, IncidentState.REPRODUCING],
    IncidentState.INVESTIGATING: [IncidentState.REPRODUCING, IncidentState.BLOCKED],
    IncidentState.REPRODUCING: [IncidentState.FIXING, IncidentState.BLOCKED],
    IncidentState.FIXING: [IncidentState.VERIFYING, IncidentState.BLOCKED],
    IncidentState.VERIFYING: [IncidentState.AWAITING_APPROVAL, IncidentState.BLOCKED],
    IncidentState.BLOCKED: [IncidentState.INVESTIGATING, IncidentState.FIXING, IncidentState.VERIFYING],
    IncidentState.AWAITING_APPROVAL: [IncidentState.APPROVED, IncidentState.REJECTED, IncidentState.FIXING],
    IncidentState.REJECTED: [IncidentState.FIXING, IncidentState.BLOCKED],
    IncidentState.APPROVED: [IncidentState.PR_CREATED, IncidentState.RESOLVED],
    IncidentState.PR_CREATED: [IncidentState.RESOLVED],
    IncidentState.RESOLVED: [],
}


class IncidentStateMachine:
    def __init__(self, current_state: IncidentState = IncidentState.RECEIVED):
        self.current_state = current_state
        self.approved_hash: Optional[str] = None

    def can_transition(self, target_state: IncidentState) -> bool:
        return target_state in ALLOWED_TRANSITIONS.get(self.current_state, [])

    def transition(
        self,
        target_state: IncidentState,
        evidence_bundle: Optional[Dict[str, Any]] = None,
        human_approval: Optional[Dict[str, Any]] = None,
        reason: Optional[str] = None,
    ) -> IncidentState:
        """Executes a validated state transition."""
        if not self.can_transition(target_state):
            raise StateMachineError(
                f"Invalid state transition: Cannot transition from '{self.current_state.value}' to '{target_state.value}'."
            )

        # Precondition for AWAITING_APPROVAL
        if target_state == IncidentState.AWAITING_APPROVAL:
            if not evidence_bundle or evidence_bundle.get("gate_verdict") != "VERIFIED":
                raise StateMachineError("Precondition failed: Evidence verification must be PASSED before awaiting approval.")

        # Precondition for APPROVED
        if target_state == IncidentState.APPROVED:
            if not human_approval or human_approval.get("decision") != "approved":
                raise StateMachineError("Precondition failed: Explicit human approval required.")
            self.approved_hash = human_approval.get("patch_sha256")

        # Precondition for RESOLVED
        if target_state == IncidentState.RESOLVED:
            if self.current_state not in (IncidentState.APPROVED, IncidentState.PR_CREATED):
                raise StateMachineError("Precondition failed: Incident cannot be resolved without prior approval.")

        self.current_state = target_state
        return self.current_state

    def on_patch_modified(self, new_patch_hash: str) -> None:
        """Invalidates approval if patch content changes."""
        if self.approved_hash and self.approved_hash != new_patch_hash:
            self.approved_hash = None
            if self.current_state == IncidentState.APPROVED:
                self.current_state = IncidentState.AWAITING_APPROVAL
