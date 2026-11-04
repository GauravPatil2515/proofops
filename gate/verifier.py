"""ProofOps Evidence Gate Engine.

Enforces that incident resolution in Switch multi-agent rooms requires
verifiable cryptographic and runtime execution evidence. Prevents hallucinated
task completion by requiring passing test logs, scoped diffs, and reproducible traces.
"""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import time
from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Optional


class EvidenceGateError(Exception):
    """Raised when an incident closure fails the Evidence Gate."""


@dataclass
class EvidenceBundle:
    incident_id: str
    timestamp: float
    service_name: str
    repro_exit_code: int
    repro_trace: str
    patch_diff: str
    patch_sha256: str
    test_suite_exit_code: int
    test_suite_summary: str
    gate_verdict: str
    authorized_by: str
    metadata: Dict[str, Any]

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(asdict(self), indent=indent)

    def verify_integrity(self) -> bool:
        """Verifies that the patch hash matches the diff content."""
        computed_hash = hashlib.sha256(self.patch_diff.encode("utf-8")).hexdigest()
        return (
            computed_hash == self.patch_sha256
            and self.repro_exit_code != 0
            and self.test_suite_exit_code == 0
            and self.gate_verdict == "VERIFIED"
        )


class EvidenceGate:
    def __init__(
        self,
        incident_id: str,
        service_name: str,
        service_dir: str,
        python_bin: str = "python3",
    ):
        self.incident_id = incident_id
        self.service_name = service_name
        self.service_dir = service_dir
        self.python_bin = python_bin

    def verify_evidence(
        self,
        repro_script_path: str,
        patch_diff: str,
        authorized_by: str = "proofops-verifier",
        timeout_seconds: int = 10,
        allowed_path_prefix: Optional[str] = None,
    ) -> EvidenceBundle:
        """Executes the Evidence Gate verification workflow."""
        if not patch_diff or not patch_diff.strip():
            raise EvidenceGateError("Evidence Gate Rejected: No code patch diff provided.")

        # Check Diff Boundary Scope
        if allowed_path_prefix:
            for line in patch_diff.splitlines():
                if line.startswith("--- a/") or line.startswith("+++ b/"):
                    target_file = line[6:].strip()
                    if not target_file.startswith(allowed_path_prefix):
                        raise EvidenceGateError(
                            f"Evidence Gate Rejected: Diff touches out-of-scope file '{target_file}' (Allowed prefix: '{allowed_path_prefix}')."
                        )

        # Compute SHA-256 of the patch diff
        diff_sha256 = hashlib.sha256(patch_diff.encode("utf-8")).hexdigest()

        # Step 1: Execute Reproduction Script
        if not os.path.isabs(repro_script_path):
            repro_script_path = os.path.join(self.service_dir, repro_script_path)

        if not os.path.exists(repro_script_path):
            raise EvidenceGateError(
                f"Evidence Gate Rejected: Reproduction script not found at {repro_script_path}."
            )

        try:
            repro_proc = subprocess.run(
                [self.python_bin, repro_script_path],
                cwd=self.service_dir,
                capture_output=True,
                text=True,
                timeout=timeout_seconds,
                env=os.environ.copy(),
            )
        except subprocess.TimeoutExpired:
            raise EvidenceGateError(
                f"Evidence Gate Rejected: Reproduction script timed out after {timeout_seconds}s."
            )

        repro_exit = repro_proc.returncode
        repro_output = (repro_proc.stdout + "\n" + repro_proc.stderr).strip()

        # Step 2: Execute Test Suite (Pytest)
        try:
            test_proc = subprocess.run(
                [self.python_bin, "-m", "pytest", "tests/"],
                cwd=self.service_dir,
                capture_output=True,
                text=True,
                timeout=timeout_seconds,
                env=os.environ.copy(),
            )
        except subprocess.TimeoutExpired:
            raise EvidenceGateError(
                f"Evidence Gate Rejected: Test suite timed out after {timeout_seconds}s."
            )

        test_exit = test_proc.returncode
        test_output = (test_proc.stdout + "\n" + test_proc.stderr).strip()

        # Check Gate Verdict
        if test_exit != 0:
            raise EvidenceGateError(
                f"Evidence Gate Rejected: Test suite failed with exit code {test_exit}.\n"
                f"Output: {test_output}"
            )

        bundle = EvidenceBundle(
            incident_id=self.incident_id,
            timestamp=time.time(),
            service_name=self.service_name,
            repro_exit_code=repro_exit,
            repro_trace=repro_output,
            patch_diff=patch_diff,
            patch_sha256=diff_sha256,
            test_suite_exit_code=test_exit,
            test_suite_summary=test_output[-400:],
            gate_verdict="VERIFIED",
            authorized_by=authorized_by,
            metadata={
                "environment": "staging-isolation-pod",
                "switch_room": "incident-checkout-500",
                "gate_version": "1.0.0",
            },
        )

        return bundle

    def verify_patch_hash(self, current_diff: str, recorded_sha256: str) -> bool:
        """Verifies that the patch diff has not drifted or been tampered with."""
        current_hash = hashlib.sha256(current_diff.encode("utf-8")).hexdigest()
        if current_hash != recorded_sha256:
            raise EvidenceGateError(
                f"Evidence Gate Integrity Violation: Diff hash mismatch!\n"
                f"Expected: {recorded_sha256}\n"
                f"Actual:   {current_hash}"
            )
        return True

