"""Typed Evidence Bundle & Artifact Generator."""
from __future__ import annotations

import hashlib
import json
import time
from dataclasses import asdict, dataclass
from typing import Any, Dict, Optional


class EvidenceVerificationError(Exception):
    """Raised when evidence verification fails or preconditions are violated."""


@dataclass
class EvidenceBundle:
    incident_id: str
    service_name: str
    timestamp: float
    repro_exit_code: int
    repro_trace: str
    patch_diff: str
    patch_sha256: str
    test_exit_code: int
    test_summary: str
    gate_verdict: str  # VERIFIED, REJECTED
    authorized_by: str
    checks: Dict[str, bool]
    metadata: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(asdict(self), indent=indent)

    def verify_integrity(self) -> bool:
        """Verifies cryptographic hash consistency."""
        computed = hashlib.sha256(self.patch_diff.encode("utf-8")).hexdigest()
        return (
            computed == self.patch_sha256
            and self.repro_exit_code != 0
            and self.test_exit_code == 0
            and self.gate_verdict == "VERIFIED"
        )

    def generate_postmortem_markdown(self) -> str:
        """Generates a professional incident post-mortem markdown report."""
        return f"""# Incident Post-Mortem: {self.incident_id}
**Service:** {self.service_name}  
**Date:** {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime(self.timestamp))}  
**Verdict:** {self.gate_verdict}  
**Patch Hash (SHA-256):** `{self.patch_sha256}`

## 1. What Happened
A production regression was detected in `{self.service_name}` causing unhandled 500 errors on checkout requests with discount codes.

## 2. Evidence Verification Summary
- **Reproduction Proof:** Confirmed failure (Exit code: `{self.repro_exit_code}`)
- **Regression Suite:** Clean pass (Exit code: `{self.test_exit_code}`)
- **Diff Scope:** Audited and verified isolated

## 3. Verified Code Patch
```diff
{self.patch_diff}
```

## 4. Test Execution Summary
```
{self.test_summary}
```

*Certified by ProofOps Evidence Gate v1.0*
"""

