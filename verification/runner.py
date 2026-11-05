"""Isolated Verification Runner for ProofOps."""
from __future__ import annotations

import os
import subprocess
import time
from typing import Any, Dict, List, Optional
from verification.evidence import EvidenceBundle, EvidenceGateError


class IsolatedRunner:
    def __init__(self, service_dir: str, python_bin: str = "python3"):
        self.service_dir = service_dir
        self.python_bin = python_bin

    def _base_env(self, bug_active: Optional[bool] = None) -> Dict[str, str]:
        """Build subprocess environment with optional bug toggle."""
        env = os.environ.copy()
        if bug_active is not None:
            env["PROOFOPS_BUG_ACTIVE"] = "true" if bug_active else "false"
        return env

    def run_reproduction(self, repro_script_name: str = "repro_script.py", bug_active: bool = True) -> Dict[str, Any]:
        """Runs the reproduction script to capture defect reproduction."""
        repro_path = os.path.join(self.service_dir, repro_script_name)
        if not os.path.exists(repro_path):
            raise EvidenceGateError(f"Reproduction script not found: {repro_path}")

        start_time = time.time()
        proc = subprocess.run(
            [self.python_bin, repro_path],
            cwd=self.service_dir,
            capture_output=True,
            text=True,
            env=self._base_env(bug_active),
        )
        duration = time.time() - start_time
        output = (proc.stdout + "\n" + proc.stderr).strip()

        return {
            "exit_code": proc.returncode,
            "output": output,
            "duration_s": round(duration, 3),
            "reproduced": proc.returncode != 0,
        }

    def run_regression_suite(self, test_dir: str = "tests/", bug_active: bool = False) -> Dict[str, Any]:
        """Runs the pytest regression suite against the patched service."""
        start_time = time.time()
        proc = subprocess.run(
            [self.python_bin, "-m", "pytest", test_dir],
            cwd=self.service_dir,
            capture_output=True,
            text=True,
            env=self._base_env(bug_active),
        )
        duration = time.time() - start_time
        output = (proc.stdout + "\n" + proc.stderr).strip()

        return {
            "exit_code": proc.returncode,
            "output": output,
            "duration_s": round(duration, 3),
            "passed": proc.returncode == 0,
        }

    def audit_diff_scope(self, patch_diff: str, allowed_paths: Optional[List[str]] = None) -> bool:
        """Audits that the patch diff does not touch unauthorized files or configs."""
        if not patch_diff or not patch_diff.strip():
            raise EvidenceGateError("Patch diff is empty")

        forbidden_patterns = [".env", "credentials", "id_rsa", "docker-compose", "k8s", "deploy.yaml"]
        for line in patch_diff.splitlines():
            if line.startswith("+++") or line.startswith("---"):
                for forbidden in forbidden_patterns:
                    if forbidden in line:
                        raise EvidenceGateError(f"Diff scope violation: unauthorized file modification: {line}")
        return True

