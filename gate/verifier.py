"""ProofOps Evidence Gate Engine.

Enforces that incident resolution in Switch multi-agent rooms requires
verifiable cryptographic and runtime execution evidence. Prevents hallucinated
task completion by requiring passing test logs, scoped diffs, reproducible traces,
exact signature matches, and anti-masking policy gates.
"""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import time
from typing import Any, Dict, List, Optional

from verification.evidence import EvidenceBundle, EvidenceGateError


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

    def _base_env(self, bug_active: Optional[bool] = None) -> Dict[str, str]:
        """Build subprocess environment with optional bug toggle."""
        env = os.environ.copy()
        if bug_active is not None:
            env["PROOFOPS_BUG_ACTIVE"] = "true" if bug_active else "false"
        return env

    def verify_evidence(
        self,
        repro_script_path: str,
        patch_diff: str,
        authorized_by: str = "proofops-verifier",
        timeout_seconds: int = 10,
        allowed_path_prefix: Optional[str] = None,
        expected_exception: Optional[str] = None,
        expected_frame: Optional[str] = None,
        bug_active_repro: bool = True,
        bug_active_test: bool = False,
    ) -> EvidenceBundle:
        """Executes the Evidence Gate verification workflow."""
        if not patch_diff or not patch_diff.strip():
            raise EvidenceGateError("Evidence Gate Rejected: No code patch diff provided.")

        # ── POLICY CHECK 1: File Boundary & Disallowed Paths ─────────────────
        touched_files: List[str] = []
        for line in patch_diff.splitlines():
            if line.startswith("--- a/") or line.startswith("+++ b/"):
                target_file = line[6:].strip()
                if target_file not in touched_files:
                    touched_files.append(target_file)

                # Hard prohibition: Fixer cannot touch test suites or reproduction scripts
                if "tests/" in target_file or "repro_script" in target_file or ".env" in target_file:
                    raise EvidenceGateError(
                        f"Policy Gate Violation: Patch diff cannot modify test suite, reproduction harness, or secrets: '{target_file}'."
                    )

                if allowed_path_prefix and not target_file.startswith(allowed_path_prefix):
                    raise EvidenceGateError(
                        f"Policy Gate Violation: Diff touches out-of-scope file '{target_file}' (Allowed prefix: '{allowed_path_prefix}')."
                    )

        # ── POLICY CHECK 2: Anti-Masking Audit (No Bare Excepts / Return 200) ─
        added_lines = [
            l[1:].strip()
            for l in patch_diff.splitlines()
            if l.startswith("+") and not l.startswith("+++")
        ]
        for line in added_lines:
            if line in ("except:", "except Exception:", "except BaseException:"):
                raise EvidenceGateError(
                    f"Policy Gate Violation: Detected symptom-masking bare except pattern in patch diff: '{line}'."
                )
            if "except" in line and ("pass" in line or "return 200" in line):
                raise EvidenceGateError(
                    f"Policy Gate Violation: Detected symptom-masking exception suppression in patch diff: '{line}'."
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
                env=self._base_env(bug_active_repro),
            )
        except subprocess.TimeoutExpired:
            raise EvidenceGateError(
                f"Evidence Gate Rejected: Reproduction script timed out after {timeout_seconds}s."
            )

        repro_exit = repro_proc.returncode
        repro_output = (repro_proc.stdout + "\n" + repro_proc.stderr).strip()

        # ── VERIFY REPRODUCTION SIGNATURE MATCH ──────────────────────────────
        if expected_exception:
            if expected_exception not in repro_output:
                raise EvidenceGateError(
                    f"Signature Mismatch: Repro failed with wrong exception.\n"
                    f"Expected: '{expected_exception}'\n"
                    f"Captured Trace:\n{repro_output[:400]}"
                )

        if expected_frame:
            if expected_frame not in repro_output:
                raise EvidenceGateError(
                    f"Signature Mismatch: Repro failed at wrong code frame.\n"
                    f"Expected Frame: '{expected_frame}'\n"
                    f"Captured Trace:\n{repro_output[:400]}"
                )

        # Step 2: Execute Test Suite (Pytest)
        try:
            test_proc = subprocess.run(
                [self.python_bin, "-m", "pytest", "tests/"],
                cwd=self.service_dir,
                capture_output=True,
                text=True,
                timeout=timeout_seconds,
                env=self._base_env(bug_active_test),
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
            service_name=self.service_name,
            timestamp=time.time(),
            repro_exit_code=repro_exit,
            repro_trace=repro_output,
            patch_diff=patch_diff,
            patch_sha256=diff_sha256,
            test_exit_code=test_exit,
            test_summary=test_output[-400:],
            gate_verdict="VERIFIED",
            authorized_by=authorized_by,
            metadata={
                "environment": "staging-isolation-pod",
                "switch_room": f"incident-{self.incident_id.lower()}",
                "gate_version": "2.0.0",
                "touched_files": touched_files,
                "signature_verified": bool(expected_exception or expected_frame),
            },
            checks={
                "repro_confirmed": repro_exit != 0,
                "diff_scoped": True,
                "regression_tests_passed": test_exit == 0,
                "patch_sha256_sealed": True,
                "dsse_signed": False,  # DSSE is added later by workflow engine
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
